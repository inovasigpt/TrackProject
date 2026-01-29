import { Hono } from 'hono';
import { db } from '../db/index.js';
import { parameters } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const parametersRouter = new Hono();

// Get all parameters (optionally filter by category)
parametersRouter.get('/', async (c) => {
    const category = c.req.query('category');

    try {
        let query = db.select().from(parameters).where(eq(parameters.isActive, true));

        if (category) {
            query = db.select().from(parameters).where(and(
                eq(parameters.category, category),
                eq(parameters.isActive, true)
            ));
        }

        const data = await query;
        return c.json(data);
    } catch (error) {
        return c.json({ error: 'Failed to fetch parameters' }, 500);
    }
});

// Create a new parameter
parametersRouter.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { category, label, value, color, order } = body;

        if (!category || !label || !value) {
            return c.json({ error: 'Missing required fields' }, 400);
        }

        const [newParameter] = await db.insert(parameters).values({
            category,
            label,
            value,
            color,
            order: order || '0',
            isActive: true,
        }).returning();

        return c.json(newParameter, 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to create parameter' }, 500);
    }
});

// Update a parameter
parametersRouter.put('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const { label, value, color, order, isActive } = body;

        const [updatedParameter] = await db.update(parameters)
            .set({
                label,
                value,
                color,
                order,
                isActive
            })
            .where(eq(parameters.id, id))
            .returning();

        if (!updatedParameter) {
            return c.json({ error: 'Parameter not found' }, 404);
        }

        return c.json(updatedParameter);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to update parameter' }, 500);
    }
});

// Soft delete a parameter
parametersRouter.delete('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const [deletedParameter] = await db.update(parameters)
            .set({ isActive: false })
            .where(eq(parameters.id, id))
            .returning();

        if (!deletedParameter) {
            return c.json({ error: 'Parameter not found' }, 404);
        }

        return c.json({ message: 'Parameter deleted successfully' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to delete parameter' }, 500);
    }
});

export default parametersRouter;
