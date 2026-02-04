import { Hono } from 'hono';
import { db } from '../db/index.js';
import { scenarios } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

// GET /api/scenarios?projectId=...
app.get('/', async (c) => {
    const projectId = c.req.query('projectId');
    
    if (!projectId) {
        return c.json({ success: false, error: 'Project ID is required' }, 400);
    }

    try {
        const data = await db.select()
            .from(scenarios)
            .where(eq(scenarios.projectId, projectId))
            .orderBy(desc(scenarios.createdAt));
            
        return c.json({ success: true, data });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

// POST /api/scenarios
const createSchema = z.object({
    projectId: z.string().uuid(),
    scenarioNo: z.string().optional(),
    functionalId: z.string().optional(),
    title: z.string().min(1),
    script: z.string().optional(),
    steps: z.string().optional(),
    preRequisite: z.string().optional(),
    component: z.string().optional(),
    expectedResult: z.string().optional(),
    satker: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    updatedBy: z.string().uuid().optional(),
});

app.post('/', zValidator('json', createSchema), async (c) => {
    const body = c.req.valid('json');
    
    try {
        const [newItem] = await db.insert(scenarios).values(body).returning();
        return c.json({ success: true, data: newItem }, 201);
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

// PATCH /api/scenarios/:id
const updateSchema = createSchema.partial();

app.patch('/:id', zValidator('json', updateSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    
    try {
        const [updatedItem] = await db.update(scenarios)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(scenarios.id, id))
            .returning();
            
        if (!updatedItem) {
            return c.json({ success: false, error: 'Scenario not found' }, 404);
        }
        
        return c.json({ success: true, data: updatedItem });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

// DELETE /api/scenarios/:id
app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    
    try {
        await db.delete(scenarios).where(eq(scenarios.id, id));
        return c.json({ success: true });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default app;
