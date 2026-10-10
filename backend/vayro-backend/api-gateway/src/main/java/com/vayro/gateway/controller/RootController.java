package com.vayro.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.RandomAccessFile;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

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
    public ResponseEntity<Map<String, Object>> diagnostics(@RequestParam(value = "logs", defaultValue = "false") boolean includeLogs) {
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
            boolean isUp = false;
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Accept", "application/json")
                        .timeout(Duration.ofSeconds(2))
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                svcInfo.put("statusCode", response.statusCode());
                isUp = response.statusCode() >= 200 && response.statusCode() < 400;
                svcInfo.put("status", isUp ? "UP" : "DEGRADED");
                if (response.body() != null && response.body().length() < 500) {
                    svcInfo.put("response", response.body());
                }
            } catch (Exception e) {
                svcInfo.put("status", "DOWN");
                svcInfo.put("error", e.getMessage());
            }

            if (includeLogs || !isUp) {
                svcInfo.put("logTail", readLogTail("/app/logs/" + getLogFileName(name), 30));
            }
            serviceStatuses.put(name, svcInfo);
        }
        report.put("services", serviceStatuses);

        return ResponseEntity.ok(report);
    }

    private String getLogFileName(String serviceName) {
        switch (serviceName) {
            case "eureka": return "eureka.log";
            case "user-service": return "user.log";
            case "vehicle-service": return "vehicle.log";
            case "booking-service": return "booking.log";
            case "notification-service": return "notification.log";
            default: return serviceName + ".log";
        }
    }

    private List<String> readLogTail(String path, int lines) {
        List<String> result = new ArrayList<>();
        File file = new File(path);
        if (!file.exists()) {
            String alt = path.replace("/app/logs/", "/tmp/logs/");
            file = new File(alt);
            if (!file.exists()) {
                result.add("Log file not found: " + path);
                return result;
            }
        }
        try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
            long length = raf.length();
            long pos = Math.max(0, length - 16384);
            raf.seek(pos);
            String line;
            while ((line = raf.readLine()) != null) {
                result.add(line);
            }
            if (result.size() > lines) {
                result = result.subList(result.size() - lines, result.size());
            }
        } catch (Exception e) {
            result.add("Error reading log: " + e.getMessage());
        }
        return result;
    }
}

