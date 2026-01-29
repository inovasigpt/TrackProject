import app from '../apps/api/src/index';
import { handle } from 'hono/vercel';

export const config = {
    runtime: 'nodejs', // Use Node.js runtime (supports entire Hono stack)
};

export default handle(app);
