
# =========================
# Build Stage
# =========================
FROM node:22-alpine AS build

WORKDIR /app

# Copy frontend files only
COPY . .

# Install dependencies
RUN npm install

# Build frontend
RUN npm run build


# =========================
# Production Stage
# =========================
FROM nginx:stable-alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
