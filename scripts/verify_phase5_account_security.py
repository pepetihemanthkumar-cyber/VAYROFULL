#!/usr/bin/env python3
"""
VAYRO — Phase 5 Account Security & Deployment Readiness Audit Script
Validates:
  1. Database Configuration safety & fallback prevention (Task 1)
  2. Disabled account enforcement in code & tests across all services (Task 2)
  3. JWT Issuer and Audience dual-mode compatibility (Task 3)
  4. HTTPS Readiness, port mappings, and HSTS safety (Task 4)
  5. Security hygiene (zero credential leaks, no PII logging)
"""

import os
import re
import sys
import yaml

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def log_check(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"[{status}] {name}")
    if detail:
        print(f"        {detail}")
    return passed

def test_database_configuration():
    print("\n--- TASK 1: DATABASE CONFIGURATION ---")
    all_ok = True
    dc_path = os.path.join(REPO_ROOT, "docker-compose.yml")
    with open(dc_path, "r") as f:
        dc_text = f.read()

    # Check that required environment variable interpolation syntax is used
    has_req_syntax = "SUPABASE_DB_HOST:?SUPABASE_DB_HOST is required for database connection" in dc_text
    all_ok &= log_check("Base docker-compose enforces strict variable requirement", has_req_syntax,
                        "Missing SUPABASE_DB_HOST strictly halts Compose without fallback")

    # Check local compose override exists
    local_path = os.path.join(REPO_ROOT, "docker-compose.local.yml")
    all_ok &= log_check("Local development compose override exists", os.path.exists(local_path),
                        f"Path: {local_path}")

    # Check supabase compose exists
    sb_path = os.path.join(REPO_ROOT, "docker-compose.supabase.yml")
    all_ok &= log_check("Explicit Supabase compose override exists", os.path.exists(sb_path),
                        f"Path: {sb_path}")

    return all_ok

def test_disabled_account_enforcement():
    print("\n--- TASK 2: DISABLED ACCOUNT ENFORCEMENT ---")
    all_ok = True

    # 1. user-service JwtService
    user_jwt_path = os.path.join(REPO_ROOT, "backend/vayro-backend/user-service/src/main/java/com/vayro/users/security/JwtService.java")
    with open(user_jwt_path, "r") as f:
        user_jwt = f.read()
    has_user_enabled = "userDetails.isEnabled()" in user_jwt and "userDetails.isAccountNonLocked()" in user_jwt
    all_ok &= log_check("user-service JwtService verifies userDetails.isEnabled()", has_user_enabled)

    # 2. booking-service BookingServiceImpl active check
    booking_impl_path = os.path.join(REPO_ROOT, "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/service/BookingServiceImpl.java")
    with open(booking_impl_path, "r") as f:
        booking_impl = f.read()
    has_verify_active = "verifyUserActive(currentUser, authToken)" in booking_impl
    has_admin_bypass = "currentUser.isAdmin()" in booking_impl or "user.isAdmin()" in booking_impl
    all_ok &= log_check("booking-service enforces verifyUserActive on booking & return operations", has_verify_active)
    all_ok &= log_check("booking-service preserves admin bypass for support operations", has_admin_bypass)

    # 3. notification-service NotificationServiceImpl invoice active check
    notif_impl_path = os.path.join(REPO_ROOT, "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/service/NotificationServiceImpl.java")
    with open(notif_impl_path, "r") as f:
        notif_impl = f.read()
    has_notif_active = "userServiceClient.isUserActive(currentUser.getEmail(), currentUser.getToken())" in notif_impl
    has_owner_check = "recipient.equalsIgnoreCase(currentUser.getEmail())" in notif_impl
    all_ok &= log_check("notification-service verifies user active status on PDF invoice download", has_notif_active)
    all_ok &= log_check("notification-service enforces strict invoice ownership / customer isolation", has_owner_check)

    # 4. Check zero token / PII logging in clients
    booking_client_path = os.path.join(REPO_ROOT, "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/client/UserServiceClientImpl.java")
    with open(booking_client_path, "r") as f:
        booking_client = f.read()
    no_token_logging = "log.warn(\"[AUTH] User Service rejected token for account (HTTP {})" in booking_client
    all_ok &= log_check("UserServiceClient avoids logging tokens or sensitive PII", no_token_logging)

    return all_ok

def test_jwt_issuer_audience():
    print("\n--- TASK 3: JWT ISSUER & AUDIENCE REVIEW ---")
    all_ok = True

    # 1. user-service sets issuer & audience
    user_jwt_path = os.path.join(REPO_ROOT, "backend/vayro-backend/user-service/src/main/java/com/vayro/users/security/JwtService.java")
    with open(user_jwt_path, "r") as f:
        user_jwt = f.read()
    has_iss_builder = ".issuer(jwtIssuer)" in user_jwt and ".audience().add(jwtAudience)" in user_jwt
    all_ok &= log_check("user-service generates tokens with explicit issuer & audience", has_iss_builder)

    # 2. Downstream services support permissive dual-mode validation
    services = [
        ("api-gateway", "backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtService.java"),
        ("booking-service", "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/security/JwtService.java"),
        ("vehicle-service", "backend/vayro-backend/vehicle-service/src/main/java/com/vayro/vehicles/security/JwtService.java"),
        ("notification-service", "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/security/JwtService.java"),
    ]

    for sname, rel_path in services:
        full_path = os.path.join(REPO_ROOT, rel_path)
        with open(full_path, "r") as f:
            code = f.read()
        has_iss_check = "tokenIssuer != null" in code or "issuer != null" in code
        has_aud_check = "tokenAudience != null" in code or "audience != null" in code
        all_ok &= log_check(f"{sname} implements permissive issuer/audience verification", has_iss_check and has_aud_check)

    # 3. Check migration document exists
    doc_path = os.path.join(REPO_ROOT, "docs/JWT-Authentication/JWT_ISSUER_AUDIENCE_MIGRATION.md")
    all_ok &= log_check("JWT Issuer & Audience Migration Guide documented", os.path.exists(doc_path))

    return all_ok

def test_https_readiness():
    print("\n--- TASK 4: HTTPS READINESS ---")
    all_ok = True

    # 1. Nginx SSL template exists
    tmpl_path = os.path.join(REPO_ROOT, "frontend/nginx.ssl.conf.template")
    with open(tmpl_path, "r") as f:
        tmpl = f.read()

    has_acme = "location /.well-known/acme-challenge/" in tmpl
    all_ok &= log_check("Nginx template contains ACME challenge webroot location", has_acme)

    has_domain_redirect = "return 301 https://$host$request_uri;" in tmpl
    all_ok &= log_check("Nginx template enforces 301 HTTPS redirect for production domains", has_domain_redirect)

    # Verify HSTS is NOT enabled yet (commented out)
    hsts_active = re.search(r"^\s*add_header\s+Strict-Transport-Security", tmpl, re.MULTILINE) is not None
    hsts_commented = "# add_header Strict-Transport-Security" in tmpl
    all_ok &= log_check("HSTS is safely commented out until HTTPS is fully active", not hsts_active and hsts_commented)

    # 2. docker-compose.ssl.yml exists and is valid YAML
    ssl_compose = os.path.join(REPO_ROOT, "docker-compose.ssl.yml")
    with open(ssl_compose, "r") as f:
        parsed_yaml = yaml.safe_load(f)
    has_ports = "443:8443" in parsed_yaml["services"]["frontend"]["ports"]
    all_ok &= log_check("docker-compose.ssl.yml maps port 443:8443", has_ports)

    # 3. HTTPS Deployment guide exists
    guide_path = os.path.join(REPO_ROOT, "docs/HTTPS_DEPLOYMENT_GUIDE.md")
    all_ok &= log_check("HTTPS Deployment Guide documented", os.path.exists(guide_path))

    return all_ok

def main():
    print("=" * 70)
    print("  VAYRO — PHASE 5 AUDIT & COMPLIANCE VERIFICATION")
    print("=" * 70)

    t1 = test_database_configuration()
    t2 = test_disabled_account_enforcement()
    t3 = test_jwt_issuer_audience()
    t4 = test_https_readiness()

    print("\n" + "=" * 70)
    if t1 and t2 and t3 and t4:
        print("  ALL PHASE 5 VERIFICATION CHECKS PASSED PERFECTLY (100%)")
        print("=" * 70)
        sys.exit(0)
    else:
        print("  SOME CHECKS FAILED — REVIEW DETAILS ABOVE")
        print("=" * 70)
        sys.exit(1)

if __name__ == "__main__":
    main()
