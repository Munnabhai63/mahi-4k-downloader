import os
import subprocess
import time
import requests

def get_git_token():
    cmd = "protocol=https\nhost=github.com\n\n"
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
    tag = "v1.0.2-beta"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "My4KDownloader-Deployer"
    }

    # Validate token and repo permissions
    print(f"Validating GitHub token on repo {repo}...")
    res = requests.get(f"https://api.github.com/repos/{repo}", headers=headers)
    res.raise_for_status()
    repo_data = res.json()
    push_perm = repo_data.get("permissions", {}).get("push", False)
    print(f"Repo: {repo_data['full_name']} | Push permission: {push_perm}")
    if not push_perm:
        raise Exception("Token does not have push permissions on repository.")

    # 1. Check for broken v1.0.1-beta release and delete it if it exists
    print("Checking for broken v1.0.1-beta release...")
    res_rel = requests.get(f"https://api.github.com/repos/{repo}/releases", headers=headers)
    if res_rel.ok:
        for r in res_rel.json():
            if r.get("tag_name") == "v1.0.1-beta":
                rel_id = r["id"]
                print(f"Deleting broken v1.0.1-beta release (ID: {rel_id})...")
                del_res = requests.delete(f"https://api.github.com/repos/{repo}/releases/{rel_id}", headers=headers)
                if del_res.status_code in (204, 200):
                    print("Successfully deleted broken release v1.0.1-beta.")
                else:
                    print(f"Warning: delete returned status {del_res.status_code}: {del_res.text}")

    # 2. Read release notes
    notes_path = "dist_release/RELEASE_NOTES_v1.0.2-beta.md"
    with open(notes_path, "r", encoding="utf-8") as f:
        release_body = f.read()

    # 3. Check or create v1.0.2-beta release
    print(f"Checking for existing release {tag}...")
    res_target = requests.get(f"https://api.github.com/repos/{repo}/releases/tags/{tag}", headers=headers)
    release = None
    if res_target.status_code == 200:
        release = res_target.json()
        print(f"Found existing release ID {release['id']}, updating body...")
        requests.patch(f"https://api.github.com/repos/{repo}/releases/{release['id']}", headers=headers, json={"body": release_body})
    else:
        print(f"Creating new GitHub prerelease {tag}...")
        create_data = {
            "tag_name": tag,
            "target_commitish": "main",
            "name": "My 4K Downloader v1.0.2-beta",
            "body": release_body,
            "draft": False,
            "prerelease": True
        }
        res_create = requests.post(f"https://api.github.com/repos/{repo}/releases", headers=headers, json=create_data)
        res_create.raise_for_status()
        release = res_create.json()
        print(f"Created release {tag} (ID: {release['id']})")

    release_id = release["id"]
    upload_url_template = release["upload_url"]
    upload_base = upload_url_template.split("{")[0]

    # Refresh release info to get assets
    res_rel_info = requests.get(f"https://api.github.com/repos/{repo}/releases/{release_id}", headers=headers)
    existing_assets = {a["name"]: a["id"] for a in res_rel_info.json().get("assets", [])}

    files_to_upload = [
        ("My_4K_Downloader_1.0.2_x64_Setup.exe", "dist_release/My_4K_Downloader_1.0.2_x64_Setup.exe", "application/octet-stream"),
        ("My_4K_Downloader_v1.0.2_Portable_x64.zip", "dist_release/My_4K_Downloader_v1.0.2_Portable_x64.zip", "application/zip"),
    ]

    for filename, filepath, content_type in files_to_upload:
        local_size = os.path.getsize(filepath)
        if filename in existing_assets:
            print(f"Deleting existing asset {filename} (ID: {existing_assets[filename]})...")
            requests.delete(f"https://api.github.com/repos/{repo}/releases/assets/{existing_assets[filename]}", headers=headers)
            time.sleep(1)

        print(f"Uploading {filename} ({local_size:,} bytes)...")
        uploaded = False
        for attempt in range(1, 4):
            try:
                with open(filepath, "rb") as f:
                    upload_headers = {
                        "Authorization": f"token {token}",
                        "Content-Type": content_type,
                        "User-Agent": "My4KDownloader-Deployer"
                    }
                    upload_res = requests.post(
                        f"{upload_base}?name={filename}",
                        headers=upload_headers,
                        data=f,
                        timeout=300
                    )
                    upload_res.raise_for_status()
                    uploaded = True
                    print(f"Attempt {attempt}: Upload request completed.")
                    break
            except Exception as e:
                print(f"Upload attempt {attempt} failed: {e}")
                if attempt < 3:
                    time.sleep(3)

        if not uploaded:
            raise Exception(f"Failed to upload {filename} after 3 attempts.")

        # Verify state == "uploaded" and size == local bytes
        time.sleep(2)
        verify_res = requests.get(f"https://api.github.com/repos/{repo}/releases/{release_id}/assets", headers=headers)
        verify_res.raise_for_status()
        matching = [a for a in verify_res.json() if a["name"] == filename]
        if not matching:
            raise Exception(f"Verification failed: asset {filename} not listed on release!")
        asset = matching[0]
        state = asset.get("state")
        size = asset.get("size")
        print(f"Verified {filename}: state={state}, size={size:,} bytes (expected {local_size:,} bytes)")
        if state != "uploaded" or size != local_size:
            raise Exception(f"Verification mismatch for {filename}: state={state}, size={size} (expected {local_size})")

    # Unset token from memory
    token = None
    del token
    print("\n=== RELEASE v1.0.2-beta PUBLISHED & VERIFIED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()
