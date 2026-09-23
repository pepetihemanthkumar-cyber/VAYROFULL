# VAYRO — Faculty Code Demonstration Checklist (Review 1)

Use this quick checklist during your live faculty viva to open and explain code files in the optimal sequence.

---

### [ ] 01. `backend/vayro-backend/eureka-server/src/main/java/com/vayro/eureka/EurekaServerApplication.java`
- **Purpose:** Eureka Service Discovery Registry Server entry point.
- **Show:** `@EnableEurekaServer` annotation and port `:8761`.

### [ ] 02. `backend/vayro-backend/eureka-server/src/main/resources/application.yml`
- **Purpose:** Standalone Eureka Server configuration.
- **Show:** `register-with-eureka: false`, `fetch-registry: false`, and `defaultZone`.

### [ ] 03. `backend/vayro-backend/api-gateway/src/main/resources/application.yml`
- **Purpose:** API Gateway dynamic routing and service discovery.
- **Show:** `routes` mapping `/api/auth/**`, `/api/users/**`, `/api/vehicles/**`, `/api/bookings/**`, `/api/notifications/**` using `lb://<SERVICE-NAME>`.

### [ ] 04. `backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/config/SecurityConfig.java`
- **Purpose:** Gateway WebFlux Reactive Security, public/private route definitions, and CORS filter.
- **Show:** `pathMatchers` for public auth/catalog vs protected booking/user routes, and `AuthenticationWebFilter`.

### [ ] 05. `backend/vayro-backend/user-service/src/main/resources/application.yml`
- **Purpose:** JWT secret, token expiration (24h), and database connection parameters.
- **Show:** `jwt.secret`, `jwt.expiration`, and PostgreSQL datasource configuration.

### [ ] 06. `backend/vayro-backend/user-service/src/main/java/com/vayro/users/security/JwtService.java`
- **Purpose:** Cryptographic JWT token generation and claims creation.
- **Show:** `generateToken()` method with claims (`userId`, `role`, `name`, `sub`).

### [ ] 07. `backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtService.java`
- **Purpose:** Gateway-level JWT validation and cryptographic signature verification.
- **Show:** `isTokenValid()` and claim extraction methods (`extractUsername`, `extractRole`).

### [ ] 08. `backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtReactiveAuthenticationManager.java`
- **Purpose:** Reactive authentication conversion from JWT to Spring Security `Authentication` token with `SimpleGrantedAuthority`.
- **Show:** `authenticate()` method mapping role to `ROLE_USER` / `ROLE_ADMIN`.

### [ ] 09. `backend/vayro-backend/user-service/src/main/java/com/vayro/users/controller/AuthController.java`
- **Purpose:** Public authentication REST API endpoints.
- **Show:** `POST /api/auth/register` and `POST /api/auth/login` returning JWT bearer token.

### [ ] 10. `backend/vayro-backend/user-service/src/main/java/com/vayro/users/service/AuthService.java`
- **Purpose:** Authentication business logic, password hashing via BCrypt, and token minting.
- **Show:** `login()` verifying credentials with `PasswordEncoder.matches()` and issuing token via `jwtService.generateToken()`.

### [ ] 11. `backend/vayro-backend/user-service/src/main/java/com/vayro/users/entity/User.java`
- **Purpose:** Relational User model with Role-Based Access Control enum.
- **Show:** JPA annotations (`@Entity`, `@Table(name = "users")`), `Role` enum, and password hash field.

### [ ] 12. `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/config/RestClientConfig.java`
- **Purpose:** Load-balanced synchronous HTTP client for inter-service communication.
- **Show:** `@Bean @LoadBalanced RestClient.Builder` resolving Eureka virtual hostnames.

### [ ] 13. `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/client/VehicleServiceClientImpl.java`
- **Purpose:** Inter-service call from Booking Service to Vehicle Service.
- **Show:** Calling `http://VEHICLE-SERVICE/api/vehicles/{id}` and forwarding Bearer JWT on status updates.

### [ ] 14. `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/client/NotificationServiceClientImpl.java`
- **Purpose:** Asynchronous inter-service notification dispatch.
- **Show:** `@Async` method `sendBookingConfirmedNotificationAsync()` posting to `http://NOTIFICATION-SERVICE/api/notifications/booking-confirmed`.

### [ ] 15. `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/repository/BookingRepository.java`
- **Purpose:** Interval overlap conflict detection using Spring Data JPA.
- **Show:** `@Query` in `findOverlappingBookings()` enforcing `pickupDateTime < :returnDateTime AND returnDateTime > :pickupDateTime`.

### [ ] 16. `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/service/BookingServiceImpl.java`
- **Purpose:** Booking lifecycle, availability validation, price calculation (18% GST), and notification trigger.
- **Show:** `createBooking()` verifying vehicle existence, checking zero-overlap, saving reservation, and triggering email/invoice.

### [ ] 17. `backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/controller/BookingController.java`
- **Purpose:** Protected booking endpoints requiring authentication.
- **Show:** `@PostMapping` and `@GetMapping("/my")` extracting `@AuthenticationPrincipal AuthenticatedUser currentUser`.

### [ ] 18. `frontend/src/services/api.js`
- **Purpose:** Frontend Axios instance with automatic JWT Authorization header injection.
- **Show:** `api.interceptors.request.use()` injecting `Bearer ${session.token}`.
