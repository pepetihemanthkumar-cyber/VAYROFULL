import os
import re

# 1. Update bikes.js
with open('src/data/bikes.js', 'r') as f:
    bikes_code = f.read()

# Pattern for bike image import:
# import royalEnfieldClassic350Image from '../assets/vehicles/bikes/royal-enfield/classic-350/classic-350.webp'
def update_bike_imports(code):
    # Find all import statements
    def replace_import(match):
        var_name = match.group(1)
        import_path = match.group(2)
        
        # e.g. ../assets/vehicles/bikes/royal-enfield/classic-350/classic-350.webp
        folder_path = os.path.dirname(import_path)
        base_name = os.path.splitext(os.path.basename(import_path))[0]
        
        front_path = f"{folder_path}/{base_name}-front.webp"
        rear_path = f"{folder_path}/{base_name}-rear.webp"
        side_path = f"{folder_path}/{base_name}-side.webp"
        
        front_var = f"{var_name}Front"
        rear_var = f"{var_name}Rear"
        side_var = f"{var_name}Side"
        
        return (f"import {front_var} from '{front_path}'\n"
                f"import {rear_var} from '{rear_path}'\n"
                f"import {side_var} from '{side_path}'")

    updated_code = re.sub(
        r"import\s+([a-zA-Z0-9_$]+Image)\s+from\s+['\"](\.\./assets/vehicles/bikes/[^'\"]+)['\"]",
        replace_import,
        code
    )
    
    # Update bikeImageMap inside bikes.js if present, or createBike logic
    # In bikes.js:
    # image: localImg,
    # images: { primary: localImg, gallery: [localImg] }
    # Update createBike to accept front, rear, side:
    updated_code = updated_code.replace(
        "images: {\n      primary: localImg,\n      gallery: [localImg],\n    }",
        "images: {\n      primary: localImgFront || localImg,\n      gallery: [localImgFront || localImg, localImgRear || localImg, localImgSide || localImg].filter(Boolean),\n    }"
    )
    
    # Also update bikeImageMap definitions:
    # 'royal-enfield-classic-350': royalEnfieldClassic350Image
    def replace_map_entry(match):
        key = match.group(1)
        var_name = match.group(2)
        return f"'{key}': {{ front: {var_name}Front, rear: {var_name}Rear, side: {var_name}Side }}"

    updated_code = re.sub(
        r"['\"]([a-z0-9-]+)['\"]:\s*([a-zA-Z0-9_$]+Image)(?=[,\n\s\}])",
        replace_map_entry,
        updated_code
    )
    return updated_code

updated_bikes_code = update_bike_imports(bikes_code)

# Update createBike mapping in bikes.js
updated_bikes_code = updated_bikes_code.replace(
    "const localImg = bikeImageMap[id]",
    "const localImgObj = bikeImageMap[id]\n    const localImgFront = localImgObj?.front || localImgObj\n    const localImgRear = localImgObj?.rear || localImgObj\n    const localImgSide = localImgObj?.side || localImgObj"
)

with open('src/data/bikes.js', 'w') as f:
    f.write(updated_bikes_code)

print("Successfully updated src/data/bikes.js with 3-angle imports and gallery arrays.")

# 2. Update vehicles.js
with open('src/data/vehicles.js', 'r') as f:
    vehicles_code = f.read()

def update_vehicle_imports(code):
    def replace_import(match):
        var_name = match.group(1)
        import_path = match.group(2)
        folder_path = os.path.dirname(import_path)
        base_name = os.path.splitext(os.path.basename(import_path))[0]
        
        front_path = f"{folder_path}/{base_name}-front.webp"
        rear_path = f"{folder_path}/{base_name}-rear.webp"
        side_path = f"{folder_path}/{base_name}-side.webp"
        
        front_var = f"{var_name}Front"
        rear_var = f"{var_name}Rear"
        side_var = f"{var_name}Side"
        
        return (f"import {front_var} from '{front_path}'\n"
                f"import {rear_var} from '{rear_path}'\n"
                f"import {side_var} from '{side_path}'")

    updated_code = re.sub(
        r"import\s+([a-zA-Z0-9_$]+Image)\s+from\s+['\"](\.\./assets/vehicles/(?!bikes/)[^'\"]+)['\"]",
        replace_import,
        code
    )
    
    def replace_map_entry(match):
        key = match.group(1)
        var_name = match.group(2)
        return f"'{key}': {{ front: {var_name}Front, rear: {var_name}Rear, side: {var_name}Side }}"

    updated_code = re.sub(
        r"['\"]([a-z0-9-]+)['\"]:\s*([a-zA-Z0-9_$]+Image)(?=[,\n\s\}])",
        replace_map_entry,
        updated_code
    )
    
    updated_code = updated_code.replace(
        "const localImg = vehicleImageMap[v.id]",
        "const localImgObj = vehicleImageMap[v.id]\n    const localImgFront = localImgObj?.front || localImgObj\n    const localImgRear = localImgObj?.rear || localImgObj\n    const localImgSide = localImgObj?.side || localImgObj"
    )
    
    updated_code = updated_code.replace(
        "v.image = localImg\n      v.imageVerified = true\n      v.imageSource = 'local-verified'\n      v.images = {\n        primary: localImg,\n        gallery: [localImg],\n      }",
        "v.image = localImgFront\n      v.imageVerified = true\n      v.imageSource = 'local-verified'\n      v.images = {\n        primary: localImgFront,\n        gallery: [localImgFront, localImgRear, localImgSide].filter(Boolean),\n      }"
    )
    
    return updated_code

updated_vehicles_code = update_vehicle_imports(vehicles_code)

with open('src/data/vehicles.js', 'w') as f:
    f.write(updated_vehicles_code)

print("Successfully updated src/data/vehicles.js with 3-angle imports and gallery arrays.")
