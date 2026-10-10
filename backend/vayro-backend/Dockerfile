# ==============================================================================
# Stage 1: Build & Package All VAYRO Microservices
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy parent pom.xml
COPY pom.xml ./pom.xml

# Copy all microservice modules
COPY eureka-server ./eureka-server
COPY api-gateway ./api-gateway
COPY user-service ./user-service
COPY vehicle-service ./vehicle-service
COPY booking-service ./booking-service
COPY notification-service ./notification-service

# Build and package all JAR artifacts in a single reactor pass
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Production JRE 21 Runtime
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl bash coreutils

# Create unprivileged application user and group for security hardening
RUN addgroup -S vayro && adduser -S vayro -G vayro && mkdir -p /app/logs

# Copy built JAR files from builder stage
COPY --from=builder /build/eureka-server/target/*.jar /app/eureka-server.jar
COPY --from=builder /build/user-service/target/*.jar /app/user-service.jar
COPY --from=builder /build/vehicle-service/target/*.jar /app/vehicle-service.jar
COPY --from=builder /build/booking-service/target/*.jar /app/booking-service.jar
COPY --from=builder /build/notification-service/target/*.jar /app/notification-service.jar
COPY --from=builder /build/api-gateway/target/*.jar /app/api-gateway.jar

# Copy entrypoint orchestration script
COPY entrypoint.sh /app/entrypoint.sh

# Set executable permissions and change file ownership
RUN chmod +x /app/entrypoint.sh && chown -R vayro:vayro /app

# Switch to unprivileged runtime user
USER vayro

# Cloud Run injects $PORT (default 8080)
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
