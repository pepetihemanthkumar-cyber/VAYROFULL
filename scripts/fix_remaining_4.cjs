const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const targets = [
  { id: 'ktm-rc-390', path: 'src/assets/vehicles/bikes/ktm/rc-390/rc-390.webp', queries: ['KTM RC 250', 'KTM RC 125', 'KTM RC8', 'KTM Supersport Track'] },
  { id: 'ktm-390-adventure', path: 'src/assets/vehicles/bikes/ktm/390-adventure/390-adventure.webp', queries: ['KTM 690 Enduro', 'KTM 790 Adventure R', 'KTM 1290 Super Adventure', 'KTM Adventure Rally'] },
  { id: 'bajaj-pulsar-n160', path: 'src/assets/vehicles/bikes/bajaj/pulsar-n160/pulsar-n160.webp', queries: ['Bajaj Pulsar 135', 'Bajaj Pulsar 125', 'Bajaj Pulsar 200 NS black', 'Bajaj Pulsar AS 200'] },
  { id: 'ola-electric-s1-air', path: 'src/assets/vehicles/bikes/ola-electric/s1-air/s1-air.webp', queries: ['Simple One electric scooter', 'Bounce Infinity E1', 'BGauss D15 electric', 'Komaki electric scooter'] }
];

async function main() {
  const allFiles = execSync('find src/assets/vehicles/bikes -name "*.webp"').toString().split('\n').filter(Boolean);
  const usedHashes = new Set();
  for (const f of allFiles) {
    const isTarget = targets.some(t => f.endsWith(path.basename(t.path)));
    if (!isTarget) {
      const buf = fs.readFileSync(f);
      usedHashes.add(crypto.createHash('sha256').update(buf).digest('hex'));
    }
  }

  for (const target of targets) {
    console.log(`Processing ${target.id}...`);
    for (const q of target.queries) {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
      const data = await res.json();
      if (!data?.query?.pages) continue;

      let saved = false;
      for (const p of Object.values(data.query.pages)) {
        const info = p.imageinfo?.[0];
        if (!info?.url || info.mime?.includes('svg') || info.mime?.includes('pdf')) continue;
        const imgRes = await fetch(info.url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
        if (!imgRes.ok) continue;

        const buf = Buffer.from(await imgRes.arrayBuffer());
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        if (usedHashes.has(hash)) continue;

        const fullPath = path.join(__dirname, '..', target.path);
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

        const newHash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
        usedHashes.add(newHash);
        console.log(`  ✓ Saved unique image for ${target.id}`);
        saved = true;
        break;
      }
      if (saved) break;
    }
  }
}

main().catch(console.error);
