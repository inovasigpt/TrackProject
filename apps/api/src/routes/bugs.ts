import { Hono } from 'hono';
import { eq, desc, sql, and, or } from 'drizzle-orm';
import { db, bugs, users, projects } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditService } from '../services/auditService.js';

const bugRoutes = new Hono();

// Temporary Seed Route (Public)
bugRoutes.post('/seed', async (c) => {
    try {
        const ISSUE_TYPES = ['Bug', 'New Feature'];
        const PRIORITIES = ['Fatal', 'Major', 'Minor', 'Kosmetik'];
        const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'NOT_OK', 'CLOSED', 'UNDER_REVIEW'];
        const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length === 0) return c.json({ error: 'No users found' }, 400);
        const reporterId = allUsers[0].id;

        const allProjects = await db.select().from(projects).limit(1);
        const projectId = allProjects.length > 0 ? allProjects[0].id : null;
        const projectCode = allProjects.length > 0 ? allProjects[0].code : 'BUGS';

        const result = await db.select({ count: sql<number>`count(*)` }).from(bugs);
        let startCount = Number(result[0].count) + 1;

        const newBugs = [];
        for (let i = 0; i < 30; i++) {
            const type = getRandomElement(ISSUE_TYPES);
            const priority = getRandomElement(PRIORITIES);
            const status = getRandomElement(STATUSES);
            newBugs.push({
                code: `${projectCode}-${startCount + i}`,
                summary: `Dummy Bug ${startCount + i} - ${new Date().toISOString().split('T')[0]}`,
                description: `This is a randomly generated bug description for testing purposes. Status: ${status}, Priority: ${priority}.`,
                reporterId: reporterId,
                projectId: projectId,
                priority: priority,
                type: type,
                status: status,
                components: 'Backend,Frontend',
                labels: 'test,dummy',
                attachments: JSON.stringify([]),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        await db.insert(bugs).values(newBugs);
        return c.json({ success: true, count: newBugs.length });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// All routes require auth
bugRoutes.use('*', authMiddleware);

// Get all bugs
bugRoutes.get('/', async (c) => {
    try {
        const user = c.get('user');

        // Build the query
        const query = db.select({
            id: bugs.id,
            code: bugs.code,
            summary: bugs.summary,
            description: bugs.description,
            status: bugs.status,
            priority: bugs.priority,
            type: bugs.type,
            components: bugs.components,
            labels: bugs.labels,
            attachments: bugs.attachments,
            createdAt: bugs.createdAt,
            updatedAt: bugs.updatedAt,
            reporter: {
                id: users.id,
                username: users.username,
                avatar: users.avatar
            },
            project: {
                id: projects.id,
                name: projects.name,
                code: projects.code
            },
            parent: {
                id: bugs.parentId
            }
        })
            .from(bugs)
            .leftJoin(users, eq(bugs.reporterId, users.id))
            .leftJoin(projects, eq(bugs.projectId, projects.id));

        // TODO: Add filters based on query params if needed

        const results = await query.orderBy(desc(bugs.createdAt));

        return c.json({ success: true, data: results });
    } catch (error) {
        console.error('Get bugs error:', error);
        return c.json({ success: false, error: 'Failed to fetch bugs' }, 500);
    }
});

// Temporary Seed Route
bugRoutes.post('/seed', async (c) => {
    try {
        const ISSUE_TYPES = ['Bug', 'New Feature'];
        const PRIORITIES = ['Fatal', 'Major', 'Minor', 'Kosmetik'];
        const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'NOT_OK', 'CLOSED', 'UNDER_REVIEW'];
        const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length === 0) return c.json({ error: 'No users found' }, 400);
        const reporterId = allUsers[0].id;

        const allProjects = await db.select().from(projects).limit(1);
        const projectId = allProjects.length > 0 ? allProjects[0].id : null;
        const projectCode = allProjects.length > 0 ? allProjects[0].code : 'BUGS';

        const result = await db.select({ count: sql<number>`count(*)` }).from(bugs);
        let startCount = Number(result[0].count) + 1;

        const newBugs = [];
        for (let i = 0; i < 30; i++) {
            const type = getRandomElement(ISSUE_TYPES);
            const priority = getRandomElement(PRIORITIES);
            const status = getRandomElement(STATUSES);
            newBugs.push({
                code: `${projectCode}-${startCount + i}`,
                summary: `Dummy Bug ${startCount + i} - ${new Date().toISOString().split('T')[0]}`,
                description: `This is a randomly generated bug description for testing purposes. Status: ${status}, Priority: ${priority}.`,
                reporterId: reporterId,
                projectId: projectId,
                priority: priority,
                type: type,
                status: status,
                components: 'Backend,Frontend',
                labels: 'test,dummy',
                attachments: JSON.stringify([]),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        await db.insert(bugs).values(newBugs);
        return c.json({ success: true, count: newBugs.length });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// Create bug
bugRoutes.post('/', async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        const { summary, description, priority, type, projectId, parentId, components, labels, attachments } = body;

        if (!summary) {
            return c.json({ success: false, error: 'Summary is required' }, 400);
        }

        // Auto-generate Code (PROJECT_CODE + SEQUENCE) or just GMMP + seq
        // If projectId is present, get project code. Else default to 'GMMP'?
        // User reference uses "GMMP-3". "Space" seems to be the project.

        let prefix = 'BUG';
        if (projectId) {
            const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
            if (project && project.code) {
                prefix = project.code;
            }
        } else {
            // Fallback or explicit Space
            prefix = 'BUGS';
        }

        // Count existing bugs with this prefix to determine next ID
        // This is a simple counter, might have race conditions but acceptable for this scale
        // A better way is to have a sequence table, but COUNT(*) + 1 is what user asked "generate otomatis saja"

        // Improved counting: Count all bugs where code starts with prefix
        const result = await db.execute(sql`
            SELECT COUNT(*) as count FROM ${bugs} WHERE ${bugs.code} LIKE ${prefix || 'BUG'} || '-%'
        `);
        const countResult = result.rows[0];

        const nextNum = Number(countResult.count) + 1;
        const code = `${prefix}-${nextNum}`;

        const [newBug] = await db.insert(bugs).values({
            code,
            summary,
            description,
            reporterId: user.userId,
            status: 'OPEN',
            priority: priority || 'Medium',
            type: type || 'Bug',
            projectId,
            parentId,
            components, // Expecting array of strings or null
            labels,
            attachments,
        } as any).returning();

        // Audit Log
        if (projectId) {
            await auditService.log(
                user.userId,
                'CREATE',
                'BUG',
                newBug.id,
                `Bug "${code}" created in Project ${prefix}`
            );
        }

        return c.json({ success: true, data: newBug }, 201);

    } catch (error) {
        console.error('Create bug error:', error);
        return c.json({ success: false, error: 'Failed to create bug' }, 500);
    }
});

// Update bug
bugRoutes.put('/:id', async (c) => {
    try {
        const user = c.get('user');
        const id = c.req.param('id');
        const body = await c.req.json();
        const { summary, description, status, priority, type, components, labels, attachments } = body;

        // Get existing bug to check for changes
        const [existingBug] = await db.select().from(bugs).where(eq(bugs.id, id));

        if (!existingBug) {
            return c.json({ success: false, error: 'Bug not found' }, 404);
        }

        const [updatedBug] = await db.update(bugs)
            .set({
                summary,
                description,
                status,
                priority,
                type,
                components,
                labels,
                attachments,
                updatedAt: new Date()
            } as any)
            .where(eq(bugs.id, id))
            .returning();

        // Audit Log for Status Change
        if (existingBug.status !== status) {
            await auditService.log(
                user.userId,
                'UPDATE',
                'BUG',
                updatedBug.id,
                `Bug "${existingBug.code}": Status changed from ${existingBug.status} to ${status}`
            );
        } else {
            // Generic update log (optional, but good for activity stream)
            await auditService.log(
                user.userId,
                'UPDATE',
                'BUG',
                updatedBug.id,
                `Bug "${updatedBug.code}" details updated`
            );
        }

        return c.json({ success: true, data: updatedBug });

    } catch (error) {
        console.error('Update bug error:', error);
        return c.json({ success: false, error: 'Failed to update bug' }, 500);
    }
});

export default bugRoutes;
