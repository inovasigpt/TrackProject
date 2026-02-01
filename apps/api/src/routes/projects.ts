import { Hono } from 'hono';
import { eq, or, sql, and } from 'drizzle-orm';
import { db, projects, phases, projectPics, users, parameters } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditService } from '../services/auditService.js';

const projectRoutes = new Hono();

// All routes require auth
projectRoutes.use('*', authMiddleware);

// Get all projects
projectRoutes.get('/', async (c) => {
    try {
        const user = c.get('user');
        const userId = user?.userId;
        const role = user?.role;

        let allProjects;

        if (role === 'admin') {
            allProjects = await db.select().from(projects);
        } else {
            // For non-admins: Created by user OR User is a PIC
            // We use a left join to check for PIC assignment
            const rows = await db.select({ project: projects })
                .from(projects)
                .leftJoin(projectPics, eq(projects.id, projectPics.projectId))
                .where(
                    or(
                        eq(projects.createdBy, userId),
                        eq(projectPics.userId, userId)
                    )
                )
                .groupBy(projects.id);
            allProjects = rows.map(r => r.project);
        }

        // Get phases and pics for each project
        const projectsWithData = await Promise.all(
            allProjects.map(async (project) => {
                const projectPhases = await db.select({
                    id: phases.id,
                    projectId: phases.projectId,
                    name: sql<string>`COALESCE(${parameters.label}, ${phases.name})`, // Use label if available, else name
                    startDate: phases.startDate,
                    endDate: phases.endDate,
                    status: phases.status,
                    progress: phases.progress,
                    order: phases.order,
                })
                    .from(phases)
                    .leftJoin(parameters, sql`${phases.name} = CAST(${parameters.id} AS TEXT)`)
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
        const { code, name, priority, status, stream, description, icon, notes, pics: picsList, phases: phasesList } = body;

        // Create project
        const [newProject] = await db.insert(projects).values({
            code,
            name,
            priority: priority || 'Medium',
            status: status || 'Active',
            stream,
            description,
            icon,
            notes,
            documents: body.documents || [],
            createdBy: c.get('user')?.userId,
        } as any).returning();



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

        // Audit Log
        const user = c.get('user');
        await auditService.log(
            user?.userId,
            'CREATE',
            'PROJECT',
            newProject.id,
            `Project "${newProject.name}" (${newProject.code}) created (Status: ${newProject.status}, Priority: ${newProject.priority}, Stream: ${stream || '-'})`
        );

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
        const { code, name, priority, status, stream, archived, description, icon, notes, pics: picsList, phases: phasesList, documents } = body;

        // Fetch existing project to check for status changes and permissions
        const [existingProject] = await db.select().from(projects).where(eq(projects.id, id));

        if (!existingProject) {
            return c.json({ success: false, error: 'Project not found' }, 404);
        }

        const user = c.get('user');

        // Check if user is a PIC
        const [isPic] = await db.select()
            .from(projectPics)
            .where(and(eq(projectPics.projectId, id), eq(projectPics.userId, user.userId)))
            .limit(1);

        // Permission Check: Admin OR Creator OR PIC
        if (user.role !== 'admin' && existingProject.createdBy !== user.userId && !isPic) {
            return c.json({ success: false, error: 'Unauthorized: Only Admin, Creator or PIC can edit this project' }, 403);
        }

        // 1. Update project details
        const [updated] = await db.update(projects)
            .set({
                code,
                name,
                priority,
                status,
                stream,
                archived,
                description,
                icon,
                notes,
                documents,
            } as any)
            .where(eq(projects.id, id))
            .returning();

        // 2. Sync PICs (Delete all and re-create) ONLY if picsList is provided
        if (picsList !== undefined) {
            await db.delete(projectPics).where(eq(projectPics.projectId, id));

            if (picsList && picsList.length > 0) {
                await db.insert(projectPics).values(
                    picsList.map((pic: any) => {
                        const targetUserId = pic.userId || pic.id;
                        const isValidUuid = targetUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
                        return {
                            projectId: id,
                            userId: isValidUuid ? targetUserId : null,
                            name: pic.name,
                            avatar: pic.avatar,
                        };
                    })
                );
            }
        }

        // 3. Sync Phases (Delete all and re-create) ONLY if phasesList is provided
        if (phasesList !== undefined) {
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
        }

        // Fetch current relations (Phases and PICs) to return complete project object
        // This ensures partial updates (e.g. just archiving) don't return empty lists for relations
        const currentPhases = await db.select().from(phases).where(eq(phases.projectId, id));

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

        // Audit Log
        // Audit Log
        let action = 'UPDATE';
        let changes: string[] = [];

        if (name && name !== existingProject.name) changes.push(`Name: "${existingProject.name}" -> "${name}"`);
        if (status && status !== existingProject.status) changes.push(`Status: "${existingProject.status}" -> "${status}"`);
        if (priority && priority !== existingProject.priority) changes.push(`Priority: "${existingProject.priority}" -> "${priority}"`);

        // Handle Stream comparison (array vs array or null)
        const oldStream = Array.isArray(existingProject.stream) ? existingProject.stream.sort().join(',') : (existingProject.stream || '');
        const newStream = Array.isArray(stream) ? stream.sort().join(',') : (stream || '');
        if (stream !== undefined && oldStream !== newStream) {
            changes.push(`Stream: "[${oldStream}]" -> "[${newStream}]"`);
        }

        if (archived !== undefined && archived !== existingProject.archived) {
            if (archived) {
                action = 'ARCHIVE';
                changes.push('Project archived');
            } else {
                action = 'UNARCHIVE';
                changes.push('Project unarchived');
            }
        }

        if (picsList && picsList.length > 0) changes.push('PICs updated');
        if (phasesList && phasesList.length > 0) changes.push('Phases updated');

        let detail = changes.length > 0
            ? `Project updated. Changes: ${changes.join(', ')}`
            : `Project "${updated.name}" (${updated.code}) updated (No major changes detected)`;

        await auditService.log(
            user?.userId,
            action,
            'PROJECT',
            id,
            detail
        );

        return c.json({
            success: true,
            data: {
                ...updated,
                phases: currentPhases,
                pics: currentPics
            }
        });
    } catch (error) {
        console.error('Update project error:', error);
        // Log detailed error for debugging
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        return c.json({
            success: false,
            error: `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, 500);
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

        // Fetch Project Name
        const projectId = c.req.param('projectId');
        const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

        // Format dates
        const formatDate = (d: Date | null) => d ? d.toISOString().split('T')[0] : '-';
        const dateInfo = updated.startDate || updated.endDate
            ? ` (Start: ${formatDate(updated.startDate)}, End: ${formatDate(updated.endDate)})`
            : '';

        // Audit Log
        const user = c.get('user');
        await auditService.log(
            user?.userId,
            'UPDATE',
            'PHASE',
            phaseId,
            `Phase "${updated.name}" in Project "${project?.name || 'Unknown'}" updated${dateInfo} (Progress: ${updated.progress}%)`
        );

        return c.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update phase error:', error);
        return c.json({ success: false, error: 'Failed to update phase' }, 500);
    }
});

// Delete project
projectRoutes.delete('/:id', async (c) => {
    try {
        const user = c.get('user');
        // Permission Check: Admin ONLY
        if (user.role !== 'admin') {
            return c.json({ success: false, error: 'Unauthorized: Only Admin can delete projects' }, 403);
        }

        const id = c.req.param('id');
        // Get project name for log before delete? Or just ID. 
        // For simplicity, just log ID or fetch first. 
        // Let's fetch name first for better log
        const [project] = await db.select().from(projects).where(eq(projects.id, id));

        await db.delete(projects).where(eq(projects.id, id));


        await auditService.log(
            user?.userId,
            'DELETE',
            'PROJECT',
            id,
            `Project "${project?.name || id}" deleted`
        );

        return c.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        return c.json({ success: false, error: 'Failed to delete project' }, 500);
    }
});

export default projectRoutes;
