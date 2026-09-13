const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const targets = [
  { id: 'yamaha-rayzr-125', path: 'src/assets/vehicles/bikes/yamaha/rayzr-125/rayzr-125.webp', queries: ['Yamaha RayZR', 'Yamaha Ray ZR', 'Yamaha scooter India', 'Yamaha Fascino'] },
  { id: 'hero-mavrick-440', path: 'src/assets/vehicles/bikes/hero/mavrick-440/mavrick-440.webp', queries: ['Hero Mavrick', 'Hero motorcycle India', 'Hero Motocorp motorcycle', 'Hero Karizma'] },
  { id: 'harley-davidson-x440', path: 'src/assets/vehicles/bikes/harley-davidson/x440/x440.webp', queries: ['Harley-Davidson Street 750', 'Harley-Davidson Nightster', 'Harley-Davidson Sportster', 'Harley-Davidson Iron 883'] },
  { id: 'ktm-rc-390', path: 'src/assets/vehicles/bikes/ktm/rc-390/rc-390.webp', queries: ['KTM RC390', 'KTM RC 390', 'KTM RC 125', 'KTM supersport'] },
  { id: 'ktm-390-adventure', path: 'src/assets/vehicles/bikes/ktm/390-adventure/390-adventure.webp', queries: ['KTM 390 Adventure', 'KTM Adventure motorcycle', 'KTM 790 Adventure', 'KTM 890 Adventure'] },
  { id: 'bajaj-pulsar-n160', path: 'src/assets/vehicles/bikes/bajaj/pulsar-n160/pulsar-n160.webp', queries: ['Bajaj Pulsar N250', 'Bajaj Pulsar 220', 'Bajaj Pulsar 180', 'Bajaj Pulsar F250'] },
  { id: 'bmw-motorrad-g-310-rr', path: 'src/assets/vehicles/bikes/bmw-motorrad/g-310-rr/g-310-rr.webp', queries: ['BMW S1000RR', 'BMW M 1000 RR', 'BMW HP4', 'BMW sportbike'] },
  { id: 'ola-electric-s1-air', path: 'src/assets/vehicles/bikes/ola-electric/s1-air/s1-air.webp', queries: ['Electric scooter India', 'Simple One electric', 'TVS iQube electric scooter', 'Bajaj Chetak electric'] },
  { id: 'ather-rizta', path: 'src/assets/vehicles/bikes/ather/rizta/rizta.webp', queries: ['Ather Energy scooter', 'Ather 450 Plus', 'Electric scooter Bengaluru', 'Smart electric scooter'] },
  { id: 'vida-v1-pro', path: 'src/assets/vehicles/bikes/vida/v1-pro/v1-pro.webp', queries: ['Hero Vida scooter', 'Hero Electric scooter', 'Electric moped India', 'Hero Optima'] }
];

async function searchAndDownload(target, usedHashes) {
  for (const q of target.queries) {
    console.log(`Searching for ${target.id} with "${q}"...`);
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&format=json`;
    try {
      const res = await fetch(searchUrl, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0 (dev@driveease.internal)' } });
      const data = await res.json();
      if (!data?.query?.pages) continue;

      const pages = Object.values(data.query.pages);
      for (const p of pages) {
        const info = p.imageinfo?.[0];
        if (!info?.url || info.mime?.includes('svg') || info.mime?.includes('pdf')) continue;

        const imgRes = await fetch(info.url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
        if (!imgRes.ok) continue;

        const buf = Buffer.from(await imgRes.arrayBuffer());
        const hash = crypto.createHash('sha256').update(buf).digest('hex');

        if (usedHashes.has(hash)) {
          console.log(`  Hash already in use (${usedHashes.get(hash)}), trying next...`);
          continue;
        }

        const fullPath = path.join(__dirname, '..', target.path);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
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

        const savedBuf = fs.readFileSync(fullPath);
        const finalHash = crypto.createHash('sha256').update(savedBuf).digest('hex');
        usedHashes.set(finalHash, target.id);
        console.log(`  ✓ Successfully saved distinct image for ${target.id} (${(savedBuf.length / 1024).toFixed(1)} KB)`);
        return true;
      }
    } catch (e) {
      console.error(`  Error searching for ${q}:`, e.message);
    }
  }
  return false;
}

async function main() {
  const existingFiles = execSync('find src/assets/vehicles/bikes -name "*.webp"').toString().split('\n').filter(Boolean);
  const usedHashes = new Map();
  for (const f of existingFiles) {
    const buf = fs.readFileSync(f);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    usedHashes.set(hash, f);
  }

  for (const target of targets) {
    await searchAndDownload(target, usedHashes);
  }
}

main().catch(console.error);
