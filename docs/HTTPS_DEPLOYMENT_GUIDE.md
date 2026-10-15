# VAYRO — HTTPS Deployment & SSL Readiness Guide

**Target Domains**: `vayro.com`, `www.vayro.com`
**Architecture**: Nginx Edge Reverse Proxy + Spring Cloud Microservices Backend
**Security Standard**: Mozilla Intermediate TLS 1.2 / TLS 1.3

> [!IMPORTANT]
> **CURRENT DEPLOYMENT STATUS: HTTPS CONFIGURED (NOT LIVE)**
> HTTPS configuration and Docker Compose SSL overrides are fully structured, hardened, and verified for production activation. However, HTTPS is **not currently live** in the local development environment. Live activation requires pointing production DNS records to the host public IP and obtaining genuine Let's Encrypt certificates using the procedure below. HTTP development and internal services remain fully functional.

---

## 1. Overview and Architecture

VAYRO uses an Nginx container (`vayro-frontend`) as the trusted edge entry point:
- **Port 80 (Container 8080)**: Handles HTTP requests, ACME challenge tokens (`/.well-known/acme-challenge/`), redirects `vayro.com` / `www.vayro.com` to HTTPS via 301, and permits direct HTTP access for `localhost` development and internal health checks.
- **Port 443 (Container 8443)**: Terminates TLS 1.2 / 1.3, applies edge security headers, rate-limits `/api/auth/` routes (15 req/min with burst 10), and proxies API traffic to Spring Cloud API Gateway (`http://api-gateway:8080`).

```
                    ┌───────────────────────────┐
                    │  Internet (HTTP / HTTPS)   │
                    └─────────────┬─────────────┘
                                  │
                   Port 80 (HTTP) │ Port 443 (HTTPS)
                                  ▼
                    ┌───────────────────────────┐
                    │    vayro-frontend (Nginx) │
                    │ - ACME challenge webroot  │
                    │ - Modern TLS termination  │
                    │ - 15 r/m Auth Rate Limiter│
                    └─────────────┬─────────────┘
                                  │ proxy_pass (Docker internal)
                                  ▼
                    ┌───────────────────────────┐
                    │   vayro-api-gateway:8080  │
                    └─────────────┬─────────────┘
                                  │ Eureka Discovery
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
     user-service:8081    booking-service:8083   vehicle-service:8082
```

---

## 2. Pre-Deployment DNS Verification

Before requesting an SSL certificate from Let's Encrypt, ensure DNS records are propagated:

```bash
# Verify A record for apex domain
dig +short A vayro.com

# Verify A / CNAME record for www subdomain
dig +short A www.vayro.com
```

Both queries must resolve to your production host's public IP address.

---

## 3. Obtaining Let's Encrypt SSL Certificates

### Step 3.1 — Create the ACME Challenge Directory
On the production host:
```bash
sudo mkdir -p /var/www/certbot
sudo mkdir -p /etc/letsencrypt
```

### Step 3.2 — Obtain Initial Certificate via Certbot Webroot
With the base container running (`docker compose up -d frontend`):

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d vayro.com \
  -d www.vayro.com \
  --email security@vayro.com \
  --agree-tos \
  --no-eff-email
```

Certbot creates:
- Certificate chain: `/etc/letsencrypt/live/vayro.com/fullchain.pem`
- Private key: `/etc/letsencrypt/live/vayro.com/privkey.pem`

---

## 4. Activating HTTPS in Docker Compose

### 4.1 Certificate Mounting Architecture
In Let's Encrypt, files under `/etc/letsencrypt/live/vayro.com/` are symbolic links to versioned files in `/etc/letsencrypt/archive/vayro.com/`.

To ensure continuous, renewal-safe operation:
- The entire host directory `/etc/letsencrypt` is mounted into the container as `/etc/letsencrypt:ro` (read-only).
- Mounting the complete directory guarantees that containerized Nginx can resolve symlinks to `../../archive/` both on boot and immediately after Certbot renews certificates.
- Individual file mounts (e.g. `fullchain.pem`) must NOT be used because Docker binds individual file inodes at startup, causing Nginx to serve stale certificates or break after renewal.
- Nginx configuration template directly references `/etc/letsencrypt/live/vayro.com/fullchain.pem` and `/etc/letsencrypt/live/vayro.com/privkey.pem`.

### 4.2 Starting Production HTTPS Stack
Once certificates exist at `/etc/letsencrypt/live/vayro.com/`, launch the production HTTPS stack:

```bash
# Start full production stack with SSL override
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

### Inspecting Container Port Status
```bash
docker ps --filter "name=vayro-frontend"
```
Expected output:
```
0.0.0.0:80->8080/tcp, 0.0.0.0:443->8443/tcp
```

---

## 5. Verification & Testing

### Test 1 — HTTP to HTTPS 301 Redirect for Domain
```bash
curl -I http://vayro.com
```
Expected response:
```http
HTTP/1.1 301 Moved Permanently
Location: https://vayro.com/
```

### Test 2 — Localhost HTTP Bypasses Redirect (Dev Safety)
```bash
curl -I http://localhost:8080/healthz
```
Expected response:
```http
HTTP/1.1 200 OK
Content-Type: text/plain
OK
```

### Test 3 — HTTPS Handshake and TLS Version
```bash
openssl s_client -connect vayro.com:443 -tls1_3 -servername vayro.com
```
Verify:
- `Protocol: TLSv1.3`
- `Verify return code: 0 (ok)`

### Test 4 — Rate Limiting on Authentication Routes
```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://vayro.com/api/auth/login
done
```
Verify that requests 1–15 return `401/400/404` (gateway responses) and requests 16–20 return `429 Too Many Requests`.

---

## 6. HSTS (HTTP Strict Transport Security) Enablement Checklist

> [!CAUTION]
> **DO NOT ENABLE HSTS PREMATURELY**
> Enabling `Strict-Transport-Security` before HTTPS has been continuously running and verified in production will cause modern browsers to cache the directive and refuse all HTTP connections if the certificate expires or has errors.

### Prerequisites to Enable HSTS:
1. [ ] HTTPS has been active in production for at least 7 consecutive days with 0 certificate errors.
2. [ ] Automated renewal (`certbot renew`) has been tested via `certbot renew --dry-run` and verified functional.
3. [ ] All subdomains (if any) support HTTPS.
4. [ ] All mixed content (images, scripts, styles) has been eliminated.

### Enabling HSTS in `frontend/nginx.ssl.conf.template`:
Uncomment line 143:
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

Reload Nginx:
```bash
docker compose exec frontend nginx -s reload
```

---

## 7. Automated Certificate Renewal & Safe Nginx Reload

Certbot certificates are valid for 90 days. Set up a systemd timer or cron job on the host to check renewal daily.

### 7.1 Zero-Downtime Nginx Reload Command
When certificates are renewed, Nginx must reload its SSL context. Do **NOT** restart the frontend container (`docker compose restart frontend`), as restarting causes downtime, drops in-flight HTTP requests, and temporarily breaks routing.

Instead, execute a graceful Nginx configuration reload:
```bash
# Graceful reload via Docker Compose (preferred)
docker compose -f /path/to/VAYRO/docker-compose.yml -f /path/to/VAYRO/docker-compose.ssl.yml exec -T frontend nginx -s reload

# Or direct container reload via Docker CLI
docker exec vayro-frontend nginx -s reload
```

**Why `nginx -s reload` is safe**:
- Spawns new worker processes with the updated SSL certificates.
- Allows existing worker processes to gracefully finish handling current requests before terminating.
- Zero client-visible downtime or dropped TCP connections.

### 7.2 Crontab / Systemd Automated Hook
Add the renewal cron job to the host crontab (`sudo crontab -e`):
```bash
# Runs daily at 03:00 UTC; reloads Nginx only upon successful certificate renewal
0 3 * * * certbot renew --webroot -w /var/www/certbot --post-hook "docker exec vayro-frontend nginx -s reload" >> /var/log/vayro-certbot.log 2>&1
```

---

## 8. Rollback Procedure

If certificates fail or become corrupt:
1. Revert to standard HTTP configuration:
   ```bash
   docker compose -f docker-compose.yml up -d frontend
   ```
2. Verify local development remains accessible at `http://localhost:8080`.
3. Check certificate status via `certbot certificates`.
