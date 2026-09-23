# VAYRO — Fleet Lifecycle & Vehicle Rental Management Platform

[![Spring Boot 3.4.3](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java 21 LTS](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)
[![React 19](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.3-purple.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2F%20Supabase-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Academic%20%2F%20MIT-lightgrey.svg)](LICENSE)

---

## 1. Project Overview
**VAYRO** is a cloud-native, microservices-engineered vehicle rental and fleet lifecycle management platform. Designed for high concurrency, zero booking conflicts, and enterprise scalability, VAYRO integrates a reactive API Gateway, distributed service discovery, stateless JWT authentication, asynchronous invoice generation, and a modern single-page React frontend.

---

## 2. Problem Statement
Traditional car rental businesses and legacy booking platforms suffer from:
- **Distributed State Inconsistencies:** Concurrent booking attempts causing vehicle double-allocation.
- **Monolithic Bottlenecks:** A failure in payment or notification crashes catalog browsing and user login.
- **Opaque Pricing & Hidden Charges:** Lack of real-time GST tax breakdown, dynamic add-ons, and coupon calculation.
- **Manual Verification Delays:** Paper invoices and manual status updates instead of real-time PDF generation and instant email delivery.

---

## 3. Objectives
- **Zero-Overlap Guarantee:** Enforce rigorous mathematical interval overlap detection `[start, end)` at the database repository level.
- **Fault-Tolerant Microservices:** Decouple Authentication, Catalogue, Reservation, and Notifications via Spring Cloud Eureka and API Gateway.
- **Stateless & Secure Access:** Implement HMAC-SHA256 JWT security across all microservice boundaries.
- **Seamless User Experience:** Provide a responsive, high-performance UI featuring interactive 5-step booking and instant booking confirmation.

---

## 4. Key Features
- **207-Vehicle Multi-Category Catalogue:** Real-time search, category filtering (Cars, Luxury SUVs, Premium Motorcycles), and live status tracking.
- **Stateless RBAC Security:** Role-based access control distinguishing `USER` (customers) and `ADMIN` (fleet managers).
- **Automated Price Computation:** Real-time duration calculation, dynamic add-ons selection, promotional coupon discounts, and automated 18% GST tax application.
- **Asynchronous Invoice & Email Dispatch:** Dynamic PDF tax invoice generation via OpenPDF and non-blocking Gmail SMTP dispatch with idempotency protection.
- **Responsive Management Dashboards:** Dedicated Customer Booking Hub and Fleet Operations Admin Dashboard.

---

## 5. Digital Transformation & Innovation (DTI) Concepts
VAYRO directly embodies digital transformation principles:
- **Centralized Digital Platform:** Replaces fragmented paper and legacy manual bookings with a unified digital ecosystem.
- **Process Automation:** Automated end-to-end reservation workflow from date selection to payment simulation and invoice delivery.
- **Data-Driven Fleet Management:** Real-time visibility into vehicle maintenance, utilization rates, and active reservations.
- **Service Integration & Composability:** Independent microservices loosely coupled through standardized REST interfaces and Eureka Discovery.
- **Secure Digital Identity:** Zero-trust edge validation through reactive API Gateway token inspection.

---

## 6. System Architecture

```mermaid
graph TD
    Client["React 19 SPA Frontend (:5173)"]
    Gateway["Spring Cloud API Gateway (:8080)"]
    Eureka["Eureka Service Discovery (:8761)"]
    
    UserSvc["USER-SERVICE (:8081)"]
    VehicleSvc["VEHICLE-SERVICE (:8082)"]
    BookingSvc["BOOKING-SERVICE (:8083)"]
    NotifSvc["NOTIFICATION-SERVICE (:8084)"]
    
    DB[(PostgreSQL / Supabase)]

    Client -->|"/api/* (HTTP/JSON)"| Gateway
    Gateway -->|"Discover & Route"| Eureka
    
    Gateway -->|"/api/auth/**, /api/users/**"| UserSvc
    Gateway -->|"/api/vehicles/**"| VehicleSvc
    Gateway -->|"/api/bookings/**"| BookingSvc
    Gateway -->|"/api/notifications/**"| NotifSvc

    UserSvc --- Eureka
    VehicleSvc --- Eureka
    BookingSvc --- Eureka
    NotifSvc --- Eureka

    BookingSvc -->|"Sync Verify (LoadBalanced)"| VehicleSvc
    BookingSvc -->|"Async Dispatch (@Async)"| NotifSvc

    UserSvc --> DB
    VehicleSvc --> DB
    BookingSvc --> DB
    NotifSvc --> DB
```

---

## 7. Microservices Architecture

| Microservice | Port | Eureka Service ID | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Eureka Server** | `8761` | `EUREKA-SERVER` | Central registry, heartbeat monitoring, and dynamic instance routing |
| **API Gateway** | `8080` | `API-GATEWAY` | Reactive reverse proxy, JWT edge verification, CORS enforcement, request routing |
| **User Service** | `8081` | `USER-SERVICE` | User accounts, BCrypt credential hashing, JWT token minting, Google OAuth |
| **Vehicle Service** | `8082` | `VEHICLE-SERVICE` | 207-vehicle catalog, dynamic specification search, fleet availability status |
| **Booking Service** | `8083` | `BOOKING-SERVICE` | Reservation lifecycle, date overlap prevention, pricing engine, tax calculation |
| **Notification Service** | `8084` | `NOTIFICATION-SERVICE` | Idempotent log auditing, OpenPDF tax invoice creation, asynchronous SMTP email |

---

## 8. Service Discovery with Eureka
Each Spring Boot microservice includes `spring-cloud-starter-netflix-eureka-client` and publishes its hostname and port metadata to the master Eureka registry on startup:
```yaml
eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER_URL:http://localhost:8761/eureka/}
    register-with-eureka: true
    fetch-registry: true
```
Services communicate seamlessly using logical hostnames (`http://VEHICLE-SERVICE`, `http://NOTIFICATION-SERVICE`) resolved dynamically via `@LoadBalanced RestClient`.

---

## 9. JWT Authentication

### Authentication Flow:
1. **Login Request:** Client submits credentials (`POST /api/auth/login`) to API Gateway.
2. **Gateway Forwarding:** Gateway routes request to `USER-SERVICE`.
3. **Verification & Issuance:** `AuthService` verifies BCrypt password hash and `JwtService` issues an HMAC-SHA256 signed token containing `userId`, `role`, `name`, and expiration (`exp`).
4. **Client Session:** Frontend stores token in `localStorage` under `vayro_session`.
5. **Token Propagation:** Axios interceptor attaches `Authorization: Bearer <token>` to all protected calls.
6. **Edge & Downstream Validation:** Gateway and target services validate signature, verify expiration, and establish Spring Security `SecurityContext`.

---

## 10. API Gateway Routing
Spring Cloud Gateway provides non-blocking, reactive HTTP routing:
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-auth-route
          uri: lb://USER-SERVICE
          predicates:
            - Path=/api/auth/**
        - id: user-service-route
          uri: lb://USER-SERVICE
          predicates:
            - Path=/api/users/**
        - id: vehicle-service-route
          uri: lb://VEHICLE-SERVICE
          predicates:
            - Path=/api/vehicles/**
        - id: booking-service-route
          uri: lb://BOOKING-SERVICE
          predicates:
            - Path=/api/bookings/**
        - id: notification-service-route
          uri: lb://NOTIFICATION-SERVICE
          predicates:
            - Path=/api/notifications/**
```

---

## 11. Frontend Technology
- **Framework:** React 19 SPA client with React Router v7.
- **Build Tool:** Vite 6 with high-speed HMR and optimized asset bundling.
- **Styling:** Modern Tailwind CSS with custom glassmorphism, responsive grids, and micro-animations via Framer Motion.
- **Icons:** Lucide React.
- **Networking:** Axios with automated request/response interceptors for token injection and structured error extraction.

---

## 12. Backend Technology
- **Framework:** Spring Boot 3.4.3 & Spring Cloud 2024.0.0.
- **Language:** Java 21 LTS.
- **Security:** Spring Security 6, JJWT 0.12.6, BCrypt.
- **Data Persistence:** Spring Data JPA & Hibernate ORM with HikariCP connection pooling.
- **PDF Generation:** OpenPDF 2.0.3.
- **Mail:** Spring Boot Starter Mail (JavaMailSender / SMTP).

---

## 13. Database Architecture
- **Engine:** PostgreSQL 16 (Hosted on Supabase with connection pooling).
- **Core Entities:**
  - `User`: Account credentials, contact information, role (`USER` / `ADMIN`), timestamps.
  - `Vehicle`: Vehicle ID, brand, model, daily price, seating, fuel type, transmission, status (`AVAILABLE`, `RENTED`, `MAINTENANCE`).
  - `Booking`: Reference ID, user ID, vehicle ID, pickup/return dates, breakdown (base, addons, discount, tax, total), status (`CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`).
  - `Notification`: Audit logs, idempotency key, email delivery status (`PENDING`, `SENT`, `FAILED`).

---

## 14. Notification System & Invoice Generation
When a booking is confirmed:
1. `BOOKING-SERVICE` dispatches an asynchronous call (`@Async`) to `NOTIFICATION-SERVICE`.
2. `NotificationServiceImpl` checks the `idempotencyKey` to prevent duplicate emails.
3. `PdfInvoiceGenerator` generates a PDF invoice containing line-item charges, GST tax summary, and driver details.
4. `GmailEmailProvider` sends a multipart MIME email with the attached PDF invoice via Gmail SMTP.

---

## 15. Booking Workflow & Overlap Prevention Logic
To ensure strict reservation integrity, `BookingRepository` executes a mathematical interval query before confirming any booking:

$$\text{Overlap} \iff \text{existing.pickup} < \text{requested.return} \land \text{existing.return} > \text{requested.pickup}$$

```java
@Query("SELECT b FROM Booking b WHERE b.vehicleId = :vehicleId " +
       "AND b.status IN (:blockingStatuses) " +
       "AND b.pickupDateTime < :returnDateTime " +
       "AND b.returnDateTime > :pickupDateTime")
List<Booking> findOverlappingBookings(
        @Param("vehicleId") String vehicleId,
        @Param("pickupDateTime") LocalDateTime pickupDateTime,
        @Param("returnDateTime") LocalDateTime returnDateTime,
        @Param("blockingStatuses") Collection<BookingStatus> blockingStatuses
);
```

---

## 16. Security & Hardening
- **Zero Raw Secrets in Git:** All secrets (JWT keys, database passwords, SMTP credentials) are supplied via environment variables.
- **Password Protection:** Passwords are encrypted with BCrypt work factor 10 before storage.
- **CORS Configuration:** Explicit origin pattern matching (`http://localhost:*`, `https://vayro.com`) with credentials support.
- **Input Sanitization:** Jakarta Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`, `@Size`, `@Email`) on all REST DTOs.

---

## 17. Project Structure

```
VAYRO/
├── frontend/                     # React 19 / Vite SPA Client
│   ├── src/
│   │   ├── animations/           # Framer Motion animation variants
│   │   ├── components/           # UI components (Bookings, Layout, Vehicles)
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── pages/                # Customer & Admin pages
│   │   ├── routes/               # ProtectedRoute, AppRoutes
│   │   ├── services/             # Axios API, authService, bookingService, vehicleService
│   │   └── utils/                # Date, currency, coupon & rental math helpers
│   ├── public/                   # Public assets & vehicle imagery
│   ├── index.html                # Client entry point
│   ├── vite.config.js            # Vite build & proxy config
│   └── package.json
│
├── backend/
│   └── vayro-backend/            # Spring Boot Microservices
│       ├── pom.xml               # Multi-module root reactor
│       ├── eureka-server/        # Discovery Registry (:8761)
│       ├── api-gateway/          # Reactive API Gateway (:8080)
│       ├── user-service/         # User & Auth Service (:8081)
│       ├── vehicle-service/      # Fleet Catalogue Service (:8082)
│       ├── booking-service/      # Booking Engine (:8083)
│       └── notification-service/ # Async Notifications & Invoices (:8084)
│
├── docs/
│   └── review-1/                 # Review 1 Viva & Evaluation Documentation
│       ├── code-viewer/          # Standalone Interactive Code File Viewer
│       ├── README.md             # Review 1 Evaluation Overview
│       ├── system-architecture.md# Microservice Architecture Blueprint
│       ├── api-gateway.md        # API Gateway & Routing Specifications
│       ├── jwt-security.md       # JWT Authentication & RBAC Details
│       ├── viva-questions.md     # Comprehensive Viva Q&A Guide
│       └── linkedin-article.md   # DTI & Architecture Article
│
├── docker-compose.yml            # Multi-container local/prod orchestration
├── .env.example                  # Safe configuration template
├── .gitignore                    # Security & artifact exclusions
└── README.md                     # Platform Documentation
```

---

## 18. Service Ports

| Service | Port | Local URL |
| :--- | :--- | :--- |
| **Eureka Server** | `8761` | [http://localhost:8761](http://localhost:8761) |
| **API Gateway** | `8080` | [http://localhost:8080](http://localhost:8080) |
| **User Service** | `8081` | [http://localhost:8081](http://localhost:8081) |
| **Vehicle Service** | `8082` | [http://localhost:8082](http://localhost:8082) |
| **Booking Service** | `8083` | [http://localhost:8083](http://localhost:8083) |
| **Notification Service** | `8084` | [http://localhost:8084](http://localhost:8084) |
| **Frontend Client** | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Code File Viewer** | `8090` | [http://localhost:8090](http://localhost:8090) |

---

## 19. How to Run Locally

### Prerequisites:
- **Java:** JDK 21+
- **Maven:** 3.9+
- **Node.js:** 18+ & npm
- **Database:** PostgreSQL instance running on port 5432 (or Supabase URL)

### Step 1: Clone Repository & Setup Environment
```bash
git clone https://github.com/pepetihemanthkumar-cyber/VAYROFULL.git
cd VAYROFULL
cp .env.example .env
```

### Step 2: Start Backend Microservices
```bash
cd backend/vayro-backend

# Build all modules
mvn clean package -DskipTests

# Start microservices (in order)
mvn spring-boot:run -pl eureka-server
mvn spring-boot:run -pl api-gateway
mvn spring-boot:run -pl user-service
mvn spring-boot:run -pl vehicle-service
mvn spring-boot:run -pl booking-service
mvn spring-boot:run -pl notification-service
```

### Step 3: Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** to access the platform.

### Docker Compose (One-Click Start)
```bash
docker-compose up --build
```

---

## 20. Testing & Verification

### Run Backend Test Suite:
```bash
cd backend/vayro-backend
mvn clean test
```

### Run Frontend Production Build:
```bash
cd frontend
npm run build
```

---

## 21. Deployment Architecture
- **Containerization:** Multi-stage Docker container builds for all 6 microservices and Nginx-based frontend container.
- **Orchestration:** `docker-compose.yml` defining inter-container networking, health checks, environment propagation, and dependency order (`depends_on`).
- **Cloud Readiness:** Stateless application containers deployable to AWS ECS / EKS, Azure Kubernetes Service, or Google Cloud Run.

---

## 22. Interactive Review 1 Code Viewer
For faculty evaluation and technical viva demonstrations:
```bash
open docs/review-1/code-viewer/index.html
# or
python3 -m http.server 8090 -d docs/review-1/code-viewer
```
Visit **[http://localhost:8090](http://localhost:8090)** to inspect all 57 source files with real-time syntax highlighting, line numbers, and architecture justifications.

---

## 23. Documentation Index
Detailed technical documentation is available under `docs/review-1/`:
- [System Architecture Specification](docs/review-1/system-architecture.md)
- [API Gateway & Routing Blueprint](docs/review-1/api-gateway.md)
- [JWT Security & RBAC Specification](docs/review-1/jwt-security.md)
- [Comprehensive Viva Questions & Answers](docs/review-1/viva-questions.md)
- [Faculty Demonstration Order](docs/review-1/VAYRO_REVIEW_1_CODE_DEMO_ORDER.md)
- [LinkedIn DTI & Architecture Article](docs/review-1/linkedin-article.md)

---

## 24. Future Enhancements
- **Real-Time GPS Telematics:** IoT vehicle tracking with geofencing alerts.
- **Payment Gateway Integration:** Native Razorpay / Stripe webhook processing.
- **Dynamic Demand Pricing:** Machine-learning-driven seasonal fleet rate adjustments.
- **Mobile Application:** React Native / Flutter cross-platform companion app.

---

## License
Academic and enterprise evaluation license. Developed for VAYRO Vehicle Rental & Fleet Management Platform.
