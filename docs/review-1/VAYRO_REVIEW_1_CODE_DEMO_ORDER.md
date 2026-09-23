# VAYRO — Master Faculty Demonstration Order (Review 1)

This master document outlines the 18-step live code demonstration sequence for Review 1.

---

### STEP 01 — Project Architecture
- **FILE:** `README.md`
- **PATH:** `README.md`
- **WHAT TO SHOW:** Repository architecture tree and microservice port layout (Eureka `:8761`, Gateway `:8080`, User `:8081`, Vehicle `:8082`, Booking `:8083`, Notification `:8084`, Frontend `:5173`).
- **WHAT TO SAY:** "VAYRO is engineered as a cloud-native, Spring Boot 3.4 & Java 21 microservices architecture. All client traffic enters through the API Gateway, services register with Eureka, and authentication is stateless via JWT."
- **WHY IT MATTERS:** Establishes the enterprise multi-module foundation before diving into code.

---

### STEP 02 — Eureka Server
- **FILE:** `EurekaServerApplication.java`
- **PATH:** `backend/vayro-backend/eureka-server/src/main/java/com/vayro/eureka/EurekaServerApplication.java`
- **CLASS:** `EurekaServerApplication`
- **WHAT TO SHOW:** `@EnableEurekaServer` annotation and Spring Boot main class.
- **WHAT TO SAY:** "This is our central Service Discovery Registry. It runs on port 8761 and allows microservices to locate each other dynamically without hardcoded IP addresses."
- **WHY IT MATTERS:** Core Rubric 2 requirement for microservice discovery.

---

### STEP 03 — Microservice Registration
- **FILE:** `application.yml`
- **PATH:** `backend/vayro-backend/user-service/src/main/resources/application.yml`
- **WHAT TO SHOW:** `eureka.client.service-url.defaultZone: http://localhost:8761/eureka/` and `spring.application.name: USER-SERVICE`.
- **WHAT TO SAY:** "Each microservice declares its logical application name and connects to the Eureka registry on startup to publish its heartbeat and IP/port metadata."
- **WHY IT MATTERS:** Demonstrates automated service registration.

---

### STEP 04 — API Gateway Routing
- **FILE:** `application.yml`
- **PATH:** `backend/vayro-backend/api-gateway/src/main/resources/application.yml`
- **WHAT TO SHOW:** Gateway routes `user-auth-route`, `user-service-route`, `vehicle-service-route`, `booking-service-route`, `notification-service-route` using `lb://<SERVICE_NAME>`.
- **WHAT TO SAY:** "The API Gateway runs on port 8080 and acts as the single reverse proxy entry point. The `lb://` prefix leverages Spring Cloud LoadBalancer to resolve service names directly from Eureka."
- **WHY IT MATTERS:** Satisfies Rubric 4 (API Gateway Configuration).

---

### STEP 05 — JWT Configuration
- **FILE:** `application.yml`
- **PATH:** `backend/vayro-backend/user-service/src/main/resources/application.yml`
- **WHAT TO SHOW:** `jwt.secret` and `jwt.expiration: 86400000` (24 hours).
- **WHAT TO SAY:** "JWT settings are externalized into environment variables. Tokens are signed using HMAC-SHA256 with a 256-bit secret and have a 24-hour expiration."
- **WHY IT MATTERS:** Proves secure cryptographic configuration.

---

### STEP 06 — JWT Generation
- **FILE:** `JwtService.java`
- **PATH:** `backend/vayro-backend/user-service/src/main/java/com/vayro/users/security/JwtService.java`
- **CLASS:** `JwtService`
- **METHOD:** `generateToken(Map<String, Object> extraClaims, UserDetails userDetails)`
- **WHAT TO SHOW:** Creation of JWT claims (`userId`, `role`, `name`, `sub`) and signing via `Jwts.builder().signWith(getSigningKey())`.
- **WHAT TO SAY:** "When a user logs in, User Service builds a signed JWT embedding the user ID, email subject, and assigned role."
- **WHY IT MATTERS:** Satisfies Rubric 3 (JWT Token Generation).

---

### STEP 07 — JWT Validation
- **FILE:** `JwtService.java`
- **PATH:** `backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtService.java`
- **CLASS:** `JwtService`
- **METHOD:** `isTokenValid(String token)` and `extractAllClaims(String token)`
- **WHAT TO SHOW:** `Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token)` and expiration check.
- **WHAT TO SAY:** "The Gateway validates the cryptographic signature and expiration on incoming requests before routing them downstream."
- **WHY IT MATTERS:** Proves edge-level stateless security.

---

### STEP 08 — Spring Security (Gateway WebFlux)
- **FILE:** `SecurityConfig.java`
- **PATH:** `backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/config/SecurityConfig.java`
- **CLASS:** `SecurityConfig`
- **METHOD:** `securityWebFilterChain(ServerHttpSecurity http)`
- **WHAT TO SHOW:** Path matching rules dividing public endpoints (`/api/auth/**`, `/api/vehicles/**`, `/api/bookings/availability/**`) from protected routes (`/api/bookings/**`, `/api/users/**`).
- **WHAT TO SAY:** "Security rules are enforced reactively in WebFlux. Public browsing is open to guests, but booking mutations and profile views require authentication."
- **WHY IT MATTERS:** Demonstrates comprehensive endpoint authorization.

---

### STEP 09 — Role-Based Access Control (RBAC)
- **FILE:** `JwtReactiveAuthenticationManager.java`
- **PATH:** `backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtReactiveAuthenticationManager.java`
- **CLASS:** `JwtReactiveAuthenticationManager`
- **METHOD:** `authenticate(Authentication authentication)`
- **WHAT TO SHOW:** Extraction of `role` claim, prefixing with `ROLE_`, and constructing `SimpleGrantedAuthority`.
- **WHAT TO SAY:** "Claims extracted from the verified token are transformed into Spring Security granted authorities like `ROLE_USER` and `ROLE_ADMIN`."
- **WHY IT MATTERS:** Satisfies RBAC requirement for multi-role security.

---

### STEP 10 — User Authentication Flow
- **FILE:** `AuthController.java` & `AuthService.java`
- **PATH:** `backend/vayro-backend/user-service/src/main/java/com/vayro/users/controller/AuthController.java` & `AuthService.java`
- **CLASS:** `AuthController` / `AuthService`
- **METHOD:** `login(LoginRequest request)`
- **WHAT TO SHOW:** Checking password hash with `passwordEncoder.matches()` and returning `AuthResponse` with JWT.
- **WHAT TO SAY:** "Passwords are never stored in plaintext—they are hashed using BCrypt. Upon successful verification, an authentication response containing the token is returned."
- **WHY IT MATTERS:** Proves end-to-end credential authentication.

---

### STEP 11 — Vehicle Service Fleet Catalog
- **FILE:** `VehicleController.java`
- **PATH:** `backend/vayro-backend/vehicle-service/src/main/java/com/vayro/vehicles/controller/VehicleController.java`
- **CLASS:** `VehicleController`
- **METHOD:** `getAllVehicles(...)` and `getVehicleById(...)`
- **WHAT TO SHOW:** Public fleet catalogue query with dynamic filtering, pagination, and sorting.
- **WHAT TO SAY:** "Vehicle Service manages our 207-vehicle catalogue across luxury cars, SUVs, and premium motorcycles with real-time status tracking."
- **WHY IT MATTERS:** Demonstrates the core business catalog domain.

---

### STEP 12 — Booking Service
- **FILE:** `BookingController.java`
- **PATH:** `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/controller/BookingController.java`
- **CLASS:** `BookingController`
- **METHOD:** `createBooking(...)` and `getMyBookings(...)`
- **WHAT TO SHOW:** `@AuthenticationPrincipal AuthenticatedUser currentUser` injected into controller methods.
- **WHAT TO SAY:** "The booking endpoint extracts the authenticated user principal directly from the security context, guaranteeing users can only book for themselves."
- **WHY IT MATTERS:** Proves secure user context binding.

---

### STEP 13 — Service-to-Service Communication
- **FILE:** `VehicleServiceClientImpl.java` & `RestClientConfig.java`
- **PATH:** `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/client/VehicleServiceClientImpl.java`
- **CLASS:** `VehicleServiceClientImpl`
- **METHOD:** `getVehicleById(String vehicleId)`
- **WHAT TO SHOW:** `restClient.get().uri("/api/vehicles/{id}", vehicleId)` querying `http://VEHICLE-SERVICE`.
- **WHAT TO SAY:** "Booking Service uses a `@LoadBalanced RestClient` to resolve `http://VEHICLE-SERVICE` via Eureka to verify vehicle existence and pricing synchronously."
- **WHY IT MATTERS:** Crucial demonstration of synchronous microservice communication.

---

### STEP 14 — Database Persistence & Entity Mapping
- **FILE:** `Booking.java` & `BookingRepository.java`
- **PATH:** `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/entity/Booking.java`
- **CLASS:** `Booking`
- **WHAT TO SHOW:** JPA `@Entity`, `@Table(name = "bookings")`, `@Enumerated(EnumType.STRING)`, and financial calculation fields.
- **WHAT TO SAY:** "Data is persisted into PostgreSQL via Hibernate ORM. We enforce strict data types, foreign keys, and indexes on booking references."
- **WHY IT MATTERS:** Proves database integration and ORM modeling.

---

### STEP 15 — Booking Overlap & Conflict Prevention
- **FILE:** `BookingRepository.java`
- **PATH:** `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/repository/BookingRepository.java`
- **CLASS:** `BookingRepository`
- **METHOD:** `findOverlappingBookings(...)`
- **WHAT TO SHOW:** JPQL `@Query("SELECT b FROM Booking b WHERE b.vehicleId = :vehicleId AND b.status IN (:blockingStatuses) AND b.pickupDateTime < :returnDateTime AND b.returnDateTime > :pickupDateTime")`.
- **WHAT TO SAY:** "To prevent double-booking, we execute a mathematical interval overlap query before confirming any reservation: an existing booking overlaps if its start is before the requested end and its end is after the requested start."
- **WHY IT MATTERS:** Demonstrates critical business logic and race-condition prevention.

---

### STEP 16 — Asynchronous Notification & Invoice Dispatch
- **FILE:** `NotificationServiceClientImpl.java` & `NotificationServiceImpl.java`
- **PATH:** `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/client/NotificationServiceClientImpl.java`
- **CLASS:** `NotificationServiceClientImpl`
- **METHOD:** `sendBookingConfirmedNotificationAsync(Booking booking)`
- **WHAT TO SHOW:** `@Async` non-blocking POST to `http://NOTIFICATION-SERVICE/api/notifications/booking-confirmed`.
- **WHAT TO SAY:** "Booking confirmation triggers an asynchronous call to Notification Service, which generates a PDF invoice via OpenPDF and dispatches a confirmation email via Gmail SMTP without delaying the HTTP response."
- **WHY IT MATTERS:** Demonstrates asynchronous microservice integration.

---

### STEP 17 — Frontend Token Interception & Session
- **FILE:** `api.js` & `AuthContext.jsx`
- **PATH:** `frontend/src/services/api.js`
- **WHAT TO SHOW:** `api.interceptors.request.use()` reading `vayro_session` from `localStorage` and adding `config.headers.Authorization = 'Bearer ' + session.token`.
- **WHAT TO SAY:** "On the frontend, Axios interceptors seamlessly attach the JWT Bearer token to all protected API calls, maintaining stateless user sessions across page reloads."
- **WHY IT MATTERS:** Links frontend client architecture with backend security.

---

### STEP 18 — Complete Live User Flow
- **WHAT TO SHOW:** Browser demo:
  1. Open Eureka Dashboard at `http://localhost:8761` showing all 5 instances `UP`.
  2. Open Frontend at `http://localhost:5173`.
  3. Sign in as a user (`johndoe@vayro.com`).
  4. Select a vehicle (e.g., Aprilia RS 457).
  5. Select dates & proceed through the 5-step checkout.
  6. Finalize payment and view confirmed reservation with booking reference.
  7. Open 'My Bookings' to verify immediate persistence.
- **WHAT TO SAY:** "This completes the end-to-end flow from client UI through API Gateway, Eureka discovery, JWT authentication, inter-service verification, PostgreSQL persistence, and asynchronous invoice delivery."
