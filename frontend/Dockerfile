# Stage 1: Build React 19 Production Asset Bundle
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies cleanly using lockfile
COPY package*.json ./
RUN npm ci

# Copy source assets
COPY . .

# Support build-time injection of the backend Cloud Run URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Compile optimized static bundle
RUN npm run build

# Stage 2: Serve via Lightweight Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA bundle from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Cloud Run compatible Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create an unprivileged user for security compliance
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /etc/nginx/conf.d

USER nginx

EXPOSE 8080

# Start Nginx server safely; only adjust listen port if default.conf is writable and PORT differs from 8080
CMD ["sh", "-c", "if [ -w /etc/nginx/conf.d/default.conf ] && [ -n \"$PORT\" ] && [ \"$PORT\" != \"8080\" ]; then sed -i 's/listen 8080;/listen '\"$PORT\"';/g' /etc/nginx/conf.d/default.conf; fi && nginx -g 'daemon off;'"]
