import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, users, roles } from '../db/index.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { hashPassword } from '../lib/auth.js';

const userRoutes = new Hono();

// All routes require auth
userRoutes.use('*', authMiddleware);

// Get current user
userRoutes.get('/me', async (c) => {
    const user = c.get('user');
    const [fullUser] = await db.select().from(users)
        .where(eq(users.id, user.userId))
        .limit(1);

    if (!fullUser) {
        return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, data: { ...fullUser, password: undefined } });
});

// Get user list for selection (authenticated users)
userRoutes.get('/list', async (c) => {
    const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        avatar: users.avatar
    }).from(users);

    return c.json({ success: true, data: allUsers });
});

// Admin routes
userRoutes.use('/admin/*', adminMiddleware);

// Create user (admin)
userRoutes.post('/admin/create', async (c) => {
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
            status: 'approved', // Auto approve
            avatar: `https://i.pravatar.cc/100?u=${username}`,
        }).returning();

        return c.json({
            success: true,
            message: 'User berhasil dibuat',
            data: { ...newUser, password: undefined },
        });
    } catch (error) {
        console.error('Create user error:', error);
        return c.json({ success: false, error: 'Gagal membuat user' }, 500);
    }
});

// Get all users (admin)
userRoutes.get('/admin/list', async (c) => {
    const allUsers = await db.select().from(users);
    return c.json({
        success: true,
        data: allUsers.map(u => ({ ...u, password: undefined })),
    });
});

// Update user status (admin)
userRoutes.put('/admin/:id/status', async (c) => {
    try {
        const id = c.req.param('id');
        const { status } = await c.req.json();

        const [updated] = await db.update(users)
            .set({ status } as any)
            .where(eq(users.id, id))
            .returning();

        return c.json({ success: true, data: { ...updated, password: undefined } });
    } catch (error) {
        console.error('Update status error:', error);
        return c.json({ success: false, error: 'Failed to update status' }, 500);
    }
});

// Delete user (admin)
userRoutes.delete('/admin/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await db.delete(users).where(eq(users.id, id));
        return c.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        return c.json({ success: false, error: 'Failed to delete user' }, 500);
    }
});

// Get all roles (admin)
userRoutes.get('/admin/roles', async (c) => {
    const allRoles = await db.select().from(roles);
    return c.json({ success: true, data: allRoles });
});

// Toggle role status (admin)
userRoutes.put('/admin/roles/:id/toggle', async (c) => {
    try {
        const id = c.req.param('id');
        const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);

        if (!role) {
            return c.json({ success: false, error: 'Role not found' }, 404);
        }

        const [updated] = await db.update(roles)
            .set({ isActive: !role.isActive })
            .where(eq(roles.id, id))
            .returning();

        return c.json({ success: true, data: updated });
    } catch (error) {
        console.error('Toggle role error:', error);
        return c.json({ success: false, error: 'Failed to toggle role' }, 500);
    }
});

export default userRoutes;
