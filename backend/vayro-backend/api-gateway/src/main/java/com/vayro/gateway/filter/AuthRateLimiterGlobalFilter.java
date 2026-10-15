package com.vayro.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * High-performance, memory-safe reactive rate limiting filter protecting authentication endpoints.
 * Specifically rate limits login, registration, and Google OAuth endpoints to prevent brute-force
 * and credential stuffing attacks without impacting normal users or logging sensitive payloads.
 */
@Component
public class AuthRateLimiterGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimiterGlobalFilter.class);

    @Value("${app.rate-limiting.auth.max-requests:10}")
    private int maxRequests;

    @Value("${app.rate-limiting.auth.window-seconds:60}")
    private long windowSeconds;

    // Concurrent in-memory state tracking request counts per client IP and endpoint
    private final Map<String, RateLimitCounter> rateLimitBuckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();
        HttpMethod method = request.getMethod();

        // Only rate-limit authentication write endpoints (POST /api/auth/**)
        if (!isAuthEndpoint(path, method)) {
            return chain.filter(exchange);
        }

        String clientIp = resolveClientIp(request);
        String bucketKey = clientIp + ":" + path;

        long windowMs = windowSeconds * 1000;
        RateLimitCounter counter = rateLimitBuckets.computeIfAbsent(bucketKey, k -> new RateLimitCounter());

        if (!counter.tryAcquire(maxRequests, windowMs)) {
            long remainingSeconds = counter.getRemainingSeconds(windowMs);
            // Log security event with ONLY IP, method, and endpoint path (NEVER log request bodies, passwords, or tokens)
            log.warn("[AUTH_RATE_LIMIT_EXCEEDED] Client IP '{}' exceeded rate limit on [{}] {}. Remaining wait: {}s",
                    clientIp, method, path, remainingSeconds);

            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            response.getHeaders().set(HttpHeaders.RETRY_AFTER, String.valueOf(remainingSeconds));

            String errorJson = String.format(
                    "{\"timestamp\":\"%s\",\"status\":429,\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Too many authentication attempts. Please wait %d seconds before trying again.\",\"path\":\"%s\"}",
                    LocalDateTime.now(),
                    remainingSeconds,
                    path
            );

            DataBuffer buffer = response.bufferFactory().wrap(errorJson.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        }

        // Periodic light cleanup when bucket size exceeds threshold
        if (rateLimitBuckets.size() > 5000) {
            cleanStaleBuckets(windowMs);
        }

        return chain.filter(exchange);
    }

    private boolean isAuthEndpoint(String path, HttpMethod method) {
        if (method != HttpMethod.POST) {
            return false;
        }
        return path.equals("/api/auth/login") ||
               path.equals("/api/auth/register") ||
               path.equals("/api/auth/google") ||
               path.startsWith("/api/auth/");
    }

    private String resolveClientIp(ServerHttpRequest request) {
        // 1. Prioritize X-Real-IP set by trusted edge proxy (Nginx overwrites this with $remote_addr)
        String xRealIp = request.getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            String sanitized = sanitizeIp(xRealIp.trim());
            if (sanitized != null) {
                return sanitized;
            }
        }

        // 2. Fall back to X-Forwarded-For: take the last entry added by the closest trusted proxy hop,
        // rather than the attacker-controlled first entry.
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] ips = xForwardedFor.split(",");
            String closestHop = ips[ips.length - 1].trim();
            String sanitized = sanitizeIp(closestHop);
            if (sanitized != null) {
                return sanitized;
            }
        }

        // 3. Fall back to direct TCP socket peer address
        if (request.getRemoteAddress() != null && request.getRemoteAddress().getAddress() != null) {
            return request.getRemoteAddress().getAddress().getHostAddress();
        }

        return "127.0.0.1";
    }

    private String sanitizeIp(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) {
            return null;
        }
        String cleaned = rawIp.trim();
        // Remove port if present in IPv4 (e.g. 192.168.1.1:5000)
        if (cleaned.contains(":") && !cleaned.contains("::") && cleaned.indexOf(':') == cleaned.lastIndexOf(':')) {
            cleaned = cleaned.substring(0, cleaned.indexOf(':')).trim();
        }
        if (cleaned.length() > 45 || !cleaned.matches("^[0-9a-fA-F.:]+$")) {
            return null;
        }
        return cleaned;
    }

    private void cleanStaleBuckets(long windowMs) {
        long now = System.currentTimeMillis();
        rateLimitBuckets.entrySet().removeIf(entry -> (now - entry.getValue().windowStartMs) > (windowMs * 2));
    }

    @Override
    public int getOrder() {
        // High precedence before routing and downstream proxying
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }

    /**
     * Thread-safe sliding window counter per client IP and endpoint.
     */
    private static class RateLimitCounter {
        private final AtomicInteger requestCount = new AtomicInteger(0);
        private volatile long windowStartMs = System.currentTimeMillis();

        public synchronized boolean tryAcquire(int max, long windowMs) {
            long now = System.currentTimeMillis();
            if (now - windowStartMs >= windowMs) {
                windowStartMs = now;
                requestCount.set(0);
            }
            return requestCount.incrementAndGet() <= max;
        }

        public synchronized long getRemainingSeconds(long windowMs) {
            long now = System.currentTimeMillis();
            long elapsed = now - windowStartMs;
            return Math.max(1, (windowMs - elapsed) / 1000);
        }
    }
}
