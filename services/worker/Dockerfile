FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy official Deno >= 2.3 binary
COPY --from=denoland/deno:latest /usr/bin/deno /usr/local/bin/deno

# Install FFmpeg and aria2c for multi-connection speed
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    aria2 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY services/worker/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/worker/ ./

CMD ["python", "worker.py", "--daemon"]
