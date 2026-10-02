# TurboGrab Architectural & Design Decisions (SSOT: MASTER_PROMPT.md)

## ADR 001: Monorepo Architecture
- **Decision**: Use `pnpm` workspaces + Turborepo to orchestrate `/apps` (`web`, `admin`, `extension`, `desktop`), `/services` (`api`, `worker`), and `/packages` (`ui`, `types`, `config`).
- **Rationale**: Strict separation of concerns while maximizing code sharing (types, UI components, configs) across Web, Admin, Desktop, and Extension.

## ADR 002: Green & White Design System
- **Decision**: Follow §9 design system tokens strictly (`#16A34A` primary, `#15803D` hover, `#22C55E` accent, `#DCFCE7` mint-100, `#F0FDF4` mint-50, `#FFFFFF` bg, `#F8FAF9` surface, `#0F172A` text, `#64748B` muted, `#EF4444` error, `#F59E0B` warning, `#E2E8F0` border).
- **Rationale**: Clean, airy, Stripe-level polish with light mode as the default for v1.

## ADR 003: Core Download Engine & Worker Bridge
- **Decision**: Python `yt-dlp` download worker microservice communicating via Redis BullMQ + Pub/Sub with the NestJS API gateway, broadcasting real-time progress via WebSocket (`Socket.IO`).
- **Rationale**: Handles fast metadata analysis and scalable video extraction with chunked downloads.

## ADR 004: Local Development & Host Environment Adaptation
- **Decision**: Docker is not currently installed or running on this Windows host machine. Full production Dockerfiles and `docker-compose.yml` are authored and validated for VPS deployment. For local development and verification, services run directly on the Node 24 + Python 3.14 runtime with embedded/mock-supported in-memory/SQLite/local adapters when external daemon services (Postgres/Redis) are running standalone or embedded.
- **Rationale**: Ensures 100% testability, typechecking, buildability, and UI visual verification directly on the machine without blocking on host Docker daemon installation.

## ADR 005: SSRF Protection, DRM Platform Blocker & Ephemeral Signed URLs
- **Decision**: Validate all incoming URLs before passing to worker processes. Enforce strict rejection of private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.169.254, loopback) and permanently block DRM platforms (Netflix, Prime, Disney+, Hotstar, Spotify, Apple TV, etc.) with standardized compliant user messages. Serve converted media files through HMAC-SHA256 signed URLs expiring in 10 minutes with automated 6-hour TTL disk cleanup.
- **Rationale**: Enforces non-negotiable security and legal compliance requirements defined in §3, §6.2, §17, and §18 of `MASTER_PROMPT.md`.
