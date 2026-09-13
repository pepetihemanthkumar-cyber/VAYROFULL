const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const directUrls = [
  {
    id: 'ktm-rc-390',
    path: 'src/assets/vehicles/bikes/ktm/rc-390/rc-390.webp',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/e/ec/2016_KTM_RC_390_Cup.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/52/KTM_RC_390_Cup_2015.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/42/KTM_RC8_R_2010.jpg'
    ]
  },
  {
    id: 'bajaj-pulsar-n160',
    path: 'src/assets/vehicles/bikes/bajaj/pulsar-n160/pulsar-n160.webp',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/6/6b/Bajaj_Pulsar_150_DTS-i_Rear.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Bajaj_Pulsar_220_DTS-Fi.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/af/Bajaj_Pulsar_UG3.jpg'
    ]
  },
  {
    id: 'ola-electric-s1-air',
    path: 'src/assets/vehicles/bikes/ola-electric/s1-air/s1-air.webp',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/2/23/Ola_S1_Pro_Gen_1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/ec/Electric_scooter_in_traffic.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a2/Smart_EV_scooter_2023.jpg'
    ]
  }
];

async function main() {
  const allFiles = execSync('find src/assets/vehicles/bikes -name "*.webp"').toString().split('\n').filter(Boolean);
  const usedHashes = new Set();
  for (const f of allFiles) {
    if (!directUrls.some(t => f.endsWith(path.basename(t.path)))) {
      const buf = fs.readFileSync(f);
      usedHashes.add(crypto.createHash('sha256').update(buf).digest('hex'));
    }
  }

  for (const item of directUrls) {
    let saved = false;
    for (const u of item.urls) {
      console.log(`Trying ${u} for ${item.id}...`);
      try {
        const res = await fetch(u, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        if (usedHashes.has(hash)) continue;

        const fullPath = path.join(__dirname, '..', item.path);
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
        console.log(`  ✓ Successfully saved ${item.id}`);
        saved = true;
        break;
      } catch (e) {
        console.error(`  Error for ${u}:`, e.message);
      }
    }
    if (!saved) {
      // Fallback search
      const q = item.id.replace(/-/g, ' ');
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&format=json`;
      const res = await fetch(searchUrl, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
      const data = await res.json();
      if (data?.query?.pages) {
        for (const p of Object.values(data.query.pages)) {
          const info = p.imageinfo?.[0];
          if (!info?.url || info.mime?.includes('svg')) continue;
          const imgRes = await fetch(info.url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
          if (!imgRes.ok) continue;
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const hash = crypto.createHash('sha256').update(buf).digest('hex');
          if (usedHashes.has(hash)) continue;

          const fullPath = path.join(__dirname, '..', item.path);
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
          console.log(`  ✓ Saved via fallback search for ${item.id}`);
          break;
        }
      }
    }
  }
}

main().catch(console.error);
