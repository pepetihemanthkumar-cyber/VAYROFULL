# VAYRO — Backend Architecture & Foundation

> **Platform:** VAYRO Fleet Lifecycle & Rental Asset Management Platform  
> **Backend Namespace:** `com.vayro`  
> **Parent Artifact:** `com.vayro:vayro-backend:1.0.0-SNAPSHOT`  
> **Target Runtime:** Java 21 (LTS) & Spring Boot 3.x  

---

## 1. Project Purpose

VAYRO is an enterprise-grade fleet lifecycle and mobility rental platform managing a live multi-tier fleet (135 cars, 72 bikes/scooters across 36 automotive brands). The backend system is designed around a distributed microservice architecture providing isolated domain boundaries, high-availability booking lifecycle management, inventory locking, secure identity management, and real-time fleet telematics.

---

## 2. Current Step 1 Scope

This document and repository structure represent **STEP 1: Backend Foundation Setup ONLY**.

### Included in Step 1:
- Parent Maven project configuration (`pom.xml`) with Java 21 and Spring Boot 3.x dependency management.
- Backend project folder structure under `backend/vayro-backend/`.
- Enterprise database, environment, and security architecture documentation.
- Preservation of the intact, production-ready React frontend at the repository root.

### NOT IMPLEMENTED IN STEP 1 (Planned for subsequent phases):
- ❌ Eureka Service Discovery Server (`eureka-server`)
- ❌ Spring Cloud API Gateway (`api-gateway`)
- ❌ User & Authentication Service (`user-service`)
- ❌ Vehicle & Fleet Catalog Service (`vehicle-service`)
- ❌ Booking Lifecycle & Reservation Service (`booking-service`)
- ❌ JWT token issuance and cryptographic validation filters
- ❌ Spring Security authentication chains
- ❌ REST Controller endpoints and business domain logic
- ❌ MySQL schema migrations and JPA entities
- ❌ Inter-service REST/Feign communication clients
- ❌ Frontend-to-backend API migration

---

## 3. Technology Stack

- **Language:** Java 21 (LTS)
- **Framework:** Spring Boot 3.4.x (compatible with Spring Boot 3.x ecosystem)
- **Build Tool:** Apache Maven 3.9+
- **Database Engine:** MySQL 8.0+
- **Future Service Discovery:** Spring Cloud Netflix Eureka
- **Future Routing:** Spring Cloud Gateway
- **Testing Framework:** JUnit 5 (Jupiter), Mockito, Spring Boot Test

---

## 4. Backend Project Structure

### Current Step 1 Structure:
```
VAYRO/
├── src/                          # Existing React Frontend (Intact)
├── public/                       # Frontend Static Assets (Intact)
├── package.json
├── vite.config.js
├── index.html
├── .env
├── .env.production
├── .gitignore
│
└── backend/
    └── vayro-backend/            # Backend Parent Project
        ├── pom.xml               # Root Maven Parent POM
        └── README.md             # Architecture Specification
```

### Future Multi-Module Structure (Planned):
```
backend/vayro-backend/
├── pom.xml                       # Parent POM managing all sub-modules
├── README.md
│
├── eureka-server/                # Port 8761 - Service Registry
├── api-gateway/                  # Port 8080 - Central Routing & JWT Gatekeeper
├── user-service/                 # Port 8081 - Identity, Profiles & Auth
├── vehicle-service/              # Port 8082 - Fleet Catalogue & Status
└── booking-service/              # Port 8083 - Reservations & Life Cycle
```

---

## 5. Database Strategy & Data Ownership

VAYRO enforces a **Database-per-Service** architectural pattern. No service may directly access, query, or mutate the database tables of another service.

```
+-------------------+       +-------------------+       +--------------------+
|   user_service    |       |  vehicle_service  |       |  booking_service   |
|     (MySQL)       |       |      (MySQL)      |       |      (MySQL)       |
+-------------------+       +-------------------+       +--------------------+
| - users           |       | - vehicles        |       | - bookings         |
| - credentials     |       | - fleet_images    |       | - booking_addons   |
| - roles           |       | - maintenance     |       | - transactions     |
| - user_profiles   |       | - pricing_tiers   |       | - rental_audits    |
+-------------------+       +-------------------+       +--------------------+
```

### Domain Data Ownership:
1. **User Service:**
   - Owns user records, hashed credentials, role assignments (`CUSTOMER`, `ADMIN`), contact profiles, and account suspension flags.
2. **Vehicle Service:**
   - Owns all vehicle technical specs, dynamic rate tables (hourly, daily, long-term), operational status (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `INACTIVE`), and gallery URLs.
3. **Booking Service:**
   - Owns reservation records, schedule timestamps, driver details snapshot, duration calculations, selected add-ons, applied discounts, payment references, and rental state transitions (`CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`).

---

## 6. Environment Variables & Configuration

Sensitive credentials and dynamic deployment properties are managed strictly through environment variables. **No plaintext passwords or secrets may be committed to code or repository files.**

### Planned Environment Variables:

| Variable | Description | Safe Example / Default |
|---|---|---|
| `DB_HOST` | MySQL database hostname | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_NAME` | Service database name | `vayro_users` / `vayro_vehicles` / `vayro_bookings` |
| `DB_USERNAME` | Database connection username | `vayro_app` |
| `DB_PASSWORD` | Database connection password | *(Set via secure env/vault)* |
| `JWT_SECRET` | 256-bit HMAC signing key | *(Set via secure env/vault)* |
| `JWT_EXPIRATION_MS` | JWT validity duration (milliseconds) | `86400000` (24 Hours) |
| `EUREKA_SERVER_URL` | Service registry location | `http://localhost:8761/eureka/` |

---

## 7. Build & Verification Instructions

### Prerequisites:
- Java Development Kit (JDK) 21 installed (`java -version` returns `21.x`)
- Apache Maven 3.9+ installed (`mvn -version`)

### Verify Parent Backend Build:
```bash
cd backend/vayro-backend
mvn clean verify
```

### Verify React Frontend Build (from workspace root):
```bash
npm run build
```

---

## 8. Future Target Architecture (Planned — Not Implemented in Step 1)

```
                            +--------------------------+
                            |       VAYRO React        |
                            |   Single Page App (SPA)  |
                            +-------------+------------+
                                          |
                                          | (HTTPS / REST)
                                          v
                            +--------------------------+
                            |       API Gateway        |
                            |     (Spring Cloud)       |
                            |       Port: 8080         |
                            +----+--------+--------+---+
                                 |        |        |
             +-------------------+        |        +-------------------+
             | (Routing & Auth)           | (Routing & Auth)           | (Routing & Auth)
             v                            v                            v
  +--------------------+       +--------------------+       +--------------------+
  |    User Service    |       |  Vehicle Service   |       |  Booking Service   |
  |     Port: 8081     |       |     Port: 8082     |       |     Port: 8083     |
  +---------+----------+       +---------+----------+       +---------+----------+
            |                            |                            |
            |                            | (HTTP GET /availability)   |
            |                            |<---------------------------+
            |                            | (No shared database access)|
            |                            |                            |
            +----------------------------+----------------------------+
                                         |
                                         v
                            +--------------------------+
                            |      Eureka Server       |
                            |    Service Registry      |
                            |       Port: 8761         |
                            +--------------------------+
```

### Planned API Gateway Routes:
- `/api/auth/**` & `/api/users/**` ➔ `USER-SERVICE`
- `/api/vehicles/**` ➔ `VEHICLE-SERVICE`
- `/api/bookings/**` ➔ `BOOKING-SERVICE`

### Planned Microservice REST API Endpoints:

#### User Service (`com.vayro.users`):
- `POST /api/auth/register` — Create new customer profile with encrypted password.
- `POST /api/auth/login` — Authenticate credentials and return signed JWT.
- `GET /api/users/me` — Retrieve authenticated user profile and metadata.
- `PUT /api/users/profile` — Update address, phone number, or driving license.
- `PATCH /api/users/{id}/status` — Admin endpoint to activate or suspend user account.

#### Vehicle Service (`com.vayro.vehicles`):
- `GET /api/vehicles` — Retrieve full fleet catalogue with filtering by category, brand, fuel, and transmission.
- `GET /api/vehicles/{id}` — Retrieve detailed vehicle specification and multi-angle gallery.
- `GET /api/vehicles/{id}/availability` — Check if a vehicle is in `AVAILABLE` status for given dates.
- `POST /api/vehicles` — Admin endpoint to register a new vehicle asset.
- `PUT /api/vehicles/{id}` — Admin endpoint to modify vehicle specifications or pricing.
- `PATCH /api/vehicles/{id}/status` — Admin endpoint to transition vehicle operational status (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `INACTIVE`).

#### Booking Service (`com.vayro.bookings`):
- `POST /api/bookings` — Create reservation with conflict detection, pricing breakdown, and add-on validation.
- `GET /api/bookings` — Retrieve bookings (scoped to customer ID or fleet-wide for admins).
- `GET /api/bookings/{id}` — Retrieve booking details, driver credentials, and pricing breakdown.
- `PUT /api/bookings/{id}` — Modify reservation itinerary or driver information.
- `POST /api/bookings/{id}/start` — Transition booking to `ACTIVE` (vehicle on road) and sync vehicle status to `RENTED`.
- `POST /api/bookings/{id}/return` — Complete rental, calculate final duration, and release vehicle back to `AVAILABLE`.
- `DELETE /api/bookings/{id}` — Cancel reservation and release date hold back to fleet.

---

## 9. Security, Logging & Error Handling Standard

1. **JWT Architecture:** The API Gateway validates tokens on incoming requests and propagates verified identity headers (`X-User-Id`, `X-User-Role`) down to backend services.
2. **Zero-Secret Logging:** Logs must NEVER contain passwords, full JWT signatures, payment card details, or sensitive personally identifiable information (PII).
3. **Standardized Error Envelope:** All services will return uniform error responses:
   ```json
   {
     "timestamp": "2026-09-16T14:40:00Z",
     "status": 400,
     "error": "Bad Request",
     "message": "Return date/time must be strictly after pick-up date/time.",
     "path": "/api/bookings"
   }
   ```

---

## 10. Roadmap & Implementation Steps

- **Step 1 (Complete):** Backend Foundation Setup (Parent POM, directory structure, architecture documentation).
- **Step 2 (Complete):** Eureka Service Discovery Server (`eureka-server`).
- **Step 3 (Complete):** User & Authentication Service (`user-service`).
- **Step 4 (Complete):** Vehicle & Fleet Catalogue Service (`vehicle-service`).
- **Step 5 (Next):** Booking Service (Booking Lifecycle, Conflict Detection, Addons).
- **Step 6:** Spring Cloud API Gateway with Routing.
- **Step 7:** Inter-Service Feign / Rest Client Integrations.
- **Step 8:** Frontend-to-Backend API Integration.

---

## 11. STEP 2 — EUREKA SERVER (Service Registry)

### Purpose
The Eureka Server functions as the standalone central Service Registry for the VAYRO microservice ecosystem. In subsequent phases, backend microservices (`api-gateway`, `user-service`, `vehicle-service`, `booking-service`) will register their network instances dynamically with Eureka, enabling discovery and client-side load balancing without static IP/port coupling.

### Module Location & Specifications
- **Module Path:** `backend/vayro-backend/eureka-server/`
- **Java Version:** Java 21 (LTS)
- **Spring Boot Version:** `3.4.3`
- **Spring Cloud Version:** `2024.0.0`
- **Eureka Dependency:** `org.springframework.cloud:spring-cloud-starter-netflix-eureka-server`
- **Port:** `8761`
- **Local URL / Base URL:** `http://localhost:8761`
- **Dashboard URL:** `http://localhost:8761/`
- **Eureka Registration Endpoint:** `http://localhost:8761/eureka/`
- **Actuator Health Check:** Actuator was not added because it was not required for the minimal Eureka Step 2 implementation.

### Service Registration Concept
In Step 2, Eureka runs as a **standalone registry**:
- `eureka.client.register-with-eureka: false` (does not register with itself)
- `eureka.client.fetch-registry: false` (does not fetch registry from peers)
- `eureka.server.enable-self-preservation: false` (optimized for local development renewal tracking)

Future services in later steps will register using configuration equivalent to:
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### Future Registered Services (Planned):
- `API-GATEWAY` (Port: 8080)
- `USER-SERVICE` (Port: 8081)
- `VEHICLE-SERVICE` (Port: 8082)
- `BOOKING-SERVICE` (Port: 8083)

### How to Build Eureka:
From `backend/vayro-backend/`:
```bash
mvn clean verify
```

### How to Run Eureka Locally:
From `backend/vayro-backend/eureka-server/`:
```bash
mvn spring-boot:run
```

### Scope Boundary Confirmation:
**Implemented in Step 2:**
- Eureka Server module (`com.vayro:eureka-server:1.0.0-SNAPSHOT`)
- Standalone service registry configuration (`application.yml`)
- Local Eureka Web Dashboard at `http://localhost:8761/`
- Parent POM dependency management (`spring-cloud-dependencies:2024.0.0`)

---

## 12. STEP 3 — USER & AUTHENTICATION SERVICE

### Purpose
The User & Authentication Microservice (`user-service`) serves as the identity, authorization, and customer profile domain service for VAYRO. It manages customer and admin accounts, BCrypt password hashing, stateless HMAC-SHA256 JWT tokens, and role-based endpoint protection (`USER` vs. `ADMIN`).

### Module Location & Specifications
- **Module Path:** `backend/vayro-backend/user-service/`
- **Application Name:** `USER-SERVICE`
- **Port:** `8081`
- **Base Package:** `com.vayro.users`
- **Java Version:** Java 21 (LTS)
- **Spring Boot Version:** `3.4.3`
- **Spring Cloud Version:** `2024.0.0`
- **Database:** MySQL 8.0+ (`vayro_users`) with JPA / Hibernate
- **Eureka Registry:** Registered dynamically as `USER-SERVICE` at `http://localhost:8761/eureka/`

### Environment Variables & Database Strategy
| Variable | Description | Default / Dev Fallback |
|---|---|---|
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_NAME` | Service database name | `vayro_users` |
| `DB_USERNAME` | Database username | `root` |
| `DB_PASSWORD` | Database password | *(Empty / user configured)* |
| `JWT_SECRET` | 256-bit HMAC signing key | *(Development fallback key)* |
| `JWT_EXPIRATION` | Token validity in ms | `86400000` (24 Hours) |
| `EUREKA_SERVER_URL` | Eureka registration endpoint | `http://localhost:8761/eureka/` |
| `ADMIN_BOOTSTRAP_ENABLED` | Controlled dev admin seed flag | `true` |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@vayro.com` |
| `ADMIN_PASSWORD` | Bootstrap admin password | `VayroAdmin2026!` |

### REST Endpoints
| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new customer account (strictly assigns `USER` role). |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and return signed JWT token. |
| `GET` | `/api/users/me` | Authenticated (`USER`, `ADMIN`) | Retrieve authenticated profile without sensitive password fields. |
| `GET` | `/api/users` | Admin Only (`ADMIN`) | List all registered user accounts (returns `403 Forbidden` for `USER`). |
| `GET` | `/api/users/{id}` | Admin Only (`ADMIN`) | Retrieve specific user by identifier. |

### How to Build User Service:
From `backend/vayro-backend/`:
```bash
mvn clean verify
```

### How to Run User Service Locally:
Ensure MySQL is running on port 3306, and start Eureka Server first on port 8761, then run:
```bash
cd backend/vayro-backend/user-service
mvn spring-boot:run
```

### Scope Boundary Confirmation:
**Implemented in Step 3:**
- ✓ User Service module (`com.vayro:user-service:1.0.0-SNAPSHOT`)
- ✓ Registration & Login REST endpoints with DTOs and validation
- ✓ `USER` and `ADMIN` role-based authorization
- ✓ BCrypt password hashing & zero-password leakage guarantee
- ✓ JWT token issuance, extraction, and validation filter
- ✓ Spring Data JPA persistence with MySQL (`vayro_users`)
- ✓ Eureka Client auto-registration (`USER-SERVICE` status UP)
- ✓ Comprehensive unit tests and MockMvc integration tests (14/14 tests passing)

---

## 13. STEP 4 — VEHICLE & FLEET CATALOGUE SERVICE

### Purpose
The Vehicle & Fleet Catalogue Microservice (`vehicle-service`) serves as the inventory, asset specification, pricing, and operational lifecycle domain service for VAYRO. It manages the complete multi-tier fleet (135 cars, 72 bikes/scooters across 36 brands), MySQL persistence in `vayro_vehicles`, dynamic JPA filtering and pagination, fleet status management, and JWT-authenticated administrator operations.

### Module Location & Specifications
- **Module Path:** `backend/vayro-backend/vehicle-service/`
- **Application Name:** `VEHICLE-SERVICE`
- **Port:** `8082`
- **Base Package:** `com.vayro.vehicles`
- **Java Version:** Java 21 (LTS)
- **Spring Boot Version:** `3.4.3`
- **Spring Cloud Version:** `2024.0.0`
- **Database:** MySQL 8.0+ (`vayro_vehicles`) with JPA / Hibernate
- **Eureka Registry:** Registered dynamically as `VEHICLE-SERVICE` at `http://localhost:8761/eureka/`

### Seed & Image Asset Integrity
- **Total Seeded Vehicles:** Exactly 207 vehicles (135 cars + 72 bikes/scooters)
- **Total Image References:** Exactly 414 image paths (strictly 2 verified images per vehicle: `image1` and `image2`)
- **Initial Fleet Status:** `AVAILABLE`
- **Initial Maintenance Status:** `GOOD`

### REST Endpoints
| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/vehicles` | Public | Paginated fleet query with filtering (`category`, `status`, `vehicleType`, `search`, `minPrice`, `maxPrice`). |
| `GET` | `/api/vehicles/{id}` | Public | Detailed vehicle specification and 2-image gallery. |
| `GET` | `/api/vehicles/{id}/availability` | Public | Vehicle fleet availability foundation. |
| `POST` | `/api/vehicles` | Admin Only (`ADMIN`) | Register a new vehicle asset. |
| `PUT` | `/api/vehicles/{id}` | Admin Only (`ADMIN`) | Update vehicle specifications, pricing, or maintenance data. |
| `PATCH` | `/api/vehicles/{id}/status` | Admin Only (`ADMIN`) | Transition fleet operational status (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `INACTIVE`). |
| `DELETE` | `/api/vehicles/{id}` | Admin Only (`ADMIN`) | Remove a vehicle asset. |

### How to Build Vehicle Service:
From `backend/vayro-backend/`:
```bash
mvn clean verify
```

### How to Run Vehicle Service Locally:
Ensure MySQL is running on port 3306, and start Eureka Server on port 8761, then run:
```bash
cd backend/vayro-backend/vehicle-service
mvn spring-boot:run
```

### Scope Boundary Confirmation:
**Implemented in Step 4:**
- ✓ Vehicle Service module (`com.vayro:vehicle-service:1.0.0-SNAPSHOT`)
- ✓ 207-vehicle idempotent seed initializer from authoritative dataset
- ✓ Public read catalogue endpoints with pagination and JPA specifications
- ✓ Fleet availability query foundation
- ✓ Role-based JWT validation protecting administrative mutations
- ✓ MySQL persistence with dedicated `vayro_vehicles` schema
- ✓ Eureka Client auto-registration (`VEHICLE-SERVICE` status UP)
- ✓ Comprehensive unit and MockMvc integration tests (14/14 tests passing)

**NOT IMPLEMENTED (Reserved for subsequent steps):**
- ❌ Booking Service (`booking-service`)
- ❌ Booking overlap and reservation lifecycle logic
- ❌ Spring Cloud API Gateway (`api-gateway`)
- ❌ Frontend-to-backend API migration (React frontend remains intact)
- ❌ Payment gateway integration



