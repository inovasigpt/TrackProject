import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const FILE_PATH = 'D:/Code/pmo/apps/ppa.xlsx';

const workbook = XLSX.readFile(FILE_PATH);
const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('proyek') || n.toLowerCase().includes('project'));
const sheet = workbook.Sheets[sheetName];

// Read headers from row 2 (index 1) which seems to be where headers are based on previous context 
// (User said "headers at 0, 1. Data starts at 2"). 
// Let's print both Row 0 and Row 1 to be sure.
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 }) as any[][];

console.log('--- Row 0 (Index 0) ---');
data[0].slice(18, 45).forEach((h, i) => console.log(`${18 + i}: ${h}`));

console.log('--- Row 1 (Index 1) ---');
data[1].slice(18, 45).forEach((h, i) => console.log(`${18 + i}: ${h}`));
