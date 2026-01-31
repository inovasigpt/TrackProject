
import 'dotenv/config';
import { db } from '../src/db/index.js'; // Ensure correct path with extension if needed or let tsx handle it
import { sql } from 'drizzle-orm';

async function reset() {
    console.log('Dropping projects table...');
    await db.execute(sql`DROP TABLE IF EXISTS projects CASCADE;`);
    console.log('Projects table dropped.');
    process.exit(0);
}

reset().catch(console.error);
