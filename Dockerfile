# Multi-stage Dockerfile for FX-Remit
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN corepack enable && corepack prepare pnpm@8 --activate
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/react-app/package.json ./packages/react-app/
COPY packages/hardhat/package.json ./packages/hardhat/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8 --activate
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/react-app/node_modules ./packages/react-app/node_modules
COPY --from=deps /app/packages/hardhat/node_modules ./packages/hardhat/node_modules

# Copy source code
COPY . .

# Build smart contracts
RUN pnpm hardhat:compile

# Build frontend
RUN pnpm react-app:build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/packages/react-app/.next/standalone ./
COPY --from=builder /app/packages/react-app/.next/static ./packages/react-app/.next/static
COPY --from=builder /app/packages/react-app/public ./packages/react-app/public

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/react-app/server.js"]

