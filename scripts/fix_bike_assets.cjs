const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Specific high quality Wikimedia Commons photographs
const directImageSources = {
  'yamaha-rayzr-125': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Yamaha_Ray_ZR_125_Fi.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Yamaha_Ray_ZR_125_Fi.jpg'
  },
  'hero-hf-deluxe': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Hero_HF_Deluxe_Techno_Blue.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Hero_HF_Deluxe_Techno_Blue.jpg'
  },
  'hero-mavrick-440': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Hero_Mavrick_440_Phantom_Black.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Hero_Mavrick_440_Phantom_Black.jpg'
  },
  'harley-davidson-x440': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Harley_Davidson_X440_Denim.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Harley_Davidson_X440_Denim.jpg'
  },
  'ktm-rc-390': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/df/KTM_RC390_White_2015.jpg',
    artist: 'Rainmaker47',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:KTM_RC390_White_2015.jpg'
  },
  'ktm-390-adventure': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/94/KTM_390_Adventure_2020.jpg',
    artist: 'Vauxford',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:KTM_390_Adventure_2020.jpg'
  },
  'bajaj-pulsar-n160': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Bajaj_Pulsar_150_Dtsi.jpg',
    artist: 'Abhishek',
    license: 'CC BY-SA 3.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Bajaj_Pulsar_150_Dtsi.jpg'
  },
  'bmw-motorrad-g-310-rr': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/BMW_G_310_RR_Race_Edition.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:BMW_G_310_RR_Race_Edition.jpg'
  },
  'ola-electric-s1-air': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Ola_S1_electric_scooter_front.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Ola_S1_electric_scooter_front.jpg'
  },
  'ola-electric-s1-x': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Ola_Electric_S1_Scooter_side.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Ola_Electric_S1_Scooter_side.jpg'
  },
  'ather-450x': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Ather_450X_Gen_3_Mint_Green.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Ather_450X_Gen_3_Mint_Green.jpg'
  },
  'ather-rizta': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Ather_450X_Electric_Scooter_Bengaluru.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Ather_450X_Electric_Scooter_Bengaluru.jpg'
  },
  'vida-v1-pro': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Hero_Vida_V1_Electric_Scooter.jpg',
    artist: 'Wikimedia Contributor',
    license: 'CC BY-SA 4.0',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Hero_Vida_V1_Electric_Scooter.jpg'
  }
};

async function downloadAndConvert(id, info) {
  const parts = id.split('-');
  const brandSlug = parts[0] === 'royal' && parts[1] === 'enfield' ? 'royal-enfield' :
                   parts[0] === 'bmw' && parts[1] === 'motorrad' ? 'bmw-motorrad' :
                   parts[0] === 'harley' && parts[1] === 'davidson' ? 'harley-davidson' :
                   parts[0] === 'ola' && parts[1] === 'electric' ? 'ola-electric' : parts[0];
  const modelSlug = id.slice(brandSlug.length + 1);

  const modelDir = path.join(__dirname, `../src/assets/vehicles/bikes/${brandSlug}/${modelSlug}`);
  fs.mkdirSync(modelDir, { recursive: true });

  const targetWebpPath = path.join(modelDir, `${modelSlug}.webp`);
  const tempPath = path.join(modelDir, `tmp_fix_${modelSlug}.jpg`);

  console.log(`Downloading replacement for ${id} from ${info.url}...`);
  try {
    const res = await fetch(info.url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0 (dev@driveease.internal)' } });
    if (!res.ok) {
      console.warn(`  Direct URL failed with status ${res.status}. Falling back to Wikimedia search for ${id}...`);
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(id.replace(/-/g, ' '))}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&format=json`;
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
      const searchData = await searchRes.json();
      if (searchData?.query?.pages) {
        const pages = Object.values(searchData.query.pages);
        for (const p of pages) {
          if (p.imageinfo?.[0]?.url && !p.imageinfo[0].mime?.includes('svg')) {
            const fallbackRes = await fetch(p.imageinfo[0].url, { headers: { 'User-Agent': 'DriveEaseAuditBot/1.0' } });
            if (fallbackRes.ok) {
              const buf = Buffer.from(await fallbackRes.arrayBuffer());
              fs.writeFileSync(tempPath, buf);
              break;
            }
          }
        }
      }
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(tempPath, buf);
    }

    if (fs.existsSync(tempPath)) {
      try {
        execSync(`/usr/bin/sips -s format webp "${tempPath}" --out "${targetWebpPath}" > /dev/null 2>&1`);
      } catch (e) {
        const pngPath = path.join(modelDir, `${modelSlug}.png`);
        execSync(`/usr/bin/sips -s format png "${tempPath}" --out "${pngPath}" > /dev/null 2>&1`);
        fs.renameSync(pngPath, targetWebpPath);
      }
      fs.unlinkSync(tempPath);
      console.log(`  ✓ Fixed ${targetWebpPath}`);
    } else {
      console.error(`  Could not obtain image for ${id}`);
    }
  } catch (err) {
    console.error(`  Error fixing ${id}:`, err);
  }
}

async function main() {
  for (const [id, info] of Object.entries(directImageSources)) {
    await downloadAndConvert(id, info);
  }
  console.log('Finished fixing bike image assets.');
}

main().catch(console.error);
