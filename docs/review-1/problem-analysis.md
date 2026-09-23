# VAYRO — Problem Analysis

**Project Title:** VAYRO — Fleet Lifecycle & Rental Asset Management Platform  
**Academic Milestone:** Review 1 — Problem Analysis & Requirement Specification  
**Architecture:** Distributed Microservices (Spring Boot, Spring Cloud, PostgreSQL/Supabase, React)  
**Date:** September 2026  
**Document Version:** 1.0.0  

---

## 1. Executive Overview

Transportation systems and urban mobility paradigms have transitioned from traditional asset ownership models to on-demand, flexible asset leasing and rental ecosystems. Modern consumers, independent commuters, and corporate entities frequently require temporary vehicle access spanning distinct categories—such as fuel-efficient commuter hatchbacks, multi-utility vehicles (MUVs/SUVs), luxury sedans, adventure tourers, daily motorcycles, and electric two-wheelers.

However, traditional and fragmented vehicle rental operations suffer from significant manual bottlenecks, error-prone record-keeping, high operational overhead, opaque pricing structures, security vulnerabilities, and lack of real-time multi-service synchronization.

**VAYRO (Fleet Lifecycle & Rental Asset Management Platform)** addresses these critical industry pain points by delivering a cloud-native, microservice-driven rental and fleet management ecosystem. VAYRO integrates secure user identity verification, real-time vehicle availability management, atomic reservation scheduling with concurrency control, and asynchronous notification/invoicing pipelines into a high-performance web platform.

---

## 2. Problem Statement

Conventional vehicle rental management systems and manual ledger-based rental operations face operational bottlenecks across multiple core functional domains:

```
+-----------------------------------------------------------------------------------+
|                            VAYRO PROBLEM LANDSCAPE                                |
+-----------------------------------------------------------------------------------+
| 1. Fragmented Vehicle Discovery       2. Lack of Specification Transparency       |
| 3. Opaque Real-Time Availability      4. High Risk of Overbooking / Conflicts     |
| 5. Rigid & Inaccurate Billing Math    6. Disjointed Booking & Return Workflows    |
| 7. Security & Role Ambiguity          8. Single-Point-of-Failure Monoliths        |
| 9. Manual Invoicing & Delays          10. Limited Operational Fleet Visibility    |
+-----------------------------------------------------------------------------------+
```

### Detailed Breakdown of Core Problems:

1. **Fragmented Vehicle Catalog & Discovery:**
   Customers face friction discovering available vehicles across distinct categories (Hatchback, Sedan, SUV, Luxury, Motorcycle, Scooter, Electric) through unified, intuitive digital catalogs with high-resolution imagery and specifications.

2. **Incomplete Technical & Operational Specifications:**
   Rental customers frequently encounter ambiguity regarding vehicle fuel type (Petrol, Diesel, Electric, Hybrid), transmission (Manual, Automatic), seating capacity, range, and mileage restrictions prior to reservation.

3. **Opaque Real-Time Availability & Overlapping Conflicts:**
   Legacy systems rely on periodic manual updates or static flags, resulting in double-booking conflicts when multiple users attempt to reserve the same vehicle for overlapping time intervals.

4. **Rigid Rental Durations & Error-Prone Pricing Calculations:**
   Manual pricing calculations involving base daily rates, multi-day tiers, mandatory tax rates (e.g., 18% GST), optional add-on protections, and promotional discounts are prone to human calculation error and dispute.

5. **Manual Invoicing & Disconnected Communication:**
   Generating tax-compliant invoices and booking receipts is often delayed, requiring manual paperwork. Customers lack instant digital confirmation and downloadable PDF records.

6. **Monolithic Architecture Bottlenecks & Single Point of Failure:**
   Traditional monolithic rental platforms couple identity, vehicle data, payment state, and notification pipelines into a single deployable unit. A high load on vehicle browsing or a failure in email delivery can crash the entire reservation workflow.

7. **Security, Password Vulnerability & Privilege Escalation:**
   Inadequate password hashing, session tampering, lack of tokenized stateless authentication, and absence of granular Role-Based Access Control (RBAC) allow unauthorized modification of fleet inventories and customer data.

---

## 3. Existing System vs. VAYRO Proposed Solution

| Operational Domain | Existing / Legacy Systems | VAYRO Platform Solution |
| :--- | :--- | :--- |
| **System Architecture** | Monolithic or offline paper ledgers; single failure point. | Cloud-native microservices (Eureka, API Gateway, User, Vehicle, Booking, Notification). |
| **Fleet Discovery** | Static spreadsheets or basic catalog tables. | Interactive, categorized fleet showcase with real-time status and high-res multi-angle assets. |
| **Availability Management** | Manual confirmation via phone calls or physical visits. | Real-time interval overlap algorithm preventing double bookings at the database query level. |
| **Pricing Engine** | Manual calculations; frequent billing discrepancies. | Automated `BigDecimal` precision pricing engine with configurable taxes, discounts, and add-ons. |
| **Authentication & Security** | Plaintext/MD5 passwords, session cookies vulnerable to CSRF. | BCrypt password hashing, stateless RSA/HMAC-signed JWTs, Gateway authorization filters, and strict RBAC. |
| **Reservation Lifecycle** | Unstructured status progression; lost return records. | Finite State Machine (`PENDING` → `CONFIRMED` → `ACTIVE` → `RETURNED` → `COMPLETED`/`CANCELLED`). |
| **Fleet Synchronization** | Manual phone calls between dispatch desk and maintenance. | Automated inter-service status updates (`AVAILABLE` ↔ `RENTED`) via load-balanced HTTP clients. |
| **Invoice Generation** | Manual paper invoices or external accounting exports. | Automated OpenPDF vector engine producing branded, tamper-evident PDF receipts instantly. |
| **Fault Tolerance** | Entire system goes offline if one component fails. | Isolated service boundaries; notification failures never block or abort booking persistence. |

---

## 4. Project Objectives

VAYRO is engineered with explicit, measurable technical and business objectives:

1. **Establish a Resilient Microservice Architecture:**
   Decompose the fleet management ecosystem into independent bounded contexts registered with Spring Cloud Eureka and fronted by Spring Cloud API Gateway.
2. **Enforce Zero-Trust Stateless Security:**
   Implement JWT-based authentication with BCrypt password hashing, role enforcement (`ROLE_USER`, `ROLE_ADMIN`), and gateway perimeter token validation.
3. **Guarantee Booking Integrity & Concurrency Safety:**
   Eliminate vehicle reservation conflicts through deterministic SQL overlap queries and JVM thread-level concurrency controls.
4. **Automate Document & Notification Pipelines:**
   Deliver automated transactional emails with vector-drawn PDF invoices upon booking confirmation and return events without impacting booking transaction latency.
5. **Provide a High-Fidelity Modern User Interface:**
   Deliver a responsive React/Vite single-page application with micro-interactions, dark mode aesthetics, and seamless REST API integration.
6. **Deploy on Modern Cloud Infrastructure:**
   Target PostgreSQL/Supabase for cloud relational storage, Render for containerized microservice execution, and Vercel for frontend distribution.

---

## 5. Target Stakeholders & User Roles

```
                      +-------------------+
                      |   VAYRO USERS     |
                      +---------+---------+
                                |
               +----------------+----------------+
               |                                 |
     +---------v---------+             +---------v---------+
     |     ROLE_USER     |             |    ROLE_ADMIN     |
     | (Rental Customer) |             |  (Fleet Manager)  |
     +-------------------+             +-------------------+
```

### 5.1 USER Role (Rental Customer)
- **Account Registration & Authentication:** Secure signup, login, and Google OAuth2 integration.
- **Fleet Exploration:** Filter vehicles by category, fuel type, transmission, price range, and search terms.
- **Availability Verification:** Check vehicle availability across specific pickup and return timestamps.
- **Self-Service Booking:** Create reservations with custom add-ons, promo codes, and payment options.
- **Reservation Tracking:** View booking history, active reservation states, and download generated PDF invoices.
- **Self-Service Cancellation:** Cancel reservations that have not yet transitioned to active rental status.

### 5.2 ADMIN Role (Fleet & Operations Manager)
- **Vehicle Asset Management:** Add new vehicles, update specs, modify daily pricing, and set operational statuses (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `INACTIVE`).
- **Reservation Oversight:** Inspect platform-wide reservations with multi-parameter filtering (status, vehicle, date, customer).
- **Rental Lifecycle Transition:** Confirm pending reservations, activate bookings upon vehicle hand-off, process returns, and mark completed bookings.
- **Fleet Telemetry & Audit:** Real-time visibility into active rentals, vehicle utilization rates, and customer accounts.

---

## 6. Summary of Empirical Analysis

The VAYRO platform successfully transitions vehicle rental operations from fragmented, error-prone workflows into a scalable, secure, and distributed digital enterprise platform. The remaining Review 1 documents provide complete specifications for functional requirements, service boundaries, authentication protocols, gateway routing, and technical demonstrations.
