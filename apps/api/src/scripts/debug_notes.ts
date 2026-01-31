import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const FILE_PATH = 'D:/Code/pmo/apps/ppa.xlsx';
const NOTES_IDX = 184; // Based on previous run

try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets['Proyek']; // We assume 'Proyek' exists from prev run

    // Check Header at Row 0
    const A1 = XLSX.utils.encode_cell({ r: 0, c: NOTES_IDX });
    const headerCell = sheet[A1];
    console.log(`Header at Index ${NOTES_IDX}:`, headerCell ? headerCell.v : 'UNDEFINED');

    // Check first few rows data
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 }); // Start at row 3 (idx 2)

    console.log('Sample Data for Notes (First 5 non-empty):');
    let count = 0;
    for (let i = 0; i < data.length && count < 5; i++) {
        const row: any = data[i];
        const val = row[NOTES_IDX];
        if (val) {
            console.log(`Row ${i + 3}:`, val);
            count++;
        }
    }

    if (count === 0) console.log('No data found in this column for first few rows.');

} catch (e) {
    console.error(e);
}
