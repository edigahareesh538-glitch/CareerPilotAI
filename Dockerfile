# Step 1: Build environment
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package dependency manifests and patches folder
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application (frontend & backend)
RUN pnpm build

# Step 2: Production environment
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Enable pnpm in runner stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests, patches, and install production dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --prod --frozen-lockfile

# Copy built dist output from builder stage
COPY --from=builder /app/dist ./dist

# Expose server port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]