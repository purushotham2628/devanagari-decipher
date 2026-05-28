FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY artifacts/sanskrit-translator/package.json artifacts/sanskrit-translator/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY artifacts/sanskrit-translator ./
RUN pnpm build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY artifacts/sanskrit-translator/nginx.conf /etc/nginx/conf.d/default.conf
COPY scripts/wait-for.sh /wait-for.sh
RUN chmod +x /wait-for.sh && apk add --no-cache curl
EXPOSE 80
ENTRYPOINT ["/wait-for.sh","http://backend:8000/health","60"]
CMD ["nginx","-g","daemon off;"]
