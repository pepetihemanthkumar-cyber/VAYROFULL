# VAYRO — Microservice Identification & Service Discovery

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — Microservice Architecture & Service Discovery  
**Architecture:** 6 Autonomous Spring Cloud Microservices  
**Date:** September 2026  
**Document Version:** 1.0.0  

---

## 1. Microservice Ecosystem Overview

VAYRO decomposes the rental and fleet asset management ecosystem into six dedicated microservices. Each service maintains a well-defined domain model, autonomous database interaction, and isolated operational boundaries.

```
                                    +------------------------------+
                                    |    EUREKA SERVICE REGISTRY   |
                                    |     Port 8761 (Eureka)       |
                                    +--------------+---------------+
                                                   |
             +--------------------+----------------+--------------------+--------------------+
             |                    |                                     |                    |
      Heartbeat/Discovery  Heartbeat/Discovery                   Heartbeat/Discovery  Heartbeat/Discovery
             |                    |                                     |                    |
+------------v-----------+ +------v---------------+              +------v---------------+ +--v--------------------+
|      API GATEWAY       | |     USER SERVICE     |              |   VEHICLE SERVICE    | | NOTIFICATION SERVICE |
|       Port 8080        | |       Port 8081      |              |      Port 8082       | |       Port 8084        |
| - Reverse Proxy        | | - Registration/Login |              | - Fleet Catalog      | | - PDF Invoice Engine |
| - Perimeter JWT Auth   | | - BCrypt & Roles     |              | - Vehicle Specs      | | - SMTP Notification  |
| - CORS & Routing       | | - User Profiles      |              | - Status Tracking    | +----------^-----------+
+------------+-----------+ +----------------------+              +----------^-----------+            |
             |                                                              |                        |
             +-------------------------------------------------------+      | (Inter-Service REST)   | (Async REST)
                                                                     |      |                        |
                                                              +------v------+------------------------+--+
                                                              |               BOOKING SERVICE           |
                                                              |                  Port 8083              |
                                                              | - Concurrency & Date Overlap Check      |
                                                              | - Financial Engine & Precision Math     |
                                                              | - Rental Lifecycle State Machine        |
                                                              +-----------------------------------------+
```

---

## 2. Microservice Detailed Profiles

---

### 2.1 Eureka Server (`eureka-server`)

| Attribute | Specification |
| :--- | :--- |
| **Service Name** | `EUREKA-SERVER` |
| **Default Port** | `8761` |
| **Primary Responsibility**| Centralized Service Registry & Discovery server for the VAYRO microservice mesh. |
| **Discovery Mechanism** | Self-hosted Eureka Registry (`spring-cloud-starter-netflix-eureka-server`). |
| **Why Separated?** | Decouples physical network addresses (IP/Host/Port) from logical service communication. Enables zero-downtime scaling, containerized cloud hosting (Render), and dynamic instance discovery. |
| **Configuration** | `eureka.client.register-with-eureka: false`, `eureka.client.fetch-registry: false`. |

---

### 2.2 API Gateway (`api-gateway`)

| Attribute | Specification |
| :--- | :--- |
| **Service Name** | `API-GATEWAY` |
| **Default Port** | `8080` (Dynamic `${PORT:8080}`) |
| **Primary Responsibility**| Unified entry perimeter for all client requests; routes traffic, validates JWT tokens, enforces CORS policies, and protects backend microservices. |
| **Discovery Mechanism** | Registers with Eureka; resolves downstream services via logical names (`lb://USER-SERVICE`, `lb://VEHICLE-SERVICE`, `lb://BOOKING-SERVICE`, `lb://NOTIFICATION-SERVICE`). |
| **Key Endpoints Exposed** | Reverse proxies all `/api/**` routes; exposes `/actuator/health` and `/actuator/info`. |
| **Why Separated?** | Prevents direct public exposure of internal microservices, prevents CORS complexity across multiple services, and centralizes stateless perimeter security. |

---

### 2.3 User Service (`user-service`)

| Attribute | Specification |
| :--- | :--- |
| **Service Name** | `USER-SERVICE` |
| **Default Port** | `8081` (Dynamic `${PORT:8081}`) |
| **Primary Responsibility**| User authentication, BCrypt password hashing, JWT generation, Google OAuth2 token verification, and profile management. |
| **Discovery Mechanism** | Registers with Eureka (`USER-SERVICE`) and fetches registry periodically. |
| **Primary APIs** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/users/profile`, `PUT /api/users/profile`. |
| **Persistence** | PostgreSQL (`users` table). |
| **Why Separated?** | Isolates critical credential management and cryptographic token generation from business transactions, preventing auth bottlenecks from affecting fleet browsing. |

---

### 2.4 Vehicle Service (`vehicle-service`)

| Attribute | Specification |
| :--- | :--- |
| **Service Name** | `VEHICLE-SERVICE` |
| **Default Port** | `8082` (Dynamic `${PORT:8082}`) |
| **Primary Responsibility**| Fleet asset inventory management, vehicle specification categorization, and real-time operational status management (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `INACTIVE`). |
| **Discovery Mechanism** | Registers with Eureka (`VEHICLE-SERVICE`). |
| **Primary APIs** | `GET /api/vehicles`, `GET /api/vehicles/{id}`, `POST /api/vehicles` (Admin), `PUT /api/vehicles/{id}` (Admin), `PATCH /api/vehicles/{id}/status`, `DELETE /api/vehicles/{id}` (Admin). |
| **Persistence** | PostgreSQL (`vehicles` table). |
| **Why Separated?** | Fleet catalog reads have high read-to-write ratios and caching potential. Separating it allows high-concurrency browsing without locking reservation tables. |

---

### 2.5 Booking Service (`booking-service`)

| Attribute | Specification |
| :--- | :--- |
| **Service Name** | `BOOKING-SERVICE` |
| **Default Port** | `8083` (Dynamic `${PORT:8083}`) |
| **Primary Responsibility**| Vehicle availability checking, double-booking prevention, financial pricing math (`BigDecimal`), reservation state transitions, and coordination between Vehicle and Notification services. |
| **Discovery Mechanism** | Registers with Eureka (`BOOKING-SERVICE`); discovers `VEHICLE-SERVICE` and `NOTIFICATION-SERVICE` via Eureka load balancing. |
| **Primary APIs** | `POST /api/bookings`, `GET /api/bookings/my`, `GET /api/bookings/availability`, `GET /api/bookings/{id}`, `PATCH /api/bookings/{id}/confirm`, `PATCH /api/bookings/{id}/activate`, `PATCH /api/bookings/{id}/return`, `PATCH /api/bookings/{id}/complete`, `PATCH /api/bookings/{id}/cancel`. |
| **Persistence** | PostgreSQL (`bookings` table). |
| **Why Separated?** | Contains the core transactional business logic. Isolating it guarantees transaction integrity and allows fine-grained concurrency control. |

---

### 2.6 Notification Service (`notification-service`)

| Attribute | Specification |
| :--- | :--- |
| **Service Name** | `NOTIFICATION-SERVICE` |
| **Default Port** | `8084` (Dynamic `${PORT:8084}`) |
| **Primary Responsibility**| OpenPDF vector invoice compilation, transactional SMTP email transmission, and notification delivery status logging. |
| **Discovery Mechanism** | Registers with Eureka (`NOTIFICATION-SERVICE`). |
| **Primary APIs** | `POST /api/notifications/booking-confirmed`, `POST /api/notifications/vehicle-returned`, `GET /api/notifications/invoice/{bookingReference}`, `GET /api/notifications/status/{bookingReference}`. |
| **Persistence** | PostgreSQL (`notifications` table). |
| **Why Separated?** | Heavy I/O operations (PDF rendering and third-party SMTP network calls) are isolated so external email slowdowns never block reservation creation. |

---

## 3. Service-to-Service Communication Flow

```
1. Customer initiates reservation request:
   Client -> API Gateway (8080) -> Booking Service (8083)

2. Booking Service queries Vehicle Service for price & specs:
   Booking Service (8083) --[lb://VEHICLE-SERVICE]--> Vehicle Service (8082)
   Result: Returns VehicleDto (Status, Daily Price, Brand, Model)

3. Booking Service checks DB for date overlaps & persists Booking in PostgreSQL:
   Booking Service (8083) -> Supabase PostgreSQL (bookings table)

4. Booking Service asynchronously invokes Notification Service:
   Booking Service (8083) --[Async HTTP lb://NOTIFICATION-SERVICE]--> Notification Service (8084)
   Result: Generates OpenPDF invoice & dispatches confirmation email via SMTP.

5. Fleet Manager activates rental (Hand-off):
   Admin -> API Gateway -> Booking Service (PATCH /api/bookings/{id}/activate)
   Booking Service updates Booking (ACTIVE) and invokes:
   Booking Service (8083) --[PATCH /api/vehicles/{id}/status]--> Vehicle Service (8082)
   Vehicle Service updates Vehicle (RENTED)
```

---

## 4. Spring Cloud Discovery & Dynamic Port Configuration

All microservices are configured with dynamic port fallback and Eureka instance naming:

```yaml
# Standard Microservice Configuration Template (e.g., Booking Service)
server:
  port: ${SERVER_PORT:${PORT:8083}}

spring:
  application:
    name: BOOKING-SERVICE

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER_URL:http://localhost:8761/eureka/}
    register-with-eureka: true
    fetch-registry: true
  instance:
    prefer-ip-address: false
    hostname: localhost
    instance-id: ${spring.application.name}:${server.port}
```

This configuration ensures seamless compatibility across both local multi-port developer environments and cloud container environments (Render) where `$PORT` is assigned dynamically.
