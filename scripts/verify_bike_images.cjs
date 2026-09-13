const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Read bikes data from src/data/bikes.js
const bikesJsContent = fs.readFileSync(path.join(__dirname, '../src/data/bikes.js'), 'utf8');

// Parse all 72 bike IDs and models from bikeCatalogue
const catalogueSection = bikesJsContent.substring(
  bikesJsContent.indexOf('export const bikeCatalogue = ['),
  bikesJsContent.indexOf('export const bikeImageMap = {')
);

const brandBlocks = catalogueSection.split(/\[\s*'([A-Za-z0-9\- ]+)'\s*,\s*\[/);
const allBikes = [];
for (let i = 1; i < brandBlocks.length; i += 2) {
  const brandName = brandBlocks[i].trim();
  const blockContent = brandBlocks[i + 1];
  const modelRegex = /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)/g;
  let modelMatch;
  while ((modelMatch = modelRegex.exec(blockContent)) !== null) {
    const model = modelMatch[1];
    const category = modelMatch[2];
    const bikeClass = modelMatch[3];
    const fuelType = modelMatch[4];
    const enginePower = modelMatch[5];
    const transmission = modelMatch[6];
    const dailyRate = Number(modelMatch[7]);
    const id = `${brandName}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const modelSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    allBikes.push({
      id,
      brand: brandName,
      model,
      category,
      bikeClass,
      fuelType,
      enginePower,
      transmission,
      dailyRate,
      brandSlug,
      modelSlug,
      relPath: `src/assets/vehicles/bikes/${brandSlug}/${modelSlug}/${modelSlug}.webp`,
      fullPath: path.join(__dirname, `../src/assets/vehicles/bikes/${brandSlug}/${modelSlug}/${modelSlug}.webp`),
    });
  }
}

console.log(`Auditing ${allBikes.length} bike assets...`);

const hashes = new Map();
const duplicateHashes = [];
const missingImages = [];

for (const bike of allBikes) {
  if (!fs.existsSync(bike.fullPath)) {
    missingImages.push(bike);
    continue;
  }
  const buf = fs.readFileSync(bike.fullPath);
  if (buf.length < 500) {
    missingImages.push({ ...bike, reason: 'File too small/corrupt' });
    continue;
  }
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  if (hashes.has(hash)) {
    duplicateHashes.push({
      first: hashes.get(hash),
      duplicate: bike,
      hash,
    });
  } else {
    hashes.set(hash, bike);
  }
}

console.log(`Found ${hashes.size} verified unique images.`);
console.log(`Missing images: ${missingImages.length}`);
console.log(`Duplicate images: ${duplicateHashes.length}`);

if (missingImages.length > 0) {
  console.log('Missing:', missingImages.map(m => `${m.brand} ${m.model} (${m.relPath})`));
}
if (duplicateHashes.length > 0) {
  console.log('Duplicates:', duplicateHashes.map(d => `${d.duplicate.brand} ${d.duplicate.model} duplicates ${d.first.brand} ${d.first.model}`));
}
