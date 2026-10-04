FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/ ./packages/
COPY services/api/ ./services/api/
COPY services/worker/ ./services/worker/

RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @turbograb/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PYTHON_PATH=python3

RUN apk add --no-cache python3 py3-pip ffmpeg aria2 curl \
        python3-dev libffi-dev gcc musl-dev \
    && pip install --no-cache-dir --break-system-packages \
        yt-dlp yt-dlp-ejs requests redis pydantic 'curl_cffi>=0.7.0'

COPY --from=builder /app ./

EXPOSE 4000
CMD ["node", "services/api/dist/main.js"]
