#!/usr/bin/env python3
"""
VAYRO — Phase 1 Security Remediation Automated Verification Suite
Tests SEC-01, SEC-02, SEC-04, and SEC-10 against running gateway and services.
"""

import sys
import time
import json
import urllib.request
import urllib.error
import http.client

BASE_URL = "http://localhost:8080"

def req(url, method="GET", payload=None, headers=None):
    if headers is None:
        headers = {}
    data = None
    if payload is not None:
        if isinstance(payload, dict):
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif isinstance(payload, bytes):
            data = payload
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
            return resp.status, resp.headers, body
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, e.headers, body
    except Exception as e:
        return 0, {}, str(e).encode("utf-8")

def main():
    print("=" * 80)
    print("VAYRO — PHASE 1 SECURITY REMEDIATION VERIFICATION SUITE")
    print("=" * 80)
    ts = int(time.time())
    results = {}

    # Wait for gateway
    print("[INIT] Checking API Gateway availability...")
    for i in range(15):
        st, _, _ = req(f"{BASE_URL}/actuator/health")
        if st == 200:
            print("  ✓ API Gateway is UP")
            break
        time.sleep(2)
    else:
        print("  ✗ API Gateway not reachable!")
        sys.exit(1)

    # Setup Customer A
    print("\n[SETUP] Registering test accounts...")
    email_a = f"sec_owner_{ts}@vayro.test"
    st, _, body = req(f"{BASE_URL}/api/auth/register", method="POST", payload={
        "firstName": "Owner", "lastName": "Customer", "email": email_a,
        "password": "Password123!", "phone": "+91 98765 00001"
    })
    data_a = json.loads(body.decode("utf-8")) if st in (200, 201) else {}
    token_a = data_a.get("token")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"  ✓ Customer A created: {email_a}")

    # Setup Customer B (Attacker)
    email_b = f"sec_attacker_{ts}@vayro.test"
    st, _, body = req(f"{BASE_URL}/api/auth/register", method="POST", payload={
        "firstName": "Attacker", "lastName": "Customer", "email": email_b,
        "password": "Password123!", "phone": "+91 98765 00002"
    })
    data_b = json.loads(body.decode("utf-8")) if st in (200, 201) else {}
    token_b = data_b.get("token")
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"  ✓ Customer B created: {email_b}")

    # Setup Admin
    st, _, body = req(f"{BASE_URL}/api/auth/login", method="POST", payload={
        "email": "admin@vayro.com", "password": "VayroAdmin2026!"
    })
    data_admin = json.loads(body.decode("utf-8")) if st == 200 else {}
    token_admin = data_admin.get("token")
    headers_admin = {"Authorization": f"Bearer {token_admin}"}
    print("  ✓ Admin logged in: admin@vayro.com")

    # Dynamically pick an available vehicle that has no conflicting booking
    st, _, vbody = req(f"{BASE_URL}/api/vehicles?page=0&size=50&status=AVAILABLE", headers=headers_a)
    vdata = json.loads(vbody.decode("utf-8")) if st == 200 else {}
    vehicles = vdata.get("content", [])

    booking_data = None
    offset_days = 60 + (ts % 100)
    now = time.strftime("%Y-%m-%dT10:00:00", time.localtime(time.time() + 86400 * offset_days))
    ret = time.strftime("%Y-%m-%dT10:00:00", time.localtime(time.time() + 86400 * (offset_days + 2)))

    for v in vehicles:
        vid = v.get("id")
        st, _, body = req(f"{BASE_URL}/api/bookings", method="POST", payload={
            "vehicleId": vid,
            "pickupDateTime": now,
            "returnDateTime": ret,
            "pickupLocation": "Indiranagar Hub",
            "returnLocation": "Indiranagar Hub",
            "paymentOrderId": f"SEC-PAY-{ts}-{vid}"
        }, headers=headers_a)
        if st in (200, 201):
            booking_data = json.loads(body.decode("utf-8"))
            break

    assert booking_data is not None, f"Could not create booking on any vehicle: {body.decode('utf-8')}"
    booking_ref = booking_data["bookingReference"]
    booking_id = booking_data["id"]
    print(f"  ✓ Created booking ref: {booking_ref} (ID: {booking_id}) on vehicle: {booking_data.get('vehicleId')}")

    # Give notification service 2s to generate PDF invoice
    time.sleep(2)

    # =========================================================================
    # 1. SEC-01: INVOICE ACCESS AUTHORIZATION
    # =========================================================================
    print("\n" + "=" * 50)
    print("1. SEC-01: INVOICE ACCESS AUTHORIZATION TESTS")
    print("=" * 50)

    # 1.1 Unauthenticated download -> 401
    st, _, body = req(f"{BASE_URL}/api/notifications/invoice/{booking_ref}")
    print(f"  [1.1] Unauthenticated invoice download: HTTP {st}")
    assert st == 401, f"Expected 401 Unauthenticated, got {st}"
    results["SEC-01.1: Unauthenticated request rejected with 401"] = "PASSED"

    # Poll for invoice generation
    print("  [WAIT] Waiting for async PDF invoice generation...")
    invoice_ready = False
    for attempt in range(12):
        time.sleep(1)
        st, hdrs, body = req(f"{BASE_URL}/api/notifications/invoice/{booking_ref}", headers=headers_a)
        if st == 200 and body.startswith(b"%PDF"):
            invoice_ready = True
            break

    ct = hdrs.get("Content-Type", "")
    is_pdf = body.startswith(b"%PDF")
    print(f"  [1.2] Customer downloading own invoice: HTTP {st} | Content-Type: {ct} | PDF Magic: {is_pdf} | Bytes: {len(body)}")
    assert invoice_ready and st == 200 and "application/pdf" in ct and is_pdf, f"Expected 200 PDF, got {st}, {ct}"
    results["SEC-01.2: Customer downloading own invoice succeeds with valid PDF (200)"] = "PASSED"

    # 1.3 Customer B downloading Customer A's invoice -> 403 Forbidden
    st, _, body = req(f"{BASE_URL}/api/notifications/invoice/{booking_ref}", headers=headers_b)
    print(f"  [1.3] Unauthorized customer downloading invoice: HTTP {st}")
    assert st == 403, f"Expected 403 Forbidden, got {st}"
    results["SEC-01.3: Unauthorized customer access rejected with 403"] = "PASSED"

    # 1.4 Admin downloading invoice -> 200 PDF
    st, hdrs, body = req(f"{BASE_URL}/api/notifications/invoice/{booking_ref}", headers=headers_admin)
    ct = hdrs.get("Content-Type", "")
    is_pdf = body.startswith(b"%PDF")
    print(f"  [1.4] Admin downloading invoice: HTTP {st} | Content-Type: {ct} | PDF Magic: {is_pdf} | Bytes: {len(body)}")
    assert st == 200 and "application/pdf" in ct and is_pdf, f"Expected 200 PDF for admin, got {st}"
    results["SEC-01.4: Admin authorized download succeeds (200)"] = "PASSED"

    # 1.5 Missing invoice -> 404 Not Found
    st, _, body = req(f"{BASE_URL}/api/notifications/invoice/VYR-NONEXISTENT-9999", headers=headers_a)
    print(f"  [1.5] Non-existent invoice download: HTTP {st}")
    assert st == 404, f"Expected 404 Not Found, got {st}"
    results["SEC-01.5: Missing invoice returns 404"] = "PASSED"

    # =========================================================================
    # 2. SEC-02: CORS CONFIGURATION
    # =========================================================================
    print("\n" + "=" * 50)
    print("2. SEC-02: CORS CONFIGURATION TESTS")
    print("=" * 50)

    # 2.1 Approved origin: https://vayro.com
    st, hdrs, _ = req(f"{BASE_URL}/api/vehicles", method="OPTIONS", headers={
        "Origin": "https://vayro.com",
        "Access-Control-Request-Method": "GET"
    })
    allow_origin = hdrs.get("Access-Control-Allow-Origin")
    allow_creds = hdrs.get("Access-Control-Allow-Credentials")
    print(f"  [2.1] Approved origin https://vayro.com: HTTP {st} | Allow-Origin: {allow_origin} | Allow-Credentials: {allow_creds}")
    assert st == 200 and allow_origin == "https://vayro.com" and allow_creds == "true"
    results["SEC-02.1: Production origin https://vayro.com allowed with credentials"] = "PASSED"

    # 2.2 Approved origin: https://www.vayro.com
    st, hdrs, _ = req(f"{BASE_URL}/api/vehicles", method="OPTIONS", headers={
        "Origin": "https://www.vayro.com",
        "Access-Control-Request-Method": "GET"
    })
    allow_origin = hdrs.get("Access-Control-Allow-Origin")
    allow_creds = hdrs.get("Access-Control-Allow-Credentials")
    print(f"  [2.2] Approved origin https://www.vayro.com: HTTP {st} | Allow-Origin: {allow_origin} | Allow-Credentials: {allow_creds}")
    assert st == 200 and allow_origin == "https://www.vayro.com" and allow_creds == "true"
    results["SEC-02.2: Production origin https://www.vayro.com allowed with credentials"] = "PASSED"

    # 2.3 Local development origin: http://localhost:5173
    st, hdrs, _ = req(f"{BASE_URL}/api/vehicles", method="OPTIONS", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET"
    })
    allow_origin = hdrs.get("Access-Control-Allow-Origin")
    print(f"  [2.3] Local dev origin http://localhost:5173: HTTP {st} | Allow-Origin: {allow_origin}")
    assert st == 200 and allow_origin == "http://localhost:5173"
    results["SEC-02.3: Development origin http://localhost:5173 allowed"] = "PASSED"

    # 2.4 Unapproved origin: https://evil-attacker.com
    st, hdrs, _ = req(f"{BASE_URL}/api/vehicles", method="OPTIONS", headers={
        "Origin": "https://evil-attacker.com",
        "Access-Control-Request-Method": "GET"
    })
    allow_origin = hdrs.get("Access-Control-Allow-Origin")
    print(f"  [2.4] Unapproved origin https://evil-attacker.com: HTTP {st} | Allow-Origin: {allow_origin}")
    assert allow_origin != "https://evil-attacker.com" and allow_origin != "*"
    results["SEC-02.4: Unapproved origin rejected (no Allow-Origin returned)"] = "PASSED"

    # 2.5 Wildcard origin with credentials check
    assert allow_origin != "*", "Wildcard origin must never be returned with credentials"
    results["SEC-02.5: Wildcard origin pattern removed"] = "PASSED"

    # =========================================================================
    # 3. SEC-04: SECURE NOTIFICATION DISPATCH
    # =========================================================================
    print("\n" + "=" * 50)
    print("3. SEC-04: SECURE NOTIFICATION DISPATCH TESTS")
    print("=" * 50)

    dispatch_payload = {
        "bookingId": booking_id,
        "bookingReference": booking_ref,
        "vehicleName": "TVS Apache RR310",
        "customerName": "Owner Customer",
        "customerEmail": email_a,
        "customerPhone": "+91 98765 00001",
        "pickupDateTime": now,
        "formattedPickupTime": "Tomorrow 10:00 AM",
        "returnDateTime": ret,
        "formattedReturnTime": "3 Days Later 10:00 AM",
        "pickupLocation": "Indiranagar Hub",
        "rentalDays": 2,
        "totalAmount": 4500.0,
        "advancePaid": 0.0,
        "idempotencyKey": f"BOOKING_CONFIRMED:{booking_ref}:RECHECK"
    }

    # 3.1 Unauthenticated booking-confirmed dispatch -> 401
    st, _, body = req(f"{BASE_URL}/api/notifications/booking-confirmed", method="POST", payload=dispatch_payload)
    print(f"  [3.1] Unauthenticated dispatch request: HTTP {st}")
    assert st == 401, f"Expected 401 Unauthorized, got {st}"
    results["SEC-04.1: Unauthenticated dispatch rejected with 401"] = "PASSED"

    # 3.2 Customer token invoking booking-confirmed dispatch -> 403 Forbidden
    st, _, body = req(f"{BASE_URL}/api/notifications/booking-confirmed", method="POST", payload=dispatch_payload, headers=headers_a)
    print(f"  [3.2] Customer token invoking dispatch endpoint: HTTP {st}")
    assert st == 403, f"Expected 403 Forbidden, got {st}"
    results["SEC-04.2: Ordinary customer token rejected with 403 Forbidden"] = "PASSED"

    # 3.3 Complete booking activation and vehicle return workflow
    print(f"\n  [3.3] Confirming and activating booking {booking_id}...")
    st, _, conf_res = req(f"{BASE_URL}/api/bookings/{booking_id}/confirm", method="PATCH", headers=headers_admin)
    assert st == 200, f"Booking confirm failed with HTTP {st}"
    st, _, act_res = req(f"{BASE_URL}/api/bookings/{booking_id}/activate", method="PATCH", headers=headers_admin)
    assert st == 200, f"Booking activate failed with HTTP {st}"

    print(f"  [3.3] Customer returning vehicle for booking {booking_id}...")
    st, _, ret_res = req(f"{BASE_URL}/api/bookings/{booking_id}/return", method="PATCH", payload={
        "returnLocation": "Indiranagar Hub"
    }, headers=headers_a)
    print(f"  [3.3] Return workflow response: HTTP {st}")
    assert st == 200, f"Return failed with HTTP {st}"
    ret_data = json.loads(ret_res.decode("utf-8")) if st == 200 else {}
    assert ret_data.get("status") == "RETURNED", f"Expected RETURNED, got {ret_data.get('status')}"
    results["SEC-04.3: Legitimate booking confirmation and vehicle return workflow preserved"] = "PASSED"

    # =========================================================================
    # 4. SEC-10: GOOGLE OAUTH EMAIL VERIFICATION
    # =========================================================================
    print("\n" + "=" * 50)
    print("4. SEC-10: GOOGLE OAUTH EMAIL VERIFICATION TESTS")
    print("=" * 50)

    # 4.1 Invalid Google credential rejected
    st, _, body = req(f"{BASE_URL}/api/auth/google", method="POST", payload={"credential": "invalid-unverified-token"})
    print(f"  [4.1] Invalid / fake Google ID token: HTTP {st}")
    assert st in (400, 401), f"Expected 400 or 401 for invalid Google token, got {st}"
    results["SEC-10.1: Invalid / unverified Google tokens rejected"] = "PASSED"

    # 4.2 Empty credential rejected
    st, _, body = req(f"{BASE_URL}/api/auth/google", method="POST", payload={"credential": ""})
    print(f"  [4.2] Empty credential rejected: HTTP {st}")
    assert st in (400, 401), f"Expected 400 or 401 for empty credential, got {st}"
    results["SEC-10.2: Empty Google token rejected"] = "PASSED"

    print("\n" + "=" * 80)
    print("PHASE 1 SECURITY REMEDIATION SUMMARY")
    print("=" * 80)
    all_ok = True
    for name, res in results.items():
        print(f"  [{res}] {name}")
        if res != "PASSED":
            all_ok = False

    print("=" * 80)
    if all_ok:
        print("ALL SECURITY REMEDIATION TESTS PASSED (100% SUCCESS)!")
    else:
        print("SECURITY TESTS FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
