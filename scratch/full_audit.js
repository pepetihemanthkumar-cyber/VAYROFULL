import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Read vehicles.js and bikes.js
let vehiclesCode = fs.readFileSync('./src/data/vehicles.js', 'utf8');
let bikesCode = fs.readFileSync('./src/data/bikes.js', 'utf8');

// Transform import statements into const declarations with relative path strings
function transformImports(code, baseDir) {
  return code.replace(/import\s+([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g, (match, varName, importPath) => {
    // If it's importing from bikes.js inside vehicles.js, handle specially
    if (importPath.includes('./bikes')) {
      return `// ${match}`;
    }
    return `const ${varName} = ${JSON.stringify(importPath)};`;
  });
}

// Prepare bikes.js for evaluation
let transformedBikes = transformImports(bikesCode, './src/data');
// Remove existing export keywords and append clean export block at end
transformedBikes = transformedBikes.replace(/export\s+const\s+/g, 'const ');
transformedBikes = transformedBikes.replace(/export\s+function\s+/g, 'function ');
transformedBikes += `\nexport { bikes, bikeCatalogue, bikeImageMap, ALLOWED_BIKE_BRANDS, ALLOWED_BIKE_CATEGORIES, ALLOWED_BIKE_CLASSES, getBikeById, getBikes };`;



fs.writeFileSync('./scratch/transformed_bikes.js', transformedBikes);

// Remove original import line from vehicles.js
let cleanVehiclesCode = vehiclesCode.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/bikes['"];?/g, '');
let transformedVehicles = transformImports(cleanVehiclesCode, './src/data');

transformedVehicles = transformedVehicles.replace(/export\s+const\s+/g, 'const ');
transformedVehicles = transformedVehicles.replace(/export\s+function\s+/g, 'function ');
transformedVehicles += `\nexport { vehicles, vehicleCatalogue, vehiclesById };`;
transformedVehicles = `import { bikes, bikeCatalogue, bikeImageMap } from './transformed_bikes.js';\n` + transformedVehicles;


fs.writeFileSync('./scratch/transformed_vehicles.js', transformedVehicles);

// Now dynamically import transformed files
async function runAudit() {
  const bikesModule = await import('./transformed_bikes.js');
  const vehiclesModule = await import('./transformed_vehicles.js');

  const cars = vehiclesModule.vehicles; // 135 cars
  const bikes = bikesModule.bikes; // 72 bikes

  console.log(`Total Cars loaded: ${cars.length}`);
  console.log(`Total Bikes loaded: ${bikes.length}`);

  // Let's audit all 207 vehicles!
  const allVehicles = [...cars, ...bikes];
  console.log(`Total catalogue models: ${allVehicles.length}`);

  // 1. Check primary image & fallback usage
  let missingPrimaryCount = 0;
  let fallbackPrimaryCount = 0;
  let verifiedPrimaryCount = 0;

  // 2. Check gallery duplicates & length
  let fakeGalleryCount = 0;
  let duplicateGalleryCount = 0;
  let emptyGalleryCount = 0;

  // 3. Check cross-model image reuse
  const imageToVehiclesMap = {}; // imagePath -> Array of vehicle titles

  // 4. File existence & SHA-256 hash checks
  const hashToVehiclesMap = {}; // hash -> Array of vehicle titles
  let missingFileCount = 0;

  const vehicleAuditResults = [];

  for (const v of allVehicles) {
    const title = `${v.brand} ${v.model}`;
    const vehicleType = v.vehicleType || (v.category?.toLowerCase().includes('bike') || v.category?.toLowerCase().includes('scooter') ? 'bike' : 'car');
    
    // Primary image
    const primaryImg = v.images?.primary || v.image;
    const isFallback = typeof primaryImg === 'string' && primaryImg.includes('vehicle-catalogue.png');
    const imageSource = v.imageSource;
    
    let resolvedPath = null;
    let fileExists = false;
    let fileHash = null;

    if (primaryImg && !isFallback) {
      // Resolve relative path to repo root
      let cleanPath = primaryImg;
      if (cleanPath.startsWith('../assets/')) {
        cleanPath = 'src/assets/' + cleanPath.replace('../assets/', '');
      } else if (cleanPath.startsWith('./assets/')) {
        cleanPath = 'src/assets/' + cleanPath.replace('./assets/', '');
      }
      resolvedPath = cleanPath;
      if (fs.existsSync(resolvedPath)) {
        fileExists = true;
        const buf = fs.readFileSync(resolvedPath);
        fileHash = crypto.createHash('sha256').update(buf).digest('hex');

        if (!imageToVehiclesMap[resolvedPath]) imageToVehiclesMap[resolvedPath] = [];
        imageToVehiclesMap[resolvedPath].push(title);

        if (!hashToVehiclesMap[fileHash]) hashToVehiclesMap[fileHash] = [];
        hashToVehiclesMap[fileHash].push(title);
      } else {
        missingFileCount++;
      }
    }

    // Gallery audit
    const gallery = v.images?.gallery || [];
    const uniqueGallery = [...new Set(gallery)];
    const hasDuplicateGallery = gallery.length !== uniqueGallery.length;
    
    // Status determination
    let status = '🟢 VERIFIED';
    const issues = [];

    if (isFallback || !fileExists) {
      status = '⚪ NOT VERIFIED';
      issues.push('Missing or fallback primary image');
      missingPrimaryCount++;
    } else if (imageSource !== 'local-authentic' && imageSource !== 'local-verified') {
      status = '🟡 PARTIAL';
      issues.push(`Unverified imageSource: ${imageSource}`);
    }

    if (hasDuplicateGallery) {
      duplicateGalleryCount++;
      issues.push(`Duplicate entries in gallery: ${gallery.length} total vs ${uniqueGallery.length} unique`);
    }

    vehicleAuditResults.push({
      id: v.id,
      brand: v.brand,
      model: v.model,
      vehicleType,
      primaryImg: resolvedPath || primaryImg,
      galleryCount: gallery.length,
      uniqueGalleryCount: uniqueGallery.length,
      fileExists,
      fileHash,
      status,
      issues
    });
  }

  // Cross-model reuses
  let crossModelReuseCount = 0;
  for (const [imgPath, vehicleList] of Object.entries(imageToVehiclesMap)) {
    if (vehicleList.length > 1) {
      crossModelReuseCount++;
      console.log(`⚠️ Cross-model image reuse detected for asset ${imgPath}: [${vehicleList.join(', ')}]`);
    }
  }

  // Hash reuses (different filenames with same image content)
  let hashReuseCount = 0;
  for (const [hash, vehicleList] of Object.entries(hashToVehiclesMap)) {
    if (vehicleList.length > 1) {
      hashReuseCount++;
      console.log(`⚠️ Identical image content (hash ${hash.slice(0, 8)}) shared across: [${vehicleList.join(', ')}]`);
    }
  }

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total Vehicles: ${allVehicles.length} (Cars: ${cars.length}, Bikes: ${bikes.length})`);
  console.log(`Missing Primary / Fallback: ${missingPrimaryCount}`);
  console.log(`Missing Asset Files: ${missingFileCount}`);
  console.log(`Duplicate Gallery Entries: ${duplicateGalleryCount}`);
  console.log(`Cross-Model Image Asset Reuses: ${crossModelReuseCount}`);
  console.log(`Cross-Model Image Content Hash Reuses: ${hashReuseCount}`);

  // Write detailed audit result to scratch/audit_results.json
  fs.writeFileSync('./scratch/audit_results.json', JSON.stringify(vehicleAuditResults, null, 2));
}

runAudit().catch(err => console.error(err));
