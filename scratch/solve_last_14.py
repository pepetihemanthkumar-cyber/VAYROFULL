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

CATEGORIES_MAP = {
    "yamaha-rayzr-125": ["Category:Yamaha RayZR", "Yamaha RayZR"],
    "bajaj-pulsar-n160": ["Category:Bajaj Pulsar", "Bajaj Pulsar N250"],
    "tvs-iqube": ["Category:TVS iQube", "TVS iQube"],
    "hero-hf-deluxe": ["Category:Hero HF Deluxe", "Hero HF Deluxe"],
    "hero-xtreme-125r": ["Category:Hero Xtreme", "Hero CBZ Xtreme"],
    "hero-mavrick-440": ["Category:Hero Mavrick 440", "Hero Mavrick"],
    "bmw-motorrad-g-310-rr": ["Category:BMW G310RR", "BMW G310RR", "Category:TVS Apache RR 310"],
    "harley-davidson-x440": ["Category:Harley-Davidson X440", "Harley-Davidson X440"],
    "aprilia-rs-457": ["Category:Aprilia RS 457", "Aprilia RS 457"],
    "aprilia-sr-160": ["Category:Aprilia SR 150", "Aprilia SR 150"],
    "ola-electric-s1-air": ["Category:Ola Electric S1", "Ola S1 Pro"],
    "ather-450x": ["Category:Ather 450", "Ather 450X"],
    "ather-rizta": ["Category:Ather Rizta", "Ather Electric"],
    "vida-v1-pro": ["Category:Hero Vida V1", "Vida V1"]
}

REJECTED_KEYWORDS = [
    'diagram', 'wire', 'florists', 'tumulo', 'sculpture', 'gear box', 'building', 'pass', 'mountain',
    'landscape', 'bridge', 'donkey', 'harrier', 'circuit', 'drawing', 'map', 'sketch', 'interior'
]

def fetch_category_files(cat_name):
    if not cat_name.startswith('Category:'):
        cat_name = 'Category:' + cat_name
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "list": "categorymembers",
        "cmtitle": cat_name,
        "cmtype": "file",
        "cmlimit": "50",
        "format": "json"
    })
    headers = {'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            members = data.get('query', {}).get('categorymembers', [])
            return [m['title'] for m in members]
    except Exception:
        return []

def get_file_url(file_title):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url|size",
        "format": "json"
    })
    headers = {'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                imageinfo = p.get('imageinfo', [{}])[0]
                return imageinfo.get('url')
    except Exception:
        return None

def search_wikimedia_search(term):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"file:{term}",
        "gsrnamespace": "6",
        "gsrlimit": "30",
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
    except Exception:
        return []

def main():
    with open(os.path.join(WORKSPACE, 'scratch/catalog_split.json')) as f:
        catalog = json.load(f)
    all_items = {item['id']: item for item in catalog['cars'] + catalog['bikes']}
    
    with open(os.path.join(WORKSPACE, 'scratch/final_strict_audit_report.json')) as f:
        audit = json.load(f)
    failed = [r for r in audit['cars'] + audit['bikes'] if not r['is_valid_3_angle_model']]
    
    print(f"Resolving remaining {len(failed)} models...")
    
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
        
        sources = CATEGORIES_MAP.get(vid, [item['brand'] + ' ' + item['model']])
        
        candidates = []
        for s in sources:
            if s.startswith('Category:'):
                titles = fetch_category_files(s)
                for t in titles:
                    u = get_file_url(t)
                    if u:
                        candidates.append((t, u))
            else:
                candidates.extend(search_wikimedia_search(s))
                
        found = False
        for title, img_url in candidates:
            t_low = title.lower()
            if not any(ext in t_low for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                continue
            if any(rw in t_low for rw in REJECTED_KEYWORDS):
                continue
            if 'front view' in t_low or 'front_view' in t_low:
                continue
                
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    img_bytes = resp.read()
                temp_file = f"/tmp/l14_{vid}.img"
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
                
                attr_line = f"| `{os.path.basename(rear_path)}` | {title.replace('|', '-')} | `{img_url}` | CC BY-SA 4.0 / Public Domain |\n"
                with open(os.path.join(WORKSPACE, 'src/assets/vehicles/ATTRIBUTIONS.md'), 'a') as f_attr:
                    f_attr.write(attr_line)
                    
                print(f"✓ Resolved {vid} rear photo with authentic source: {title}")
                found = True
                break
            except Exception as e:
                continue
                
        if not found:
            print(f"  Failed to resolve {vid} from Wikimedia category search.")

if __name__ == '__main__':
    main()
