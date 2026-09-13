const fs = require('fs');
const vm = require('vm');

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

console.log('Cars count:', cars.length);
console.log('Bikes count:', bikes.length);
console.log('Total count:', allVehicles.length);

fs.writeFileSync('./scratch/catalog_split.json', JSON.stringify({
  cars: cars.map(c => ({ id: c.id, brand: c.brand, model: c.model, category: c.category, class: c.class, gallery: c.images?.gallery })),
  bikes: bikes.map(b => ({ id: b.id, brand: b.brand, model: b.model, category: b.category, class: b.class, gallery: b.images?.gallery }))
}, null, 2));

console.log('Catalog split successfully written to scratch/catalog_split.json');
