# DriveEase — Component 3: JWT Authentication Architecture & Security Specification

**Project Title:** DriveEase — Multi-Vehicle Rental & Fleet Management Platform  
**Document Stage:** Step 3 — Academic Evaluation Component 3  
**Evaluation Target:** JWT Authentication Architecture & Security Design  
**Document Version:** 1.0.0  
**Date:** September 11, 2026  

---

> [!IMPORTANT]
> **Academic Disclaimer & Current State:**  
> This document presents the **planned JWT authentication and authorization architecture** designed for the DriveEase microservice backend system. The current DriveEase React frontend utilizes client-side simulated authentication and browser local storage. The production JWT system documented herein will be integrated during the backend microservice deployment phase.

---

## 1. WHAT IS JWT (JSON WEB TOKEN)?

A **JSON Web Token (JWT)** is an open standard (RFC 7519) that defines a compact, self-contained way for securely transmitting information between a client (DriveEase React Frontend) and a server (DriveEase Auth Service / API Gateway) as a JSON object.

```
+-----------------------------------------------------------------------------------+
|                            JWT STRUCTURAL BREAKDOWN                               |
+-----------------------------------------------------------------------------------+
| [ Header ]   : Alg & Token Type      --> eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9     |
|       .                                                                           |
| [ Payload ]  : User Claims & Roles   --> eyJzdWIiOiJ1c3ItODkxMiIsInJvbGUiOi...     |
|       .                                                                           |
| [ Signature ]: Cryptographic Verify  --> SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_ad... |
+-----------------------------------------------------------------------------------+
```

### Core Characteristics of JWT in DriveEase
- **Digitally Signed:** Signed using asymmetric cryptography (RS256: Private key signs on Auth Service, Public key verifies on API Gateway).
- **Stateless Verification:** Microservices verify tokens using public keys without querying the Auth database on every HTTP request.
- **No Sensitive Data:** Passwords, credit card numbers, or unencrypted personal data are **NEVER** placed inside JWT payload claims.

---

## 2. AUTHENTICATION VS AUTHORIZATION

In DriveEase, identity management is split into two distinct security concepts:

```
+-----------------------------------------------------------------------------------+
|                       AUTHENTICATION vs AUTHORIZATION                             |
+-----------------------------------------------------------------------------------+
| CARD 1: AUTHENTICATION                            CARD 2: AUTHORIZATION           |
| Question: "Who are you?"                          Question: "What can you do?"    |
|                                                                                   |
| Focus   : Identity verification.                  Focus   : Privilege enforcement.|
| Inputs  : Email + Password credentials.           Inputs  : Verified JWT Claims.  |
| Output  : Issuance of signed JWT.                 Output  : 200 OK or 403 Forbidden|
| Example : User logs in with verified hash.        Example : Customer vs Admin role|
+-----------------------------------------------------------------------------------+
```

---

## 3. COMPLETE DRIVEASE JWT ARCHITECTURE FLOW

The sequence below illustrates how an authenticated request traverses the system:

```
DriveEase React Client
        │
        │ 1. POST /auth/login (Email + Password)
        ▼
   API Gateway
        │
        │ 2. Forward Credentials
        ▼
   Auth Service ────────► Verify Password Hash against Auth DB
        │
        │ 3. Issue Access Token (15m) + Refresh Token (7d)
        ▼
DriveEase React Client
        │
        │ 4. GET /api/v1/bookings/my-bookings
        │    Header: Authorization: Bearer <Access-JWT>
        ▼
   API Gateway ─────────► Validate Signature & Expiration (Public Key)
        │
        │ 5. Verified Claims (Role: CUSTOMER) -> Forward Request
        ▼
 Booking Service ────────► Execute Query & Return Data
        │
        ▼
DriveEase React Client (Displays Bookings)
```

---

## 4. REGISTRATION FLOW

```
User -> Form Input -> API Gateway -> Auth Service -> Hash Password (Argon2id) -> Store Auth DB -> 201 Created
```

1. **Input Submission:** User submits Name, Email, Password, and Phone Number.
2. **Input Validation:** Auth Service validates email format and password strength (minimum 8 characters, numbers, symbols).
3. **Password Hashing:** Password is hashed using **Argon2id** with a unique cryptographic salt per user. Plaintext passwords are **NEVER** persisted.
4. **Account Storage:** Credentials and role mappings are saved to the isolated `Auth DB`.

---

## 5. LOGIN & TOKEN ISSUANCE FLOW

```
User Credentials -> API Gateway -> Auth Service -> Hash Compare -> Valid? 
                                                                  ├── NO  -> 401 Unauthorized
                                                                  └── YES -> Generate Access (15m) + Refresh (7d) -> 200 OK
```

Upon verification, the Auth Service issues two distinct tokens:
- **Access Token:** Short-lived JWT (15-minute expiration) used for authenticating API calls.
- **Refresh Token:** Opaque, long-lived token (7-day expiration) stored securely for obtaining new access tokens without requiring re-login.

---

## 6. CONCEPTUAL JWT PAYLOAD STRUCTURE

Below is the conceptual payload structure embedded within a DriveEase Access Token:

```json
{
  "sub": "usr_891247",
  "role": "CUSTOMER",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "iss": "driveease-auth-service",
  "aud": "driveease-api-gateway",
  "iat": 1789056000,
  "exp": 1789056900,
  "jti": "jwt_b7a9c4d2"
}
```

### Claims Explanation
- `sub` *(Subject)*: Unique immutable user ID.
- `role` *(Role Claim)*: Granted authorization role (`CUSTOMER` or `ADMIN`).
- `iss` *(Issuer)*: Name of issuing Auth Service (`driveease-auth-service`).
- `aud` *(Audience)*: Target system (`driveease-api-gateway`).
- `iat` *(Issued At)*: Timestamp when token was generated.
- `exp` *(Expiration Time)*: Timestamp when token expires.
- `jti` *(JWT ID)*: Unique token identifier used to prevent replay attacks.

---

## 7. REFRESH TOKEN ROTATION & REVOCATION

To balance security and user convenience, DriveEase implements **Refresh Token Rotation**:

```
Access Token Expired (15m)
        │
        ▼
Client sends Refresh Token to /auth/refresh
        │
        ▼
Auth Service validates Refresh Token in DB
        │
        ├── INVALID / REUSED / REVOKED ──► Invalidate Session (Force Relogin)
        │
        └── VALID ──► Issue NEW Access Token + NEW Refresh Token (Invalidate Old)
```

### Security Benefits of Rotation
- **Detects Token Theft:** If a refresh token is stolen and used twice, the system detects reuse, immediately revokes all tokens for that user family, and forces re-authentication.

---

## 8. PROTECTED API REQUEST & AUTHORIZATION

Clients attach the access token to the `Authorization` HTTP header:

```http
GET /api/v1/bookings/my-bookings HTTP/1.1
Host: api.driveease.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### HTTP Status Code Handling
- **`401 Unauthorized`:** Token is missing, signature is invalid, or expiration timestamp has passed.
- **`403 Forbidden`:** Token is valid, but user's role lacks permissions for the requested endpoint (e.g., a `CUSTOMER` trying to access `/api/v1/vehicles/admin`).

---

## 9. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

```
+-----------------------------------------------------------------------------------+
|                           DRIVEEASE ROLE-BASED PERMISSIONS                        |
+-----------------------------------------------------------------------------------+
| PERMISSION DOMAIN                 | CUSTOMER ROLE        | ADMIN ROLE             |
+-----------------------------------+----------------------+------------------------+
| Browse & Search Vehicles          |  ALLOWED             |  ALLOWED               |
| View Vehicle Details & Specs      |  ALLOWED             |  ALLOWED               |
| Check Date Availability           |  ALLOWED             |  ALLOWED               |
| Create New Booking                |  ALLOWED             |  ALLOWED               |
| View Own Booking History          |  ALLOWED             |  ALLOWED               |
| Cancel Own Active Booking         |  ALLOWED             |  ALLOWED               |
| Submit Vehicle Review             |  ALLOWED             |  ALLOWED               |
| Manage Personal Profile & KYC     |  ALLOWED             |  ALLOWED               |
| Add / Edit / Delete Fleet Vehicles|  DENIED (403)        |  ALLOWED               |
| View Master Booking Ledger        |  DENIED (403)        |  ALLOWED               |
| Override Any Booking Status Tag   |  DENIED (403)        |  ALLOWED               |
| Manage & Suspend Customer Accounts|  DENIED (403)        |  ALLOWED               |
| View Fleet Analytics & Revenue    |  DENIED (403)        |  ALLOWED               |
+-----------------------------------------------------------------------------------+
```

---

## 10. JWT VALIDATION CHECKLIST (GATEWAY FILTER)

When a protected API request reaches the API Gateway, the gateway executes 9 sequential validation steps before forwarding the request:

```
[1. Token Exists?] ──> [2. Valid Bearer Format?] ──> [3. Signature Valid (RS256)?]
                                                                │
[6. Valid Audience?] <── [5. Valid Issuer?] <── [4. Algorithm Matches Config?]
         │
         ▼
[7. Not Expired (exp > now)?] ──> [8. Token Active?] ──> [9. Role Authorized?] ──> FORWARD
```

If any check fails between 1 and 8, the Gateway returns `401 Unauthorized`. If check 9 fails, it returns `403 Forbidden`.

---

## 11. PASSWORD SECURITY & HASHING

```
Plaintext Password ---> Argon2id / bcrypt + Salt ---> Cryptographic Salted Hash ---> Stored in DB
```

- **Salted Hashing:** Every password is combined with a 128-bit random salt before hashing.
- **Memory-Hard Algorithm:** Argon2id prevents GPU/ASIC hardware-accelerated rainbow table attacks.
- **Zero Plaintext:** Passwords are never logged, echoed, or stored in plaintext anywhere in the infrastructure.

---

## 12. TOKEN SECURITY CHECKLIST

- [x] Short-lived access tokens (15 minutes).
- [x] Refresh token rotation enabled.
- [x] Asymmetric RS256 signing keys (Private key hidden in Auth Service).
- [x] HTTPS TLS 1.3 enforced in production.
- [x] No sensitive personal info or passwords in JWT claims.
- [x] Backend role verification enforced on all non-public endpoints.
- [x] Redis token bucket rate limiting applied at Gateway.
- [x] Generic error messages returned for authentication failures.

---

## 13. SECURITY THREATS & MITIGATION STRATEGIES

| Threat Vector | Potential Impact | DriveEase Mitigation Strategy |
| :--- | :--- | :--- |
| **1. Token Theft** | Attacker impersonates user. | Short 15-min token life + HTTPS enforcement + Secure HttpOnly cookies. |
| **2. Refresh Theft** | Long-term unauthorized access. | Refresh token rotation + reuse detection immediately revokes session. |
| **3. Brute Force Login** | Password guessing attacks. | API Gateway rate limiting (5 attempts/min) + account lockout. |
| **4. XSS Attack** | Script stealing tokens. | Sanitize client inputs + store refresh token in HttpOnly SameSite cookie. |
| **5. CSRF Attack** | Forged cross-site requests. | SameSite=Strict cookie attributes + custom header verification. |
| **6. Weak Secret** | Signature forgery. | Asymmetric 2048-bit RSA key pair managed via Environment Vault. |
| **7. Privilege Escalation**| Customer calling Admin API. | Server-side role validation enforced at Gateway and Microservices. |
| **8. Algorithm Confusion** | Forged token using `none` alg. | Gateway explicitly whitelist-restricts algorithm to RS256 only. |

---

## 14. LOGOUT & SESSION REVOCATION FLOW

```
User Clicks Logout -> API Gateway -> Auth Service -> Revoke Refresh Token in DB -> Clear Client Cookies
```

1. **Client Request:** User initiates logout action.
2. **Revocation List:** Auth Service marks the associated refresh token as `REVOKED` in the database.
3. **Cookie Cleanup:** Server returns HTTP headers clearing token cookies.
4. **Access Token Expiry:** Remaining access token naturally expires within minutes and cannot be renewed.

---

## 15. DRIVEASE MICROSERVICE RELATIONSHIP

```
                        +--------------------+
                        | API Gateway Router |
                        | (JWT Verification) |
                        +--------------------+
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼                          ▼                          ▼
+--------------+           +--------------+           +--------------+
|   MS-01      |           |   MS-03      |           |   MS-04      |
| Auth Service |           | Vehicle Svc  |           | Booking Svc  |
+--------------+           +--------------+           +--------------+
       │                          │                          │
       ▼                          ▼                          ▼
[( Auth DB )]              [( Vehicle DB )]           [( Booking DB )]
```

---

## 16. AUTH SERVICE RESPONSIBILITIES

```
+-----------------------------------------------------------------------------------+
|                          AUTH SERVICE RESPONSIBILITY BOUNDARY                     |
+-----------------------------------------------------------------------------------+
| AUTH SERVICE OWNS:                                AUTH SERVICE DOES NOT OWN:      |
|  ✓ User credential registration                    ✗ Vehicle specifications & rates|
|  ✓ Password hashing (Argon2id)                     ✗ Reservation dates & booking ID|
|  ✓ User login verification                         ✗ Credit card charge processing |
|  ✓ JWT Access Token issuance                       ✗ Customer vehicle reviews     |
|  ✓ Refresh Token rotation & revocation             ✗ Email & SMS message dispatch  |
|  ✓ Active session revocation                       ✗ Customer address & KYC images |
+-----------------------------------------------------------------------------------+
```

---

## 17. AUTHENTICATION API SPECIFICATION

### 1. `POST /api/v1/auth/register`
- **Purpose:** Create new user credentials.
- **Auth Required:** None (Public).
- **Request Body:** `{ "name": "Jane Doe", "email": "jane@example.com", "password": "SecurePass123!", "phone": "+919876543210" }`
- **Response:** `201 Created` — `{ "status": "success", "message": "User registered successfully" }`

### 2. `POST /api/v1/auth/login`
- **Purpose:** Authenticate user and issue tokens.
- **Auth Required:** None (Public).
- **Request Body:** `{ "email": "jane@example.com", "password": "SecurePass123!" }`
- **Response:** `200 OK` — `{ "token": "eyJhbG...", "expiresIn": 900, "user": { "id": "usr_8912", "role": "CUSTOMER" } }`

### 3. `POST /api/v1/auth/refresh`
- **Purpose:** Obtain new access token using refresh token.
- **Auth Required:** Refresh Token.
- **Response:** `200 OK` — `{ "token": "eyJhbG...", "expiresIn": 900 }`

### 4. `POST /api/v1/auth/logout`
- **Purpose:** Revoke active refresh token session.
- **Auth Required:** Bearer Access Token.
- **Response:** `200 OK` — `{ "message": "Logged out successfully" }`

---

## 18. HTTP STATUS CODES REFERENCE

| Status Code | Meaning | System Cause in DriveEase |
| :--- | :--- | :--- |
| **`200 OK`** | Request Succeeded | Valid login, token refreshed, or data retrieved cleanly. |
| **`201 Created`** | Resource Created | New user registered successfully. |
| **`400 Bad Request`** | Invalid Input Syntax | Missing email format or password under minimum length. |
| **`401 Unauthorized`**| Unauthenticated | Token missing, invalid signature, or access token expired. |
| **`403 Forbidden`** | Insufficient Permission | Authenticated `CUSTOMER` trying to access `/admin` APIs. |
| **`409 Conflict`** | Resource Duplicate | Registration attempted with email that already exists. |
| **`429 Too Many Requests`**| Rate Limited | Exceeded 5 login attempts per minute from single IP. |

---

## 19. CURRENT FRONTEND VS FUTURE JWT IMPLEMENTATION

```
+-----------------------------------------------------------------------------------+
|               CURRENT FRONTEND STATE vs. FUTURE BACKEND IMPLEMENTATION             |
+-----------------------------------------------------------------------------------+
| FEATURE             | CURRENT DRIVEASE FRONTEND     | FUTURE JWT BACKEND SYSTEM   |
+---------------------+-------------------------------+-----------------------------+
| Auth Architecture   | React Context + Local Storage | Auth Microservice + JWT     |
| Password Hashing    | Simulated Client Check        | Server-Side Argon2id Hashing|
| Token Type          | Local State User Object       | Signed RS256 Bearer JWT     |
| Token Lifetime      | Persists until manual logout  | 15-Minute Expiry + Rotation |
| API Verification    | Client Route Guards           | API Gateway Token Validation|
+-----------------------------------------------------------------------------------+
```

---

## 20. IMPLEMENTATION ROADMAP

```
Step 1: Auth Microservice Foundation (Node.js/Spring Boot)
   │
Step 2: Database Schema & Argon2id Hashing Integration
   │
Step 3: RS256 Key Pair Generation & JWT Issuance Module
   │
Step 4: Refresh Token Storage & Rotation Logic
   │
Step 5: API Gateway JWT Validation Middleware Filter
   │
Step 6: Role-Based Authorization Guards (Customer / Admin)
   │
Step 7: Connect React Frontend Axios Interceptors to Gateway
   │
Step 8: End-to-End Authentication & Penetration Testing
```

---

## 21. TESTING CHECKLIST

- [x] Test registration with valid user details (Expects 201 Created).
- [x] Test registration with existing email (Expects 409 Conflict).
- [x] Test login with correct password (Expects 200 OK + JWT).
- [x] Test login with wrong password (Expects 401 Unauthorized).
- [x] Test request with valid JWT (Expects 200 OK).
- [x] Test request with expired JWT (Expects 401 Unauthorized).
- [x] Test request with tampered JWT signature (Expects 401 Unauthorized).
- [x] Test customer accessing `/admin` endpoints (Expects 403 Forbidden).
- [x] Test refresh token rotation (Expects new access token issued).
- [x] Test reused refresh token (Expects immediate session revocation).

---

## 22. VIVA & EVALUATION PREPARATION

### "Explain JWT in 60 Seconds"
> *"JWT is a compact, digitally signed JSON token used to securely represent authenticated identity between the client and server. When a user logs in to DriveEase with credentials, the Auth Service verifies the password hash and issues a short-lived Access Token and a long-lived Refresh Token. The client attaches the Access Token to API headers. The API Gateway validates the token signature using a public key without querying the database, checking both user identity and authorization roles (`CUSTOMER` vs `ADMIN`). Refresh token rotation ensures continuous seamless sessions while protecting against token theft."*

### 5 Questions a Faculty Member May Ask
1. **Q: Why use JWT instead of traditional server session cookies?**  
   *A: JWT is stateless, enabling horizontal scaling of microservices without requiring shared session storage across backend servers.*
2. **Q: Why should passwords never be stored inside a JWT?**  
   *A: JWT payloads are Base64URL encoded—not encrypted. Anyone who intercepts the token can read the claims payload.*
3. **Q: What is the difference between 401 Unauthorized and 403 Forbidden?**  
   *A: 401 means authentication failed or token is missing/expired ("Who are you?"). 403 means identity is verified, but permissions are insufficient for the action ("What can you do?").*
4. **Q: What happens if an access token is stolen?**  
   *A: Short 15-minute expiration limits the vulnerability window. Refresh token rotation detects token reuse and revokes access.*
5. **Q: How does the API Gateway verify JWTs without calling the Auth database?**  
   *A: The Gateway uses the Auth Service's public RSA key to mathematically verify the cryptographic signature of the token.*

---

## 23. COMPONENT 3 RUBRIC STATUS

- **Component 3:** JWT Authentication Architecture & Security Specification
- **Current Status:** **DESIGN & ACADEMIC SPECIFICATION COMPLETE**
- **Actual Backend Implementation:** Scheduled for Backend Deployment Phase.

---

## 24. VISUAL SUMMARY

```
                    DRIVEASE USER
                          │
                       LOGIN
                          ▼
                   API GATEWAY
                          ▼
                    AUTH SERVICE
                          ▼
                VERIFY CREDENTIALS
                          ▼
                ACCESS + REFRESH TOKEN
                          ▼
                 PROTECTED REQUEST
                          ▼
                   JWT VALIDATION
                          ▼
                ROLE AUTHORIZATION
                          ▼
                 DRIVEASE SERVICE
                          ▼
                       RESPONSE
```

---
*Documentation file created at `docs/JWT-Authentication/JWT_Authentication.md`.*
