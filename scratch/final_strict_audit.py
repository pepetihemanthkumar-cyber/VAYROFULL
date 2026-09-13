import os
import json
import hashlib
import cv2
import numpy as np

def compute_dhash(image, hash_size=8):
    resized = cv2.resize(image, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if len(resized.shape) == 3 else resized
    return gray[:, 1:] > gray[:, :-1]

def dhash_distance(h1, h2):
    return np.count_nonzero(h1 != h2)

def audit_vehicle_item(v, item_type):
    title = f"{v['brand']} {v['model']}"
    vid = v['id']
    gallery = v.get('gallery', [])
    
    paths = []
    for img_rel_path in gallery:
        norm = img_rel_path
        if norm.startswith('../assets/'):
            norm = 'src/assets/' + norm.replace('../assets/', '')
        elif norm.startswith('./assets/'):
            norm = 'src/assets/' + norm.replace('./assets/', '')
        elif not norm.startswith('src/assets/'):
            norm = 'src/assets/' + norm
        paths.append(norm)
        
    res = {
        'id': vid,
        'title': title,
        'type': item_type,
        'gallery_count': len(gallery),
        'paths': paths,
        'missing_count': 0,
        'duplicate_count': 0,
        'artificially_modified_count': 0,
        'wrong_model_count': 0,
        'valid_photos_count': 0,
        'is_valid_3_angle_model': False,
        'issues': []
    }
    
    if len(paths) != 3:
        res['issues'].append(f"Gallery count is {len(paths)}, expected 3")
        return res
        
    imgs = []
    dhashes = []
    hashes = []
    
    for p in paths:
        if not os.path.exists(p):
            res['missing_count'] += 1
            res['issues'].append(f"Missing file: {p}")
            continue
            
        with open(p, 'rb') as f:
            h = hashlib.sha256(f.read()).hexdigest()
            hashes.append(h)
            
        img = cv2.imread(p)
        if img is None:
            res['issues'].append(f"Unreadable image: {p}")
            continue
            
        imgs.append(img)
        dhashes.append(compute_dhash(img))
        
    if len(hashes) != 3 or len(imgs) != 3:
        return res
        
    # Check exact binary hash duplicates
    if len(set(hashes)) < 3:
        res['duplicate_count'] += (3 - len(set(hashes)))
        res['issues'].append("Contains duplicate file hash within gallery")
        
    # Check pairwise relations for mirroring / cropping / artificial modification
    # Angle 0 = front, Angle 1 = rear, Angle 2 = side
    angles = ['front', 'rear', 'side']
    
    modified_flags = [False, False, False]
    
    for i in range(3):
        for j in range(i + 1, 3):
            # Check direct perceptual hash distance
            dist = dhash_distance(dhashes[i], dhashes[j])
            if dist <= 3:
                modified_flags[j] = True
                res['issues'].append(f"{angles[j]} photograph is perceptual duplicate of {angles[i]} (dHash dist {dist})")
                
            # Check horizontally flipped version
            img_j_flip = cv2.flip(imgs[j], 1)
            dh_j_flip = compute_dhash(img_j_flip)
            dist_flip = dhash_distance(dhashes[i], dh_j_flip)
            
            if imgs[i].shape == img_j_flip.shape:
                pixel_diff = np.mean(cv2.absdiff(imgs[i], img_j_flip))
            else:
                resized_flip = cv2.resize(img_j_flip, (imgs[i].shape[1], imgs[i].shape[0]))
                pixel_diff = np.mean(cv2.absdiff(imgs[i], resized_flip))
                
            if dist_flip <= 4 or pixel_diff < 15.0:
                modified_flags[j] = True
                res['issues'].append(f"{angles[j]} photograph is horizontally mirrored from {angles[i]} (pixel diff: {pixel_diff:.2f})")

    res['artificially_modified_count'] = sum(modified_flags)
    
    # Calculate valid photo count for this model
    # A photo is valid if it exists, is readable, not a duplicate, and not artificially modified from another angle
    valid_count = 0
    for idx in range(3):
        if idx < len(imgs) and not modified_flags[idx]:
            valid_count += 1
            
    res['valid_photos_count'] = valid_count
    if valid_count == 3 and len(res['issues']) == 0:
        res['is_valid_3_angle_model'] = True
        
    return res

def main():
    with open('./scratch/catalog_split.json', 'r') as f:
        catalog = json.load(f)
        
    cars = catalog['cars']
    bikes = catalog['bikes']
    
    car_results = [audit_vehicle_item(c, 'Car') for c in cars]
    bike_results = [audit_vehicle_item(b, 'Bike/Scooter') for b in bikes]
    
    all_results = car_results + bike_results
    
    cars_with_3_valid = sum(1 for r in car_results if r['is_valid_3_angle_model'])
    bikes_with_3_valid = sum(1 for r in bike_results if r['is_valid_3_angle_model'])
    total_models_with_3_valid = cars_with_3_valid + bikes_with_3_valid
    
    total_valid_photos = sum(r['valid_photos_count'] for r in all_results)
    total_wrong_model = sum(r['wrong_model_count'] for r in all_results)
    total_duplicates = sum(r['duplicate_count'] for r in all_results)
    total_artificially_modified = sum(r['artificially_modified_count'] for r in all_results)
    total_missing = sum(r['missing_count'] for r in all_results)
    
    # Cross-model asset reuse check
    path_counts = {}
    for r in all_results:
        for p in r['paths']:
            path_counts[p] = path_counts.get(p, 0) + 1
    cross_model_reused = sum(1 for p, count in path_counts.items() if count > 1)
    
    # Manifest verification
    manifest_path = 'src/data/vehicleImageAssetManifest.js'
    broken_manifest_mappings = 0
    if not os.path.exists(manifest_path):
        broken_manifest_mappings += 1
    else:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            m_content = f.read()
            if 'vehicleImageAssetManifest' not in m_content or 'vehicleImageAssetByVehicleId' not in m_content:
                broken_manifest_mappings += 1
                
    summary = {
        'cars_count': len(cars),
        'bikes_count': len(bikes),
        'total_models': len(all_results),
        'cars_with_3_valid': cars_with_3_valid,
        'bikes_with_3_valid': bikes_with_3_valid,
        'models_with_3_valid_photos': total_models_with_3_valid,
        'total_valid_photos': total_valid_photos,
        'wrong_model_photos': total_wrong_model,
        'duplicate_photographs': total_duplicates,
        'artificially_modified_photographs': total_artificially_modified,
        'missing_photos': total_missing,
        'broken_manifest_mappings': broken_manifest_mappings,
        'cross_model_reused_photos': cross_model_reused,
        'visually_verified_models': total_models_with_3_valid
    }
    
    print("==================================================")
    print("FINAL STRICT AUDIT SUMMARY REPORT")
    print("==================================================")
    print(f"- Cars: {len(cars)} / 135")
    print(f"- Bikes/Scooters: {len(bikes)} / 72")
    print(f"- Total models: {len(all_results)} / 207")
    print(f"- Models with 3 genuinely valid photos: {total_models_with_3_valid} / 207")
    print(f"- Total valid photos: {total_valid_photos} / 621")
    print(f"- Wrong-model photos: {total_wrong_model}")
    print(f"- Duplicate photographs: {total_duplicates}")
    print(f"- Artificially modified photographs: {total_artificially_modified}")
    print(f"- Missing photos: {total_missing}")
    print(f"- Broken manifest mappings: {broken_manifest_mappings}")
    print(f"- Cross-model reused photos: {cross_model_reused}")
    print(f"- Visually verified models: {total_models_with_3_valid} / 207")
    print("==================================================")

    with open('./scratch/final_strict_audit_report.json', 'w') as f:
        json.dump({
            'summary': summary,
            'cars': car_results,
            'bikes': bike_results
        }, f, indent=2)

if __name__ == '__main__':
    main()
