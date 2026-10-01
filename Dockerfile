# syntax=docker/dockerfile:1

# Debian, not Alpine: Prisma's engine binaries target glibc, and build + runtime must match.
FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY --from=oven/bun:1.1.34 /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lockb ./
COPY prisma ./prisma
# postinstall runs `prisma generate`, writing the Linux client to /app/generated/prisma.
RUN bun install --frozen-lockfile

FROM deps AS builder
COPY . .
# Real secrets are only needed at runtime; next.config.js validates them again on `next start`.
RUN SKIP_ENV_VALIDATION=1 DATABASE_URL=postgresql://build@localhost/build bun run build

FROM base AS runner
ENV NODE_ENV=production \
  PORT=3000 \
  HOSTNAME=0.0.0.0 \
  AUTH_TRUST_HOST=true
COPY --from=builder /app/package.json /app/next.config.js ./
COPY --from=builder /app/src/env.js ./src/env.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
# next start writes its image cache under .next/cache.
COPY --from=builder --chown=node:node /app/.next ./.next
COPY docker-entrypoint.sh ./
USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
