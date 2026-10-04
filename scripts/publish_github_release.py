import os
import subprocess
import requests
import json

def get_git_token():
    cmd = "protocol=https\nhost=github.com\n"
    proc = subprocess.run(["git", "credential", "fill"], input=cmd, capture_output=True, text=True, check=True)
    for line in proc.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1].strip()
    return None

def main():
    token = get_git_token()
    if not token:
        raise Exception("Could not find GitHub token from git credential helper.")

    repo = "Munnabhai63/mahi-4k-downloader"
    tag = "v1.0.0-beta"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "My4KDownloader-Deployer"
    }

    # 1. Check or create release
    print(f"Checking for existing release {tag} on {repo}...")
    res = requests.get(f"https://api.github.com/repos/{repo}/releases", headers=headers)
    release = None
    if res.ok:
        for r in res.json():
            if r.get("tag_name") == tag:
                release = r
                break

    release_body = (
        "## My 4K Downloader v1.0.0 (Windows Beta)\n\n"
        "Standalone 4K UHD Video & High Quality 320kbps MP3 Desktop Downloader for Windows 10/11 x64.\n\n"
        "### Verified Supported Platforms (Beta)\n"
        "- **YouTube**: 4K UHD, 1080p Full HD, 720p HD, and High Quality 320kbps MP3 extraction\n"
        "- **Direct Streams**: Direct MP4, WebM, HLS/m3u8 URLs\n"
        "- **Facebook**: Public videos (best-effort)\n\n"
        "### Limited / Not Yet Verified\n"
        "- Instagram, TikTok, X (Twitter): Unauthenticated access is blocked by upstream anti-scraping walls or regional ISP blocks.\n"
        "- Private, account-restricted, or DRM-protected content is NOT supported.\n\n"
        "### Checksums (SHA-256)\n"
        "- **Installer**: `769E0141AF274479B7A57FE17BD214D19EF9066D0066C43FED1A1C3AF3E610F1`\n"
        "- **Portable ZIP**: `E388F668357CD073625ECC6D5A833F9BF76FE361EC21091239EB94FA25687AC8`\n"
    )

    if not release:
        print(f"Creating new GitHub Release {tag}...")
        create_data = {
            "tag_name": tag,
            "target_commitish": "main",
            "name": "My 4K Downloader v1.0.0 (Windows Beta)",
            "body": release_body,
            "draft": False,
            "prerelease": True
        }
        res = requests.post(f"https://api.github.com/repos/{repo}/releases", headers=headers, json=create_data)
        res.raise_for_status()
        release = res.json()
    else:
        print(f"Found existing release ID {release['id']}")

    release_id = release["id"]
    upload_url_template = release["upload_url"]
    upload_base = upload_url_template.split("{")[0]

    # Delete existing assets if they exist
    existing_assets = {a["name"]: a["id"] for a in release.get("assets", [])}

    files_to_upload = [
        ("My_4K_Downloader_1.0.0_x64_Setup.exe", "dist_release/My_4K_Downloader_1.0.0_x64_Setup.exe", "application/octet-stream"),
        ("My_4K_Downloader_v1.0.0_Portable_x64.zip", "dist_release/My_4K_Downloader_v1.0.0_Portable_x64.zip", "application/zip"),
        ("SHA256SUMS.txt", "dist_release/SHA256SUMS.txt", "text/plain"),
    ]

    download_urls = {}
    for filename, filepath, content_type in files_to_upload:
        if filename in existing_assets:
            print(f"Deleting existing asset {filename} (ID: {existing_assets[filename]})...")
            requests.delete(f"https://api.github.com/repos/{repo}/releases/assets/{existing_assets[filename]}", headers=headers)

        print(f"Uploading {filename} ({os.path.getsize(filepath):,} bytes)...")
        with open(filepath, "rb") as f:
            upload_headers = {
                "Authorization": f"token {token}",
                "Content-Type": content_type,
                "User-Agent": "My4KDownloader-Deployer"
            }
            upload_res = requests.post(
                f"{upload_base}?name={filename}",
                headers=upload_headers,
                data=f
            )
            upload_res.raise_for_status()
            data = upload_res.json()
            download_urls[filename] = data.get("browser_download_url")
            print(f"Uploaded {filename} -> {download_urls[filename]}")

    print("\n=== RELEASE ASSETS PUBLISHED SUCCESSFULLY ===")
    for k, v in download_urls.items():
        print(f"{k}: {v}")

if __name__ == "__main__":
    main()
