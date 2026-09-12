# 🟢 MASTER PROMPT — "TurboGrab" 
## Ultra-Fast Universal Video Downloader — Web App + Chrome Extension + Desktop App + Admin Panel

> **Save this file as `MASTER_PROMPT.md` in the repository root.**  
> This is the Single Source of Truth (SSOT) for the entire project.  
> Working name: **TurboGrab** (alternatives: SwiftGrab, GrabMax, VidRush — owner may rename anytime).

---

## 0. INSTRUCTIONS FOR THE AI AGENT (READ FIRST)
1. Read this ENTIRE document before writing any code.
2. Build strictly in the phases defined in §22. At the end of each phase, summarize what was built and STOP for human approval.
3. Every requirement here is BINDING. If something is genuinely impossible, stop and explain — never silently skip.
4. On small ambiguities, make the most professional choice and log it in `DECISIONS.md`.
5. Follow the tech stack in §4 exactly. Use latest stable versions.
6. Code quality: TypeScript `strict` mode, ESLint + Prettier, conventional commits, no `any` in shared packages.
7. Never hardcode secrets. All config via `.env` + `.env.example`.
8. UI default language: English — but architect for i18n from day one (Hindi UI in Phase 6).
9. Every screen must have: loading skeleton, empty state, error state, success state. No dead ends.

---

## 1. PRODUCT VISION
TurboGrab is an **ultra-fast, premium, multi-platform video downloader** that must look, feel, and perform **BETTER than 4K Video Downloader**. It will be publicly hosted on the owner's domain and used by thousands of students. 

**Design personality:** Premium, clean, trustworthy, fast. Green + White theme. Think "Stripe-level polish" for a downloader.

### 1.1 Killer Differentiators vs 4K Video Downloader (MUST highlight on landing page)
| # | Differentiator | 4K Video Downloader | TurboGrab |
|---|---|---|---|
| 1 | Runs fully in browser | ❌ Desktop install required | ✅ Zero-install web app (+ optional desktop) |
| 2 | Multi-URL batch paste | Limited | ✅ Paste up to 50 URLs at once |
| 3 | Live synced progress | Desktop only | ✅ Web + Extension + Desktop synced in real time |
| 4 | Languages | English etc. | ✅ English + हिन्दी |
| 5 | Owner admin panel | ❌ None | ✅ Full admin control & analytics |
| 6 | Price for students | Paid | ✅ Generous free tier |
| 7 | Chrome extension integration | ❌ | ✅ One-click download from any video page |

---

## 2. DELIVERABLES (4 PRODUCTS, ONE CODEBASE)
1. **Web App** — hosted on owner's domain (primary product)
2. **Chrome Extension** — Manifest V3, detect videos on any page, one-click download
3. **Desktop App** — Windows/macOS/Linux via Tauri 2 (local downloads, tray, hotkeys)
4. **Admin Panel** — full control for the owner (users, analytics, limits, DMCA)

Mobile support in Phase 6+ via PWA (then React Native later, out of scope for now).

---

## 3. NON-NEGOTIABLE RULES
- ❌ **NO DRM circumvention.** DRM platforms (Netflix, Amazon Prime, Disney+ Hotstar, Spotify, etc.) must be BLOCKED with a clear message: "This platform is not supported." Never attempt to implement.
- ✅ Legal pages required from Phase 1: **Terms of Service, Privacy Policy, DMCA/Takedown**.
- ✅ Persistent footer notice: *"Only download content you own or have permission to use. Respect platform Terms of Service."*
- ✅ Temp files auto-deleted (default: 6h after completion, configurable in admin).
- ✅ Green & White theme everywhere (§9). Light mode is the default and only mode for v1.

---

## 4. TECH STACK (BINDING)
| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web App + Admin | Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 |
| UI motion | Framer Motion |
| API Server | NestJS (Node.js, TypeScript) |
| Download Engine | **yt-dlp** (Python) + **FFmpeg** (muxing) + **aria2c** (multi-connection speed) |
| Job Queue | Redis + BullMQ |
| Workers | Python worker processes wrapping yt-dlp |
| Database | PostgreSQL (+ Prisma ORM) |
| Cache/Rate limit | Redis |
| Real-time | WebSocket (Socket.IO) for download progress |
| Auth | JWT (15-min access + rotating refresh) + Google OAuth |
| File storage | Local disk (temp) → served via time-limited signed URLs; optional S3/Cloudflare R2 flag |
| Desktop | Tauri 2 (bundles yt-dlp/ffmpeg/aria2c as sidecar binaries) |
| Extension | Chrome Manifest V3 |
| Deployment | Docker Compose + Caddy (auto-HTTPS) on owner's VPS |
| Monitoring | Sentry + uptime endpoint `/health` |
| Testing | Vitest (unit) + Playwright (E2E) + k6 (load) |

---

## 5. MONOREPO STRUCTURE
turbograb/
├── MASTER_PROMPT.md
├── DECISIONS.md
├── docker-compose.yml
├── apps/
│ ├── web/ # Next.js — main product
│ ├── admin/ # Next.js — admin panel
│ ├── extension/ # Chrome MV3 extension
│ └── desktop/ # Tauri 2 app
├── services/
│ ├── api/ # NestJS API gateway
│ └── worker/ # Python + yt-dlp download workers
└── packages/
├── ui/ # shared React component library (green/white design system)
├── types/ # shared TypeScript types
└── config/ # shared eslint/ts/tailwind configs

text


---

## 6. CORE DOWNLOAD ENGINE (THE HEART)
### 6.1 Engine
- Wrap **yt-dlp** as a Python worker service. Auto-update yt-dlp binary weekly (platforms change constantly).
- **FFmpeg**: merge bestvideo+bestaudio streams into MP4/MKV; embed thumbnails & metadata.
- **aria2c**: multi-connection chunked downloads where supported → this is our "ultra-fast" advantage.

### 6.2 URL Analysis Flow (`POST /api/v1/analyze`)
1. Validate URL (http/https only, SSRF-safe: reject localhost/private IPs/metadata IPs).
2. Auto-detect platform via regex map (§7).
3. Extract metadata: title, thumbnail, duration, uploader, platform, available qualities, formats, subtitle tracks, is_live, is_playlist.
4. Respond in **p95 < 2.5 seconds**.

### 6.3 Quality Selection Matrix
| Label | Selector logic (yt-dlp format string) |
|---|---|
| 8K 4320p | `bestvideo[height<=4320]+bestaudio/best[height<=4320]` |
| 4K 2160p | `bestvideo[height<=2160]+bestaudio/best[height<=2160]` |
| 2K 1440p | `bestvideo[height<=1440]+bestaudio/best[height<=1440]` |
| 1080p / 720p / 480p / 360p | same pattern with `height<=X` |
| Audio only | `bestaudio` → transcode MP3/M4A/OGG/WAV (up to 320kbps option) |
- Container preference: MP4 → merge via FFmpeg `--merge-output-format mp4`.
- If requested quality unavailable → show best available + clearly say so in UI.

### 6.4 Features
- **Subtitles**: list available tracks; download as SRT or embed into MP4.
- **Playlists/channels**: expand into items; user selects which to download; playlist shows total size.
- **Live streams**: show "Live — download as VOD after stream ends" option + live recording warning if unsupported.
- **Cookies vault** (for Instagram Stories, private/logged-in content): user pastes cookies → stored **AES-256-GCM encrypted** (key from env), per-user, per-platform. Never logged, never exposed via API response.
- **Proxy support**: user-configurable per-download (settings page).
- **Max file size cap**: 10 GB per file (admin-configurable).

---

## 7. SUPPORTED PLATFORMS MATRIX (auto-detect)
| Platform | Content types | Needs cookies? |
|---|---|---|
| YouTube | Videos, Shorts, Playlists, Channels, private (own) videos | For private content only |
| Instagram | Reels, Posts, Stories, IGTV | Stories: YES |
| Facebook | Videos, Reels, Watch, public Stories | Sometimes (public usually OK) |
| X (Twitter) | Videos, GIFs | No |
| TikTok | Videos (no-watermark priority) | No |
| Vimeo, Dailymotion, Twitch (VOD/clips), Reddit, Pinterest, LinkedIn, Snapchat, Likee | Videos | No |
| 1000+ more | Via yt-dlp generic engine — auto-detect | Varies |
| **DRM platforms (Netflix, Prime, Hotstar, Spotify, etc.)** | **BLOCKED with message** | — |

---

## 8. FEATURE LIST (MoSCoW)
**MUST (v1):** paste-bar download, auto-detect, quality+format picker, audio extraction, subtitles, batch paste (50 URLs), Smart Mode (save default quality/format/folder → one-click), queue (pause/resume/cancel/retry), live progress (%, speed MB/s, ETA, size), history with search, clipboard auto-detect on web app, auth, rate limits, admin panel, legal pages, Chrome extension, desktop app.

**SHOULD (v1.1):** scheduled downloads, proxy per-download, download trimming (start/end time), PWA install, Hindi UI.

**COULD (v2):** dark mode, API keys for power users, referral program, watch-folder automation.

**WON'T:** DRM circumvention, re-hosting files permanently, uploading to cloud drives.

---

## 9. DESIGN SYSTEM — GREEN & WHITE (BINDING)
### 9.1 Colors
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#16A34A` | Buttons, links, active states |
| `primary-dark` | `#15803D` | Button hover, headers |
| `primary-light` | `#22C55E` | Progress bars, accents |
| `mint-100` | `#DCFCE7` | Hover backgrounds, chips |
| `mint-50` | `#F0FDF4` | Page sections, cards alt bg |
| `background` | `#FFFFFF` | App background |
| `surface` | `#F8FAF9` | Cards |
| `text` | `#0F172A` | Primary text |
| `muted` | `#64748B` | Secondary text |
| `error` | `#EF4444` | Errors |
| `warning` | `#F59E0B` | Warnings |
| `border` | `#E2E8F0` | Borders, dividers |

### 9.2 Style
- **Typography:** Inter (UI) + Poppins (headings). Weights: 400/500/600/700.
- **Radius:** 12px (buttons/inputs), 16px (cards), 9999px (pills/chips).
- **Shadows:** soft & subtle — `0 4px 24px rgba(22,163,74,0.08)` for cards; green glow `0 0 0 4px #DCFCE7` on focus.
- **Motion:** Framer Motion — 150–250ms ease-out; progress bar smooth-fill; download-complete confetti micro-animation (subtle, green particles).
- **Icons:** Lucide (stroke 1.75px).
- **Buttons:** primary = solid green, white text; secondary = white bg, green border; danger = error red. All with hover lift (translateY(-1px)).
- **Accessibility:** WCAG 2.1 AA minimum — contrast, focus rings, keyboard nav, aria labels.

### 9.3 Reference feel
Clean, airy, confident — like 4K Video Downloader's simplicity but modern web-grade polish: rounded cards, generous whitespace, big friendly paste bar as the hero element, platform icons row, micro-animations on every state change.

---

## 10. SCREEN SPECIFICATIONS
### 10.1 Landing Page (`/`)
- Sticky glass header: logo (green play-arrow + wordmark), nav (Features, Platforms, Pricing, FAQ), Login / Get Started buttons.
- **Hero:** H1 "Download any video. Blazing fast." + subtext + **THE PASTE BAR** (large input, rounded-full, green gradient button "Paste & Analyze" with clipboard icon that auto-fills). Below: row of supported platform logos (grayscale → color on hover).
- Features grid (6 cards with icons): Ultra HD up to 8K · 1000+ Platforms · Batch Download · Audio & Subtitles · Smart Mode · No Ads.
- "How it works" 3-step strip: Paste → Choose Quality → Download.
- Stats strip (live from API): total downloads served, supported sites, avg. speed.
- FAQ accordion (8 Qs incl. legal/DMCA).
- Footer: links, legal pages, copyright notice (§3).

### 10.2 Analyze → Preview (appears after paste, slides up)
- Card: video thumbnail (left), title + uploader + duration + platform badge (right).
- **Quality chips:** 8K / 4K / 2K / 1080p / 720p / 480p / Audio (unavailable ones disabled + "not available" tooltip).
- **Format dropdown:** MP4 (default), MKV, MP3, M4A, SRT-only.
- Subtitles checkbox + language picker (if available).
- File size estimate per selected quality.
- Big green **Download** button + "Save to Smart Mode defaults" toggle.
- For playlists: expandable item list with checkboxes + "Download All".

### 10.3 Downloads Page (`/downloads`)
- Tabs: Active | Completed | Failed. Search + filter by platform.
- Row per download: thumbnail, title, platform icon, quality badge, progress bar with % + speed + ETA, buttons (pause/resume/cancel/retry).
- Completed rows: file size, "Download file" button (signed URL), re-download, delete.

### 10.4 History (`/history`) — paginated, searchable, exportable CSV.

### 10.5 Settings (`/settings`)
- Defaults (quality, format, subtitle language), Smart Mode toggle, Cookies manager (per-platform, encrypted, with "how to get cookies" help modal), proxy, theme (locked to light for v1), danger zone (delete account + data).

### 10.6 Auth (`/login`, `/signup`)
- Email/password + Google OAuth. Password rules, email verification, forgot password flow.

---

## 11. BACKEND ARCHITECTURE
Browser/Extension/Desktop
│ HTTPS / WSS
▼
[Caddy reverse proxy + auto-HTTPS]
│
▼
[NestJS API] ──► PostgreSQL (Prisma)
│ ▲
│ └── WebSocket hub (progress broadcast)
▼
[Redis + BullMQ job queue]
│
▼
[Python Download Workers (N, horizontally scalable)]
│ yt-dlp + ffmpeg + aria2c
▼
[Temp storage] ──► signed URL (10-min expiry) ──► user

text

- Worker emits progress every 500ms → published to Redis pub/sub → API broadcasts to the correct user's WebSocket room.
- On completion: file saved to temp dir, DB updated, signed download URL generated, TTL cleanup job deletes file after 6h.
- Queue: per-user concurrent limit (free: 1, premium: 5), per-worker concurrency 3, scale workers via `docker compose up --scale worker=4`.

---

## 12. DATABASE SCHEMA (PostgreSQL + Prisma)
users(id, email, password_hash?, name, role[USER|ADMIN], plan_id, is_banned, created_at, updated_at)
plans(id, name, daily_download_limit, max_concurrent, max_quality, price_inr, is_default)
downloads(id, user_id, url, url_hash, platform, title, thumbnail_url, duration_sec, quality, format, status[PENDING|ANALYZING|QUEUED|DOWNLOADING|PROCESSING|COMPLETED|FAILED|CANCELLED], progress, speed_bps, eta_sec, total_bytes, error_msg, output_path, signed_url?, created_at, completed_at)
cookies(id, user_id, platform, encrypted_blob, created_at, updated_at) -- AES-256-GCM
api_keys(id, user_id, key_hash, label, created_at, last_used_at)
dmca_reports(id, reporter_email, url_hash, reason, status[OPEN|ACTIONED|REJECTED], created_at, actioned_at)
analytics_events(id, user_id?, event[ANALYZE|DOWNLOAD_START|DOWNLOAD_COMPLETE|FAILED], platform, quality, bytes, created_at)
announcements(id, message, level[INFO|WARNING], is_active, created_at)
settings(key, value_json) -- admin-configurable: daily limits, max file size, blocked domains, temp TTL
audit_logs(id, actor_id, action, target, meta_json, created_at)

text

Indexes: `downloads(user_id, status)`, `downloads(url_hash)`, `analytics_events(created_at)`.

---

## 13. API CONTRACT (all under `/api/v1`, JWT-protected unless noted)
POST /analyze {url} → {platform, title, thumbnail, duration, qualities[], formats[], subtitles[], is_playlist, playlist_items[]}
POST /downloads {url, quality, format, subtitle_lang?, cookies_used?} → {download}
GET /downloads ?status=&page=&platform= → paginated list
GET /downloads/:id → detail
POST /downloads/:id/pause | /resume | /cancel | /retry
DELETE /downloads/:id
GET /downloads/:id/file → 302 signed URL (10-min expiry)
GET /history → paginated completed
WS /ws?token= → events: {type: "progress"|"complete"|"failed", downloadId, progress, speedBps, etaSec, ...}
POST /auth/register | /login | /refresh | /logout | /forgot-password
GET /auth/google → OAuth flow
GET/PATCH /me → profile & settings
POST /me/cookies {platform, cookie_string} → stores encrypted
GET /stats → public counters for landing page
-- ADMIN (role=ADMIN only) --
GET /admin/overview → users, downloads today, bandwidth today, errors, queue depth, worker health
GET /admin/users ?search=&page= → list; PATCH /admin/users/:id {is_banned, plan_id, role}
GET /admin/downloads → global feed; DELETE /admin/downloads/:id
GET /admin/dmca → queue; POST /admin/dmca/:id/action {action}
GET/PATCH /admin/settings
POST /admin/announcements
GET /admin/audit-logs

text

Rate limits (Redis token bucket): analyze = 20/min per IP; downloads = per-plan daily limit; auth = 5/min per IP.

---

## 14. CHROME EXTENSION (Manifest V3)
- **Permissions:** `activeTab`, `storage`, `contextMenus`, `notifications`, `scripting`, `downloads`.
- **Content script** on youtube.com, instagram.com, facebook.com, x.com, tiktok.com: inject a small floating green "⬇ Download" pill near the video; clicking → detects page URL → sends to TurboGrab API (user is logged into web app; token in extension storage).
- **Popup (420px, green/white theme, same design system):** paste bar, "Download current tab" button (if video detected), recent downloads list with mini progress bars, default-quality selector, login state.
- **Context menu:** right-click any link → "Download with TurboGrab".
- **Badge:** shows active download count; progress % on badge.
- Build output: ready-to-zip `dist/` + README for Chrome Web Store submission.

---

## 15. DESKTOP APP (Tauri 2)
- Same React UI (from `packages/ui`) in a native shell — 3 codebases share one design system.
- Bundles **yt-dlp, ffmpeg, aria2c** as sidecar binaries with weekly auto-update checks.
- Downloads go **directly to user's local folders** (native save dialog + default folder setting) — cloud AND local modes both available.
- System tray (start minimized), global hotkey **Ctrl+Shift+V** → quick-paste overlay window.
- Clipboard watcher toggle: auto-analyze any copied video URL with a native notification.
- Native notifications on download complete/fail. Auto-update the app itself.
- Windows installer + macOS dmg + Linux AppImage CI targets.

---

## 16. ADMIN PANEL (separate app `/apps/admin`, guard: role=ADMIN)
- **Overview dashboard:** KPI cards (total users, active now, downloads today, bandwidth today, error rate %) + charts (downloads/day 30d line, by-platform donut, by-quality bars) + live queue depth & worker health pills.
- **Users:** table (avatar, email, plan, usage, joined, status) → search, ban/unban, change plan, make admin, force-logout, view user's download history.
- **Downloads feed:** all downloads globally, cancel any job, inspect errors.
- **DMCA queue:** takedown reports → "Block URL hash & remove record" or "Reject" (with reason) + blocked-hash list.
- **Settings:** free-tier daily limit, max quality for free tier, max file size, blocked domains list, temp-file TTL, maintenance mode toggle (shows friendly banner on web app).
- **Announcements:** broadcast banner messages to web app users.
- **Audit logs:** every admin action recorded, immutable.

---

## 17. SECURITY REQUIREMENTS
- OWASP Top 10 hardening; helmet headers; CSRF on auth cookies; input validation everywhere (zod/class-validator).
- **SSRF protection** on URL analysis: allow only http/https, resolve DNS, block private/loopback/link-local/metadata IP ranges.
- Sanitize all filenames (no path traversal).
- Signed URLs expire in 10 minutes; storage dir not directly served.
- Encrypt cookies vault at rest (AES-256-GCM, key via env/KMS). Never log cookie values or full signed URLs.
- Passwords: bcrypt/argon2. JWT: 15-min access + rotating refresh with reuse detection.
- File serving: stream with `Content-Disposition: attachment`, correct MIME, virus-scan optional flag (ClamAV).
- Docker: non-root users, read-only FS where possible.
- Backups: nightly Postgres dump + config; restore script + docs.

---

## 18. LEGAL & COMPLIANCE (BINDING)
- Pages `/terms`, `/privacy`, `/dmca` (with submission form → `dmca_reports` table) — linked in footer from Phase 1.
- Copyright notice in footer, on the paste-bar screen, and inside extension popup.
- Block DRM platforms (§7) both at URL-validation and worker level.
- Temp files: never permanent hosting; TTL deletion (default 6h).
- Analytics store metadata only — no copyrighted file retention beyond temp.
- Privacy: data-deletion endpoint (GDPR-style) in user settings.

---

## 19. PERFORMANCE TARGETS ("ULTRA-FAST" DEFINITION)
| Metric | Target |
|---|---|
| Analyze API p95 | < 2.5s |
| Download job starts after click | < 1s |
| Worker concurrency | 3 per worker, scale horizontally |
| Multi-connection chunks (aria2c) | up to 16 connections |
| Lighthouse (web app) | ≥ 90 all categories |
| LCP / INP / CLS | < 2.5s / < 200ms / < 0.1 |
| API p95 (non-analyze) | < 500ms |
| Load test (k6) | 500 concurrent users, 0 errors |
| Assets | Brotli + CDN-ready, images AVIF/WebP |

---

## 20. BUILD PHASES & ACCEPTANCE CRITERIA
**Phase 0 — Scaffold:** monorepo, all apps boot, `docker compose up` runs web+api+worker+redis+postgres with health checks green, CI on GitHub Actions (lint+test on every PR). ✅ AC: fresh clone → `docker compose up` → landing page loads.

**Phase 1 — Web MVP (YouTube):** paste → analyze → preview card → quality 720p–4K → MP4 download with live WebSocket progress → signed URL file download → history. Legal pages live. ✅ AC: Playwright E2E downloads a Creative Commons YouTube video in 3 qualities, progress events received, file valid MP4.

**Phase 2 — Full platforms & features:** all platforms (§7), audio extraction, subtitles, batch paste (50), Smart Mode, queue pause/resume/cancel/retry, auth (email + Google), clipboard auto-detect, cookies vault.

**Phase 3 — Admin & business logic:** plans, rate limits, DMCA flow, analytics events + admin dashboard (§16), announcements, maintenance mode.

**Phase 4 — Chrome extension:** floating button on 5 platforms, popup, context menu, badge progress. ✅ AC: one-click download works on YouTube, Instagram, Facebook, X, TikTok demo pages.

**Phase 5 — Desktop (Tauri):** local downloads, sidecars with auto-update, tray, hotkey, clipboard watcher, installers for 3 OS in CI.

**Phase 6 — Launch hardening:** PWA + install prompt, Hindi i18n, k6 load test passed, Sentry wired, backups + restore tested, security review pass, SEO/OG tags, production Caddy deploy docs on owner's VPS + domain.

---

## 21. DEFINITION OF DONE (every feature)
TypeScript strict ✅ · unit tests for logic ✅ · E2E for user flows ✅ · loading/empty/error states ✅ · responsive 320px→4K ✅ · keyboard accessible ✅ · ESLint/Prettier clean ✅ · no console errors ✅ · matches §9 design system exactly ✅

---

## 22. OUT OF SCOPE (do NOT build)
DRM circumvention · permanent file re-hosting · video editing tools · upload-to-cloud integrations · dark mode (v2) · native mobile apps (post-v2).

**Now begin Phase 0.**
