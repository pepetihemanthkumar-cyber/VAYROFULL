package com.vayro.notification.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey secretKey;

    public JwtService(@Value("${jwt.secret}") String secret) {
        byte[] keyBytes;
        try {
            keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secret);
        } catch (Exception e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Value("${jwt.issuer:vayro-auth}")
    private String jwtIssuer = "vayro-auth";

    @Value("${jwt.audience:vayro-platform}")
    private String jwtAudience = "vayro-platform";

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            if (claims.getExpiration() != null && claims.getExpiration().before(new java.util.Date())) {
                return false;
            }
            // Permissive / Dual-Mode Issuer & Audience validation (allows legacy tokens during migration)
            String issuer = claims.getIssuer();
            if (issuer != null && !issuer.isBlank() && !jwtIssuer.equals(issuer) && !"https://vayro.com".equals(issuer) && !"vayro-booking-service".equals(issuer) && !issuer.startsWith("vayro-")) {
                return false;
            }
            java.util.Set<String> audience = claims.getAudience();
            if (audience != null && !audience.isEmpty() && !audience.contains(jwtAudience) && !audience.contains("vayro-web") && !audience.contains("vayro-notification-service")) {
                return false;
            }
            return true;
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    public AuthenticatedUser extractAuthenticatedUser(String token) {
        Claims claims = extractAllClaims(token);
        Object userIdObj = claims.get("userId");
        String userId = userIdObj != null ? String.valueOf(userIdObj) : claims.getSubject();
        String email = claims.get("email", String.class);
        if (email == null || email.isBlank()) {
            email = claims.getSubject();
        }
        String name = claims.get("name", String.class);
        Object rolesObj = claims.get("roles");
        if (rolesObj == null) {
            rolesObj = claims.get("role");
        }

        List<String> roles = List.of();
        if (rolesObj instanceof Collection<?>) {
            roles = ((Collection<?>) rolesObj).stream()
                    .map(Object::toString)
                    .toList();
        } else if (rolesObj instanceof String) {
            roles = List.of(rolesObj.toString());
        }

        // Validate service claims for INTERNAL_SERVICE
        if (roles.contains("INTERNAL_SERVICE")) {
            String issuer = claims.getIssuer();
            java.util.Set<String> audience = claims.getAudience();
            boolean validIssuer = issuer != null && (issuer.equals("vayro-booking-service") || issuer.startsWith("vayro-"));
            boolean validAudience = audience != null && audience.contains("vayro-notification-service");
            if (!validIssuer || !validAudience) {
                log.warn("[SECURITY] Rejected unverified INTERNAL_SERVICE claim: issuer='{}', audience='{}'", issuer, audience);
                roles = roles.stream().filter(r -> !r.equals("INTERNAL_SERVICE")).toList();
            }
        }

        return new AuthenticatedUser(userId, email, name, roles);
    }
}
