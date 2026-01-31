import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const FILE_PATH = 'D:/Code/pmo/apps/ppa.xlsx';

const workbook = XLSX.readFile(FILE_PATH);
const sheet = workbook.Sheets['Proyek'];

// Read headers
const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 })[0] as string[];

const target = "Keterangan detail progres";
const index = headers.findIndex(h => h === target);

console.log(`Index of '${target}':`, index);

const target2 = "Keterangan"; // maybe fuzzy match
const index2 = headers.findIndex(h => h && h.includes("Keterangan"));
console.log(`Index of fuzzy 'Keterangan':`, index2);
console.log(`Value at ${index2}:`, headers[index2]);
