import { Context, Next } from 'hono';
import { verifyToken, JWTPayload } from '../lib/auth';

declare module 'hono' {
    interface ContextVariableMap {
        user: JWTPayload;
    }
}

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
        return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    c.set('user', payload);
    await next();
};

export const adminMiddleware = async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user || user.role !== 'admin') {
        return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    await next();
};
