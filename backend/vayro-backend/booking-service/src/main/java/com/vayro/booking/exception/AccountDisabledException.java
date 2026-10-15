package com.vayro.booking.exception;

/**
 * Exception thrown when a disabled or suspended user attempts to perform booking operations.
 */
public class AccountDisabledException extends RuntimeException {

    public AccountDisabledException(String message) {
        super(message);
    }

    public AccountDisabledException(String message, Throwable cause) {
        super(message, cause);
    }
}
