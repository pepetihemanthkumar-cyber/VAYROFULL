# VAYRO — Requirements Specification

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — Requirement Specification  
**Architecture:** Distributed Microservices (Spring Boot, Spring Cloud, PostgreSQL, React)  
**Date:** September 2026  
**Document Version:** 1.0.0  

---

## 1. Functional Requirements Specification (FRS)

The functional requirements of VAYRO represent the core business capabilities implemented across the frontend and backend microservices.

```
+-----------------------------------------------------------------------------------+
|                        VAYRO FUNCTIONAL MODULES                                   |
+-----------------------------------------------------------------------------------+
|  [F-01] Identity & Access Management (User Service)                               |
|  [F-02] Fleet & Vehicle Lifecycle Management (Vehicle Service)                     |
|  [F-03] Availability & Overlap Calculation (Booking Service)                       |
|  [F-04] Reservation & Financial Math Engine (Booking Service)                     |
|  [F-05] Rental Lifecycle State Machine (Booking Service)                           |
|  [F-06] Fleet Synchronization & Inter-Service REST Calls (Booking -> Vehicle)      |
|  [F-07] PDF Invoice Generation & Email Dispatch (Notification Service)             |
|  [F-08] Perimeter Routing & Token Validation (API Gateway)                        |
+-----------------------------------------------------------------------------------+
```

---

### F-01: Identity, Authentication & Role Management

| Requirement ID | Requirement Description | Actor | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **FR-01.1** | Register new user accounts with first name, last name, email, phone, and password. | Public | `POST /api/auth/register` (User Service). Strict default `Role.USER`. |
| **FR-01.2** | Verify credentials, authenticate existing users, and issue signed JWTs. | Public | `POST /api/auth/login` (User Service). Returns JWT and user payload. |
| **FR-01.3** | Verify Google OAuth2 ID tokens and provision/authenticate Google-linked accounts. | Public | `POST /api/auth/google` (User Service). Google Client API verifier. |
| **FR-01.4** | Prevent unauthorized privilege escalation during public registration. | Public | Public registrations are hardcoded to `USER` role; `ADMIN` creation is protected. |
| **FR-01.5** | Retrieve authenticated user profile information. | USER, ADMIN | `GET /api/users/profile` (Protected via JWT Bearer). |
| **FR-01.6** | Update customer profile details (name, phone). | USER, ADMIN | `PUT /api/users/profile` (Protected via JWT Bearer). |

---

### F-02: Fleet & Vehicle Management

| Requirement ID | Requirement Description | Actor | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **FR-02.1** | Retrieve complete vehicle catalog with category, transmission, and fuel filtering. | Public, USER, ADMIN | `GET /api/vehicles` (Vehicle Service). Open access via Gateway. |
| **FR-02.2** | Retrieve granular vehicle specifications by vehicle ID. | Public, USER, ADMIN | `GET /api/vehicles/{id}` (Vehicle Service). Returns full specs. |
| **FR-02.3** | Create new fleet vehicle records with specifications, features, and pricing. | ADMIN | `POST /api/vehicles` (Role: `ROLE_ADMIN`). |
| **FR-02.4** | Update vehicle specifications, operational status, or daily rate. | ADMIN | `PUT /api/vehicles/{id}` (Role: `ROLE_ADMIN`). |
| **FR-02.5** | Update operational vehicle status (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `INACTIVE`). | ADMIN / Booking Service | `PATCH /api/vehicles/{id}/status` (Protected / Inter-service). |
| **FR-02.6** | Delete or decommission vehicle asset records. | ADMIN | `DELETE /api/vehicles/{id}` (Role: `ROLE_ADMIN`). |

---

### F-03: Vehicle Availability & Concurrency Control

| Requirement ID | Requirement Description | Actor | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **FR-03.1** | Verify if a vehicle is free during `[pickupDateTime, returnDateTime]`. | Public, USER, ADMIN | `GET /api/bookings/availability?vehicleId=...&pickupDateTime=...&returnDateTime=...` |
| **FR-03.2** | Prevent overlapping reservations for the same vehicle across blocking states. | System | SQL Query checking overlapping intervals across `PENDING`, `CONFIRMED`, `ACTIVE`. |
| **FR-03.3** | Enforce JVM thread synchronization during booking creation to eliminate race conditions. | System | Striped locking mechanism (`synchronized(lockStripe)`) by `vehicleId`. |
| **FR-03.4** | Enforce pickup time strictly in the future (with 5-minute skew buffer) and return after pickup. | System | Validated before processing reservation logic. |

---

### F-04: Booking & Financial Mathematics Engine

| Requirement ID | Requirement Description | Actor | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **FR-04.1** | Calculate duration in days: $\lceil \text{TotalMinutes} / 1440 \rceil$. | System | Java `Duration.between()` calculation with ceiling rounding. |
| **FR-04.2** | Compute base amount: $\text{PricePerDay} \times \text{RentalDays}$. | System | Strict `BigDecimal` arithmetic with 2-decimal scale (`RoundingMode.HALF_UP`). |
| **FR-04.3** | Compute dynamic add-ons sum (insurance, child seat, GPS, etc.). | System | Iterates add-on request collection and calculates line totals. |
| **FR-04.4** | Apply validated discount deductions up to total eligible amount. | System | $\min(\text{Discount}, \text{Base} + \text{AddOns})$. |
| **FR-04.5** | Compute mandatory tax amount: $\text{Subtotal} \times \text{TaxRate}$ (Default 18% GST). | System | Configurable via `${app.booking.tax-rate:0.18}`. |
| **FR-04.6** | Calculate grand total amount: $\text{Subtotal} + \text{TaxAmount}$. | System | Exact monetary balance calculated on backend to prevent client tampering. |
| **FR-04.7** | Idempotent payment callback processing. | System | Matches incoming `paymentOrderId` to return existing record without duplicate booking. |

---

### F-05: Rental Lifecycle State Machine

```
              +-------------------+
              |    [CREATION]     |
              +---------+---------+
                        |
                        v
                 +--------------+
                 |   PENDING    +------------+
                 +------+-------+            |
                        |                    |
             Payment /  | Confirm            |
             Admin      |                    | Cancel
                        v                    |
                 +--------------+            |
                 |  CONFIRMED   +------------+
                 +------+-------+            |
                        |                    |
             Vehicle    | Activate           |
             Hand-off   |                    |
                        v                    |
                 +--------------+            |
                 |    ACTIVE    |            |
                 +------+-------+            |
                        |                    |
             Vehicle    | Return             |
             Hand-in    |                    |
                        v                    |
                 +--------------+            v
                 |   RETURNED   |    +---------------+
                 +------+-------+    |   CANCELLED   |
                        |            +---------------+
             Admin      | Complete
             Audit      |
                        v
                 +--------------+
                 |  COMPLETED   |
                 +--------------+
```

| State Transition | Trigger Event | Allowed Actor | Vehicle Status Impact |
| :--- | :--- | :--- | :--- |
| $\to$ `PENDING` | User creates unpaid reservation request. | USER | Unchanged (`AVAILABLE`) |
| $\to$ `CONFIRMED` | Payment verified or Admin confirms booking. | USER / ADMIN | Unchanged (`AVAILABLE` until handoff) |
| `CONFIRMED` $\to$ `ACTIVE` | Customer takes custody of vehicle (Hand-off). | ADMIN | Changes to `RENTED` |
| `ACTIVE` $\to$ `RETURNED` | Customer brings vehicle back to fleet station. | ADMIN | Changes back to `AVAILABLE` |
| `RETURNED` $\to$ `COMPLETED`| Odometer, fuel, inspection verified; deposit settled. | ADMIN | Maintains `AVAILABLE` |
| `PENDING`/`CONFIRMED` $\to$ `CANCELLED` | User or Admin cancels booking prior to activation. | USER / ADMIN | Maintains `AVAILABLE`; refund triggered |

---

### F-06: Asynchronous Notifications & PDF Invoices

| Requirement ID | Requirement Description | Actor | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **FR-06.1** | Generate tamper-evident vector PDF invoices with itemized financial breakdown. | System | OpenPDF library in `notification-service` (`PdfInvoiceGenerator`). |
| **FR-06.2** | Dispatch transactional confirmation emails with attached PDF invoice. | System | JavaMailSender via SMTP to customer email address asynchronously. |
| **FR-06.3** | Dispatch vehicle return confirmation alerts to fleet managers upon vehicle check-in. | System | Asynchronously dispatches alert to operations team (`admin@vayro.com`). |
| **FR-06.4** | Isolate notification failures from booking transactions (Fault Isolation). | System | Non-blocking `CompletableFuture` / try-catch execution; booking never rolls back. |
| **FR-06.5** | Download PDF invoice on-demand from frontend. | USER, ADMIN | `GET /api/notifications/invoice/{bookingReference}`. |

---

## 2. Non-Functional Requirements Specification (NFRS)

### 2.1 Security Requirements (NFR-SEC)
1. **Stateless Authentication:** All secured endpoints must authenticate via standard `Authorization: Bearer <token>` HTTP headers.
2. **Cryptographic Hashing:** Passwords must be hashed using BCrypt with minimum strength factor 10 before persisting.
3. **Role-Based Authorization:** Strict separation between `ROLE_USER` and `ROLE_ADMIN` enforced at both Gateway and microservice levels.
4. **Zero Hardcoded Secrets:** JWT signing keys, database passwords, and SMTP credentials must be injected dynamically via environment variables.
5. **CORS Enforcement:** Gateway must strictly filter allowed cross-origin domains and methods.

### 2.2 Scalability & Performance Requirements (NFR-PERF)
1. **Microservice Scalability:** Each microservice can be independently scaled horizontally behind the Eureka service discovery registry and Spring Cloud Gateway load balancer.
2. **Connection Pooling:** HikariCP connection pool configured per service with bounded connections (3-5 pool size) tailored for serverless/pooled PostgreSQL instances (Supabase).
3. **Response Latency:** Vehicle catalog browsing $\le 100\text{ms}$; booking creation transaction $\le 300\text{ms}$.

### 2.3 Reliability & Fault Tolerance (NFR-REL)
1. **Asynchronous Decoupling:** Heavy I/O tasks (PDF generation, SMTP email transport) must execute asynchronously to prevent thread pool starvation.
2. **Idempotency:** Payment webhooks and booking creation requests containing unique order IDs must prevent duplicate charging and duplicate booking records.
3. **Fail-Safe Service Discovery:** Gateway routes traffic using `lb://<SERVICE-NAME>` dynamic discovery without depending on hardcoded IP addresses.

### 2.4 Data Integrity & Precision (NFR-DATA)
1. **Financial Accuracy:** All monetary calculations (Base, Add-ons, Discounts, Taxes, Grand Total) must use `java.math.BigDecimal` to eliminate floating-point rounding errors.
2. **Relational Constraints:** Foreign keys, unique email indexes, unique booking references, and date check constraints enforced at the database level.
3. **Database Portability:** JPA/Hibernate configuration compliant with PostgreSQL standards and cloud hosting requirements.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | HTTP Method | Public | `ROLE_USER` | `ROLE_ADMIN` |
| :--- | :--- | :---: | :---: | :---: |
| `/api/auth/register` | POST | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/api/auth/login` | POST | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/api/auth/google` | POST | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/api/vehicles` (List Catalog) | GET | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/api/vehicles/{id}` (Details) | GET | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/api/vehicles` (Create Vehicle) | POST | :x: | :x: | :white_check_mark: |
| `/api/vehicles/{id}` (Update Specs) | PUT | :x: | :x: | :white_check_mark: |
| `/api/vehicles/{id}/status` | PATCH | :x: | :x: | :white_check_mark: |
| `/api/vehicles/{id}` (Delete Vehicle) | DELETE | :x: | :x: | :white_check_mark: |
| `/api/bookings/availability` | GET | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/api/bookings` (Create Reservation) | POST | :x: | :white_check_mark: | :white_check_mark: |
| `/api/bookings/my` (User's Bookings) | GET | :x: | :white_check_mark: | :white_check_mark: |
| `/api/bookings/{id}` (Own Booking) | GET | :x: | :white_check_mark: (Own) | :white_check_mark: (All) |
| `/api/bookings` (Platform Bookings) | GET | :x: | :x: | :white_check_mark: |
| `/api/bookings/{id}/confirm` | PATCH | :x: | :x: | :white_check_mark: |
| `/api/bookings/{id}/activate` | PATCH | :x: | :x: | :white_check_mark: |
| `/api/bookings/{id}/return` | PATCH | :x: | :x: | :white_check_mark: |
| `/api/bookings/{id}/complete` | PATCH | :x: | :x: | :white_check_mark: |
| `/api/bookings/{id}/cancel` | PATCH | :x: | :white_check_mark: (Own) | :white_check_mark: (All) |
| `/api/notifications/invoice/{ref}` | GET | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/api/users/profile` | GET / PUT | :x: | :white_check_mark: | :white_check_mark: |
