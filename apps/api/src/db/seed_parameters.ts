import 'dotenv/config';
import { db } from './index';
import { parameters } from './schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PIC_ROLES = [
    'Developer',
    'Tester',
    'Business Owner',
    'Analyst',
    'Project Manager',
    'Tech Lead',
    'Designer'
];

const DEFAULT_PHASES = [
    { label: 'Design', value: 'design', color: 'emerald' },
    { label: 'Development', value: 'dev', color: 'blue' },
    { label: 'Unit Test', value: 'unit_test', color: 'indigo' },
    { label: 'SIT', value: 'sit', color: 'amber' },
    { label: 'UAT', value: 'uat', color: 'rose' },
    { label: 'Deployment', value: 'implementation', color: 'purple' },
];

const DEFAULT_STATUSES = [
    { label: 'Pending', value: 'pending', color: 'slate' },
    { label: 'On Progress', value: 'on_progress', color: 'blue' },
    { label: 'On Track', value: 'on_track', color: 'emerald' },
    { label: 'Behind Schedule', value: 'behind_schedule', color: 'amber' },
    { label: 'At Risk', value: 'at_risk', color: 'rose' },
    { label: 'Done', value: 'done', color: 'purple' },
];

const DEFAULT_PRIORITIES = [
    { label: 'High', value: 'high', color: 'rose' },
    { label: 'Medium', value: 'medium', color: 'amber' },
    { label: 'Low', value: 'low', color: 'emerald' },
];

async function seedParameters() {
    console.log('🌱 Seeding parameters...');

    try {
        // Seed Roles
        for (const role of DEFAULT_PIC_ROLES) {
            await db.insert(parameters).values({
                category: 'role',
                label: role,
                value: role, // value same as label for roles currently
                isActive: true,
            }).onConflictDoNothing();
        }

        // Seed Phases
        for (const phase of DEFAULT_PHASES) {
            await db.insert(parameters).values({
                category: 'phase',
                label: phase.label,
                value: phase.value,
                color: phase.color,
                isActive: true,
            }).onConflictDoNothing();
        }

        // Seed Statuses
        for (const status of DEFAULT_STATUSES) {
            await db.insert(parameters).values({
                category: 'status',
                label: status.label,
                value: status.value,
                color: status.color,
                isActive: true,
            }).onConflictDoNothing();
        }

        // Seed Priorities
        for (const priority of DEFAULT_PRIORITIES) {
            await db.insert(parameters).values({
                category: 'priority',
                label: priority.label,
                value: priority.value,
                color: priority.color,
                isActive: true,
            }).onConflictDoNothing();
        }

        console.log('✅ Parameters seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding parameters:', error);
    }
    process.exit(0);
}

seedParameters();
