package com.vayro.notification.service;

import com.vayro.notification.dto.BookingConfirmedNotificationRequest;
import com.vayro.notification.dto.NotificationResponse;
import com.vayro.notification.dto.VehicleReturnedNotificationRequest;

import java.util.List;

public interface NotificationService {

    /**
     * Dispatches booking confirmation HTML email with PDF invoice to the customer's authenticated email.
     * Guaranteed idempotent by booking reference.
     */
    NotificationResponse processBookingConfirmedNotification(BookingConfirmedNotificationRequest request);

    /**
     * Dispatches vehicle return notification HTML email to the server-configured admin email address.
     * Guaranteed idempotent by booking reference.
     */
    NotificationResponse processVehicleReturnedNotification(VehicleReturnedNotificationRequest request);

    /**
     * Explicit resend of booking confirmation email.
     */
    NotificationResponse resendBookingConfirmedNotification(String bookingReference);

    /**
     * Look up notification status by idempotency key.
     */
    NotificationResponse getNotificationByIdempotencyKey(String idempotencyKey);

    /**
     * Look up notification status by idempotency key, enforcing customer ownership or admin/internal access.
     */
    NotificationResponse getNotificationByIdempotencyKey(String idempotencyKey, com.vayro.notification.security.AuthenticatedUser currentUser);

    /**
     * Look up all notification history for a booking reference.
     */
    List<NotificationResponse> getNotificationsByBookingReference(String bookingReference);

    /**
     * Look up all notification history for a booking reference, enforcing customer ownership or admin/internal access.
     */
    List<NotificationResponse> getNotificationsByBookingReference(String bookingReference, com.vayro.notification.security.AuthenticatedUser currentUser);

    /**
     * Look up latest notification status for a booking reference.
     */
    NotificationResponse getLatestNotificationForBooking(String bookingReference);

    /**
     * Look up latest notification status for a booking reference, enforcing customer ownership or admin/internal access.
     */
    NotificationResponse getLatestNotificationForBooking(String bookingReference, com.vayro.notification.security.AuthenticatedUser currentUser);

    /**
     * Generates or fetches stored PDF invoice for a booking reference.
     */
    byte[] getPdfInvoiceByBookingReference(String bookingReference);

    /**
     * Fetches stored PDF invoice for a booking reference, verifying ownership against authenticated user.
     */
    byte[] getPdfInvoiceByBookingReference(String bookingReference, com.vayro.notification.security.AuthenticatedUser currentUser);
}
