package com.vayro.booking.security;

import java.io.Serializable;

public class AuthenticatedUser implements Serializable {

    private final String userId;
    private final String email;
    private final String role;
    private final String name;
    private final String token;

    public AuthenticatedUser(String userId, String email, String role, String name) {
        this(userId, email, role, name, null);
    }

    public AuthenticatedUser(String userId, String email, String role, String name, String token) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.name = name;
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }

    public String getToken() {
        return token;
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
