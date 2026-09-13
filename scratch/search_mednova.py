import os

target_dir = '/Users/pepetihemanthkumar/Documents/DriveEase'
terms = ['mednova', 'med nova', 'virtual healthcare']

matches = []

valid_exts = {'.js', '.jsx', '.html', '.css', '.json', '.md', '.txt', '.svg', '.cjs', '.mjs', '.ts', '.tsx', '.config'}

for root, dirs, files in os.walk(target_dir):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in valid_exts or f in ['Dockerfile', 'README', 'LICENSE', 'index.html', 'package.json', 'vite.config.js']:
            filepath = os.path.join(root, f)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                    for line_num, line in enumerate(fp, 1):
                        for term in terms:
                            if term in line.lower():
                                matches.append((filepath, line_num, line.strip()))
            except Exception:
                pass

print(f"Total MedNova matches found: {len(matches)}")
for m in matches:
    print(f"FILE: {m[0]}\nLINE {m[1]}: {m[2]}\n---")
