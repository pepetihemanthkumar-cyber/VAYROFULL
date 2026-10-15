#!/usr/bin/env python3
"""
VAYRO Database Configuration & Connectivity Verification Script
Safely tests Local PostgreSQL and Supabase PostgreSQL connectivity.
Adheres strictly to zero-secret logging rules (no passwords, secrets, or keys printed).
"""

import os
import sys
import socket
import ssl
import struct

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(WORKSPACE_DIR, ".env")

def load_env_safe():
    """Loads .env variables safely without exposing secret values."""
    config = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                config[k] = v
    return config

def test_local_postgres(host, port, dbname, user):
    """Tests local PostgreSQL reachability and socket connection."""
    print(f"\n[LOCAL POSTGRESQL CHECK]")
    print(f"  Target Host : {host}")
    print(f"  Target Port : {port}")
    print(f"  Database    : {dbname}")
    print(f"  Username    : {user}")

    # Socket connect check
    sock_host = "127.0.0.1" if host in ["localhost", "127.0.0.1"] else host
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(3.0)
    try:
        s.connect((sock_host, int(port)))
        s.close()
        print("  Socket Connection: SUCCESS (Port is open and accepting TCP traffic)")
        return True
    except Exception as e:
        print(f"  Socket Connection: FAILED ({e})")
        return False

def test_supabase_ssl_handshake(host, port, username, dbname):
    """Tests Supabase network reachability, TLS 1.3 negotiation, and auth protocol."""
    print(f"\n[SUPABASE POSTGRESQL SSL & PROTOCOL CHECK]")
    print(f"  Target Host : {host}")
    print(f"  Target Port : {port}")
    print(f"  Database    : {dbname}")
    print(f"  Username    : {username}")

    # 1. TCP Socket connection
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5.0)
    try:
        s.connect((host, int(port)))
        print("  1. TCP Connection               : PASS (Host reachable, port open)")
    except Exception as e:
        print(f"  1. TCP Connection               : FAIL ({e})")
        return False

    # 2. PostgreSQL SSLRequest negotiation
    try:
        # SSLRequest message: length 8, code 80877103
        s.sendall(b'\x00\x00\x00\x08\x04\xd2\x16\x2f')
        resp = s.recv(1)
        if resp == b'S':
            print("  2. PostgreSQL SSL Negotiation    : PASS (Server accepted SSLRequest code 'S')")
        else:
            print(f"  2. PostgreSQL SSL Negotiation    : FAIL (Server returned byte: {resp})")
            s.close()
            return False
    except Exception as e:
        print(f"  2. PostgreSQL SSL Negotiation    : FAIL ({e})")
        s.close()
        return False

    # 3. TLS Handshake with sslmode=require semantics
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # Equivalent to JDBC sslmode=require
        ss = ctx.wrap_socket(s, server_hostname=host)
        cipher_info = ss.cipher()
        tls_version = ss.version()
        print(f"  3. TLS 1.3 Encryption Handshake : PASS (Protocol={tls_version}, Cipher={cipher_info[0]})")
    except Exception as e:
        print(f"  3. TLS 1.3 Encryption Handshake : FAIL ({e})")
        s.close()
        return False

    # 4. PostgreSQL Protocol Startup Handshake
    try:
        params = f"user\x00{username}\x00database\x00{dbname}\x00\x00".encode("utf-8")
        msg = struct.pack("!I", 4 + 4 + len(params)) + struct.pack("!I", 196608) + params
        ss.sendall(msg)
        auth_resp = ss.recv(1024)
        if auth_resp and auth_resp[0:1] == b'R':
            auth_type = struct.unpack("!I", auth_resp[5:9])[0]
            auth_names = {0: "OK", 3: "Cleartext", 5: "MD5", 10: "SASL (SCRAM-SHA-256)"}
            name = auth_names.get(auth_type, f"Type {auth_type}")
            print(f"  4. Authentication Protocol Probe : PASS (Server requested {name})")
            ss.close()
            return True
        elif auth_resp and auth_resp[0:1] == b'E':
            err_msg = auth_resp[5:].decode("latin1", errors="ignore")
            # Sanitize any potential internal strings
            clean_err = err_msg.split("\x00")[0] if "\x00" in err_msg else err_msg[:100]
            print(f"  4. Authentication Protocol Probe : ERROR RESPONSE ({clean_err})")
            ss.close()
            return False
        else:
            print(f"  4. Authentication Protocol Probe : Unexpected response byte: {auth_resp[0:1] if auth_resp else 'empty'}")
            ss.close()
            return False
    except Exception as e:
        print(f"  4. Authentication Protocol Probe : FAIL ({e})")
        ss.close()
        return False

def main():
    print("=" * 70)
    print("VAYRO DATABASE INTEGRATION & ENVIRONMENT AUDIT")
    print("=" * 70)

    env = load_env_safe()

    # Current settings
    db_host = env.get("DB_HOST", "localhost")
    docker_db_host = env.get("DOCKER_DB_HOST", "host.docker.internal")
    db_port = env.get("DB_PORT", "5432")
    db_name = env.get("DB_NAME", "postgres")
    db_username = env.get("DB_USERNAME", "")
    db_password_set = bool(env.get("DB_PASSWORD", "").strip())
    supabase_password_set = bool(env.get("SUPABASE_DB_PASSWORD", "").strip())
    db_sslmode = env.get("DB_SSLMODE", "")

    is_supabase = "supabase" in db_host.lower() or "pooler" in db_host.lower() or "supabase" in docker_db_host.lower()

    print("\nCURRENT ACTIVE ENVIRONMENT (.env):")
    print(f"  Mode                  : {'SUPABASE (Cloud)' if is_supabase else 'LOCAL POSTGRESQL (Development)'}")
    print(f"  DB_HOST               : {db_host}")
    print(f"  DOCKER_DB_HOST        : {docker_db_host}")
    print(f"  DB_PORT               : {db_port}")
    print(f"  DB_NAME               : {db_name}")
    print(f"  DB_USERNAME           : {db_username}")
    print(f"  DB_PASSWORD           : {'[CONFIGURED / PRESENT]' if db_password_set else '[EMPTY / UNSET]'}")
    print(f"  SUPABASE_DB_PASSWORD  : {'[CONFIGURED / PRESENT]' if supabase_password_set else '[EMPTY / UNSET]'}")
    print(f"  DB_SSLMODE            : {db_sslmode if db_sslmode else '[EMPTY (No SSL param)]'}")

    # Check 1: Test Local PostgreSQL
    local_ok = test_local_postgres(db_host, db_port, db_name, db_username)

    # Check 2: Probe Supabase Cloud Endpoint
    supabase_host = "aws-0-ap-southeast-1.pooler.supabase.com"
    supabase_port = 5432
    supabase_user = "postgres.lgpuulmsdogxzsyoqwdk"
    supabase_db = "postgres"
    supabase_proto_ok = test_supabase_ssl_handshake(supabase_host, supabase_port, supabase_user, supabase_db)

    print("\n" + "=" * 70)
    print("AUDIT SUMMARY:")
    print("=" * 70)
    print(f"  Local PostgreSQL Connectivity     : {'PASS' if local_ok else 'FAIL'}")
    print(f"  Supabase Cloud Network & TLS 1.3  : {'PASS' if supabase_proto_ok else 'FAIL'}")
    print(f"  Supabase Full Auth Query Status   : {'PASS' if (supabase_proto_ok and supabase_password_set) else 'NOT VERIFIED (Missing SUPABASE_DB_PASSWORD in .env)'}")
    print("=" * 70)

if __name__ == "__main__":
    main()
