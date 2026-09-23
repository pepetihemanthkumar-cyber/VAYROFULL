# VAYRO — API Gateway Architecture & Configuration

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — API Gateway Configuration & Routing  
**Gateway Engine:** Spring Cloud Gateway (Spring Boot 3.4.3, Spring Cloud 2024.0.0, Project Reactor, Netty)  
**Date:** September 2026  
**Document Version:** 1.1.0  

---

## 1. API Gateway Role & Purpose

In a distributed microservice architecture, exposing individual microservices directly to client applications (browsers, mobile apps) introduces severe security risks, operational complexity, and network inefficiencies. 

The **VAYRO API Gateway** functions as the unified perimeter entry point (Port 8080) for the entire platform. Built on the asynchronous, non-blocking **Spring Cloud Gateway (WebFlux / Netty)** engine, it handles reverse proxy routing, load balancing, perimeter JWT authentication, cross-origin resource sharing (CORS), and structured error translation.

```
                             +-------------------------------------+
                             |          CLIENT APPLICATION         |
                             |      (React 19 SPA / Browser)       |
                             +------------------+------------------+
                                                |
                                          HTTPS / REST
                                                |
                             +------------------v------------------+
                             |             API GATEWAY             |
                             |         (Default Port 8080)         |
                             |  - Dynamic $PORT Binding            |
                             |  - Global CORS Handler              |
                             |  - JWT Authentication WebFilter     |
                             |  - Structured Error Formatter       |
                             +------------------+------------------+
                                                |
                     +--------------------------+--------------------------+
                     |                          |                          |
       Path: /api/auth/**         Path: /api/vehicles/**      Path: /api/bookings/**
       Path: /api/users/**                      |                          |
                     |                          |                          |
          lb://USER-SERVICE          lb://VEHICLE-SERVICE       lb://BOOKING-SERVICE
                     |                          |                          |
                     v                          v                          v
             +---------------+          +---------------+          +---------------+
             | USER SERVICE  |          |VEHICLE SERVICE|          |BOOKING SERVICE|
             |   Port 8081   |          |   Port 8082   |          |   Port 8083   |
             +---------------+          +---------------+          +-------+-------+
                                                                           |
                                                              Path: /api/notifications/**
                                                              lb://NOTIFICATION-SERVICE
                                                                           |
                                                                           v
                                                                   +---------------+
                                                                   | NOTIFICATION  |
                                                                   |    SERVICE    |
                                                                   |   Port 8084   |
                                                                   +---------------+
```

---

## 2. Why API Gateway vs. Direct Microservice Exposure?

| Comparison Factor | Direct Service Exposure (Anti-Pattern) | VAYRO API Gateway Approach (Best Practice) |
| :--- | :--- | :--- |
| **Network Endpoints** | Client must track 5+ different IP/port combinations. | Single unified entry point on port 8080 (`/api/**`). |
| **Security Surface** | Every microservice must expose public ports to the internet. | Only Gateway is exposed; microservices live in private network mesh. |
| **CORS Configuration** | Complex CORS boilerplate replicated in every service. | Centralized global CORS filter configured in one place. |
| **Authentication** | Token parsing logic duplicated in every service. | Perimeter JWT filter validates tokens before routing downstream. |
| **Service Discovery** | Client cannot resolve dynamic cloud ports. | Gateway resolves service instances dynamically via Eureka (`lb://`). |
| **Coupling** | Frontend tightly coupled to internal backend service topology. | Internal architecture changes do not break client contracts. |

---

## 3. Dynamic Routing Table Configuration

The API Gateway routes client requests based on path predicates, forwarding traffic to the corresponding microservice registered in Eureka using the `lb://` (Load Balanced) scheme:

```yaml
spring:
  cloud:
    gateway:
      httpclient:
        connect-timeout: ${GATEWAY_CONNECT_TIMEOUT:3000}
        response-timeout: ${GATEWAY_RESPONSE_TIMEOUT:5s}
      routes:
        # Route 1: Authentication Endpoints -> User Service
        - id: user-auth-route
          uri: lb://USER-SERVICE
          predicates:
            - Path=/api/auth/**

        # Route 2: User Profile Endpoints -> User Service
        - id: user-service-route
          uri: lb://USER-SERVICE
          predicates:
            - Path=/api/users/**

        # Route 3: Fleet & Vehicle Catalog -> Vehicle Service
        - id: vehicle-service-route
          uri: lb://VEHICLE-SERVICE
          predicates:
            - Path=/api/vehicles/**

        # Route 4: Reservations & Availability -> Booking Service
        - id: booking-service-route
          uri: lb://BOOKING-SERVICE
          predicates:
            - Path=/api/bookings/**

        # Route 5: Invoices & Notifications -> Notification Service
        - id: notification-service-route
          uri: lb://NOTIFICATION-SERVICE
          predicates:
            - Path=/api/notifications/**
```

---

## 4. Perimeter Security & Path Access Rules

In `SecurityConfig.java`, the Gateway defines granular permission rules using Spring Security Reactive `ServerHttpSecurity`:

```
+---------------------------------------------+------------------------------------+--------------------------+
| Request Path Pattern                        | HTTP Method(s)                     | Gateway Access Rule      |
+---------------------------------------------+------------------------------------+--------------------------+
| /actuator/health, /actuator/info            | GET                                | permitAll()              |
| /api/auth/register, login, google           | POST                               | permitAll()              |
| /api/vehicles/**                            | GET                                | permitAll()              |
| /api/bookings/availability/**               | GET                                | permitAll()              |
| /api/notifications/status/**, invoice/**    | GET                                | permitAll()              |
| /api/users/**                               | GET, PUT                           | authenticated()          |
| /api/bookings/**                            | POST, GET, PATCH                   | authenticated()          |
| /api/vehicles/** (Create/Update/Delete)     | POST, PUT, PATCH, DELETE           | authenticated() (ADMIN)  |
| /** (CORS Preflight)                        | OPTIONS                            | permitAll()              |
+---------------------------------------------+------------------------------------+--------------------------+
```

---

## 5. Cross-Origin Resource Sharing (CORS) Architecture

To allow seamless communication between the React 19 frontend (running locally on `http://localhost:5173` or in production on `https://vayro.com` / Vercel) and the API Gateway, a reactive `CorsWebFilter` is configured with highest precedence (`@Order(Ordered.HIGHEST_PRECEDENCE)`):

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    // Dynamically supports local development and production URLs
    config.addAllowedOriginPattern("http://localhost:*");
    config.addAllowedOriginPattern("https://vayro.com");
    config.addAllowedOriginPattern("${CORS_ALLOWED_ORIGINS:http://localhost:5173}");
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("Authorization"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    return exchange -> config;
}
```

---

## 6. Structured Error Handling

When unauthenticated or unauthorized requests reach the Gateway, it returns consistent, RFC 7807-compliant JSON error payloads instead of blank HTML error pages:

### 6.1 Unauthorized Response (`401 UNAUTHORIZED`)
```json
{
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Authentication is required.",
  "path": "/api/bookings"
}
```

### 6.2 Forbidden Response (`403 FORBIDDEN`)
```json
{
  "status": 403,
  "error": "FORBIDDEN",
  "message": "Access denied.",
  "path": "/api/vehicles"
}
```

---

## 7. Cloud Container Compatibility (`$PORT` Binding)

Cloud hosting platforms like Render assign random port bindings at runtime via the `PORT` environment variable. The Gateway's `application.yml` dynamically evaluates:

```yaml
server:
  port: ${SERVER_PORT:${PORT:8080}}
```

This guarantees that the gateway operates flawlessly on standard local port 8080 during development and dynamically adapts to containerized cloud runtime environments.
