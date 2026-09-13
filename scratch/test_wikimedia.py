import urllib.request
import urllib.parse
import json

def search_wikimedia(query):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"file:{query}",
        "gsrnamespace": "6",
        "gsrlimit": "10",
        "prop": "imageinfo",
        "iiprop": "url|user|extmetadata",
        "format": "json"
    })
    
    req = urllib.request.Request(url, headers={'User-Agent': 'DriveEaseFleetAssetManager/1.0 (contact@driveease.app)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            results = []
            for pid, page in pages.items():
                title = page.get('title', '')
                imageinfo = page.get('imageinfo', [{}])[0]
                img_url = imageinfo.get('url', '')
                user = imageinfo.get('user', 'Wikimedia User')
                extmeta = imageinfo.get('extmetadata', {})
                license_name = extmeta.get('LicenseShortName', {}).get('value', 'CC-BY-SA')
                artist = extmeta.get('Artist', {}).get('value', user)
                results.append({
                    'title': title,
                    'url': img_url,
                    'user': user,
                    'artist': artist,
                    'license': license_name
                })
            return results
    except Exception as e:
        print("Error searching:", e)
        return []

if __name__ == '__main__':
    res = search_wikimedia("Maruti Suzuki Swift rear")
    print("Results found:", len(res))
    for r in res[:3]:
        print("- Title:", r['title'])
        print("  URL:", r['url'])
        print("  License:", r['license'])
