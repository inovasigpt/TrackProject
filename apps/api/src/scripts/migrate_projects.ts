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
const OUTPUT_PATH = 'D:/Code/pmo/apps/ppa_final_v2.xlsx';
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
        }).returning();
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
        NOTES: 137,         // Corrected from 184 -> 137
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
    };

    // User said skip 2 rows (Headers at 0, 1). Data starts at 2 (Row 3).
    // range: 2 means we start reading data from Row 3.
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2, defval: null }) as any[][];
    console.log(`🔄 Processing ${data.length} rows...`);

    let successCount = 0;
    const existingCodes = new Set<string>();

    // We will store the UUIDs to write back to Excel
    // Since we are iterating `data`, we can keep a parallel array or map row index
    // data[i] corresponds to Excel Row (i + 2 + 1) -> Row (i+3) because 1-based?
    // Let's just store the updates in memory and write to a new sheet or modify existing.

    // We need to write to the column "System ID". Let's assume it's the last column or specific index.
    // Let's find the Last Column Index securely or just pick a far one (e.g. Col 200 / 'GS')?
    // User asked "menyimpan UUID di excel tersebut". 
    // Let's append to the end of the row.

    // We modify `data` in place by pushing the ID, then write `data` back? 
    // `sheet_to_json` gives values. If we write back, we lose styles unless we use a library that preserves them.
    // `xlsx` (SheetJS) basic usage often wipes styles on write unless Pro version or careful manipulation.
    // The user just wants the data.
    // Strategy: Update the `sheet` object directly.

    const rowsUpdates: { r: number, c: number, v: string }[] = [];
    const ID_COL_IDX = 200; // Put ID at column 200 (GS) to be safe/far right

    // Add Header for System ID at Row 0 and 1
    rowsUpdates.push({ r: 0, c: ID_COL_IDX, v: 'System ID' });
    rowsUpdates.push({ r: 1, c: ID_COL_IDX, v: 'System ID' });

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const getVal = (idx: number) => {
            const val = row[idx];
            if (val === null || val === undefined) return '';
            return String(val).trim();
        };

        const no = getVal(IDX.NO);
        const noSub = getVal(IDX.NO_SUB);
        const name = getVal(IDX.NAME);
        const app = getVal(IDX.APP);

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
        // Dates & Helper
        const fmtDate = (v: any) => {
            if (!v) return null;
            // Excel date range: > 25569 (1970) and < 60000 (2064) approx
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

        pushDesc('Target', row[IDX.DESC_TARGET]); // Pass raw row value
        pushDesc('Aplikasi', app);
        pushDesc('PIC Satker', getVal(IDX.PIC_SATKER));
        pushDesc('Deliverables', getVal(IDX.DELIVERABLES));
        pushDesc('Stratifikasi', getVal(IDX.STRATIFICATION));
        pushDesc('Leveling', getVal(IDX.LEVELING));
        pushDesc('Revisit', row[IDX.REVISIT]); // Revisit might also be date

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
            }).returning({ id: projects.id });

            successCount++;
            process.stdout.write('.');

            // Queue Excel Update
            // Row index in sheet: 2 (skipped rows) + i (current index) = 2 + i.
            // BUT, XLSX ranges are 0-indexed.
            // We skipped 2 rows, so data[0] is actually Row 2 (0, 1, 2).
            // Let's verify: sheet_to_json with range 2 means it starts reading at index 2.
            // So data[0] comes from row index 2.
            const rowIndex = 2 + i;
            rowsUpdates.push({ r: rowIndex, c: ID_COL_IDX, v: inserted.id });

            // 6. Insert Phases
            const phasesToInsert = [];

            // Helper to parsing excel date number
            const parseDate = (v: any) => {
                if (!v) return null;
                if (typeof v === 'number' && v > 25569 && v < 60000) {
                    return new Date(Math.round((v - 25569) * 86400 * 1000));
                }
                return null;
            };

            const getPhaseDates = (startIdx: number, endIdx: number) => {
                return {
                    start: parseDate(row[startIdx]),
                    end: parseDate(row[endIdx])
                };
            };

            const mergePhases = (ranges: { start: Date | null, end: Date | null }[]) => {
                let min: Date | null = null;
                let max: Date | null = null;
                for (const r of ranges) {
                    if (r.start) {
                        if (!min || r.start < min) min = r.start;
                    }
                    if (r.end) {
                        if (!max || r.end > max) max = r.end;
                    }
                }
                return { start: min, end: max };
            };

            // Requirement (RBT: 20-21, RPP: 22-23)
            const req = mergePhases([getPhaseDates(20, 21), getPhaseDates(22, 23)]);
            if (phaseMap['Requirement'] && (req.start || req.end)) {
                phasesToInsert.push({ projectId: inserted.id, name: phaseMap['Requirement'], startDate: req.start, endDate: req.end });
            }

            // Procurement (KAK: 24-25, Pengadaan: 26-27)
            const proc = mergePhases([getPhaseDates(24, 25), getPhaseDates(26, 27)]);
            if (phaseMap['Procurement'] && (proc.start || proc.end)) {
                phasesToInsert.push({ projectId: inserted.id, name: phaseMap['Procurement'], startDate: proc.start, endDate: proc.end });
            }

            // Design (28-29)
            const des = getPhaseDates(28, 29);
            if (phaseMap['Design'] && (des.start || des.end)) {
                phasesToInsert.push({ projectId: inserted.id, name: phaseMap['Design'], startDate: des.start, endDate: des.end });
            }

            // Development (30-31)
            const dev = getPhaseDates(30, 31);
            if (phaseMap['Development'] && (dev.start || dev.end)) {
                phasesToInsert.push({ projectId: inserted.id, name: phaseMap['Development'], startDate: dev.start, endDate: dev.end });
            }

            // SIT (32-33)
            const sit = getPhaseDates(32, 33);
            if (phaseMap['SIT'] && (sit.start || sit.end)) {
                phasesToInsert.push({ projectId: inserted.id, name: phaseMap['SIT'], startDate: sit.start, endDate: sit.end });
            }

            // UAT (34-35)
            const uat = getPhaseDates(34, 35);
            if (phaseMap['UAT'] && (uat.start || uat.end)) {
                phasesToInsert.push({ projectId: inserted.id, name: phaseMap['UAT'], startDate: uat.start, endDate: uat.end });
            }

            // Implementation (36-37)
            const imp = getPhaseDates(36, 37);
            if (phaseMap['Implementation'] && (imp.start || imp.end)) {
                phasesToInsert.push({ projectId: inserted.id, name: phaseMap['Implementation'], startDate: imp.start, endDate: imp.end });
            }

            if (phasesToInsert.length > 0) {
                await db.insert(phases).values(phasesToInsert);
            }

        } catch (e: any) {
            console.error(`\n❌ Failed ${finalCode}: ${e.message}`);
        }
    }

    console.log(`\n✅ Database Insert Done! Success: ${successCount}`);

    // 5. Write Back to Excel
    console.log('💾 Writing IDs back to Excel...');

    // Apply updates
    rowsUpdates.forEach(u => {
        const cellRef = XLSX.utils.encode_cell({ r: u.r, c: u.c });
        sheet[cellRef] = { v: u.v, t: 's' };
    });

    // Update range if needed
    const range = XLSX.utils.decode_range(sheet['!ref']);
    if (range.e.c < ID_COL_IDX) {
        range.e.c = ID_COL_IDX;
        sheet['!ref'] = XLSX.utils.encode_range(range);
    }

    XLSX.writeFile(workbook, OUTPUT_PATH);
    console.log(`✅ Saved updated file to: ${OUTPUT_PATH}`);

    process.exit(0);
}

main().catch(console.error);
