import os
import shutil
import zipfile
import sys

def package_portable():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    dist_dir = os.path.join(root_dir, "dist_package")
    staging_dir = os.path.join(dist_dir, "Mahi_4K_Downloader_Portable")
    zip_output = os.path.join(dist_dir, "Mahi_4K_Downloader_Portable.zip")

    print("[*] Preparing portable distribution package...")
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir, ignore_errors=True)
    os.makedirs(staging_dir, exist_ok=True)

    # 1. Copy Launchers and Scripts
    files_to_copy = [
        ("Launch_Mahi_4K.bat", "Launch_Mahi_4K.bat"),
        ("Install_Mahi_4K_Desktop.bat", "Install_And_Run.bat"),
        ("Install_Mahi_4K_Desktop.bat", "Install_Mahi_4K_Desktop.bat"),
        ("package.json", "package.json"),
        ("pnpm-workspace.yaml", "pnpm-workspace.yaml"),
    ]

    for src_rel, dst_rel in files_to_copy:
        src = os.path.join(root_dir, src_rel)
        dst = os.path.join(staging_dir, dst_rel)
        if os.path.isfile(src):
            shutil.copy2(src, dst)
            print(f"  + Copied file: {dst_rel}")

    # 2. Copy scripts directory
    shutil.copytree(
        os.path.join(root_dir, "scripts"),
        os.path.join(staging_dir, "scripts"),
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc")
    )
    print("  + Copied scripts/ folder")

    # 3. Copy assets
    if os.path.exists(os.path.join(root_dir, "assets")):
        shutil.copytree(
            os.path.join(root_dir, "assets"),
            os.path.join(staging_dir, "assets")
        )
        print("  + Copied assets/ (icons and logos)")

    # 4. Copy backend API dist
    api_dist_src = os.path.join(root_dir, "services", "api", "dist")
    api_dist_dst = os.path.join(staging_dir, "services", "api", "dist")
    if os.path.exists(api_dist_src):
        shutil.copytree(api_dist_src, api_dist_dst)
        print("  + Copied services/api/dist (compiled API)")
    
    # Copy api package.json
    api_pkg = os.path.join(root_dir, "services", "api", "package.json")
    if os.path.exists(api_pkg):
        os.makedirs(os.path.dirname(api_dist_dst), exist_ok=True)
        shutil.copy2(api_pkg, os.path.join(staging_dir, "services", "api", "package.json"))

    # 5. Copy worker
    worker_src = os.path.join(root_dir, "services", "worker")
    worker_dst = os.path.join(staging_dir, "services", "worker")
    if os.path.exists(worker_src):
        shutil.copytree(
            worker_src,
            worker_dst,
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "temp_*")
        )
        print("  + Copied services/worker/ (yt-dlp downloader)")

    # 6. Copy Web App (compiled .next and public assets)
    web_dir = os.path.join(staging_dir, "apps", "web")
    os.makedirs(web_dir, exist_ok=True)
    
    for item in ["public", "package.json"]:
        src_it = os.path.join(root_dir, "apps", "web", item)
        if os.path.exists(src_it):
            if os.path.isdir(src_it):
                shutil.copytree(src_it, os.path.join(web_dir, item))
            else:
                shutil.copy2(src_it, os.path.join(web_dir, item))

    # Copy .next production build
    next_src = os.path.join(root_dir, "apps", "web", ".next")
    if os.path.exists(next_src):
        shutil.copytree(
            next_src,
            os.path.join(web_dir, ".next"),
            ignore=shutil.ignore_patterns("cache")
        )
        print("  + Copied apps/web/.next (production Next.js bundle)")

    # 7. Create Hindi User Manual (README_HINDI.txt)
    readme_content = """======================================================================
     Mahi 4K Downloader (Turbo Edition) - By Munna Bhai
======================================================================

मुन्ना भाई द्वारा निर्मित 'माही 4K डाउनलोडर' में आपका स्वागत है!
यह सॉफ्टवेयर बिना किसी विज्ञापन (Ad-Free) के सुपरफास्ट स्पीड से 
4K/8K वीडियो और MP3 ऑडियो डाउनलोड करने के लिए बनाया गया है।

----------------------------------------------------------------------
सॉफ्टवेयर कैसे इंस्टॉल और शुरू करें:
----------------------------------------------------------------------
1. इस पूरे फोल्डर में मौजूद 'Install_And_Run.bat' फाइल पर डबल-क्लिक करें।
2. यह आपके कंप्यूटर के डेस्कटॉप पर 'Mahi 4K Downloader' नाम का एक 
   शॉर्टकट आइकन बना देगा।
3. ऐप तुरंत एक सुंदर और साफ डेस्कटॉप विंडो में अपने आप खुल जाएगा।
4. अगली बार से आपको इस फोल्डर में आने की भी जरूरत नहीं है, 
   आप सीधे अपने डेस्कटॉप पर बने 'Mahi 4K Downloader' आइकन पर 
   डबल-क्लिक करके सॉफ्टवेयर चला सकते हैं!

----------------------------------------------------------------------
मुख्य विशेषताएं:
----------------------------------------------------------------------
- 4K और 8K अल्ट्रा-एचडी वीडियो डाउनलोडिंग
- 320kbps तक का हाई-क्वालिटी MP3 ऑडियो एक्सट्रैक्शन
- YouTube, Instagram Reels, TikTok (बिना वॉटरमार्क), Facebook, X आदि का सपोर्ट
- 1-क्लिक बैच डाउनलोडिंग (एक साथ कई लिंक्स डाउनलोड करें)
- 100% सेफ, क्लीन और प्राइवेसी प्रोटेक्टेड

प्रोजेक्ट ओनर: मुन्ना भाई (Munna Bhai)
सॉफ्टवेयर: Mahi 4K Downloader
======================================================================
"""
    readme_path = os.path.join(staging_dir, "README_SETUP_HINDI.txt")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    print("  + Created README_SETUP_HINDI.txt")

    # 8. Create standalone ZIP archive
    print(f"[*] Compressing into ZIP: {zip_output} ...")
    if os.path.exists(zip_output):
        os.remove(zip_output)

    with zipfile.ZipFile(zip_output, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(staging_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, dist_dir)
                zf.write(abs_path, rel_path)

    zip_size_mb = os.path.getsize(zip_output) / (1024 * 1024)
    print(f"[OK] Successfully created: {zip_output} ({zip_size_mb:.2f} MB)")
    return zip_output, zip_size_mb

if __name__ == "__main__":
    package_portable()
