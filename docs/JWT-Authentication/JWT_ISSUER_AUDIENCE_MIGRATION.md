# VAYRO — JWT Issuer & Audience Migration Architecture

**Target Issuer (`iss`)**: `vayro-auth`
**Target Audience (`aud`)**: `vayro-platform`
**Standard**: RFC 7519 JSON Web Token (JWT)
**Status**: Phase 1 & Phase 2 Implemented; Phase 3 Scheduled

---

## 1. Architectural Review of Token Lifecycle

### 1.1 Historical State (Pre-Hardening)
In earlier releases:
- `user-service` generated JWT tokens containing:
  - `sub`: User email
  - `userId`: Numeric customer identifier
  - `role`: Role string (`USER`, `ADMIN`)
  - `name`: Full customer name
  - `iat` (Issued At) and `exp` (Expiration, 24h)
- Explicit RFC 7519 claims **`iss` (Issuer)** and **`aud` (Audience)** were omitted.
- Downstream microservices (`api-gateway`, `booking-service`, `vehicle-service`, `notification-service`) verified tokens by validating the HMAC-SHA256 signature and `exp` timestamp only.

### 1.2 Security Risk of Missing Claims
Without explicit `iss` and `aud` validation:
- Any service sharing the shared secret could theoretically issue a valid token accepted by all other services.
- Tokens issued for internal administrative purposes or third-party webhooks could be replayed against customer APIs if signature keys overlap.

---

## 2. Constraints & Safety Directives

1. **Zero Session Disruption**: Existing customer and admin sessions issued within the last 24 hours must **not** be abruptly terminated or forced to re-authenticate.
2. **Zero Secret Rotation Without Approval**: The shared HMAC-SHA256 signing secret (`JWT_SECRET`) must **not** be rotated during this migration. Rotating the secret invalidates all sessions immediately.
3. **Multi-Service Synchronization**: Token generation and verification are distributed across 5 independent services (`user-service`, `api-gateway`, `booking-service`, `vehicle-service`, `notification-service`). Changes must remain compatible across rolling restarts.

---

## 3. Coordinated 3-Phase Migration Plan

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Dual-Mode / Permissive Verification (ACTIVE)                  │
│ - All services verify `iss` & `aud` IF present.                        │
│ - Legacy tokens without `iss`/`aud` remain valid until expiration.     │
│ - Zero sessions invalidated.                                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Explicit Claim Token Issuance (ACTIVE)                        │
│ - `user-service` issues all new tokens with:                           │
│   iss: "vayro-auth", aud: "vayro-platform"                             │
│ - 24-hour transition window begins.                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (After 24-48 Hours)
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Strict Claim Enforcement Lock                                 │
│ - Toggle `jwt.strict-claims=true` in microservice application configs.  │
│ - Tokens without explicit `iss` & `aud` rejected with HTTP 401.        │
│ - No user impact because legacy tokens are already expired.            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Details by Service

### 4.1 `user-service` (Token Issuer)
- **Token Generation**:
  ```java
  return Jwts.builder()
          .claims(extraClaims)
          .subject(subject)
          .issuer("vayro-auth")
          .audience().add("vayro-platform").and()
          .issuedAt(new Date(System.currentTimeMillis()))
          .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
          .signWith(getSigningKey())
          .compact();
  ```
- **Validation**:
  Validates `userDetails.isEnabled()` and `userDetails.isAccountNonLocked()` in real time.
  Permissive `iss` and `aud` check: accepts `vayro-auth` and legacy tokens without claims.

### 4.2 Downstream Microservices (`api-gateway`, `booking-service`, `vehicle-service`, `notification-service`)
- **Permissive / Dual-Mode Verification Logic**:
  ```java
  // Compatible Issuer Verification
  String tokenIssuer = claims.getIssuer();
  if (tokenIssuer != null && !tokenIssuer.isBlank()
          && !"vayro-auth".equals(tokenIssuer)
          && !"https://vayro.com".equals(tokenIssuer)) {
      return false; // Malformed or hostile issuer
  }

  // Compatible Audience Verification
  Set<String> tokenAudience = claims.getAudience();
  if (tokenAudience != null && !tokenAudience.isEmpty()
          && !tokenAudience.contains("vayro-platform")
          && !tokenAudience.contains("vayro-web")) {
      return false; // Audience mismatch
  }
  ```
- If a legacy token lacks `iss` or `aud`, it passes this check and proceeds to standard expiration and cryptographic signature validation.

---

## 5. Verification Matrix

| Token Type | `iss` Claim | `aud` Claim | Signature Valid? | Valid in Phase 1/2? | Valid in Phase 3? |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Legacy Session** | *None* | *None* | Yes | **PASS (200 OK)** | **REJECT (401)** |
| **New Phase 5 Token** | `vayro-auth` | `vayro-platform` | Yes | **PASS (200 OK)** | **PASS (200 OK)** |
| **Tampered Issuer** | `evil-corp` | `vayro-platform` | Yes | **REJECT (401)** | **REJECT (401)** |
| **Tampered Audience** | `vayro-auth` | `unknown-client` | Yes | **REJECT (401)** | **REJECT (401)** |
| **Disabled Account** | `vayro-auth` | `vayro-platform` | Yes | **REJECT (403)** | **REJECT (403)** |

---

## 6. Phase 3 Activation Schedule

When to execute Phase 3:
1. Wait **at least 24 hours** after deploying Phase 2 to production (exceeding `jwtExpiration=86400000`).
2. Verify via gateway access logs that 100% of authenticated requests carry valid `iss: vayro-auth` tokens.
3. In microservice configurations, switch `jwt.strict-claims=true`.
4. Deploy downstream services rolling one by one with zero downtime.
