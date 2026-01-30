import { getRequestListener } from '@hono/node-server';
import app from '../apps/api/src/index.js';

export const config = {
    runtime: 'nodejs',
    api: {
        bodyParser: false,
    },
};

// Create a request listener from the Hono app
const requestListener = getRequestListener(app.fetch);

// Export a vanilla Node.js handler for Vercel
export default function handler(request: any, response: any) {
    return requestListener(request, response);
}
