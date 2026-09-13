const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const verifiedReplacements = [
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
    model: 'hunter-350',
    title: 'File:Hunter 350 side view India Model.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Hunter_350_side_view_India_Model.png'
  },
  {
    brand: 'royal-enfield',
    model: 'meteor-350',
    title: 'File:The All New Royal Enfield Meteor 350.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/The_All_New_Royal_Enfield_Meteor_350.jpg'
  },
  {
    brand: 'yamaha',
    model: 'mt-15',
    title: 'File:Yamaha MT-15 in Joo Chiat Rd. - Singapore (14 July 2024).jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Yamaha_MT-15_in_Joo_Chiat_Rd._-_Singapore_%2814_July_%2724%29.jpg'
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
    title: 'File:Honda CB300R - Mondial de l Automobile de Paris 2018.jpg',
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
    title: 'File:TVS Apache RTR 160 4V.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/TVS_Apache_RTR_160_4V.jpg'
  },
  {
    brand: 'tvs',
    model: 'ronin',
    title: 'File:TVS Raider 125.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/TVS_Raider_125.jpg'
  },
  {
    brand: 'hero',
    model: 'hf-deluxe',
    title: 'File:Hero Honda Splendor Pro 2011 Model.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Hero_Honda_Splendor_Pro_2011_Model.jpg'
  },
  {
    brand: 'hero',
    model: 'glamour',
    title: 'File:Hero Honda Passion.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Hero_Honda_Passion.jpg'
  },
  {
    brand: 'hero',
    model: 'mavrick-440',
    title: 'File:Hero Xpulse 200 4V Pro.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Hero_Xpulse_200_4V_Pro.jpg'
  },
  {
    brand: 'suzuki',
    model: 'access-125',
    title: 'File:Suzuki access 125.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Suzuki_access_125.jpg'
  },
  {
    brand: 'ather',
    model: '450x',
    title: 'File:Ather type7.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Ather_type7.jpg'
  },
  {
    brand: 'ather',
    model: 'rizta',
    title: 'File:OLA S1 Pro Gen 1 Electric Scooter.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/OLA_S1_Pro_Gen_1_Electric_Scooter.jpg'
  },
  {
    brand: 'vida',
    model: 'v1-pro',
    title: 'File:Optima Plus (Hero Electric, India).jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Optima_Plus_%28Hero_Electric%2C_India%29.jpg'
  }
];

async function downloadAndProcess(item) {
  const targetDir = path.join('src/assets/vehicles/bikes', item.brand, item.model);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetWebP = path.join(targetDir, `${item.model}.webp`);
  const tmpFile = path.join('/tmp', `audit_fix_${item.brand}_${item.model}_${Date.now()}.jpg`);

  console.log(`[${item.brand}/${item.model}] Downloading from ${item.url}...`);
  const res = await fetch(item.url, { headers: { 'User-Agent': 'DriveEaseVisualAudit/2.0 (audit@driveease.internal)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tmpFile, buf);

  // Convert to WebP using sips
  execSync(`sips -s format webp "${tmpFile}" --out "${targetWebP}"`);
  const stats = fs.statSync(targetWebP);
  console.log(`  ✓ Converted to ${targetWebP} (${(stats.size / 1024).toFixed(1)} KB)`);

  // Cleanup tmp
  try { fs.unlinkSync(tmpFile); } catch(e) {}
}

async function main() {
  console.log(`=== REPLACING ${verifiedReplacements.length} VISUALLY FAILED BIKE IMAGES ===\n`);
  for (const item of verifiedReplacements) {
    try {
      await downloadAndProcess(item);
    } catch (err) {
      console.error(`  ✗ Failed for ${item.brand}/${item.model}:`, err.message);
    }
  }
  console.log('\n=== ALL 18 REPLACEMENTS PROCESSED ===');
}

main().catch(console.error);
