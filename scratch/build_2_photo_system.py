import os
import json
import re
import cv2
import numpy as np

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

cars = catalog_split['cars']
bikes = catalog_split['bikes']

print(f"Catalogue count check: Cars = {len(cars)}, Bikes = {len(bikes)}, Total = {len(cars) + len(bikes)}")

def resolve_path(rel):
    norm = rel
    if norm.startswith('../assets/'):
        norm = 'src/assets/' + norm.replace('../assets/', '')
    elif norm.startswith('./assets/'):
        norm = 'src/assets/' + norm.replace('./assets/', '')
    elif not norm.startswith('src/assets/'):
        norm = 'src/assets/' + norm
    return os.path.join(WORKSPACE, norm)

# Check all 207 models for 2 valid photographs
verified_models = []
issues = []

for item in cars + bikes:
    vid = item['id']
    brand = item['brand']
    model = item['model']
    gallery = item.get('gallery', [])
    
    # We select Photo 1 (front) and Photo 2 (rear)
    # If rear was side, gallery[0] is front, gallery[1] is rear/side
    if len(gallery) >= 2:
        p1_rel = gallery[0]
        p2_rel = gallery[1]
    else:
        issues.append(f"{vid}: gallery count < 2")
        continue
        
    p1_abs = resolve_path(p1_rel)
    p2_abs = resolve_path(p2_rel)
    
    if not os.path.exists(p1_abs):
        issues.append(f"{vid}: Missing photo 1 file ({p1_abs})")
        continue
        
    if not os.path.exists(p2_abs):
        issues.append(f"{vid}: Missing photo 2 file ({p2_abs})")
        continue
        
    img1 = cv2.imread(p1_abs)
    img2 = cv2.imread(p2_abs)
    
    if img1 is None:
        issues.append(f"{vid}: Unreadable photo 1 ({p1_abs})")
        continue
        
    if img2 is None:
        issues.append(f"{vid}: Unreadable photo 2 ({p2_abs})")
        continue
        
    dh1 = compute_dhash(img1)
    dh2 = compute_dhash(img2)
    dh1_flip = compute_dhash(cv2.flip(img1, 1))
    
    dist_direct = dhash_distance(dh1, dh2)
    dist_flip = dhash_distance(dh1_flip, dh2)
    
    if dist_direct <= 3:
        issues.append(f"{vid}: Photo 2 is duplicate of Photo 1 (dHash dist {dist_direct})")
        continue
        
    if dist_flip <= 3:
        issues.append(f"{vid}: Photo 2 is horizontally mirrored from Photo 1 (dHash flip dist {dist_flip})")
        continue
        
    verified_models.append({
        'id': vid,
        'brand': brand,
        'model': model,
        'photo1': p1_rel,
        'photo2': p2_rel
    })

print(f"\n==================================================")
print(f"2-Photo System Verification Result:")
print(f"- Total models checked: {len(cars) + len(bikes)}")
print(f"- Models passing strict 2-photo audit: {len(verified_models)} / {len(cars) + len(bikes)}")
print(f"- Total valid photos: {len(verified_models) * 2} / { (len(cars) + len(bikes)) * 2 }")
print(f"- Issues: {len(issues)}")
print(f"==================================================")
