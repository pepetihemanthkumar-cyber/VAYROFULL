# VAYRO — Review 1 Viva Voce Preparation Guide

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — Comprehensive Viva Voce Questions & Answers  
**Target Level:** Highest Academic Distinction (Deep technical mastery of actual implementation)  
**Date:** September 2026  
**Document Version:** 1.0.0  

---

## 1. Project Background & System Motivation

### Q1: Why VAYRO? What is the core motivation behind the project?
**Answer:**  
VAYRO (Fleet Lifecycle & Rental Asset Management Platform) was created to modernize conventional vehicle rental operations. Traditional rental workflows suffer from manual paper ledgers, phone-call availability checks, double-booking errors, and rigid monolithic software. VAYRO provides a cloud-native, microservice-based digital platform that automates multi-category fleet browsing, real-time schedule conflict prevention, transparent pricing, and instant PDF invoicing.

### Q2: What specific real-world problems does VAYRO solve?
**Answer:**  
1. **Eliminating Double-Bookings:** Automated interval overlap validation prevents overlapping reservations for the same vehicle.
2. **Transparent Pricing:** Automated `BigDecimal` math calculates rental days, add-ons, discounts, and 18% GST without rounding discrepancies.
3. **Domain Isolation:** Microservices ensure that high catalog browsing traffic or slow email dispatch never impacts core reservation transactions.
4. **Decentralized Security:** Stateless JWT authentication and granular Role-Based Access Control (RBAC) protect fleet administration.

---

## 2. Microservice Architecture & Service Discovery

### Q3: Why did you choose a Microservices architecture instead of a Monolith?
**Answer:**  
Microservices provide:
- **Independent Scalability:** Read-heavy services (Vehicle Catalog) can scale independently of write-heavy transactional services (Booking Engine).
- **Fault Isolation:** A failure in the Notification Service (e.g., SMTP timeout) does not crash or roll back the Booking Service.
- **Domain Decoupling:** Authentication, Fleet Inventory, Bookings, and Notifications evolve independently with clean codebases and localized data models.

### Q4: What is Eureka Server and what role does it play in VAYRO?
**Answer:**  
Netflix Eureka is a Service Registry and Discovery server (running on port 8761). In our distributed system, microservices do not hardcode IP addresses or physical ports. Upon startup, each service registers its logical name (`USER-SERVICE`, `VEHICLE-SERVICE`, `BOOKING-SERVICE`, etc.) with Eureka and sends periodic heartbeats. Other services query Eureka to locate healthy instances dynamically.

### Q5: Why is Eureka necessary instead of static hostnames or DNS?
**Answer:**  
In containerized cloud environments (such as Docker, Kubernetes, or Render), instances are spun up with dynamic IP addresses and randomized `$PORT` numbers. Eureka provides dynamic runtime resolution (`lb://<SERVICE-NAME>`), client-side load balancing, and automatic instance de-registration if a service crashes.

### Q6: How does service-to-service communication work between Booking Service and Vehicle Service?
**Answer:**  
The Booking Service uses Spring Cloud's `@LoadBalanced RestClient.Builder`. When making a call to `http://VEHICLE-SERVICE/api/vehicles/{id}`, the load balancer intercepts the logical service name, queries Eureka to obtain the physical host and port, and executes the HTTP REST call. It also propagates the `Authorization: Bearer <token>` header to maintain security context.

### Q7: Why did you separate Booking Service and Vehicle Service into distinct microservices?
**Answer:**  
They belong to separate business bounded contexts:
- **Vehicle Service:** Manages static and semi-static vehicle asset metadata (specifications, images, fuel types, baseline daily rates).
- **Booking Service:** Governs dynamic, high-concurrency transactional workflows (date ranges, payment states, customer reservations, and monetary totals).  
Separating them prevents heavy booking queries from locking vehicle catalog lookups.

---

## 3. Perimeter Gateway & Routing

### Q8: What is the API Gateway and why is it used?
**Answer:**  
The API Gateway (Port 8080) is built on Spring Cloud Gateway (asynchronous WebFlux and Netty). It acts as the single perimeter reverse proxy for all client traffic. Instead of exposing individual microservices and ports to the public internet, the frontend communicates exclusively with the Gateway on `/api/**`, which handles CORS, validates JWT tokens, and routes requests to the correct downstream service.

### Q9: What are the primary benefits of an API Gateway?
**Answer:**  
1. **Unified Public Surface:** Hides internal architecture and port numbers from external clients.
2. **Centralized Security:** Validates JWT signatures and enforces RBAC before requests enter the internal network.
3. **Centralized CORS Management:** Configures browser cross-origin headers in one place rather than in each microservice.
4. **Structured Error Handling:** Translates perimeter failures into standardized JSON responses (`401 UNAUTHORIZED`, `403 FORBIDDEN`).

### Q10: How does the Gateway route requests to internal services?
**Answer:**  
Via Spring Cloud Gateway route definitions configured with path predicates and Eureka URIs:
- `/api/auth/**`, `/api/users/**` $\to$ `lb://USER-SERVICE`
- `/api/vehicles/**` $\to$ `lb://VEHICLE-SERVICE`
- `/api/bookings/**` $\to$ `lb://BOOKING-SERVICE`
- `/api/notifications/**` $\to$ `lb://NOTIFICATION-SERVICE`

---

## 4. Authentication, JWT & Security

### Q11: What is JWT and why is it used in VAYRO?
**Answer:**  
JSON Web Token (JWT) is an open standard (RFC 7519) for securely transmitting information as a compact, self-contained JSON object. We use HMAC-SHA256 signed JWTs for stateless authentication. Because the token contains user identity claims (`userId`, `email`, `role`), our backend microservices can authenticate requests without querying a centralized session database.

### Q12: How does the complete JWT authentication lifecycle work in VAYRO?
**Answer:**  
1. The client sends login credentials to `POST /api/auth/login`.
2. The Gateway routes the request to `USER-SERVICE`.
3. `USER-SERVICE` validates the email and verifies the password using BCrypt.
4. `USER-SERVICE` generates an HMAC-SHA256 signed JWT and returns it to the client.
5. The React frontend stores the token in local storage and includes `Authorization: Bearer <token>` in subsequent Axios requests.
6. The Gateway intercepts the request, verifies the signature and expiration, and forwards it to the target microservice.

### Q13: What is the difference between Authentication and Authorization?
**Answer:**  
- **Authentication:** Verifies *who* the user is (e.g., verifying email and password during login to issue a JWT).
- **Authorization:** Verifies *what permissions* the authenticated user has (e.g., verifying whether the token possesses `ROLE_ADMIN` before allowing vehicle creation or rental activation).

### Q14: What is RBAC and how is it implemented?
**Answer:**  
Role-Based Access Control (RBAC) restricts system access based on user roles. In VAYRO:
- `ROLE_USER`: Can browse vehicles, check availability, create personal bookings, view their own booking history, and download their invoices.
- `ROLE_ADMIN`: Can create/update/delete vehicles, view platform-wide bookings, confirm reservations, activate vehicle handoffs, and process returns.

### Q15: Why is BCrypt used for password storage?
**Answer:**  
BCrypt is an adaptive cryptographic hash function featuring:
- **Salt Generation:** Incorporates a unique 128-bit random salt for each password, defeating rainbow table attacks.
- **Configurable Work Factor:** Deliberately slows down hashing (work factor 10) to protect against brute-force and hardware acceleration attacks.

### Q16: How do you prevent public users from creating ADMIN accounts during registration?
**Answer:**  
In `user-service/AuthService.java`, the registration handler explicitly hardcodes `user.setRole(Role.USER)`. The API ignores any incoming role parameters from the client request. Administrative accounts can only be provisioned through secure server bootstrap configuration (`ADMIN_BOOTSTRAP_ENABLED`).

---

## 5. Booking Logic, Concurrency & Financial Integrity

### Q17: How does VAYRO prevent vehicle booking conflicts and race conditions?
**Answer:**  
VAYRO implements a two-tier concurrency and overlap protection mechanism:
1. **JVM Mutex Striping:** A hashed lock array (`synchronized(lockStripes[hash(vehicleId)])`) ensures that concurrent threads in the same service process create reservations for the same vehicle sequentially.
2. **Deterministic SQL Overlap Query:** The database checks for existing reservations where:
   $$\text{requestedPickup} < \text{existingReturn} \quad \land \quad \text{requestedReturn} > \text{existingPickup}$$
   in `PENDING`, `CONFIRMED`, or `ACTIVE` states. If found, a `BookingOverlapException` is thrown.

### Q18: How does the rental lifecycle state machine work?
**Answer:**  
Bookings transition through a strict state progression:
$$\text{PENDING} \longrightarrow \text{CONFIRMED} \longrightarrow \text{ACTIVE} \longrightarrow \text{RETURNED} \longrightarrow \text{COMPLETED}$$
- `PENDING` $\to$ `CONFIRMED`: Customer payment is verified or Admin confirms.
- `CONFIRMED` $\to$ `ACTIVE`: Admin hands vehicle over to customer; vehicle status becomes `RENTED`.
- `ACTIVE` $\to$ `RETURNED`: Customer returns vehicle; vehicle status reverts to `AVAILABLE`.
- `RETURNED` $\to$ `COMPLETED`: Inspection and deposit settlement completed.
- Cancellations are only permitted before the booking reaches `ACTIVE` state.

### Q19: Why are monetary amounts calculated using `BigDecimal` instead of `double` or `float`?
**Answer:**  
Binary floating-point types (`float`, `double`) cannot accurately represent decimal fractions (e.g., $0.1 + 0.2 = 0.30000000000000004$), leading to rounding errors in billing, taxes, and financial ledgers. `BigDecimal` provides exact arbitrary-precision arithmetic with explicit rounding modes (`RoundingMode.HALF_UP`).

---

## 6. Notification, Invoice & Persistence Layer

### Q20: What happens if the Notification Service or SMTP server fails during booking?
**Answer:**  
The booking transaction is completely isolated and protected. In `BookingServiceImpl`, the call to `notificationServiceClient.sendBookingConfirmedNotificationAsync()` runs asynchronously in a non-blocking block. Any network timeout or SMTP exception is logged without throwing a runtime exception that would trigger a database rollback. The booking remains saved in PostgreSQL.

### Q21: How are PDF invoices generated?
**Answer:**  
In `notification-service`, we use the **OpenPDF** library (`PdfInvoiceGenerator`). It compiles an in-memory vector PDF containing the VAYRO corporate header, customer details, reservation time range, itemized daily base charges, add-on lines, discounts, and 18% GST breakdown. The resulting byte array is saved to the database and attached to the confirmation email.

### Q22: Why did you choose PostgreSQL and Supabase?
**Answer:**  
- **PostgreSQL:** ACID-compliant relational database engine supporting complex interval query predicates, relational integrity, and strict data typing.
- **Supabase:** Provides managed cloud PostgreSQL infrastructure with automated backups, connection pooling via PgBouncer, and strict SSL communication.

### Q23: What is the purpose of HikariCP connection pooling?
**Answer:**  
Opening and closing physical database TCP connections is computationally expensive. HikariCP maintains a pool of pre-established, reusable connections, minimizing request latency and preventing connection exhaustion on the cloud database.

---

## 7. Frontend, DevOps & DTI Principles

### Q24: How does the React frontend communicate with the backend?
**Answer:**  
The React SPA uses Axios configured with request and response interceptors (`api.js`). The request interceptor automatically extracts the JWT token from `localStorage` and injects the `Authorization: Bearer <token>` header into every outgoing API request directed to the API Gateway.

### Q25: How does VAYRO handle Cross-Origin Resource Sharing (CORS)?
**Answer:**  
The API Gateway implements a reactive `CorsWebFilter` with highest precedence (`Ordered.HIGHEST_PRECEDENCE`). It intercepts HTTP `OPTIONS` preflight requests, validates the `Origin` against allowed patterns (`http://localhost:*`, `https://vayro.com`), and returns appropriate `Access-Control-Allow-*` headers.

### Q26: What DTI (Digital Transformation & Innovation) concepts are demonstrated in VAYRO?
**Answer:**  
1. **Digital Transformation:** Replacing manual paper vehicle rental processes with an automated web platform.
2. **Microservices & Cloud Computing:** Decoupled architecture deployed across cloud infrastructure.
3. **Process Automation:** Automated schedule conflict detection, dynamic billing math, vector invoice compilation, and email dispatch.
4. **Zero-Trust Security:** Token-based perimeter defense and BCrypt cryptographic salting.

### Q27: What major engineering challenges did you face and how did you resolve them?
**Answer:**  
1. **Double-Booking Race Conditions:** Solved using JVM mutex striping coupled with database interval overlap queries.
2. **Cloud Dynamic Port Binding:** Solved using Spring Boot dynamic port evaluation (`${SERVER_PORT:${PORT:8080}}`) and Eureka instance mapping.
3. **Notification Latency:** Solved by decoupling OpenPDF compilation and SMTP email transport into asynchronous worker threads.

### Q28: What are the key limitations of microservices you experienced?
**Answer:**  
1. Increased operational complexity (managing 6 separate services vs. 1 monolithic jar).
2. Distributed tracing and debugging require structured centralized logging.
3. Eventual consistency considerations during inter-service network calls.

### Q29: What future enhancements are planned for VAYRO?
**Answer:**  
1. Real-time GPS telematics and IoT vehicle tracking.
2. WebSocket-based live fleet availability streaming.
3. AI/ML-driven dynamic seasonal pricing models.
4. Mobile application support using React Native.

### Q30: How do you ensure secrets are not compromised in production?
**Answer:**  
Zero secrets are hardcoded in the codebase. Sensitive values (JWT secrets, database passwords, SMTP app passwords) are injected exclusively via external environment variables (`JWT_SECRET`, `DB_PASSWORD`, `MAIL_PASSWORD`) in local `.env` files and Render cloud configuration dashboards.
