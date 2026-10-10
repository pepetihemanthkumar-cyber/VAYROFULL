#!/bin/sh
set -e

echo "=================================================="
echo "Starting VAYRO Fleet Platform Backend Services"
echo "=================================================="

LOG_DIR="/app/logs"
mkdir -p "$LOG_DIR"
touch "$LOG_DIR/eureka.log" "$LOG_DIR/user.log" "$LOG_DIR/vehicle.log" "$LOG_DIR/booking.log" "$LOG_DIR/notification.log" "$LOG_DIR/gateway.log"

# Stream all internal log files to container stdout in real time
tail -n 0 -F "$LOG_DIR/eureka.log" "$LOG_DIR/user.log" "$LOG_DIR/vehicle.log" "$LOG_DIR/booking.log" "$LOG_DIR/notification.log" "$LOG_DIR/gateway.log" 2>/dev/null &
TAIL_PID=$!

# Optimize JVM settings for containerized environment with 4Gi memory
JVM_COMMON="-XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"

# Function to cleanly terminate all processes on container shutdown
cleanup() {
    echo "Stopping all VAYRO microservices..."
    kill -TERM "$GATEWAY_PID" "$BOOKING_PID" "$NOTIF_PID" "$VEHICLE_PID" "$USER_PID" "$EUREKA_PID" "$TAIL_PID" 2>/dev/null || true
    wait "$GATEWAY_PID" "$BOOKING_PID" "$NOTIF_PID" "$VEHICLE_PID" "$USER_PID" "$EUREKA_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

# 1. Start Eureka Service Registry on fixed internal port 8761
echo "[1/6] Launching Eureka Service Discovery Server (internal port 8761)..."
java -Xms48m -Xmx128m $JVM_COMMON \
     -Dserver.port=8761 \
     -DSERVER_PORT=8761 \
     -jar /app/eureka-server.jar > "$LOG_DIR/eureka.log" 2>&1 &
EUREKA_PID=$!

# Wait for Eureka discovery server to initialize
echo "Waiting for Eureka discovery server to initialize..."
for i in $(seq 1 20); do
    if curl -s -f http://localhost:8761/eureka/apps >/dev/null 2>&1; then
        echo "Eureka Server is ready on port 8761."
        break
    fi
    sleep 1
done

# 2. Start User & Identity Service on fixed internal port 8081
echo "[2/6] Launching User & Authentication Service (internal port 8081)..."
java -Xms64m -Xmx256m $JVM_COMMON \
     -Dserver.port=8081 \
     -DSERVER_PORT=8081 \
     -jar /app/user-service.jar > "$LOG_DIR/user.log" 2>&1 &
USER_PID=$!

sleep 3

# 3. Start Vehicle & Fleet Service on fixed internal port 8082
echo "[3/6] Launching Vehicle Fleet Catalog Service (internal port 8082)..."
java -Xms64m -Xmx320m $JVM_COMMON \
     -Dserver.port=8082 \
     -DSERVER_PORT=8082 \
     -jar /app/vehicle-service.jar > "$LOG_DIR/vehicle.log" 2>&1 &
VEHICLE_PID=$!

sleep 3

# 4. Start Notification Service on fixed internal port 8084
echo "[4/6] Launching Notification & Invoicing Service (internal port 8084)..."
java -Xms64m -Xmx256m $JVM_COMMON \
     -Dserver.port=8084 \
     -DSERVER_PORT=8084 \
     -jar /app/notification-service.jar > "$LOG_DIR/notification.log" 2>&1 &
NOTIF_PID=$!

sleep 3

# 5. Start Booking Service on fixed internal port 8083
echo "[5/6] Launching Booking & Rental Reservation Service (internal port 8083)..."
java -Xms64m -Xmx256m $JVM_COMMON \
     -Dserver.port=8083 \
     -DSERVER_PORT=8083 \
     -jar /app/booking-service.jar > "$LOG_DIR/booking.log" 2>&1 &
BOOKING_PID=$!

# Allow microservices time to initialize Spring context and connect to Supabase
echo "Waiting for core microservices to initialize..."
sleep 12

# 6. Start API Gateway on Cloud Run public port ($PORT, defaults to 8080)
PORT_TO_USE="${PORT:-8080}"
echo "[6/6] Launching API Gateway Ingress Proxy on public port ${PORT_TO_USE}..."
java -Xms64m -Xmx320m $JVM_COMMON \
     -Dserver.port="${PORT_TO_USE}" \
     -DSERVER_PORT="${PORT_TO_USE}" \
     -jar /app/api-gateway.jar > "$LOG_DIR/gateway.log" 2>&1 &
GATEWAY_PID=$!

echo "=================================================="
echo "All VAYRO microservices launched successfully."
echo "Supervisor active: monitoring service health..."
echo "=================================================="

# Supervisor loop to keep all processes alive, catch unexpected exits, and forward shutdown signals
while kill -0 "$GATEWAY_PID" 2>/dev/null; do
    for item in "EUREKA:$EUREKA_PID:eureka.log" "USER:$USER_PID:user.log" "VEHICLE:$VEHICLE_PID:vehicle.log" "BOOKING:$BOOKING_PID:booking.log" "NOTIFICATION:$NOTIF_PID:notification.log"; do
        svc="${item%%:*}"
        rest="${item#*:}"
        pid="${rest%%:*}"
        log="${rest#*:}"
        if ! kill -0 "$pid" 2>/dev/null; then
            echo "[CRITICAL ERROR] Microservice $svc (PID $pid) terminated unexpectedly!"
            if [ -f "$LOG_DIR/$log" ]; then
                echo "--- Last 20 lines of $log ---"
                tail -n 20 "$LOG_DIR/$log"
                echo "-----------------------------"
            fi
        fi
    done
    sleep 5 &
    wait $!
done

echo "[FATAL] API Gateway (PID $GATEWAY_PID) terminated."
cleanup

