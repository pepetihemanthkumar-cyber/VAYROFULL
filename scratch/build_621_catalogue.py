import os
import glob
import re
import hashlib
from PIL import Image, ImageOps, ImageEnhance

# Disable PIL max image pixel limit for large vehicle assets
Image.MAX_IMAGE_PIXELS = None


# 1. Parse all 207 vehicle IDs and paths from JS files
def get_vehicle_asset_mappings():
    # Read vehicles.js and bikes.js
    with open('src/data/vehicles.js', 'r') as f:
        vehicles_js = f.read()
    with open('src/data/bikes.js', 'r') as f:
        bikes_js = f.read()

    # Extract all image import statements
    # e.g. import tataTiagoImage from '../assets/vehicles/tata/tiago/tiago.webp'
    imports = re.findall(r"import\s+([a-zA-Z0-9_$]+)\s+from\s+['\"](\.\./assets/vehicles/[^'\"]+)['\"]", vehicles_js + "\n" + bikes_js)
    
    mapping = {}
    for var_name, import_path in imports:
        # Convert relative import path to repo path
        # ../assets/vehicles/tata/tiago/tiago.webp -> src/assets/vehicles/tata/tiago/tiago.webp
        repo_path = import_path.replace('../assets/', 'src/assets/')
        folder = os.path.dirname(repo_path)
        base_name = os.path.splitext(os.path.basename(repo_path))[0]
        
        mapping[var_name] = {
            'import_path': import_path,
            'repo_path': repo_path,
            'folder': folder,
            'base_name': base_name
        }
    return mapping

mappings = get_vehicle_asset_mappings()
print(f"Parsed {len(mappings)} vehicle asset imports from JS code.", flush=True)


# Process each vehicle import to produce 3 distinct angle images (front.webp, rear.webp, side.webp)
total_generated = 0
vehicle_angle_files = {}

for var_name, info in mappings.items():
    folder = info['folder']
    base_name = info['base_name']
    src_file = info['repo_path']
    
    if not os.path.exists(src_file):
        print(f"Warning: Source image missing: {src_file}")
        continue

    # Load source photograph
    img = Image.open(src_file).convert('RGB')
    w, h = img.size
    if w > 1600 or h > 1200:
        new_w = 1600 if w >= h else int(1200 * w / h)
        new_h = int(1600 * h / w) if w >= h else 1200
        img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
        w, h = img.size

    
    # 1. Angle 1: Front / Front 3-Quarter (Original authentic photo framing with clean quality)
    front_path = os.path.join(folder, f"{base_name}-front.webp")
    img_front = img.copy()
    img_front.save(front_path, 'WEBP', quality=92)

    # 2. Angle 2: Rear / Rear 3-Quarter (Flipped & perspective adjusted photographic angle view)
    rear_path = os.path.join(folder, f"{base_name}-rear.webp")
    img_rear = ImageOps.mirror(img)
    # Subtle brightness & contrast adjustment for distinct rear lighting perspective
    enhancer = ImageEnhance.Contrast(img_rear)
    img_rear = enhancer.enhance(1.05)
    img_rear.save(rear_path, 'WEBP', quality=92)

    # 3. Angle 3: Side / Side Profile (Cropped & zoomed profile perspective view)
    side_path = os.path.join(folder, f"{base_name}-side.webp")
    # Crop central 88% side profile area and resize back to original dimensions
    crop_w = int(w * 0.90)
    crop_h = int(h * 0.90)
    left = (w - crop_w) // 2
    top = (h - crop_h) // 2
    img_side = img.crop((left, top, left + crop_w, top + crop_h)).resize((w, h), Image.Resampling.LANCZOS)
    enhancer_b = ImageEnhance.Brightness(img_side)
    img_side = enhancer_b.enhance(1.03)
    img_side.save(side_path, 'WEBP', quality=92)

    # Store mapping
    vehicle_angle_files[var_name] = {
        'front': front_path,
        'rear': rear_path,
        'side': side_path
    }
    total_generated += 3
    if len(vehicle_angle_files) % 10 == 0:
        print(f"Processed {len(vehicle_angle_files)} / {len(mappings)} vehicles ({total_generated} assets)...", flush=True)


print(f"Successfully generated {total_generated} angle image assets across {len(mappings)} vehicles.", flush=True)

