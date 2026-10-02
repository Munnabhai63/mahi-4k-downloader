#!/usr/bin/env bash
# ==============================================================================
# VPS READ-ONLY AUDIT SCRIPT — STRICTLY NON-DESTRUCTIVE
# Project: Mahi 4K Downloader (Backend Deployment Pre-flight)
# GUARANTEE: This script executes ONLY read commands. It modifies ZERO files,
# touches NO configs, restarts NO services, and stops NO containers.
# ==============================================================================

set -u

echo "========================================================================"
echo "           VPS READ-ONLY INVENTORY & PRE-FLIGHT AUDIT"
echo "           Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "========================================================================"
echo ""

echo "--- 1. OPERATING SYSTEM & KERNEL ---"
uname -a 2>&1
if [ -f /etc/os-release ]; then
    cat /etc/os-release | grep -E '^(NAME|VERSION|ID|PRETTY_NAME)='
fi
echo ""

echo "--- 2. CPU / RAM / DISK HARDWARE & USAGE ---"
echo "[CPU Cores & Model]"
lscpu 2>&1 | grep -E 'Model name|Socket\(s\)|Core\(s\) per socket|CPU\(s\):' || grep 'model name' /proc/cpuinfo | head -n 1
echo ""
echo "[RAM / Memory (free -h)]"
free -h 2>&1 || cat /proc/meminfo | grep -E 'MemTotal|MemFree|MemAvailable'
echo ""
echo "[Disk Space (df -h)]"
df -h 2>&1
echo ""

echo "--- 3. DOCKER & DOCKER COMPOSE ENGINE ---"
if command -v docker >/dev/null 2>&1; then
    docker --version 2>&1
    docker compose version 2>&1 || docker-compose --version 2>&1 || echo "docker compose plugin not found"
else
    echo "Docker binary NOT found on host PATH"
fi
echo ""

echo "--- 4. EXISTING DOCKER CONTAINERS (RUNNING & STOPPED) ---"
if command -v docker >/dev/null 2>&1; then
    docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" 2>&1
else
    echo "N/A"
fi
echo ""

echo "--- 5. EXISTING DOCKER NETWORKS ---"
if command -v docker >/dev/null 2>&1; then
    docker network ls 2>&1
else
    echo "N/A"
fi
echo ""

echo "--- 6. EXISTING DOCKER VOLUMES ---"
if command -v docker >/dev/null 2>&1; then
    docker volume ls 2>&1
else
    echo "N/A"
fi
echo ""

echo "--- 7. EXISTING DOCKER COMPOSE PROJECTS ---"
if command -v docker >/dev/null 2>&1; then
    docker compose ls -a 2>&1 || echo "docker compose ls not supported"
else
    echo "N/A"
fi
echo ""

echo "--- 8. LISTENING NETWORK PORTS (ss -tulpn) ---"
if command -v ss >/dev/null 2>&1; then
    ss -tulpn 2>&1
elif command -v netstat >/dev/null 2>&1; then
    netstat -tulpn 2>&1
else
    echo "Neither ss nor netstat available"
fi
echo ""

echo "--- 9. REVERSE PROXY DETECTION & CONFIGURATIONS ---"
echo "[Checking Caddy service / process]"
systemctl is-active caddy 2>/dev/null || true
pgrep -a caddy 2>/dev/null || true
if [ -d /etc/caddy ]; then
    echo "Found /etc/caddy directory:"
    ls -la /etc/caddy 2>/dev/null || true
fi

echo ""
echo "[Checking Nginx service / process]"
systemctl is-active nginx 2>/dev/null || true
pgrep -a nginx 2>/dev/null || true
if [ -d /etc/nginx ]; then
    echo "Found /etc/nginx directory:"
    ls -la /etc/nginx 2>/dev/null || true
fi

echo ""
echo "[Checking Traefik process / containers]"
pgrep -a traefik 2>/dev/null || true
if command -v docker >/dev/null 2>&1; then
    docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Ports}}" 2>/dev/null || true
    docker ps --filter "name=caddy" --format "table {{.Names}}\t{{.Ports}}" 2>/dev/null || true
    docker ps --filter "name=nginx" --format "table {{.Names}}\t{{.Ports}}" 2>/dev/null || true
fi
echo ""

echo "--- 10. SYSTEMD ACTIVE SERVICES ---"
if command -v systemctl >/dev/null 2>&1; then
    systemctl list-units --type=service --state=running --no-pager 2>&1 | head -n 40
fi
echo ""

echo "--- 11. FIREWALL RULES (UFW / IPTABLES) ---"
if command -v ufw >/dev/null 2>&1; then
    ufw status verbose 2>&1
elif command -v iptables >/dev/null 2>&1; then
    iptables -S 2>&1 | head -n 30
else
    echo "Firewall utility not inspectable without root or not installed"
fi
echo ""

echo "--- 12. CURRENT LOAD & PROCESS SUMMARY ---"
uptime 2>&1
echo ""

echo "========================================================================"
echo "                     END OF READ-ONLY AUDIT"
echo "========================================================================"
