package com.vayro.users.exception;

/**
 * Exception thrown when a disabled or suspended user attempts to access protected operations.
 */
public class AccountDisabledException extends RuntimeException {

    public AccountDisabledException(String message) {
        super(message);
    }

    public AccountDisabledException(String message, Throwable cause) {
        super(message, cause);
    }
}
