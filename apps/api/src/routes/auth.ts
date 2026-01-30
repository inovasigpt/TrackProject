import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, users } from '../db/index.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';
import { emailService } from '../services/emailService.js';

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

// Forgot Password
auth.post('/forgot-password', async (c) => {
    try {
        const { email } = await c.req.json();

        // Check if email exists
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            // Return success even if email not found to prevent enumeration
            return c.json({ success: true, message: 'Jika email terdaftar, instruksi reset password telah dikirim.' });
        }

        // Generate mock token (In production, generate a real token and save to DB/Redis)
        const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
        const resetLink = `http://localhost:5173/reset-password?token=${mockToken}`;

        // Send email via Resend
        const sent = await emailService.sendPasswordResetEmail(email, resetLink);

        if (!sent) {
            console.warn('Failed to send email via Resend, falling back to mock log');
            console.log(`[MOCK EMAIL] Reset link for ${email}: ${resetLink}`);
        }

        return c.json({ success: true, message: 'Instruksi reset password telah dikirim ke email.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return c.json({ success: false, error: 'Gagal memproses permintaan' }, 500);
    }
});

// Reset Password
auth.post('/reset-password', async (c) => {
    try {
        const { token, newPassword } = await c.req.json();

        // Verify mock token (In production, verify real token)
        let email;
        try {
            const decoded = Buffer.from(token, 'base64').toString('ascii');
            email = decoded.split(':')[0];
        } catch (e) {
            return c.json({ success: false, error: 'Token tidak valid' }, 400);
        }

        if (!email || !newPassword) {
            return c.json({ success: false, error: 'Data tidak lengkap' }, 400);
        }

        // Update password
        const hashedPassword = await hashPassword(newPassword);
        await db.update(users)
            .set({ password: hashedPassword } as any)
            .where(eq(users.email, email));

        return c.json({ success: true, message: 'Password berhasil diubah. Silakan login.' });

    } catch (error) {
        console.error('Reset password error:', error);
        return c.json({ success: false, error: 'Gagal mereset password' }, 500);
    }
});

export default auth;
