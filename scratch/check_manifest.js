import fs from 'fs';
import vm from 'vm';

const manifestCode = fs.readFileSync('./src/data/vehicleImageAssetManifest.js', 'utf8');
const auditReport = JSON.parse(fs.readFileSync('./scratch/catalogue_audit_report.json', 'utf8'));

// We have auditReport containing all 207 vehicle objects with their status!
console.log('Total vehicles from full audit:', auditReport.summary.total);
console.log('Cars:', auditReport.summary.cars);
console.log('Bikes:', auditReport.summary.bikes);

// Now test manifest transformation with mock vehicles array
const vehiclesMock = auditReport.results.map(r => ({
  id: r.id,
  brand: r.brand,
  model: r.model,
  category: r.vehicleType,
  class: 'Standard',
  imageSource: 'local-verified',
  images: { primary: r.primaryAsset },
  image: r.primaryAsset
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

console.log('Manifest Context Keys:', Object.keys(manifestContext).filter(k => !['console','Object','Array','Math','String','Number','Boolean','Set','Map','vehicles'].includes(k)));
console.log('Manifest entries count:', manifestContext.vehicleImageAssetManifest?.length);

console.log('Verified status count:', manifestContext.vehicleImageAssetManifest.filter(e => e.status === 'verified').length);
console.log('Sample manifest entry:', manifestContext.vehicleImageAssetManifest[0]);
