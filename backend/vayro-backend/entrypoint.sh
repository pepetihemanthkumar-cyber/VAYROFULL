#!/bin/sh
set -e

echo "=================================================="
echo "Starting VAYRO Fleet Platform Backend Services"
echo "=================================================="

# Function to clean up all child processes on container exit
cleanup() {
    echo "Stopping all VAYRO microservices..."
    kill -TERM "$BOOKING_PID" "$NOTIF_PID" "$VEHICLE_PID" "$USER_PID" "$EUREKA_PID" 2>/dev/null || true
    wait "$BOOKING_PID" "$NOTIF_PID" "$VEHICLE_PID" "$USER_PID" "$EUREKA_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

# 1. Start Eureka Service Registry (Internal Port 8761)
echo "[1/6] Launching Eureka Service Discovery Server (port 8761)..."
java -Xms32m -Xmx96m -Djava.security.egd=file:/dev/./urandom \
     -jar /app/eureka-server.jar &
EUREKA_PID=$!

# Wait for Eureka discovery server to initialize
sleep 5

# 2. Start User & Identity Service (Internal Port 8081)
echo "[2/6] Launching User & Authentication Service (port 8081)..."
java -Xms64m -Xmx192m -Djava.security.egd=file:/dev/./urandom \
     -jar /app/user-service.jar &
USER_PID=$!

# 3. Start Vehicle & Fleet Service (Internal Port 8082)
echo "[3/6] Launching Vehicle Fleet Catalog Service (port 8082)..."
java -Xms64m -Xmx192m -Djava.security.egd=file:/dev/./urandom \
     -jar /app/vehicle-service.jar &
VEHICLE_PID=$!

# 4. Start Notification Service (Internal Port 8084)
echo "[4/6] Launching Notification & Invoicing Service (port 8084)..."
java -Xms64m -Xmx192m -Djava.security.egd=file:/dev/./urandom \
     -jar /app/notification-service.jar &
NOTIF_PID=$!

# 5. Start Booking Service (Internal Port 8083)
echo "[5/6] Launching Booking & Rental Reservation Service (port 8083)..."
java -Xms64m -Xmx192m -Djava.security.egd=file:/dev/./urandom \
     -jar /app/booking-service.jar &
BOOKING_PID=$!

# Allow microservices a brief window to complete Eureka registration
sleep 3

# 6. Start API Gateway on the Cloud Run public port ($PORT, defaults to 8080)
PORT_TO_USE="${PORT:-8080}"
echo "[6/6] Launching API Gateway Ingress Proxy on port ${PORT_TO_USE}..."
exec java -Xms64m -Xmx256m -Dserver.port="${PORT_TO_USE}" -Djava.security.egd=file:/dev/./urandom \
     -jar /app/api-gateway.jar
