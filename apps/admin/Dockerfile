FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @turbograb/admin build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

COPY --from=builder /app ./

EXPOSE 3001
CMD ["pnpm", "--filter", "@turbograb/admin", "start"]
