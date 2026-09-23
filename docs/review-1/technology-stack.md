# VAYRO — Technology Stack & Engineering Tools

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — Technology Stack  
**Date:** September 2026  
**Document Version:** 1.1.0  

---

## 1. Overview of Technology Stack

The VAYRO platform is built upon modern, industry-standard technologies selected to ensure modularity, high performance, strict type safety, data integrity, and seamless cloud deployment. All versions listed below strictly match the production configuration in `package.json` and Maven `pom.xml`.

```
+-----------------------------------------------------------------------------------+
|                            VAYRO TECHNOLOGY MATRIX                                |
+-----------------------------------------------------------------------------------+
| Client Tier       : React 19.1.0 | Vite 6.3.3 | Tailwind CSS 3.4.17 | Framer Motion 12.6.2 | Axios 1.8.4 |
| Microservice Tier : Java 21 LTS | Spring Boot 3.4.3 | Spring Cloud 2024.0.0       |
| Service Discovery : Netflix Eureka Server (Spring Cloud Netflix 2024.0.0)         |
| API Gateway       : Spring Cloud Gateway (Reactive Spring WebFlux / Netty)        |
| Security & Auth   : Spring Security 6.4.3 | JJWT 0.12.6 | BCrypt | Google OAuth2  |
| Persistence       : Spring Data JPA | Hibernate 6.6.8 | HikariCP 5.1.0 Pool       |
| Database Engine   : PostgreSQL 15+ (Hosted on Supabase Cloud)                     |
| Document Engine   : OpenPDF 2.0.3 (Vector PDF Rendering)                          |
| Email Engine      : Spring Boot Starter Mail (JavaMailSender / SMTP)              |
| Testing Suite     : JUnit 5 | Mockito | Spring Boot Test | H2 In-Memory DB        |
| Build & Runtime   : Apache Maven 3.9+ | Node.js 20+ | Docker Containers           |
| Cloud Target      : Vercel (Frontend CDN) | Render (Backend) | Supabase (DB)      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Detailed Technology Breakdown

### 2.1 Frontend Architecture & Dependencies (`package.json`)

| Technology / Library | Exact Version in Project | Role in VAYRO | Technical Justification |
| :--- | :--- | :--- | :--- |
| **React** | `^19.1.0` | Declarative UI Component Library | Modern React 19 architecture, enhanced concurrent rendering, Action hooks, server component compatibility. |
| **React DOM** | `^19.1.0` | Virtual DOM Engine | High-performance client-side DOM rendering and event normalization. |
| **React Router DOM** | `^7.6.2` | Client-Side Routing Engine | Modern declarative routing, protected route guards, nested layouts, and role-based navigation. |
| **Vite** | `^6.3.3` | Frontend Build Engine & Bundler | Vite 6 engine with instant Hot-Module-Replacement (HMR), ES modules dev server, and optimized Rollup bundling. |
| **@vitejs/plugin-react** | `^4.4.1` | React Fast Refresh Plugin | Fast compilation and seamless JSX transformation for Vite. |
| **Tailwind CSS** | `^3.4.17` | Utility-First CSS Framework | Rapid UI styling, design token system, minimal production CSS bundle footprint. |
| **PostCSS** | `^8.5.3` | CSS Preprocessing Tool | CSS AST transformations and vendor prefix automation. |
| **Autoprefixer** | `^10.4.21` | CSS Cross-Browser Vendor Prefixing | Automatic browser prefix generation for cross-device compatibility. |
| **Framer Motion** | `^12.6.2` | Motion & Micro-Interaction Engine | Smooth hardware-accelerated animations, modal dialog transitions, and fluid catalog gestures. |
| **Axios** | `^1.8.4` | Promise-Based HTTP Client | Request/response interceptors for automatic JWT Bearer token attachment and centralized error parsing. |
| **Lucide React** | `^0.511.0` | Scalable Vector Icon Library | Clean, modern iconography for vehicle specifications, features, badges, and user interfaces. |

---

### 2.2 Backend Microservices Frameworks (Java 21 LTS / `pom.xml`)

| Framework / Dependency | Version in Project | Role in VAYRO | Technical Justification |
| :--- | :--- | :--- | :--- |
| **Java Platform** | `21 (LTS)` | Backend Runtime Environment | Modern virtual threads, enhanced pattern matching, record classes, strong memory model. |
| **Spring Boot** | `3.4.3` | Application Core Framework | Standalone auto-configured production-grade Spring microservices. |
| **Spring Cloud** | `2024.0.0` | Distributed Systems Suite | Cloud patterns: Eureka Service Discovery, Load Balancing, Gateway routing. |
| **Spring Cloud Gateway** | `2024.0.0` | Perimeter Gateway (Port 8080) | Non-blocking reactive Netty routing, JWT token validation, CORS filtering. |
| **Spring Cloud Netflix Eureka** | `2024.0.0` | Service Registry (Port 8761) | Decentralized dynamic service location discovery and heartbeat health tracking. |
| **Spring Security** | `6.4.3` | Perimeter & Service Security | Stateless JWT authentication filter chains, method security, BCrypt hashing. |
| **JJWT (io.jsonwebtoken)** | `0.12.6` | JSON Web Token Toolkit | Secure cryptographic token creation, signing (HMAC-SHA256), and parsing. |
| **Spring Data JPA / Hibernate** | `6.6.8` | Object-Relational Mapping (ORM) | Type-safe repository abstraction, entity lifecycle management, JPQL queries. |
| **HikariCP** | `5.1.0` | Database Connection Pooling | High-performance connection pool configured with SSL mode for cloud PostgreSQL. |
| **OpenPDF** | `2.0.3` | Vector PDF Generator | Programmatic PDF document compilation for tax-compliant rental invoices. |
| **Jakarta Mail / SMTP** | `2.0.3` | Transactional Email Dispatcher | Automated multipart email transmission with PDF attachments via Gmail SMTP. |

---

### 2.3 Cloud Persistence & Storage

| Component | Platform | Configuration & Details |
| :--- | :--- | :--- |
| **Relational Database** | PostgreSQL 15+ | Hosted on Supabase (AWS AP-Southeast-1). Structured relational tables with foreign keys and unique constraints. |
| **Connection Pooling** | Supabase Pooler / HikariCP | Configured with SSL mode (`sslmode=require`), connection timeout (20s), and max pool size (3-5) to optimize cloud database connection limits. |
| **Test Database** | H2 In-Memory Database | Used during automated CI/Maven test runs (`jdbc:h2:mem:...`) to execute unit and integration tests without network dependencies. |

---

### 2.4 DevOps, Build & Hosting Infrastructure

```
+-----------------------------------------------------------------------------------+
|                            DEVOPS & PIPELINE MATRIX                               |
+----------------------+--------------------------+---------------------------------+
| Component            | Tool / Platform          | Usage / Configuration           |
+----------------------+--------------------------+---------------------------------+
| Dependency Manager   | Apache Maven 3.9+        | Multi-module root pom.xml       |
| Node Package Manager | npm 10+                  | Frontend dependency resolution  |
| Frontend Host        | Vercel Edge Network      | Continuous deployment from Git  |
| Backend Host         | Render Cloud Services    | Containerized JVM microservices |
| Database Host        | Supabase Cloud           | Managed PostgreSQL instance     |
| Version Control      | Git & GitHub             | Branching, commits, CI tests    |
+----------------------+--------------------------+---------------------------------+
```

---

## 3. Architecture Layering & Module Organization

The backend repository is organized as a structured Maven multi-module project:

```
backend/vayro-backend/
├── pom.xml                     <-- Root Parent POM (Java 21, Spring Boot 3.4.3, Spring Cloud 2024.0.0)
├── eureka-server/              <-- Service Registry (Port 8761)
├── api-gateway/                <-- Edge Reverse Proxy & JWT Validator (Port 8080)
├── user-service/               <-- Auth, Google OAuth & User Management (Port 8081)
├── vehicle-service/            <-- Fleet Catalog & Asset Management (Port 8082)
├── booking-service/            <-- Availability, Concurrency & Bookings (Port 8083)
└── notification-service/       <-- OpenPDF Invoice & SMTP Dispatch (Port 8084)
```

This stack guarantees zero architectural coupling, strict separation of concerns, and clean enterprise maintainability.
