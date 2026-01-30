import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, messages } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const messageRoutes = new Hono();

// All routes require auth
messageRoutes.use('*', authMiddleware);

// Get messages for current user
messageRoutes.get('/', async (c) => {
    try {
        const user = c.get('user');
        const userMessages = await db.select().from(messages)
            .where(eq(messages.userId, user.userId));

        return c.json({ success: true, data: userMessages });
    } catch (error) {
        console.error('Get messages error:', error);
        return c.json({ success: false, error: 'Failed to fetch messages' }, 500);
    }
});

// Mark message as read
messageRoutes.put('/:id/read', async (c) => {
    try {
        const id = c.req.param('id');
        const user = c.get('user');

        const [updated] = await db.update(messages)
            .set({ isRead: true } as any)
            .where(and(eq(messages.id, id), eq(messages.userId, user.userId)))
            .returning();

        return c.json({ success: true, data: updated });
    } catch (error) {
        console.error('Mark read error:', error);
        return c.json({ success: false, error: 'Failed to mark as read' }, 500);
    }
});

export default messageRoutes;
