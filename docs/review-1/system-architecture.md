# VAYRO — System Architecture & Design

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — System Architecture  
**Architecture Style:** Distributed Microservices with Centralized Service Discovery & API Gateway  
**Date:** September 2026  
**Document Version:** 1.1.0  

---

## 1. High-Level Architectural Overview

VAYRO is architected as a distributed, cloud-native microservices ecosystem designed to support high-throughput vehicle discovery, atomic reservation management, stateless security, and decoupled notification pipelines. 

```
                                      +---------------------------------------------+
                                      |                CLIENT LAYER                 |
                                      |   React 19 + Vite + Tailwind CSS SPA        |
                                      |       (Hosted on Vercel Edge CDN)           |
                                      +----------------------+----------------------+
                                                             |
                                                       HTTPS / JSON
                                                             |
                                      +----------------------v----------------------+
                                      |             PERIMETER GATEWAY               |
                                      |     Spring Cloud API Gateway (Port 8080)     |
                                      |  - Reactive Netty Engine                     |
                                      |  - JWT Authentication & RBAC Verification    |
                                      |  - CORS Filter & Route Reverse Proxy         |
                                      +----------------------+----------------------+
                                                             |
                                            +----------------+----------------+
                                            |                                 |
                                 Service Registration                 Dynamic Routing
                                 & Heartbeat / Eureka                 Load Balancing
                                            |                                 |
+-------------------------------------------v------+          +---------------v----------------------------+
|             SERVICE DISCOVERY REGISTRY           |          |               MICROSERVICE LAYER           |
|        Netflix Eureka Server (Port 8761)         |          |                                            |
|   - Dynamic IP & Port Service Mapping            |          |  +--------------------------------------+  |
|   - Health Heartbeats & De-registration          |          |  | USER-SERVICE (Port 8081)             |  |
+--------------------------------------------------+          |  | - Auth (JWT, BCrypt, Google OAuth)   |  |
                                                              |  | - User Management & RBAC             |  |
                                                              |  +--------------------------------------+  |
                                                              |                                            |
                                                              |  +--------------------------------------+  |
                                                              |  | VEHICLE-SERVICE (Port 8082)          |  |
                                                              |  | - Fleet Catalog & Category Filter    |  |
                                                              |  | - Vehicle Specs & Status Tracking    |  |
                                                              |  +--------------------------------------+  |
                                                              |                                            |
                                                              |  +--------------------------------------+  |
                                                              |  | BOOKING-SERVICE (Port 8083)          |  |
                                                              |  | - Concurrency & Overlap Engine       |  |
                                                              |  | - Financial Calculations (BigDecimal)|  |
                                                              |  | - Lifecycle State Machine            |  |
                                                              |  +-------------------+------------------+  |
                                                              |                      | (Inter-Service REST)|
                                                              |                      v                     |
                                                              |  +--------------------------------------+  |
                                                              |  | NOTIFICATION-SERVICE (Port 8084)     |  |
                                                              |  | - Vector PDF Invoices (OpenPDF)      |  |
                                                              |  | - Asynchronous SMTP Email Dispatch   |  |
                                                              |  +--------------------------------------+  |
                                                              +--------------------------------------------+
                                                                             |
                                                                             v
                                                              +------------------------------+
                                                              |       PERSISTENCE LAYER      |
                                                              |   PostgreSQL / Supabase      |
                                                              | - Cloud Relational DB        |
                                                              | - HikariCP Connection Pools  |
                                                              | - Isolated Entity Schemas    |
                                                              +------------------------------+
```

---

## 2. Microservice Decomposition

Each microservice encapsulates a bounded business context with strict domain separation:

```
+---------------------------------------------------------------------------------------------------------+
|                                    VAYRO MICROSERVICE SPECIFICATIONS                                    |
+----------------------+------+----------------------------------+----------------------------------------+
| Microservice Name    | Port | Core Domain Responsibility       | Primary Tech / Frameworks              |
+----------------------+------+----------------------------------+----------------------------------------+
| EUREKA-SERVER        | 8761 | Dynamic Service Registry         | Spring Cloud Netflix Eureka Server     |
| API-GATEWAY          | 8080 | Single Entry Point, JWT, CORS    | Spring Cloud Gateway, Reactive Flux    |
| USER-SERVICE         | 8081 | Auth, RBAC, Users, Google OAuth  | Spring Boot, Spring Security, BCrypt   |
| VEHICLE-SERVICE      | 8082 | Fleet Inventory, Specs, Status   | Spring Boot, Spring Data JPA, Postgres |
| BOOKING-SERVICE      | 8083 | Reservations, Availability, Math | Spring Boot, @LoadBalanced RestClient  |
| NOTIFICATION-SERVICE | 8084 | Invoices (PDF), Email Dispatch   | Spring Boot, OpenPDF, JavaMailSender   |
+----------------------+------+----------------------------------+----------------------------------------+
```

---

## 3. Inter-Service Communication Workflows

### 3.1 Synchronous Communication (`Booking Service` $\to$ `Vehicle Service`)
- **Protocol:** HTTP/1.1 REST with `@LoadBalanced RestClient.Builder`.
- **Discovery Mechanism:** Resolves service location dynamically via Eureka using `http://VEHICLE-SERVICE`.
- **Use Cases:**
  1. Fetching vehicle daily rate and operational status during reservation creation (`GET /api/vehicles/{id}`).
  2. Synchronizing vehicle status to `RENTED` upon booking activation (`PATCH /api/vehicles/{id}/status`).
  3. Synchronizing vehicle status back to `AVAILABLE` upon vehicle return (`PATCH /api/vehicles/{id}/status`).
- **Security Propagation:** Forwarding incoming `Authorization: Bearer <token>` header across internal service calls.

### 3.2 Asynchronous & Decoupled Communication (`Booking Service` $\to$ `Notification Service`)
- **Protocol:** Asynchronous non-blocking HTTP REST / `CompletableFuture`.
- **Fault Isolation Principle:** If the `notification-service` is unreachable or SMTP encounters transport delays, the booking transaction remains fully committed in PostgreSQL and returns HTTP 201 to the user.
- **Payload:** Dispatches serialized booking entity containing reference, vehicle, customer email, dates, and itemized monetary values.

---

## 4. Data Architecture & Database Schema

VAYRO utilizes cloud-hosted PostgreSQL (Supabase) with isolated entity tables for each bounded context:

```
+--------------------+            +--------------------+            +--------------------+
|       USERS        |            |      VEHICLES      |            |      BOOKINGS      |
+--------------------+            +--------------------+            +--------------------+
| id (PK, Long)      |            | id (PK, String)    |            | id (PK, Long)      |
| email (Unique)     |            | name (String)      |            | booking_reference  |
| password (BCrypt)  |            | category (Enum)    |            | vehicle_id (String)|
| first_name         |            | brand (String)     |            | user_id (String)   |
| last_name          |            | price_per_day (Num)|            | customer_email     |
| phone              |            | fuel_type (Enum)   |            | pickup_date_time   |
| role (USER/ADMIN)  |            | transmission (Enum)|            | return_date_time   |
| google_subject_id  |            | seating_capacity   |            | base_amount        |
| enabled (Boolean)  |            | status (Enum)      |            | tax_amount         |
| created_at         |            | primary_image_url  |            | total_amount       |
+--------------------+            +--------------------+            | status (Enum)      |
                                                                    | payment_status     |
                                                                    +---------+----------+
                                                                              |
                                                                              v
                                                                    +--------------------+
                                                                    |   NOTIFICATIONS    |
                                                                    +--------------------+
                                                                    | id (PK, Long)      |
                                                                    | booking_reference  |
                                                                    | recipient_email    |
                                                                    | type (CONFIRMATION)|
                                                                    | status (SENT/FAIL) |
                                                                    | invoice_pdf (bytea)|
                                                                    | sent_at            |
                                                                    +--------------------+
```

---

## 5. Cloud Deployment Topology

```
+------------------------------------------------------------------------------------+
|                               CLOUD TOPOLOGY                                       |
+------------------------------------------------------------------------------------+
| 1. Frontend Edge:                                                                  |
|    - Vercel Global Edge Network                                                    |
|    - React 19 SPA with instant asset caching, SSL, and rewrite rules               |
|                                                                                    |
| 2. Backend Compute (Microservices):                                                |
|    - Render Cloud Containers (Java 21 OpenJDK runtime)                             |
|    - Dynamic $PORT binding and environment secret injection                        |
|                                                                                    |
| 3. Cloud Relational Database:                                                      |
|    - Supabase (PostgreSQL 15+ AWS AP-Southeast-1)                                  |
|    - PgBouncer connection pooler on port 5432 / 6543 with SSL enforcement          |
+------------------------------------------------------------------------------------+
```

---

## 6. Fault Tolerance, Concurrency & Resilience

1. **Striped JVM Lock Concurrency Control:**
   Booking creation requests for identical vehicles are synchronized on a hashed mutex stripe (`lockStripes[hash(vehicleId)]`). This prevents concurrent threads from executing overlapping reservations simultaneously.
2. **Database Overlap Enforceability:**
   SQL predicate:
   $$\text{pickup} < \text{existing.return} \quad \land \quad \text{return} > \text{existing.pickup}$$
   filters conflicting records in `PENDING`, `CONFIRMED`, and `ACTIVE` states.
3. **Idempotency Safeguard:**
   Incoming `paymentOrderId` tokens are indexed and checked prior to reservation insertion, neutralizing duplicate payment webhook re-submissions.
4. **Resilient Gateway Routing:**
   Gateway dynamically pulls healthy instances from Eureka, routing requests away from downed or restarting instances.
