import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';


import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import parametersRouter from './routes/parameters.js';

const app = new Hono().basePath('/api');

// Middleware
app.use(logger());
app.use('*', cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:3000',
        'https://trackproject-ivory.vercel.app',
        process.env.FRONTEND_URL || '',
        process.env.VITE_VERCEL_URL || '',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
    ].filter(Boolean),
    credentials: true,
}));

import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

// Debug / Health Check
app.get('/', async (c) => {
    const dbUrl = process.env.DATABASE_URL;
    let dbStatus = 'unknown';
    let dbError = null;

    try {
        // Try simple query
        await db.execute(sql`SELECT 1`);
        dbStatus = 'connected';
    } catch (e: any) {
        dbStatus = 'error';
        dbError = e.message;
        console.error('Health Check DB Error:', e);
    }

    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            hasDatabaseUrl: !!dbUrl,
            dbUrlPrefix: dbUrl ? dbUrl.substring(0, 15) + '...' : 'MISSING',
            region: process.env.VERCEL_REGION || 'unknown',
        },
        db: {
            status: dbStatus,
            error: dbError
        }
    });
});

app.post('/echo', async (c) => {
    try {
        const body = await c.req.json();
        return c.json({
            status: 'ok',
            message: 'POST request received',
            body: body,
            timestamp: new Date().toISOString()
        });
    } catch (e: any) {
        return c.json({ status: 'error', message: 'Failed to parse body', error: e.message }, 400);
    }
});

import { users } from './db/schema.js';
import { hashPassword } from './lib/auth.js';

app.get('/debug/db', async (c) => {
    try {
        const start = Date.now();
        const result = await db.select().from(users).limit(1);
        const duration = Date.now() - start;
        return c.json({ status: 'ok', type: 'db_select_users', duration, count: result.length });
    } catch (e: any) {
        return c.json({ status: 'error', type: 'db_select_users', error: e.message }, 500);
    }
});

app.get('/debug/cpu', async (c) => {
    try {
        const start = Date.now();
        const hash = await hashPassword('test-password');
        const duration = Date.now() - start;
        return c.json({ status: 'ok', type: 'bcrypt_hash', duration, hash });
    } catch (e: any) {
        return c.json({ status: 'error', type: 'bcrypt_hash', error: e.message }, 500);
    }
});

// Routes
app.route('/auth', authRoutes);
app.route('/projects', projectRoutes);
app.route('/users', userRoutes);
app.route('/messages', messageRoutes);
app.route('/parameters', parametersRouter);

// Error handler
app.onError((err, c) => {
    console.error('Error:', err);
    return c.json({ success: false, error: err.message }, 500);
});

// Start server

// Start server (Local Development)
const port = Number(process.env.PORT) || 3001;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    console.log(`🚀 Server running on http://localhost:${port}`);
    serve({
        fetch: app.fetch,
        port,
    });
}

// Export app for Vercel wrapper
export default app;
