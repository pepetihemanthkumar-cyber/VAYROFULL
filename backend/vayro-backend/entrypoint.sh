#!/bin/sh
set -e

echo "=================================================="
echo "Starting VAYRO Fleet Platform Backend Services"
echo "=================================================="

# Optimize JVM settings to prevent memory bloat in containerized environment
JVM_COMMON="-XX:+UseSerialGC -XX:MaxMetaspaceSize=110m -Xss256k -Djava.security.egd=file:/dev/./urandom"

# Function to cleanly terminate all processes on container shutdown
cleanup() {
    echo "Stopping all VAYRO microservices..."
    kill -TERM "$GATEWAY_PID" "$BOOKING_PID" "$NOTIF_PID" "$VEHICLE_PID" "$USER_PID" "$EUREKA_PID" 2>/dev/null || true
    wait "$GATEWAY_PID" "$BOOKING_PID" "$NOTIF_PID" "$VEHICLE_PID" "$USER_PID" "$EUREKA_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

# 1. Start Eureka Service Registry on fixed internal port 8761
echo "[1/6] Launching Eureka Service Discovery Server (internal port 8761)..."
java -Xms32m -Xmx80m $JVM_COMMON \
     -Dserver.port=8761 \
     -DSERVER_PORT=8761 \
     -jar /app/eureka-server.jar &
EUREKA_PID=$!

# Wait for Eureka discovery server to initialize
sleep 8

# 2. Start User & Identity Service on fixed internal port 8081
echo "[2/6] Launching User & Authentication Service (internal port 8081)..."
java -Xms48m -Xmx160m $JVM_COMMON \
     -Dserver.port=8081 \
     -DSERVER_PORT=8081 \
     -jar /app/user-service.jar &
USER_PID=$!

sleep 3

# 3. Start Vehicle & Fleet Service on fixed internal port 8082
echo "[3/6] Launching Vehicle Fleet Catalog Service (internal port 8082)..."
java -Xms48m -Xmx160m $JVM_COMMON \
     -Dserver.port=8082 \
     -DSERVER_PORT=8082 \
     -jar /app/vehicle-service.jar &
VEHICLE_PID=$!

sleep 3

# 4. Start Notification Service on fixed internal port 8084
echo "[4/6] Launching Notification & Invoicing Service (internal port 8084)..."
java -Xms48m -Xmx160m $JVM_COMMON \
     -Dserver.port=8084 \
     -DSERVER_PORT=8084 \
     -jar /app/notification-service.jar &
NOTIF_PID=$!

sleep 3

# 5. Start Booking Service on fixed internal port 8083
echo "[5/6] Launching Booking & Rental Reservation Service (internal port 8083)..."
java -Xms48m -Xmx160m $JVM_COMMON \
     -Dserver.port=8083 \
     -DSERVER_PORT=8083 \
     -jar /app/booking-service.jar &
BOOKING_PID=$!

# Allow microservices a window to complete initialization and register with Eureka
sleep 8

# 6. Start API Gateway on Cloud Run public port ($PORT, defaults to 8080)
PORT_TO_USE="${PORT:-8080}"
echo "[6/6] Launching API Gateway Ingress Proxy on public port ${PORT_TO_USE}..."
java -Xms64m -Xmx200m $JVM_COMMON \
     -Dserver.port="${PORT_TO_USE}" \
     -DSERVER_PORT="${PORT_TO_USE}" \
     -jar /app/api-gateway.jar &
GATEWAY_PID=$!

echo "=================================================="
echo "All VAYRO microservices launched successfully."
echo "Supervisor active: monitoring service health..."
echo "=================================================="

# Supervisor loop to keep all processes alive, catch unexpected exits, and forward shutdown signals
while kill -0 "$GATEWAY_PID" 2>/dev/null; do
    for item in "EUREKA:$EUREKA_PID" "USER:$USER_PID" "VEHICLE:$VEHICLE_PID" "BOOKING:$BOOKING_PID" "NOTIFICATION:$NOTIF_PID"; do
        svc="${item%%:*}"
        pid="${item##*:}"
        if ! kill -0 "$pid" 2>/dev/null; then
            echo "[CRITICAL ERROR] Microservice $svc (PID $pid) terminated unexpectedly!"
        fi
    done
    sleep 5 &
    wait $!
done

echo "[FATAL] API Gateway (PID $GATEWAY_PID) terminated."
cleanup
