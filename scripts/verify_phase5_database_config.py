#!/usr/bin/env python3
"""
VAYRO — Phase 5 Task 1: Database Configuration & Fallback Prevention Verification
Strictly adheres to zero-secret logging rules (no passwords, tokens, or credentials printed).

Verifies:
1. Base docker-compose.yml selects Supabase PostgreSQL configuration.
2. docker-compose.supabase.yml explicitly enforces Supabase configuration with DDL validate.
3. docker-compose.local.yml explicitly switches to local PostgreSQL.
4. Omitting Supabase credentials halts execution with error, preventing silent fallback to local DB.
5. Local development configuration remains available.
"""

import os
import sys
import subprocess
import yaml

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def parse_compose_db_config(compose_args):
    """Safely extracts database connection properties from compose config without printing secrets."""
    cmd = ["docker", "compose"] + compose_args + ["config"]
    res = subprocess.run(cmd, cwd=WORKSPACE_DIR, capture_output=True, text=True)
    if res.returncode != 0:
        return None, res.stderr.strip()

    cfg = yaml.safe_load(res.stdout)
    services_db = {}
    for svc_name in ["user-service", "vehicle-service", "booking-service", "notification-service"]:
        svc = cfg.get("services", {}).get(svc_name, {})
        env = svc.get("environment", {})
        services_db[svc_name] = {
            "DB_HOST": env.get("DB_HOST"),
            "DB_PORT": env.get("DB_PORT"),
            "DB_NAME": env.get("DB_NAME"),
            "DB_SSLMODE": env.get("DB_SSLMODE"),
            "DDL_AUTO": env.get("SPRING_JPA_HIBERNATE_DDL_AUTO"),
            "PASSWORD_CONFIGURED": bool(env.get("DB_PASSWORD", "").strip())
        }
    return services_db, None

def test_compose_configurations():
    print("=" * 70)
    print("VAYRO — TASK 1: DATABASE CONFIGURATION & FALLBACK SAFETY AUDIT")
    print("=" * 70)

    # 1. Base docker-compose.yml
    print("\n1. Inspecting Base docker-compose.yml Database Selection:")
    base_cfg, err = parse_compose_db_config([])
    if err:
        print(f"  [FAIL] Could not evaluate base docker-compose.yml: {err}")
        return False
    all_supabase = all("pooler.supabase.com" in s["DB_HOST"] for s in base_cfg.values())
    all_ssl = all(s["DB_SSLMODE"] == "?sslmode=require" for s in base_cfg.values())
    all_validate = all(s["DDL_AUTO"] == "validate" for s in base_cfg.values())
    print(f"  Target DB Host     : {base_cfg['user-service']['DB_HOST']}")
    print(f"  Target DB Port     : {base_cfg['user-service']['DB_PORT']}")
    print(f"  Target DB Name     : {base_cfg['user-service']['DB_NAME']}")
    print(f"  SSL Mode           : {base_cfg['user-service']['DB_SSLMODE']}")
    print(f"  DDL Auto           : {base_cfg['user-service']['DDL_AUTO']}")
    print(f"  Password Set       : {base_cfg['user-service']['PASSWORD_CONFIGURED']}")
    if all_supabase and all_ssl and all_validate:
        print("  [PASS] Base Compose selects Supabase with required SSL and DDL validate.")
    else:
        print("  [FAIL] Base Compose did not configure Supabase correctly.")
        return False

    # 2. docker-compose.supabase.yml
    print("\n2. Inspecting Explicit Supabase docker-compose.supabase.yml:")
    supa_cfg, err = parse_compose_db_config(["-f", "docker-compose.yml", "-f", "docker-compose.supabase.yml"])
    if err:
        print(f"  [FAIL] Could not evaluate docker-compose.supabase.yml: {err}")
        return False
    all_supabase = all("pooler.supabase.com" in s["DB_HOST"] for s in supa_cfg.values())
    all_ssl = all(s["DB_SSLMODE"] == "?sslmode=require" for s in supa_cfg.values())
    all_validate = all(s["DDL_AUTO"] == "validate" for s in supa_cfg.values())
    print(f"  Target DB Host     : {supa_cfg['user-service']['DB_HOST']}")
    print(f"  Target DB Port     : {supa_cfg['user-service']['DB_PORT']}")
    print(f"  Target DB Name     : {supa_cfg['user-service']['DB_NAME']}")
    print(f"  SSL Mode           : {supa_cfg['user-service']['DB_SSLMODE']}")
    print(f"  DDL Auto           : {supa_cfg['user-service']['DDL_AUTO']}")
    if all_supabase and all_ssl and all_validate:
        print("  [PASS] Explicit Supabase Compose strictly locks connection to Supabase cloud.")
    else:
        print("  [FAIL] Explicit Supabase Compose did not configure Supabase correctly.")
        return False

    # 3. docker-compose.local.yml
    print("\n3. Inspecting Explicit Local Development Override docker-compose.local.yml:")
    local_cfg, err = parse_compose_db_config(["-f", "docker-compose.yml", "-f", "docker-compose.local.yml"])
    if err:
        print(f"  [FAIL] Could not evaluate docker-compose.local.yml: {err}")
        return False
    all_local = all(s["DB_HOST"] == "host.docker.internal" for s in local_cfg.values())
    all_local_db = all(s["DB_NAME"] == "vayro_users" for s in local_cfg.values())
    all_no_ssl = all(s["DB_SSLMODE"] == "" for s in local_cfg.values())
    print(f"  Target DB Host     : {local_cfg['user-service']['DB_HOST']}")
    print(f"  Target DB Port     : {local_cfg['user-service']['DB_PORT']}")
    print(f"  Target DB Name     : {local_cfg['user-service']['DB_NAME']}")
    print(f"  SSL Mode           : [EMPTY (No SSL required for local dev)]")
    print(f"  DDL Auto           : {local_cfg['user-service']['DDL_AUTO']}")
    if all_local and all_local_db and all_no_ssl:
        print("  [PASS] Local override cleanly directs all microservices to local PostgreSQL.")
    else:
        print("  [FAIL] Local override did not configure local database correctly.")
        return False

    # 4. Silent Fallback Prevention Test
    print("\n4. Testing Fallback Prevention (Empty Environment / Missing SUPABASE_DB_HOST):")
    cmd_fallback = ["docker", "compose", "--env-file", "/dev/null", "config"]
    res_fallback = subprocess.run(cmd_fallback, cwd=WORKSPACE_DIR, capture_output=True, text=True)
    if res_fallback.returncode != 0 and "SUPABASE_DB_HOST is required" in res_fallback.stderr:
        print(f"  [PASS] Docker Compose immediately aborted with error on missing Supabase host:")
        print(f"         Error message: {res_fallback.stderr.strip().splitlines()[0]}")
        print("  [PASS] Silent fallback to local PostgreSQL is IMPOSSIBLE.")
    else:
        print(f"  [FAIL] Expected Docker Compose failure, got returncode {res_fallback.returncode}: {res_fallback.stdout}")
        return False

    print("\n" + "=" * 70)
    print("TASK 1 VERIFICATION RESULT: ALL CHECKS PASSED")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = test_compose_configurations()
    sys.exit(0 if success else 1)
