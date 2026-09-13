import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Let's parse vehicles.js and bikes.js directly with regex/eval in VM context
import vm from 'vm';

const bikesCode = fs.readFileSync('./src/data/bikes.js', 'utf8');
const vehiclesCode = fs.readFileSync('./src/data/vehicles.js', 'utf8');

// Build sandbox with image mocks
const imageMocks = {};
function getMock(importPath) {
  return importPath; // return the path as string value of imported image
}

// Extract imports from code
function extractAndReplaceImports(code) {
  let cleanCode = code.replace(/import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
    if (importPath.endsWith('.js') || importPath.includes('./bikes')) {
      return ''; // ignore JS imports, we will provide them in context
    }
    const varMatch = match.match(/import\s+([a-zA-Z0-9_$]+)\s+from/);
    if (varMatch) {
      return `const ${varMatch[1]} = ${JSON.stringify(importPath)};`;
    }
    return '';
  });
  cleanCode = cleanCode.replace(/export\s+const\s+/g, 'const ');
  cleanCode = cleanCode.replace(/export\s+function\s+/g, 'function ');
  cleanCode = cleanCode.replace(/export\s+default\s+/g, 'const defaultExport = ');
  cleanCode = cleanCode.replace(/export\s*\{[^}]*\};?/g, '');
  return cleanCode;

}



const preparedBikes = extractAndReplaceImports(bikesCode);
const preparedVehicles = extractAndReplaceImports(vehiclesCode);

// Run bikes in VM
const bikesContext = {
  console,
  Object,
  Array,
  Math,
  String,
  Number,
  Boolean,
  Date,
  RegExp,
  Set,
  Map,
};

vm.createContext(bikesContext);
vm.runInContext(preparedBikes, bikesContext);

console.log('Bikes context keys:', Object.keys(bikesContext).filter(k => !['console','Object','Array','Math','String','Number','Boolean','Date','RegExp','Set','Map'].includes(k)));
const bikes = bikesContext.getBikes();


console.log(`Loaded ${bikes.length} bikes in VM.`);

// Run vehicles in VM
const vehiclesContext = {
  ...bikesContext,
  bikes: bikes, // array of 72 bikes!
  bikeCatalogue: bikesContext.bikeCatalogue,
  bikeImageMap: bikesContext.bikeImageMap,
  ALLOWED_BIKE_BRANDS: bikesContext.ALLOWED_BIKE_BRANDS,
  ALLOWED_BIKE_CATEGORIES: bikesContext.ALLOWED_BIKE_CATEGORIES,
  ALLOWED_BIKE_CLASSES: bikesContext.ALLOWED_BIKE_CLASSES,
};


vm.createContext(vehiclesContext);
vm.runInContext(preparedVehicles, vehiclesContext);

console.log('Vehicles context keys:', Object.keys(vehiclesContext).filter(k => !['console','Object','Array','Math','String','Number','Boolean','Date','RegExp','Set','Map','bikes','bikeCatalogue','bikeImageMap','ALLOWED_BIKE_BRANDS','ALLOWED_BIKE_CATEGORIES','ALLOWED_BIKE_CLASSES'].includes(k)));
const cars = vehiclesContext.getCars ? vehiclesContext.getCars() : [];
console.log(`Loaded ${cars.length} cars in VM.`);

const allVehicles = vehiclesContext.getVehicles ? vehiclesContext.getVehicles() : [...cars, ...bikes];
console.log(`Total 207 vehicles loaded: ${allVehicles.length}`);



// Now run the complete audit!
const hashToVehicles = {}; // hash -> list of vehicle titles
const imageToVehicles = {}; // relative image path -> list of vehicle titles
const results = [];

let verifiedCount = 0;
let partialCount = 0;
let invalidCount = 0;
let notVerifiedCount = 0;

let totalDuplicateGalleryCount = 0;
let totalCrossModelAssetReuse = 0;
let totalCrossModelHashReuse = 0;

for (const v of allVehicles) {
  const title = `${v.brand} ${v.model}`;
  const isBike = v.vehicleType === 'bike' || v.category?.toLowerCase().includes('bike') || v.category?.toLowerCase().includes('scooter');
  const typeStr = isBike ? 'Bike/Scooter' : 'Car';

  const primaryAsset = v.images?.primary || v.image;
  const isFallback = typeof primaryAsset === 'string' && primaryAsset.includes('vehicle-catalogue.png');

  // Resolve path
  let assetPathOnDisk = null;
  let fileExists = false;
  let fileHash = null;

  if (primaryAsset && typeof primaryAsset === 'string' && !isFallback) {
    let relPath = primaryAsset;
    if (relPath.startsWith('../assets/')) {
      relPath = 'src/assets/' + relPath.replace('../assets/', '');
    } else if (relPath.startsWith('./assets/')) {
      relPath = 'src/assets/' + relPath.replace('./assets/', '');
    }
    assetPathOnDisk = relPath;
    if (fs.existsSync(assetPathOnDisk)) {
      fileExists = true;
      const buf = fs.readFileSync(assetPathOnDisk);
      fileHash = crypto.createHash('sha256').update(buf).digest('hex');

      if (!imageToVehicles[assetPathOnDisk]) imageToVehicles[assetPathOnDisk] = [];
      imageToVehicles[assetPathOnDisk].push(title);

      if (!hashToVehicles[fileHash]) hashToVehicles[fileHash] = [];
      hashToVehicles[fileHash].push(title);
    }
  }

  // Gallery audit
  const gallery = v.images?.gallery || [];
  const uniqueGallery = [...new Set(gallery)];
  const hasDuplicateGallery = gallery.length !== uniqueGallery.length;
  if (hasDuplicateGallery) totalDuplicateGalleryCount++;

  // Status computation according to prompt requirements
  let status = '🟢 VERIFIED';
  const notes = [];

  if (isFallback || !primaryAsset || !fileExists) {
    status = '⚪ NOT VERIFIED';
    notVerifiedCount++;
    notes.push(isFallback ? 'Uses fallback image' : 'Asset file missing on disk');
  } else if (v.imageSource !== 'local-authentic' && v.imageSource !== 'local-verified') {
    status = '🟡 PARTIAL';
    partialCount++;
    notes.push(`imageSource is ${v.imageSource}`);
  } else {
    verifiedCount++;
  }

  if (hasDuplicateGallery) {
    notes.push(`Gallery has ${gallery.length - uniqueGallery.length} duplicate entries`);
  }

  results.push({
    id: v.id,
    brand: v.brand,
    model: v.model,
    vehicleType: typeStr,
    primaryAsset: assetPathOnDisk || primaryAsset,
    galleryAssetCount: gallery.length,
    uniqueImageCount: uniqueGallery.length,
    duplicateCount: gallery.length - uniqueGallery.length,
    fileExists,
    fileHash,
    status,
    notes: notes.join('; ') || 'OK'
  });
}

// Check cross-model asset reuses
const crossModelAssets = {};
for (const [pathStr, list] of Object.entries(imageToVehicles)) {
  if (list.length > 1) {
    totalCrossModelAssetReuse++;
    crossModelAssets[pathStr] = list;
  }
}

// Check cross-model hash reuses (different files with identical image content)
const crossModelHashes = {};
for (const [hashStr, list] of Object.entries(hashToVehicles)) {
  if (list.length > 1) {
    totalCrossModelHashReuse++;
    crossModelHashes[hashStr] = list;
  }
}

console.log('\n========================================');
console.log('AUDIT SUMMARY');
console.log('========================================');
console.log(`Total Models Audited: ${results.length}`);
console.log(`- Cars: ${cars.length}`);
console.log(`- Bikes/Scooters: ${bikes.length}`);
console.log(`🟢 VERIFIED: ${verifiedCount}`);
console.log(`🟡 PARTIAL: ${partialCount}`);
console.log(`🔴 INVALID: ${invalidCount}`);
console.log(`⚪ NOT VERIFIED: ${notVerifiedCount}`);
console.log(`Gallery Duplicate Errors: ${totalDuplicateGalleryCount}`);
console.log(`Cross-Model Asset Path Reuses: ${totalCrossModelAssetReuse}`);
console.log(`Cross-Model Image Content Hash Reuses: ${totalCrossModelHashReuse}`);
console.log('========================================\n');

if (totalCrossModelAssetReuse > 0) {
  console.log('Cross-Model Asset Reuses Details:', JSON.stringify(crossModelAssets, null, 2));
}

if (totalCrossModelHashReuse > 0) {
  console.log('Cross-Model Hash Reuses Details:', JSON.stringify(crossModelHashes, null, 2));
}

fs.writeFileSync('./scratch/catalogue_audit_report.json', JSON.stringify({
  summary: {
    total: results.length,
    cars: cars.length,
    bikes: bikes.length,
    verifiedCount,
    partialCount,
    invalidCount,
    notVerifiedCount,
    totalDuplicateGalleryCount,
    totalCrossModelAssetReuse,
    totalCrossModelHashReuse
  },
  crossModelAssets,
  crossModelHashes,
  results
}, null, 2));
