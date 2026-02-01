import { db, bugs, users, projects } from '../src/db';
import { eq } from 'drizzle-orm';
import { faker } from '@faker-js/faker';

// Since I don't have faker installed, I'll use simple random generation or install it. 
// Standard library is safer to avoid install steps.

const ISSUE_TYPES = ['Bug', 'New Feature'];
const PRIORITIES = ['Fatal', 'Major', 'Minor', 'Kosmetik'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'NOT_OK', 'CLOSED', 'UNDER_REVIEW'];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
    console.log('Seeding bugs...');

    // Get a user to be the reporter
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
        console.error('No users found. Create a user first.');
        process.exit(1);
    }
    const reporterId = allUsers[0].id;

    // Get a project
    const allProjects = await db.select().from(projects).limit(1);
    const projectId = allProjects.length > 0 ? allProjects[0].id : null;
    const projectCode = allProjects.length > 0 ? allProjects[0].code : 'BUGS';

    // Get current count for code generation
    // Simply assuming existing count to start
    const existing = await db.select().from(bugs);
    let startCount = existing.length + 1;

    const newBugs: any[] = [];

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
    console.log(`Successfully inserted ${newBugs.length} bugs.`);
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
