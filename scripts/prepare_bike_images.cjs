const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const bikesList = [
  // Royal Enfield (8)
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Classic 350', modelSlug: 'classic-350', search: '"Royal Enfield Classic 350"' },
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Bullet 350', modelSlug: 'bullet-350', search: '"Royal Enfield Bullet 350"' },
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Hunter 350', modelSlug: 'hunter-350', search: '"Royal Enfield Hunter 350"' },
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Meteor 350', modelSlug: 'meteor-350', search: '"Royal Enfield Meteor 350"' },
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Himalayan 450', modelSlug: 'himalayan-450', search: '"Royal Enfield Himalayan"' },
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Continental GT 650', modelSlug: 'continental-gt-650', search: '"Royal Enfield Continental GT 650"' },
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Interceptor 650', modelSlug: 'interceptor-650', search: '"Royal Enfield Interceptor 650"' },
  { brand: 'Royal Enfield', brandSlug: 'royal-enfield', model: 'Super Meteor 650', modelSlug: 'super-meteor-650', search: '"Royal Enfield Super Meteor 650"' },

  // Yamaha (6)
  { brand: 'Yamaha', brandSlug: 'yamaha', model: 'YZF-R15', modelSlug: 'yzf-r15', search: '"Yamaha YZF-R15"' },
  { brand: 'Yamaha', brandSlug: 'yamaha', model: 'MT-15', modelSlug: 'mt-15', search: '"Yamaha MT-15"' },
  { brand: 'Yamaha', brandSlug: 'yamaha', model: 'FZ-S FI', modelSlug: 'fz-s-fi', search: '"Yamaha FZ-S"' },
  { brand: 'Yamaha', brandSlug: 'yamaha', model: 'Aerox 155', modelSlug: 'aerox-155', search: '"Yamaha Aerox 155"' },
  { brand: 'Yamaha', brandSlug: 'yamaha', model: 'RayZR 125', modelSlug: 'rayzr-125', search: '"Yamaha RayZR"' },
  { brand: 'Yamaha', brandSlug: 'yamaha', model: 'YZF-R3', modelSlug: 'yzf-r3', search: '"Yamaha YZF-R3"' },

  // KTM (5)
  { brand: 'KTM', brandSlug: 'ktm', model: 'Duke 200', modelSlug: 'duke-200', search: '"KTM 200 Duke"' },
  { brand: 'KTM', brandSlug: 'ktm', model: 'Duke 390', modelSlug: 'duke-390', search: '"KTM 390 Duke"' },
  { brand: 'KTM', brandSlug: 'ktm', model: 'RC 200', modelSlug: 'rc-200', search: '"KTM RC 200"' },
  { brand: 'KTM', brandSlug: 'ktm', model: 'RC 390', modelSlug: 'rc-390', search: '"KTM RC 390"' },
  { brand: 'KTM', brandSlug: 'ktm', model: '390 Adventure', modelSlug: '390-adventure', search: '"KTM 390 Adventure"' },

  // Honda (7)
  { brand: 'Honda', brandSlug: 'honda', model: 'Activa 6G', modelSlug: 'activa-6g', search: '"Honda Activa"' },
  { brand: 'Honda', brandSlug: 'honda', model: 'Dio 125', modelSlug: 'dio-125', search: '"Honda Dio"' },
  { brand: 'Honda', brandSlug: 'honda', model: 'Shine 125', modelSlug: 'shine-125', search: '"Honda CB Shine"' },
  { brand: 'Honda', brandSlug: 'honda', model: 'Unicorn', modelSlug: 'unicorn', search: '"Honda CB Unicorn"' },
  { brand: 'Honda', brandSlug: 'honda', model: 'CB350 Hness', modelSlug: 'cb350-hness', search: '"Honda Hness CB350" OR "Honda CB350"' },
  { brand: 'Honda', brandSlug: 'honda', model: 'CB300R', modelSlug: 'cb300r', search: '"Honda CB300R"' },
  { brand: 'Honda', brandSlug: 'honda', model: 'NX500', modelSlug: 'nx500', search: '"Honda NX500" OR "Honda CB500X"' },

  // Bajaj (6)
  { brand: 'Bajaj', brandSlug: 'bajaj', model: 'Pulsar NS200', modelSlug: 'pulsar-ns200', search: '"Bajaj Pulsar NS200"' },
  { brand: 'Bajaj', brandSlug: 'bajaj', model: 'Pulsar RS200', modelSlug: 'pulsar-rs200', search: '"Bajaj Pulsar RS200"' },
  { brand: 'Bajaj', brandSlug: 'bajaj', model: 'Dominar 400', modelSlug: 'dominar-400', search: '"Bajaj Dominar 400"' },
  { brand: 'Bajaj', brandSlug: 'bajaj', model: 'Pulsar N160', modelSlug: 'pulsar-n160', search: '"Bajaj Pulsar N160" OR "Bajaj Pulsar 150"' },
  { brand: 'Bajaj', brandSlug: 'bajaj', model: 'Chetak', modelSlug: 'chetak', search: '"Bajaj Chetak" electric scooter' },
  { brand: 'Bajaj', brandSlug: 'bajaj', model: 'Platina 110', modelSlug: 'platina-110', search: '"Bajaj Platina"' },

  // TVS (7)
  { brand: 'TVS', brandSlug: 'tvs', model: 'Apache RTR 160 4V', modelSlug: 'apache-rtr-160-4v', search: '"TVS Apache RTR 160"' },
  { brand: 'TVS', brandSlug: 'tvs', model: 'Apache RTR 200 4V', modelSlug: 'apache-rtr-200-4v', search: '"TVS Apache RTR 200"' },
  { brand: 'TVS', brandSlug: 'tvs', model: 'Apache RR 310', modelSlug: 'apache-rr-310', search: '"TVS Apache RR 310"' },
  { brand: 'TVS', brandSlug: 'tvs', model: 'Jupiter 125', modelSlug: 'jupiter-125', search: '"TVS Jupiter"' },
  { brand: 'TVS', brandSlug: 'tvs', model: 'Ntorq 125', modelSlug: 'ntorq-125', search: '"TVS NTORQ"' },
  { brand: 'TVS', brandSlug: 'tvs', model: 'Ronin', modelSlug: 'ronin', search: '"TVS Ronin"' },
  { brand: 'TVS', brandSlug: 'tvs', model: 'iQube', modelSlug: 'iqube', search: '"TVS iQube"' },

  // Hero (6)
  { brand: 'Hero', brandSlug: 'hero', model: 'Splendor Plus', modelSlug: 'splendor-plus', search: '"Hero Splendor"' },
  { brand: 'Hero', brandSlug: 'hero', model: 'HF Deluxe', modelSlug: 'hf-deluxe', search: '"Hero HF Deluxe"' },
  { brand: 'Hero', brandSlug: 'hero', model: 'Glamour', modelSlug: 'glamour', search: '"Hero Glamour"' },
  { brand: 'Hero', brandSlug: 'hero', model: 'Xtreme 125R', modelSlug: 'xtreme-125r', search: '"Hero Xtreme"' },
  { brand: 'Hero', brandSlug: 'hero', model: 'Xpulse 200 4V', modelSlug: 'xpulse-200-4v', search: '"Hero XPulse 200"' },
  { brand: 'Hero', brandSlug: 'hero', model: 'Mavrick 440', modelSlug: 'mavrick-440', search: '"Hero Mavrick 440" OR "Harley-Davidson X440"' },

  // Suzuki (6)
  { brand: 'Suzuki', brandSlug: 'suzuki', model: 'Access 125', modelSlug: 'access-125', search: '"Suzuki Access 125"' },
  { brand: 'Suzuki', brandSlug: 'suzuki', model: 'Burgman Street', modelSlug: 'burgman-street', search: '"Suzuki Burgman Street" OR "Suzuki Burgman 125"' },
  { brand: 'Suzuki', brandSlug: 'suzuki', model: 'Gixxer SF', modelSlug: 'gixxer-sf', search: '"Suzuki Gixxer SF"' },
  { brand: 'Suzuki', brandSlug: 'suzuki', model: 'Gixxer 250', modelSlug: 'gixxer-250', search: '"Suzuki Gixxer 250"' },
  { brand: 'Suzuki', brandSlug: 'suzuki', model: 'V-Strom SX', modelSlug: 'v-strom-sx', search: '"Suzuki V-Strom 250"' },
  { brand: 'Suzuki', brandSlug: 'suzuki', model: 'Hayabusa', modelSlug: 'hayabusa', search: '"Suzuki Hayabusa" GSX1300R' },

  // Kawasaki (4)
  { brand: 'Kawasaki', brandSlug: 'kawasaki', model: 'Ninja 300', modelSlug: 'ninja-300', search: '"Kawasaki Ninja 300"' },
  { brand: 'Kawasaki', brandSlug: 'kawasaki', model: 'Ninja 500', modelSlug: 'ninja-500', search: '"Kawasaki Ninja 400" OR "Kawasaki Ninja 500"' },
  { brand: 'Kawasaki', brandSlug: 'kawasaki', model: 'Z900', modelSlug: 'z900', search: '"Kawasaki Z900"' },
  { brand: 'Kawasaki', brandSlug: 'kawasaki', model: 'Eliminator', modelSlug: 'eliminator', search: '"Kawasaki Eliminator"' },

  // BMW Motorrad (4)
  { brand: 'BMW Motorrad', brandSlug: 'bmw-motorrad', model: 'G 310 R', modelSlug: 'g-310-r', search: '"BMW G310R"' },
  { brand: 'BMW Motorrad', brandSlug: 'bmw-motorrad', model: 'G 310 GS', modelSlug: 'g-310-gs', search: '"BMW G310GS"' },
  { brand: 'BMW Motorrad', brandSlug: 'bmw-motorrad', model: 'G 310 RR', modelSlug: 'g-310-rr', search: '"BMW G 310 RR" OR "TVS Apache RR 310"' },
  { brand: 'BMW Motorrad', brandSlug: 'bmw-motorrad', model: 'R 1250 GS', modelSlug: 'r-1250-gs', search: '"BMW R1250GS"' },

  // Triumph (3)
  { brand: 'Triumph', brandSlug: 'triumph', model: 'Speed 400', modelSlug: 'speed-400', search: '"Triumph Speed 400"' },
  { brand: 'Triumph', brandSlug: 'triumph', model: 'Scrambler 400 X', modelSlug: 'scrambler-400-x', search: '"Triumph Scrambler 400 X"' },
  { brand: 'Triumph', brandSlug: 'triumph', model: 'Bonneville T120', modelSlug: 'bonneville-t120', search: '"Triumph Bonneville T120"' },

  // Harley-Davidson (2)
  { brand: 'Harley-Davidson', brandSlug: 'harley-davidson', model: 'X440', modelSlug: 'x440', search: '"Harley-Davidson X440"' },
  { brand: 'Harley-Davidson', brandSlug: 'harley-davidson', model: 'Fat Boy', modelSlug: 'fat-boy', search: '"Harley-Davidson Fat Boy"' },

  // Aprilia (2)
  { brand: 'Aprilia', brandSlug: 'aprilia', model: 'RS 457', modelSlug: 'rs-457', search: '"Aprilia RS 457"' },
  { brand: 'Aprilia', brandSlug: 'aprilia', model: 'SR 160', modelSlug: 'sr-160', search: '"Aprilia SR 150" OR "Aprilia SR 160"' },

  // Ola Electric (3)
  { brand: 'Ola Electric', brandSlug: 'ola-electric', model: 'S1 Pro', modelSlug: 's1-pro', search: '"Ola S1 Pro"' },
  { brand: 'Ola Electric', brandSlug: 'ola-electric', model: 'S1 Air', modelSlug: 's1-air', search: '"Ola S1 Air"' },
  { brand: 'Ola Electric', brandSlug: 'ola-electric', model: 'S1 X', modelSlug: 's1-x', search: '"Ola S1" electric' },

  // Ather (2)
  { brand: 'Ather', brandSlug: 'ather', model: '450X', modelSlug: '450x', search: '"Ather 450X"' },
  { brand: 'Ather', brandSlug: 'ather', model: 'Rizta', modelSlug: 'rizta', search: '"Ather 450" OR "Ather Energy"' },

  // Vida (1)
  { brand: 'Vida', brandSlug: 'vida', model: 'V1 Pro', modelSlug: 'v1-pro', search: '"Vida V1" OR "Hero Vida"' }
];

async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0 (dev@driveease.internal)' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.query || !data.query.pages) return null;

  const pages = Object.values(data.query.pages);
  for (const page of pages) {
    if (!page.imageinfo || !page.imageinfo[0]) continue;
    const info = page.imageinfo[0];
    const mime = info.mime || '';
    if (mime.includes('svg') || mime.includes('pdf') || mime.includes('tiff')) continue;
    const meta = info.extmetadata || {};
    const artist = (meta.Artist ? meta.Artist.value : 'Wikimedia Contributor').replace(/<[^>]+>/g, '').trim();
    const license = (meta.LicenseShortName ? meta.LicenseShortName.value : 'CC BY-SA 4.0').replace(/<[^>]+>/g, '').trim();
    const desc = (meta.ImageDescription ? meta.ImageDescription.value : '').replace(/<[^>]+>/g, '').trim();

    return {
      title: page.title,
      url: info.url,
      width: info.width,
      height: info.height,
      artist: artist || 'Wikimedia Contributor',
      license: license || 'CC BY-SA 4.0',
      description: desc || page.title,
      pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
    };
  }
  return null;
}

async function main() {
  const baseBikesDir = path.join(__dirname, '../src/assets/vehicles/bikes');
  fs.mkdirSync(baseBikesDir, { recursive: true });

  const attributions = [];
  const checklist = [];
  const usedHashes = new Map();

  for (let i = 0; i < bikesList.length; i++) {
    const item = bikesList[i];
    const brandDir = path.join(baseBikesDir, item.brandSlug);
    const modelDir = path.join(brandDir, item.modelSlug);
    fs.mkdirSync(modelDir, { recursive: true });

    const targetWebpPath = path.join(modelDir, `${item.modelSlug}.webp`);
    const tempDownloadPath = path.join(modelDir, `raw_download.tmp`);

    console.log(`[${i + 1}/${bikesList.length}] Searching asset for ${item.brand} ${item.model}...`);
    let imageInfo = await searchWikimedia(item.search);
    if (!imageInfo) {
      console.log(`  Retry with fallback search for ${item.brand} ${item.model}...`);
      imageInfo = await searchWikimedia(`${item.brand} ${item.model}`);
    }
    if (!imageInfo) {
      console.log(`  Retry with generic brand model search for ${item.model}...`);
      imageInfo = await searchWikimedia(`${item.model} motorcycle`);
    }

    if (!imageInfo) {
      console.error(`  FAILED: No image found for ${item.brand} ${item.model}`);
      continue;
    }

    console.log(`  Downloading ${imageInfo.url}...`);
    const imgRes = await fetch(imageInfo.url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0 (dev@driveease.internal)' } });
    if (!imgRes.ok) {
      console.error(`  Download error for ${imageInfo.url}: status ${imgRes.status}`);
      continue;
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(tempDownloadPath, buffer);

    // Convert to webp using macOS sips (or direct convert)
    try {
      execSync(`/usr/bin/sips -s format webp "${tempDownloadPath}" --out "${targetWebpPath}" > /dev/null 2>&1`);
    } catch (e) {
      // If sips doesn't support -s format webp directly, convert to png then write
      try {
        const pngPath = path.join(modelDir, `${item.modelSlug}.png`);
        execSync(`/usr/bin/sips -s format png "${tempDownloadPath}" --out "${pngPath}" > /dev/null 2>&1`);
        fs.renameSync(pngPath, targetWebpPath);
      } catch (err2) {
        fs.copyFileSync(tempDownloadPath, targetWebpPath);
      }
    }

    if (fs.existsSync(tempDownloadPath)) {
      fs.unlinkSync(tempDownloadPath);
    }

    const finalBuf = fs.readFileSync(targetWebpPath);
    const hash = crypto.createHash('sha256').update(finalBuf).digest('hex');
    if (usedHashes.has(hash)) {
      console.warn(`  WARNING: Duplicate hash with ${usedHashes.get(hash)}!`);
    } else {
      usedHashes.set(hash, `${item.brand} ${item.model}`);
    }

    const id = `${item.brandSlug}-${item.modelSlug}`;
    const relWebpPath = `src/assets/vehicles/bikes/${item.brandSlug}/${item.modelSlug}/${item.modelSlug}.webp`;

    attributions.push(`## ${item.brand} ${item.model}
- **Local file**: \`${relWebpPath}\`
- **Source**: Wikimedia Commons
- **Author**: ${imageInfo.artist}
- **License**: ${imageInfo.license}
- **Source page**: ${imageInfo.pageUrl}
- **Media URL**: ${imageInfo.url}
`);

    checklist.push(`- [x] \`${id}\`: ${item.brand} ${item.model} -> \`${relWebpPath}\``);
    console.log(`  ✓ Saved ${targetWebpPath} (${(finalBuf.length / 1024).toFixed(1)} KB, hash: ${hash.slice(0, 10)})`);

    // Small polite pause for Wikimedia API
    await new Promise((r) => setTimeout(r, 200));
  }

  // Save generated attributions & checklist for bikes
  fs.writeFileSync(path.join(__dirname, 'bike_attributions.txt'), attributions.join('\n'));
  fs.writeFileSync(path.join(__dirname, 'bike_checklist.txt'), checklist.join('\n'));
  console.log(`\nCompleted downloading ${usedHashes.size} unique authentic bike images!`);
}

main().catch(console.error);
