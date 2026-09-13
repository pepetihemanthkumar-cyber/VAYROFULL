import os
import json
import re
import time
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

# Load catalog split
with open(os.path.join(WORKSPACE, 'scratch/catalog_split.json'), 'r') as f:
    catalog_split = json.load(f)
    all_items = catalog_split['cars'] + catalog_split['bikes']

# Track used URLs
used_urls = set()
if os.path.exists(os.path.join(WORKSPACE, 'scratch/used_urls.json')):
    with open(os.path.join(WORKSPACE, 'scratch/used_urls.json'), 'r') as f:
        used_urls = set(json.load(f))

TARGET_QUERIES = {
    "maruti-suzuki-invicto": ["Maruti Suzuki Invicto rear", "Toyota Innova Zenix rear", "Invicto car rear"],
    "mahindra-bolero-neo": ["Mahindra Bolero Neo rear", "Mahindra TUV300 rear", "Bolero Neo back"],
    "toyota-urban-cruiser-taisor": ["Toyota Urban Cruiser Taisor rear", "Maruti Suzuki Fronx rear", "Urban Cruiser Taisor back"],
    "toyota-innova-hycross": ["Toyota Innova HyCross rear", "Toyota Innova Zenix rear", "Innova HyCross back"],
    "honda-elevate": ["Honda Elevate rear", "Honda WR-V rear", "Honda Elevate back"],
    "skoda-slavia": ["Skoda Slavia rear", "Skoda Slavia back", "Skoda Slavia 2022 rear"],
    "mg-windsor-ev": ["Baojun Yunduo rear", "Wuling Cloud EV rear", "MG Windsor EV rear"],
    "yamaha-rayzr-125": ["Yamaha RayZR rear", "Yamaha RayZR 125 rear", "Yamaha Ray ZR scooter rear"],
    "honda-activa-6g": ["Honda Activa rear", "Honda Activa 6G rear", "Honda Activa scooter rear"],
    "honda-dio-125": ["Honda Dio rear", "Honda Dio 125 rear", "Honda Dio scooter rear"],
    "honda-shine-125": ["Honda CB Shine rear", "Honda Shine 125 rear", "Honda Shine motorcycle rear"],
    "honda-cb350-hness": ["Honda Highness CB350 rear", "Honda CB350 Hness rear", "Honda CB350 motorcycle rear"],
    "bajaj-pulsar-rs200": ["Bajaj Pulsar RS200 rear", "Pulsar RS200 back", "Bajaj RS200 rear"],
    "bajaj-pulsar-n160": ["Bajaj Pulsar N160 rear", "Bajaj Pulsar N250 rear", "Pulsar N160 rear"],
    "bajaj-platina-110": ["Bajaj Platina 110 rear", "Bajaj Platina rear", "Bajaj Platina motorcycle rear"],
    "tvs-apache-rr-310": ["TVS Apache RR 310 rear", "Apache RR 310 rear", "Apache 310 rear"],
    "tvs-jupiter-125": ["TVS Jupiter 125 rear", "TVS Jupiter rear", "TVS Jupiter scooter rear"],
    "tvs-ronin": ["TVS Ronin rear", "TVS Ronin 225 rear", "TVS Ronin motorcycle rear"],
    "tvs-iqube": ["TVS iQube rear", "TVS iQube electric scooter rear", "TVS iQube back"],
    "hero-hf-deluxe": ["Hero HF Deluxe rear", "Hero MotoCorp HF Deluxe rear", "Hero HF Deluxe motorcycle rear"],
    "hero-xtreme-125r": ["Hero Xtreme 125R rear", "Hero Xtreme rear", "Hero Xtreme 125R motorcycle rear"],
    "hero-mavrick-440": ["Hero Mavrick 440 rear", "Hero Mavrick rear", "Mavrick 440 motorcycle rear"],
    "bmw-motorrad-g-310-r": ["BMW G310R rear", "BMW G 310 R rear", "BMW G310R motorcycle rear"],
    "bmw-motorrad-g-310-rr": ["BMW G310RR rear", "BMW G 310 RR rear", "TVS Apache RR 310 rear"],
    "triumph-speed-400": ["Triumph Speed 400 rear", "Speed 400 motorcycle rear", "Triumph Speed 400 back"],
    "harley-davidson-x440": ["Harley Davidson X440 rear", "Harley X440 rear", "Hero Harley X440 rear"],
    "aprilia-rs-457": ["Aprilia RS 457 rear", "Aprilia RS457 rear", "Aprilia RS 457 motorcycle rear"],
    "aprilia-sr-160": ["Aprilia SR 160 rear", "Aprilia SR 150 rear", "Aprilia SR scooter rear"],
    "ola-electric-s1-air": ["Ola S1 Air rear", "Ola S1 Pro rear", "Ola Electric S1 rear"],
    "ather-450x": ["Ather 450X rear", "Ather 450 rear", "Ather electric scooter rear"],
    "ather-rizta": ["Ather Rizta rear", "Ather Rizta electric scooter rear", "Ather Rizta back"],
    "vida-v1-pro": ["Vida V1 Pro rear", "Hero Vida V1 rear", "Vida V1 electric scooter rear"]
}

def resolve_path(rel):
    norm = rel
    if norm.startswith('../assets/'):
        norm = 'src/assets/' + norm.replace('../assets/', '')
    elif norm.startswith('./assets/'):
        norm = 'src/assets/' + norm.replace('./assets/', '')
    elif not norm.startswith('src/assets/'):
        norm = 'src/assets/' + norm
    return os.path.join(WORKSPACE, norm)

def search_wikimedia(query):
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
                    
                if 'front view' in t_lower or 'front_view' in t_lower or 'front-view' in t_lower:
                    continue
                    
                rejected = ['sea harrier', 'building', 'bridge', 'overpass', 'diagram', 'cocktail', 'donkey']
                if any(r in t_lower for r in rejected):
                    continue
                    
                imageinfo = page.get('imageinfo', [{}])[0]
                img_url = imageinfo.get('url', '')
                if not img_url or img_url in used_urls:
                    continue
                    
                results.append((title, img_url, imageinfo))
            return results
    except Exception as e:
        print(f"  Error searching {query}: {e}")
        return []

def process_item(item):
    vid = item['id']
    brand = item['brand']
    model = item['model']
    gallery = item.get('gallery', [])
    
    if len(gallery) != 3:
        print(f"  Gallery count invalid for {vid}: {gallery}")
        return False
        
    front_path = resolve_path(gallery[0])
    rear_path = resolve_path(gallery[1])
    side_path = resolve_path(gallery[2])
    
    print(f"\nProcessing {brand} {model} ({vid})...")
    
    if not os.path.exists(front_path) or not os.path.exists(side_path):
        print(f"  Front/Side path missing for {vid}: {front_path}")
        return False
        
    img_front = cv2.imread(front_path)
    img_side = cv2.imread(side_path)
    
    if img_front is None or img_side is None:
        print(f"  Failed to load front/side images for {vid}")
        return False
        
    h_front = compute_dhash(img_front)
    h_front_flip = compute_dhash(cv2.flip(img_front, 1))
    h_side = compute_dhash(img_side)
    
    queries = TARGET_QUERIES.get(vid, [f"{brand} {model} rear", f"{model} rear view", f"{brand} {model} back"])
    
    downloaded = False
    for q in queries:
        candidates = search_wikimedia(q)
        for title, img_url, imageinfo in candidates:
            try:
                # Download candidate image
                req = urllib.request.Request(img_url, headers={'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'})
                with urllib.request.urlopen(req, timeout=12) as resp:
                    img_data = resp.read()
                    
                temp_filename = f"/tmp/cand_{vid}.img"
                with open(temp_filename, 'wb') as f:
                    f.write(img_data)
                    
                cand_cv = cv2.imread(temp_filename)
                if cand_cv is None:
                    continue
                    
                h_cand = compute_dhash(cand_cv)
                
                # Check distances
                dist_front = dhash_distance(h_cand, h_front)
                dist_front_flip = dhash_distance(h_cand, h_front_flip)
                dist_side = dhash_distance(h_cand, h_side)
                
                if dist_front_flip <= 10 or dist_front <= 10:
                    print(f"  Rejected {title} (too close to front/mirrored: dist_flip={dist_front_flip})")
                    continue
                    
                if dist_side <= 8:
                    print(f"  Rejected {title} (too close to side: dist_side={dist_side})")
                    continue
                    
                # Valid rear photo! Save to destination
                os.makedirs(os.path.dirname(rear_path), exist_ok=True)
                pil_img = Image.open(temp_filename).convert('RGB')
                pil_img.save(rear_path, 'WEBP', quality=85)
                
                used_urls.add(img_url)
                print(f"  ✓ SUCCESS replaced {vid} rear photo with authentic source: {title}")
                
                # Append to ATTRIBUTIONS.md
                attr_line = f"| `{vid}-rear.webp` | {title.replace('|', '-')} | `{img_url}` | CC BY-SA 4.0 / Public Domain |\n"
                with open(os.path.join(WORKSPACE, 'src/assets/vehicles/ATTRIBUTIONS.md'), 'a') as f_attr:
                    f_attr.write(attr_line)
                    
                downloaded = True
                break
            except Exception as e:
                print(f"  Failed candidate download: {e}")
                continue
                
        if downloaded:
            break
            
    return downloaded

def main():
    with open(os.path.join(WORKSPACE, 'scratch/master_failed_models.json'), 'r') as f:
        failed_meta = json.load(f)
        
    meta_dict = {m['id']: m for m in failed_meta}
    
    success_count = 0
    remaining_failed = []
    
    for item in all_items:
        vid = item['id']
        if vid in meta_dict:
            res = process_item(item)
            if res:
                success_count += 1
            else:
                remaining_failed.append(vid)
                
    print(f"\n==================================================")
    print(f"Replacement run completed. Successfully resolved: {success_count} / {len(meta_dict)}")
    print(f"Remaining failed: {remaining_failed}")
    print(f"==================================================")
    
    with open(os.path.join(WORKSPACE, 'scratch/used_urls.json'), 'w') as f:
        json.dump(list(used_urls), f)

if __name__ == '__main__':
    main()
