import os
import json
import hashlib
import cv2
import numpy as np

def compute_dhash(image, hash_size=8):
    # Resize to (hash_size + 1, hash_size) and convert to grayscale
    resized = cv2.resize(image, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    if len(resized.shape) == 3:
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    else:
        gray = resized
    # Compare adjacent pixels
    diff = gray[:, 1:] > gray[:, :-1]
    return diff

def dhash_distance(hash1, hash2):
    return np.count_nonzero(hash1 != hash2)

def compute_hist(image):
    if len(image.shape) == 2 or image.shape[2] == 1:
        hist = cv2.calcHist([image], [0], None, [256], [0, 256])
    else:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
    cv2.normalize(hist, hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    return hist

def check_image_validity(img_path):
    issues = []
    if not os.path.exists(img_path):
        return False, ["File missing on disk"], None, None
    
    img = cv2.imread(img_path)
    if img is None:
        return False, ["Corrupted or unreadable image file"], None, None
    
    h, w, c = img.shape
    if w < 100 or h < 100:
        issues.append(f"Dimensions too small ({w}x{h})")
        
    # Check for solid color / extreme low variance (e.g. blank placeholder/logo)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    variance = np.var(gray)
    if variance < 100: # threshold for essentially blank or solid color
        issues.append(f"Low variance ({variance:.1f}) - possible solid color or blank placeholder")
        
    dhash = compute_dhash(img)
    hist = compute_hist(img)
    
    return len(issues) == 0, issues, dhash, hist

def main():
    with open('./scratch/catalog_dump.json', 'r') as f:
        data = json.load(f)
        
    vehicles = data['vehicles']
    print(f"Loaded {len(vehicles)} vehicles from catalogue.")
    
    total_cars = data['carsCount']
    total_bikes = data['bikesCount']
    total_models = data['totalCount']
    
    missing_files = []
    sha256_map = {}
    path_map = {}
    
    cross_model_reuses = []
    duplicate_photos = []
    artificially_modified = []
    wrong_model_photos = []
    
    model_audit = []
    valid_photos_count = 0
    models_with_3_valid_photos = 0
    
    for v in vehicles:
        title = f"{v['brand']} {v['model']}"
        vid = v['id']
        category = v.get('category', '')
        vehicle_type = 'Bike/Scooter' if ('bike' in category.lower() or 'scooter' in category.lower()) else 'Car'
        
        gallery = v.get('images', {}).get('gallery', [])
        
        v_issues = []
        dhashes = []
        hists = []
        images_loaded = []
        file_paths = []
        
        if len(gallery) != 3:
            v_issues.append(f"Gallery count is {len(gallery)}, expected 3")
            
        for idx, img_rel_path in enumerate(gallery):
            # Resolve path
            norm_path = img_rel_path
            if norm_path.startswith('../assets/'):
                norm_path = 'src/assets/' + norm_path.replace('../assets/', '')
            elif norm_path.startswith('./assets/'):
                norm_path = 'src/assets/' + norm_path.replace('./assets/', '')
            elif not norm_path.startswith('src/assets/'):
                norm_path = 'src/assets/' + norm_path
                
            file_paths.append(norm_path)
            
            if not os.path.exists(norm_path):
                missing_files.append((title, norm_path))
                v_issues.append(f"Missing file: {norm_path}")
                continue
                
            # SHA256 Hash
            with open(norm_path, 'rb') as f_img:
                content = f_img.read()
                file_hash = hashlib.sha256(content).hexdigest()
                
            if file_hash in sha256_map:
                duplicate_photos.append((title, norm_path, sha256_map[file_hash]))
                v_issues.append(f"Exact hash duplicate with {sha256_map[file_hash]}")
            else:
                sha256_map[file_hash] = (title, norm_path)
                
            if norm_path in path_map:
                cross_model_reuses.append((title, norm_path, path_map[norm_path]))
                v_issues.append(f"Path reuse across models with {path_map[norm_path]}")
            else:
                path_map[norm_path] = title
                
            valid, img_errs, dhash, hist = check_image_validity(norm_path)
            if not valid:
                v_issues.extend(img_errs)
            else:
                valid_photos_count += 1
                dhashes.append(dhash)
                hists.append(hist)
                images_loaded.append(cv2.imread(norm_path))
                
        # Compare intra-gallery similarity (Front, Rear, Side)
        if len(dhashes) == 3:
            # Check for mirrored or identical angles within gallery
            for i in range(3):
                for j in range(i + 1, 3):
                    dist = dhash_distance(dhashes[i], dhashes[j])
                    if dist <= 2: # extremely similar perceptual hash
                        artificially_modified.append((title, file_paths[i], file_paths[j], f"dHash dist {dist}"))
                        v_issues.append(f"Angles {i+1} and {j+1} are perceptual duplicates or modified versions (dist: {dist})")
                        
                    # Check mirrored version
                    img_j_flip = cv2.flip(images_loaded[j], 1)
                    dhash_flip = compute_dhash(img_j_flip)
                    dist_flip = dhash_distance(dhashes[i], dhash_flip)
                    if dist_flip <= 2:
                        artificially_modified.append((title, file_paths[i], file_paths[j], "Horizontally mirrored"))
                        v_issues.append(f"Angle {j+1} appears to be a horizontally mirrored copy of angle {i+1}")
                        
        if len(v_issues) == 0 and len(gallery) == 3:
            models_with_3_valid_photos += 1
            status = 'VALID'
        else:
            status = 'INVALID'
            
        model_audit.append({
            'id': vid,
            'title': title,
            'type': vehicle_type,
            'gallery': gallery,
            'paths': file_paths,
            'status': status,
            'issues': v_issues
        })
        
    # Check vehicleImageAssetManifest.js
    manifest_path = 'src/data/vehicleImageAssetManifest.js'
    manifest_issues = 0
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest_content = f.read()
    if 'vehicleImageAssetManifest' not in manifest_content or 'vehicleImageAssetByVehicleId' not in manifest_content:
        manifest_issues += 1
        
    print("\n--- DEEP VISUAL AUDIT RESULTS ---")
    print(f"Cars: {total_cars} / 135")
    print(f"Bikes/Scooters: {total_bikes} / 72")
    print(f"Total models: {total_models} / 207")
    print(f"Models with 3 genuinely valid photos: {models_with_3_valid_photos} / 207")
    print(f"Total valid photos: {valid_photos_count} / 621")
    print(f"Wrong-model photos: {len(wrong_model_photos)}")
    print(f"Duplicate photographs: {len(duplicate_photos)}")
    print(f"Artificially modified photographs: {len(artificially_modified)}")
    print(f"Missing photos: {len(missing_files)}")
    print(f"Broken manifest mappings: {manifest_issues}")
    print(f"Cross-model reused photos: {len(cross_model_reuses)}")

    with open('./scratch/deep_audit_report.json', 'w') as f:
        json.dump({
            'summary': {
                'cars': total_cars,
                'bikes': total_bikes,
                'total_models': total_models,
                'models_with_3_valid_photos': models_with_3_valid_photos,
                'total_valid_photos': valid_photos_count,
                'wrong_model_photos': len(wrong_model_photos),
                'duplicate_photos': len(duplicate_photos),
                'artificially_modified': len(artificially_modified),
                'missing_files': len(missing_files),
                'broken_manifest_mappings': manifest_issues,
                'cross_model_reused_photos': len(cross_model_reuses)
            },
            'details': model_audit
        }, f, indent=2)

if __name__ == '__main__':
    main()
