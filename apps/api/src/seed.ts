
import 'dotenv/config';
import { db } from './db';
import { users, projects, phases, projectPics, parameters } from './db/schema';
import { hashPassword } from './lib/auth';
import { eq } from 'drizzle-orm';

const SEED_USERS = [
    { username: 'budi.santoso', email: 'budi@example.com', role: 'Project Manager', name: 'Budi Santoso' },
    { username: 'ani.wijaya', email: 'ani@example.com', role: 'Developer', name: 'Ani Wijaya' },
    { username: 'citra.dewi', email: 'citra@example.com', role: 'QA', name: 'Citra Dewi' },
    { username: 'dimas.pratama', email: 'dimas@example.com', role: 'Developer', name: 'Dimas Pratama' },
    { username: 'eka.putri', email: 'eka@example.com', role: 'UI/UX Designer', name: 'Eka Putri' },
    { username: 'fajar.nugraha', email: 'fajar@example.com', role: 'DevOps', name: 'Fajar Nugraha' },
    { username: 'gita.sari', email: 'gita@example.com', role: 'System Analyst', name: 'Gita Sari' },
    { username: 'hadi.kusuma', email: 'hadi@example.com', role: 'Project Manager', name: 'Hadi Kusuma' },
    { username: 'indah.permata', email: 'indah@example.com', role: 'Developer', name: 'Indah Permata' },
    { username: 'joko.susilo', email: 'joko@example.com', role: 'QA', name: 'Joko Susilo' },
];

const SEED_PROJECTS = [
    {
        name: 'Mobile Banking App Revamp',
        code: 'MBA-2024-01',
        description: 'Redesign and implementation of the new mobile banking application using Flutter.',
        priority: 'High',
        status: 'On Track',
        icon: 'smartphone',
        phases: [
            { name: 'Requirement', startDate: new Date('2024-01-01'), endDate: new Date('2024-01-15') },
            { name: 'Desain', startDate: new Date('2024-01-16'), endDate: new Date('2024-02-15') },
            { name: 'Development', startDate: new Date('2024-02-16'), endDate: new Date('2024-05-30') },
            { name: 'UAT', startDate: new Date('2024-06-01'), endDate: new Date('2024-06-15') },
        ]
    },
    {
        name: 'Internal HR Portal',
        code: 'IHR-2024-02',
        description: 'Web-based internal portal for employee management, leave requests, and payroll.',
        priority: 'Medium',
        status: 'At Risk',
        icon: 'users',
        phases: [
            { name: 'Desain', startDate: new Date('2024-03-01'), endDate: new Date('2024-03-15') },
            { name: 'Development', startDate: new Date('2024-03-16'), endDate: new Date('2024-04-30') },
            { name: 'SIT', startDate: new Date('2024-05-01'), endDate: new Date('2024-05-07') },
            { name: 'UAT', startDate: new Date('2024-05-08'), endDate: new Date('2024-05-15') },
        ]
    },
    {
        name: 'Legacy System Migration',
        code: 'LSM-2024-03',
        description: 'Migrating the legacy COBOL core banking system to a modern microservices architecture.',
        priority: 'High',
        status: 'Delayed',
        icon: 'server',
        phases: [
            { name: 'Analysis', startDate: new Date('2023-11-01'), endDate: new Date('2023-12-31') },
            { name: 'Architecture Design', startDate: new Date('2024-01-01'), endDate: new Date('2024-02-28') },
            { name: 'Migration Wave 1', startDate: new Date('2024-03-01'), endDate: new Date('2024-07-31') },
        ]
    },
];

const SEED_ROLES = [
    'Project Manager', 'Developer', 'QA', 'UI/UX Designer', 'DevOps', 'System Analyst'
];

const SEED_PHASES = [
    'Requirement', 'Desain', 'Development', 'SIT', 'UAT', 'Deployment'
];

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Seed Roles (Parameters)
    console.log('Creating roles...');
    for (const role of SEED_ROLES) {
        const roleExists = await db.select().from(parameters).where(eq(parameters.value, role)).limit(1);
        if (roleExists.length === 0) {
            await db.insert(parameters).values({
                category: 'role',
                label: role,
                value: role,
                isActive: true
            });
        }
    }

    // Seed Phases (Parameters)
    console.log('Creating phase parameters...');
    const phaseColors = ['emerald', 'blue', 'amber', 'purple', 'rose'];
    for (let i = 0; i < SEED_PHASES.length; i++) {
        const phase = SEED_PHASES[i];
        const phaseExists = await db.select().from(parameters).where(eq(parameters.value, phase)).limit(1);
        if (phaseExists.length === 0) {
            await db.insert(parameters).values({
                category: 'phase',
                label: phase,
                value: phase,
                color: phaseColors[i % phaseColors.length],
                isActive: true
            });
        }
    }

    // 2. Seed Users
    console.log('Creating users...');
    const createdUsers = [];
    for (const user of SEED_USERS) {
        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.username, user.username)).limit(1);

        if (existing.length > 0) {
            createdUsers.push(existing[0]);
            console.log(`User ${user.username} already exists, skipping.`);
        } else {
            const hashedPassword = await hashPassword('password123'); // Default password
            const [newUser] = await db.insert(users).values({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                role: user.role,
                status: 'approved',
                avatar: `https://i.pravatar.cc/150?u=${user.username}`
            }).returning();
            createdUsers.push(newUser);
            console.log(`Created user ${user.username}`);
        }
    }

    // 3. Seed Projects
    console.log('Creating projects...');
    for (const proj of SEED_PROJECTS) {
        // Check if project exists
        const existing = await db.select().from(projects).where(eq(projects.code, proj.code)).limit(1);

        let projectId;

        if (existing.length > 0) {
            projectId = existing[0].id;
            console.log(`Project ${proj.code} already exists.`);
        } else {
            const [newProj] = await db.insert(projects).values({
                name: proj.name,
                code: proj.code,
                description: proj.description,
                priority: proj.priority,
                status: proj.status,
                icon: proj.icon,
                archived: false,
            }).returning();
            projectId = newProj.id;
            console.log(`Created project ${proj.name}`);

            // Add Phases
            for (const phase of proj.phases) {
                await db.insert(phases).values({
                    projectId: projectId,
                    name: phase.name,
                    startDate: phase.startDate,
                    endDate: phase.endDate,
                    status: 'pending',
                    progress: String(Math.floor(Math.random() * 100)) // Random progress 0-100
                });
            }
        }

        // Assign PICs (Randomly assign 2-3 users per project)
        // Clear existing PICs first to ensure clean state for this run if reusing key
        // Actually, let's just add if not present using logic or just skip if project existed.
        // For simplicity, if project is new, we add pics.

        if (existing.length === 0) {
            const shuffled = createdUsers.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3); // Pick 3 random users

            for (const user of selected) {
                await db.insert(projectPics).values({
                    projectId: projectId,
                    userId: user.id,
                    name: user.username,
                    avatar: user.avatar
                });
            }
        }
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
