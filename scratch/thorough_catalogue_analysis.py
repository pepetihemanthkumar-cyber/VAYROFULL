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

def analyze_model_photos(v):
    title = f"{v['brand']} {v['model']}"
    vid = v['id']
    category = v.get('category', '')
    v_type = 'Bike/Scooter' if ('bike' in category.lower() or 'scooter' in category.lower()) else 'Car'
    
    gallery = v.get('images', {}).get('gallery', [])
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
        
    result = {
        'id': vid,
        'title': title,
        'type': v_type,
        'paths': paths,
        'gallery_count': len(gallery),
        'missing_files': 0,
        'duplicate_photos': False,
        'mirrored_photos': False,
        'artificially_modified': False,
        'wrong_model': False,
        'valid_photos': 0,
        'issues': []
    }
    
    if len(paths) != 3:
        result['issues'].append(f"Gallery length is {len(paths)}, expected 3")
        return result
        
    imgs = []
    dhashes = []
    hashes = []
    
    for p in paths:
        if not os.path.exists(p):
            result['missing_files'] += 1
            result['issues'].append(f"Missing file: {p}")
            continue
            
        with open(p, 'rb') as f:
            h = hashlib.sha256(f.read()).hexdigest()
            hashes.append(h)
            
        img = cv2.imread(p)
        if img is None:
            result['issues'].append(f"Corrupt image: {p}")
            continue
            
        imgs.append(img)
        dhashes.append(compute_dhash(img))
        
    if len(hashes) != 3 or len(imgs) != 3:
        return result
        
    # Check exact duplicates
    if len(set(hashes)) < 3:
        result['duplicate_photos'] = True
        result['issues'].append("Contains identical file hashes")
        
    # Check pairwise relations for mirroring / cropping / artificial modification
    # 0: front, 1: rear, 2: side
    angles = ['front', 'rear', 'side']
    
    for i in range(3):
        for j in range(i + 1, 3):
            # 1. Check direct dhash dist
            dist = dhash_distance(dhashes[i], dhashes[j])
            if dist <= 3:
                result['artificially_modified'] = True
                result['issues'].append(f"{angles[j]} is a perceptual duplicate/copy of {angles[i]} (dHash dist {dist})")
                
            # 2. Check horizontally flipped version
            img_j_flip = cv2.flip(imgs[j], 1)
            dh_j_flip = compute_dhash(img_j_flip)
            dist_flip = dhash_distance(dhashes[i], dh_j_flip)
            
            # Compute pixel diff on flipped image
            if imgs[i].shape == img_j_flip.shape:
                pixel_diff = np.mean(cv2.absdiff(imgs[i], img_j_flip))
            else:
                resized_flip = cv2.resize(img_j_flip, (imgs[i].shape[1], imgs[i].shape[0]))
                pixel_diff = np.mean(cv2.absdiff(imgs[i], resized_flip))
                
            if dist_flip <= 4 or pixel_diff < 15.0:
                result['mirrored_photos'] = True
                result['artificially_modified'] = True
                result['issues'].append(f"{angles[j]} photograph is horizontally mirrored from {angles[i]} (pixel diff: {pixel_diff:.2f})")

    # Count genuinely valid photos
    if not result['duplicate_photos'] and not result['artificially_modified'] and not result['missing_files'] and len(result['issues']) == 0:
        result['valid_photos'] = 3
    else:
        # If rear is mirrored front, only front (and possibly side if side is unique) are valid photos
        # Let's count how many distinct non-synthetic photos exist
        # If rear is mirrored front, rear is INVALID (artificially modified duplicate)
        invalid_count = 0
        if result['mirrored_photos'] or result['artificially_modified'] or result['duplicate_photos']:
            # Count invalid photos
            invalid_count += 1 # At least 1 photo is a mirrored/modified duplicate
        result['valid_photos'] = max(0, 3 - invalid_count)
        
    return result

def main():
    with open('./scratch/catalog_dump.json', 'r') as f:
        data = json.load(f)
        
    vehicles = data['vehicles']
    
    total_cars = data['carsCount']
    total_bikes = data['bikesCount']
    total_models = data['totalCount']
    
    cars_with_3_valid = 0
    bikes_with_3_valid = 0
    
    models_audited = []
    
    artificially_modified_count = 0
    duplicate_photos_count = 0
    missing_photos_count = 0
    wrong_model_count = 0
    cross_model_reuses_count = 0
    
    path_to_models = {}
    hash_to_models = {}
    
    for v in vehicles:
        res = analyze_model_photos(v)
        models_audited.append(res)
        
        if res['artificially_modified']:
            artificially_modified_count += 1
        if res['duplicate_photos']:
            duplicate_photos_count += 1
        if res['missing_files'] > 0:
            missing_photos_count += res['missing_files']
            
        if res['valid_photos'] == 3:
            if res['type'] == 'Car':
                cars_with_3_valid += 1
            else:
                bikes_with_3_valid += 1
                
        for p in res['paths']:
            if p in path_to_models:
                cross_model_reuses_count += 1
            path_to_models[p] = res['title']
            
    models_with_3_valid = cars_with_3_valid + bikes_with_3_valid
    total_valid_photos = sum(r['valid_photos'] for r in models_audited)
    
    print("==================================================")
    print("THOROUGH CATALOGUE VISUAL ANALYSIS SUMMARY")
    print("==================================================")
    print(f"Cars audited: {cars_with_3_valid} / {total_cars} valid 3-angle models")
    print(f"Bikes/Scooters audited: {bikes_with_3_valid} / {total_bikes} valid 3-angle models")
    print(f"Total models: {models_with_3_valid} / {total_models} valid 3-angle models")
    print(f"Total valid photos: {total_valid_photos} / 621")
    print(f"Artificially modified / Mirrored photos found in: {artificially_modified_count} models")
    print(f"Duplicate photographs: {duplicate_photos_count}")
    print(f"Missing photos: {missing_photos_count}")
    print(f"Cross-model reused photos: {cross_model_reuses_count}")

    with open('./scratch/thorough_audit_results.json', 'w') as f:
        json.dump(models_audited, f, indent=2)

if __name__ == '__main__':
    main()
