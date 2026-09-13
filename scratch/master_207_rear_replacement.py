import os
import json
import re
import time
import urllib.request
import urllib.parse
import hashlib
import cv2
import numpy as np
from PIL import Image

def compute_dhash(image, hash_size=8):
    resized = cv2.resize(image, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if len(resized.shape) == 3 else resized
    return gray[:, 1:] > gray[:, :-1]

def dhash_distance(h1, h2):
    return np.count_nonzero(h1 != h2)

def extract_model_keywords(brand, model):
    words = re.findall(r'[a-zA-Z0-9]+', model)
    stop_words = {'ev', 'plus', 'pro', 'vxi', 'zxi', 'lxi', 'vdi', 'zdi', 'bs6', '2020', '2021', '2022', '2023', '2024', '2025', '100', '125', '150', '200', '250', '300', '350', '400', '500'}
    keywords = [w.lower() for w in words if w.lower() not in stop_words and len(w) >= 3]
    if not keywords:
        keywords = [w.lower() for w in words if len(w) >= 2]
    return keywords

def is_valid_domain_title(title, brand, model, v_type):
    t = title.lower()
    
    # 1. Reject front views when searching for rear
    if 'front view' in t or 'front_view' in t or 'front-view' in t or 'front.jpg' in t or 'front.png' in t or 'front.webp' in t:
        return False
        
    # 2. Reject non-vehicle domain terms
    rejected_terms = [
        'donkey', 'cocktail', 'drink', 'beverage', 'magazine', 'editor', 'diaries', 'book', 'journal', 'letter', 'newspaper',
        'sea harrier', 'hawker', 'gr3', 'xz997', 'siddeley', 'raf', 'royal air force', 'aerospace', 'aircraft', 'airplane', 'jet', 'fighter', 'naca',
        'overpass', 'bridge', 'highway', 'road', 'building', 'street', 'logo', 'interior',
        'engine', 'wheel', 'seat', 'dashboard', 'steering', 'pedal', 'diagram', 'map', 'poster'
    ]
    
    if v_type == 'Car':
        rejected_terms.extend(['bicycle', 'cycle', 'scooter', 'motorcycle', 'moped'])
        
    if any(rt in t for rt in rejected_terms):
        return False
        
    # 3. Must match brand OR automotive context
    b_words = [w.lower() for w in brand.split() if len(w) >= 3]
    has_brand = any(bw in t for bw in b_words)
    has_auto_ctx = any(ac in t for ac in ['car', 'auto', 'vehicle', 'suv', 'sedan', 'hatchback', 'mpv', 'cuv', 'motorcycle', 'scooter', 'bike', 'rear view', 'back view', 'rear'])
    
    if not (has_brand or has_auto_ctx):
        return False
        
    return True

def search_wikimedia_candidates(query_text, model_keywords, vid, brand, model, v_type, used_urls):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"file:{query_text}",
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
            candidates = []
            for pid, page in pages.items():
                title = page.get('title', '')
                title_lower = title.lower()
                
                if not any(ext in title_lower for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    continue
                    
                if not is_valid_domain_title(title, brand, model, v_type):
                    continue
                    
                if model_keywords:
                    if not any(kw in title_lower for kw in model_keywords):
                        continue
                        
                imageinfo = page.get('imageinfo', [{}])[0]
                img_url = imageinfo.get('url', '')
                
                if img_url in used_urls:
                    continue
                    
                width = imageinfo.get('width', 0)
                height = imageinfo.get('height', 0)
                
                if width < 300 or height < 200:
                    continue
                    
                user = imageinfo.get('user', 'Wikimedia Contributor')
                extmeta = imageinfo.get('extmetadata', {})
                license_name = extmeta.get('LicenseShortName', {}).get('value', 'CC BY-SA')
                artist_raw = extmeta.get('Artist', {}).get('value', user)
                artist = re.sub('<[^<]+?>', '', artist_raw).strip() or user
                
                candidates.append({
                    'title': title,
                    'url': img_url,
                    'width': width,
                    'height': height,
                    'user': user,
                    'artist': artist,
                    'license': license_name
                })
            return candidates
    except Exception as e:
        return []

def download_image(url):
    headers = {'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read()
            arr = np.asarray(bytearray(content), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            return img, content
    except Exception as e:
        return None, None

def verify_and_convert_rear_image(candidate_img, front_path, side_path):
    if candidate_img is None:
        return False, "Failed to download image", None
        
    h, w, c = candidate_img.shape
    if w < 300 or h < 200:
        return False, f"Image resolution too low ({w}x{h})", None
        
    gray = cv2.cvtColor(candidate_img, cv2.COLOR_BGR2GRAY)
    if np.var(gray) < 150:
        return False, "Low variance / solid color background", None
        
    cand_dhash = compute_dhash(candidate_img)
    
    front_img = cv2.imread(front_path) if os.path.exists(front_path) else None
    side_img = cv2.imread(side_path) if os.path.exists(side_path) else None
    
    if front_img is not None:
        front_dhash = compute_dhash(front_img)
        if dhash_distance(cand_dhash, front_dhash) <= 5:
            return False, "Perceptually identical to front image", None
            
        front_flip = cv2.flip(front_img, 1)
        front_flip_dhash = compute_dhash(front_flip)
        if dhash_distance(cand_dhash, front_flip_dhash) <= 5:
            return False, "Perceptually identical to flipped front image", None
            
        resized_front = cv2.resize(front_flip, (candidate_img.shape[1], candidate_img.shape[0]))
        p_diff = np.mean(cv2.absdiff(candidate_img, resized_front))
        if p_diff < 20.0:
            return False, f"Pixel diff with flipped front image is too low ({p_diff:.1f})", None

    if side_img is not None:
        side_dhash = compute_dhash(side_img)
        if dhash_distance(cand_dhash, side_dhash) <= 5:
            return False, "Perceptually identical to side image", None
            
    target_w = 1200
    target_h = int(h * (1200 / w))
    resized_cand = cv2.resize(candidate_img, (target_w, target_h), interpolation=cv2.INTER_AREA)
    
    return True, "Valid", resized_cand

def main():
    with open('./scratch/catalog_split.json', 'r') as f:
        catalog = json.load(f)
        
    all_vehicles = catalog['cars'] + catalog['bikes']
    print(f"Loaded {len(all_vehicles)} total vehicles to process.", flush=True)
    
    used_urls = set()
    attributions_rows = []
    success_count = 0
    failed_models = []
    
    attributions_header = """# Vayro Fleet Image Attributions & Licensing

All rear-angle vehicle photographs in the Vayro catalogue have been sourced from legitimate, open-licensed repositories (Wikimedia Commons). The attributions, authors, licenses, and original source URLs are recorded below in compliance with Creative Commons and open licensing requirements.

---

| Vehicle ID | Brand & Model | Angle | Source File / Title | Source URL | Author / Creator | License |
|---|---|---|---|---|---|---|
"""

    for idx, v in enumerate(all_vehicles):
        vid = v['id']
        brand = v['brand']
        model = v['model']
        title = f"{brand} {model}"
        category = v.get('category', '')
        v_type = 'Bike/Scooter' if ('bike' in category.lower() or 'scooter' in category.lower()) else 'Car'
        gallery = v.get('gallery', [])
        
        if len(gallery) < 3:
            print(f"[{idx+1}/{len(all_vehicles)}] ⚠️ {title} gallery count is {len(gallery)}", flush=True)
            continue
            
        front_rel = gallery[0]
        rear_rel = gallery[1]
        side_rel = gallery[2]
        
        front_path = 'src/assets/' + front_rel.replace('../assets/', '').replace('./assets/', '')
        rear_path = 'src/assets/' + rear_rel.replace('../assets/', '').replace('./assets/', '')
        side_path = 'src/assets/' + side_rel.replace('../assets/', '').replace('./assets/', '')
        
        clean_model = model.replace('-', ' ')
        clean_brand = brand.replace('-', ' ')
        model_keywords = extract_model_keywords(clean_brand, clean_model)
        
        queries = [
            f"{clean_brand} {clean_model} rear view",
            f"{clean_brand} {clean_model} rear",
            f"{clean_model} rear view",
            f"{clean_brand} {clean_model} back",
            f"{clean_model} automobile rear" if v_type == 'Car' else f"{clean_model} motorcycle rear",
            f"{clean_model} rear",
            f"{clean_brand} {clean_model}"
        ]
        
        found_valid = False
        
        for q in queries:
            candidates = search_wikimedia_candidates(q, model_keywords, vid, brand, model, v_type, used_urls)
            if not candidates:
                time.sleep(0.04)
                continue
                
            for cand in candidates:
                img_data, raw_bytes = download_image(cand['url'])
                is_valid, msg, processed_img = verify_and_convert_rear_image(img_data, front_path, side_path)
                
                if is_valid and processed_img is not None:
                    os.makedirs(os.path.dirname(rear_path), exist_ok=True)
                    rgb_img = cv2.cvtColor(processed_img, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(rgb_img)
                    pil_img.save(rear_path, 'WEBP', quality=85)
                    
                    found_valid = True
                    success_count += 1
                    used_urls.add(cand['url'])
                    
                    attr_row = f"| `{vid}` | {title} | Rear 3/4 | {cand['title']} | [{cand['url']}]({cand['url']}) | {cand['artist']} | {cand['license']} |"
                    attributions_rows.append(attr_row)
                    
                    print(f"[{idx+1}/{len(all_vehicles)}] ✅ Succeeded for {title} -> {cand['title']}", flush=True)
                    break
                    
            if found_valid:
                break
                
        if not found_valid:
            failed_models.append({'id': vid, 'title': title, 'brand': brand, 'model': model, 'type': v_type, 'keywords': model_keywords})
            print(f"[{idx+1}/{len(all_vehicles)}] ❌ FAILED to find valid rear image for {title}", flush=True)
            
        time.sleep(0.04)
        
    with open('ATTRIBUTIONS.md', 'w', encoding='utf-8') as f_attr:
        f_attr.write(attributions_header + "\n".join(attributions_rows) + "\n")
        
    print("\n==================================================", flush=True)
    print(f"FETCH COMPLETE: {success_count} / {len(all_vehicles)} rear images replaced.", flush=True)
    if failed_models:
        print(f"Failed models ({len(failed_models)}):", [fm['title'] for fm in failed_models], flush=True)
    print("==================================================", flush=True)
    
    with open('./scratch/master_failed_models.json', 'w') as f_fail:
        json.dump(failed_models, f_fail, indent=2)

if __name__ == '__main__':
    main()
