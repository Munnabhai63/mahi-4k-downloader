#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::env;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::thread;
use tauri::Emitter;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QualityOption {
    pub label: String,
    pub height: i32,
    pub available: bool,
    #[serde(rename = "estimatedBytes")]
    pub estimated_bytes: Option<i64>,
    #[serde(rename = "formatNote")]
    pub format_note: String,
    pub fps: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalyzeResult {
    pub url: String,
    #[serde(rename = "urlHash")]
    pub url_hash: String,
    pub platform: String,
    pub title: String,
    #[serde(rename = "thumbnailUrl")]
    pub thumbnail_url: String,
    #[serde(rename = "durationSec")]
    pub duration_sec: i64,
    pub uploader: String,
    #[serde(rename = "viewCount")]
    pub view_count: Option<i64>,
    #[serde(rename = "isLive")]
    pub is_live: bool,
    #[serde(rename = "isPlaylist")]
    pub is_playlist: bool,
    pub qualities: Vec<QualityOption>,
    pub formats: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProgressPayload {
    pub download_id: String,
    pub status: String,
    pub progress: f64,
    pub speed_bps: i64,
    pub eta_sec: i64,
    pub downloaded_bytes: i64,
    pub total_bytes: i64,
    pub output_path: Option<String>,
    pub filename: Option<String>,
    pub error_msg: Option<String>,
}

fn get_downloads_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        if let Ok(userprofile) = env::var("USERPROFILE") {
            let mut p = PathBuf::from(userprofile);
            p.push("Downloads");
            p.push("My 4K Downloader");
            return p;
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(home) = env::var("HOME") {
            let mut p = PathBuf::from(home);
            p.push("Downloads");
            p.push("My 4K Downloader");
            return p;
        }
    }
    let mut fallback = PathBuf::from(".");
    fallback.push("Downloads");
    fallback.push("My 4K Downloader");
    fallback
}

fn find_ytdlp_bin() -> (String, Vec<String>) {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let candidates = [
                exe_dir.join("yt-dlp.exe"),
                exe_dir.join("yt-dlp-x86_64-pc-windows-msvc.exe"),
                exe_dir.join("binaries").join("yt-dlp.exe"),
                exe_dir.join("binaries").join("yt-dlp-x86_64-pc-windows-msvc.exe"),
                exe_dir.join("resources").join("yt-dlp.exe"),
                exe_dir.join("resources").join("binaries").join("yt-dlp.exe"),
                exe_dir.join("resources").join("binaries").join("yt-dlp-x86_64-pc-windows-msvc.exe"),
            ];
            for p in &candidates {
                if p.exists() {
                    return (p.to_string_lossy().to_string(), vec![]);
                }
            }
        }
    }
    // Fallback: check system PATH
    ("yt-dlp".to_string(), vec![])
}

fn find_ffmpeg_bin() -> Option<String> {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let candidates = [
                exe_dir.join("ffmpeg.exe"),
                exe_dir.join("ffmpeg-x86_64-pc-windows-msvc.exe"),
                exe_dir.join("binaries").join("ffmpeg.exe"),
                exe_dir.join("binaries").join("ffmpeg-x86_64-pc-windows-msvc.exe"),
                exe_dir.join("resources").join("ffmpeg.exe"),
                exe_dir.join("resources").join("binaries").join("ffmpeg.exe"),
                exe_dir.join("resources").join("binaries").join("ffmpeg-x86_64-pc-windows-msvc.exe"),
            ];
            for p in &candidates {
                if p.exists() {
                    return Some(p.to_string_lossy().to_string());
                }
            }
        }
    }
    None
}

fn sanitize_engine_error(err_str: &str) -> String {
    let lower = err_str.to_lowercase();
    if lower.contains("private") || lower.contains("permission") || lower.contains("members only") || lower.contains("restricted by") {
        "This media is private or restricted.".to_string()
    } else if lower.contains("unavailable") || lower.contains("does not exist") || lower.contains("not found") || lower.contains("404") || lower.contains("removed") {
        "This media is unavailable or has been removed.".to_string()
    } else if lower.contains("drm") || lower.contains("protected") {
        "DRM-protected media cannot be downloaded.".to_string()
    } else if lower.contains("sign in") || lower.contains("bot") || lower.contains("cookie") || lower.contains("login") {
        "This media requires account sign-in and cannot be downloaded.".to_string()
    } else if lower.contains("unsupported") || lower.contains("no suitable extractor") {
        "This source is not supported yet.".to_string()
    } else if lower.contains("timeout") || lower.contains("connection") || lower.contains("network") {
        "Connection timed out. Please check your internet connection.".to_string()
    } else {
        "This media is currently unavailable.".to_string()
    }
}

fn detect_platform(url: &str) -> String {
    let l = url.to_lowercase();
    if l.contains("youtube.com") || l.contains("youtu.be") {
        "youtube".to_string()
    } else if l.contains("facebook.com") || l.contains("fb.watch") {
        "facebook".to_string()
    } else if l.contains("instagram.com") {
        "instagram".to_string()
    } else if l.contains("tiktok.com") {
        "tiktok".to_string()
    } else if l.contains("twitter.com") || l.contains("x.com") {
        "twitter".to_string()
    } else if l.contains("vimeo.com") {
        "vimeo".to_string()
    } else if l.contains("reddit.com") || l.contains("v.redd.it") {
        "reddit".to_string()
    } else if l.contains("dailymotion.com") || l.contains("dai.ly") {
        "dailymotion".to_string()
    } else if l.contains("archive.org") {
        "archive".to_string()
    } else if l.ends_with(".mp4") || l.ends_with(".webm") || l.ends_with(".mkv") || l.contains(".m3u8") || l.ends_with(".mov") || l.ends_with(".mp3") {
        "direct".to_string()
    } else {
        "generic".to_string()
    }
}

#[tauri::command]
fn get_download_folder() -> Result<String, String> {
    let dir = get_downloads_dir();
    let _ = std::fs::create_dir_all(&dir);
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn open_folder(path: Option<String>) -> Result<(), String> {
    let target = path.map(PathBuf::from).unwrap_or_else(get_downloads_dir);
    let _ = std::fs::create_dir_all(&target);

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn analyze_local(url: String) -> Result<AnalyzeResult, String> {
    let (cmd_bin, prefix_args) = find_ytdlp_bin();
    let mut args = prefix_args;
    args.push("--dump-json".to_string());
    args.push("--no-warnings".to_string());
    args.push("--skip-download".to_string());
    args.push(url.clone());

    let mut cmd = Command::new(&cmd_bin);
    cmd.args(&args);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let output = cmd
        .output()
        .map_err(|_| "Unable to launch local media engine.".to_string())?;

    if !output.status.success() {
        let err_str = String::from_utf8_lossy(&output.stderr);
        return Err(sanitize_engine_error(&err_str));
    }

    let json_val: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|_| "Failed to parse media metadata.".to_string())?;

    let title = json_val["title"].as_str().unwrap_or("Media Stream").to_string();
    let thumbnail_url = json_val["thumbnail"].as_str().unwrap_or("").to_string();
    let duration_sec = json_val["duration"].as_i64().unwrap_or(0);
    let uploader = json_val["uploader"]
        .as_str()
        .or_else(|| json_val["channel"].as_str())
        .unwrap_or("Public Creator")
        .to_string();
    let view_count = json_val["view_count"].as_i64();
    let is_live = json_val["is_live"].as_bool().unwrap_or(false);
    let is_playlist = json_val.get("_type").and_then(|t| t.as_str()) == Some("playlist");

    let mut available_heights = Vec::new();
    if let Some(h) = json_val["height"].as_i64() {
        if h > 0 {
            available_heights.push(h as i32);
        }
    }
    if let Some(formats) = json_val["formats"].as_array() {
        for f in formats {
            if let Some(h) = f["height"].as_i64() {
                if h > 0 {
                    available_heights.push(h as i32);
                }
            }
        }
    }

    let has_audio = json_val["acodec"].as_str().map(|a| a != "none").unwrap_or(false)
        || json_val["formats"].as_array().map(|fmts| {
            fmts.iter().any(|f| f["acodec"].as_str().map(|a| a != "none").unwrap_or(false))
        }).unwrap_or(true);

    let max_detected_h = available_heights.iter().cloned().max().unwrap_or(0);

    let qualities_config = vec![
        ("8K", 4320, "8K Ultra HD"),
        ("4K", 2160, "4K Ultra HD"),
        ("2K", 1440, "2K Quad HD"),
        ("1080p", 1080, "1080p Full HD"),
        ("720p", 720, "720p HD"),
        ("480p", 480, "480p SD"),
        ("360p", 360, "360p SD"),
        ("Audio", 0, "High Quality 320kbps MP3"),
    ];

    let mut qualities = Vec::new();

    if max_detected_h == 0 && available_heights.is_empty() {
        // Direct media stream without height metadata
        qualities.push(QualityOption {
            label: "Original".to_string(),
            height: 0,
            available: true,
            estimated_bytes: None,
            format_note: "Source Quality Stream".to_string(),
            fps: 30,
        });
        if has_audio {
            qualities.push(QualityOption {
                label: "Audio".to_string(),
                height: 0,
                available: true,
                estimated_bytes: None,
                format_note: "High Quality 320kbps MP3".to_string(),
                fps: 0,
            });
        }
    } else {
        for (label, h, note) in qualities_config {
            if h == 0 {
                if has_audio {
                    qualities.push(QualityOption {
                        label: label.to_string(),
                        height: 0,
                        available: true,
                        estimated_bytes: None,
                        format_note: note.to_string(),
                        fps: 0,
                    });
                }
            } else {
                let is_avail = available_heights.iter().any(|&avail_h| avail_h >= (h as f32 * 0.95) as i32);
                if is_avail {
                    qualities.push(QualityOption {
                        label: label.to_string(),
                        height: h,
                        available: true,
                        estimated_bytes: None,
                        format_note: note.to_string(),
                        fps: if h >= 1080 { 60 } else { 30 },
                    });
                }
            }
        }
    }

    let url_hash = format!("{:x}", url.bytes().fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64)));

    Ok(AnalyzeResult {
        url: url.clone(),
        url_hash,
        platform: detect_platform(&url),
        title,
        thumbnail_url,
        duration_sec,
        uploader,
        view_count,
        is_live,
        is_playlist,
        qualities,
        formats: vec![
            "mp4".to_string(),
            "mkv".to_string(),
            "mp3".to_string(),
            "m4a".to_string(),
            "wav".to_string(),
        ],
    })
}

#[derive(Debug, Deserialize)]
pub struct DownloadSpec {
    pub url: String,
    pub quality: String,
    pub format: String,
    #[serde(rename = "downloadId")]
    pub download_id: String,
}

#[tauri::command]
fn download_local(app: tauri::AppHandle, spec: DownloadSpec) -> Result<String, String> {
    let out_dir = get_downloads_dir();
    let _ = std::fs::create_dir_all(&out_dir);

    let (cmd_bin, prefix_args) = find_ytdlp_bin();
    let ffmpeg_path = find_ffmpeg_bin();

    let target_format = spec.format.to_lowercase();
    let is_audio = spec.quality == "Audio" || ["mp3", "m4a", "wav"].contains(&target_format.as_str());

    let format_selector = if is_audio {
        "bestaudio/best".to_string()
    } else {
        match spec.quality.as_str() {
            "8K" => "bestvideo[height<=4320]+bestaudio/best[height<=4320]/best".to_string(),
            "4K" => "bestvideo[height<=2160]+bestaudio/best[height<=2160]/best".to_string(),
            "2K" => "bestvideo[height<=1440]+bestaudio/best[height<=1440]/best".to_string(),
            "1080p" => "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best".to_string(),
            "720p" => "bestvideo[height<=720]+bestaudio/best[height<=720]/best".to_string(),
            "480p" => "bestvideo[height<=480]+bestaudio/best[height<=480]/best".to_string(),
            "360p" => "bestvideo[height<=360]+bestaudio/best[height<=360]/best".to_string(),
            _ => "bestvideo+bestaudio/best".to_string(),
        }
    };

    let outtmpl = format!("{}/%(title).100s.%(ext)s", out_dir.to_string_lossy());
    let download_id = spec.download_id.clone();
    let url = spec.url.clone();

    thread::spawn(move || {
        let mut args = prefix_args;
        args.push("--newline".to_string());
        args.push("--no-warnings".to_string());
        args.push("--no-part".to_string());
        args.push("-f".to_string());
        args.push(format_selector);

        if is_audio {
            args.push("-x".to_string());
            args.push("--audio-format".to_string());
            args.push(if target_format == "wav" { "wav".to_string() } else { "mp3".to_string() });
            args.push("--audio-quality".to_string());
            args.push("320k".to_string());
        } else {
            args.push("--merge-output-format".to_string());
            args.push(if target_format == "mkv" { "mkv".to_string() } else { "mp4".to_string() });
        }

        if let Some(ffmpeg) = ffmpeg_path {
            args.push("--ffmpeg-location".to_string());
            args.push(ffmpeg);
        }

        args.push("-o".to_string());
        args.push(outtmpl);
        args.push(url);

        let mut cmd = Command::new(&cmd_bin);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        #[cfg(target_os = "windows")]
        cmd.creation_flags(0x08000000);

        let mut child = match cmd.spawn()
        {
            Ok(c) => c,
            Err(e) => {
                let _ = app.emit("download-progress", ProgressPayload {
                    download_id: download_id.clone(),
                    status: "FAILED".to_string(),
                    progress: 0.0,
                    speed_bps: 0,
                    eta_sec: 0,
                    downloaded_bytes: 0,
                    total_bytes: 0,
                    output_path: None,
                    filename: None,
                    error_msg: Some(e.to_string()),
                });
                return;
            }
        };

        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            for line_res in reader.lines() {
                if let Ok(line) = line_res {
                    // Parse standard yt-dlp download progress: [download]  45.2% of  12.34MiB at  2.34MiB/s ETA 00:03
                    if line.starts_with("[download]") && line.contains('%') {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        let mut pct = 1.0;
                        for p in &parts {
                            if p.ends_with('%') {
                                if let Ok(val) = p.trim_end_matches('%').parse::<f64>() {
                                    pct = val;
                                    break;
                                }
                            }
                        }

                        let _ = app.emit("download-progress", ProgressPayload {
                            download_id: download_id.clone(),
                            status: "DOWNLOADING".to_string(),
                            progress: pct,
                            speed_bps: 0,
                            eta_sec: 0,
                            downloaded_bytes: 0,
                            total_bytes: 0,
                            output_path: None,
                            filename: None,
                            error_msg: None,
                        });
                    }
                }
            }
        }

        match child.wait() {
            Ok(status) if status.success() => {
                let _ = app.emit("download-progress", ProgressPayload {
                    download_id: download_id.clone(),
                    status: "COMPLETED".to_string(),
                    progress: 100.0,
                    speed_bps: 0,
                    eta_sec: 0,
                    downloaded_bytes: 0,
                    total_bytes: 0,
                    output_path: Some(out_dir.to_string_lossy().to_string()),
                    filename: Some("Video saved to Downloads/My 4K Downloader".to_string()),
                    error_msg: None,
                });
            }
            Ok(status) => {
                let _ = app.emit("download-progress", ProgressPayload {
                    download_id: download_id.clone(),
                    status: "FAILED".to_string(),
                    progress: 0.0,
                    speed_bps: 0,
                    eta_sec: 0,
                    downloaded_bytes: 0,
                    total_bytes: 0,
                    output_path: None,
                    filename: None,
                    error_msg: Some(format!("yt-dlp process exited with code {}", status)),
                });
            }
            Err(e) => {
                let _ = app.emit("download-progress", ProgressPayload {
                    download_id: download_id.clone(),
                    status: "FAILED".to_string(),
                    progress: 0.0,
                    speed_bps: 0,
                    eta_sec: 0,
                    downloaded_bytes: 0,
                    total_bytes: 0,
                    output_path: None,
                    filename: None,
                    error_msg: Some(e.to_string()),
                });
            }
        }
    });

    Ok(spec.download_id)
}

pub struct AppState {
    pub launch_url: std::sync::Mutex<Option<String>>,
}

#[tauri::command]
fn get_launch_url(state: tauri::State<'_, AppState>) -> Option<String> {
    let mut lock = state.launch_url.lock().unwrap();
    lock.take()
}

fn percent_decode(input: &str) -> String {
    let mut bytes = Vec::new();
    let mut chars = input.bytes().peekable();
    while let Some(b) = chars.next() {
        if b == b'%' {
            if let (Some(h1), Some(h2)) = (chars.next(), chars.next()) {
                let hex_str = [h1, h2];
                if let Ok(hex_s) = std::str::from_utf8(&hex_str) {
                    if let Ok(val) = u8::from_str_radix(hex_s, 16) {
                        bytes.push(val);
                        continue;
                    }
                }
                bytes.push(b'%');
                bytes.push(h1);
                bytes.push(h2);
            } else {
                bytes.push(b'%');
            }
        } else if b == b'+' {
            bytes.push(b' ');
        } else {
            bytes.push(b);
        }
    }
    String::from_utf8_lossy(&bytes).to_string()
}

fn extract_m4k_url(arg: &str) -> Option<String> {
    let clean = arg.trim_matches(|c| c == '"' || c == '\'' || c == ' ');
    if clean.starts_with("m4k://") || clean.starts_with("m4k:") {
        if let Some(idx) = clean.find("url=") {
            let query_val = &clean[idx + 4..];
            let end_idx = query_val.find('&').unwrap_or(query_val.len());
            let mut encoded = &query_val[..end_idx];
            encoded = encoded.trim_end_matches('/');
            let decoded = percent_decode(encoded);
            let final_url = decoded.trim().to_string();
            if final_url.starts_with("http://") || final_url.starts_with("https://") {
                return Some(final_url);
            }
            return Some(decoded);
        }
    } else if clean.starts_with("http://") || clean.starts_with("https://") {
        return Some(clean.to_string());
    }
    None
}

#[cfg(target_os = "windows")]
fn register_windows_protocol_if_needed() {
    if let Ok(exe_path) = std::env::current_exe() {
        let exe_str = exe_path.to_string_lossy().to_string();
        let cmd = format!("\"{}\" \"%1\"", exe_str);
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\m4k", "/ve", "/d", "URL:My 4K Downloader Protocol", "/f"])
            .creation_flags(0x08000000)
            .output();
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\m4k", "/v", "URL Protocol", "/d", "", "/f"])
            .creation_flags(0x08000000)
            .output();
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\m4k\\shell\\open\\command", "/ve", "/d", &cmd, "/f"])
            .creation_flags(0x08000000)
            .output();
    }
}

fn main() {
    #[cfg(target_os = "windows")]
    register_windows_protocol_if_needed();

    let mut initial_url = None;
    for arg in env::args().skip(1) {
        if let Some(parsed) = extract_m4k_url(&arg) {
            initial_url = Some(parsed);
            break;
        }
    }

    tauri::Builder::default()
        .manage(AppState {
            launch_url: std::sync::Mutex::new(initial_url),
        })
        .invoke_handler(tauri::generate_handler![
            get_download_folder,
            open_folder,
            analyze_local,
            download_local,
            get_launch_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
