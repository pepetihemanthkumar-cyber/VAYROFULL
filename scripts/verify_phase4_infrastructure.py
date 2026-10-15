#!/usr/bin/env python3
"""
VAYRO — Phase 4 Infrastructure Security Verification Script
Verifies:
1. Docker Compose database configuration safety (Supabase explicit vs local override)
2. API Gateway port exposure isolation (127.0.0.1:8080 only, no public 0.0.0.0)
3. Eureka registry blocked from public Gateway access (401 Unauthorized)
4. Anti-spoofing rate limiting: rotating X-Forwarded-For cannot bypass rate limiter
5. Normal route availability (catalogue, auth, health)
"""

import sys
import json
import time
import subprocess
import urllib.request
import urllib.error

FRONTEND_URL = "http://localhost"
GATEWAY_URL = "http://127.0.0.1:8080"

def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    if data is not None and isinstance(data, (dict, list)):
        data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif data is not None and isinstance(data, str):
        data = data.encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            resp_headers = {k.lower(): v for k, v in response.headers.items()}
            body = response.read().decode("utf-8")
            try:
                parsed_json = json.loads(body)
            except Exception:
                parsed_json = body
            return status, resp_headers, parsed_json
    except urllib.error.HTTPError as e:
        status = e.code
        resp_headers = {k.lower(): v for k, v in e.headers.items()}
        body = e.read().decode("utf-8")
        try:
            parsed_json = json.loads(body)
        except Exception:
            parsed_json = body
        return status, resp_headers, parsed_json
    except Exception as e:
        return 0, {}, str(e)


def test_database_compose_config():
    print("\n--- 1. Testing Database Compose Configuration Safety ---")
    try:
        # Validate base compose config evaluates
        cmd_base = ["docker", "compose", "config", "--services"]
        out_base = subprocess.check_output(cmd_base).decode("utf-8").strip().splitlines()
        print(f"  [PASS] Base docker-compose.yml config valid. Services: {', '.join(out_base)}")

        # Validate Supabase compose config evaluates
        cmd_supabase = ["docker", "compose", "-f", "docker-compose.yml", "-f", "docker-compose.supabase.yml", "config", "--services"]
        out_supabase = subprocess.check_output(cmd_supabase).decode("utf-8").strip().splitlines()
        print(f"  [PASS] Supabase explicit docker-compose.supabase.yml config valid. Services: {', '.join(out_supabase)}")

        # Validate local compose override evaluates
        cmd_local = ["docker", "compose", "-f", "docker-compose.yml", "-f", "docker-compose.local.yml", "config", "--services"]
        out_local = subprocess.check_output(cmd_local).decode("utf-8").strip().splitlines()
        print(f"  [PASS] Local override docker-compose.local.yml config valid. Services: {', '.join(out_local)}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  [FAIL] Docker Compose validation failed: {e}")
        return False


def test_gateway_network_isolation():
    print("\n--- 2. Testing API Gateway Network Exposure & Port Binding ---")
    try:
        cmd = ["docker", "inspect", "vayro-api-gateway", "--format", "{{json .NetworkSettings.Ports}}"]
        output = subprocess.check_output(cmd).decode("utf-8").strip()
        ports_data = json.loads(output)

        # Check port 8080/tcp
        mappings = ports_data.get("8080/tcp", [])
        if not mappings:
            print("  [PASS] API Gateway has no host port mappings (internal network only).")
            return True

        bound_to_localhost = all(m.get("HostIp") in ("127.0.0.1", "::1") for m in mappings)
        if bound_to_localhost:
            print(f"  [PASS] API Gateway port 8080 is strictly bound to loopback: {mappings}")
            return True
        else:
            print(f"  [FAIL] API Gateway port 8080 is exposed publicly: {mappings}")
            return False
    except Exception as e:
        print(f"  [FAIL] Could not inspect container port bindings: {e}")
        return False


def test_eureka_protection():
    print("\n--- 3. Testing Eureka Registry Blocking on Public Routes ---")
    # Gateway direct check on /eureka
    status1, headers1, body1 = make_request(f"{GATEWAY_URL}/eureka")
    status2, headers2, body2 = make_request(f"{GATEWAY_URL}/eureka/apps")

    passed = True
    if status1 in (401, 404):
        print(f"  [PASS] Direct Gateway GET /eureka blocked with HTTP {status1}")
    else:
        print(f"  [FAIL] Direct Gateway GET /eureka expected 401/404, got {status1}")
        passed = False

    if status2 in (401, 404):
        print(f"  [PASS] Direct Gateway GET /eureka/apps blocked with HTTP {status2}")
    else:
        print(f"  [FAIL] Direct Gateway GET /eureka/apps expected 401/404, got {status2}")
        passed = False

    # Check via Frontend reverse proxy
    status3, headers3, body3 = make_request(f"{FRONTEND_URL}/eureka")
    # Should either serve React index.html (200 with text/html) or 401/404, NOT Eureka XML/JSON
    content_type = headers3.get("content-type", "")
    if "xml" in content_type or "json" in content_type:
        print(f"  [FAIL] Frontend /eureka exposed internal Eureka registry data: {content_type}")
        passed = False
    else:
        print(f"  [PASS] Frontend /eureka does not expose Eureka registry (Content-Type: {content_type})")

    # Check Gateway root does not advertise /eureka
    status_root, _, body_root = make_request(f"{GATEWAY_URL}/")
    if isinstance(body_root, dict) and "eureka" in body_root.get("endpoints", {}):
        print("  [FAIL] Gateway GET / advertises eureka endpoint in response")
        passed = False
    else:
        print("  [PASS] Gateway GET / does not advertise eureka in endpoints")

    return passed


def test_anti_spoofing_rate_limiting():
    print("\n--- 4. Testing Anti-Spoofing Rate Limiting through Edge Proxy ---")
    # Attacker tries to bypass rate limiting by rotating client-supplied X-Forwarded-For
    limit_hit = False
    print("  Sending authentication requests through Nginx with rotating fake X-Forwarded-For headers...")
    for i in range(1, 16):
        fake_ip = f"198.51.100.{i}"
        status, headers, body = make_request(
            f"{FRONTEND_URL}/api/auth/login",
            method="POST",
            headers={"X-Forwarded-For": fake_ip, "X-Real-IP": fake_ip},
            data={"email": "antispoof_test@vayro.com", "password": "WrongPassword!"}
        )
        if status == 429:
            limit_hit = True
            retry_after = headers.get("retry-after")
            print(f"  [PASS] HTTP 429 triggered on request {i} despite spoofed header rotation! (Retry-After: {retry_after}s)")
            break
        time.sleep(0.05)

    if limit_hit:
        print("  [PASS] Edge proxy sanitization and Gateway rate limiter successfully prevent IP spoofing.")
        return True
    else:
        print("  [FAIL] Rate limit was not triggered; spoofed headers may have bypassed limiter.")
        return False


def test_normal_routes_available():
    print("\n--- 5. Testing Normal Route Continuity (Vehicles, Auth, Health) ---")
    passed = True

    # 5a. Vehicle catalogue
    status, headers, body = make_request(f"{FRONTEND_URL}/api/vehicles")
    items = body if isinstance(body, list) else (body.get("content", []) if isinstance(body, dict) else [])
    if status == 200 and len(items) > 0:
        print(f"  [PASS] Vehicle catalogue accessible: HTTP 200, {len(items)} vehicles retrieved.")
    else:
        print(f"  [FAIL] Vehicle catalogue failed: HTTP {status}, body={body}")
        passed = False

    # 5b. Actuator health (internal diagnostics on Gateway)
    status, headers, body = make_request(f"{GATEWAY_URL}/actuator/health")
    if status == 200 and isinstance(body, dict) and body.get("status") == "UP":
        print(f"  [PASS] Actuator health endpoint: HTTP 200, status=UP")
    else:
        print(f"  [FAIL] Actuator health check failed: HTTP {status}, body={body}")
        passed = False

    # 5c. Authentication endpoint rejects bad credentials with 401 (not 500 or broken route)
    # Use distinct IP or wait slightly if needed
    status, headers, body = make_request(
        f"{GATEWAY_URL}/api/auth/login",
        method="POST",
        headers={"X-Real-IP": "172.31.254.99"},
        data={"email": "legit_test@vayro.com", "password": "WrongPassword!"}
    )
    if status in (401, 429):
        print(f"  [PASS] Auth route active and responsive: HTTP {status}")
    else:
        print(f"  [FAIL] Auth route unexpected response: HTTP {status}, body={body}")
        passed = False

    return passed


def main():
    print("=" * 70)
    print("VAYRO — PHASE 4 CRITICAL INFRASTRUCTURE SECURITY VERIFICATION")
    print("=" * 70)

    res1 = test_database_compose_config()
    res2 = test_gateway_network_isolation()
    res3 = test_eureka_protection()
    res4 = test_anti_spoofing_rate_limiting()
    res5 = test_normal_routes_available()

    print("\n" + "=" * 70)
    print("PHASE 4 AUDIT SUMMARY:")
    print(f"  1. Database Compose Safety:     {'PASSED' if res1 else 'FAILED'}")
    print(f"  2. Gateway Network Exposure:    {'PASSED' if res2 else 'FAILED'}")
    print(f"  3. Eureka Registry Blocked:     {'PASSED' if res3 else 'FAILED'}")
    print(f"  4. Anti-Spoofing Rate Limiting: {'PASSED' if res4 else 'FAILED'}")
    print(f"  5. Normal Route Continuity:     {'PASSED' if res5 else 'FAILED'}")
    print("=" * 70)

    if all([res1, res2, res3, res4, res5]):
        print("ALL PHASE 4 CRITICAL INFRASTRUCTURE FIXES VERIFIED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("ONE OR MORE PHASE 4 VERIFICATIONS FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    main()
