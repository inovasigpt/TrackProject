import 'dotenv/config';
import { db, projects, users, phases } from '../db';
import { eq, sql } from 'drizzle-orm';

async function main() {
    console.log('🔍 Verifying Migration...');
    const allProjects = await db.select().from(projects).limit(3);

    console.log(`Found ${allProjects.length} projects.`);

    // Load Phase Params
    const paramRes = await db.execute(sql`SELECT id, label FROM parameters WHERE category = 'phase'`);
    const paramMap = new Map();
    paramRes.rows.forEach((r: any) => paramMap.set(r.id, r.label));

    for (const p of allProjects) {
        console.log('------------------------------------------------');
        console.log(`Project: ${p.code} - ${p.name}`);
        console.log(`Status: ${p.status}`);
        console.log(`Priority: ${p.priority}`);

        // Fetch Phases
        const projPhases = await db.select().from(phases).where(eq(phases.projectId, p.id));
        console.log(`Phases (${projPhases.length}):`);
        for (const ph of projPhases) {
            const label = paramMap.get(ph.name) || ph.name;
            console.log(`  - ${label}: ${ph.startDate} -> ${ph.endDate}`);
        }

        console.log(`Description Preview:`);
        console.log(p.description?.substring(0, 200) + '...');
    }
    process.exit(0);
}

main();
