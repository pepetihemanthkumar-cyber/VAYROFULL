# VAYRO — Google Cloud Run Production Deployment Guide

This guide details the complete deployment process for the **VAYRO** platform on **Google Cloud Run** using **GitHub Actions CI/CD** and **Workload Identity Federation (WIF)**.

---

## 1. Architecture Overview

```text
                           Internet / Client Web Browser
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
           Google Cloud Run                          Google Cloud Run
            [vayro-frontend]                          [vayro-backend]
           (React 19 + Nginx)                     (Spring Cloud Gateway)
                    │                                         │
                    │ (API calls via VITE_API_URL)            │
                    └─────────────────────────────────────────►
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            │ Container Internal Mesh (localhost)
                                            ▼                                   ▼
                                      Eureka Registry (8761)              User Service (8081)
                                      Vehicle Service (8082)              Booking Service (8083)
                                      Notification Service (8084)
                                                              │
                                                              ▼
                                                     Supabase PostgreSQL
                                                aws-0-ap-southeast-1.pooler.supabase.com
```

### Components
* **`vayro-frontend`**: React 19 single-page application served via high-performance unprivileged Nginx on port 8080 (dynamically mapped to Cloud Run `$PORT`).
* **`vayro-backend`**: Consolidated backend microservice container running Eureka discovery, API Gateway, and all 4 domain microservices (`user-service`, `vehicle-service`, `booking-service`, `notification-service`) inside an isolated, highly optimized runtime container.
* **Database**: External managed PostgreSQL database on Supabase connected over encrypted SSL (`sslmode=require`).
* **Secrets Management**: Sensitive credentials (`DB_PASSWORD`, `JWT_SECRET`) injected directly at runtime via **Google Cloud Secret Manager**.

---

## 2. Docker Build & Local Simulation

### Building the Frontend Container
```bash
# Build image locally
docker build \
  --build-arg VITE_API_URL="https://your-backend-url.run.app" \
  -t vayro-frontend:latest \
  frontend

# Test run locally on port 8080
docker run -p 8080:8080 -e PORT=8080 vayro-frontend:latest
```

### Building the Backend Container
```bash
# Build image locally from repository root
docker build \
  -t vayro-backend:latest \
  backend/vayro-backend

# Test run locally
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e DB_HOST="aws-0-ap-southeast-1.pooler.supabase.com" \
  -e DB_PORT=5432 \
  -e DB_NAME=postgres \
  -e DB_USERNAME="postgres.lgpuulmsdogxzsyoqwdk" \
  -e DB_PASSWORD="your_supabase_password" \
  -e JWT_SECRET="your_256_bit_jwt_secret" \
  vayro-backend:latest
```

---

## 3. Google Cloud Setup & Prerequisites

### Required Google Cloud APIs
Enable the required APIs in project `vayro-deployment-511213`:
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  --project vayro-deployment-511213
```

### Create Artifact Registry Docker Repository
```bash
gcloud artifacts repositories create vayro-docker-repo \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="VAYRO Container Images" \
  --project vayro-deployment-511213
```

### Create Secrets in Google Secret Manager
```bash
# 1. Supabase database password
echo -n "YOUR_SUPABASE_PASSWORD" | gcloud secrets create DB_PASSWORD \
  --data-file=- \
  --replication-policy="automatic" \
  --project vayro-deployment-511213

# 2. 256-bit JWT secret key
echo -n "YOUR_256_BIT_JWT_SECRET" | gcloud secrets create JWT_SECRET \
  --data-file=- \
  --replication-policy="automatic" \
  --project vayro-deployment-511213
```

---

## 4. IAM Permissions & Service Account Roles

### Deployment Service Account (`vayro-deployer`)
The deployment service account (`vayro-deployer@vayro-deployment-511213.iam.gserviceaccount.com`) is assumed by GitHub Actions via Workload Identity Federation. It requires:

```bash
PROJECT_ID="vayro-deployment-511213"
SA_EMAIL="vayro-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Cloud Run deployment permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

# Artifact Registry push permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Permission to deploy Cloud Run services using the runtime service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

### Cloud Run Runtime Service Account Secret Access
Cloud Run services run as the project's Compute Engine default service account: `296963130113-compute@developer.gserviceaccount.com`. Grant it access to read the secrets:

```bash
PROJECT_ID="vayro-deployment-511213"
RUNTIME_SA="296963130113-compute@developer.gserviceaccount.com"

# Grant Secret Manager Secret Accessor
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. GitHub Repository Configuration

Under **GitHub Repository $\to$ Settings $\to$ Secrets and variables $\to$ Actions $\to$ Variables**, verify:

| Variable Name | Value | Purpose |
|---|---|---|
| `GCP_PROJECT_ID` | `vayro-deployment-511213` | Target Google Cloud Project |
| `GCP_WIF_PROVIDER` | `projects/296963130113/locations/global/workloadIdentityPools/vayro-ci-pool/providers/github-actions` | OIDC WIF Provider |
| `GCP_WIF_SERVICE_ACCOUNT` | `vayro-deployer@vayro-deployment-511213.iam.gserviceaccount.com` | Deployment Service Account |
| `GCP_REGION` | `asia-southeast1` | Regional location (Singapore, adjacent to Supabase) |
| `ARTIFACT_REGISTRY_REPO` | `vayro-docker-repo` | Artifact Registry name |

---

## 6. Deployment Instructions

1. Push your changes to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: prepare Cloud Run deployment configuration"
   git push origin main
   ```
2. The GitHub Actions workflow (`.github/workflows/main.yml`) will automatically trigger:
   * Authenticates passwordlessly using Workload Identity Federation.
   * Compiles and packages all backend modules.
   * Builds and pushes the `vayro-backend` Docker image.
   * Deploys `vayro-backend` to Cloud Run and extracts its HTTPS URL.
   * Builds the `vayro-frontend` Docker image with the backend URL embedded.
   * Deploys `vayro-frontend` to Cloud Run.
   * Executes automated health probes against `/actuator/health` and `/healthz`.
   * Prints the live URLs in the workflow summary.

---

## 7. How to Find Your Cloud Run URLs

Via Google Cloud CLI:
```bash
# Frontend URL
gcloud run services describe vayro-frontend \
  --region asia-southeast1 \
  --format 'value(status.url)'

# Backend URL
gcloud run services describe vayro-backend \
  --region asia-southeast1 \
  --format 'value(status.url)'
```

Via Google Cloud Console:
* Navigate to **Google Cloud Console $\to$ Cloud Run**.
* Locate services `vayro-frontend` and `vayro-backend`. The public HTTPS URL is displayed directly at the top of each service overview.

---

## 8. Troubleshooting

| Issue | Root Cause | Solution |
|---|---|---|
| `Container failed to start and listen on the port provided by the $PORT` | Application did not bind to `0.0.0.0:$PORT` | Verify that `PORT` environment variable is mapped in `entrypoint.sh` and `nginx.conf`. |
| `Permission denied on secret [DB_PASSWORD]` | Runtime service account cannot read Secret Manager | Ensure `296963130113-compute@developer.gserviceaccount.com` has `roles/secretmanager.secretAccessor`. |
| `Database connection failed` | Missing or incorrect `DB_PASSWORD` or network block | Verify secret value in Secret Manager and ensure Supabase project is active and accepting connections from `0.0.0.0/0`. |
| `CORS Error in browser` | Frontend origin is blocked by backend Gateway | In `api-gateway` configuration, ensure `CORS_ALLOWED_ORIGINS` includes the frontend Cloud Run URL or `allowedOriginPatterns` is active. |

---

## 9. Cost Optimization & Cleanup

* **Scale to Zero**: Both `vayro-frontend` and `vayro-backend` are configured with `--min-instances 0`. When no requests are being processed, container instances shut down completely and cost **$0.00**.
* **Free Tier Coverage**: Google Cloud Run includes 2 million free requests and 360,000 GB-seconds of compute monthly.
* **To Delete Services** (if no longer needed):
  ```bash
  gcloud run services delete vayro-frontend --region asia-southeast1 --quiet
  gcloud run services delete vayro-backend --region asia-southeast1 --quiet
  gcloud artifacts repositories delete vayro-docker-repo --location asia-southeast1 --quiet
  ```
