package com.vayro.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "VAYRO API Gateway");
        response.put("status", "UP");
        response.put("version", "1.0.0");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("health", "/actuator/health");
        endpoints.put("vehicles", "/api/vehicles");
        endpoints.put("auth", "/api/auth");
        endpoints.put("bookings", "/api/bookings");
        endpoints.put("notifications", "/api/notifications");
        endpoints.put("eureka", "/eureka");
        response.put("endpoints", endpoints);

        return ResponseEntity.ok(response);
    }
}
