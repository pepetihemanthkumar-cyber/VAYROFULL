const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const filesToFetch = [
  {
    targetRel: 'src/assets/vehicles/bikes/ktm/rc-390/rc-390.webp',
    commonsTitle: 'File:2018 KTM RC 390 1.jpg'
  },
  {
    targetRel: 'src/assets/vehicles/bikes/bajaj/pulsar-n160/pulsar-n160.webp',
    commonsTitle: 'File:Bajaj Pulsar 220 DTS-i.jpg'
  },
  {
    targetRel: 'src/assets/vehicles/bikes/ola-electric/s1-air/s1-air.webp',
    commonsTitle: 'File:Ampere Magnus EX Electric Scooter.jpg'
  }
];

async function main() {
  for (const item of filesToFetch) {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(item.commonsTitle)}&prop=imageinfo&iiprop=url|size&format=json`;
    console.log(`Querying ${apiUrl}...`);
    const res = await fetch(apiUrl, { headers: { 'User-Agent': 'DriveEaseFleetBot/2.0 (fleet@driveease.internal)' } });
    const data = await res.json();
    const page = Object.values(data.query.pages)[0];
    const url = page.imageinfo?.[0]?.url;
    if (!url) {
      console.error(`No url found for ${item.commonsTitle}`);
      continue;
    }
    console.log(`Downloading ${url}...`);
    const imgRes = await fetch(url, { headers: { 'User-Agent': 'DriveEaseFleetBot/2.0 (fleet@driveease.internal)' } });
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const fullPath = path.join(__dirname, '..', item.targetRel);
    const tmp = fullPath + '.tmp.jpg';
    fs.writeFileSync(tmp, buf);
    try {
      execSync(`/usr/bin/sips -s format webp "${tmp}" --out "${fullPath}" > /dev/null 2>&1`);
    } catch (e) {
      const pngPath = fullPath.replace(/\.webp$/, '.png');
      execSync(`/usr/bin/sips -s format png "${tmp}" --out "${pngPath}" > /dev/null 2>&1`);
      fs.renameSync(pngPath, fullPath);
    }
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    console.log(`✓ Saved ${item.targetRel}`);
  }
}

main().catch(console.error);
