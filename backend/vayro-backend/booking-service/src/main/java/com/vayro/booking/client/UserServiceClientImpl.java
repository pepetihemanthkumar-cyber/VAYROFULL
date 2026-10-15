package com.vayro.booking.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserServiceClientImpl implements UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClientImpl.class);
    private static final String DEFAULT_USER_SERVICE_BASE = "http://USER-SERVICE";

    private final RestClient restClient;

    // Fast, lightweight in-memory TTL status cache (email -> StatusCacheEntry)
    private final Map<String, StatusCacheEntry> statusCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 5000; // 5-second TTL ensures near-instant disable propagation

    private static class StatusCacheEntry {
        final boolean active;
        final long expiresAt;

        StatusCacheEntry(boolean active, long expiresAt) {
            this.active = active;
            this.expiresAt = expiresAt;
        }
    }

    @Autowired
    public UserServiceClientImpl(RestClient.Builder restClientBuilder,
                                 @Value("${app.services.user-service-url:http://USER-SERVICE}") String baseUrl) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
    }

    public UserServiceClientImpl(RestClient.Builder restClientBuilder) {
        this(restClientBuilder, DEFAULT_USER_SERVICE_BASE);
    }

    @Override
    public boolean isUserActive(String email, String authToken) {
        if (email == null || email.isBlank()) {
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase();
        long now = System.currentTimeMillis();

        StatusCacheEntry cached = statusCache.get(normalizedEmail);
        if (cached != null && now < cached.expiresAt) {
            return cached.active;
        }

        if (authToken == null || authToken.isBlank()) {
            return false;
        }

        String bearerHeader = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;

        try {
            Boolean isActive = restClient.get()
                    .uri("/api/users/me")
                    .header(HttpHeaders.AUTHORIZATION, bearerHeader)
                    .accept(MediaType.APPLICATION_JSON)
                    .exchange((request, response) -> {
                        if (response.getStatusCode().is2xxSuccessful()) {
                            Map<?, ?> body = response.bodyTo(Map.class);
                            if (body != null) {
                                Object enabledVal = body.get("enabled");
                                if (enabledVal instanceof Boolean) {
                                    return (Boolean) enabledVal;
                                }
                            }
                            return true;
                        } else if (response.getStatusCode().value() == 401 || response.getStatusCode().value() == 403) {
                            log.warn("[AUTH] User Service rejected token for account (HTTP {})", response.getStatusCode());
                            return false;
                        } else {
                            log.warn("[AUTH] User Service returned unexpected status {}", response.getStatusCode());
                            return false;
                        }
                    });

            boolean active = Boolean.TRUE.equals(isActive);
            statusCache.put(normalizedEmail, new StatusCacheEntry(active, now + CACHE_TTL_MS));
            return active;
        } catch (Exception e) {
            log.warn("[AUTH] Could not verify user status with User Service: {}", e.getMessage());
            return false;
        }
    }
}
