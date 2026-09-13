const fs = require('fs');

const searchTerms = {
  'royal-enfield-classic-350': ['Royal Enfield Classic 350 side', 'Royal Enfield Classic 350 motorcycle', 'Royal Enfield Classic 500'],
  'royal-enfield-bullet-350': ['Royal Enfield Bullet 350 motorcycle', 'Royal Enfield Bullet side', 'Enfield Bullet 350'],
  'royal-enfield-hunter-350': ['Royal Enfield Hunter 350', 'Hunter 350 motorcycle', 'Royal Enfield Hunter'],
  'royal-enfield-meteor-350': ['Royal Enfield Meteor 350', 'Meteor 350 motorcycle', 'Royal Enfield Meteor'],
  'yamaha-mt-15': ['Yamaha MT-15 motorcycle', 'Yamaha MT-15 side', 'Yamaha MT 15'],
  'ktm-duke-390': ['KTM 390 Duke side', '2017 KTM 390 Duke', 'KTM 390 Duke motorcycle', 'KTM Duke 390 2018'],
  'honda-activa-6g': ['Honda Activa scooter', 'Honda Activa 125', 'Honda Activa side'],
  'honda-cb300r': ['Honda CB300R motorcycle', 'Honda CB300R side', '2019 Honda CB300R', 'Honda CB300F'],
  'bajaj-platina-110': ['Bajaj Platina motorcycle', 'Bajaj Platina 100', 'Bajaj Platina side', 'Bajaj CT 100 motorcycle'],
  'tvs-apache-rtr-160-4v': ['TVS Apache RTR 160 motorcycle', 'TVS Apache 160 4V', 'TVS Apache RTR side'],
  'tvs-ronin': ['TVS Ronin motorcycle', 'TVS Ronin 225', 'TVS Ronin side'],
  'hero-hf-deluxe': ['Hero HF Deluxe motorcycle', 'Hero Honda CD Deluxe', 'Hero HF Deluxe side', 'Hero Dawn motorcycle'],
  'hero-glamour': ['Hero Glamour motorcycle', 'Hero Honda Glamour', 'Hero Glamour 125'],
  'hero-mavrick-440': ['Hero Mavrick 440', 'Hero Karizma XMR', 'Hero Karizma motorcycle', 'Hero Xtreme 200S'],
  'suzuki-access-125': ['Suzuki Access 125 scooter', 'Suzuki Access scooter', 'Suzuki Swish 125'],
  'ather-450x': ['Ather 450X electric scooter', 'Ather 450 electric', 'Ather Energy scooter', 'Ather 450X'],
  'ather-rizta': ['Ather 450S electric scooter', 'Ather electric scooter', 'Ather 450 Plus', 'Ather 450 Gen 3'],
  'vida-v1-pro': ['Hero Vida V1 electric scooter', 'Vida V1 Pro electric', 'Vida V1 scooter', 'Hero Electric motorcycle']
};

async function searchCandidates(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseVisualAudit/2.0 (audit@driveease.internal)' } });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.query?.pages) return [];

  const badWords = ['engine', 'gearbox', 'crankcase', 'diagram', 'schematic', 'wire', 'piston', 'clutch', 'logo', 'carburetor', 'close-up', 'closeup', 'part', 'detail', 'speedometer', 'wheel_only', 'tyre_only', 'exhaust_only'];

  const results = [];
  for (const page of Object.values(data.query.pages)) {
    const info = page.imageinfo?.[0];
    if (!info?.url) continue;
    const mime = info.mime || '';
    if (mime.includes('svg') || mime.includes('pdf') || mime.includes('tiff')) continue;

    const titleLower = page.title.toLowerCase();
    const isBad = badWords.some(w => titleLower.includes(w));
    if (isBad) continue;

    results.push({
      title: page.title,
      url: info.url,
      width: info.width,
      height: info.height,
      aspectRatio: (info.width / info.height).toFixed(2),
      sizeKB: Math.round(info.size / 1024)
    });
  }
  return results;
}

async function main() {
  for (const [id, queries] of Object.entries(searchTerms)) {
    console.log(`\n=== SEARCHING FOR: ${id} ===`);
    for (const q of queries) {
      const candidates = await searchCandidates(q);
      if (candidates.length > 0) {
        console.log(`  Query "${q}": found ${candidates.length} candidates:`);
        candidates.slice(0, 3).forEach((c, idx) => {
          console.log(`    [${idx + 1}] ${c.title} (${c.width}x${c.height}, ratio: ${c.aspectRatio}, ${c.sizeKB} KB)\n        URL: ${c.url}`);
        });
        break;
      }
    }
  }
}

main().catch(console.error);
