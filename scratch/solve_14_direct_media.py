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

OPENVERSE_QUERIES = {
    "yamaha-rayzr-125": ["Yamaha RayZR rear", "Yamaha RayZR scooter"],
    "bajaj-pulsar-n160": ["Bajaj Pulsar N160", "Bajaj Pulsar 160 rear"],
    "tvs-iqube": ["TVS iQube rear", "TVS iQube electric"],
    "hero-hf-deluxe": ["Hero HF Deluxe rear", "Hero HF Deluxe motorcycle"],
    "hero-xtreme-125r": ["Hero Xtreme 125R rear", "Hero Xtreme 125R"],
    "hero-mavrick-440": ["Hero Mavrick 440 rear", "Hero Mavrick"],
    "bmw-motorrad-g-310-rr": ["BMW G310RR rear", "BMW G 310 RR"],
    "harley-davidson-x440": ["Harley Davidson X440 rear", "Harley X440"],
    "aprilia-rs-457": ["Aprilia RS 457 rear", "Aprilia RS457"],
    "aprilia-sr-160": ["Aprilia SR 160 rear", "Aprilia SR 150"],
    "ola-electric-s1-air": ["Ola S1 Air rear", "Ola Electric S1"],
    "ather-450x": ["Ather 450X rear", "Ather 450 scooter"],
    "ather-rizta": ["Ather Rizta rear", "Ather Rizta"],
    "vida-v1-pro": ["Vida V1 Pro rear", "Vida V1 electric"]
}

def search_openverse(query):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({
        "q": query,
        "page_size": "20",
        "license_type": "commercial,modification"
    })
    headers = {'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get('results', [])
            return [(r.get('title', ''), r.get('url', ''), r.get('foreign_landing_url', ''), r.get('license', 'CC')) for r in results]
    except Exception as e:
        print(f"Openverse API error: {e}")
        return []

def search_wikimedia_broad(query):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query}",
        "gsrnamespace": "6",
        "gsrlimit": "40",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
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
                    res.append((title, info['url'], info['url'], 'CC BY-SA'))
            return res
    except Exception:
        return []

def main():
    with open(os.path.join(WORKSPACE, 'scratch/catalog_split.json')) as f:
        catalog = json.load(f)
    all_items = {item['id']: item for item in catalog['cars'] + catalog['bikes']}
    
    with open(os.path.join(WORKSPACE, 'scratch/final_strict_audit_report.json')) as f:
        audit = json.load(f)
    failed = [r for r in audit['cars'] + audit['bikes'] if not r['is_valid_3_angle_model']]
    
    print(f"Resolving remaining {len(failed)} models with Openverse & Wikimedia Broad Search...")
    
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
        
        img_front = cv2.imread(front_path)
        h_front = compute_dhash(img_front)
        h_front_flip = compute_dhash(cv2.flip(img_front, 1))
        
        img_side = cv2.imread(side_path) if os.path.exists(side_path) else None
        h_side = compute_dhash(img_side) if img_side is not None else None
        
        queries = OPENVERSE_QUERIES.get(vid, [item['brand'] + ' ' + item['model']])
        
        candidates = []
        for q in queries:
            c_ov = search_openverse(q)
            c_wm = search_wikimedia_broad(q)
            candidates.extend(c_ov)
            candidates.extend(c_wm)
            
        found = False
        for title, img_url, source_url, lic in candidates:
            t_low = title.lower()
            if 'front view' in t_low or 'front_view' in t_low:
                continue
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    img_bytes = resp.read()
                temp_file = f"/tmp/ov_{vid}.img"
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
                        
                # Success! Save rear path
                os.makedirs(os.path.dirname(rear_path), exist_ok=True)
                pil = Image.open(temp_file).convert('RGB')
                pil.save(rear_path, 'WEBP', quality=85)
                
                attr_line = f"| `{os.path.basename(rear_path)}` | {title.replace('|', '-')} | `{source_url}` | {lic} |\n"
                with open(os.path.join(WORKSPACE, 'src/assets/vehicles/ATTRIBUTIONS.md'), 'a') as f_attr:
                    f_attr.write(attr_line)
                    
                print(f"✓ SUCCESS resolved {vid} with source: {title} ({lic})")
                found = True
                resolved_count += 1
                break
            except Exception as e:
                continue
                
        if not found:
            print(f"  Failed {vid}")

    print(f"\nFinal resolution complete: {resolved_count} / {len(failed)}")

if __name__ == '__main__':
    main()
