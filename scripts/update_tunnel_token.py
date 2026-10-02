import os
import sys

token = sys.stdin.read().strip()
if not token:
    print("Error: Empty token provided.", file=sys.stderr)
    sys.exit(1)

env_path = "/opt/mahi-4k-downloader/.env"
if not os.path.exists(env_path):
    print(f"Error: {env_path} not found.", file=sys.stderr)
    sys.exit(1)

with open(env_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

found = False
new_lines = []
for line in lines:
    if line.startswith("CLOUDFLARE_TUNNEL_TOKEN="):
        new_lines.append(f"CLOUDFLARE_TUNNEL_TOKEN={token}\n")
        found = True
    else:
        new_lines.append(line)

if not found:
    if new_lines and not new_lines[-1].endswith("\n"):
        new_lines[-1] += "\n"
    new_lines.append(f"CLOUDFLARE_TUNNEL_TOKEN={token}\n")

with open(env_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

os.chmod(env_path, 0o600)
print("SUCCESS: CLOUDFLARE_TUNNEL_TOKEN updated safely. All existing variables preserved with chmod 600.")
