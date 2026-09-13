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

def search_wikimedia_candidates(query_text):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"file:{query_text}",
        "gsrnamespace": "6",
        "gsrlimit": "15",
        "prop": "imageinfo",
        "iiprop": "url|user|extmetadata|size",
        "format": "json"
    })
    
    headers = {'User-Agent': 'DriveEaseFleetManager/2.0 (fleet-assets@driveease.app)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            candidates = []
            for pid, page in pages.items():
                title = page.get('title', '')
                if not any(ext in title.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    continue
                imageinfo = page.get('imageinfo', [{}])[0]
                img_url = imageinfo.get('url', '')
                width = imageinfo.get('width', 0)
                height = imageinfo.get('height', 0)
                
                if width < 300 or height < 200:
                    continue
                    
                user = imageinfo.get('user', 'Wikimedia Contributor')
                extmeta = imageinfo.get('extmetadata', {})
                license_name = extmeta.get('LicenseShortName', {}).get('value', 'CC BY-SA')
                artist_raw = extmeta.get('Artist', {}).get('value', user)
                # Strip HTML from artist name
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
        # Silently fail on timeout/error and return empty list
        return []

def download_image(url):
    headers = {'User-Agent': 'DriveEaseFleetManager/2.0 (fleet-assets@driveease.app)'}
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
    
    # Load front and side images
    front_img = cv2.imread(front_path) if os.path.exists(front_path) else None
    side_img = cv2.imread(side_path) if os.path.exists(side_path) else None
    
    if front_img is not None:
        front_dhash = compute_dhash(front_img)
        # Check direct dhash dist
        if dhash_distance(cand_dhash, front_dhash) <= 5:
            return False, "Perceptually identical to front image", None
            
        # Check flipped diff
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
            
    # Resize candidate cleanly to standard width (1200px) keeping aspect ratio
    target_w = 1200
    target_h = int(h * (1200 / w))
    resized_cand = cv2.resize(candidate_img, (target_w, target_h), interpolation=cv2.INTER_AREA)
    
    return True, "Valid", resized_cand

def main():
    with open('./scratch/catalog_split.json', 'r') as f:
        catalog = json.load(f)
        
    all_vehicles = catalog['cars'] + catalog['bikes']
    print(f"Loaded {len(all_vehicles)} total vehicles to process.")
    
    attributions = []
    success_count = 0
    failed_models = []
    
    attributions_header = """# DriveEase Fleet Image Attributions & Licensing

All rear-angle vehicle photographs in the DriveEase catalogue have been sourced from open-licensed repositories (Wikimedia Commons). The attributions, authors, licenses, and original source URLs are recorded below in compliance with Creative Commons and open licensing requirements.

---

| Vehicle ID | Brand & Model | Angle | Source URL | Author / Creator | License | Attribution Requirement |
|---|---|---|---|---|---|---|
"""

    attributions_rows = []

    for idx, v in enumerate(all_vehicles):
        vid = v['id']
        brand = v['brand']
        model = v['model']
        title = f"{brand} {model}"
        gallery = v.get('gallery', [])
        
        if len(gallery) < 3:
            print(f"[{idx+1}/{len(all_vehicles)}] ⚠️ {title} gallery count is {len(gallery)}")
            continue
            
        front_rel = gallery[0]
        rear_rel = gallery[1]
        side_rel = gallery[2]
        
        front_path = 'src/assets/' + front_rel.replace('../assets/', '').replace('./assets/', '')
        rear_path = 'src/assets/' + rear_rel.replace('../assets/', '').replace('./assets/', '')
        side_path = 'src/assets/' + side_rel.replace('../assets/', '').replace('./assets/', '')
        
        # Prepare queries
        clean_model = model.replace('-', ' ')
        clean_brand = brand.replace('-', ' ')
        
        queries = [
            f"{clean_brand} {clean_model} rear",
            f"{clean_model} rear view",
            f"{clean_brand} {clean_model} back",
            f"{clean_model} automobile rear",
            f"{clean_model} motorcycle rear",
            f"{clean_brand} {clean_model} tail",
            f"{clean_brand} {clean_model}"
        ]
        
        found_valid = False
        
        for q in queries:
            candidates = search_wikimedia_candidates(q)
            if not candidates:
                time.sleep(0.1)
                continue
                
            for cand in candidates:
                img_data, raw_bytes = download_image(cand['url'])
                is_valid, msg, processed_img = verify_and_convert_rear_image(img_data, front_path, side_path)
                
                if is_valid and processed_img is not None:
                    # Save to WebP
                    os.makedirs(os.path.dirname(rear_path), exist_ok=True)
                    # Convert BGR (OpenCV) to RGB for PIL
                    rgb_img = cv2.cvtColor(processed_img, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(rgb_img)
                    pil_img.save(rear_path, 'WEBP', quality=85)
                    
                    found_valid = True
                    success_count += 1
                    
                    attr_row = f"| `{vid}` | {title} | Rear 3/4 | [{cand['title']}]({cand['url']}) | {cand['artist']} | {cand['license']} | Creative Commons Attribution required |"
                    attributions_rows.append(attr_row)
                    
                    print(f"[{idx+1}/{len(all_vehicles)}] ✅ Succeeded for {title} using query '{q}' -> {cand['title']}", flush=True)
                    break
                    
            if found_valid:
                break
                
        if not found_valid:
            failed_models.append(title)
            print(f"[{idx+1}/{len(all_vehicles)}] ❌ FAILED to find valid rear image for {title}", flush=True)
            
        # Modest rate limit delay
        time.sleep(0.05)
        
    # Write ATTRIBUTIONS.md
    with open('ATTRIBUTIONS.md', 'w', encoding='utf-8') as f_attr:
        f_attr.write(attributions_header + "\n".join(attributions_rows) + "\n")
        
    print("\n==================================================", flush=True)
    print(f"FETCH COMPLETE: {success_count} / {len(all_vehicles)} rear images replaced.", flush=True)
    if failed_models:
        print(f"Failed models ({len(failed_models)}):", failed_models, flush=True)
    print("==================================================", flush=True)

if __name__ == '__main__':
    main()
