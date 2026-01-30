import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

// Catch all requests
app.all('*', (c) => {
    return c.json({
        success: true,
        message: 'Hono Inline Adapter is working!',
        path: c.req.path,
        method: c.req.method,
    });
});

export default handle(app);
