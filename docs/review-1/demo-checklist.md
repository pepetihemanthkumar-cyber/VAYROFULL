# VAYRO — Live Review 1 Demonstration Checklist

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — Live System Demonstration  
**Purpose:** Step-by-step presentation script and verification checklist for the academic review panel.  
**Date:** September 2026  
**Document Version:** 1.1.0  

---

## Demonstration Overview

This document provides a guided walkthrough for demonstrating the VAYRO platform to faculty evaluators. Each step outlines **what to display**, the **expected technical outcome**, and the **key technical explanation** to deliver.

---

## Quick Reference: Test Credentials & URLs

| Role / Service | URL / Port | Identifier / Email | Password / Notes |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:5173` | — | React 19 Single-Page Application (Vite 6) |
| **Eureka Server Dashboard** | `http://localhost:8761` | — | Service Discovery Registry |
| **API Gateway** | `http://localhost:8080` | — | Perimeter Entry Point |
| **USER Role Account** | Frontend Login | `customer@vayro.com` | `VayroCustomer2026!` (Role: `ROLE_USER`) |
| **ADMIN Role Account** | Frontend Login | `admin@vayro.com` | `VayroAdmin2026!` (Role: `ROLE_ADMIN`) |
| **Supabase Cloud DB** | Supabase Console | `postgres` database | Cloud PostgreSQL Tables |

---

## 14-Step Live Demonstration Script

---

### Step 1: Start Eureka Server & Verify Startup
- **What to Show:** Terminal running `eureka-server` or browser opened to `http://localhost:8761`.
- **Expected Result:** Spring Boot initializes on port `8761`. Eureka Dashboard displays the active environment.
- **What to Explain:**  
  *"This is Netflix Eureka, our central service discovery registry. In a microservice architecture, services do not hardcode IP addresses. Instead, every service registers here on startup with its logical application name."*

---

### Step 2: Show Registered Microservices on Eureka Dashboard
- **What to Show:** Refresh `http://localhost:8761` showing the table **"Instances currently registered with Eureka"**.
- **Expected Result:** The following 5 instances are listed as `UP`:
  - `API-GATEWAY` (Port 8080)
  - `USER-SERVICE` (Port 8081)
  - `VEHICLE-SERVICE` (Port 8082)
  - `BOOKING-SERVICE` (Port 8083)
  - `NOTIFICATION-SERVICE` (Port 8084)
- **What to Explain:**  
  *"All our microservices have dynamically registered with Eureka. The registry continuously monitors their health via periodic heartbeats. If any service fails, Eureka detects it automatically."*

---

### Step 3: Start & Inspect the API Gateway
- **What to Show:** Gateway logs on port `8080` and browser hitting `http://localhost:8080/actuator/health`.
- **Expected Result:** Returns `{"status":"UP"}`. Gateway routes are bound to `lb://USER-SERVICE`, `lb://VEHICLE-SERVICE`, etc.
- **What to Explain:**  
  *"The API Gateway acts as the single perimeter reverse proxy. All frontend traffic enters via port 8080 under the `/api/**` namespace. The gateway handles CORS, validates incoming JWT tokens, and routes traffic without exposing internal service ports."*

---

### Step 4: Login as a Regular USER
- **What to Show:** Open frontend (`http://localhost:5173/login`) and log in with `customer@vayro.com` / `VayroCustomer2026!`.
- **Expected Result:** Login succeeds instantly; user is redirected to the home/fleet discovery page with their name displayed in the top navbar.
- **What to Explain:**  
  *"When the user submits credentials, the Gateway routes `POST /api/auth/login` to the User Service. The User Service verifies the BCrypt salted hash against PostgreSQL and issues a signed JWT token."*

---

### Step 5: Demonstrate JWT Authentication & Claims Structure
- **What to Show:** Open Chrome DevTools $\to$ Application $\to$ Local Storage $\to$ inspect `vayro_session`. Paste the token into `jwt.io` (or inspect claims).
- **Expected Result:** The JWT contains standard claims: `sub: "customer@vayro.com"`, `userId`, `role: "USER"`, `iat`, `exp`.
- **What to Explain:**  
  *"VAYRO uses stateless JWT authentication. The token contains the user's role and ID signed with HMAC-SHA256. The server does not maintain session memory, allowing any gateway or microservice to validate requests independently."*

---

### Step 6: Access Protected USER Endpoints
- **What to Show:** Navigate to "My Bookings" (`/bookings`) and "Profile" (`/profile`).
- **Expected Result:** The frontend makes `GET /api/users/profile` and `GET /api/bookings/my` with the `Authorization: Bearer <token>` header. The server returns only this customer's data.
- **What to Explain:**  
  *"Our Axios client automatically attaches the JWT Bearer token. The backend extracts `userId` from the token claims to query the database, ensuring complete data isolation between customers."*

---

### Step 7: Demonstrate ADMIN Login & Dashboard
- **What to Show:** Log out and log in as `admin@vayro.com` / `VayroAdmin2026!`.
- **Expected Result:** Admin dashboard badge is visible. Navigation reveals Admin controls (Fleet Management, All Bookings, Status Toggles).
- **What to Explain:**  
  *"When logging in with admin credentials, the token contains `role: "ADMIN"`. The frontend renders administrative navigation controls, and backend filters grant access to elevated endpoints."*

---

### Step 8: Demonstrate Role-Based Access Control (RBAC) Enforcement
- **What to Show:** Show that a regular `USER` token cannot perform administrative operations (e.g., attempt to call `POST /api/vehicles` or `PATCH /api/bookings/{id}/activate`).
- **Expected Result:** The Gateway/Service immediately rejects unauthorized actions with `HTTP 403 FORBIDDEN` and structured JSON error messages.
- **What to Explain:**  
  *"RBAC is enforced at two layers: the Gateway perimeter rejects non-admin requests before they reach services, and microservice method security ensures zero unauthorized modifications."*

---

### Step 9: Show API Traffic Flowing Through Gateway
- **What to Show:** Open DevTools $\to$ Network Tab $\to$ Browse the vehicle catalog or click a vehicle.
- **Expected Result:** All request URLs show `http://localhost:5173/api/vehicles` (proxied to `localhost:8080/api/vehicles`), returning HTTP 200 with vehicle JSON payloads.
- **What to Explain:**  
  *"The frontend only ever interacts with the API Gateway endpoint. The gateway dynamically looks up `lb://VEHICLE-SERVICE` via Eureka and load-balances the request to the vehicle microservice."*

---

### Step 10: Demonstrate Vehicle Service & Fleet Specifications
- **What to Show:** Filter the fleet catalog by category (Cars, Bikes, Electric Scooters), fuel type (Petrol, Diesel, EV), and transmission (Manual, Automatic).
- **Expected Result:** Filtered list updates instantaneously with high-resolution imagery, specifications, daily pricing, and live availability badges.
- **What to Explain:**  
  *"The Vehicle Service maintains independent domain logic for fleet inventory, technical specifications, and status tracking (`AVAILABLE`, `RENTED`, `MAINTENANCE`)."*

---

### Step 11: Demonstrate Booking Service, Availability & Overlap Prevention
- **What to Show:**
  1. Select a vehicle, choose pickup/return dates, and click "Reserve Now".
  2. Attempt to create a second reservation for the exact same vehicle during the same time window.
- **Expected Result:**
  1. The first reservation succeeds (`HTTP 201 Created`, booking reference generated).
  2. The second reservation is blocked with `409 CONFLICT` or descriptive message: *"Vehicle is already booked for the selected period."*
- **What to Explain:**  
  *"We implemented concurrency control using JVM lock striping and SQL date interval overlap queries ($pickup < return_{existing} \land return > pickup_{existing}$). This guarantees zero double-booking collisions."*

---

### Step 12: Demonstrate Inter-Service Communication (`Booking` $\to$ `Vehicle`)
- **What to Show:** In the Admin portal, mark a confirmed booking as **"Activate / Picked Up"** (`PATCH /api/bookings/{id}/activate`).
- **Expected Result:** The booking status updates to `ACTIVE`. The vehicle status in the fleet catalog automatically transitions to `RENTED`.
- **What to Explain:**  
  *"This demonstrates synchronous inter-service communication. The Booking Service uses a Spring Cloud `@LoadBalanced RestClient` to resolve `http://VEHICLE-SERVICE` through Eureka and updates the vehicle's status in real time."*

---

### Step 13: Inspect Database Records in Cloud PostgreSQL (Supabase)
- **What to Show:** Supabase dashboard or table view showing `users`, `vehicles`, `bookings`, and `notifications`.
- **Expected Result:** Tables show clean relational records with BCrypt password hashes, exact `BigDecimal` price figures, foreign keys, and unique booking references.
- **What to Explain:**  
  *"All microservices persist data into PostgreSQL on Supabase using HikariCP connection pools with SSL enforcement. Each microservice manages its own domain entity tables."*

---

### Step 14: Demonstrate PDF Invoice Generation & Email Dispatch
- **What to Show:** On the booking confirmation screen, click **"Download Invoice"** or inspect the generated OpenPDF invoice.
- **Expected Result:** A vector PDF is downloaded, featuring the VAYRO logo, itemized base pricing, add-ons, 18% GST calculation, customer details, and booking reference.
- **What to Explain:**  
  *"Upon booking creation, the Notification Service generates a vector PDF using OpenPDF and dispatches a confirmation email via SMTP. This runs asynchronously, ensuring that notification tasks never delay the customer's reservation."*
