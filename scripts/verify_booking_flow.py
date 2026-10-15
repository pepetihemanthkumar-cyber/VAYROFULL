#!/usr/bin/env python3
import urllib.request
import json
import time
import datetime
import sys

BASE_URL = "http://localhost:8080"

def post(url, data, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def get(url, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def main():
    print("=" * 70)
    print("VAYRO — SIMPLIFIED BOOKING FLOW & PERSISTENCE VERIFICATION")
    print("=" * 70)

    # 1. Customer & Admin Login
    print("\n[STEP 1] Customer & Admin Authentication")
    status, cust_auth = post(f"{BASE_URL}/api/auth/login", {"email": "customer@vayro.com", "password": "VayroCustomer2026!"})
    if status != 200:
        print(f"FAILED: Customer login returned HTTP {status}")
        sys.exit(1)
    cust_token = cust_auth["token"]
    print("  Customer Login: SUCCESS (JWT token received)")

    status, admin_auth = post(f"{BASE_URL}/api/auth/login", {"email": "admin@vayro.com", "password": "VayroAdmin2026!"})
    if status != 200:
        print(f"FAILED: Admin login returned HTTP {status}")
        sys.exit(1)
    admin_token = admin_auth["token"]
    print("  Admin Login   : SUCCESS (JWT token with ROLE_ADMIN received)")

    # 2. Select Vehicle
    print("\n[STEP 2] Vehicle Catalogue Selection")
    status, vehicles_data = get(f"{BASE_URL}/api/vehicles?page=0&size=5")
    if status != 200 or not vehicles_data.get("content"):
        print(f"FAILED: Could not retrieve vehicle catalogue (HTTP {status})")
        sys.exit(1)
    v = vehicles_data["content"][0]
    v_id = v["id"]
    v_name = v["name"]
    v_rate = v.get("pricePerDay")
    print(f"  Selected: {v_name} (ID: {v_id}, Daily Rate: ₹{v_rate})")

    # 3. Reject Invalid Dates
    print("\n[STEP 3] Date Validation & Error Rejection")
    status, past_resp = post(f"{BASE_URL}/api/bookings", {
        "vehicleId": v_id,
        "pickupDateTime": "2020-01-01T10:00:00",
        "returnDateTime": "2020-01-05T10:00:00",
        "pickupLocation": "Mumbai Fleet Hub",
        "returnLocation": "Mumbai Fleet Hub"
    }, headers={"Authorization": f"Bearer {cust_token}"})
    print(f"  Past Dates Rejection  : HTTP {status} (Expected 400 - PASS)")
    assert status == 400

    # 4. Create Booking (Confirm Booking Flow)
    print("\n[STEP 4] Customer Booking Creation (Confirm Booking — No Gateway)")
    now = datetime.datetime.now()
    offset_days = 50 + int(time.time()) % 250
    pickup_dt = (now + datetime.timedelta(days=offset_days)).strftime("%Y-%m-%dT10:00:00")
    return_dt = (now + datetime.timedelta(days=offset_days + 3)).strftime("%Y-%m-%dT10:00:00")
    idemp_order_id = f"ORD-CLIENT-{int(time.time() * 1000)}"

    booking_payload = {
        "vehicleId": v_id,
        "pickupDateTime": pickup_dt,
        "returnDateTime": return_dt,
        "pickupLocation": "Mumbai Central Hub",
        "returnLocation": "Mumbai Central Hub",
        "paymentOrderId": idemp_order_id,
        "paymentMethod": "PAY_AT_PICKUP",
        "paymentStatus": "SIMULATED",
        "customerName": "Aarav Sharma",
        "customerEmail": "customer@vayro.com",
        "customerPhone": "+91 98765 43210"
    }

    status, new_booking = post(f"{BASE_URL}/api/bookings", booking_payload, headers={"Authorization": f"Bearer {cust_token}"})
    print(f"  Booking API Response  : HTTP {status} (Expected 201 - PASS)")
    if status != 201:
        print(f"FAILED: {new_booking}")
        sys.exit(1)

    booking_ref = new_booking["bookingReference"]
    total_amount = new_booking["totalAmount"]
    payment_status = new_booking["paymentStatus"]
    res_status = new_booking["status"]
    print(f"  Booking Reference     : {booking_ref}")
    print(f"  Server Total Amount   : ₹{total_amount}")
    print(f"  Reservation Status    : {res_status}")
    print(f"  Payment Status        : {payment_status} (Pending settlement / Demo mode - PASS)")
    assert payment_status == "PENDING"

    # 5. Test Repeated Click / Idempotency
    print("\n[STEP 5] Repeated Click / Idempotency Protection")
    status, dup_booking = post(f"{BASE_URL}/api/bookings", booking_payload, headers={"Authorization": f"Bearer {cust_token}"})
    print(f"  Repeated Submission   : HTTP {status}")
    assert dup_booking["bookingReference"] == booking_ref
    print(f"  Idempotency Result    : PASS (Returned identical existing reference {booking_ref}, zero duplicates)")

    # 6. Test Overlap Conflict Prevention
    print("\n[STEP 6] Overlap Conflict Prevention")
    conflict_payload = {
        "vehicleId": v_id,
        "pickupDateTime": (now + datetime.timedelta(days=offset_days + 1)).strftime("%Y-%m-%dT10:00:00"),
        "returnDateTime": (now + datetime.timedelta(days=offset_days + 2)).strftime("%Y-%m-%dT10:00:00"),
        "pickupLocation": "Mumbai Central Hub",
        "returnLocation": "Mumbai Central Hub",
        "paymentOrderId": f"ORD-CONFLICT-{int(time.time() * 1000)}"
    }
    status, conflict_resp = post(f"{BASE_URL}/api/bookings", conflict_payload, headers={"Authorization": f"Bearer {cust_token}"})
    print(f"  Conflicting Booking   : HTTP {status} (Expected 409 Conflict - PASS)")
    assert status == 409

    # 7. Customer Booking History
    print("\n[STEP 7] Customer Booking History Verification")
    status, my_bookings = get(f"{BASE_URL}/api/bookings/my", headers={"Authorization": f"Bearer {cust_token}"})
    found_in_my = any(b["bookingReference"] == booking_ref for b in my_bookings.get("content", []))
    print(f"  Customer My-Bookings  : HTTP {status} | Found={found_in_my} | Total Bookings={my_bookings.get('totalElements')}")
    assert found_in_my

    # 8. Admin Bookings Dashboard
    print("\n[STEP 8] Admin Bookings Dashboard Verification")
    status, admin_bookings = get(f"{BASE_URL}/api/bookings", headers={"Authorization": f"Bearer {admin_token}"})
    found_in_admin = any(b["bookingReference"] == booking_ref for b in admin_bookings.get("content", []))
    print(f"  Admin All-Bookings    : HTTP {status} | Found={found_in_admin} | Total Bookings={admin_bookings.get('totalElements')}")
    assert found_in_admin

    # 9. Invoice PDF Generation
    print("\n[STEP 9] Invoice PDF Stream Verification")
    invoice_ready = False
    for attempt in range(15):
        time.sleep(1.0)
        try:
            req = urllib.request.Request(f"{BASE_URL}/api/notifications/invoice/{booking_ref}", headers={"Authorization": f"Bearer {cust_token}"})
            with urllib.request.urlopen(req) as resp:
                if resp.status == 200:
                    pdf_bytes = resp.read()
                    is_valid_pdf = pdf_bytes.startswith(b"%PDF")
                    print(f"  Invoice PDF Download  : HTTP {resp.status} | Size={len(pdf_bytes)} bytes | Valid Header={is_valid_pdf} (Attempt {attempt + 1})")
                    assert is_valid_pdf
                    invoice_ready = True
                    break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            raise
    assert invoice_ready, "PDF invoice was not generated within timeout."

    print("\n" + "=" * 70)
    print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    main()
