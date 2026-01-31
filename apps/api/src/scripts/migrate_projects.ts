import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import { db, users, projects, phases, projectPics } from '../db';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import { hashPassword } from '../lib/auth';

// Constants
const FILE_PATH = 'D:/Code/pmo/apps/ppa.xlsx';
const SHEET_SEARCH = ['proyek', 'project'];

async function main() {
    console.log('🚀 Starting Re-Migration (Wipe & Reload)...');

    // 1. Setup 'Migrasi' User
    let migrasiUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, 'Migrasi'),
    });

    if (!migrasiUser) {
        console.log('👤 Creating "Migrasi" user...');
        const hashedPassword = await hashPassword('migrasi123');
        const [newUser] = await db.insert(users).values({
            username: 'Migrasi',
            email: 'migrasi@pmo.com',
            password: hashedPassword,
            role: 'admin',
            status: 'approved',
            avatar: 'https://ui-avatars.com/api/?name=Migrasi&background=random',
        } as any).returning();
        migrasiUser = newUser;
    }
    const CREATOR_ID = migrasiUser.id;
    console.log(`👤 Using Creator ID: ${CREATOR_ID} (${migrasiUser.username})`);

    // 1.5 Fetch Phase Parameters
    const phaseParamsRaw = await db.execute(sql`SELECT id, label FROM parameters WHERE category = 'phase'`);
    const phaseMap: Record<string, string> = {};
    for (const row of phaseParamsRaw.rows) {
        // Normalize label to match our keys: Requirement, Procurement, Design, Development, SIT, UAT, Implementation
        const label = (row.label as string);
        if (label.match(/req/i)) phaseMap['Requirement'] = (row.id as string);
        else if (label.match(/proc/i)) phaseMap['Procurement'] = (row.id as string);
        else if (label.match(/des/i)) phaseMap['Design'] = (row.id as string);
        else if (label.match(/dev/i)) phaseMap['Development'] = (row.id as string);
        else if (label.match(/sit/i)) phaseMap['SIT'] = (row.id as string);
        else if (label.match(/uat/i)) phaseMap['UAT'] = (row.id as string);
        else if (label.match(/imp/i)) phaseMap['Implementation'] = (row.id as string);
    }
    console.log('✅ Loaded Phase Map:', Object.keys(phaseMap));

    // 2. Wipe Old Data
    console.log('🧹 Wiping old projects...');
    await db.delete(projectPics);
    await db.delete(phases);
    await db.delete(projects);
    console.log('✅ Data wiped.');

    // 3. Read Excel
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`❌ File not found: ${FILE_PATH}`);
        process.exit(1);
    }
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames.find((name: string) =>
        SHEET_SEARCH.some(s => name.toLowerCase().includes(s))
    );
    if (!sheetName) {
        console.error('❌ Sheet not found');
        process.exit(1);
    }
    const sheet = workbook.Sheets[sheetName];

    // 4. Map Columns
    const IDX = {
        NO: 4,              // Col E
        NO_SUB: 5,          // Col F
        NAME: 7,            // "Nama Proyek Baru"
        APP: 17,            // "Aplikasi"
        STREAM: 16,
        NOTES: 137,
        STATUS: 167,
        CATEGORY: 3,

        // Description Parts
        DESC_TARGET: 43,
        PIC_SATKER: 14,
        DELIVERABLES: 8,
        STRATIFICATION: 11,
        LEVELING: 12,
        REVISIT: 25,
        START: 9,
        END: 10,

        // Phases (Start, End) - 0-indexed based on console dump
        RBT_S: 26, RBT_E: 27,
        RPP_S: 28, RPP_E: 29,
        KAK_S: 30, KAK_E: 31,
        PENG_S: 32, PENG_E: 33,
        DES_S: 34, DES_E: 35,
        DEV_S: 36, DEV_E: 37,
        SIT_S: 38, SIT_E: 39,
        UAT_S: 40, UAT_E: 41,
        IMP_S: 42, IMP_E: 43,
    };

    // range: 2 means we start reading data from Row 3.
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2, defval: null }) as any[][];
    console.log(`🔄 Processing ${data.length} rows...`);

    let successCount = 0;
    const existingCodes = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const getVal = (idx: number) => {
            const val = row[idx];
            if (val === null || val === undefined) return '';
            return String(val).trim();
        };

        const no = getVal(IDX.NO);
        const name = getVal(IDX.NAME);
        const app = getVal(IDX.APP);
        const noSub = getVal(IDX.NO_SUB);

        if (!name && !no) continue;

        // Generate Code
        const appCode = app.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);
        let baseCode = String(no).trim();
        if (!/^p-/i.test(baseCode)) {
            baseCode = `P-${baseCode}`;
        }
        if (noSub && noSub !== '0' && noSub !== '-') {
            baseCode += `.${noSub}`;
        }
        if (appCode) {
            baseCode += `-${appCode}`;
        }

        // Handle Duplicates
        let finalCode = baseCode;
        let counter = 1;
        while (existingCodes.has(finalCode)) {
            finalCode = `${baseCode}-${counter}`;
            counter++;
        }
        existingCodes.add(finalCode);

        // Status
        let statusRaw = getVal(IDX.STATUS);
        let status = 'Active';
        if (statusRaw.match(/progress/i) || statusRaw.match(/active/i)) status = 'Active';
        else if (statusRaw.match(/done/i) || statusRaw.match(/complete/i) || statusRaw.match(/selesai/i)) status = 'Completed';
        else if (statusRaw.match(/hold/i)) status = 'On Hold';
        else if (statusRaw.match(/cancel/i)) status = 'Cancelled';

        // Stream
        let streamRaw = getVal(IDX.STREAM);
        let streamArray: string[] = [];
        if (streamRaw) {
            streamArray = streamRaw.split(',').map(s => s.trim()).filter(Boolean);
        }

        // Description
        const descParts = [];
        const fmtDate = (v: any) => {
            if (!v) return null;
            if (typeof v === 'number' && v > 25569 && v < 60000) {
                const d = new Date(Math.round((v - 25569) * 86400 * 1000));
                return d.toISOString().split('T')[0];
            }
            return String(v);
        };
        const pushDesc = (label: string, val: any) => {
            if (val && val !== '-' && val !== '0') {
                const formatted = fmtDate(val);
                descParts.push(`${label}: ${formatted}`);
            }
        };

        pushDesc('Target', row[IDX.DESC_TARGET]);
        pushDesc('Aplikasi', app);
        pushDesc('PIC Satker', getVal(IDX.PIC_SATKER));
        pushDesc('Deliverables', getVal(IDX.DELIVERABLES));
        pushDesc('Stratifikasi', getVal(IDX.STRATIFICATION));
        pushDesc('Leveling', getVal(IDX.LEVELING));
        pushDesc('Revisit', row[IDX.REVISIT]);

        const start = fmtDate(row[IDX.START]);
        const end = fmtDate(row[IDX.END]);
        if (start) descParts.push(`Start: ${start}`);
        if (end) descParts.push(`End: ${end}`);
        const description = descParts.join('\n');

        try {
            const [inserted] = await db.insert(projects).values({
                code: finalCode,
                name: name,
                priority: 'Rivibi',
                status: status,
                description: description,
                stream: streamArray,
                notes: getVal(IDX.NOTES),
                createdBy: CREATOR_ID,
            } as any).returning({ id: projects.id });

            successCount++;
            process.stdout.write('.');

            // 6. Insert Phases
            const parseDate = (v: any) => {
                if (!v) return null;
                if (typeof v === 'number' && v > 25569 && v < 60000) {
                    return new Date(Math.round((v - 25569) * 86400 * 1000));
                }
                return null;
            };

            const getPhaseDates = (sIdx: number, eIdx: number) => {
                const s = parseDate(row[sIdx]);
                const e = parseDate(row[eIdx]);
                return { start: s, end: e };
            };

            const mergeDates = (p1: { start: Date | null, end: Date | null }, p2: { start: Date | null, end: Date | null }) => {
                let start = p1.start;
                if (p2.start && (!start || p2.start < start)) start = p2.start;

                let end = p1.end;
                if (p2.end && (!end || p2.end > end)) end = p2.end;
                return { start, end };
            };

            const phasesToInsert: any[] = [];

            const addPhase = (name: string, dates: { start: Date | null, end: Date | null }) => {
                if (phaseMap[name]) {
                    phasesToInsert.push({
                        projectId: inserted.id,
                        name: phaseMap[name],
                        startDate: dates.start,
                        endDate: dates.end,
                        status: 'pending'
                    });
                }
            };

            // Requirement: RBT + RPP
            const rbt = getPhaseDates(IDX.RBT_S, IDX.RBT_E);
            const rpp = getPhaseDates(IDX.RPP_S, IDX.RPP_E);
            addPhase('Requirement', mergeDates(rbt, rpp));

            // Procurement: KAK + Pengadaan
            const kak = getPhaseDates(IDX.KAK_S, IDX.KAK_E);
            const peng = getPhaseDates(IDX.PENG_S, IDX.PENG_E);
            addPhase('Procurement', mergeDates(kak, peng));

            // Others
            addPhase('Design', getPhaseDates(IDX.DES_S, IDX.DES_E));
            addPhase('Development', getPhaseDates(IDX.DEV_S, IDX.DEV_E));
            addPhase('SIT', getPhaseDates(IDX.SIT_S, IDX.SIT_E));
            addPhase('UAT', getPhaseDates(IDX.UAT_S, IDX.UAT_E));
            addPhase('Implementation', getPhaseDates(IDX.IMP_S, IDX.IMP_E));

            if (phasesToInsert.length > 0) {
                await db.insert(phases).values(phasesToInsert);
            }

        } catch (e: any) {
            console.error(`\n❌ Failed ${finalCode}: ${e.message}`);
        }
    }

    console.log(`\n✅ Database Insert Done! Success: ${successCount}`);
    console.log('🏁 Migration Completed (No Excel Write-back).');
    process.exit(0);
}

main().catch(console.error);
