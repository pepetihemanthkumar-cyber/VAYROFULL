const fs = require('fs');
const https = require('https');

const queries = [
  { id: 'royal-enfield-classic-350', brand: 'royal-enfield', model: 'classic-350', search: 'Royal Enfield Classic 350' },
  { id: 'royal-enfield-bullet-350', brand: 'royal-enfield', model: 'bullet-350', search: 'Enfield Bullet 350' },
  { id: 'royal-enfield-hunter-350', brand: 'royal-enfield', model: 'hunter-350', search: 'Royal Enfield Hunter' },
  { id: 'royal-enfield-meteor-350', brand: 'royal-enfield', model: 'meteor-350', search: 'Royal Enfield Meteor 350' },
  { id: 'yamaha-mt-15', brand: 'yamaha', model: 'mt-15', search: 'Yamaha MT-15' },
  { id: 'ktm-duke-390', brand: 'ktm', model: 'duke-390', search: 'KTM 390 Duke' },
  { id: 'honda-activa-6g', brand: 'honda', model: 'activa-6g', search: 'Honda Activa 6G' },
  { id: 'honda-cb300r', brand: 'honda', model: 'cb300r', search: 'Honda CB300R' },
  { id: 'bajaj-platina-110', brand: 'bajaj', model: 'platina-110', search: 'Bajaj Platina' },
  { id: 'tvs-apache-rtr-160-4v', brand: 'tvs', model: 'apache-rtr-160-4v', search: 'TVS Apache RTR 160' },
  { id: 'tvs-ronin', brand: 'tvs', model: 'ronin', search: 'TVS Ronin' },
  { id: 'hero-hf-deluxe', brand: 'hero', model: 'hf-deluxe', search: 'Hero HF Deluxe' },
  { id: 'hero-glamour', brand: 'hero', model: 'glamour', search: 'Hero Glamour' },
  { id: 'hero-mavrick-440', brand: 'hero', model: 'mavrick-440', search: 'Hero Mavrick 440' },
  { id: 'suzuki-access-125', brand: 'suzuki', model: 'access-125', search: 'Suzuki Access 125' },
  { id: 'ather-450x', brand: 'ather', model: '450x', search: 'Ather 450' },
  { id: 'ather-rizta', brand: 'ather', model: 'rizta', search: 'Ather scooter' },
  { id: 'vida-v1-pro', brand: 'vida', model: 'v1-pro', search: 'Vida V1' }
];

async function fetchCandidates(item) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(item.search)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseVisualAudit/2.0 (audit@driveease.internal)' } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.query?.pages) return [];

    const candidates = [];
    for (const p of Object.values(data.query.pages)) {
      const info = p.imageinfo?.[0];
      if (!info?.url) continue;
      const mime = info.mime || '';
      if (mime.includes('svg') || mime.includes('pdf') || mime.includes('djvu') || mime.includes('tiff')) continue;

      candidates.push({
        title: p.title,
        url: info.url,
        width: info.width,
        height: info.height,
        ratio: (info.width / info.height).toFixed(2),
        sizeKB: Math.round(info.size / 1024)
      });
    }
    return candidates;
  } catch (err) {
    return [];
  }
}

async function run() {
  const out = {};
  for (const item of queries) {
    const c = await fetchCandidates(item);
    out[item.id] = c;
  }
  fs.writeFileSync('scripts/fail_candidates.json', JSON.stringify(out, null, 2));
  console.log('Saved fail_candidates.json');
}

run().catch(console.error);
