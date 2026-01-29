import { Hono } from 'hono';
import { eq, or } from 'drizzle-orm';
import { db, projects, phases, projectPics, users } from '../db';
import { authMiddleware } from '../middleware/auth';

const projectRoutes = new Hono();

// All routes require auth
projectRoutes.use('*', authMiddleware);

// Get all projects
projectRoutes.get('/', async (c) => {
    try {
        const allProjects = await db.select().from(projects);

        // Get phases and pics for each project
        const projectsWithData = await Promise.all(
            allProjects.map(async (project) => {
                const projectPhases = await db.select().from(phases)
                    .where(eq(phases.projectId, project.id));
                const pics = await db.select({
                    id: projectPics.id,
                    projectId: projectPics.projectId,
                    userId: projectPics.userId,
                    name: projectPics.name,
                    avatar: projectPics.avatar,
                    role: users.role
                })
                    .from(projectPics)
                    .leftJoin(users, or(eq(projectPics.userId, users.id), eq(projectPics.name, users.username)))
                    .where(eq(projectPics.projectId, project.id));

                return {
                    ...project,
                    phases: projectPhases,
                    pics,
                };
            })
        );

        return c.json({ success: true, data: projectsWithData });
    } catch (error) {
        console.error('Get projects error:', error);
        return c.json({ success: false, error: 'Failed to fetch projects' }, 500);
    }
});


// Create project
projectRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { code, name, priority, status, description, icon, notes, pics: picsList, phases: phasesList } = body;

        // Create project
        const [newProject] = await db.insert(projects).values({
            code,
            name,
            priority: priority || 'Medium',
            status: status || 'Active',
            description,
            icon,
            notes,
            documents: body.documents || [],
        }).returning();



        // Create PICs
        let createdPics: any[] = [];
        if (picsList && picsList.length > 0) {
            createdPics = await db.insert(projectPics).values(
                picsList.map((pic: any) => {
                    const isValidUuid = pic.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pic.id);
                    return {
                        projectId: newProject.id,
                        userId: isValidUuid ? pic.id : null,
                        name: pic.name,
                        avatar: pic.avatar,
                    };
                })
            ).returning();
        }

        // Create phases
        let createdPhases: any[] = [];
        if (phasesList && phasesList.length > 0) {
            createdPhases = await db.insert(phases).values(
                phasesList.map((phase: any, index: number) => ({
                    projectId: newProject.id,
                    name: phase.name,
                    startDate: phase.startDate ? new Date(phase.startDate) : null,
                    endDate: phase.endDate ? new Date(phase.endDate) : null,
                    status: phase.status || 'pending',
                    progress: String(phase.progress || 0),
                    order: String(index),
                }))
            ).returning();
        }

        return c.json({
            success: true,
            data: {
                ...newProject,
                phases: createdPhases,
                pics: createdPics
            }
        }, 201);
    } catch (error) {
        console.error('Create project error:', error);
        return c.json({ success: false, error: 'Failed to create project' }, 500);
    }
});

// Update project
// Update project
projectRoutes.put('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const { code, name, priority, status, archived, description, icon, notes, pics: picsList, phases: phasesList, documents } = body;

        // 1. Update project details
        const [updated] = await db.update(projects)
            .set({
                code,
                name,
                priority,
                status,
                archived,
                description,
                icon,
                notes,
                documents,
            })
            .where(eq(projects.id, id))
            .returning();

        // 2. Sync PICs (Delete all and re-create)
        await db.delete(projectPics).where(eq(projectPics.projectId, id));

        if (picsList && picsList.length > 0) {
            await db.insert(projectPics).values(
                picsList.map((pic: any) => {
                    const isValidUuid = pic.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pic.id);
                    return {
                        projectId: id,
                        userId: isValidUuid ? pic.id : null,
                        name: pic.name,
                        avatar: pic.avatar,
                    };
                })
            );
        }

        // 3. Sync Phases (Delete all and re-create)
        await db.delete(phases).where(eq(phases.projectId, id));

        let createdPhases: any[] = [];
        if (phasesList && phasesList.length > 0) {
            createdPhases = await db.insert(phases).values(
                phasesList.map((phase: any, index: number) => ({
                    projectId: id,
                    name: phase.name || phase.label || 'Phase',
                    startDate: phase.startDate ? new Date(phase.startDate) : null,
                    endDate: phase.endDate ? new Date(phase.endDate) : null,
                    status: phase.status || 'pending',
                    progress: String(phase.progress || 0),
                    order: String(index),
                }))
            ).returning();
        }

        // Fetch re-created PICs
        const currentPics = await db.select({
            id: projectPics.id,
            projectId: projectPics.projectId,
            userId: projectPics.userId,
            name: projectPics.name,
            avatar: projectPics.avatar,
            role: users.role
        })
            .from(projectPics)
            .leftJoin(users, or(eq(projectPics.userId, users.id), eq(projectPics.name, users.username)))
            .where(eq(projectPics.projectId, id));

        return c.json({
            success: true,
            data: {
                ...updated,
                phases: createdPhases,
                pics: currentPics
            }
        });
    } catch (error) {
        console.error('Update project error:', error);
        return c.json({ success: false, error: 'Failed to update project' }, 500);
    }
});

// Update phase
projectRoutes.put('/:projectId/phases/:phaseId', async (c) => {
    try {
        const phaseId = c.req.param('phaseId');
        const updates = await c.req.json();

        const [updated] = await db.update(phases)
            .set({
                ...updates,
                startDate: updates.startDate ? new Date(updates.startDate) : null,
                endDate: updates.endDate ? new Date(updates.endDate) : null,
                progress: updates.progress ? String(updates.progress) : undefined,
            })
            .where(eq(phases.id, phaseId))
            .returning();

        return c.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update phase error:', error);
        return c.json({ success: false, error: 'Failed to update phase' }, 500);
    }
});

// Delete project
projectRoutes.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await db.delete(projects).where(eq(projects.id, id));
        return c.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        return c.json({ success: false, error: 'Failed to delete project' }, 500);
    }
});

export default projectRoutes;
