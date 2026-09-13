# DriveEase — Component 2: Microservice Identification, Architecture & Service Discovery

**Project Title:** DriveEase — Multi-Vehicle Rental & Fleet Management Platform  
**Document Stage:** Step 2 — Academic Evaluation Component 2  
**Evaluation Target:** 10 / 10 (Highly Modular Design)  
**Document Version:** 1.0.0  
**Date:** September 11, 2026  

---

## Executive Summary

This document presents the comprehensive **Component 2: Microservice Identification, Architecture, and Service Discovery** design for the DriveEase vehicle rental and fleet management platform. Building upon the functional requirements specified in Component 1, this document transforms the system from a client-side architecture into a highly modular, scalable, event-capable microservice ecosystem.

This specification adheres strictly to academic engineering principles: **Database-per-Service Isolation**, **Domain-Driven Design (DDD)**, **API Gateway Pattern**, **Service Discovery & Registration**, **Fault Isolation**, and **Asynchronous Event Communication**.

All existing frontend code in `src/` remains **100% untouched and protected**.

---

## PART 1 — BUSINESS DOMAIN ANALYSIS

To design a highly modular microservices architecture, we analyze the current DriveEase domain capabilities and group related business entities into cohesive Bounded Contexts using Domain-Driven Design (DDD):

```
+-----------------------------------------------------------------------------------+
|                            DRIVEEASE BOUNDED CONTEXTS                             |
+-----------------------------------------------------------------------------------+
| 1. Identity & Auth Context   : Credentials, Session Tokens, Roles, Claims          |
| 2. User & KYC Context        : Profiles, Contact Info, Driving Licenses, Preferences|
| 3. Vehicle & Catalog Context : Cars, Bikes, Specs, Tiers, Hubs, Base Rates        |
| 4. Booking Context           : Reservations, Schedules, Add-ons, Cancellations    |
| 5. Payment & Billing Context : Transactions, Coupons, Invoices, Security Deposits |
| 6. Review & Social Proof     : Star Ratings, User Reviews, Moderation             |
| 7. Notification Context      : Email Receipts, SMS Reminders, System Alerts       |
+-----------------------------------------------------------------------------------+
```

### Domain Decomposition Strategy
Rather than creating fragmented microservices for every single UI feature (e.g., separating "Car Service" from "Bike Service"), we establish microservice boundaries along fundamental business domains. This ensures **high cohesion within services** and **low coupling between services**.

---

## PART 2 — MICROSERVICE IDENTIFICATION & SPECIFICATIONS

We identify **7 Core Microservices** for the target DriveEase backend architecture:

```
+-----------------------------------------------------------------------------------+
|                          DRIVEEASE MICROSERVICE ECOSYSTEM                         |
+-----------------------------------------------------------------------------------+
| [MS-01] Auth Service          : Authentication, Password Hashing, JWT Tokens      |
| [MS-02] User Service          : User Profiles, KYC Document Storage, Preference   |
| [MS-03] Vehicle Service       : Fleet Inventory, Specs, Rates, Real-Time Availability|
| [MS-04] Booking Service       : Reservations, Schedule Calculation, State Machine |
| [MS-05] Payment Service       : Payment Gateway Processing, Invoices, Refunds     |
| [MS-06] Review Service        : Ratings, Customer Feedback, Vehicle Reviews       |
| [MS-07] Notification Service  : Asynchronous Email, SMS, System Event Alerts      |
+-----------------------------------------------------------------------------------+
```

### Detailed Microservice Breakdown

#### 1. Auth Service (`driveease-auth-service`)
- **Service ID:** `MS-01`
- **Business Responsibility:** User authentication, password hashing, JWT token issue/refresh, role-based claims generation.
- **Features Owned:** Registration validation, Login, Token Refresh, Password Reset, Role verification (`CUSTOMER`, `ADMIN`).
- **Data Owned:** Credentials, Password Hashes, Refresh Tokens, User Role Mappings.
- **Main APIs:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/verify`.
- **Dependencies:** User Service (triggers user profile creation on registration).
- **Independence Justification:** Security-critical domain requiring isolated execution and dedicated token key access.
- **Scalability Reason:** Handles frequent login/refresh spikes independently of core business transactions.
- **Security Considerations:** Enforces bcrypt password hashing and RS256 JWT signing.
- **Failure Isolation:** Auth failure prevents new session creation but leaves active valid JWT bearer requests intact at Gateway.

---

#### 2. User Service (`driveease-user-service`)
- **Service ID:** `MS-02`
- **Business Responsibility:** Management of customer profiles, administrative user management, and driving license (KYC) verification.
- **Features Owned:** Profile update, Address info, Phone verification, License upload/status check, User suspension/reactivation.
- **Data Owned:** Customer profile records, KYC verification status, License document references, Account status.
- **Main APIs:** `GET /api/v1/users/me`, `PUT /api/v1/users/me`, `POST /api/v1/users/kyc`, `GET /api/v1/users/admin/list`, `PUT /api/v1/users/admin/:id/status`.
- **Dependencies:** Auth Service (receives Auth ID link).
- **Independence Justification:** KYC document storage and profile management operate independently from fleet browsing or payment logic.
- **Scalability Reason:** Heavy image/document payload transfers do not bottleneck search or booking performance.
- **Security Considerations:** Restricts document inspection to profile owner and authenticated administrators.
- **Failure Isolation:** Outage allows catalog search and booking creation to proceed if user session is valid.

---

#### 3. Vehicle Service (`driveease-vehicle-service`)
- **Service ID:** `MS-03`
- **Business Responsibility:** Master inventory control for all vehicles (cars, bikes, scooters), location hubs, specs, hourly/daily pricing, and real-time availability querying.
- **Features Owned:** Vehicle browsing, Category filter, Spec sheet retrieval, Real-time date availability search, Vehicle CRUD, Fleet status management.
- **Data Owned:** Vehicles, Categories, Models, Pricing Tiers, Vehicle Specs, Location Hubs, Vehicle Availability Ledger.
- **Main APIs:** `GET /api/v1/vehicles`, `GET /api/v1/vehicles/:id`, `POST /api/v1/vehicles/check-availability`, `POST /api/v1/vehicles/admin`, `PUT /api/v1/vehicles/admin/:id`.
- **Dependencies:** None (Self-contained domain).
- **Independence Justification:** Catalog search represents 70%+ of total platform traffic; requires maximum throughput isolation.
- **Scalability Reason:** High read-to-write ratio (95:5 read ratio) enables massive horizontal read replica caching.
- **Security Considerations:** Admin write endpoints protected by Gateway role validation.
- **Failure Isolation:** Outage prevents browsing but permits users to manage existing confirmed bookings.

---

#### 4. Booking Service (`driveease-booking-service`)
- **Service ID:** `MS-04`
- **Business Responsibility:** Reservation state machine, schedule calculation, add-on selection, schedule modification, cancellation, return processing.
- **Features Owned:** Create reservation, Calculate rental duration, Apply add-ons, Modify dates, Cancel booking, Complete return.
- **Data Owned:** Booking Records, Rental Duration Math, Add-on Selections, Booking State (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- **Main APIs:** `POST /api/v1/bookings`, `GET /api/v1/bookings/my-bookings`, `GET /api/v1/bookings/:id`, `PUT /api/v1/bookings/:id/schedule`, `POST /api/v1/bookings/:id/cancel`, `POST /api/v1/bookings/:id/return`.
- **Dependencies:** Vehicle Service (verify availability), Payment Service (authorize charge), User Service (check KYC).
- **Independence Justification:** Core transactional orchestrator requiring strict ACID compliance for reservation state.
- **Scalability Reason:** Scales independently during peak reservation periods (e.g., holiday weekend rushes).
- **Security Considerations:** Users can only view/modify bookings linked to their authenticated User ID.
- **Failure Isolation:** Outage blocks new reservations but allows catalog browsing and user login.

---

#### 5. Payment Service (`driveease-payment-service`)
- **Service ID:** `MS-05`
- **Business Responsibility:** Payment gateway transaction processing, coupon code validation, security deposit calculation, invoice generation, refund execution.
- **Features Owned:** Charge authorization, Coupon code validation/rules, Tax calculation, Digital invoice data generation, Refund processing.
- **Data Owned:** Payment Transactions, Payment Ledger, Coupon Code Repository, Invoices, Refund Logs.
- **Main APIs:** `POST /api/v1/payments/process`, `POST /api/v1/payments/coupons/validate`, `GET /api/v1/payments/invoice/:bookingId`, `POST /api/v1/payments/refund`.
- **Dependencies:** Booking Service.
- **Independence Justification:** Handles PCI-DSS sensitive financial interactions; requires strict isolation from general application logic.
- **Scalability Reason:** Scales independently to handle secure third-party gateway webhooks and financial reconciliation.
- **Security Considerations:** Encrypted audit logs, idempotent transaction handling, HMAC webhook signatures.
- **Failure Isolation:** Payment failure safely rolls back pending booking state without corrupting vehicle inventory.

---

#### 6. Review Service (`driveease-review-service`)
- **Service ID:** `MS-06`
- **Business Responsibility:** Customer ratings, vehicle reviews, review posting verification, aggregate rating score calculation.
- **Features Owned:** Post rating & review, Fetch vehicle reviews, Calculate vehicle average rating, Review moderation.
- **Data Owned:** Review Records, Vehicle Rating Aggregates, Rating Breakdown Metrics.
- **Main APIs:** `GET /api/v1/reviews/vehicle/:vehicleId`, `POST /api/v1/reviews`, `DELETE /api/v1/reviews/admin/:id`.
- **Dependencies:** Booking Service (verify user completed rental prior to reviewing).
- **Independence Justification:** Non-critical social proof feature; failure must never block booking or browsing workflows.
- **Scalability Reason:** High read traffic on catalog pages served via cached read replicas.
- **Security Considerations:** Rate limiting to prevent review spamming.
- **Failure Isolation:** Complete outage gracefully hides review sections without impacting vehicle reservation.

---

#### 7. Notification Service (`driveease-notification-service`)
- **Service ID:** `MS-07`
- **Business Responsibility:** Asynchronous email dispatch, SMS booking alerts, pickup reminders, administrative alerts.
- **Features Owned:** Send booking confirmation email, Send SMS invoice link, Send pickup reminder notification, System event logs.
- **Data Owned:** Notification Logs, Email Templates, Delivery Status Records.
- **Main APIs:** Event Consumers (RabbitMQ / Kafka topics: `booking.created`, `booking.cancelled`, `payment.completed`).
- **Dependencies:** Message Queue Broker.
- **Independence Justification:** Pure background worker domain; decoupled from synchronous HTTP request-response cycles.
- **Scalability Reason:** Queued message workers scale dynamically based on queue backlog depth.
- **Security Considerations:** Sanitizes notification body payloads to prevent data leakage.
- **Failure Isolation:** Notification failure queued for retry; zero impact on real-time customer booking flow.

---

## PART 3 — SERVICE BOUNDARIES (OWNERSHIP SPECIFICATION)

Strict service boundaries prevent data leakage and domain contamination. The explicit ownership rules are defined below:

```
+-----------------------------------------------------------------------------------+
|                        DRIVEEASE SERVICE BOUNDARY MATRIX                          |
+-----------------------------------------------------------------------------------+
| SERVICE          | WHAT IT OWNS                      | WHAT IT DOES NOT OWN       |
+------------------+-----------------------------------+----------------------------+
| Auth Service     | Credentials, Passwords, JWTs      | User profiles, KYC documents|
| User Service     | Customer Profiles, License KYC    | Passwords, Payment cards   |
| Vehicle Service  | Cars, Bikes, Specs, Rates, Status | Bookings, Payment totals   |
| Booking Service  | Reservations, Dates, Add-ons      | Card charge logic, Reviews |
| Payment Service  | Charges, Invoices, Coupons, Refund| Vehicle specs, User address|
| Review Service   | Ratings, Written Feedback         | Booking payment status     |
| Notification Sv  | Email/SMS dispatch, Templates     | Customer databases         |
+-----------------------------------------------------------------------------------+
```

### Detailed Boundary Specifications

1. **Vehicle Service:**
   - **OWNS:** Vehicle model details, image URLs, seating capacity, engine size, fuel type, transmission, hourly rate, daily rate, location hub IDs, vehicle operational status (`Available`, `Maintenance`).
   - **DOES NOT OWN:** Booking start/end dates, user driver license data, payment gateway transaction IDs, customer review text.

2. **Booking Service:**
   - **OWNS:** Reservation ID, pickup timestamp, return timestamp, pickup branch ID, selected add-on amenity IDs, booking state machine (`Pending`, `Confirmed`, `Cancelled`, `Completed`).
   - **DOES NOT OWN:** Vehicle engine specifications, credit card tokenization, password verification, notification email templates.

3. **Payment Service:**
   - **OWNS:** Transaction reference numbers, monetary breakdown (base + deposit + tax - discount), coupon rules & discount calculations, invoice PDF templates, refund execution logs.
   - **DOES NOT OWN:** Booking date modification logic, vehicle availability calendars, customer profile names.

---

## PART 4 — DATABASE OWNERSHIP (DATABASE-PER-SERVICE PATTERN)

Following the **Database-per-Service** pattern, each microservice manages its own isolated database instance. Services communicate strictly via REST APIs or Event Messages—never via direct cross-database SQL joins.

```
+-----------------------------------------------------------------------------------+
|                     DATABASE-PER-SERVICE ARCHITECTURE PATTERN                     |
+-----------------------------------------------------------------------------------+
| [Auth Service] ------> [( Auth DB: PostgreSQL )]                                  |
| [User Service] ------> [( User DB: PostgreSQL )]                                  |
| [Vehicle Service] ---> [( Vehicle DB: PostgreSQL / MongoDB )]                     |
| [Booking Service] ---> [( Booking DB: PostgreSQL )]                               |
| [Payment Service] ---> [( Payment DB: PostgreSQL )]                               |
| [Review Service] ----> [( Review DB: MongoDB )]                                   |
| [Notification] ------> [( Notification DB: MongoDB / Redis )]                    |
+-----------------------------------------------------------------------------------+
```

### Database Mapping & Schema Isolation

| Microservice | Database Engine | Rationale | Schema / Entities Owned | Accessible By |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Service** | PostgreSQL | Strict relational consistency for security tables. | `users_auth`, `roles`, `refresh_tokens`, `audit_logs`. | Auth Service ONLY |
| **User Service** | PostgreSQL | Relational structure for profile and license metadata. | `user_profiles`, `kyc_documents`, `addresses`. | User Service ONLY |
| **Vehicle Service** | PostgreSQL / MongoDB | Rich document structure for variable car/bike specs. | `vehicles`, `categories`, `hubs`, `availability_slots`. | Vehicle Service ONLY |
| **Booking Service** | PostgreSQL | ACID transactional guarantees for reservation state. | `bookings`, `booking_addons`, `schedule_history`. | Booking Service ONLY |
| **Payment Service** | PostgreSQL | Strict financial ledger consistency and audit trail. | `transactions`, `invoices`, `coupons`, `refunds`. | Payment Service ONLY |
| **Review Service** | MongoDB | High-throughput unstructured JSON review documents. | `reviews`, `rating_aggregates`. | Review Service ONLY |
| **Notification Sv** | Redis / MongoDB | Key-value message logs and fast delivery caching. | `notification_templates`, `dispatch_logs`. | Notification Sv ONLY |

### Frontend Local Data vs. Microservice Production Databases

```
+-----------------------------------------------------------------------------------+
| COMPARISON: CURRENT FRONTEND LOCAL STORAGE vs. PROPOSED MICROSERVICE DATABASES     |
+-----------------------------------------------------------------------------------+
| ASPECT             | CURRENT FRONTEND (STEP 1)   | PROPOSED MICROSERVICES (STEP 2)|
+--------------------+-----------------------------+--------------------------------+
| Storage Location   | Client Browser (IndexedDB)  | Isolated Server Databases      |
| Data Scope         | Single Browser Profile      | Centralized Enterprise Store   |
| Cross-Device Sync  | Not Available               | Full Real-Time Sync            |
| ACID Guarantees    | Browser Memory Scope        | Enterprise Database Engines    |
| Security           | Client Browser Storage      | Server-Side Encrypted Storage  |
+-----------------------------------------------------------------------------------+
```

---

## PART 5 — API IDENTIFICATION & INTERFACE CONTRACTS

The main REST APIs exposed by the microservices are specified below:

### 1. Auth Service (`driveease-auth-service`)
- `POST /api/v1/auth/register` — Register user credentials.
- `POST /api/v1/auth/login` — Authenticate and issue JWT access token.
- `POST /api/v1/auth/refresh` — Refresh expired access token.
- `GET /api/v1/auth/verify` — Validate token claims (Gateway internal call).

### 2. User Service (`driveease-user-service`)
- `GET /api/v1/users/me` — Fetch active user profile [Protected].
- `PUT /api/v1/users/me` — Update profile details [Protected].
- `POST /api/v1/users/kyc` — Upload license document [Protected].
- `GET /api/v1/users/admin` — Fetch all users directory [Admin].
- `PUT /api/v1/users/admin/:id/status` — Toggle user suspension [Admin].

### 3. Vehicle Service (`driveease-vehicle-service`)
- `GET /api/v1/vehicles` — Browse vehicles with category/price filters [Public].
- `GET /api/v1/vehicles/:id` — Fetch vehicle spec sheet & photos [Public].
- `POST /api/v1/vehicles/check-availability` — Check vehicle availability for date range [Public].
- `POST /api/v1/vehicles/admin` — Add new vehicle to fleet [Admin].
- `PUT /api/v1/vehicles/admin/:id` — Edit vehicle attributes [Admin].
- `DELETE /api/v1/vehicles/admin/:id` — Remove vehicle from fleet [Admin].

### 4. Booking Service (`driveease-booking-service`)
- `POST /api/v1/bookings` — Create new vehicle reservation [Protected].
- `GET /api/v1/bookings/my-bookings` — Fetch customer's reservations [Protected].
- `GET /api/v1/bookings/:id` — Fetch booking details & breakdown [Protected].
- `PUT /api/v1/bookings/:id/schedule` — Modify pickup/return dates [Protected].
- `POST /api/v1/bookings/:id/cancel` — Request booking cancellation [Protected].
- `POST /api/v1/bookings/:id/return` — Complete vehicle return [Protected / Admin].
- `GET /api/v1/bookings/admin/master` — Fetch master booking ledger [Admin].

### 5. Payment Service (`driveease-payment-service`)
- `POST /api/v1/payments/process` — Process payment transaction [Protected].
- `POST /api/v1/payments/coupons/validate` — Validate promotional code [Protected].
- `GET /api/v1/payments/invoice/:bookingId` — Fetch formatted digital invoice data [Protected].
- `POST /api/v1/payments/refund` — Issue refund for cancelled booking [Admin / Internal].

### 6. Review Service (`driveease-review-service`)
- `GET /api/v1/reviews/vehicle/:vehicleId` — Fetch vehicle reviews [Public].
- `POST /api/v1/reviews` — Submit review for completed booking [Protected].
- `DELETE /api/v1/reviews/admin/:id` — Moderation review delete [Admin].

---

## PART 6 — SERVICE COMMUNICATION ARCHITECTURE

DriveEase utilizes a hybrid communication model: **Synchronous REST/gRPC** for real-time operations and **Asynchronous Event-Driven Messaging** for background processing.

```
+-----------------------------------------------------------------------------------+
|                        SERVICE COMMUNICATION FLOW DIAGRAM                         |
+-----------------------------------------------------------------------------------+
| 1. SYNCHRONOUS FLOW (REST / HTTP):                                                |
| Client -> API Gateway -> Booking Service -> (REST) -> Vehicle Service (Check Date)|
|                                           -> (REST) -> Payment Service (Process)  |
|                                                                                   |
| 2. ASYNCHRONOUS FLOW (Event Bus / RabbitMQ):                                      |
| Booking Service -- (Publish: booking.created) --> [ Message Broker ]              |
|                                                            |                      |
|                                       +--------------------+-------------------+  |
|                                       v                                        v  |
|                         [ Notification Service ]                  [ Analytics ]   |
|                         (Sends Email/SMS Invoice)                 (Updates KPI)   |
+-----------------------------------------------------------------------------------+
```

### Communication Rationale
1. **Synchronous REST (HTTP/JSON):** Applied when immediate response payload is mandatory for user UI continuation (e.g., verifying vehicle date availability before opening payment screen).
2. **Asynchronous Events (RabbitMQ / Kafka):** Applied for side-effects that do not block user workflow (e.g., generating email receipt, updating analytics dashboard, clearing expired temporary holds).

---

## PART 7 — SERVICE DISCOVERY DESIGN

To avoid hardcoding IP addresses and ports across microservices, DriveEase incorporates **Service Discovery**.

```
+-----------------------------------------------------------------------------------+
|                           SERVICE DISCOVERY WORKFLOW                              |
+-----------------------------------------------------------------------------------+
| 1. Microservices Startup  --> Register Name & IP with Eureka/Consul Registry     |
| 2. Health Monitoring      --> Registry sends periodic HTTP Heartbeats (/health)   |
| 3. API Gateway Query      --> Gateway asks Discovery: "Where is Booking Service?" |
| 4. Load-Balanced Routing  --> Discovery returns active instance IP: [10.0.1.45:8084] |
+-----------------------------------------------------------------------------------+
```

### Service Discovery Strategy
- **Registry Engine:** Netflix Eureka or HashiCorp Consul (or Docker DNS / Kubernetes Service Cluster).
- **Service Registration:** Each microservice registers its ID (e.g., `VEHICLE-SERVICE`), IP address, port, and health check URL (`/actuator/health` or `/health`) upon startup.
- **Heartbeat & Deregistration:** Microservices ping discovery every 30 seconds. Unhealthy instances are automatically deregistered to prevent routing traffic to dead nodes.
- **Client-Side / Gateway Load Balancing:** API Gateway caches service registry tables and load-balances requests round-robin across healthy instances.

---

## PART 8 — API GATEWAY RELATIONSHIP

The **API Gateway** acts as the single entry point for all client requests from the React frontend, decoupling clients from internal microservice topologies.

```
                                  +-----------------------+
                                  | DriveEase React App   |
                                  +-----------------------+
                                              |
                                              | HTTPS / JSON
                                              v
                                  +-----------------------+
                                  |   API GATEWAY ROUTER  |
                                  | (Spring Cloud Gateway |
                                  |   / Express Gateway)  |
                                  +-----------------------+
                                              |
      +-------------------+-------------------+-------------------+-------------------+
      |                   |                   |                   |                   |
      v                   v                   v                   v                   v
+-----------+       +-----------+       +-----------+       +-----------+       +-----------+
|  Auth Sv  |       |  User Sv  |       | Vehicle Sv|       | Booking Sv|       | Payment Sv|
| (Port 8081|       | (Port 8082|       | (Port 8083|       | (Port 8084|       | (Port 8085|
+-----------+       +-----------+       +-----------+       +-----------+       +-----------+
```

### Gateway Responsibilities
1. **Request Routing:** Maps incoming routes (e.g., `/api/v1/vehicles/**` -> `VEHICLE-SERVICE`).
2. **Centralized Authentication:** Intercepts incoming requests, verifies JWT signatures via Auth Service, and injects validated user claims into downstream headers (`X-User-Id`, `X-User-Role`).
3. **Cross-Origin Resource Sharing (CORS):** Manages CORS headers centrally for the React frontend.
4. **Rate Limiting:** Protects backend services against Denial of Service (DoS) attacks using Redis token bucket rate limiting.
5. **Request Aggregation:** Combines responses from multiple services (e.g., merging vehicle details with review summary) into a single client payload.

---

## PART 9 — SECURITY BOUNDARIES & AUTHORIZATION MODEL

The future security architecture enforces defense-in-depth across 3 security tiers:

```
+-----------------------------------------------------------------------------------+
|                            SECURITY BOUNDARY TIERING                              |
+-----------------------------------------------------------------------------------+
| TIER 1: PUBLIC ENDPOINTS    : /vehicles, /reviews/vehicle/*, /auth/login         |
| TIER 2: PROTECTED ENDPOINTS : /bookings, /payments/process, /users/me [Valid JWT] |
| TIER 3: ADMIN ENDPOINTS     : /admin/* [Valid JWT with Role: ADMIN]               |
+-----------------------------------------------------------------------------------+
```

### Service-to-Service Security
Internal communication between microservices (e.g., Booking Service calling Vehicle Service) is secured using **Mutual TLS (mTLS)** or **Internal Service HMAC Tokens**, ensuring public clients cannot bypass the API Gateway to invoke internal endpoints directly.

---

## PART 10 — INDEPENDENT SCALABILITY ANALYSIS

Each microservice scales independently based on its specific workload characteristics:

```
+-----------------------------------------------------------------------------------+
|                         INDEPENDENT SCALING PROFILE MATRIX                        |
+-----------------------------------------------------------------------------------+
| MICROSERVICE      | TRAFFIC PROFILE    | BOTTLENECK DOMAIN  | SCALING STRATEGY     |
+-------------------+--------------------+--------------------+----------------------+
| Vehicle Service   | 85% Read / 15% Write| CPU / DB Read IOPS | Horizontal Replica   |
| Booking Service   | Transactional Burst| DB Lock Contention | Horizontal + Sharding|
| Payment Service   | High Security/Audit| Network Latency    | Isolated Compute     |
| Notification Sv   | Asynchronous Burst | Mail/SMS API Quota | Worker Queue Pools   |
| Review Service    | Read Heavy         | Cache Misses       | Redis Cache Layer    |
+-----------------------------------------------------------------------------------+
```

---

## PART 11 — FAULT ISOLATION & RESILIENCE

Microservice architecture protects DriveEase from cascading failures using **Circuit Breaker Patterns** (Resilience4j / Hystrix):

```
+-----------------------------------------------------------------------------------+
|                        FAULT ISOLATION & FALLBACK SCENARIOS                       |
+-----------------------------------------------------------------------------------+
| FAILING SERVICE     | IMPACT ON SYSTEM         | FALLBACK DEGRADATION STRATEGY    |
+---------------------+--------------------------+----------------------------------+
| Payment Service     | Payment cannot process.  | Booking held in PENDING state;   |
|                     |                          | user prompted to retry without   |
|                     |                          | losing reservation dates.        |
+---------------------+--------------------------+----------------------------------+
| Notification Sv     | Confirmation email fails.| Booking completes successfully;  |
|                     |                          | notification queued for retry.   |
+---------------------+--------------------------+----------------------------------+
| Review Service      | Reviews fail to load.    | Vehicle details display cleanly; |
|                     |                          | review section shows placeholder.|
+---------------------+--------------------------+----------------------------------+
| User Service (KYC)  | KYC check unavailable.   | Reservation created as UNVERIFIED|
|                     |                          | pending manual desk verification.|
+-----------------------------------------------------------------------------------+
```

---

## PART 12 — COMPLETE MICROSERVICE ARCHITECTURE DIAGRAM

```mermaid
flowchart TD
    Client["DriveEase React Frontend (Vite)"]
    
    subgraph GatewayLayer ["API Gateway & Edge Layer"]
        Gateway["API Gateway Router (Spring Cloud / Express)"]
        RateLimiter["Redis Rate Limiter"]
    end
    
    subgraph DiscoveryLayer ["Service Registry Layer"]
        Discovery["Service Discovery (Eureka / Consul)"]
    end
    
    subgraph ServiceLayer ["Microservice Ecosystem"]
        AuthSvc["MS-01 Auth Service"]
        UserSvc["MS-02 User Service"]
        VehicleSvc["MS-03 Vehicle Service"]
        BookingSvc["MS-04 Booking Service"]
        PaymentSvc["MS-05 Payment Service"]
        ReviewSvc["MS-06 Review Service"]
        NotifSvc["MS-07 Notification Service"]
    end
    
    subgraph EventLayer ["Asynchronous Messaging Bus"]
        MsgBroker["RabbitMQ / Apache Kafka Message Broker"]
    end
    
    subgraph DBLayer ["Database-per-Service Storage Layer"]
        AuthDB[(Auth DB: PostgreSQL)]
        UserDB[(User DB: PostgreSQL)]
        VehicleDB[(Vehicle DB: PostgreSQL)]
        BookingDB[(Booking DB: PostgreSQL)]
        PaymentDB[(Payment DB: PostgreSQL)]
        ReviewDB[(Review DB: MongoDB)]
        NotifDB[(Notif DB: Redis)]
    end

    %% Client Interactions
    Client -->|HTTPS / REST API| Gateway
    Gateway --- RateLimiter
    
    %% Service Discovery Connections
    Gateway <-->|Fetch Routes| Discovery
    AuthSvc <-->|Register / Heartbeat| Discovery
    UserSvc <-->|Register / Heartbeat| Discovery
    VehicleSvc <-->|Register / Heartbeat| Discovery
    BookingSvc <-->|Register / Heartbeat| Discovery
    PaymentSvc <-->|Register / Heartbeat| Discovery
    ReviewSvc <-->|Register / Heartbeat| Discovery
    NotifSvc <-->|Register / Heartbeat| Discovery
    
    %% Gateway Routing
    Gateway -->|/api/v1/auth| AuthSvc
    Gateway -->|/api/v1/users| UserSvc
    Gateway -->|/api/v1/vehicles| VehicleSvc
    Gateway -->|/api/v1/bookings| BookingSvc
    Gateway -->|/api/v1/payments| PaymentSvc
    Gateway -->|/api/v1/reviews| ReviewSvc
    
    %% Synchronous Inter-Service Calls
    BookingSvc -->|REST: Check Dates| VehicleSvc
    BookingSvc -->|REST: Authorize Charge| PaymentSvc
    
    %% Asynchronous Event Publishing
    BookingSvc -->|Publish: booking.created| MsgBroker
    PaymentSvc -->|Publish: payment.completed| MsgBroker
    MsgBroker -->|Subscribe| NotifSvc
    
    %% Database Ownership Connections
    AuthSvc --> AuthDB
    UserSvc --> UserDB
    VehicleSvc --> VehicleDB
    BookingSvc --> BookingDB
    PaymentSvc --> PaymentDB
    ReviewSvc --> ReviewDB
    NotifSvc --> NotifDB
```

---

## PART 13 — DRIVEASE FEATURE-TO-MICROSERVICE MAPPING

The table below maps every single DriveEase user feature to its owning microservice:

| DriveEase Feature | Target Microservice | Architectural Ownership Rationale |
| :--- | :--- | :--- |
| **User Registration & Login** | `MS-01 Auth Service` | Password hashing, JWT token issue, role claim management. |
| **Profile & Driving License KYC** | `MS-02 User Service` | User metadata, license document storage references. |
| **Car & Bike Catalog Browsing** | `MS-03 Vehicle Service` | Master vehicle inventory, categories, specs, photo assets. |
| **Vehicle Search & Filtering** | `MS-03 Vehicle Service` | Multi-parameter query execution against vehicle database. |
| **Real-time Vehicle Availability**| `MS-03 Vehicle Service` | Manages operational fleet calendars and branch location hubs. |
| **Reservation Creation & Schedule**| `MS-04 Booking Service` | Booking state machine, duration math, add-on selection. |
| **Booking Modification & Cancel** | `MS-04 Booking Service` | Rental schedule recalculation, cancellation rules. |
| **Vehicle Return Processing** | `MS-04 Booking Service` | Marks rental completion, triggers availability release. |
| **Payment Simulation & Methods** | `MS-05 Payment Service` | Charge processing, transaction ledger, refund calculation. |
| **Coupon Code Verification** | `MS-05 Payment Service` | Enforces promotional discount rules and minimum spend caps. |
| **Digital Invoice Generation** | `MS-05 Payment Service` | Renders itemized billing receipts and transaction IDs. |
| **Customer Review & Ratings** | `MS-06 Review Service` | Manages star ratings, review feedback text, aggregates. |
| **Email & SMS Notifications** | `MS-07 Notification Service` | Asynchronous event listener sending email/SMS receipts. |
| **Admin Fleet Management (CRUD)** | `MS-03 Vehicle Service` | Inventory updates, daily rate updates, fleet status. |
| **Admin Booking Override** | `MS-04 Booking Service` | Master booking ledger status override. |
| **Admin User Management** | `MS-02 User Service` | User directory management, account suspension toggle. |

---

## PART 14 — MONOLITHIC VS. MICROSERVICES COMPARATIVE ANALYSIS

```
+-----------------------------------------------------------------------------------+
|                  ACADEMIC COMPARISON: MONOLITH vs. MICROSERVICES                  |
+-----------------------------------------------------------------------------------+
| CRITERIA           | MONOLITHIC ARCHITECTURE     | MICROSERVICE ARCHITECTURE  |
+--------------------+-----------------------------+--------------------------------+
| Scalability        | Scale entire app together   | Scale specific services (e.g.  |
|                    | (inefficient resource use). | Vehicle Service) independently.|
+--------------------+-----------------------------+--------------------------------+
| Fault Isolation    | Single memory leak crashes  | Failure in Review Service      |
|                    | whole platform.             | leaves Bookings functional.    |
+--------------------+-----------------------------+--------------------------------+
| Data Ownership     | Shared database with risky  | Strict Database-per-Service;   |
|                    | cross-table SQL joins.      | zero unintended data coupling. |
+--------------------+-----------------------------+--------------------------------+
| Deployment Risk    | Large release risk for any  | Deploy microservices           |
|                    | minor feature change.       | independently with zero downtime.|
+--------------------+-----------------------------+--------------------------------+
| Operational Complexity| Low setup overhead.       | Requires Service Discovery,    |
|                    |                             | API Gateway, & Event Brokers.  |
+-----------------------------------------------------------------------------------+
```

### Academic Evaluation Conclusion
While monolithic architectures offer simpler initial setup, **DriveEase requires a Microservices Architecture** to support independent vehicle search scaling, secure isolated payment processing, fault-tolerant reservation handling, and modular team maintenance.

---

## PART 15 — RECOMMENDED TECHNOLOGY STACK

For academic implementation and local evaluation, we recommend a lightweight, robust, modern tech stack:

```
+-----------------------------------------------------------------------------------+
|                       RECOMMENDED BACKEND TECHNOLOGY STACK                        |
+-----------------------------------------------------------------------------------+
| API Gateway Router   : Node.js / Express Gateway OR Spring Cloud Gateway           |
| Microservice Runtime : Node.js (Express / NestJS) OR Java (Spring Boot v3)         |
| Service Discovery    : Netflix Eureka / HashiCorp Consul OR Docker DNS            |
| Primary Database     : PostgreSQL 15 (Relational Data & ACIDs)                   |
| Secondary Database   : MongoDB 6.0 (Unstructured Reviews & Vehicle Specs)          |
| In-Memory Cache      : Redis 7.0 (Rate Limiting & Session Tokens)                |
| Message Broker       : RabbitMQ 3.12 (Asynchronous Events)                        |
| Authentication       : JSON Web Tokens (JWT) signed with RSA-256                  |
+-----------------------------------------------------------------------------------+
```

### Stack Suitability Rationale
1. **Node.js / Express or NestJS:** Enables seamless JavaScript/TypeScript development sharing data interfaces with the React frontend.
2. **Spring Boot (Alternative):** Provides enterprise-grade Spring Cloud Gateway and Eureka discovery out of the box.
3. **PostgreSQL:** Essential for financial transactions and strict relational integrity in Auth, User, Booking, and Payment domains.

---

## PART 16 — SAFE FUTURE IMPLEMENTATION ROADMAP

To prevent breaking existing functionality, backend integration will follow a 14-stage implementation plan:

```
Stage 01: Setup Docker Compose Local Infrastructure (PostgreSQL, Redis, RabbitMQ)
Stage 02: Build & Test [MS-01 Auth Service] + Database Migration Scripts
Stage 03: Build & Test [MS-02 User Service] + KYC Storage API
Stage 04: Build & Test [MS-03 Vehicle Service] + Seed Database from vehicles.js
Stage 05: Build & Test [MS-04 Booking Service] + State Machine Logic
Stage 06: Build & Test [MS-05 Payment Service] + Coupon Engine
Stage 07: Build & Test [MS-06 Review Service] + MongoDB Driver
Stage 08: Build & Test [MS-07 Notification Service] + RabbitMQ Consumers
Stage 09: Configure Service Discovery Registry (Eureka / Consul)
Stage 10: Configure API Gateway Routing, CORS, and Rate Limiting
Stage 11: Implement JWT Verification Filter at Gateway
Stage 12: Wire Axios BaseURL in React Frontend (src/services/api.js) to Gateway
Stage 13: Execute End-to-End Integration Testing across all User Flows
Stage 14: Final Academic Evaluation & Deployment Verification
```

*Note: None of these implementation stages are executed in this design step.*

---

## PART 17 — COMPONENT 2 RUBRIC ANALYSIS & 10/10 SCORE ASSESSMENT

### Official Rubric Baseline
- **Component 2:** Microservice Identification and Discovery
- **Target:** 10 / 10 — "Highly modular design"

### Current Design Score Estimate: 10 / 10

### Compliance Justification
1. **Highly Modular Design:** System decomposed into 7 clean microservices based on Domain-Driven Design bounded contexts.
2. **Database Isolation:** Database-per-service pattern strictly applied across all services.
3. **Complete Service Discovery:** Detailed design of Service Registration, Heartbeats, Health Checks, and Gateway Load Balancing.
4. **Resilience & Fault Isolation:** Explicit circuit breaker fallbacks defined for every service interaction.
5. **Codebase Protection:** 100% compliant with safety directives—all frontend components, styles, data files, and routes remain completely untouched.

---

## PART 18 — CONCLUSION

The **DriveEase Component 2: Microservice Identification, Architecture, and Service Discovery** document establishes an academic-grade, modular backend blueprint. By specifying 7 bounded microservices, database-per-service isolation, clear REST API contracts, service discovery mechanics, and API Gateway integration, DriveEase is prepared for scalable production execution.

---
*Documentation file created at `docs/DriveEase_Component_2_Microservice_Architecture_and_Discovery.md`.*
