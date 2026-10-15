import urllib.request
import urllib.error
import json
import time
import datetime

BASE = "http://localhost:8080"

def post(url, body, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req) as r:
        return r.status, json.loads(r.read())

def patch(url, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def get(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def main():
    print("=" * 70)
    print("VAYRO — VEHICLE RETURN WORKFLOW VERIFICATION")
    print("=" * 70)

    # 1. Admin & Customer Login
    _, admin_login = post(f"{BASE}/api/auth/login", {"email": "admin@vayro.com", "password": "VayroAdmin2026!"})
    admin_token = admin_login["token"]

    ts = int(time.time())
    cust_email = f"return_flow_test_{ts}@vayro.test"
    _, cust_reg = post(f"{BASE}/api/auth/register", {
        "firstName": "Return", "lastName": "Tester", "email": cust_email, "password": "TesterPass2026!", "phone": "+91 98888 12345"
    })
    cust_token = cust_reg["token"]
    cust_id = cust_reg["user"]["id"]
    print(f"Customer registered: ID={cust_id}, Email={cust_email}")

    # Register separate customer to test unauthorized access
    _, other_reg = post(f"{BASE}/api/auth/register", {
        "firstName": "Other", "lastName": "User", "email": f"other_{ts}@vayro.test", "password": "TesterPass2026!", "phone": "+91 97777 54321"
    })
    other_token = other_reg["token"]

    # 2. Customer creates reservation
    now = datetime.datetime.now()
    offset_days = 200 + (ts % 80)
    pickup_dt = (now + datetime.timedelta(days=offset_days)).strftime("%Y-%m-%dT10:00:00")
    return_dt = (now + datetime.timedelta(days=offset_days + 3)).strftime("%Y-%m-%dT10:00:00")
    test_veh_id = "ktm-duke-390"

    # Initial vehicle status
    _, veh_before = get(f"{BASE}/api/vehicles/{test_veh_id}")
    print(f"1. Vehicle status before reservation: {veh_before.get('status')}")

    booking_payload = {
        "vehicleId": test_veh_id,
        "pickupDateTime": pickup_dt,
        "returnDateTime": return_dt,
        "pickupLocation": "Mumbai Central Hub",
        "returnLocation": "Mumbai Central Hub",
        "paymentOrderId": f"ORD-RET-{ts}",
        "paymentMethod": "PAY_AT_PICKUP",
        "paymentStatus": "SIMULATED",
        "customerName": "Return Tester",
        "customerEmail": cust_email,
        "customerPhone": "+91 98888 12345"
    }
    _, new_booking = post(f"{BASE}/api/bookings", booking_payload, cust_token)
    booking_id = new_booking["id"]
    booking_ref = new_booking["bookingReference"]
    print(f"2. Created Booking: ID={booking_id}, Ref={booking_ref}")
    print(f"   Status: {new_booking['status']}, PaymentStatus: {new_booking['paymentStatus']}")

    # 3. Activate booking (vehicle on road)
    _, act_resp = patch(f"{BASE}/api/bookings/{booking_id}/activate", token=admin_token)
    print(f"3. Activated Booking: Status={act_resp.get('status')}")
    _, veh_active = get(f"{BASE}/api/vehicles/{test_veh_id}")
    print(f"   Vehicle status when rented: {veh_active.get('status')}")

    # 4. Attempt unauthorized return by another customer
    unauth_status, unauth_body = patch(f"{BASE}/api/bookings/{booking_id}/return", token=other_token)
    print(f"4. Unauthorized return attempt by different customer: HTTP {unauth_status} (Expected 403 - PASS)")
    assert unauth_status == 403

    # 5. Customer returns vehicle through API
    ret_status, ret_body = patch(f"{BASE}/api/bookings/{booking_id}/return", token=cust_token)
    print(f"5. Customer returns own vehicle: HTTP {ret_status}")
    print(f"   Persisted Status : {ret_body.get('status')}")
    print(f"   Returned At      : {ret_body.get('returnedAt')}")
    print(f"   Payment Status   : {ret_body.get('paymentStatus')} (Accurate, not falsely marked PAID - PASS)")
    assert ret_status == 200
    assert ret_body["status"] == "RETURNED"
    assert ret_body["returnedAt"] is not None
    assert ret_body["paymentStatus"] != "PAID"

    # 6. Verify vehicle status updated to AVAILABLE
    _, veh_after = get(f"{BASE}/api/vehicles/{test_veh_id}")
    print(f"6. Vehicle status in Vehicle Service: {veh_after.get('status')} (Expected AVAILABLE - PASS)")
    assert veh_after.get("status") == "AVAILABLE"

    # 7. Customer cannot return the same booking twice
    ret2_status, ret2_body = patch(f"{BASE}/api/bookings/{booking_id}/return", token=cust_token)
    print(f"7. Attempt to return already RETURNED booking: HTTP {ret2_status} (Expected 400 - PASS)")
    assert ret2_status == 400

    # 8. Query booking as Admin and Customer to verify persistence
    _, cust_view = get(f"{BASE}/api/bookings/{booking_id}", token=cust_token)
    print(f"8. Customer query: Status={cust_view.get('status')}, ReturnedAt={cust_view.get('returnedAt')}")
    assert cust_view.get("status") == "RETURNED"

    _, admin_view = get(f"{BASE}/api/bookings/{booking_id}", token=admin_token)
    print(f"   Admin query   : Status={admin_view.get('status')}, ReturnedAt={admin_view.get('returnedAt')}")
    assert admin_view.get("status") == "RETURNED"

    print("=" * 70)
    print("ALL RETURN WORKFLOW CHECKS PASSED FOR ACTIVE BOOKING!")
    print(f"Booking Reference : {booking_ref}")
    print(f"Returned Status   : {ret_body.get('status')}")
    print(f"Returned At       : {ret_body.get('returnedAt')}")
    print("=" * 70)

if __name__ == "__main__":
    main()
