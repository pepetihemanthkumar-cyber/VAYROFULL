const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

async function getUniqueImageFor(targetRel, query, excludeHashes) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0 (fleet@driveease.internal)' } });
  const data = await res.json();
  if (!data?.query?.pages) return false;

  for (const page of Object.values(data.query.pages)) {
    const info = page.imageinfo?.[0];
    if (!info?.url || info.mime?.includes('svg') || info.mime?.includes('pdf') || info.mime?.includes('tiff')) continue;

    console.log(`Trying candidate ${info.url}...`);
    try {
      const imgRes = await fetch(info.url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0 (fleet@driveease.internal)' } });
      if (!imgRes.ok) continue;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      if (excludeHashes.has(hash)) {
        console.log(`  Duplicate hash, skipping.`);
        continue;
      }

      const fullPath = path.join(__dirname, '..', targetRel);
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

      const savedHash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
      excludeHashes.add(savedHash);
      console.log(`✓ Saved distinct image for ${targetRel}`);
      return true;
    } catch (e) {
      console.error(e.message);
    }
  }
  return false;
}

async function main() {
  const allFiles = execSync('find src/assets/vehicles/bikes -name "*.webp"').toString().split('\n').filter(Boolean);
  const excludeHashes = new Set();
  for (const f of allFiles) {
    if (!f.includes('rc-390') && !f.includes('pulsar-n160') && !f.includes('s1-air')) {
      const buf = fs.readFileSync(f);
      excludeHashes.add(crypto.createHash('sha256').update(buf).digest('hex'));
    }
  }

  await getUniqueImageFor('src/assets/vehicles/bikes/ktm/rc-390/rc-390.webp', 'KTM RC', excludeHashes);
  await getUniqueImageFor('src/assets/vehicles/bikes/bajaj/pulsar-n160/pulsar-n160.webp', 'Bajaj Pulsar 180 OR Bajaj Pulsar 220', excludeHashes);
  await getUniqueImageFor('src/assets/vehicles/bikes/ola-electric/s1-air/s1-air.webp', 'electric scooter moped', excludeHashes);
}

main().catch(console.error);
