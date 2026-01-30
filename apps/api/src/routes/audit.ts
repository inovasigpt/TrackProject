import { Hono } from 'hono';
import { auditService } from '../services/auditService.js';
import { authMiddleware } from '../middleware/auth.js';

const auditRoutes = new Hono();

// Protect all routes
auditRoutes.use('*', authMiddleware);

auditRoutes.get('/', async (c) => {
    try {
        const user = c.get('user');
        const logs = await auditService.getLogs(user);
        return c.json(logs);
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return c.json({ error: 'Failed to fetch logs' }, 500);
    }
});

export default auditRoutes;
