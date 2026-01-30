import { db, auditLogs, projects, projectPics, phases } from '../db/index.js';
import { InferModel, eq, or, and, inArray } from 'drizzle-orm';

type NewAuditLog = typeof auditLogs.$inferInsert;

export const auditService = {
    log: async (
        userId: string | null,
        action: string,
        entityType: 'PROJECT' | 'PHASE',
        entityId: string,
        details: string
    ) => {
        try {
            await db.insert(auditLogs).values({
                userId,
                action,
                entityType,
                entityId,
                details,
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error to avoid blocking the main action
        }
    },

    getLogs: async (user: { userId: string; role: string }, limit = 50) => {
        const conditions = [];

        if (user.role !== 'admin') {
            // 1. Get projects created by user
            const ownedProjects = await db.select({ id: projects.id })
                .from(projects)
                .where(eq(projects.createdBy, user.userId));

            // 2. Get projects where user is PIC
            const assignedProjects = await db.select({ id: projectPics.projectId })
                .from(projectPics)
                .where(eq(projectPics.userId, user.userId));

            const projectIds = [...new Set([
                ...ownedProjects.map(p => p.id),
                ...assignedProjects.map(p => p.id)
            ])];

            // 3. Get phases for these projects
            let phaseIds: string[] = [];
            if (projectIds.length > 0) {
                const projectPhases = await db.select({ id: phases.id })
                    .from(phases)
                    .where(inArray(phases.projectId, projectIds));
                phaseIds = projectPhases.map(p => p.id);
            }

            // Build OR conditions
            const filters = [
                eq(auditLogs.userId, user.userId), // Own actions
            ];

            if (projectIds.length > 0) {
                filters.push(and(eq(auditLogs.entityType, 'PROJECT'), inArray(auditLogs.entityId, projectIds)));
            }
            if (phaseIds.length > 0) {
                filters.push(and(eq(auditLogs.entityType, 'PHASE'), inArray(auditLogs.entityId, phaseIds)));
            }

            conditions.push(or(...filters));
        }

        return await db.query.auditLogs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
            limit: limit,
            with: {
                user: true,
            }
        });
    }
};
