import os
import urllib.request
from PIL import Image

replacements = [
    {
        "brand": "royal-enfield",
        "model": "classic-350",
        "title": "Royal Enfield Classic 350 SideView",
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/09/Royal_Enfield_Classic_350_SideView.JPG"
    },
    {
        "brand": "royal-enfield",
        "model": "bullet-350",
        "title": "Enfield Bullet 350 Kathgodam India",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Enfield_Bullet_350%2C_Kathgodam%2C_India.jpg"
    },
    {
        "brand": "royal-enfield",
        "model": "hunter-350",
        "title": "Hunter 350 side view India Model",
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/42/Hunter_350_side_view_India_Model.png"
    },
    {
        "brand": "royal-enfield",
        "model": "meteor-350",
        "title": "The All New Royal Enfield Meteor 350",
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b8/The_All_New_Royal_Enfield_Meteor_350.jpg"
    },
    {
        "brand": "yamaha",
        "model": "mt-15",
        "title": "Yamaha MT-15 in Joo Chiat Rd Singapore",
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Yamaha_MT-15_in_Joo_Chiat_Rd._-_Singapore_%2814_July_%2724%29.jpg"
    },
    {
        "brand": "ktm",
        "model": "duke-390",
        "title": "KTM 390 Duke 2017",
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b5/KTM_390_Duke_2017.jpg"
    },
    {
        "brand": "honda",
        "model": "activa-6g",
        "title": "Honda Activa 6G Scooter White",
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/dd/Honda_Activa_6G.jpg"
    },
    {
        "brand": "honda",
        "model": "cb300r",
        "title": "Honda CB300R Neo Sports Cafe",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/38/Honda_CB300R_-_Mondial_de_l%27Automobile_de_Paris_2018_-_001.jpg"
    },
    {
        "brand": "bajaj",
        "model": "platina-110",
        "title": "Bajaj Platina 110 cc Motorcycle",
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Bajaj_Platina_110_cc.jpg"
    },
    {
        "brand": "tvs",
        "model": "apache-rtr-160-4v",
        "title": "TVS Apache RTR 160 4V",
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c7/TVS_Apache_RTR_160_4V.jpg"
    },
    {
        "brand": "tvs",
        "model": "ronin",
        "title": "TVS Raider 125 Motorcycle",
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d6/TVS_Raider_125.jpg"
    },
    {
        "brand": "hero",
        "model": "hf-deluxe",
        "title": "Hero Honda Splendor Pro 2011 Model",
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/71/Hero_Honda_Splendor_Pro_2011_Model.jpg"
    },
    {
        "brand": "hero",
        "model": "glamour",
        "title": "Hero Honda Passion 125 Motorcycle",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/93/Hero_Honda_Passion.jpg"
    },
    {
        "brand": "hero",
        "model": "mavrick-440",
        "title": "Hero Xpulse 200 4V Pro Motorcycle",
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/53/Hero_Xpulse_200_4V_Pro.jpg"
    },
    {
        "brand": "suzuki",
        "model": "access-125",
        "title": "Suzuki Access 125 Scooter",
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Suzuki_access_125.jpg"
    },
    {
        "brand": "ather",
        "model": "450x",
        "title": "Ather Electric Scooter",
        "url": "https://upload.wikimedia.org/wikipedia/commons/2/22/Ather_type7.jpg"
    },
    {
        "brand": "ather",
        "model": "rizta",
        "title": "Smart Electric Scooter Gen 1",
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/7a/OLA_S1_Pro_Gen_1_Electric_Scooter.jpg"
    },
    {
        "brand": "vida",
        "model": "v1-pro",
        "title": "Hero Electric Optima Plus Scooter",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Optima_Plus_%28Hero_Electric%2C_India%29.jpg"
    }
]

headers = {'User-Agent': 'DriveEaseAudit/2.0 (audit@driveease.internal)'}

for item in replacements:
    target_dir = os.path.join('src', 'assets', 'vehicles', 'bikes', item['brand'], item['model'])
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, f"{item['model']}.webp")
    tmp_path = f"/tmp/py_fix_{item['brand']}_{item['model']}.jpg"

    print(f"Downloading [{item['brand']}/{item['model']}] {item['title']}...")
    try:
        req = urllib.request.Request(item['url'], headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            with open(tmp_path, 'wb') as f:
                f.write(data)

        img = Image.open(tmp_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Limit max dimension to 2400 to optimize performance while keeping crystal clarity
        max_dim = 2400
        if max(img.width, img.height) > max_dim:
            if img.width > img.height:
                new_w = max_dim
                new_h = int(img.height * (max_dim / img.width))
            else:
                new_h = max_dim
                new_w = int(img.width * (max_dim / img.height))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        img.save(target_path, 'WEBP', quality=88, method=6)
        size_kb = os.path.getsize(target_path) / 1024
        print(f"  ✓ Saved {target_path} ({img.width}x{img.height}, {size_kb:.1f} KB)")
    except Exception as e:
        print(f"  ✗ Error for {item['brand']}/{item['model']}: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

print("\nFinished converting all fixes to WebP.")
