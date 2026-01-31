import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import path from 'path';

const filePath = path.resolve('D:/Code/pmo/apps/ppa.xlsx');
console.log(`Reading file from: ${filePath}`);

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('proy') || name.toLowerCase().includes('project'));

    if (!sheetName) {
        console.log('Available sheets:', workbook.SheetNames);
        console.error('Could not find a "proyek" or "project" sheet.');
        process.exit(1);
    }

    console.log(`Found sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    // Read just the first few rows to get headers and sample data
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });

    if (data.length > 0) {
        console.log('Headers:', JSON.stringify(data[0], null, 2));
        if (data.length > 1) {
            console.log('Sample Row:', JSON.stringify(data[1], null, 2));
        }
    } else {
        console.log('Sheet is empty.');
    }

} catch (e) {
    console.error('Error reading file:', e);
}
