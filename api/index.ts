import { handle } from 'hono/vercel';
import app from '../apps/api/src/index.js';

export const config = {
    runtime: 'nodejs',
};

export default handle(app);
