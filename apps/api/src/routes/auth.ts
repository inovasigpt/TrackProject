import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, users } from '../db/index.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';

const auth = new Hono();

// Debug Login via GET (to bypass POST body parsing issues)
auth.get('/debug-login', async (c) => {
    try {
        const email = c.req.query('email');
        const password = c.req.query('password');

        if (!email || !password) {
            return c.json({ error: 'Missing email/password params' }, 400);
        }

        console.log('[DebugLogin] Starting', { email });

        // 1. DB Query
        const startDb = Date.now();
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const dbDuration = Date.now() - startDb;
        console.log('[DebugLogin] DB finished', { duration: dbDuration, found: result.length > 0 });

        const user = result[0];
        if (!user) return c.json({ error: 'User not found', dbDuration });

        // 2. Hash Verify
        const startHash = Date.now();
        const isValid = await verifyPassword(password, user.password);
        const hashDuration = Date.now() - startHash;

        return c.json({
            success: isValid,
            dbDuration,
            hashDuration,
            user: { ...user, password: '***' }
        });

    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

// Register
auth.post('/register', async (c) => {
    try {
        const { username, email, password, role } = await c.req.json();

        // Check if email exists
        const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingEmail.length > 0) {
            return c.json({ success: false, error: 'Email sudah terdaftar' }, 400);
        }

        // Check if username exists
        const existingUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
        if (existingUsername.length > 0) {
            return c.json({ success: false, error: 'Username sudah digunakan' }, 400);
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
            username,
            email,
            password: hashedPassword,
            role: role || 'user',
            status: 'pending',
            avatar: `https://i.pravatar.cc/100?u=${username}`,
        } as any).returning();

        return c.json({
            success: true,
            message: 'Registrasi berhasil. Menunggu approval admin.',
            user: { ...newUser, password: undefined },
        });
    } catch (error) {
        console.error('Register error:', error);
        return c.json({ success: false, error: 'Registrasi gagal' }, 500);
    }
});

// Login
auth.post('/login', async (c) => {
    console.log('[Login] Request received');
    try {
        const body = await c.req.json();
        console.log('[Login] Body parsed', { email: body.email });
        const { email, password } = body;

        // Find user
        console.log('[Login] Executing DB query...');
        const startTime = Date.now();
        const result = await db.select().from(users)
            .where(eq(users.email, email))
            .limit(1);
        console.log('[Login] DB query finished', { duration: Date.now() - startTime, found: result.length > 0 });

        const user = result[0];

        if (!user) {
            console.log('[Login] User not found');
            return c.json({ success: false, error: 'Email atau password salah' }, 401);
        }

        // Verify password
        console.log('[Login] Verifying password...');
        const bcryptStart = Date.now();
        const isValid = await verifyPassword(password, user.password);
        console.log('[Login] Password verified', { duration: Date.now() - bcryptStart, isValid });

        if (!isValid) {
            return c.json({ success: false, error: 'Email atau password salah' }, 401);
        }

        // Check status
        if (user.status === 'pending') {
            return c.json({ success: false, error: 'Akun menunggu persetujuan admin' }, 403);
        }
        if (user.status === 'rejected') {
            return c.json({ success: false, error: 'Akun ditolak. Hubungi admin' }, 403);
        }
        if (user.status === 'inactive') {
            return c.json({ success: false, error: 'Akun dinonaktifkan. Hubungi admin' }, 403);
        }

        // Generate token
        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return c.json({
            success: true,
            user: { ...user, password: undefined },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        return c.json({ success: false, error: 'Login gagal' }, 500);
    }
});

export default auth;
