#!/usr/bin/env bash
# ==============================================================================
# VPS SAFE ROLLBACK SCRIPT — TARGETS ONLY MAHI 4K DOWNLOADER STACK
# GUARANTEE: Never touches, stops, or modifies any existing container or volume.
# ==============================================================================

set -euo pipefail

echo "========================================================================"
echo "         MAHI 4K DOWNLOADER — TARGETED EMERGENCY ROLLBACK"
echo "========================================================================"
echo ""

COMPOSE_FILE="docker-compose.isolated.yml"
PROJECT_NAME="mahi_downloader_stack"

if [ -f "$COMPOSE_FILE" ]; then
    echo "Stopping and removing mahi_downloader_stack containers..."
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down --remove-orphans || true
else
    echo "Warning: $COMPOSE_FILE not found. Removing by container names directly..."
    docker rm -f mahi_api_prod mahi_worker_prod mahi_redis_prod mahi_postgres_prod 2>/dev/null || true
fi

echo "Removing isolated network if still present..."
docker network rm mahi_backend_net 2>/dev/null || true

read -p "Do you also want to remove Mahi data volumes (mahi_postgres_data, mahi_redis_data)? [y/N]: " REMOVE_VOLUMES
if [[ "$REMOVE_VOLUMES" =~ ^[Yy]$ ]]; then
    echo "Removing isolated data volumes..."
    docker volume rm mahi_postgres_data mahi_redis_data mahi_temp_storage 2>/dev/null || true
    echo "Isolated data volumes removed."
else
    echo "Preserved isolated data volumes."
fi

echo ""
echo "=== ROLLBACK COMPLETE ==="
echo "Mahi 4K Downloader containers have been safely removed."
echo "Running containers check to verify existing production services:"
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
