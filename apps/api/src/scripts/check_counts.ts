import 'dotenv/config';
import { db, projects } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🔍 Checking Project Counts...');

    const [total] = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const [badPrefix] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(sql`code LIKE 'P-P-%'`);
    const [goodPrefix] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(sql`code LIKE 'P-%' AND code NOT LIKE 'P-P-%'`);

    console.log(`Total Projects: ${total.count}`);
    console.log(`Projects with 'P-P-': ${badPrefix.count}`);
    console.log(`Projects with 'P-' (Correct): ${goodPrefix.count}`);

    process.exit(0);
}

main();
