def is_valid_domain_title(title, category_type):
    t = title.lower()
    
    # 1. Reject front views when searching for rear
    if 'front view' in t or 'front_view' in t or 'front-view' in t or 'front.jpg' in t or 'front.png' in t or 'front.webp' in t:
        return False
        
    # 2. Reject non-vehicle domain terms
    rejected_terms = [
        'magazine', 'editor', 'diaries', 'book', 'journal', 'letter', 'newspaper',
        'sea harrier', 'aerospace', 'aircraft', 'airplane', 'jet', 'fighter', 'naca',
        'overpass', 'bridge', 'highway', 'road', 'building', 'street', 'logo', 'interior',
        'engine', 'wheel', 'seat', 'dashboard', 'steering', 'pedal', 'diagram', 'map', 'poster'
    ]
    
    if category_type == 'Car':
        rejected_terms.extend(['bicycle', 'cycle', 'scooter', 'motorcycle', 'moped'])
    
    if any(rt in t for rt in rejected_terms):
        return False
        
    return True
