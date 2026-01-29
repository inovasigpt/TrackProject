import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, users } from '../db';
import { hashPassword, verifyPassword, signToken } from '../lib/auth';

const auth = new Hono();

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
        }).returning();

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
    try {
        const { email, password } = await c.req.json();

        // Find user
        const [user] = await db.select().from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return c.json({ success: false, error: 'Email atau password salah' }, 401);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
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
