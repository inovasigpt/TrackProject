import 'dotenv/config';
import { db, projects } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🧹 Cleaning up P-P- projects...');

    const res = await db.delete(projects).where(sql`code LIKE 'P-P-%'`).returning({ code: projects.code });

    console.log(`Deleted ${res.length} bad projects.`);

    process.exit(0);
}

main();
