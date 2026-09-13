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

print("Donkey punch 2.jpg:", is_valid_domain_title("File:Donkey punch 2.jpg", "Tata", "Punch", "Car"))
print("HS Harrier GR3:", is_valid_domain_title("File:HS Harrier GR3 XZ997 rear.jpg", "Tata", "Harrier", "Car"))
print("Tata Harrier rear:", is_valid_domain_title("File:2020 Tata Harrier XZA+ rear view.jpg", "Tata", "Harrier", "Car"))
