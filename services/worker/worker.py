#!/usr/bin/env python3
"""
TurboGrab Download Worker Service
Handles metadata extraction and multi-stream download jobs via yt-dlp.
"""

import sys
import os
import json
import argparse
import shutil
import hashlib
import time
import subprocess
import re
from typing import Dict, Any, List, Optional, Tuple

try:
    import yt_dlp
    import yt_dlp.version
    YTDLP_AVAILABLE = True
    YTDLP_VERSION = getattr(yt_dlp.version, "__version__", "unknown")
except ImportError:
    YTDLP_AVAILABLE = False
    YTDLP_VERSION = None

try:
    from yt_dlp.networking.impersonate import ImpersonateTarget
    HAVE_IMPERSONATE = True
except Exception:
    HAVE_IMPERSONATE = False

try:
    import yt_dlp_ejs
    EJS_INSTALLED = True
    EJS_VERSION = getattr(yt_dlp_ejs, "__version__", "0.8.0")
except ImportError:
    EJS_INSTALLED = False
    EJS_VERSION = "none"

def extract_clean_url(raw_url: str) -> str:
    """Extract clean HTTP/HTTPS URL from any input or chat message (e.g. WhatsApp, SMS)."""
    if not raw_url:
        return ""
    m = re.search(r'https?://[^\s"\'<>]+', raw_url)
    return m.group(0) if m else raw_url.strip()

def check_environment() -> Dict[str, Any]:
    """Inspect worker dependencies, CLI tools, and runtime capability."""
    ffmpeg_path = shutil.which("ffmpeg")
    aria2c_path = shutil.which("aria2c")
    
    return {
        "status": "ok" if YTDLP_AVAILABLE else "degraded",
        "service": "turbograb-worker",
        "python_version": sys.version.split()[0],
        "ytdlp_available": YTDLP_AVAILABLE,
        "ytdlp_version": YTDLP_VERSION,
        "ffmpeg_available": ffmpeg_path is not None,
        "ffmpeg_path": ffmpeg_path,
        "aria2c_available": aria2c_path is not None,
        "aria2c_path": aria2c_path,
        "runtime_diagnostics": get_runtime_diagnostics(),
    }

def detect_platform(url: str, extractor_key: Optional[str] = None) -> str:
    url_lower = url.lower()
    if "whatsapp.com" in url_lower or "wa.me" in url_lower:
        return "whatsapp"
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "youtube"
    if "instagram.com" in url_lower:
        return "instagram"
    if "facebook.com" in url_lower or "fb.watch" in url_lower:
        return "facebook"
    if "twitter.com" in url_lower or "x.com" in url_lower:
        return "twitter"
    if "tiktok.com" in url_lower:
        return "tiktok"
    if "vimeo.com" in url_lower:
        return "vimeo"
    if "dailymotion.com" in url_lower:
        return "dailymotion"
    if "twitch.tv" in url_lower:
        return "twitch"
    if "reddit.com" in url_lower:
        return "reddit"
    if "pinterest.com" in url_lower or "pin.it" in url_lower:
        return "pinterest"
    if "linkedin.com" in url_lower:
        return "linkedin"
    if "snapchat.com" in url_lower:
        return "snapchat"
    if "likee.video" in url_lower:
        return "likee"
    if extractor_key:
        k = extractor_key.lower()
        if "youtube" in k: return "youtube"
        if "instagram" in k: return "instagram"
        if "tiktok" in k: return "tiktok"
        if "twitter" in k: return "twitter"
        if "vimeo" in k: return "vimeo"
        if "facebook" in k: return "facebook"
        if "reddit" in k: return "reddit"
        if "dailymotion" in k: return "dailymotion"
    return "generic"
SERVER_COOKIE_FILE = os.getenv("YOUTUBE_COOKIE_FILE", "/etc/secrets/youtube-cookies.txt")

def _get_js_runtime() -> Tuple[Optional[Dict[str, Any]], Dict[str, str]]:
    """
    Detect Deno (preferred by yt-dlp) or Node.js (>=22.0.0).
    Returns (ydl_js_runtimes_dict, info_dict)
    """
    # 1. Deno check (yt-dlp's default and preferred JS runtime)
    deno_bin = shutil.which("deno")
    if not deno_bin:
        for candidate in ["/usr/local/bin/deno", "/usr/bin/deno", "/bin/deno"]:
            if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                deno_bin = candidate
                break
    if deno_bin:
        ver = "unknown"
        try:
            ver = subprocess.check_output([deno_bin, "--version"], text=True).splitlines()[0].strip()
        except Exception:
            pass
        return {"deno": {"path": deno_bin}}, {"name": "deno", "version": ver, "path": deno_bin}

    # 2. Node check
    node_bin = shutil.which("node")
    if not node_bin:
        for candidate in ["/usr/local/bin/node", "/usr/bin/node", "/bin/node"]:
            if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                node_bin = candidate
                break
    if node_bin:
        ver = "unknown"
        try:
            ver = subprocess.check_output([node_bin, "--version"], text=True).strip()
        except Exception:
            pass
        return {"node": {"path": node_bin}}, {"name": "node", "version": ver, "path": node_bin}

    return None, {"name": "none", "version": "none", "path": "none"}

def get_runtime_diagnostics() -> Dict[str, Any]:
    """Return verified runtime parameters: yt-dlp, JS engine, and EJS source/version."""
    ytdlp_ver = YTDLP_VERSION if YTDLP_AVAILABLE else "unavailable"
    _, js_info = _get_js_runtime()
    ejs_info = {
        "source": "python package (yt-dlp-ejs)" if EJS_INSTALLED else "remote fallback (ejs:github)",
        "version": EJS_VERSION if EJS_INSTALLED else "remote",
        "installed": EJS_INSTALLED,
    }
    return {
        "ytdlp_version": ytdlp_ver,
        "js_runtime": js_info,
        "ejs_component": ejs_info,
    }

def _get_server_cookie_file() -> Optional[str]:
    if os.path.isfile(SERVER_COOKIE_FILE) and os.path.getsize(SERVER_COOKIE_FILE) > 0:
        return SERVER_COOKIE_FILE
    return None

PERMANENT_ERROR_PATTERNS = [
    "private video",
    "this video is private",
    "members only",
    "video unavailable",
    "this video has been removed",
    "is not available in your country",
    "geographic restriction",
    "geo-restricted",
    "copyright claim",
    "account has been terminated",
    "drm",
    "unsupported url",
    "404",
    "not found",
    "does not exist"
]

def is_permanent_failure(err_str: str) -> bool:
    """Identify permanent provider restrictions that cannot be bypassed by client switching."""
    err_lower = err_str.lower()
    return any(p in err_lower for p in PERMANENT_ERROR_PATTERNS)

def _fallback_tiktok_extract(url: str) -> Optional[Dict[str, Any]]:
    """Fallback extractor for TikTok using TikWM API when yt-dlp encounters bot protection."""
    try:
        import urllib.request
        import urllib.parse
        clean_u = extract_clean_url(url)
        api_endpoint = f"https://www.tikwm.com/api/?url={urllib.parse.quote(clean_u)}"
        req = urllib.request.Request(api_endpoint, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("code") == 0 and "data" in data:
                d = data["data"]
                title = d.get("title") or "TikTok Video"
                thumbnail = d.get("cover") or d.get("origin_cover") or ""
                duration = int(d.get("duration") or 0)
                uploader = d.get("author", {}).get("nickname") or "TikTok Creator"
                play_url = d.get("play") or d.get("wmplay")
                music_url = d.get("music")
                url_hash = hashlib.sha256(clean_u.strip().encode("utf-8")).hexdigest()

                qualities = [
                    {
                        "label": "1080p",
                        "height": 1080,
                        "available": True,
                        "estimatedBytes": int(d.get("size") or (duration * 2500 * 1024 / 8)),
                        "formatNote": "HD No Watermark (Direct MP4)",
                        "fps": 30,
                        "directUrl": play_url
                    },
                    {
                        "label": "720p",
                        "height": 720,
                        "available": True,
                        "estimatedBytes": int(d.get("size") or (duration * 1500 * 1024 / 8)),
                        "formatNote": "720p Clean Video",
                        "fps": 30,
                        "directUrl": play_url
                    },
                    {
                        "label": "Audio",
                        "height": 0,
                        "available": bool(music_url),
                        "estimatedBytes": int(duration * 320 * 1024 / 8) if duration else 5000000,
                        "formatNote": "Original Audio (MP3)",
                        "fps": 0,
                        "directUrl": music_url
                    }
                ]
                return {
                    "url": clean_u,
                    "urlHash": url_hash,
                    "platform": "tiktok",
                    "title": title,
                    "thumbnailUrl": thumbnail,
                    "durationSec": duration,
                    "uploader": uploader,
                    "viewCount": d.get("play_count"),
                    "isLive": False,
                    "isPlaylist": False,
                    "playlistItems": [],
                    "qualities": qualities,
                    "formats": ["mp4", "mp3"],
                    "subtitles": [],
                    "directDownloadUrl": play_url
                }
    except Exception:
        pass
    return None

def _extract_with_fallback(
    url: str,
    base_opts: Dict[str, Any],
    download: bool = False,
    output_dir: Optional[str] = None,
    download_id: Optional[str] = None
) -> Any:
    """
    Controlled silent server-side fallback pipeline.
    Attempts android, tv_embedded, mweb, and desktop profiles in sequence.
    """
    platform = detect_platform(url)

    if platform == "youtube":
        profiles = [
            {},  # yt-dlp default player client cascade (visionos, web) - delivers full 1080p/4K
            {"player_client": ["android_vr", "android"]},
            {"player_client": ["android"]},
            {"player_client": ["mweb"]},
            {"player_client": ["web_creator"]},
            {"player_client": ["ios"]},
        ]
    else:
        profiles = [{}]

    last_error: Optional[Exception] = None

    for idx, profile in enumerate(profiles):
        opts = base_opts.copy()
        opts["extractor_args"] = base_opts.get("extractor_args", {}).copy()

        if platform == "youtube":
            if "player_client" in profile:
                opts["extractor_args"]["youtube"] = {"player_client": profile["player_client"]}
            else:
                opts["extractor_args"] = {k: v for k, v in opts["extractor_args"].items() if k != "youtube"}

        max_transient_attempts = 1 if not download else 2
        for attempt in range(max_transient_attempts):
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=download)
                    if info:
                        return info
            except Exception as exc:
                last_error = exc
                err_msg = str(exc)
                # Only fail fast if truly permanent AND we're on the last profile
                if is_permanent_failure(err_msg) and idx == len(profiles) - 1:
                    raise exc

                # Clean any partial artifacts if download failed mid-way
                if download and output_dir and download_id:
                    try:
                        for f in os.listdir(output_dir):
                            if f.startswith(download_id):
                                partial_f = os.path.join(output_dir, f)
                                if os.path.isfile(partial_f):
                                    os.unlink(partial_f)
                    except Exception:
                        pass

                if attempt < max_transient_attempts - 1:
                    time.sleep(0.3)
                    continue
                break

    if last_error:
        raise last_error
    raise RuntimeError("Extraction failed on all supported fallback configurations.")

def analyze_url(url: str, cookie_file: Optional[str] = None) -> Dict[str, Any]:
    if not YTDLP_AVAILABLE:
        raise RuntimeError("yt-dlp is not installed in the worker environment")

    clean_url = extract_clean_url(url)
    platform = detect_platform(clean_url)

    ydl_opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": "in_playlist",
        "socket_timeout": 15,
        "extractor_args": {
            "tiktok": {"api_hostname": ["api22-core-c-useast1a.tiktokv.com"]}
        }
    }

    if HAVE_IMPERSONATE:
        try:
            ydl_opts["impersonate"] = ImpersonateTarget.from_str("chrome")
        except Exception:
            pass

    js_runtime, _ = _get_js_runtime()
    if js_runtime:
        ydl_opts["js_runtimes"] = js_runtime

    if not EJS_INSTALLED:
        ydl_opts["remote_components"] = ["ejs:github"]

    active_cookie = cookie_file or _get_server_cookie_file()
    if active_cookie and os.path.isfile(active_cookie):
        ydl_opts["cookiefile"] = active_cookie

    info = None
    try:
        info = _extract_with_fallback(clean_url, ydl_opts, download=False)
    except Exception as exc:
        if platform == "tiktok":
            fallback = _fallback_tiktok_extract(clean_url)
            if fallback:
                return fallback
        raise exc

    if not info:
        if platform == "tiktok":
            fallback = _fallback_tiktok_extract(clean_url)
            if fallback:
                return fallback
        raise ValueError("No metadata returned by yt-dlp for the provided URL")

    # Handle playlist vs single video
    is_playlist = info.get("_type") == "playlist" or "entries" in info
    entries = info.get("entries", []) if is_playlist else [info]
    first_entry = entries[0] if entries and len(entries) > 0 and entries[0] is not None else info

    title = first_entry.get("title") or info.get("title") or "Unknown Video"
    thumbnail = first_entry.get("thumbnail") or info.get("thumbnail") or ""
    duration = int(first_entry.get("duration") or info.get("duration") or 0)
    uploader = first_entry.get("uploader") or info.get("uploader") or first_entry.get("channel") or "Unknown Creator"
    view_count = first_entry.get("view_count") or info.get("view_count")
    is_live = bool(first_entry.get("is_live") or info.get("is_live"))

    # Formats and resolutions
    formats = first_entry.get("formats", []) or []
    available_heights = set()
    has_audio = False

    total_duration = duration if duration > 0 else 180

    # Scan formats for available heights and bitrates
    height_to_format = {}
    audio_formats = []

    for f in formats:
        h = f.get("height")
        if h:
            available_heights.add(h)
            if h not in height_to_format or (f.get("tbr") or 0) > (height_to_format[h].get("tbr") or 0):
                height_to_format[h] = f
        if f.get("acodec") != "none" and f.get("vcodec") == "none":
            has_audio = True
            audio_formats.append(f)
        elif f.get("acodec") != "none":
            has_audio = True

    qualities_config = [
        ("8K", 4320),
        ("4K", 2160),
        ("2K", 1440),
        ("1080p", 1080),
        ("720p", 720),
        ("480p", 480),
        ("360p", 360),
        ("Audio", 0),
    ]

    qualities = []

    for label, h in qualities_config:
        if label == "Audio":
            qualities.append({
                "label": "Audio",
                "height": 0,
                "available": has_audio or len(formats) > 0,
                "estimatedBytes": int(total_duration * 320 * 1024 / 8),
                "formatNote": "MP3 / M4A / WAV up to 320kbps",
                "fps": 0
            })
        else:
            is_avail = any(avail_h >= h * 0.95 for avail_h in available_heights)
            if not available_heights and h <= 1080:
                is_avail = True

            # Estimate byte size
            estimated_bytes = None
            matched_format = height_to_format.get(h)
            if matched_format:
                estimated_bytes = matched_format.get("filesize") or matched_format.get("filesize_approx")
                if not estimated_bytes and matched_format.get("tbr"):
                    estimated_bytes = int(matched_format["tbr"] * 1000 / 8 * total_duration)

            if not estimated_bytes:
                bitrates = {4320: 35000, 2160: 16000, 1440: 8000, 1080: 4500, 720: 2500, 480: 1200, 360: 700}
                estimated_bytes = int(bitrates.get(h, 2000) * 1000 / 8 * total_duration)

            qualities.append({
                "label": label,
                "height": h,
                "available": is_avail,
                "estimatedBytes": estimated_bytes,
                "formatNote": f"{h}p Ultra HD" if h >= 1440 else f"{h}p HD" if h >= 720 else f"{h}p SD",
                "fps": 60 if h >= 1080 else 30
            })

    # Subtitles extraction
    raw_subs = first_entry.get("subtitles", {}) or {}
    raw_auto_subs = first_entry.get("automatic_captions", {}) or {}
    subtitles = []

    for lang, tracks in raw_subs.items():
        subtitles.append({
            "language": tracks[0].get("name") or lang,
            "code": lang,
            "name": tracks[0].get("name") or lang,
            "isAutoGenerated": False
        })

    for lang, tracks in raw_auto_subs.items():
        if not any(s["code"] == lang for s in subtitles):
            subtitles.append({
                "language": tracks[0].get("name") or f"{lang} (Auto)",
                "code": lang,
                "name": tracks[0].get("name") or f"{lang} (Auto)",
                "isAutoGenerated": True
            })

    # Playlist items (up to 15 items preview)
    playlist_items = []
    if is_playlist:
        for idx, item in enumerate(entries[:15]):
            if item:
                playlist_items.append({
                    "id": str(item.get("id") or idx),
                    "url": item.get("webpage_url") or item.get("url") or url,
                    "title": item.get("title") or f"Item #{idx+1}",
                    "thumbnailUrl": item.get("thumbnail") or thumbnail,
                    "durationSec": int(item.get("duration") or 0)
                })

    url_hash = hashlib.sha256(url.strip().encode("utf-8")).hexdigest()
    platform = detect_platform(url, info.get("extractor_key"))

    return {
        "url": url,
        "urlHash": url_hash,
        "platform": platform,
        "title": title,
        "thumbnailUrl": thumbnail,
        "durationSec": duration,
        "uploader": uploader,
        "viewCount": view_count,
        "isLive": is_live,
        "isPlaylist": is_playlist,
        "playlistItems": playlist_items,
        "qualities": qualities,
        "formats": ["mp4", "mkv", "mp3", "m4a", "ogg", "wav", "srt"],
        "subtitles": subtitles[:20]
    }

def download_video(spec: Dict[str, Any]):
    url = extract_clean_url(spec.get("url"))
    platform = detect_platform(url)
    download_id = spec.get("downloadId") or spec.get("id") or str(int(time.time()))
    quality = spec.get("quality", "1080p")
    target_format = spec.get("format", "mp4").lower()
    output_dir = spec.get("outputDir", "/tmp/turbograb")
    subtitle_lang = spec.get("subtitleLang")

    os.makedirs(output_dir, exist_ok=True)
    outtmpl = os.path.join(output_dir, f"{download_id}.%(ext)s")

    last_progress_time = 0

    def progress_hook(d):
        nonlocal last_progress_time
        now = time.time()
        if now - last_progress_time < 0.25 and d.get("status") != "finished":
            return

        last_progress_time = now

        if d.get("status") == "downloading":
            total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes") or 0
            speed = d.get("speed") or 0
            eta = d.get("eta") or 0
            pct = 0.0
            if total_bytes > 0:
                pct = round((downloaded / total_bytes) * 100, 1)

            payload = {
                "type": "progress",
                "downloadId": download_id,
                "status": "DOWNLOADING",
                "progress": pct,
                "speedBps": int(speed or 0),
                "etaSec": int(eta or 0),
                "downloadedBytes": int(downloaded),
                "totalBytes": int(total_bytes)
            }
            print("__PROGRESS__:" + json.dumps(payload), flush=True)

        elif d.get("status") == "finished":
            payload = {
                "type": "progress",
                "downloadId": download_id,
                "status": "PROCESSING",
                "progress": 99.0,
                "speedBps": 0,
                "etaSec": 1,
                "downloadedBytes": d.get("total_bytes") or 0,
                "totalBytes": d.get("total_bytes") or 0
            }
            print("__PROGRESS__:" + json.dumps(payload), flush=True)

    # Format selector mapping per §6.3 of MASTER_PROMPT.md with robust /best fallback
    if quality == "Audio" or target_format in ["mp3", "m4a", "ogg", "wav"]:
        format_selector = "bestaudio/best"
    elif quality == "8K":
        format_selector = "bestvideo[height<=4320]+bestaudio/best[height<=4320]/best"
    elif quality == "4K":
        format_selector = "bestvideo[height<=2160]+bestaudio/best[height<=2160]/best"
    elif quality == "2K":
        format_selector = "bestvideo[height<=1440]+bestaudio/best[height<=1440]/best"
    elif quality == "1080p":
        format_selector = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
    elif quality == "720p":
        format_selector = "bestvideo[height<=720]+bestaudio/best[height<=720]/best"
    elif quality == "480p":
        format_selector = "bestvideo[height<=480]+bestaudio/best[height<=480]/best"
    elif quality == "360p":
        format_selector = "bestvideo[height<=360]+bestaudio/best[height<=360]/best"
    else:
        format_selector = "bestvideo+bestaudio/best"

    ydl_opts: Dict[str, Any] = {
        "format": format_selector,
        "outtmpl": outtmpl,
        "max_filesize": 2 * 1024 * 1024 * 1024,  # Strict VPS disk guard: 2GB per-job limit
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [progress_hook],
        "extractor_args": {
            "tiktok": {"api_hostname": ["api22-core-c-useast1a.tiktokv.com"]}
        }
    }

    if HAVE_IMPERSONATE:
        try:
            ydl_opts["impersonate"] = ImpersonateTarget.from_str("chrome")
        except Exception:
            pass

    js_runtime, _ = _get_js_runtime()
    if js_runtime:
        ydl_opts["js_runtimes"] = js_runtime

    if not EJS_INSTALLED:
        ydl_opts["remote_components"] = ["ejs:github"]

    # Audio postprocessing
    if quality == "Audio" or target_format in ["mp3", "m4a", "ogg", "wav"]:
        audio_bitrate = str(spec.get("audioBitrate") or "320")
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": target_format if target_format in ["mp3", "m4a", "ogg", "wav"] else "mp3",
            "preferredquality": audio_bitrate,
        }]
    else:
        if shutil.which("ffmpeg"):
            ydl_opts["merge_output_format"] = target_format if target_format in ["mp4", "mkv"] else "mp4"

    # Subtitles
    if subtitle_lang:
        ydl_opts["writesubtitles"] = True
        ydl_opts["subtitleslangs"] = [subtitle_lang]
        if spec.get("embedSubtitles") and shutil.which("ffmpeg"):
            ydl_opts["embedsubtitles"] = True

    # Cookies vault & server-side cookies support
    cookie_file = spec.get("cookieFile") or _get_server_cookie_file()
    if cookie_file and os.path.isfile(cookie_file):
        ydl_opts["cookiefile"] = cookie_file

    # Aria2c chunked acceleration for supported direct streams
    platform = detect_platform(url)
    if shutil.which("aria2c") and platform != "youtube":
        ydl_opts["external_downloader"] = "aria2c"
        ydl_opts["external_downloader_args"] = ["-x16", "-s16", "-k1M"]

    try:
        extract_info = _extract_with_fallback(
            url,
            ydl_opts,
            download=True,
            output_dir=output_dir,
            download_id=download_id
        )
        # Find the generated output file
        final_path = None
        total_size = 0
        # Check files in output directory starting with download_id
        for f in os.listdir(output_dir):
            if f.startswith(download_id):
                full_f = os.path.join(output_dir, f)
                if os.path.isfile(full_f):
                    final_path = full_f
                    total_size = os.path.getsize(full_f)
                    break

        final_filename = os.path.basename(final_path) if final_path else f"{download_id}.{target_format}"
        title = extract_info.get("title") if extract_info else download_id

        complete_payload = {
            "type": "complete",
            "downloadId": download_id,
            "status": "COMPLETED",
            "progress": 100.0,
            "outputPath": final_path or "",
            "filename": final_filename,
            "title": title,
            "totalBytes": total_size
        }
        print("__COMPLETE__:" + json.dumps(complete_payload), flush=True)

    except Exception as exc:
        # Strict Downloader-Only Mode: Clean up any partial/temporary download artifacts immediately on failure
        try:
            for f in os.listdir(output_dir):
                if f.startswith(download_id):
                    partial_f = os.path.join(output_dir, f)
                    if os.path.isfile(partial_f):
                        os.unlink(partial_f)
        except Exception:
            pass

        err_payload = {
            "type": "failed",
            "downloadId": download_id,
            "status": "FAILED",
            "errorMsg": str(exc)
        }
        print("__ERROR__:" + json.dumps(err_payload), flush=True)
        sys.exit(1)

def batch_analyze_urls(urls: List[str], cookie_file: Optional[str] = None) -> Dict[str, Any]:
    results = []
    failed = []
    for u in urls:
        u_clean = u.strip()
        if not u_clean:
            continue
        try:
            res = analyze_url(u_clean, cookie_file)
            results.append(res)
        except Exception as e:
            failed.append({"url": u_clean, "error": str(e)})
    return {"results": results, "failed": failed}

def main():
    parser = argparse.ArgumentParser(description="TurboGrab Video Download Worker")
    parser.add_argument("--check", action="store_true", help="Run health check and print status JSON")
    parser.add_argument("--diagnostics", action="store_true", help="Print runtime diagnostics (yt-dlp, JS engine, EJS)")
    parser.add_argument("--analyze", type=str, help="Extract metadata for the given video URL")
    parser.add_argument("--batch-analyze", type=str, help="JSON list of URLs to analyze in batch")
    parser.add_argument("--download", type=str, help="Execute download with JSON specification")
    parser.add_argument("--cookie-file", type=str, help="Optional cookie file path for authentication")
    parser.add_argument("--daemon", action="store_true", help="Run worker in persistent background daemon mode")
    args = parser.parse_args()

    if args.diagnostics:
        diag = get_runtime_diagnostics()
        print(json.dumps(diag, indent=2))
        sys.exit(0)

    if args.daemon:
        diag = get_runtime_diagnostics()
        print(f"[TurboGrab Worker] Daemon running. Python {sys.version.split()[0]}, yt-dlp {diag['ytdlp_version']}, JS runtime: {diag['js_runtime']['name']} ({diag['js_runtime']['version']}), EJS: {diag['ejs_component']['source']} {diag['ejs_component']['version']}.")
        try:
            while True:
                time.sleep(30)
        except (KeyboardInterrupt, SystemExit):
            sys.exit(0)

    if args.check:
        env_status = check_environment()
        print(json.dumps(env_status, indent=2))
        sys.exit(0 if env_status["status"] == "ok" else 1)

    if args.analyze:
        try:
            result = analyze_url(args.analyze, args.cookie_file)
            print("__RESULT__:" + json.dumps(result))
            sys.exit(0)
        except Exception as e:
            print("__ERROR__:" + json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)

    if args.batch_analyze:
        try:
            urls = json.loads(args.batch_analyze)
            res = batch_analyze_urls(urls, args.cookie_file)
            print("__BATCH_RESULT__:" + json.dumps(res))
            sys.exit(0)
        except Exception as e:
            print("__ERROR__:" + json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)

    if args.download:
        try:
            spec = json.loads(args.download)
            download_video(spec)
            sys.exit(0)
        except Exception as e:
            print("__ERROR__:" + json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)

    print(f"[TurboGrab Worker] Ready. Python {sys.version.split()[0]}, yt-dlp {YTDLP_VERSION}.")

if __name__ == "__main__":
    main()
