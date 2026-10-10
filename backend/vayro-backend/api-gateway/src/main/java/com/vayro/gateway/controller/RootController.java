package com.vayro.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class RootController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "VAYRO API Gateway");
        response.put("status", "UP");
        response.put("version", "1.0.0");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("health", "/actuator/health");
        endpoints.put("diagnostics", "/api/health/diagnostics");
        endpoints.put("vehicles", "/api/vehicles");
        endpoints.put("auth", "/api/auth");
        endpoints.put("bookings", "/api/bookings");
        endpoints.put("notifications", "/api/notifications");
        endpoints.put("eureka", "/eureka");
        response.put("endpoints", endpoints);

        return ResponseEntity.ok(response);
    }

    @GetMapping({"/api/health/diagnostics", "/diagnostics"})
    public ResponseEntity<Map<String, Object>> diagnostics() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("timestamp", new Date().toString());
        report.put("gateway", "UP");

        Map<String, String> services = new LinkedHashMap<>();
        services.put("eureka", "http://localhost:8761/eureka/apps");
        services.put("user-service", "http://localhost:8081/actuator/health");
        services.put("vehicle-service", "http://localhost:8082/actuator/health");
        services.put("booking-service", "http://localhost:8083/actuator/health");
        services.put("notification-service", "http://localhost:8084/actuator/health");

        Map<String, Object> serviceStatuses = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : services.entrySet()) {
            String name = entry.getKey();
            String url = entry.getValue();
            Map<String, Object> svcInfo = new LinkedHashMap<>();
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Accept", "application/json")
                        .timeout(Duration.ofSeconds(2))
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                boolean isUp = response.statusCode() >= 200 && response.statusCode() < 400;
                svcInfo.put("statusCode", response.statusCode());
                svcInfo.put("status", isUp ? "UP" : "DEGRADED");
            } catch (Exception e) {
                svcInfo.put("statusCode", 503);
                svcInfo.put("status", "DOWN");
            }
            serviceStatuses.put(name, svcInfo);
        }
        report.put("services", serviceStatuses);

        return ResponseEntity.ok(report);
    }
}

