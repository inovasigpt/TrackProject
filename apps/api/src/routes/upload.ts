
import { Hono } from 'hono';
import { v2 as cloudinary } from 'cloudinary';

// Note: Cloudinary library configures itself automatically from process.env 
// if CLOUDINARY_URL is present, or we can configure manually.
// Since we are using individual env vars, we configure manually.

const upload = new Hono();

upload.get('/signature', async (c) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return c.json({ error: 'Server misconfiguration: Missing Cloudinary env vars' }, 500);
    }

    const timestamp = Math.round((new Date).getTime() / 1000);

    // Generate signature
    // Cloudinary expects params sorted alphabetically to generate signature
    const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
        // upload_preset: 'ml_default', // Optional: if you use presets
    }, apiSecret);

    return c.json({
        signature,
        timestamp,
        cloudName,
        apiKey
    });
});

upload.post('/delete', async (c) => {
    const { url } = await c.req.json();
    const apiSecret = process.env.CLOUDINARY_API_KEY; // Wait, we need secret for destroy? Or standard upload API?
    // Destroy usually requires signature too, or admin API. 
    // Easier way: standard destroy also takes timestamp & signature.
    // OR use the cloudinary SDK to destroy (since we are on backend).

    // Cloudinary SDK is already imported. Let's use it.
    // Ensure config is set.
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/demo/image/upload/v1570979139/sample.jpg
        // public_id is 'sample' (or folder/sample)
        // Regex to match last part before extension, after version.

        // Simple extraction:
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        // Note: this is simplistic and might fail with folders. 
        // Better: look for /upload/ (and optional version /v1234/) then take the rest.

        // Robust extraction logic:
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/;
        const match = url.match(regex);
        const pid = match ? match[1] : publicId; // Fallback

        if (!pid) return c.json({ error: 'Invalid URL' }, 400);

        const result = await cloudinary.uploader.destroy(pid);
        return c.json(result);
    } catch (error: any) {
        console.error('Delete error', error);
        return c.json({ error: error.message }, 500);
    }
});

export default upload;
