package com.vayro.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

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
            Object userId = claims.get("userId");
            return userId != null ? String.valueOf(userId) : null;
        });
    }

    public String extractName(String token) {
        return extractClaim(token, claims -> claims.get("name", String.class));
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
            Claims claims = extractAllClaims(token);
            String tokenIssuer = claims.getIssuer();
            if (tokenIssuer != null && !tokenIssuer.isBlank() && !jwtIssuer.equals(tokenIssuer) && !"https://vayro.com".equals(tokenIssuer)) {
                return false;
            }
            java.util.Set<String> tokenAudience = claims.getAudience();
            if (tokenAudience != null && !tokenAudience.isEmpty() && !tokenAudience.contains(jwtAudience) && !tokenAudience.contains("vayro-web")) {
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token detected: {}", e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
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
}
