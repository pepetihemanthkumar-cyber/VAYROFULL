async function run() {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent('Ather')}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|size|mime&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'DriveEaseAudit/2.0 (audit@driveease.internal)' } });
  const data = await res.json();
  if (data.query?.pages) {
    for (const p of Object.values(data.query.pages)) {
      const info = p.imageinfo?.[0];
      if (info) {
        console.log(`  ${p.title} (${info.width}x${info.height}, ${(info.size/1024).toFixed(0)} KB)\n  URL: ${info.url}`);
      }
    }
  }
}

run().catch(console.error);
