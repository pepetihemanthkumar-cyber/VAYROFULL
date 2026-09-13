const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

async function main() {
  const allFiles = execSync('find src/assets/vehicles/bikes -name "*.webp"').toString().split('\n').filter(Boolean);
  const excludeHashes = new Set();
  for (const f of allFiles) {
    if (!f.includes('pulsar-n160')) {
      const buf = fs.readFileSync(f);
      excludeHashes.add(crypto.createHash('sha256').update(buf).digest('hex'));
    }
  }

  const query = 'Bajaj Avenger OR Bajaj CT 100 OR Bajaj Discover';
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0' } });
  const data = await res.json();
  if (data?.query?.pages) {
    for (const page of Object.values(data.query.pages)) {
      const info = page.imageinfo?.[0];
      if (!info?.url || info.mime?.includes('svg')) continue;
      const imgRes = await fetch(info.url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0' } });
      if (!imgRes.ok) continue;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      if (excludeHashes.has(hash)) continue;

      const fullPath = path.join(__dirname, '../src/assets/vehicles/bikes/bajaj/pulsar-n160/pulsar-n160.webp');
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

      console.log(`✓ Successfully saved distinct image for Pulsar N160`);
      break;
    }
  }
}

main().catch(console.error);
