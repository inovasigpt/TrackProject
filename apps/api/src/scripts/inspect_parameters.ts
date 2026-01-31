import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🔍 Inspecting Parameters...');
    const result = await db.execute(sql`SELECT id, label FROM parameters WHERE category = 'phase'`);
    console.log(result.rows);
    process.exit(0);
}

main().catch(console.error);
