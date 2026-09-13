const queries = [
  { id: 'hero-hf-deluxe', search: 'Hero Honda motorcycle India' },
  { id: 'hero-hf-deluxe-2', search: 'Hero Splendor motorcycle' },
  { id: 'hero-hf-deluxe-3', search: 'Hero CD Dawn motorcycle' },
  { id: 'hero-glamour', search: 'Hero Passion Pro' },
  { id: 'hero-glamour-2', search: 'Hero Honda motorcycle' },
  { id: 'hero-mavrick-440', search: 'Hero Karizma' },
  { id: 'hero-mavrick-440-2', search: 'Hero Xpulse motorcycle' },
  { id: 'tvs-ronin', search: 'TVS motorcycle India' },
  { id: 'tvs-ronin-2', search: 'TVS Radeon' },
  { id: 'ather-450x', search: 'Ather scooter' },
  { id: 'ather-450x-2', search: 'Ather Energy' },
  { id: 'ather-rizta', search: 'Ather Energy scooter' },
  { id: 'ather-rizta-2', search: 'Electric scooter India' },
  { id: 'vida-v1-pro', search: 'Hero Electric scooter' },
  { id: 'vida-v1-pro-2', search: 'Hero MotoCorp electric' },
  { id: 'vida-v1-pro-3', search: 'Hero Electric motorcycle' }
];

async function run() {
  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q.search)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0 (audit@driveease.internal)' } });
    const data = await res.json();
    console.log(`\n=== QUERY: ${q.id} ("${q.search}") ===`);
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
