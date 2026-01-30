import app from '../apps/api/src/index.js';

export const config = {
    runtime: 'nodejs',
    // Let Vercel parse the body (default behavior)
};

export default async function handler(req: any, res: any) {
    try {
        // 1. Construct URL
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const url = `${protocol}://${host}${req.url}`;

        // 2. Handle Body
        // Vercel parses JSON automatically into req.body object
        const method = req.method;
        let body: any = undefined;

        if (method !== 'GET' && method !== 'HEAD') {
            if (req.body && typeof req.body === 'object') {
                body = JSON.stringify(req.body);
            } else if (req.body) {
                body = req.body;
            }
        }

        // 3. Create Fetch Request
        const request = new Request(url, {
            method,
            headers: req.headers as HeadersInit,
            body,
        });

        // 4. Invoke Hono
        const response = await app.fetch(request);

        // 5. Send Response back to Vercel
        res.status(response.status);

        // Forward headers
        response.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value);
        });

        // 6. Send Body
        const responseText = await response.text();
        res.send(responseText);

    } catch (error: any) {
        console.error('Vercel Adapter Error:', error);
        res.status(500).json({
            error: 'Internal Adapter Error',
            details: error.message,
            stack: error.stack
        });
    }
}
