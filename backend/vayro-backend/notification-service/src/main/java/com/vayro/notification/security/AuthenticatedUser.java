package com.vayro.notification.security;

import java.util.Collection;
import java.util.List;

public class AuthenticatedUser {

    private final String userId;
    private final String email;
    private final String name;
    private final List<String> roles;
    private final String token;

    public AuthenticatedUser(String userId, String email, String name, Collection<String> roles) {
        this(userId, email, name, roles, null);
    }

    public AuthenticatedUser(String userId, String email, String name, Collection<String> roles, String token) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.roles = roles != null ? List.copyOf(roles) : List.of();
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public List<String> getRoles() {
        return roles;
    }

    public String getToken() {
        return token;
    }

    public boolean isAdmin() {
        return roles.stream().anyMatch(r -> r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("ROLE_ADMIN"));
    }

    public boolean isInternalService() {
        return roles.stream().anyMatch(r ->
                r.equalsIgnoreCase("INTERNAL_SERVICE") ||
                r.equalsIgnoreCase("ROLE_INTERNAL_SERVICE") ||
                r.equalsIgnoreCase("SERVICE") ||
                r.equalsIgnoreCase("ROLE_SERVICE")
        );
    }
}
