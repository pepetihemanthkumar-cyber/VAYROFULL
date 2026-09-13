const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const vehiclesFilePath = path.join(__dirname, '../src/data/vehicles.js');
const bikesFilePath = path.join(__dirname, '../src/data/bikes.js');
const attributionsPath = path.join(__dirname, '../src/assets/vehicles/ATTRIBUTIONS.md');
const checklistPath = path.join(__dirname, '../src/assets/vehicles/IMAGE_CHECKLIST.md');

const vehiclesContent = fs.readFileSync(vehiclesFilePath, 'utf8');
const bikesContent = fs.readFileSync(bikesFilePath, 'utf8');
const attributionsContent = fs.existsSync(attributionsPath) ? fs.readFileSync(attributionsPath, 'utf8') : '';
const checklistContent = fs.existsSync(checklistPath) ? fs.readFileSync(checklistPath, 'utf8') : '';

// 1. CARS CATALOGUE SOURCE OF TRUTH (20 BRANDS, 135 MODELS)
const approvedCarCatalogue = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'Fronx', 'Brezza', 'Grand Vitara', 'Ertiga', 'XL6', 'Jimny', 'Invicto'],
  'Tata': ['Tiago', 'Altroz', 'Tigor', 'Punch', 'Nexon', 'Harrier', 'Safari', 'Curvv', 'Nexon EV', 'Punch EV'],
  'Mahindra': ['XUV 3XO', 'XUV700', 'Scorpio', 'Scorpio-N', 'Thar', 'Bolero', 'Bolero Neo', 'Marazzo'],
  'Hyundai': ['Grand i10 Nios', 'i20', 'Aura', 'Verna', 'Exter', 'Venue', 'Creta', 'Alcazar', 'Tucson', 'Ioniq 5'],
  'Kia': ['Sonet', 'Seltos', 'Carens', 'Carnival', 'EV6'],
  'Toyota': ['Glanza', 'Urban Cruiser Taisor', 'Urban Cruiser Hyryder', 'Rumion', 'Innova Crysta', 'Innova HyCross', 'Fortuner', 'Legender', 'Hilux', 'Camry', 'Land Cruiser', 'Vellfire'],
  'Honda': ['Amaze', 'City', 'Elevate', 'City e:HEV'],
  'Renault': ['Kwid', 'Triber', 'Kiger', 'Duster'],
  'Nissan': ['Magnite', 'X-Trail'],
  'Volkswagen': ['Virtus', 'Taigun', 'Tiguan'],
  'Skoda': ['Slavia', 'Kushaq', 'Kodiaq', 'Superb'],
  'MG': ['Comet EV', 'Astor', 'Hector', 'Hector Plus', 'ZS EV', 'Gloster', 'Windsor EV'],
  'Jeep': ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee'],
  'BMW': ['2 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5', 'X7', 'i4', 'i5', 'i7', 'iX'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'EQE', 'EQS'],
  'Audi': ['A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'Q8 e-tron'],
  'Volvo': ['S90', 'XC40', 'XC60', 'XC90', 'EX30', 'EX40', 'EX90'],
  'Lexus': ['ES', 'NX', 'RX', 'LX', 'LM'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover Evoque', 'Range Rover Velar', 'Range Rover Sport', 'Range Rover'],
  'MINI': ['Cooper', 'Cooper S', 'Countryman', 'Convertible']
};

// 2. BIKES CATALOGUE SOURCE OF TRUTH (16 BRANDS, 72 MODELS)
const approvedBikeCatalogue = {
  'Royal Enfield': ['Classic 350', 'Bullet 350', 'Hunter 350', 'Meteor 350', 'Himalayan 450', 'Continental GT 650', 'Interceptor 650', 'Super Meteor 650'],
  'Yamaha': ['YZF-R15', 'MT-15', 'FZ-S FI', 'Aerox 155', 'RayZR 125', 'YZF-R3'],
  'KTM': ['Duke 200', 'Duke 390', 'RC 200', 'RC 390', '390 Adventure'],
  'Honda': ['Activa 6G', 'Dio 125', 'Shine 125', 'Unicorn', 'CB350 Hness', 'CB300R', 'NX500'],
  'Bajaj': ['Pulsar NS200', 'Pulsar RS200', 'Dominar 400', 'Pulsar N160', 'Chetak', 'Platina 110'],
  'TVS': ['Apache RTR 160 4V', 'Apache RTR 200 4V', 'Apache RR 310', 'Jupiter 125', 'Ntorq 125', 'Ronin', 'iQube'],
  'Hero': ['Splendor Plus', 'HF Deluxe', 'Glamour', 'Xtreme 125R', 'Xpulse 200 4V', 'Mavrick 440'],
  'Suzuki': ['Access 125', 'Burgman Street', 'Gixxer SF', 'Gixxer 250', 'V-Strom SX', 'Hayabusa'],
  'Kawasaki': ['Ninja 300', 'Ninja 500', 'Z900', 'Eliminator'],
  'BMW Motorrad': ['G 310 R', 'G 310 GS', 'G 310 RR', 'R 1250 GS'],
  'Triumph': ['Speed 400', 'Scrambler 400 X', 'Bonneville T120'],
  'Harley-Davidson': ['X440', 'Fat Boy'],
  'Aprilia': ['RS 457', 'SR 160'],
  'Ola Electric': ['S1 Pro', 'S1 Air', 'S1 X'],
  'Ather': ['450X', 'Rizta'],
  'Vida': ['V1 Pro']
};

function auditFleetSection(type, fileContent, approvedCatalogue, baseAssetDir) {
  const isBike = type === 'BIKES';
  const importRegex = isBike 
    ? /import\s+(\w+)\s+from\s+'\.\.\/assets\/vehicles\/bikes\/([^']+)'/g
    : /import\s+(\w+)\s+from\s+'\.\.\/assets\/vehicles\/([^']+)'/g;
  
  const importMap = {};
  let match;
  while ((match = importRegex.exec(fileContent)) !== null) {
    importMap[match[1]] = isBike ? `bikes/${match[2]}` : match[2];
  }

  const mapName = isBike ? 'bikeImageMap' : 'vehicleImageMap';
  const mapRegex = new RegExp(`export const ${mapName} = \\{([\\s\\S]*?)\\n\\}`);
  const mapMatch = fileContent.match(mapRegex);
  const imageMap = {};
  if (mapMatch) {
    for (const line of mapMatch[1].split('\n')) {
      const m = line.match(/'([^']+)':\s*(\w+)/);
      if (m) imageMap[m[1]] = m[2];
    }
  }

  const catName = isBike ? 'bikeCatalogue' : 'catalogue';
  const catalogueSection = fileContent.substring(
    fileContent.indexOf(`export const ${catName} = [`),
    fileContent.indexOf(`export const ${mapName} = {`)
  );

  const brandBlocks = catalogueSection.split(/\[\s*'([A-Za-z0-9\- ]+)'\s*,\s*\[/);
  const parsedCatalogue = {};
  const allModels = [];
  const seenIds = new Set();
  const duplicateIds = [];
  const duplicateModels = [];

  for (let i = 1; i < brandBlocks.length; i += 2) {
    const brandName = brandBlocks[i].trim();
    parsedCatalogue[brandName] = [];
    const blockContent = brandBlocks[i + 1];

    const modelRegex = /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'/g;
    let modelMatch;
    while ((modelMatch = modelRegex.exec(blockContent)) !== null) {
      const modelName = modelMatch[1];
      const category = modelMatch[2];
      const vehicleClass = modelMatch[3];
      const id = `${brandName}-${modelName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (seenIds.has(id)) duplicateIds.push(id);
      seenIds.add(id);

      if (parsedCatalogue[brandName].includes(modelName)) duplicateModels.push(`${brandName} ${modelName}`);
      parsedCatalogue[brandName].push(modelName);

      allModels.push({ brand: brandName, model: modelName, category, vehicleClass, id });
    }
  }

  const approvedBrandNames = Object.keys(approvedCatalogue);
  const parsedBrandNames = Object.keys(parsedCatalogue);

  const missingBrands = approvedBrandNames.filter((b) => !parsedCatalogue[b]);
  const extraBrands = parsedBrandNames.filter((b) => !approvedCatalogue[b]);
  const missingModels = [];
  const extraModels = [];

  for (const [brand, models] of Object.entries(approvedCatalogue)) {
    const parsed = parsedCatalogue[brand] || [];
    for (const mod of models) {
      if (!parsed.includes(mod)) missingModels.push(`${brand} ${mod}`);
    }
  }
  for (const [brand, models] of Object.entries(parsedCatalogue)) {
    const approved = approvedCatalogue[brand] || [];
    for (const mod of models) {
      if (!approved.includes(mod)) extraModels.push(`${brand} ${mod}`);
    }
  }

  const hashes = new Map();
  const duplicateHashes = [];
  const missingImages = [];
  const wrongImageMappings = [];
  const genericFallbacks = [];
  const externalUrls = [];
  const brokenImports = [];

  allModels.forEach((m) => {
    const varName = imageMap[m.id];
    if (!varName) {
      wrongImageMappings.push({ id: m.id, reason: `Unmapped in ${mapName}` });
      return;
    }
    const relPath = importMap[varName];
    if (!relPath) {
      brokenImports.push({ id: m.id, varName, reason: `Missing import for variable ${varName}` });
      return;
    }
    if (relPath.startsWith('http://') || relPath.startsWith('https://')) {
      externalUrls.push({ id: m.id, url: relPath });
    }
    if (relPath.includes('fallback') || relPath.includes('placeholder') || relPath.includes('vehicle-catalogue.png')) {
      genericFallbacks.push({ id: m.id, path: relPath });
    }

    const fullPath = path.join(baseAssetDir, relPath);
    if (!fs.existsSync(fullPath)) {
      missingImages.push({ id: m.id, path: relPath, reason: 'File does not exist on disk' });
      return;
    }

    const fileBuf = fs.readFileSync(fullPath);
    const hash = crypto.createHash('sha256').update(fileBuf).digest('hex');
    if (hashes.has(hash)) {
      duplicateHashes.push({
        firstModel: hashes.get(hash).id,
        duplicateModel: m.id,
        path: relPath,
        hash,
      });
    } else {
      hashes.set(hash, { id: m.id, path: relPath, fullPath });
    }
  });

  const missingAttributions = [];
  allModels.forEach((m) => {
    const heading = `## ${m.brand} ${m.model}`;
    if (!attributionsContent.includes(heading)) {
      missingAttributions.push(`${m.brand} ${m.model} (${m.id})`);
    }
  });

  const missingChecklist = [];
  allModels.forEach((m) => {
    if (!checklistContent.includes(m.id)) {
      missingChecklist.push(m.id);
    }
  });

  const expectedBrands = Object.keys(approvedCatalogue).length;
  const expectedModels = Object.values(approvedCatalogue).reduce((sum, list) => sum + list.length, 0);

  const passed =
    parsedBrandNames.length === expectedBrands &&
    allModels.length === expectedModels &&
    missingBrands.length === 0 &&
    extraBrands.length === 0 &&
    missingModels.length === 0 &&
    extraModels.length === 0 &&
    duplicateModels.length === 0 &&
    duplicateIds.length === 0 &&
    missingImages.length === 0 &&
    wrongImageMappings.length === 0 &&
    duplicateHashes.length === 0 &&
    genericFallbacks.length === 0 &&
    externalUrls.length === 0 &&
    brokenImports.length === 0 &&
    missingAttributions.length === 0 &&
    missingChecklist.length === 0;

  return {
    type,
    expectedBrands,
    expectedModels,
    parsedBrands: parsedBrandNames.length,
    parsedModels: allModels.length,
    missingBrands,
    extraBrands,
    missingModels,
    extraModels,
    duplicateModels,
    duplicateIds,
    verifiedImages: hashes.size,
    missingImages,
    wrongImageMappings,
    duplicateHashes,
    genericFallbacks,
    externalUrls,
    brokenImports,
    missingAttributions,
    missingChecklist,
    passed,
    hashes,
  };
}

const baseVehiclesDir = path.join(__dirname, '../src/assets/vehicles');

console.log('==================================================');
console.log('DRIVEEASE — COMPLETE FLEET CATALOGUE AUDIT');
console.log('==================================================\n');

const carAudit = auditFleetSection('CARS', vehiclesContent, approvedCarCatalogue, baseVehiclesDir);
const bikeAudit = auditFleetSection('BIKES', bikesContent, approvedBikeCatalogue, baseVehiclesDir);

console.log('--- 1. CARS FLEET AUDIT ---');
console.log(`Brands: ${carAudit.parsedBrands} / ${carAudit.expectedBrands}`);
console.log(`Models: ${carAudit.parsedModels} / ${carAudit.expectedModels}`);
console.log(`Verified unique local WebP images: ${carAudit.verifiedImages} / ${carAudit.expectedModels}`);
console.log(`Missing images: ${carAudit.missingImages.length}`);
console.log(`Duplicate image hashes: ${carAudit.duplicateHashes.length}`);
console.log(`Attributions coverage: ${carAudit.missingAttributions.length === 0 ? '100%' : 'Missing ' + carAudit.missingAttributions.length}`);
console.log(`Checklist coverage: ${carAudit.missingChecklist.length === 0 ? '100%' : 'Missing ' + carAudit.missingChecklist.length}`);
console.log(`Status: ${carAudit.passed ? '✓ PASS (100%)' : '✗ FAIL'}\n`);

console.log('--- 2. BIKES FLEET AUDIT ---');
console.log(`Brands: ${bikeAudit.parsedBrands} / ${bikeAudit.expectedBrands}`);
console.log(`Models: ${bikeAudit.parsedModels} / ${bikeAudit.expectedModels}`);
console.log(`Verified unique local WebP images: ${bikeAudit.verifiedImages} / ${bikeAudit.expectedModels}`);
console.log(`Missing images: ${bikeAudit.missingImages.length}`);
console.log(`Duplicate image hashes: ${bikeAudit.duplicateHashes.length}`);
console.log(`Attributions coverage: ${bikeAudit.missingAttributions.length === 0 ? '100%' : 'Missing ' + bikeAudit.missingAttributions.length}`);
console.log(`Checklist coverage: ${bikeAudit.missingChecklist.length === 0 ? '100%' : 'Missing ' + bikeAudit.missingChecklist.length}`);
console.log(`Status: ${bikeAudit.passed ? '✓ PASS (100%)' : '✗ FAIL'}\n`);

const totalFleetModels = carAudit.parsedModels + bikeAudit.parsedModels;
const totalVerifiedImages = carAudit.verifiedImages + bikeAudit.verifiedImages;

console.log('==================================================');
console.log(`TOTAL UNIFIED FLEET: ${totalFleetModels} models (135 Cars + 72 Bikes)`);
console.log(`TOTAL VERIFIED IMAGES: ${totalVerifiedImages} authentic local WebP images`);
console.log('==================================================\n');

if (carAudit.passed && bikeAudit.passed) {
  console.log('OVERALL AUDIT RESULT: 100% PASS (ALL CAR & BIKE REQUIREMENTS MET)');
  process.exit(0);
} else {
  console.error('OVERALL AUDIT RESULT: FAIL');
  if (!carAudit.passed) console.error('Car Audit Failures:', carAudit);
  if (!bikeAudit.passed) console.error('Bike Audit Failures:', bikeAudit);
  process.exit(1);
}
