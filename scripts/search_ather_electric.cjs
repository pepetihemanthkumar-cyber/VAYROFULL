const queries = [
  'Ather',
  'Ather Energy',
  'electric scooter',
  'Ola Electric',
  'TVS iQube',
  'Bajaj Chetak scooter'
];

async function run() {
  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size|mime&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0 (audit@driveease.internal)' } });
    const data = await res.json();
    console.log(`\n=== QUERY: "${q}" ===`);
    if (data.query?.pages) {
      for (const p of Object.values(data.query.pages)) {
        const info = p.imageinfo?.[0];
        if (info && (p.title.endsWith('.jpg') || p.title.endsWith('.png') || p.title.endsWith('.JPG') || p.title.endsWith('.jpeg'))) {
          console.log(`  ${p.title} (${info.width}x${info.height}, ${(info.size/1024).toFixed(0)} KB)\n  URL: ${info.url}`);
        }
      }
    }
  }
}

run().catch(console.error);
