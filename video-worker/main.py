"""
BrandVortix Video Worker
========================
Micro-service that runs yt-dlp to download YouTube video sections,
then uploads the result to a Supabase Storage signed upload URL.

Deploy on Railway.app (or any Docker host).
Set WORKER_AUTH_TOKEN env var for security.
"""

import os
import subprocess
import tempfile
import httpx

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

app = FastAPI(title="BrandVortix Video Worker", version="1.0.0")

WORKER_AUTH_TOKEN = os.environ.get("WORKER_AUTH_TOKEN", "")
YOUTUBE_REGEX_PATTERN = r"(youtube\.com|youtu\.be)"


def _check_auth(authorization: str | None) -> None:
    if not WORKER_AUTH_TOKEN:
        return  # No token configured → open (dev mode)
    if authorization != f"Bearer {WORKER_AUTH_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def _validate_youtube_url(url: str) -> None:
    import re
    if not re.search(YOUTUBE_REGEX_PATTERN, url):
        raise HTTPException(status_code=400, detail="URL must be a YouTube URL")


# ─── Health check ─────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


# ─── Clip endpoint ────────────────────────────────────────────

class ClipRequest(BaseModel):
    youtube_url: str
    start_sec: float
    end_sec: float
    upload_url: str  # Supabase signed upload URL (PUT target)


@app.post("/clip")
async def clip_video(
    req: ClipRequest,
    authorization: str | None = Header(default=None),
):
    _check_auth(authorization)
    _validate_youtube_url(req.youtube_url)

    duration = req.end_sec - req.start_sec
    if duration <= 0 or duration > 180:
        raise HTTPException(status_code=400, detail=f"Invalid duration: {duration:.1f}s (max 180s)")

    with tempfile.TemporaryDirectory() as tmpdir:
        output_template = os.path.join(tmpdir, "clip.%(ext)s")

        cmd = [
            "python", "-m", "yt_dlp",
            "-f", "bestvideo[height<=480]+bestaudio/best[height<=480]",
            "--merge-output-format", "mp4",
            "--download-sections", f"*{req.start_sec}-{req.end_sec}",
            "--force-keyframes-at-cuts",
            "--no-playlist",
            "--no-warnings",
            "-o", output_template,
            req.youtube_url,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            stderr = result.stderr.strip()[:400]
            raise HTTPException(status_code=500, detail=f"yt-dlp error: {stderr}")

        # Find output file
        clip_path = None
        for ext in ["mp4", "webm", "mkv"]:
            candidate = os.path.join(tmpdir, f"clip.{ext}")
            if os.path.exists(candidate):
                clip_path = candidate
                mime = {"mp4": "video/mp4", "webm": "video/webm", "mkv": "video/x-matroska"}[ext]
                break

        if not clip_path:
            raise HTTPException(status_code=500, detail="yt-dlp produced no output file")

        # Upload to Supabase via signed URL
        with open(clip_path, "rb") as f:
            file_bytes = f.read()

        async with httpx.AsyncClient(timeout=120) as client:
            upload_resp = await client.put(
                req.upload_url,
                content=file_bytes,
                headers={"Content-Type": mime},
            )

        if upload_resp.status_code not in (200, 204):
            raise HTTPException(
                status_code=500,
                detail=f"Supabase upload failed ({upload_resp.status_code}): {upload_resp.text[:200]}",
            )

        return {"success": True, "size_bytes": len(file_bytes)}


# ─── Audio endpoint (for Whisper transcription fallback) ──────

class AudioRequest(BaseModel):
    youtube_url: str
    upload_url: str  # Supabase signed upload URL


@app.post("/audio")
async def download_audio(
    req: AudioRequest,
    authorization: str | None = Header(default=None),
):
    _check_auth(authorization)
    _validate_youtube_url(req.youtube_url)

    with tempfile.TemporaryDirectory() as tmpdir:
        output_template = os.path.join(tmpdir, "audio.%(ext)s")

        cmd = [
            "python", "-m", "yt_dlp",
            "-f", "bestaudio[ext=m4a]/bestaudio",
            "--no-playlist",
            "--no-warnings",
            "-o", output_template,
            req.youtube_url,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            stderr = result.stderr.strip()[:400]
            raise HTTPException(status_code=500, detail=f"yt-dlp error: {stderr}")

        audio_path = None
        for ext in ["m4a", "webm", "opus", "mp3"]:
            candidate = os.path.join(tmpdir, f"audio.{ext}")
            if os.path.exists(candidate):
                mime_map = {"m4a": "audio/mp4", "webm": "audio/webm", "opus": "audio/ogg", "mp3": "audio/mpeg"}
                audio_path = candidate
                audio_mime = mime_map.get(ext, "audio/mp4")
                break

        if not audio_path:
            raise HTTPException(status_code=500, detail="No audio file produced")

        with open(audio_path, "rb") as f:
            file_bytes = f.read()

        async with httpx.AsyncClient(timeout=120) as client:
            upload_resp = await client.put(
                req.upload_url,
                content=file_bytes,
                headers={"Content-Type": audio_mime},
            )

        if upload_resp.status_code not in (200, 204):
            raise HTTPException(
                status_code=500,
                detail=f"Supabase upload failed ({upload_resp.status_code}): {upload_resp.text[:200]}",
            )

        return {"success": True, "size_bytes": len(file_bytes), "mime": audio_mime}
