# VAYRO — Production Deployment Checklist & Runbook

**Target Production Domain:** `https://vayro.com`  
**API Endpoint:** `https://vayro.com/api`  
**Architecture:** Distributed Spring Boot Microservices + Eureka Discovery + API Gateway + React 19 SPA + MySQL 8.0  

---

## 1. Domain & DNS Configuration

- [ ] **Apex Domain (A Record)**: `vayro.com` $\to$ Production Server Load Balancer / Ingress IP.
- [ ] **Subdomain (CNAME Record)**: `www.vayro.com` $\to$ `vayro.com` (with 301 HTTPS redirect).
- [ ] **TTL Setting**: Set to 300s (5 minutes) during initial rollout; increase to 86400s post-cutover.
- [ ] **Email DNS Records** (for `vayro.com` / Gmail sending):
  - [ ] **SPF Record** (TXT): `v=spf1 include:_spf.google.com ~all`
  - [ ] **DKIM Record** (TXT): Google Workspace / Gmail generated 2048-bit key.
  - [ ] **DMARC Record** (TXT): `v=DMARC1; p=quarantine; rua=mailto:admin@vayro.com; pct=100; sp=quarantine`

---

## 2. HTTPS & SSL/TLS Termination

- [ ] **TLS Certificate**: Obtain automated Let's Encrypt or Cloudflare TLS 1.3 certificate for `vayro.com` and `*.vayro.com`.
- [ ] **HTTP to HTTPS Redirection**: Enforce 301 Permanent Redirect on port 80 to port 443.
- [ ] **HSTS (HTTP Strict Transport Security)**: Enable header `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- [ ] **Security Headers**:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 3. Database Preparation & Hardening (MySQL 8.0)

- [ ] **Dedicated Production User**: Create dedicated MySQL application user with least-privilege permissions instead of running as `root`.
- [ ] **Port Protection**: Ensure MySQL port `3306` is bound strictly to `127.0.0.1` or docker internal network (never exposed to public internet).
- [ ] **Character Set & Collation**: Enforce `utf8mb4` and `utf8mb4_unicode_ci`.
- [ ] **Hibernate DDL Setting**: Verify `spring.jpa.hibernate.ddl-auto=update` (or `validate`) in production. Never use `create` or `create-drop`.
- [ ] **Persistent Storage**: Ensure MySQL storage mounts to host volume (`mysql_data:/var/lib/mysql`).
- [ ] **Automated Daily Backups**:
  - Configure automated daily `mysqldump` cron job:
    ```bash
    mysqldump -u $DB_USERNAME -p$DB_PASSWORD --single-transaction --routines --triggers --databases vayro_users vayro_vehicles vayro_bookings vayro_notifications | gzip > /backups/vayro_db_$(date +\%F_\%H\%M\%S).sql.gz
    ```
  - Retain 30 days of rolling off-site snapshots (e.g., AWS S3 / Cloudflare R2).

---

## 4. Google OAuth 2.0 Client Verification

- [ ] **Google Cloud Console Credentials**:
  - Client ID: Configured in `VITE_GOOGLE_CLIENT_ID` and backend `app.google.client-id`.
  - Client Secret: Configured in backend `app.google.client-secret` via `GOOGLE_CLIENT_SECRET` environment variable.
- [ ] **Authorized JavaScript Origins**:
  - `https://vayro.com`
  - `https://www.vayro.com`
- [ ] **Authorized Redirect URIs**:
  - `https://vayro.com`
  - `https://vayro.com/auth/callback`
- [ ] **Credential Rotation**: Rotate the Google Client Secret if it was previously exposed in local development commits.

---

## 5. Gmail SMTP & Email Notifications

- [ ] **Sender Address**: `vayro.notifications@gmail.com`
- [ ] **Sender Display Name**: `VAYRO`
- [ ] **Initial Deployment State**:
  - `NOTIFICATION_EMAIL_ENABLED=false` (Safe disabled mode: PDF invoices generated & downloadable, records marked `SKIPPED`, zero SMTP connection failures).
- [ ] **Activation Runbook** (When 16-character Google App Password is ready):
  1. Generate 16-character Google App Password in Google Account Security $\to$ 2-Step Verification $\to$ App Passwords.
  2. Set environment variables on deployment host:
     ```env
     MAIL_HOST=smtp.gmail.com
     MAIL_PORT=465
     MAIL_USERNAME=vayro.notifications@gmail.com
     MAIL_PASSWORD=<16_character_app_password>
     MAIL_SMTP_AUTH=true
     MAIL_SMTP_SSL_ENABLE=true
     NOTIFICATION_EMAIL_ENABLED=true
     ADMIN_NOTIFICATION_EMAIL=admin@vayro.com
     ```
  3. Restart `vayro-notification-service`.
  4. Perform test booking: confirm receipt of confirmation email and PDF Tax Invoice attachment at customer email address.

---

## 6. Microservices & Eureka Discovery Architecture

| Service | Port (Internal) | Public Route | Health Probe |
|---|---|---|---|
| **Eureka Server** | `8761` | *Internal Only* | `http://127.0.0.1:8761/actuator/health` |
| **API Gateway** | `8080` | `https://vayro.com/api` | `http://127.0.0.1:8080/actuator/health` |
| **User Service** | `8081` | Routed via Gateway | `http://127.0.0.1:8081/actuator/health` |
| **Vehicle Service** | `8082` | Routed via Gateway | `http://127.0.0.1:8082/actuator/health` |
| **Booking Service** | `8083` | Routed via Gateway | `http://127.0.0.1:8083/actuator/health` |
| **Notification Service** | `8084` | Routed via Gateway | `http://127.0.0.1:8084/actuator/health` |

- [ ] **CORS Configuration**: Restrict allowed origins to `https://vayro.com,https://www.vayro.com`.
- [ ] **JWT Key**: Supply cryptographically strong 256-bit / 32-byte Base64 key via `JWT_SECRET` environment variable across all services.
- [ ] **Admin Bootstrapper**: In production, set `ADMIN_BOOTSTRAP_ENABLED=false` after initial admin account creation or supply custom `ADMIN_PASSWORD`.

---

## 7. Frontend Deployment (React 19 / Vite SPA)

- [ ] **Build Command**: `npm run build`
- [ ] **Environment Configuration**:
  ```env
  VITE_APP_NAME=VAYRO
  VITE_APP_URL=https://vayro.com
  VITE_API_URL=/api
  VITE_GOOGLE_CLIENT_ID=<google_oauth_client_id>
  ```
- [ ] **Nginx SPA Fallback Configuration**:
  ```nginx
  server {
      listen 80;
      server_name vayro.com www.vayro.com;
      return 301 https://vayro.com$request_uri;
  }

  server {
      listen 443 ssl http2;
      server_name vayro.com;

      ssl_certificate /etc/letsencrypt/live/vayro.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/vayro.com/privkey.pem;

      root /usr/share/nginx/html;
      index index.html;

      # Static Assets Caching
      location /assets/ {
          expires 1y;
          add_header Cache-Control "public, immutable";
      }

      # SPA Client-Side Routing Fallback
      location / {
          try_files $uri $uri/ /index.html;
      }

      # API Gateway Reverse Proxy
      location /api/ {
          proxy_pass http://127.0.0.1:8080/api/;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_read_timeout 60s;
          proxy_connect_timeout 5s;
      }
  }
  ```

---

## 8. Docker Deployment Execution

- [ ] **1. Transfer & Environment Setup**:
  ```bash
  mkdir -p /opt/vayro && cd /opt/vayro
  # Place docker-compose.yml and production .env file (secured with chmod 600)
  chmod 600 .env
  ```

- [ ] **2. Build & Launch Containers**:
  ```bash
  docker compose pull || docker compose build
  docker compose up -d
  ```

- [ ] **3. Verify Service Health**:
  ```bash
  docker compose ps
  curl -s http://127.0.0.1:8080/actuator/health
  curl -s http://127.0.0.1:8081/actuator/health
  curl -s http://127.0.0.1:8082/actuator/health
  curl -s http://127.0.0.1:8083/actuator/health
  curl -s http://127.0.0.1:8084/actuator/health
  ```

---

## 9. Rollback & Emergency Recovery Procedure

- [ ] **Database Rollback**:
  ```bash
  # Restore from latest verified backup
  gunzip < /backups/vayro_db_YYYY-MM-DD_HHMMSS.sql.gz | mysql -u root -p
  ```
- [ ] **Container Rollback**:
  ```bash
  # Roll back to previous image tag or commit
  docker compose down
  git checkout <previous_stable_tag>
  docker compose up -d --build
  ```
- [ ] **Emergency Contact & Escalation**:
  - Lead Infrastructure Admin: `admin@vayro.com`
