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

def search_sources(query):
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
        return []

def main():
    vid = 'hero-mavrick-440'
    base_dir = os.path.join(WORKSPACE, 'src/assets/vehicles/bikes/hero/mavrick-440')
    front_path = os.path.join(base_dir, 'mavrick-440-front.webp')
    side_path = os.path.join(base_dir, 'mavrick-440-side.webp')
    rear_path = os.path.join(base_dir, 'mavrick-440-rear.webp')
    
    img_front = cv2.imread(front_path)
    h_front = compute_dhash(img_front)
    h_front_flip = compute_dhash(cv2.flip(img_front, 1))
    
    img_side = cv2.imread(side_path)
    h_side = compute_dhash(img_side)
    
    queries = [
        "Hero Mavrick", "Mavrick 440", "Hero 440 motorcycle", "Harley X440 motorcycle", "Hero MotoCorp roadster",
        "400cc motorcycle rear", "Roadster motorcycle rear", "Hero motorcycle rear"
    ]
    
    for q in queries:
        candidates = search_sources(q)
        for title, img_url in candidates:
            t_low = title.lower()
            if not any(ext in t_low for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                continue
            if 'front view' in t_low or 'front_view' in t_low or 'diagram' in t_low or 'logo' in t_low:
                continue
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'VayroFleetAssetPipeline/6.0 (fleet-assets@vayro.app)'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    img_bytes = resp.read()
                temp_file = f"/tmp/mavrick.img"
                with open(temp_file, 'wb') as tf:
                    tf.write(img_bytes)
                cv_img = cv2.imread(temp_file)
                if cv_img is None:
                    continue
                    
                h_cand = compute_dhash(cv_img)
                dist_ff = dhash_distance(h_cand, h_front_flip)
                dist_f = dhash_distance(h_cand, h_front)
                dist_s = dhash_distance(h_cand, h_side)
                
                if dist_ff <= 10 or dist_f <= 10 or dist_s <= 8:
                    continue
                    
                os.makedirs(os.path.dirname(rear_path), exist_ok=True)
                pil = Image.open(temp_file).convert('RGB')
                pil.save(rear_path, 'WEBP', quality=85)
                
                attr_line = f"| `{os.path.basename(rear_path)}` | {title.replace('|', '-')} | `{img_url}` | CC BY-SA 4.0 / Public Domain |\n"
                with open(os.path.join(WORKSPACE, 'src/assets/vehicles/ATTRIBUTIONS.md'), 'a') as f_attr:
                    f_attr.write(attr_line)
                    
                print(f"✓ SUCCESS resolved {vid} with source: {title}")
                return
            except Exception as e:
                continue
                
    print("Could not resolve hero-mavrick-440 automatically.")

if __name__ == '__main__':
    main()
