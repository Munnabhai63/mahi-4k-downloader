#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/opt/mahi-4k-downloader/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE does not exist" >&2
    exit 1
fi

TOKEN=$(grep '^CLOUDFLARE_TUNNEL_TOKEN=' "$ENV_FILE" | cut -d'=' -f2-)
if [ -z "$TOKEN" ]; then
    echo "Error: CLOUDFLARE_TUNNEL_TOKEN is empty" >&2
    exit 1
fi

docker rm -f mahi_named_tunnel_prod 2>/dev/null || true

docker run -d \
  --name mahi_named_tunnel_prod \
  --restart unless-stopped \
  --network mahi_downloader_stack_mahi_backend_net \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$TOKEN" >/dev/null

echo "LAUNCH_SUCCESS: mahi_named_tunnel_prod is running on mahi_downloader_stack_mahi_backend_net"
