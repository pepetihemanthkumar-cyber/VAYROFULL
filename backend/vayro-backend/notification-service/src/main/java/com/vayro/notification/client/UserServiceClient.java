package com.vayro.notification.client;

/**
 * Client interface for communicating with User Service to verify customer status before invoice download.
 */
public interface UserServiceClient {

    /**
     * Checks whether the user account is active and enabled.
     *
     * @param email the user's email
     * @param authToken the Bearer JWT token
     * @return true if enabled and active, false otherwise
     */
    boolean isUserActive(String email, String authToken);
}
