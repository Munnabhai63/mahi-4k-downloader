# TurboGrab Master Implementation Plan

Single Source of Truth: `MASTER_PROMPT.md`

## Phase 0: Monorepo Scaffold & Infrastructure (Tasks 001 - 008)
- **Task 001**: Root monorepo workspace configuration (`pnpm-workspace.yaml`, root `package.json`, `turbo.json`, `.gitignore`, `.editorconfig`).
- **Task 002**: Shared packages scaffold:
  - `packages/config`: shared ESLint, Prettier, TypeScript, Tailwind configurations.
  - `packages/types`: shared TypeScript domain models, DTOs, API contracts, WebSocket events.
  - `packages/ui`: shared React component library with §9 green/white design system tokens (buttons, inputs, cards, badges, progress bars, dialogs).
- **Task 003**: API service scaffold (`services/api`): NestJS TypeScript backend with health endpoint `/health`, Fastify/Express adapter, validation pipes, Swagger/OpenAPI docs.
- **Task 004**: Worker service scaffold (`services/worker`): Python 3.14 + yt-dlp service with metadata extraction and queue worker interface.
- **Task 005**: Web app scaffold (`apps/web`): Next.js 15 App Router + Tailwind CSS 4 + Lucide icons + Framer Motion.
- **Task 006**: Admin panel scaffold (`apps/admin`): Next.js 15 App Router admin console.
- **Task 007**: Chrome extension scaffold (`apps/extension`) & Desktop app scaffold (`apps/desktop` - Tauri 2 structure).
- **Task 008**: Deployment configuration (`docker-compose.yml`, Dockerfiles for web, admin, api, worker; Caddyfile with auto-HTTPS; GitHub Actions CI workflow).

## Phase 1: Web MVP - Core Download Flow & Legal Pages (Tasks 101 - 108)
- **Task 101**: SSRF-safe URL validation and platform detector engine in API (`POST /api/v1/analyze`).
- **Task 102**: Worker metadata extractor wrapper for yt-dlp (`bestvideo+bestaudio` formats, durations, thumbnails, qualities).
- **Task 103**: Real-time progress engine: WebSocket gateway (`Socket.IO` / WSS) and job queue manager.
- **Task 104**: Signed URL generator and temp file streaming controller (`GET /api/v1/downloads/:id/file` with 10-min expiry).
- **Task 105**: Web Landing Page hero & Paste Bar (`/`) with green/white §9 theme, auto-detect animation, platform icons row.
- **Task 106**: Video Preview Card component (slide-up sheet/modal with thumbnail, title, uploader, quality chips 720p-4K, file size estimates, format selector).
- **Task 107**: Active Downloads & Live Progress UI with smooth animated progress bar, speed MB/s, ETA, and download actions.
- **Task 108**: Mandatory Legal Pages (`/terms`, `/privacy`, `/dmca` takedown submission form) + Persistent compliance footer.

## Phase 2: Full Platforms, Advanced Formats, Batch, Auth & Cookies (Tasks 201 - 208)
- **Task 201**: Multi-platform engine rules (§7: YouTube, Instagram Reels/Stories, Facebook, X/Twitter, TikTok no-watermark, Vimeo, Twitch, etc.) + DRM platform blocker.
- **Task 202**: Audio extraction pipeline (transcode to MP3, M4A, OGG, WAV up to 320kbps) & Subtitles extractor (SRT download and embed).
- **Task 203**: Multi-URL batch paste engine (up to 50 URLs, mass parsing, batch queue management).
- **Task 204**: Smart Mode engine & toggle (save default quality, format, folder for 1-click downloads).
- **Task 205**: Download Queue manager: pause, resume, cancel, retry, concurrency limits per plan.
- **Task 206**: Authentication & Session system: JWT (15-min access + rotating refresh tokens), Google OAuth flow, password security.
- **Task 207**: Cookies Vault: AES-256-GCM encrypted per-user, per-platform storage (Instagram Stories, private videos).
- **Task 208**: History page (`/history`) with search, filter, pagination, and CSV export.

## Phase 3: Admin Console, Business Logic & Analytics (Tasks 301 - 306)
- **Task 301**: Database schema migrations & Prisma client setup (users, plans, downloads, dmca, settings, audit_logs).
- **Task 302**: Admin Overview Dashboard (KPI cards, download volume charts, platform share donuts, queue depth, worker health).
- **Task 303**: Admin User Management & Plan Control (free vs premium limits, bans, role assignments).
- **Task 304**: Global Downloads Feed & Live Job Inspector.
- **Task 305**: DMCA takedown moderation queue (URL hash blocking, automated takedown actioning, audit logs).
- **Task 306**: System Configuration & Announcements banner (daily limits, max file size, maintenance mode toggle).

## Phase 4: Chrome Extension (Manifest V3) (Tasks 401 - 405)
- **Task 401**: Manifest V3 extension structure, permissions, service worker, and storage sync.
- **Task 402**: Content scripts for YouTube, Instagram, Facebook, X, and TikTok with floating green "⬇ Download" button.
- **Task 403**: Popup UI (420px, §9 design system, paste bar, current tab detector, active download badge).
- **Task 404**: Context menu integration ("Download with TurboGrab") and browser badge notifications.
- **Task 405**: Production build bundle (`dist/`) & Chrome Web Store submission package with store assets guide.

## Phase 5: Desktop App (Tauri 2) (Tasks 501 - 505)
- **Task 501**: Tauri 2 core setup, permissions, Rust backend bridge, shared `packages/ui` integration.
- **Task 502**: Sidecar binaries manager (yt-dlp, ffmpeg, aria2c) with auto-update checking.
- **Task 503**: Native filesystem downloads, system file picker, and custom save folders.
- **Task 504**: System tray, global hotkey (Ctrl+Shift+V) quick-paste overlay, native OS notifications.
- **Task 505**: Clipboard watcher toggle (auto-detect copied video URLs) and desktop build packaging.

## Phase 6: Launch Hardening, i18n, Security & Production Readiness (Tasks 601 - 607)
- **Task 601**: PWA support (manifest.json, service worker, offline caching, mobile install prompt).
- **Task 602**: Internationalization (i18n): English + Hindi (हिन्दी) complete localization.
- **Task 603**: Security review & hardening (OWASP compliance, helmet headers, strict rate limiting, sanitization).
- **Task 604**: Performance optimization (Lighthouse ≥ 90, CWV LCP < 2.5s, bundle optimization).
- **Task 605**: Load testing scripts (k6 scenario for 500 concurrent users) & Sentry error tracking integration.
- **Task 606**: Automated Postgres backup and restore CLI script.
- **Task 607**: Production deployment package: Caddy reverse proxy config, VPS setup guide, environment audit, and `FINAL_REPORT.md`.
