
# =========================
# Build Stage
# =========================
FROM node:22-alpine AS build

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy entire monorepo
COPY . .

# Install workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Move to frontend workspace
WORKDIR /app/artifacts/sanskrit-translator

# Build frontend
RUN pnpm build


# =========================
# Production Stage
# =========================
FROM nginx:stable-alpine

# Copy built frontend
COPY --from=build /app/artifacts/sanskrit-translator/dist /usr/share/nginx/html

# Copy nginx config

COPY nginx.conf /etc/nginx/conf.d/default.conf


# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
