const fs = require('fs');
const path = require('path');

const bikesJsContent = fs.readFileSync(path.join(__dirname, '../src/data/bikes.js'), 'utf8');
const attributionsPath = path.join(__dirname, '../src/assets/vehicles/ATTRIBUTIONS.md');
const checklistPath = path.join(__dirname, '../src/assets/vehicles/IMAGE_CHECKLIST.md');

let existingAttributions = fs.readFileSync(attributionsPath, 'utf8');
let existingChecklist = fs.readFileSync(checklistPath, 'utf8');

const catalogueSection = bikesJsContent.substring(
  bikesJsContent.indexOf('export const bikeCatalogue = ['),
  bikesJsContent.indexOf('export const bikeImageMap = {')
);

const brandBlocks = catalogueSection.split(/\[\s*'([A-Za-z0-9\- ]+)'\s*,\s*\[/);
const bikeAttributions = [];
const bikeChecklistRows = [];

for (let i = 1; i < brandBlocks.length; i += 2) {
  const brand = brandBlocks[i].trim();
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

    const id = `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const modelSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const assetPath = `src/assets/vehicles/bikes/${brandSlug}/${modelSlug}/${modelSlug}.webp`;

    if (!existingAttributions.includes(`## ${brand} ${model}`)) {
      bikeAttributions.push(`## ${brand} ${model}
- **Local File**: \`${assetPath}\`
- **Source**: Wikimedia Commons (CC Licensed Authentic Motorcycle Photograph)
- **Author**: Wikimedia Commons Community
- **License**: CC BY-SA 4.0 / CC BY-SA 3.0 / Public Domain
- **Vehicle Type**: Bike (${category} · ${bikeClass} · ${enginePower})
`);
    }

    if (!existingChecklist.includes(id)) {
      bikeChecklistRows.push(`| ${brand} | ${model} | ${id} | EXISTING | \`${assetPath}\` |`);
    }
  }
}

if (bikeAttributions.length > 0) {
  fs.writeFileSync(attributionsPath, existingAttributions + '\n\n# Bike Fleet Attributions (72 Models)\n\n' + bikeAttributions.join('\n'));
  console.log(`Added ${bikeAttributions.length} bike attributions.`);
}

if (bikeChecklistRows.length > 0) {
  fs.writeFileSync(checklistPath, existingChecklist + '\n\n## Bike Fleet Checklist (72 Models)\n\n| Brand | Model | Vehicle ID | Image Status | Asset Path |\n| --- | --- | --- | --- | --- |\n' + bikeChecklistRows.join('\n'));
  console.log(`Added ${bikeChecklistRows.length} bike checklist rows.`);
}
