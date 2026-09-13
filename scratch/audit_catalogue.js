import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 1. Read file contents as text to analyze imports & catalogue arrays
const vehiclesCode = fs.readFileSync('./src/data/vehicles.js', 'utf8');
const bikesCode = fs.readFileSync('./src/data/bikes.js', 'utf8');
const attributionsCode = fs.readFileSync('./src/assets/vehicles/ATTRIBUTIONS.md', 'utf8');

// Helper to get sha256 of file
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Extract imports from JS file
function parseImports(code) {
  const importMap = {}; // varName -> relativePath
  const importRegex = /import\s+([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    importMap[match[1]] = match[2];
  }
  return importMap;
}

const vehiclesImports = parseImports(vehiclesCode);
const bikesImports = parseImports(bikesCode);

console.log(`Vehicles imports count: ${Object.keys(vehiclesImports).length}`);
console.log(`Bikes imports count: ${Object.keys(bikesImports).length}`);

// Find all vehicle assets on disk
function getAllAssets(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllAssets(filePath, fileList);
    } else if (file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const carAssets = getAllAssets('./src/assets/vehicles').filter(p => !p.includes('/bikes/'));
const bikeAssets = getAllAssets('./src/assets/vehicles/bikes');

console.log(`Car assets on disk: ${carAssets.length}`);
console.log(`Bike assets on disk: ${bikeAssets.length}`);
console.log(`Total image assets on disk: ${carAssets.length + bikeAssets.length}`);
