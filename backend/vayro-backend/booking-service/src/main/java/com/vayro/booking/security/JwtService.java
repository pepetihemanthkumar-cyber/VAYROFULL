package com.vayro.booking.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

/**
 * Service for JWT parsing, claim extraction, and cryptographic validation in Booking Service.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractUserId(String token) {
        return extractClaim(token, claims -> {
            Object val = claims.get("userId");
            return val != null ? String.valueOf(val) : null;
        });
    }

    public String extractName(String token) {
        return extractClaim(token, claims -> claims.get("name", String.class));
    }

    public AuthenticatedUser extractAuthenticatedUser(String token) {
        Claims claims = extractAllClaims(token);
        String email = claims.getSubject();
        Object userIdObj = claims.get("userId");
        String userId = userIdObj != null ? String.valueOf(userIdObj) : email;
        String role = claims.get("role", String.class);
        String name = claims.get("name", String.class);
        if (name == null || name.isBlank()) {
            name = email;
        }
        return new AuthenticatedUser(userId, email, role != null ? role : "USER", name);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    @Value("${jwt.issuer:vayro-auth}")
    private String jwtIssuer = "vayro-auth";

    @Value("${jwt.audience:vayro-platform}")
    private String jwtAudience = "vayro-platform";

    public boolean isTokenValid(String token) {
        try {
            if (isTokenExpired(token)) {
                return false;
            }
            // Compatible Issuer & Audience Verification (allows legacy tokens during migration)
            Claims claims = extractAllClaims(token);
            String tokenIssuer = claims.getIssuer();
            if (tokenIssuer != null && !tokenIssuer.isBlank() && !jwtIssuer.equals(tokenIssuer) && !"https://vayro.com".equals(tokenIssuer) && !tokenIssuer.startsWith("vayro-")) {
                return false;
            }
            java.util.Set<String> tokenAudience = claims.getAudience();
            if (tokenAudience != null && !tokenAudience.isEmpty() && !tokenAudience.contains(jwtAudience) && !tokenAudience.contains("vayro-web") && !tokenAudience.contains("vayro-booking-service")) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey);
        } catch (Exception e) {
            keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateInternalServiceToken() {
        return Jwts.builder()
                .issuer("vayro-booking-service")
                .audience().add("vayro-vehicle-service").and()
                .subject("booking-service@internal.vayro.com")
                .claim("role", "INTERNAL_SERVICE")
                .claim("serviceId", "booking-service")
                .claim("userId", "system")
                .claim("name", "Internal Booking Service")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 300000))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateNotificationServiceToken() {
        return Jwts.builder()
                .issuer("vayro-booking-service")
                .audience().add("vayro-notification-service").and()
                .subject("booking-service@internal.vayro.com")
                .claim("role", "INTERNAL_SERVICE")
                .claim("serviceId", "booking-service")
                .claim("userId", "system")
                .claim("name", "Internal Booking Service")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(getSigningKey())
                .compact();
    }
}
