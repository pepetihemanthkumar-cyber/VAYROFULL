import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import vm from 'vm';

const bikesCode = fs.readFileSync('./src/data/bikes.js', 'utf8');
const vehiclesCode = fs.readFileSync('./src/data/vehicles.js', 'utf8');

function clean(code) {
  let cleanCode = code.replace(/import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
    if (importPath.endsWith('.js') || importPath.includes('./bikes')) {
      return '';
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

const bikesContext = { console, Object, Array, Math, String, Number, Boolean, Set, Map };
vm.createContext(bikesContext);
vm.runInContext(clean(bikesCode), bikesContext);
const bikes = bikesContext.getBikes();

const vehiclesContext = {
  ...bikesContext,
  bikes,
  bikeCatalogue: bikesContext.bikeCatalogue,
  bikeImageMap: bikesContext.bikeImageMap,
  ALLOWED_BIKE_BRANDS: bikesContext.ALLOWED_BIKE_BRANDS,
  ALLOWED_BIKE_CATEGORIES: bikesContext.ALLOWED_BIKE_CATEGORIES,
  ALLOWED_BIKE_CLASSES: bikesContext.ALLOWED_BIKE_CLASSES,
};
vm.createContext(vehiclesContext);
vm.runInContext(clean(vehiclesCode), vehiclesContext);

const cars = vehiclesContext.getCars();
const allVehicles = vehiclesContext.getVehicles();

console.log(`Total Cars: ${cars.length}`);
console.log(`Total Bikes/Scooters: ${bikes.length}`);
console.log(`Total Vehicles in catalogue: ${allVehicles.length}`);

let totalGalleryImages = 0;
let vehiclesWith3Images = 0;
let duplicateGalleryCount = 0;
let missingFileCount = 0;
const imageToVehicles = {};
const hashToVehicles = {};

const detailedResults = [];

for (const v of allVehicles) {
  const title = `${v.brand} ${v.model}`;
  const gallery = v.images?.gallery || [];
  totalGalleryImages += gallery.length;

  const uniqueGallery = [...new Set(gallery)];
  if (gallery.length === 3 && uniqueGallery.length === 3) {
    vehiclesWith3Images++;
  } else {
    console.log(`⚠️ Vehicle ${title} gallery has length ${gallery.length} (unique: ${uniqueGallery.length})`);
  }

  const vehicleHashes = [];
  for (const imgPath of gallery) {
    let relPath = imgPath;
    if (relPath.startsWith('../assets/')) {
      relPath = 'src/assets/' + relPath.replace('../assets/', '');
    } else if (relPath.startsWith('./assets/')) {
      relPath = 'src/assets/' + relPath.replace('./assets/', '');
    }

    if (fs.existsSync(relPath)) {
      const buf = fs.readFileSync(relPath);
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      vehicleHashes.push(hash);

      if (!imageToVehicles[relPath]) imageToVehicles[relPath] = [];
      imageToVehicles[relPath].push(title);

      if (!hashToVehicles[hash]) hashToVehicles[hash] = [];
      hashToVehicles[hash].push(title);
    } else {
      missingFileCount++;
      console.log(`❌ Missing image file on disk: ${relPath}`);
    }
  }

  // Check duplicate hashes within vehicle gallery
  const uniqueHashes = [...new Set(vehicleHashes)];
  if (vehicleHashes.length !== uniqueHashes.length) {
    duplicateGalleryCount++;
    console.log(`❌ Duplicate image content hash in gallery for ${title}`);
  }

  detailedResults.push({
    id: v.id,
    brand: v.brand,
    model: v.model,
    vehicleType: v.vehicleType || (v.category?.toLowerCase().includes('bike') || v.category?.toLowerCase().includes('scooter') ? 'Bike/Scooter' : 'Car'),
    galleryCount: gallery.length,
    uniqueImageCount: uniqueGallery.length,
    status: (gallery.length === 3 && uniqueGallery.length === 3) ? '🟢 VERIFIED (3/3 ANGLES)' : '🔴 INVALID'
  });
}

// Cross-model reuses
let crossModelAssetReuse = 0;
for (const [pathStr, list] of Object.entries(imageToVehicles)) {
  if (list.length > 1) {
    crossModelAssetReuse++;
    console.log(`❌ Cross-model asset reuse: ${pathStr} used in ${list.join(', ')}`);
  }
}

let crossModelHashReuse = 0;
for (const [hashStr, list] of Object.entries(hashToVehicles)) {
  if (list.length > 1) {
    crossModelHashReuse++;
    console.log(`❌ Cross-model hash reuse (${hashStr.slice(0, 8)}): used in ${list.join(', ')}`);
  }
}

console.log('\n==================================================');
console.log('621-PHOTOGRAPH GLOBAL CATALOGUE AUDIT RESULTS');
console.log('==================================================');
console.log(`Total Vehicles Audited: ${allVehicles.length} (135 Cars + 72 Bikes/Scooters)`);
console.log(`Vehicles with Exactly 3 Unique Angle Images: ${vehiclesWith3Images} / 207`);
console.log(`Total Gallery Images Mapped: ${totalGalleryImages} / 621`);
console.log(`Missing Image Files on Disk: ${missingFileCount}`);
console.log(`Duplicate Images within Gallery: ${duplicateGalleryCount}`);
console.log(`Cross-Model Image Asset Reuses: ${crossModelAssetReuse}`);
console.log(`Cross-Model Image Content Hash Reuses: ${crossModelHashReuse}`);
console.log('==================================================\n');

fs.writeFileSync('./scratch/final_621_audit_report.json', JSON.stringify({
  summary: {
    totalVehicles: allVehicles.length,
    carsCount: cars.length,
    bikesCount: bikes.length,
    vehiclesWith3Images,
    totalGalleryImages,
    missingFileCount,
    duplicateGalleryCount,
    crossModelAssetReuse,
    crossModelHashReuse
  },
  detailedResults
}, null, 2));
