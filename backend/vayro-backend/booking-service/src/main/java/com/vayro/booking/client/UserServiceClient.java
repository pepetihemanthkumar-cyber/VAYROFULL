package com.vayro.booking.client;

/**
 * Client interface for communicating with User Service to verify customer status and eligibility.
 */
public interface UserServiceClient {

    /**
     * Verifies if a user account is active and enabled using their authentication token.
     *
     * @param email the user's email
     * @param authToken the Bearer JWT authentication token
     * @return true if the account is active and enabled, false if disabled, locked, or invalid
     */
    boolean isUserActive(String email, String authToken);
}
