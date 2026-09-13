const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verified candidate URLs on Wikimedia Commons
const replacements = [
  {
    brand: 'royal-enfield',
    model: 'classic-350',
    title: 'File:Royal Enfield Classic 350 SideView.JPG',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Royal_Enfield_Classic_350_SideView.JPG'
  },
  {
    brand: 'royal-enfield',
    model: 'bullet-350',
    title: 'File:Enfield Bullet 350, Kathgodam, India.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Enfield_Bullet_350%2C_Kathgodam%2C_India.jpg'
  },
  {
    brand: 'royal-enfield',
    model: 'meteor-350',
    title: 'File:The All New Royal Enfield Meteor 350.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/The_All_New_Royal_Enfield_Meteor_350.jpg'
  },
  {
    brand: 'ktm',
    model: 'duke-390',
    title: 'File:KTM 390 Duke 2017.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/KTM_390_Duke_2017.jpg'
  },
  {
    brand: 'honda',
    model: 'activa-6g',
    title: 'File:Honda Activa 6G.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Honda_Activa_6G.jpg'
  },
  {
    brand: 'honda',
    model: 'cb300r',
    title: 'File:Honda CB300R - Mondial de l\'Automobile de Paris 2018 - 001.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Honda_CB300R_-_Mondial_de_l%27Automobile_de_Paris_2018_-_001.jpg'
  },
  {
    brand: 'bajaj',
    model: 'platina-110',
    title: 'File:Bajaj Platina 110 cc.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Bajaj_Platina_110_cc.jpg'
  },
  {
    brand: 'tvs',
    model: 'apache-rtr-160-4v',
    title: 'File:Apache RTR 160, -Owner Abhijat Shrivastava 2013-08-04 20-30.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Apache_RTR_160%2C_-Owner_Abhijat_Shrivastava_2013-08-04_20-30.jpg'
  },
  {
    brand: 'suzuki',
    model: 'access-125',
    title: 'File:Suzuki access 125.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Suzuki_access_125.jpg'
  }
];

async function downloadAndConvert(item) {
  const targetDir = path.join('src/assets/vehicles/bikes', item.brand, item.model);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, `${item.model}.webp`);
  const tmpFile = path.join('/tmp', `${item.brand}_${item.model}_temp.jpg`);

  console.log(`Downloading ${item.brand} / ${item.model} from ${item.url}...`);
  const res = await fetch(item.url, { headers: { 'User-Agent': 'DriveEaseVisualAudit/2.0 (audit@driveease.internal)' } });
  if (!res.ok) throw new Error(`HTTP error ${res.status} for ${item.url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tmpFile, buf);

  // Convert to WebP using sips or cwebp
  try {
    execSync(`cwebp -q 85 "${tmpFile}" -o "${targetFile}"`);
  } catch (e) {
    execSync(`sips -s format webp "${tmpFile}" --out "${targetFile}"`);
  }
  console.log(`✓ Successfully updated ${targetFile} (${fs.statSync(targetFile).size} bytes)`);
}

async function main() {
  for (const item of replacements) {
    try {
      await downloadAndConvert(item);
    } catch (err) {
      console.error(`Failed for ${item.brand}/${item.model}:`, err.message);
    }
  }
}

main().catch(console.error);
