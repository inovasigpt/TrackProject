import { Hono } from 'hono';
import { db } from '../db/index.js';
import { todos } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth.js';
import { auditService } from '../services/auditService.js';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('user');
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const sort = c.req.query('sort') || 'createdAt';

    try {
        const conditions = [eq(todos.userId, user.userId)];

        if (status) {
            conditions.push(eq(todos.status, status));
        }
        if (priority) {
            conditions.push(eq(todos.priority, priority));
        }

        const orderBy = sort === 'dueDate'
            ? desc(todos.dueDate)
            : sort === 'priority'
                ? desc(todos.priority)
                : desc(todos.createdAt);

        const data = await db.select()
            .from(todos)
            .where(and(...conditions))
            .orderBy(orderBy);

        return c.json({ success: true, data });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

const createSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    dueDate: z.string().optional().nullable(),
});

app.post('/', zValidator('json', createSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    try {
        const [newItem] = await db.insert(todos).values({
            ...body,
            userId: user.userId,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
        } as any).returning();

        await auditService.log(user.userId, 'CREATE', 'TODO' as any, newItem.id, `Created todo: ${newItem.title}`);

        return c.json({ success: true, data: newItem }, 201);
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

const updateSchema = createSchema.partial();

app.patch('/:id', zValidator('json', updateSchema), async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = c.req.valid('json');

    try {
        const existing = await db.select()
            .from(todos)
            .where(and(eq(todos.id, id), eq(todos.userId, user.userId)))
            .limit(1);

        if (existing.length === 0) {
            return c.json({ success: false, error: 'Todo not found' }, 404);
        }

        const [updatedItem] = await db.update(todos)
            .set({
                ...body,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                updatedAt: new Date(),
            } as any)
            .where(eq(todos.id, id))
            .returning();

        await auditService.log(user.userId, 'UPDATE', 'TODO' as any, id, `Updated todo: ${updatedItem.title}`);

        return c.json({ success: true, data: updatedItem });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

app.delete('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    try {
        const existing = await db.select()
            .from(todos)
            .where(and(eq(todos.id, id), eq(todos.userId, user.userId)))
            .limit(1);

        if (existing.length === 0) {
            return c.json({ success: false, error: 'Todo not found' }, 404);
        }

        await db.delete(todos).where(eq(todos.id, id));

        await auditService.log(user.userId, 'DELETE', 'TODO' as any, id, `Deleted todo: ${existing[0].title}`);

        return c.json({ success: true });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default app;
