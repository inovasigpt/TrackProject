import { api } from './services/api';

const ISSUE_TYPES = ['Bug', 'New Feature'];
const PRIORITIES = ['Fatal', 'Major', 'Minor', 'Kosmetik'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'NOT_OK', 'CLOSED', 'UNDER_REVIEW'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedBugs() {
    console.log('Start seeding 30 dummy bugs...');
    for (let i = 1; i <= 30; i++) {
        const bug = {
            summary: `Dummy Bug ${i} - ${new Date().toISOString()}`,
            description: `This is a generated description for dummy bug ${i}. It has some random content to fill space.`,
            priority: getRandomElement(PRIORITIES),
            type: getRandomElement(ISSUE_TYPES),
            status: getRandomElement(STATUSES),
            components: 'Frontend,Backend',
            labels: 'automated,test',
            attachments: JSON.stringify([]),
            // Assuming project IDs are already handled or defaulted in backend for now, or we might need a project ID.
            // Based on schema, project_id is required. I need to check how Create Bug handles it.
            // Looking at `api.createBug`, it takes a payload.
            // Looking at `bugs.ts` route, it expects `projectId` in body or defaults?
            // Wait, let's check `apps/web/src/services/api.ts` to see what `createBug` sends.
        };

        try {
            // I'll need to run this in context where `api` works. 
            // Since `api.ts` uses `fetch` to localhost, I can run this as a node script using `fetch`.
            // But `api.ts` is likely frontend code using relative paths or configured base URL?
            // Let's just use raw fetch in this script.
        } catch (e) {
            console.error('Error creating bug', i, e);
        }
    }
}
