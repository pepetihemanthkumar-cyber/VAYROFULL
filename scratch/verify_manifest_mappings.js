import fs from 'fs';
import vm from 'vm';

const manifestCode = fs.readFileSync('./src/data/vehicleImageAssetManifest.js', 'utf8');
const auditReport = JSON.parse(fs.readFileSync('./scratch/final_621_audit_report.json', 'utf8'));

// We have full audit report with all 207 vehicle objects!
const vehiclesMock = auditReport.detailedResults.map(r => ({
  id: r.id,
  brand: r.brand,
  model: r.model,
  category: r.vehicleType,
  class: 'Standard',
  imageSource: 'local-verified',
  image: `src/assets/vehicles/${r.id}/${r.id}-front.webp`,
  images: {
    primary: `src/assets/vehicles/${r.id}/${r.id}-front.webp`,
    gallery: [
      `src/assets/vehicles/${r.id}/${r.id}-front.webp`,
      `src/assets/vehicles/${r.id}/${r.id}-rear.webp`,
      `src/assets/vehicles/${r.id}/${r.id}-side.webp`
    ]
  }
}));

const manifestContext = {
  console, Object, Array, Math, String, Number, Boolean, Set, Map,
  vehicles: vehiclesMock
};
vm.createContext(manifestContext);
let manifestClean = manifestCode
  .replace(/import\s+[\s\S]*?\s+from\s+['"]\.\/vehicles['"];?/, '')
  .replace(/export\s+const\s+/g, 'var ');

vm.runInContext(manifestClean, manifestContext);

const manifest = manifestContext.vehicleImageAssetManifest;
console.log('Manifest entry count:', manifest.length);

let brokenMappings = 0;
let invalidGalleryCount = 0;
let crossModelMappings = 0;
const assetToVehicleId = {};

for (const entry of manifest) {
  if (!entry.vehicleId || !entry.gallery || entry.gallery.length !== 3) {
    invalidGalleryCount++;
    console.log(`❌ Invalid gallery count for ${entry.vehicleId}: ${entry.gallery?.length}`);
  }

  for (const assetPath of entry.gallery) {
    if (assetToVehicleId[assetPath] && assetToVehicleId[assetPath] !== entry.vehicleId) {
      crossModelMappings++;
      console.log(`❌ Cross-model mapping: ${assetPath} used by ${assetToVehicleId[assetPath]} and ${entry.vehicleId}`);
    }
    assetToVehicleId[assetPath] = entry.vehicleId;
  }
}

console.log(`Summary:`);
console.log(`- Manifest Entry Count: ${manifest.length}`);
console.log(`- Invalid Gallery Count: ${invalidGalleryCount}`);
console.log(`- Broken Mappings: ${brokenMappings}`);
console.log(`- Cross-Model Mappings: ${crossModelMappings}`);
