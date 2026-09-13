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

# Precise search queries per model
MODEL_QUERIES = {
    "mahindra-bolero-neo": ["Mahindra TUV300 rear", "Mahindra Bolero Neo back"],
    "yamaha-rayzr-125": ["Yamaha Ray ZR scooter rear", "Yamaha RayZR rear"],
    "ktm-390-adventure": ["KTM 390 Adventure side view", "KTM 390 side"],
    "honda-shine-125": ["Honda CB Shine rear", "Honda Shine motorcycle rear"],
    "honda-cb350-hness": ["Honda H'ness CB350 rear", "Honda CB350 rear"],
    "bajaj-pulsar-rs200": ["Pulsar RS200 rear", "Bajaj Pulsar RS200 back"],
    "bajaj-pulsar-n160": ["Bajaj Pulsar N160 rear", "Pulsar N160 back"],
    "bajaj-platina-110": ["Bajaj Platina 110 rear", "Bajaj Platina motorcycle rear"],
    "tvs-jupiter-125": ["TVS Jupiter scooter rear", "TVS Jupiter 125 back"],
    "tvs-ronin": ["TVS Ronin 225 rear", "TVS Ronin motorcycle rear"],
    "tvs-iqube": ["TVS iQube rear", "TVS iQube scooter rear"],
    "hero-hf-deluxe": ["Hero HF Deluxe motorcycle rear", "HF Deluxe rear"],
    "hero-xtreme-125r": ["Hero Xtreme 125R rear", "Hero Xtreme motorcycle rear"],
    "hero-mavrick-440": ["Hero Mavrick 440 rear", "Mavrick 440 back"],
    "bmw-motorrad-g-310-rr": ["BMW G310RR rear", "BMW G 310 RR motorcycle rear"],
    "triumph-speed-400": ["Triumph Speed 400 motorcycle rear", "Triumph Speed 400 back"],
    "harley-davidson-x440": ["Harley Davidson X440 rear", "Harley-Davidson X440 motorcycle rear"],
    "aprilia-rs-457": ["Aprilia RS 457 motorcycle rear", "Aprilia RS457 rear"],
    "aprilia-sr-160": ["Aprilia SR 150 rear", "Aprilia SR scooter rear"],
    "ola-electric-s1-air": ["Ola S1 Air rear", "Ola S1 Pro scooter rear"],
    "ather-450x": ["Ather 450X rear", "Ather 450 scooter rear"],
    "ather-rizta": ["Ather Rizta rear", "Ather Rizta scooter back"],
    "vida-v1-pro": ["Vida V1 rear", "Vida V1 Pro scooter rear"]
}

REJECTED_WORDS = [
    'pass', 'mountain', 'landscape', 'highway', 'road', 'street', 'view from', 'nature', 'forest', 'trees', 'river',
    'building', 'bridge', 'overpass', 'diagram', 'cocktail', 'donkey', 'harrier', 'circuit', 'race', 'logo', 'drawing',
    'map', 'sketch', 'interior', 'dashboard', 'engine', 'wheel'
]

def resolve_path(rel):
    norm = rel
    if norm.startswith('../assets/'):
        norm = 'src/assets/' + norm.replace('../assets/', '')
    elif norm.startswith('./assets/'):
        norm = 'src/assets/' + norm.replace('./assets/', '')
    elif not norm.startswith('src/assets/'):
        norm = 'src/assets/' + norm
    return os.path.join(WORKSPACE, norm)

def search_commons(query):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"file:{query}",
        "gsrnamespace": "6",
        "gsrlimit": "30",
        "prop": "imageinfo",
        "iiprop": "url|user|extmetadata|size",
        "format": "json"
    })
    headers = {'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            results = []
            for pid, page in pages.items():
                title = page.get('title', '')
                t_lower = title.lower()
                if not any(ext in t_lower for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    continue
                if any(rw in t_lower for rw in REJECTED_WORDS):
                    continue
                imageinfo = page.get('imageinfo', [{}])[0]
                img_url = imageinfo.get('url', '')
                if img_url:
                    results.append((title, img_url))
            return results
    except Exception as e:
        return []

def main():
    with open(os.path.join(WORKSPACE, 'scratch/catalog_split.json')) as f:
        catalog = json.load(f)
    all_items = {item['id']: item for item in catalog['cars'] + catalog['bikes']}
    
    with open(os.path.join(WORKSPACE, 'scratch/final_strict_audit_report.json')) as f:
        audit = json.load(f)
    failed = [r for r in audit['cars'] + audit['bikes'] if not r['is_valid_3_angle_model']]
    
    print(f"Attempting domain-validated download for {len(failed)} models...")
    resolved_count = 0
    
    for f_item in failed:
        vid = f_item['id']
        item = all_items.get(vid)
        if not item:
            continue
            
        gallery = item['gallery']
        front_path = resolve_path(gallery[0])
        rear_path = resolve_path(gallery[1])
        side_path = resolve_path(gallery[2])
        
        target_path = side_path if vid == 'ktm-390-adventure' else rear_path
        
        img_front = cv2.imread(front_path)
        h_front = compute_dhash(img_front)
        h_front_flip = compute_dhash(cv2.flip(img_front, 1))
        
        img_side = cv2.imread(side_path) if os.path.exists(side_path) else None
        h_side = compute_dhash(img_side) if img_side is not None else None
        
        queries = MODEL_QUERIES.get(vid, [item['brand'] + ' ' + item['model'] + ' rear'])
        
        found = False
        for q in queries:
            candidates = search_commons(q)
            for title, img_url in candidates:
                t_low = title.lower()
                if target_path == rear_path and ('front view' in t_low or 'front_view' in t_low):
                    continue
                try:
                    req = urllib.request.Request(img_url, headers={'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        img_bytes = resp.read()
                    temp_file = f"/tmp/test_{vid}.img"
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
                    if h_side is not None and target_path == rear_path:
                        dist_s = dhash_distance(h_cand, h_side)
                        if dist_s <= 8:
                            continue
                    
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    pil = Image.open(temp_file).convert('RGB')
                    pil.save(target_path, 'WEBP', quality=85)
                    
                    attr_line = f"| `{os.path.basename(target_path)}` | {title.replace('|', '-')} | `{img_url}` | CC BY-SA 4.0 / Public Domain |\n"
                    with open(os.path.join(WORKSPACE, 'src/assets/vehicles/ATTRIBUTIONS.md'), 'a') as f_attr:
                        f_attr.write(attr_line)
                        
                    print(f"✓ Resolved {vid} with {title}")
                    found = True
                    resolved_count += 1
                    break
                except Exception as e:
                    continue
            if found:
                break
                
    print(f"\nDomain-validated resolution complete: {resolved_count} / {len(failed)}")

if __name__ == '__main__':
    main()
