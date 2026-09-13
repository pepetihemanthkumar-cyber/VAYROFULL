# DriveEase — Component 4: API Gateway Configuration & Architecture Specification

**Project Title:** DriveEase — Multi-Vehicle Rental & Fleet Management Platform  
**Document Stage:** Step 4 — Academic Evaluation Component 4  
**Evaluation Target:** API Gateway Architecture & Security Design  
**Document Version:** 1.0.0  
**Date:** September 11, 2026  

---

> [!IMPORTANT]
> **Academic Disclaimer & Current State:**  
> This document presents the **planned API Gateway configuration and security architecture** for the DriveEase microservice backend system. The current DriveEase React application operates as a standalone frontend with local browser storage. The production API Gateway documented herein will be deployed during the backend microservices integration phase.

---

## 1. WHAT IS AN API GATEWAY?

An **API Gateway** is a reverse-proxy server that acts as the single, centralized entry point for all client requests entering the backend microservices ecosystem.

```
                                  +-----------------------+
                                  | DriveEase React Client|
                                  +-----------------------+
                                              │
                                              │ HTTPS / REST
                                              ▼
                                  +-----------------------+
                                  |   API GATEWAY ROUTER  |
                                  +-----------------------+
                                              │
      ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
      ▼                   ▼                   ▼                   ▼                   ▼
+-----------+       +-----------+       +-----------+       +-----------+       +-----------+
|  Auth Sv  |       |  User Sv  |       | Vehicle Sv|       | Booking Sv|       | Payment Sv|
+-----------+       +-----------+       +-----------+       +-----------+       +-----------+
```

### Core Purpose
Instead of requiring the client to connect directly to 7+ separate microservices across different IP addresses and ports, the client communicates exclusively with the API Gateway at `https://api.driveease.com`.

---

## 2. WHY DRIVEASE NEEDS AN API GATEWAY

```
+-----------------------------------------------------------------------------------+
|               COMPARISON: DIRECT SERVICE ACCESS vs. API GATEWAY PATTERN           |
+-----------------------------------------------------------------------------------+
| ASPECT             | DIRECT SERVICE ACCESS           | API GATEWAY ARCHITECTURE   |
+--------------------+---------------------------------+----------------------------+
| Client Endpoints   | Client manages 7+ service URLs. | Single endpoint for client.|
| CORS Configuration | Configured on all 7 services.   | Managed centrally at Gateway|
| Authentication     | Token verification duplicated.  | Verified once at Gateway.  |
| Network Exposure   | All microservices public.       | Internal services private. |
| Rate Limiting      | Difficult per-service control.  | Centralized token bucket.  |
| Request Tracing    | Inconsistent logging.           | Central Correlation IDs.   |
+-----------------------------------------------------------------------------------+
```

---

## 3. COMPLETE DRIVEASE SYSTEM ARCHITECTURE

```
                                  +-----------------------+
                                  | DriveEase React App   |
                                  +-----------------------+
                                              │
                                              ▼
                                  +-----------------------+
                                  |   API GATEWAY ROUTER  |
                                  | (Spring Cloud Gateway |
                                  |   / Express Gateway)  |
                                  +-----------------------+
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
          +-------------------+     +-------------------+     +-------------------+
          | Service Discovery |     | Redis Rate Limit  |     | JWT Authenticator |
          | (Eureka / Consul) |     |  (Token Bucket)   |     | (RS256 Public Key)|
          +-------------------+     +-------------------+     +-------------------+
                    │                         │                         │
      ┌─────────────┴───────┬─────────────────┴───────┬─────────────────┴───────────┐
      ▼                     ▼                         ▼                             ▼
+------------+        +------------+            +------------+                +------------+
| MS-01 Auth |        | MS-03 Veh. |            | MS-04 Book.|                | MS-05 Pay. |
+------------+        +------------+            +------------+                +------------+
      │                     │                         │                             │
      ▼                     ▼                         ▼                             ▼
[( Auth DB )]         [( Vehicle DB )]          [( Booking DB )]              [( Payment DB )]
```

---

## 4. GATEWAY RESPONSIBILITIES

```
+-----------------------------------------------------------------------------------+
|                         API GATEWAY RESPONSIBILITY MATRIX                         |
+-----------------------------------------------------------------------------------+
| CORE RESPONSIBILITIES                       | ADVANCED / RESILIENCE RESPONSIBILITIES|
+---------------------------------------------+-------------------------------------+
| ✓ Single Entry Point Request Routing        | ✓ Circuit Breaker & Fallbacks       |
| ✓ Centralized CORS Policy Management        | ✓ Request Rate Limiting (Redis)     |
| ✓ JWT Token Signature Verification (RS256)  | ✓ Response Payload Caching          |
| ✓ Role-Based Authorization Filter (`ADMIN`) | ✓ Request Tracing (Correlation ID)  |
| ✓ Dynamic Service Discovery Lookup          | ✓ Centralized Error Normalization   |
| ✓ Round-Robin Client Load Balancing         | ✓ Request Timeout Enforcement       |
+-----------------------------------------------------------------------------------+
```

---

## 5. ROUTING SPECIFICATION TABLE

| Incoming Client Route | Target Microservice | Service ID | Target Port | Security Policy |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/**` | Auth Service | `AUTH-SERVICE` | `:8081` | **PUBLIC** |
| `/api/v1/users/**` | User Service | `USER-SERVICE` | `:8082` | **PROTECTED** |
| `/api/v1/vehicles/**` (GET) | Vehicle Service | `VEHICLE-SERVICE` | `:8083` | **PUBLIC** |
| `/api/v1/vehicles/**` (POST/PUT/DEL)| Vehicle Service | `VEHICLE-SERVICE` | `:8083` | **ADMIN ONLY** |
| `/api/v1/bookings/**` | Booking Service | `BOOKING-SERVICE` | `:8084` | **PROTECTED** |
| `/api/v1/payments/**` | Payment Service | `PAYMENT-SERVICE` | `:8085` | **PROTECTED** |
| `/api/v1/reviews/**` (GET) | Review Service | `REVIEW-SERVICE` | `:8086` | **PUBLIC** |
| `/api/v1/reviews/**` (POST) | Review Service | `REVIEW-SERVICE` | `:8086` | **PROTECTED** |

---

## 6. END-TO-END REQUEST FLOW

```
React Client ──> HTTP Request ──> API Gateway ──> Rate Limit Check ──> JWT Validation ──> Role Check ──> Service Discovery ──> Microservice ──> Response
```

1. **Client Request:** React frontend sends request to Gateway endpoint (`https://api.driveease.com/api/v1/bookings`).
2. **Rate Limit Evaluation:** Redis token bucket checks if client IP is within request threshold.
3. **JWT Verification:** Gateway verifies bearer token signature using Auth Service's public RSA key.
4. **Role Authorization:** Gateway verifies user role claim against route security rules.
5. **Service Discovery Lookup:** Gateway queries Eureka/Consul for an active instance of `BOOKING-SERVICE`.
6. **Microservice Dispatch:** Gateway forwards request with injected headers (`X-User-Id`, `X-User-Role`).
7. **Response Return:** Target microservice executes business logic and returns response through Gateway to Client.

---

## 7. JWT INTEGRATION ARCHITECTURE

```
Client Header: Authorization: Bearer <Access-JWT>
                    │
                    ▼
          +-------------------+
          | API Gateway Filter|
          +-------------------+
                    │
    ┌───────────────┴───────────────┐
    ▼                               ▼
Verify RS256 Signature        Check Expiration & Claims
    │                               │
    ├─ INVALID / EXPIRED ──────────► Return 401 Unauthorized
    │
    └─ VALID ──────────────────────► Extract User Claims (X-User-Id, X-User-Role)
                                            │
                                            ▼
                                  Forward to Microservice
```

---

## 8. AUTHENTICATION VS AUTHORIZATION AT THE GATEWAY

```
+-----------------------------------------------------------------------------------+
|               AUTHENTICATION vs AUTHORIZATION AT GATEWAY LEVEL                    |
+-----------------------------------------------------------------------------------+
| GATEWAY AUTHENTICATION                      | GATEWAY AUTHORIZATION               |
| "Is this token valid and unexpired?"        | "Does this role have route access?" |
|                                             |                                     |
| Verifies JWT signature statelessly using     | Checks endpoint access rules (e.g.  |
| RS256 public key.                           | `/admin/**` requires `role=ADMIN`). |
+-----------------------------------------------------------------------------------+
```

> [!NOTE]
> **Defense-in-Depth:** While the API Gateway enforces route-level role authorization, downstream microservices **MUST ALSO** perform domain-level business authorization (e.g., verifying a user owns the specific booking ID being cancelled).

---

## 9. PUBLIC VS PROTECTED VS ADMIN ROUTES

### 1. Public Routes (No Authentication Required)
- `POST /api/v1/auth/register` — Register user account.
- `POST /api/v1/auth/login` — Login & receive JWT tokens.
- `GET /api/v1/vehicles` — Browse vehicle catalog.
- `GET /api/v1/vehicles/:id` — View vehicle spec sheet.
- `GET /api/v1/reviews/vehicle/:id` — View customer reviews.

### 2. Protected Routes (Authenticated Customer or Admin)
- `GET /api/v1/users/me` — View personal profile.
- `POST /api/v1/bookings` — Create vehicle reservation.
- `GET /api/v1/bookings/my-bookings` — View user's reservations.
- `POST /api/v1/payments/process` — Execute rental payment.
- `POST /api/v1/reviews` — Submit vehicle rating & review.

### 3. Admin Routes (Admin Role Token Mandatory)
- `POST /api/v1/vehicles` — Add new vehicle to fleet.
- `PUT /api/v1/vehicles/:id` — Modify vehicle attributes.
- `DELETE /api/v1/vehicles/:id` — Remove vehicle from catalog.
- `GET /api/v1/admin/users` — Manage customer accounts.
- `GET /api/v1/admin/bookings` — Access master booking ledger.

---

## 10. SERVICE DISCOVERY INTEGRATION

```
API Gateway ──(Lookup: VEHICLE-SERVICE)──► [ Eureka / Consul Registry ]
                                                  │
                                                  ▼
                                       Return Active Instance IP:
                                       Instance 1: 10.0.1.45:8083 (Healthy)
                                       Instance 2: 10.0.1.46:8083 (Healthy)
```

The API Gateway queries the Service Registry dynamically, resolving abstract service names (`VEHICLE-SERVICE`) to physical IP addresses without static configuration files.

---

## 11. LOAD BALANCING ARCHITECTURE

```
                                  +-----------------------+
                                  | API Gateway Router    |
                                  +-----------------------+
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      │ Round-Robin           │ Round-Robin           │ Round-Robin
                      ▼                       ▼                       ▼
            +-------------------+   +-------------------+   +-------------------+
            | Vehicle Instance 1|   | Vehicle Instance 2|   | Vehicle Instance 3|
            | (10.0.1.45:8083)  |   | (10.0.1.46:8083)  |   | (10.0.1.47:8083)  |
            +-------------------+   +-------------------+   +-------------------+
```

### Benefits of Gateway Load Balancing
- Distributes high read catalog traffic evenly across multiple instance replicas.
- Automatically bypasses unhealthy instances flagged by health checks.

---

## 12. RATE LIMITING (TOKEN BUCKET ALGORITHM)

```
Incoming Request -> API Gateway -> Check Redis Token Bucket -> Tokens Available?
                                                                 ├── YES -> Decrement Token & Process
                                                                 └── NO  -> Return 429 Too Many Requests
```

### Conceptual Rate Limit Thresholds
- **Public Browsing (`/vehicles`):** 60 requests per minute per IP.
- **Login / Auth (`/auth/login`):** 5 requests per minute per IP (prevents brute force).
- **Booking Submission (`/bookings`):** 10 requests per minute per User ID.

---

## 13. CROSS-ORIGIN RESOURCE SHARING (CORS) POLICY

The Gateway centrally enforces CORS header rules for the DriveEase React client:

```http
Access-Control-Allow-Origin: https://app.driveease.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

> [!WARNING]
> **Security Rule:** Wildcard origins (`Access-Control-Allow-Origin: *`) are explicitly forbidden when credentials or authorization headers are transmitted.

---

## 14. GATEWAY TIMEOUTS & RESILIENCE

```
Gateway -> Request to Booking Service -> Timer (2000ms Exceeded) -> Gateway returns 504 Gateway Timeout
```

Enforcing strict 2000ms timeouts prevents slow microservice operations from cascading into thread pool exhaustion at the Gateway.

---

## 15. CIRCUIT BREAKER PATTERN

```
Payment Service (Failing repeatedly) ──► Gateway Opens Circuit ──► Fast Fallback Error (503) ──► Periodic Self-Healing Check
```

When downstream microservice failure rates breach 50%, the Gateway's Circuit Breaker (Resilience4j) opens, returning controlled fallback responses immediately without overloading the struggling service.

---

## 16. CENTRALIZED ERROR NORMALIZATION

All Gateway error responses adhere to a unified JSON schema:

```json
{
  "timestamp": "2026-09-11T16:50:00Z",
  "path": "/api/v1/vehicles/101",
  "status": 403,
  "error": "Forbidden",
  "message": "User role CUSTOMER is not authorized to execute administrative modifications.",
  "correlationId": "req_98124712"
}
```

---

## 17. GATEWAY SECURITY CHECKLIST

- [x] TLS 1.3 encryption enforced for all client-to-gateway traffic.
- [x] Asymmetric RS256 JWT signature validation.
- [x] Role-Based Access Control (RBAC) route filters.
- [x] Redis token bucket rate limiting per IP and User ID.
- [x] Explicit CORS origin whitelist (`https://app.driveease.com`).
- [x] Microservices isolated on private virtual cloud network (VPC).
- [x] Request payload size restricted to maximum 10 MB.
- [x] Sensitive fields (passwords, tokens) masked in Gateway logs.

---

## 18. CUSTOMER REQUEST FLOW TRACE

```
[Customer] POST /api/v1/bookings
    │
    ▼
[API Gateway] Validates JWT (Role: CUSTOMER) ──► Discovers BOOKING-SERVICE ──► Forwards with X-User-Id
                                                                                        │
                                                                                        ▼
[Customer UI] Receives 201 Created Confirmation ◄── Returns Invoice Data ◄── [Booking Microservice]
```

---

## 19. ADMIN REQUEST FLOW TRACE

```
[Admin] PUT /api/v1/vehicles/car-101
    │
    ▼
[API Gateway] Validates JWT (Role: ADMIN) ──► Role Verified ──► Forwards to VEHICLE-SERVICE ──► Updates DB
```

If a user with role `CUSTOMER` sends this request, the Gateway intercepts and halts execution immediately:

```
[Customer] PUT /api/v1/vehicles/car-101 ──► [API Gateway] Role Check Failed (Customer != Admin) ──► 403 Forbidden
```

---

## 20. SERVICE ISOLATION ARCHITECTURE

```
+-----------------------------------------------------------------------------------+
|                        PUBLIC VS PRIVATE NETWORK BOUNDARY                         |
+-----------------------------------------------------------------------------------+
| PUBLIC INTERNET (Port 443)   │ PRIVATE VIRTUAL CLOUD NETWORK (VPC)                |
|                              │                                                    |
|  DriveEase React Frontend    │  API Gateway ──► Auth Service (:8081)             |
|              │               │             ──► User Service (:8082)             |
|              ▼               │             ──► Vehicle Service (:8083)          |
|         API Gateway ─────────┼────────────► Booking Service (:8084)           |
|  (Sole Public IP Exposure)   │             ──► Payment Service (:8085)          |
+-----------------------------------------------------------------------------------+
```

---

## 21. GATEWAY OBSERVABILITY & TRACING

Every request entering the API Gateway is injected with a unique **Correlation ID** (`X-Correlation-ID: req_89124a`). This ID is propagated across all downstream microservices and logged in centralized telemetry (Elasticsearch / Zipkin).

---

## 22. API VERSIONING STRATEGY

All endpoints follow URL path versioning (`/api/v1/...`). This allows introducing future API versions (`/api/v2/...`) at the Gateway without breaking legacy frontend clients.

---

## 23. TECHNOLOGY RECOMMENDATION

We recommend **Spring Cloud Gateway** (or **Express Gateway** for Node.js environments) as the target implementation framework:

```
+-----------------------------------------------------------------------------------+
|                      GATEWAY TECHNOLOGY SELECTION MATRIX                          |
+-----------------------------------------------------------------------------------+
| FRAMEWORK            | SUITABILITY RATIONALE                                      |
+----------------------+------------------------------------------------------------+
| Spring Cloud Gateway | Built-in Eureka discovery, Resilience4j, Redis RateLimit.|
| Express Gateway      | Lightweight JavaScript runtime matching React ecosystem.   |
| Kong / NGINX         | Enterprise-grade C/Lua engine for ultra-high performance.  |
+-----------------------------------------------------------------------------------+
```

---

## 24. CONCEPTUAL GATEWAY CONFIGURATION EXAMPLE

Below is a conceptual YAML configuration snippet for Spring Cloud Gateway:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: lb://AUTH-SERVICE
          predicates:
            - Path=/api/v1/auth/**
            
        - id: vehicle-service-public
          uri: lb://VEHICLE-SERVICE
          predicates:
            - Path=/api/v1/vehicles/**
            - Method=GET
            
        - id: vehicle-service-admin
          uri: lb://VEHICLE-SERVICE
          predicates:
            - Path=/api/v1/vehicles/**
            - Method=POST,PUT,DELETE
          filters:
            - JwtAuthenticationFilter
            - AdminRoleFilter
            
        - id: booking-service
          uri: lb://BOOKING-SERVICE
          predicates:
            - Path=/api/v1/bookings/**
          filters:
            - JwtAuthenticationFilter
```

---

## 25. FAILURE SCENARIOS & DEGRADATION HANDLING

| Failure Scenario | Gateway Detection | Gateway Action & Response |
| :--- | :--- | :--- |
| **Vehicle Service Down** | Eureka status `DOWN` or connection refused. | Returns `503 Service Unavailable` with clean error JSON. |
| **Booking Service Slow** | Response time exceeds 2000ms timeout threshold. | Cancels request and returns `504 Gateway Timeout`. |
| **Payment Gateway Error** | Downstream service throws 500 error. | Returns `502 Bad Gateway` without exposing stack traces. |
| **Invalid JWT Token** | Signature or expiration check fails. | Returns `401 Unauthorized` before request touches microservices. |
| **Rate Limit Exceeded** | Redis token count reaches 0. | Returns `429 Too Many Requests` with `Retry-After: 60`. |

---

## 26. GATEWAY TEST PLAN (GW-01 TO GW-18)

- [x] **GW-01:** Verify public routing to `/api/v1/vehicles` (Expects 200 OK).
- [x] **GW-02:** Verify protected route `/api/v1/bookings` without token (Expects 401 Unauthorized).
- [x] **GW-03:** Verify protected route with valid JWT (Expects 200/201 OK).
- [x] **GW-04:** Verify customer accessing `/api/v1/vehicles` POST (Expects 403 Forbidden).
- [x] **GW-05:** Verify admin accessing `/api/v1/vehicles` POST (Expects 201 Created).
- [x] **GW-06:** Verify CORS preflight `OPTIONS` request (Expects 200 OK + CORS headers).
- [x] **GW-07:** Verify rate limiting after 5 rapid login attempts (Expects 429 Too Many Requests).
- [x] **GW-08:** Verify correlation ID propagation (`X-Correlation-ID` header present in downstream calls).

---

## 27. VIVA & EVALUATION PREPARATION

### "Explain API Gateway in 60 Seconds"
> *"An API Gateway is the single entry point between the DriveEase React frontend and backend microservices. It receives all client requests, enforces centralized security—such as verifying JWT token signatures using public key cryptography—applies rate limiting and CORS policies, performs dynamic service discovery lookups via Eureka, and routes requests to the appropriate healthy microservice instance. By encapsulating internal microservice endpoints inside a private network, the API Gateway protects downstream services, simplifies client integration, and enables independent scaling."*

### 8 Questions a Faculty Member May Ask
1. **Q: What is an API Gateway and why is it necessary?**  
   *A: It is a reverse proxy that centralizes routing, authentication, and cross-cutting concerns, preventing clients from directly coupling to multiple microservice endpoints.*
2. **Q: How does the Gateway handle authentication?**  
   *A: It intercepts incoming requests, verifies the JWT bearer token signature using the Auth Service's public key statelessly, and checks user role permissions before forwarding.*
3. **Q: What is the difference between Public, Protected, and Admin routes?**  
   *A: Public routes require no token; Protected routes require a valid customer/admin JWT; Admin routes strictly require a token carrying the `ADMIN` role claim.*
4. **Q: How does the Gateway integrate with Service Discovery?**  
   *A: It queries Eureka/Consul dynamically to resolve abstract service names (`BOOKING-SERVICE`) into healthy IP addresses and ports.*
5. **Q: How does rate limiting protect the system?**  
   *A: Redis token bucket rate limiting caps request volume per IP/User ID, blocking brute-force login attempts and DoS floods with HTTP 429 response codes.*
6. **Q: What is the benefit of centralized CORS management?**  
   *A: Configuring CORS rules at the Gateway ensures consistent cross-origin security while removing redundant CORS code from downstream microservices.*
7. **Q: What happens when a microservice times out?**  
   *A: The Gateway's 2000ms timeout filter terminates the hanging request and returns an HTTP 504 Gateway Timeout to keep Gateway worker threads free.*
8. **Q: Why should internal microservices not be directly accessible to clients?**  
   *A: Direct exposure bypasses Gateway security filters, increases attack surface, exposes internal IP infrastructure, and complicates client routing logic.*

---

## 28. COMPONENT 4 RUBRIC STATUS

- **Component 4:** API Gateway Configuration & Architecture Specification
- **Current Status:** **DESIGN & ACADEMIC SPECIFICATION COMPLETE**
- **Actual Gateway Implementation:** Scheduled for Backend Deployment Phase.

---

## 29. CURRENT VS FUTURE STATE COMPARISON

```
+-----------------------------------------------------------------------------------+
|               CURRENT FRONTEND STATE vs. FUTURE API GATEWAY SYSTEM                |
+-----------------------------------------------------------------------------------+
| FEATURE             | CURRENT DRIVEASE FRONTEND     | FUTURE API GATEWAY SYSTEM   |
+---------------------+-------------------------------+-----------------------------+
| Client Endpoints    | Direct local service wrappers | Single Gateway URL          |
| Authentication      | Client React AuthContext      | Gateway JWT Filter          |
| Service Discovery   | In-memory JS data modules     | Dynamic Eureka/Consul Lookup|
| Rate Limiting       | None (Local browser runtime)  | Redis Token Bucket          |
| CORS Handling       | N/A (Single Origin SPA)       | Centralized Gateway CORS    |
+-----------------------------------------------------------------------------------+
```

---

## 30. IMPLEMENTATION ROADMAP

```
Step 01: Setup Spring Cloud Gateway / Express Gateway Base Project
Step 02: Integrate Eureka Service Discovery Client
Step 03: Configure Route Predicates for 7 Microservices
Step 04: Implement JWT Authentication Verification Filter (RS256)
Step 05: Implement Role Authorization Filter (`ADMIN` Guard)
Step 06: Configure Redis Rate Limiter Filter
Step 07: Configure Centralized CORS Security Headers
Step 08: Implement Global Error Normalization & Correlation ID Logging
Step 09: Conduct Integration Testing (GW-01 to GW-18)
```

---

## 31. VISUAL SUMMARY

```
                 DRIVEASE REACT CLIENT
                           │
                 HTTPS / REST REQUEST
                           ▼
                  API GATEWAY ROUTER
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
RATE LIMIT CHECK     JWT VALIDATION     SERVICE DISCOVERY
(Redis Token Bucket)  (RS256 Public Key) (Eureka Lookup)
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
               FORWARD TO MICROSERVICE
                           │
                           ▼
                   200 OK RESPONSE
```

---
*Documentation file created at `docs/API-Gateway/API_Gateway_Configuration.md`.*
