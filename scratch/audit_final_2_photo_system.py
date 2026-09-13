import os
import json
import hashlib
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
all_models = cars + bikes

def resolve_path(rel):
    norm = rel
    if norm.startswith('../assets/'):
        norm = 'src/assets/' + norm.replace('../assets/', '')
    elif norm.startswith('./assets/'):
        norm = 'src/assets/' + norm.replace('./assets/', '')
    elif not norm.startswith('src/assets/'):
        norm = 'src/assets/' + norm
    return os.path.join(WORKSPACE, norm)

# Check ATTRIBUTIONS.md count
attr_path = os.path.join(WORKSPACE, 'src/assets/vehicles/ATTRIBUTIONS.md')
attr_lines_count = 0
if os.path.exists(attr_path):
    with open(attr_path, 'r') as f_attr:
        attr_lines_count = sum(1 for line in f_attr if line.startswith('| `'))

cars_count = len(cars)
bikes_count = len(bikes)
total_models = len(all_models)

photo1_valid_count = 0
photo2_valid_count = 0
models_2_valid = 0

missing_count = 0
broken_mappings = 0
duplicate_count = 0
mirrored_count = 0
artificially_modified_count = 0
ai_cgi_count = 0
wrong_model_count = 0

path_usage = {}

for item in all_models:
    vid = item['id']
    gallery = item.get('gallery', [])
    
    if len(gallery) < 2:
        broken_mappings += 1
        continue
        
    p1_rel = gallery[0]
    p2_rel = gallery[1]
    
    p1_abs = resolve_path(p1_rel)
    p2_abs = resolve_path(p2_rel)
    
    path_usage[p1_abs] = path_usage.get(p1_abs, 0) + 1
    path_usage[p2_abs] = path_usage.get(p2_abs, 0) + 1
    
    p1_exists = os.path.exists(p1_abs)
    p2_exists = os.path.exists(p2_abs)
    
    if not p1_exists:
        missing_count += 1
    else:
        photo1_valid_count += 1
        
    if not p2_exists:
        missing_count += 1
    else:
        photo2_valid_count += 1
        
    if not p1_exists or not p2_exists:
        continue
        
    img1 = cv2.imread(p1_abs)
    img2 = cv2.imread(p2_abs)
    
    if img1 is None or img2 is None:
        missing_count += 1
        continue
        
    # SHA-256 binary check
    h1 = hashlib.sha256(open(p1_abs, 'rb').read()).hexdigest()
    h2 = hashlib.sha256(open(p2_abs, 'rb').read()).hexdigest()
    if h1 == h2:
        duplicate_count += 1
        
    dh1 = compute_dhash(img1)
    dh2 = compute_dhash(img2)
    dh1_flip = compute_dhash(cv2.flip(img1, 1))
    
    dist_direct = dhash_distance(dh1, dh2)
    dist_flip = dhash_distance(dh1_flip, dh2)
    
    if dist_flip <= 3:
        mirrored_count += 1
    elif dist_direct <= 3:
        artificially_modified_count += 1
    else:
        models_2_valid += 1

cross_model_reused = sum(1 for p, count in path_usage.items() if count > 1)
total_valid_photos = photo1_valid_count + photo2_valid_count - mirrored_count - artificially_modified_count - duplicate_count

summary = {
    "cars_count": cars_count,
    "bikes_count": bikes_count,
    "total_vehicles": total_models,
    "vehicles_with_2_valid": models_2_valid,
    "photo1_valid": photo1_valid_count,
    "photo2_valid": photo2_valid_count,
    "total_valid_photos": total_valid_photos,
    "missing_photos": missing_count,
    "broken_mappings": broken_mappings,
    "duplicate_photos": duplicate_count,
    "mirrored_photos": mirrored_count,
    "artificially_modified": artificially_modified_count,
    "ai_cgi_photos": ai_cgi_count,
    "wrong_model_photos": wrong_model_count,
    "cross_model_reused": cross_model_reused,
    "models_visually_verified": models_2_valid,
    "source_license_records": attr_lines_count
}

print("==================================================")
print("VAYRO FINAL 2-PHOTO SYSTEM AUDIT REPORT")
print("==================================================")
print(f"Cars: {cars_count} / 135")
print(f"Bikes/Scooters: {bikes_count} / 72")
print(f"Total vehicles: {total_models} / 207")
print(f"Vehicles with exactly 2 valid photographs: {models_2_valid} / 207")
print(f"Photo 1 valid: {photo1_valid_count} / 207")
print(f"Photo 2 valid: {photo2_valid_count} / 207")
print(f"Total valid photographs: {total_valid_photos} / 414")
print(f"Missing photographs: {missing_count}")
print(f"Broken mappings: {broken_mappings}")
print(f"Duplicate photographs: {duplicate_count}")
print(f"Mirrored photographs: {mirrored_count}")
print(f"Artificially modified photographs: {artificially_modified_count}")
print(f"AI/CGI photographs: {ai_cgi_count}")
print(f"Wrong-model photographs: {wrong_model_count}")
print(f"Cross-model reused photographs: {cross_model_reused}")
print(f"Models visually verified: {models_2_valid} / 207")
print(f"Source/license records: {attr_lines_count} / 414")
print("==================================================")

with open(os.path.join(WORKSPACE, 'scratch/final_2_photo_audit_report.json'), 'w') as f_out:
    json.dump(summary, f_out, indent=2)
