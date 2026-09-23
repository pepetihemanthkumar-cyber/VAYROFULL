# LinkedIn Article Draft

**Title:** VAYRO: Building a Secure Microservice-Based Fleet Rental Platform  
**Target Platform:** LinkedIn Technical Article / Engineering Blog Post  
**Author:** VAYRO Engineering Team  
**Status:** DRAFT (Prepared for Manual Review & Publishing)  

> **Note for Student/Author:** This is a comprehensive technical article draft detailing the VAYRO project architecture and design. You can copy, customize, and publish this draft directly on LinkedIn or your portfolio blog.

---

# VAYRO: Building a Secure Microservice-Based Fleet Rental Platform

In the evolving landscape of modern urban mobility, vehicle rental and fleet management operations require seamless digital workflows, bulletproof transaction security, and scalable distributed architectures. 

As part of our academic engineering capstone project, our team engineered **VAYRO — a Fleet Lifecycle & Rental Asset Management Platform**. Built with Java 21, Spring Boot 3.4.3, Spring Cloud 2024.0.0, React 19.1.0, and PostgreSQL on Supabase, VAYRO transitions legacy, paper-driven rental workflows into an enterprise-grade cloud ecosystem.

Here is a detailed breakdown of how we architected, engineered, and secured VAYRO.

---

## 1. Introduction
Urban commuters and corporate organizations increasingly prioritize temporary mobility access over the overhead of vehicle ownership. However, building a scalable rental platform involves intricate technical challenges: managing real-time vehicle availability across multi-tier vehicle categories, preventing booking schedule collisions, guaranteeing financial calculation precision, and securing administrative operations against unauthorized access.

## 2. Industry & Problem Context
Traditional vehicle rental systems often rely on fragmented spreadsheets, offline ledgers, or monolithic software architectures. In high-demand scenarios (such as holiday weekends or urban rush hours), these legacy setups suffer from significant operational bottlenecks: double-booked vehicles, inaccurate pricing calculations, delayed invoices, and single-point-of-failure downtimes.

## 3. Problem Analysis
Our initial system audit identified five primary failure modes in conventional rental software:
1. **Opaque Availability:** Lack of real-time query engines leading to customer reservation conflicts.
2. **Coupled Monoliths:** A failure in an auxiliary subsystem (such as an external email gateway) causing entire booking transactions to abort.
3. **Security Deficits:** Reliance on plaintext passwords or session cookies prone to cross-site request forgery (CSRF).
4. **Billing Inaccuracies:** Floating-point rounding errors in tax and discount calculations.
5. **Limited Fleet Visibility:** Inability for fleet managers to synchronize vehicle handoffs (`AVAILABLE` $\leftrightarrow$ `RENTED`) in real time.

## 4. The Proposed VAYRO Solution
To eliminate these bottlenecks, we designed **VAYRO** as a distributed, microservice-driven platform. The architecture segregates domain responsibilities across independent, containerized services connected via dynamic service discovery and protected by an intelligent perimeter API Gateway.

```
React 19 SPA (Vercel)
        │
        ▼ (HTTPS / JSON)
API Gateway [Port 8080] (Spring Cloud Gateway, Netty, JWT, CORS)
        │
   ┌────┴────────────────────────┬─────────────────────────┬────────────────────────┐
   ▼                             ▼                         ▼                        ▼
User Service [8081]     Vehicle Service [8082]   Booking Service [8083]   Notification Service [8084]
(Auth, JWT, BCrypt)     (Fleet Catalog, Specs)   (Availability, Math)     (OpenPDF, SMTP Email)
   │                             │                         │                        │
   └─────────────────────────────┼─────────────────────────┴────────────────────────┘
                                 ▼
                     Eureka Server [Port 8761] (Netflix Service Discovery)
                                 │
                     PostgreSQL / Supabase (Cloud Persistence)
```

## 5. Microservice Architecture
VAYRO is partitioned into six specialized services:
- **Eureka Server (Port 8761):** Provides dynamic service registry and instance health tracking.
- **API Gateway (Port 8080):** Serves as the single perimeter reverse proxy, handling CORS, rate limiting, and JWT validation.
- **User Service (Port 8081):** Manages user registration, BCrypt credential hashing, role assignments, and Google OAuth2 verification.
- **Vehicle Service (Port 8082):** Maintains the fleet catalog, technical specifications, and operational status flags.
- **Booking Service (Port 8083):** Governs reservation availability checks, mathematical pricing calculations, and rental lifecycle state transitions.
- **Notification Service (Port 8084):** Generates tamper-evident vector PDF invoices and dispatches asynchronous confirmation emails.

## 6. Eureka Service Discovery
In a distributed cloud environment, hardcoding IP addresses or ports creates brittle configurations. With Netflix Eureka, every microservice registers on startup (`spring.application.name`) and sends periodic heartbeats. When services communicate, they discover healthy endpoints dynamically using logical identifiers (e.g., `lb://VEHICLE-SERVICE`), enabling seamless horizontal scaling.

## 7. Intelligent API Gateway
Built on Spring Cloud Gateway with non-blocking Project Reactor and Netty, our API Gateway serves as the front line of defense:
- Replaces individual service exposure with a unified `/api/**` URL space.
- Applies a global reactive CORS filter supporting both local development and production web domains.
- Intercepts incoming requests, validates JWT cryptographic signatures, and filters unauthorized users before traffic ever touches internal microservices.

## 8. Stateless JWT Authentication & RBAC
Security in VAYRO is rooted in zero-trust stateless tokens:
- **BCrypt Hashing:** Passwords are salted and hashed using BCrypt (work factor 10).
- **Signed Tokens:** Authentication issues HMAC-SHA256 signed JSON Web Tokens containing identity claims (`userId`, `email`, `role`).
- **Granular RBAC:** The system strictly separates rental customers (`ROLE_USER`) from operations managers (`ROLE_ADMIN`). Public user registration strictly assigns `ROLE_USER`, preventing privilege escalation.

## 9. Vehicle & Fleet Lifecycle Management
The Vehicle Service models detailed vehicle specifications—including brand, model, transmission, fuel type, seating capacity, price per day, and operational status (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `INACTIVE`). High-resolution multi-angle photography assets provide customers with clear visibility during vehicle discovery.

## 10. Booking Management & State Machine
Rental reservations follow a strict Finite State Machine:
$$\text{PENDING} \longrightarrow \text{CONFIRMED} \longrightarrow \text{ACTIVE} \longrightarrow \text{RETURNED} \longrightarrow \text{COMPLETED}$$
State transitions are strictly validated. When an Admin activates a rental upon physical vehicle handoff, the Booking Service communicates directly with the Vehicle Service to synchronize the vehicle's status to `RENTED`.

## 11. Concurrency Control & Overlap Prevention
To eliminate double bookings, VAYRO enforces two layers of concurrency protection:
1. **JVM Thread Synchronization:** Hashed lock striping (`synchronized(lockStripe)`) locks reservation creation per vehicle ID.
2. **Deterministic SQL Overlap Query:**
   $$\text{requestedPickup} < \text{existingReturn} \quad \land \quad \text{requestedReturn} > \text{existingPickup}$$
   Any overlapping reservation in `PENDING`, `CONFIRMED`, or `ACTIVE` states is rejected with a descriptive error.

## 12. Notification & OpenPDF Invoice Engine
Upon booking confirmation, the Notification Service compiles an itemized, branded vector PDF invoice using the OpenPDF engine. The invoice details base rental charges, add-ons, discounts, and 18% GST. The PDF is immediately attached to an email dispatched via JavaMailSender. Crucially, email processing runs asynchronously in a decoupled thread pool, ensuring that SMTP delays never block the primary reservation transaction.

## 13. Cloud Persistence with PostgreSQL & Supabase
All entity records are persisted in cloud-hosted PostgreSQL on Supabase. We configured HikariCP connection pooling with SSL mode (`sslmode=require`) and connection timeouts to handle serverless connection limits efficiently.

## 14. Cloud Deployment Architecture
- **Frontend:** React 19 Single-Page Application deployed to the Vercel Edge CDN for sub-second global asset delivery.
- **Backend Microservices:** Containerized Java 21 Spring Boot applications deployed on Render with dynamic `$PORT` bindings.
- **Database:** Supabase Managed PostgreSQL in AWS AP-Southeast-1.

## 15. DTI (Digital Transformation & Innovation) Concepts
VAYRO embodies core DTI principles:
- **Digital Transformation:** Replacing manual vehicle rental handoffs with automated digital self-service.
- **Microservices & Cloud Computing:** Decoupling business domains for elastic scale.
- **Automation:** Automated invoice compilation, pricing computations, and notifications.
- **Zero-Trust Security:** Tokenized perimeter access control and BCrypt cryptography.

## 16. Challenges Encountered & Solutions
- *Challenge:* Preventing race conditions during simultaneous bookings for high-demand vehicles.  
  *Solution:* Implemented lock striping combined with atomic database interval verification.
- *Challenge:* Handling dynamic cloud port assignments on Render without breaking Eureka discovery.  
  *Solution:* Configured Spring Boot port fallbacks (`${SERVER_PORT:${PORT:8080}}`) and Eureka instance mapping.
- *Challenge:* Isolating heavy PDF/SMTP operations from core booking latency.  
  *Solution:* Implemented asynchronous non-blocking REST calls and isolated worker threads.

## 17. Key Lessons Learned
1. Microservices provide exceptional domain isolation, but require robust service discovery and consistent exception handling.
2. Perimeter API Gateways significantly simplify frontend development by centralizing CORS and authentication.
3. Financial computations must always use `BigDecimal` to ensure zero rounding discrepancies.

## 18. Future Roadmap & Enhancements
- Integrating live GPS telematics and IoT vehicle tracking.
- Adding real-time WebSockets for instant fleet status notifications.
- Implementing AI-driven dynamic pricing algorithms based on seasonal demand patterns.

## 19. Conclusion
Engineering VAYRO provided our team with deep practical experience in designing resilient, distributed, and secure microservice architectures. By combining Spring Cloud, PostgreSQL, and React 19, VAYRO demonstrates how modern software engineering can transform conventional mobility and fleet operations.

---

### Hashtags for Publishing:
`#Microservices` `#SpringBoot` `#Java21` `#SpringCloud` `#FullStackDevelopment` `#React19` `#CloudComputing` `#SoftwareEngineering` `#SystemDesign` `#DigitalTransformation`
