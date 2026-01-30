import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    response.status(200).json({
        message: 'Vanilla Vercel Function IS WORKING!',
        timestamp: new Date().toISOString(),
        query: request.query,
    });
}
