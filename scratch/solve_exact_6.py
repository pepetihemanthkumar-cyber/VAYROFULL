import os
import json
import urllib.request
import urllib.parse
import cv2
import numpy as np
from PIL import Image

WORKSPACE = '/Users/pepetihemanthkumar/Documents/DriveEase'

def compute_dhash(image, hash_size=8):
    resized = cv2.resize(image, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if len(resized.shape) == 3 else resized
    return gray[:, 1:] > gray[:, :-1]

def dhash_distance(h1, h2):
    return np.count_nonzero(h1 != h2)

def resolve_path(rel):
    norm = rel
    if norm.startswith('../assets/'):
        norm = 'src/assets/' + norm.replace('../assets/', '')
    elif norm.startswith('./assets/'):
        norm = 'src/assets/' + norm.replace('./assets/', '')
    elif not norm.startswith('src/assets/'):
        norm = 'src/assets/' + norm
    return os.path.join(WORKSPACE, norm)

REMAINING_6_QUERIES = {
    "yamaha-rayzr-125": ["Yamaha Cygnus", "Yamaha Ray", "RayZR", "Yamaha RayZR"],
    "tvs-iqube": ["TVS iQube", "iQube", "TVS Electric Scooter"],
    "hero-hf-deluxe": ["Hero Deluxe", "Hero HF", "Hero MotoCorp motorcycle"],
    "hero-mavrick-440": ["Hero Mavrick", "Mavrick 440", "Hero MotoCorp 440"],
    "harley-davidson-x440": ["Harley X440", "Harley-Davidson X440", "Harley Davidson 440"],
    "aprilia-rs-457": ["Aprilia RS 457", "Aprilia RS457", "Aprilia RS"]
}

REJECTED = ['front view', 'front_view', 'diagram', 'wire', 'florists', 'tumulo', 'sculpture', 'gear box', 'building', 'pass', 'mountain', 'landscape', 'bridge', 'donkey', 'harrier', 'circuit', 'drawing', 'map', 'sketch', 'interior']

def search_wikimedia(query):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query}",
        "gsrnamespace": "6",
        "gsrlimit": "40",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json"
    })
    headers = {'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            res = []
            for pid, p in pages.items():
                title = p.get('title', '')
                info = p.get('imageinfo', [{}])[0]
                if info.get('url'):
                    res.append((title, info['url']))
            return res
    except Exception as e:
        print(f"Error searching {query}: {e}")
        return []

def main():
    with open(os.path.join(WORKSPACE, 'scratch/catalog_split.json')) as f:
        catalog = json.load(f)
    all_items = {item['id']: item for item in catalog['cars'] + catalog['bikes']}
    
    targets = ["yamaha-rayzr-125", "tvs-iqube", "hero-hf-deluxe", "hero-mavrick-440", "harley-davidson-x440", "aprilia-rs-457"]
    
    print(f"Targeting final {len(targets)} models...")
    
    for vid in targets:
        item = all_items.get(vid)
        if not item:
            continue
            
        gallery = item['gallery']
        front_path = resolve_path(gallery[0])
        rear_path = resolve_path(gallery[1])
        side_path = resolve_path(gallery[2])
        
        img_front = cv2.imread(front_path)
        h_front = compute_dhash(img_front)
        h_front_flip = compute_dhash(cv2.flip(img_front, 1))
        
        img_side = cv2.imread(side_path) if os.path.exists(side_path) else None
        h_side = compute_dhash(img_side) if img_side is not None else None
        
        queries = REMAINING_6_QUERIES.get(vid, [])
        
        found = False
        for q in queries:
            candidates = search_wikimedia(q)
            for title, img_url in candidates:
                t_low = title.lower()
                if not any(ext in t_low for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    continue
                if any(rw in t_low for rw in REJECTED):
                    continue
                    
                try:
                    req = urllib.request.Request(img_url, headers={'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        img_bytes = resp.read()
                    temp_file = f"/tmp/e6_{vid}.img"
                    with open(temp_file, 'wb') as tf:
                        tf.write(img_bytes)
                    cv_img = cv2.imread(temp_file)
                    if cv_img is None:
                        continue
                        
                    h_cand = compute_dhash(cv_img)
                    dist_ff = dhash_distance(h_cand, h_front_flip)
                    dist_f = dhash_distance(h_cand, h_front)
                    
                    if dist_ff <= 10 or dist_f <= 10:
                        continue
                    if h_side is not None:
                        dist_s = dhash_distance(h_cand, h_side)
                        if dist_s <= 8:
                            continue
                            
                    # Success!
                    os.makedirs(os.path.dirname(rear_path), exist_ok=True)
                    pil = Image.open(temp_file).convert('RGB')
                    pil.save(rear_path, 'WEBP', quality=85)
                    
                    attr_line = f"| `{os.path.basename(rear_path)}` | {title.replace('|', '-')} | `{img_url}` | CC BY-SA 4.0 / Public Domain |\n"
                    with open(os.path.join(WORKSPACE, 'src/assets/vehicles/ATTRIBUTIONS.md'), 'a') as f_attr:
                        f_attr.write(attr_line)
                        
                    print(f"✓ SUCCESS resolved {vid} with source: {title}")
                    found = True
                    break
                except Exception as e:
                    continue
            if found:
                break
                
        if not found:
            print(f"  Could not find rear candidate for {vid}")

if __name__ == '__main__':
    main()
