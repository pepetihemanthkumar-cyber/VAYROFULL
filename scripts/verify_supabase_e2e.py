import datetime
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE_URL = "http://localhost:8080"

def req_json(url, method="GET", payload=None, headers=None):
    if headers is None:
        headers = {}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode("utf-8")
            try:
                return status, json.loads(body)
            except Exception:
                return status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def main():
    print("=" * 70)
    print("VAYRO — SUPABASE CLOUD END-TO-END VERIFICATION")
    print("=" * 70)

    ts = int(time.time())
    test_email = f"test_supabase_customer_{ts}@vayro.test"
    test_password = "TestCustomerPass2026!"
    test_first_name = "Cloud"
    test_last_name = "Tester"

    print(f"\n[STEP 1] Customer Registration & Profile Retrieval")
    reg_payload = {
        "firstName": test_first_name,
        "lastName": test_last_name,
        "email": test_email,
        "password": test_password,
        "phone": "+91 98765 11223"
    }
    status, reg_resp = req_json(f"{BASE_URL}/api/auth/register", method="POST", payload=reg_payload)
    print(f"  Register Status: HTTP {status}")
    if status not in (200, 201):
        print(f"  Registration Failed: {reg_resp}")
        sys.exit(1)

    # Login customer
    login_payload = {"email": test_email, "password": test_password}
    status, login_resp = req_json(f"{BASE_URL}/api/auth/login", method="POST", payload=login_payload)
    print(f"  Customer Login Status: HTTP {status}")
    assert status == 200, f"Login failed: {login_resp}"
    cust_token = login_resp.get("token") or login_resp.get("accessToken")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Retrieve profile
    status, profile_resp = req_json(f"{BASE_URL}/api/users/me", headers=cust_headers)
    print(f"  Profile Status: HTTP {status} | Email: {profile_resp.get('email')} | Role: {profile_resp.get('role')}")
    assert status == 200
    assert profile_resp.get("email") == test_email

    print(f"\n[STEP 2] Vehicle Catalogue Retrieval (207 Vehicles)")
    status, vehicles_resp = req_json(f"{BASE_URL}/api/vehicles?page=0&size=300", headers=cust_headers)
    total_vehicles = vehicles_resp.get("totalElements", len(vehicles_resp) if isinstance(vehicles_resp, list) else 0)
    print(f"  Vehicles Status: HTTP {status} | Total Elements: {total_vehicles}")
    assert status == 200
    assert total_vehicles == 207, f"Expected 207 vehicles, found {total_vehicles}"

    print(f"\n[STEP 3] Booking Validation (Invalid / Past Dates)")
    now = datetime.datetime.now()
    past_pickup = (now - datetime.timedelta(days=2)).strftime("%Y-%m-%dT10:00:00")
    past_return = (now - datetime.timedelta(days=1)).strftime("%Y-%m-%dT10:00:00")
    invalid_payload = {
        "vehicleId": "aprilia-rs-457",
        "pickupDateTime": past_pickup,
        "returnDateTime": past_return,
        "pickupLocation": "Mumbai Central Hub",
        "returnLocation": "Mumbai Central Hub",
        "paymentOrderId": f"ORD-INVALID-{ts}"
    }
    status, err_resp = req_json(f"{BASE_URL}/api/bookings", method="POST", payload=invalid_payload, headers=cust_headers)
    print(f"  Past Dates Rejection: HTTP {status} (Expected 400 - PASS)")
    assert status == 400

    print(f"\n[STEP 4] Customer Booking Creation (Pay at Pickup / Demo Mode)")
    offset_days = 320 + (ts % 100)
    pickup_dt = (now + datetime.timedelta(days=offset_days)).strftime("%Y-%m-%dT10:00:00")
    return_dt = (now + datetime.timedelta(days=offset_days + 3)).strftime("%Y-%m-%dT10:00:00")
    client_order_id = f"ORD-CLIENT-SUPABASE-{ts}"

    booking_payload = {
        "vehicleId": "aprilia-rs-457",
        "pickupDateTime": pickup_dt,
        "returnDateTime": return_dt,
        "pickupLocation": "Mumbai Central Hub",
        "returnLocation": "Mumbai Central Hub",
        "paymentOrderId": client_order_id,
        "paymentMethod": "PAY_AT_PICKUP",
        "paymentStatus": "SIMULATED",
        "customerName": f"{test_first_name} {test_last_name}",
        "customerEmail": test_email,
        "customerPhone": "+91 98765 11223"
    }
    status, booking_resp = req_json(f"{BASE_URL}/api/bookings", method="POST", payload=booking_payload, headers=cust_headers)
    print(f"  Booking Creation Status: HTTP {status} (Expected 201 - PASS)")
    assert status == 201
    booking_ref = booking_resp["bookingReference"]
    total_amount = booking_resp["totalAmount"]
    res_status = booking_resp["status"]
    pay_status = booking_resp["paymentStatus"]
    print(f"  Booking Reference  : {booking_ref}")
    print(f"  Authoritative Total: ₹{total_amount}")
    print(f"  Reservation Status : {res_status}")
    print(f"  Payment Status     : {pay_status} (Pending settlement / Demo mode - PASS)")
    assert res_status == "CONFIRMED"
    assert pay_status == "PENDING"

    print(f"\n[STEP 5] Repeated Click / Idempotency Duplicate Protection")
    status, dup_resp = req_json(f"{BASE_URL}/api/bookings", method="POST", payload=booking_payload, headers=cust_headers)
    print(f"  Repeated Submission: HTTP {status}")
    assert dup_resp["bookingReference"] == booking_ref
    print(f"  Idempotency Result : PASS (Returned identical booking reference {booking_ref}, zero duplicates)")

    print(f"\n[STEP 6] Booking Overlap Prevention")
    conflict_payload = {
        "vehicleId": "aprilia-rs-457",
        "pickupDateTime": (now + datetime.timedelta(days=offset_days + 1)).strftime("%Y-%m-%dT10:00:00"),
        "returnDateTime": (now + datetime.timedelta(days=offset_days + 2)).strftime("%Y-%m-%dT10:00:00"),
        "pickupLocation": "Mumbai Central Hub",
        "returnLocation": "Mumbai Central Hub",
        "paymentOrderId": f"ORD-CONFLICT-{ts}"
    }
    status, conflict_resp = req_json(f"{BASE_URL}/api/bookings", method="POST", payload=conflict_payload, headers=cust_headers)
    print(f"  Overlapping Booking: HTTP {status} (Expected 409 Conflict - PASS)")
    assert status == 409

    print(f"\n[STEP 7] Customer Booking History Verification")
    status, my_bookings = req_json(f"{BASE_URL}/api/bookings/my", headers=cust_headers)
    print(f"  Customer My-Bookings: HTTP {status} | Total Elements: {my_bookings.get('totalElements')}")
    assert status == 200
    found_in_my = any(b["bookingReference"] == booking_ref for b in my_bookings.get("content", []))
    assert found_in_my, f"Booking {booking_ref} not found in customer booking history"
    print(f"  Booking {booking_ref} verified in customer history!")

    print(f"\n[STEP 8] Invoice PDF Generation Verification")
    invoice_ready = False
    for attempt in range(15):
        time.sleep(1.0)
        try:
            req = urllib.request.Request(f"{BASE_URL}/api/notifications/invoice/{booking_ref}", headers=cust_headers)
            with urllib.request.urlopen(req) as resp:
                if resp.status == 200:
                    pdf_bytes = resp.read()
                    is_valid_pdf = pdf_bytes.startswith(b"%PDF")
                    print(f"  Invoice PDF Download: HTTP {resp.status} | Size: {len(pdf_bytes)} bytes | Valid Header: {is_valid_pdf} (Attempt {attempt + 1})")
                    assert is_valid_pdf
                    invoice_ready = True
                    break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            raise
    assert invoice_ready, "PDF invoice was not generated within timeout."

    print(f"\n[STEP 9] Admin Authentication & Visibility")
    admin_login = {"email": "admin@vayro.com", "password": "VayroAdmin2026!"}
    status, admin_auth = req_json(f"{BASE_URL}/api/auth/login", method="POST", payload=admin_login)
    admin_role = admin_auth.get("role") or admin_auth.get("user", {}).get("role")
    print(f"  Admin Login: HTTP {status} (Role: {admin_role})")
    assert status == 200 and admin_role == "ADMIN"
    admin_token = admin_auth.get("token") or admin_auth.get("accessToken")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin view users
    status, admin_users = req_json(f"{BASE_URL}/api/users?page=0&size=50", headers=admin_headers)
    total_u = admin_users.get("totalElements") if isinstance(admin_users, dict) else len(admin_users)
    print(f"  Admin Users Dashboard: HTTP {status} | Total Users: {total_u}")
    assert status == 200
    user_list = admin_users.get("content", []) if isinstance(admin_users, dict) else admin_users
    assert any(u["email"] == test_email for u in user_list)

    # Admin view bookings
    status, admin_bookings = req_json(f"{BASE_URL}/api/bookings?page=0&size=50", headers=admin_headers)
    total_b = admin_bookings.get("totalElements") if isinstance(admin_bookings, dict) else len(admin_bookings)
    print(f"  Admin Bookings Dashboard: HTTP {status} | Total Bookings: {total_b}")
    assert status == 200
    booking_list = admin_bookings.get("content", []) if isinstance(admin_bookings, dict) else admin_bookings
    assert any(b["bookingReference"] == booking_ref for b in booking_list)

    print(f"\n[STEP 10] Role-Based Access Control (RBAC) Enforcement")
    # Customer accessing admin users list
    status, rbac_resp1 = req_json(f"{BASE_URL}/api/users", headers=cust_headers)
    print(f"  Customer accessing Admin Users endpoint: HTTP {status} (Expected 403 - PASS)")
    assert status == 403

    # Customer accessing admin all-bookings list
    status, rbac_resp2 = req_json(f"{BASE_URL}/api/bookings", headers=cust_headers)
    print(f"  Customer accessing Admin Bookings endpoint: HTTP {status} (Expected 403 - PASS)")
    assert status == 403

    # Unauthenticated request
    status, unauth_resp = req_json(f"{BASE_URL}/api/bookings/my")
    print(f"  Unauthenticated request: HTTP {status} (Expected 401 - PASS)")
    assert status == 401

    print("\n" + "=" * 70)
    print(f"ALL END-TO-END CHECKS PASSED FOR CLUSTER & SUPABASE!")
    print(f"Documented Test User   : {test_email}")
    print(f"Documented Test Booking: {booking_ref}")
    print("=" * 70)

if __name__ == "__main__":
    main()
