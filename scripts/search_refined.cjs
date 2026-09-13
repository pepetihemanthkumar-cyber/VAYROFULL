const queries = [
  'Hero Honda Splendor',
  'Hero Honda CD',
  'Hero Honda Passion',
  'Hero MotoCorp',
  'TVS Raider 125',
  'TVS Radeon',
  'Ather electric scooter Bangalore',
  'Hero Electric scooter India',
  'Hero Optima electric'
];

async function run() {
  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0 (audit@driveease.internal)' } });
    const data = await res.json();
    console.log(`\n=== QUERY: "${q}" ===`);
    if (data.query?.pages) {
      for (const p of Object.values(data.query.pages)) {
        const info = p.imageinfo?.[0];
        if (info && !p.title.includes('.djvu') && !p.title.includes('.pdf')) {
          console.log(`  ${p.title} (${info.width}x${info.height}, ${(info.size/1024).toFixed(0)} KB)\n  URL: ${info.url}`);
        }
      }
    }
  }
}

run().catch(console.error);
