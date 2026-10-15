package com.vayro.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vayro.notification.dto.BookingConfirmedNotificationRequest;
import com.vayro.notification.dto.NotificationResponse;
import com.vayro.notification.dto.VehicleReturnedNotificationRequest;
import com.vayro.notification.entity.NotificationStatus;
import com.vayro.notification.entity.NotificationType;
import com.vayro.notification.exception.InvoiceNotFoundException;
import com.vayro.notification.security.AuthenticatedUser;
import com.vayro.notification.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    private RequestPostProcessor withAuthenticatedUser(String id, String email, String role) {
        AuthenticatedUser user = new AuthenticatedUser(id, email, "Test User", List.of(role));
        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
        Authentication auth = new UsernamePasswordAuthenticationToken(user, "test-token", authorities);
        return authentication(auth);
    }

    @Test
    @DisplayName("SEC-04: POST /api/notifications/booking-confirmed should succeed for INTERNAL_SERVICE")
    void testBookingConfirmedEndpoint_WithServiceRole() throws Exception {
        NotificationResponse mockResponse = new NotificationResponse();
        mockResponse.setId(1L);
        mockResponse.setIdempotencyKey("BOOKING_CONFIRMED:VYR-REST-01");
        mockResponse.setType(NotificationType.BOOKING_CONFIRMED);
        mockResponse.setStatus(NotificationStatus.SENT);
        mockResponse.setRecipientEmail("test@example.com");
        mockResponse.setRecipientRole("CUSTOMER");

        when(notificationService.processBookingConfirmedNotification(any(BookingConfirmedNotificationRequest.class)))
                .thenReturn(mockResponse);

        BookingConfirmedNotificationRequest request = new BookingConfirmedNotificationRequest(
                101L,
                "VYR-REST-01",
                "Honda City",
                "Test User",
                "test@example.com",
                "+919876543210",
                LocalDateTime.now().plusDays(1),
                "2026-09-20 10:00 AM",
                LocalDateTime.now().plusDays(2),
                "2026-09-21 10:00 AM",
                "Bangalore Hub",
                1,
                BigDecimal.valueOf(5000),
                BigDecimal.ZERO,
                "BOOKING_CONFIRMED:VYR-REST-01"
        );

        mockMvc.perform(post("/api/notifications/booking-confirmed")
                        .with(withAuthenticatedUser("service-1", "booking-service@vayro.internal", "INTERNAL_SERVICE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idempotencyKey").value("BOOKING_CONFIRMED:VYR-REST-01"))
                .andExpect(jsonPath("$.status").value("SENT"));
    }

    @Test
    @DisplayName("SEC-04: POST /api/notifications/booking-confirmed should reject ordinary customer token with 403")
    void testBookingConfirmedEndpoint_WithCustomerRole_Forbidden() throws Exception {
        BookingConfirmedNotificationRequest request = new BookingConfirmedNotificationRequest(
                101L,
                "VYR-REST-01",
                "Honda City",
                "Test User",
                "test@example.com",
                "+919876543210",
                LocalDateTime.now().plusDays(1),
                "2026-09-20 10:00 AM",
                LocalDateTime.now().plusDays(2),
                "2026-09-21 10:00 AM",
                "Bangalore Hub",
                1,
                BigDecimal.valueOf(5000),
                BigDecimal.ZERO,
                "BOOKING_CONFIRMED:VYR-REST-01"
        );

        mockMvc.perform(post("/api/notifications/booking-confirmed")
                        .with(withAuthenticatedUser("cust-1", "customer@example.com", "USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-04: POST /api/notifications/booking-confirmed should reject unauthenticated request with 401")
    void testBookingConfirmedEndpoint_Unauthenticated_Unauthorized() throws Exception {
        BookingConfirmedNotificationRequest request = new BookingConfirmedNotificationRequest(
                101L,
                "VYR-REST-01",
                "Honda City",
                "Test User",
                "test@example.com",
                "+919876543210",
                LocalDateTime.now().plusDays(1),
                "2026-09-20 10:00 AM",
                LocalDateTime.now().plusDays(2),
                "2026-09-21 10:00 AM",
                "Bangalore Hub",
                1,
                BigDecimal.valueOf(5000),
                BigDecimal.ZERO,
                "BOOKING_CONFIRMED:VYR-REST-01"
        );

        mockMvc.perform(post("/api/notifications/booking-confirmed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-04: POST /api/notifications/vehicle-returned should succeed for INTERNAL_SERVICE")
    void testVehicleReturnedEndpoint_WithServiceRole() throws Exception {
        NotificationResponse mockResponse = new NotificationResponse();
        mockResponse.setId(2L);
        mockResponse.setIdempotencyKey("VEHICLE_RETURNED:VYR-REST-02");
        mockResponse.setType(NotificationType.VEHICLE_RETURNED);
        mockResponse.setStatus(NotificationStatus.SENT);
        mockResponse.setRecipientEmail("admin@vayro.com");
        mockResponse.setRecipientRole("ADMIN");

        when(notificationService.processVehicleReturnedNotification(any(VehicleReturnedNotificationRequest.class)))
                .thenReturn(mockResponse);

        VehicleReturnedNotificationRequest request = new VehicleReturnedNotificationRequest(
                102L,
                "VYR-REST-02",
                "Honda Elevate",
                "Admin User",
                "admin@example.com",
                LocalDateTime.now(),
                "2026-09-21 05:00 PM",
                "AVAILABLE",
                "VEHICLE_RETURNED:VYR-REST-02"
        );

        mockMvc.perform(post("/api/notifications/vehicle-returned")
                        .with(withAuthenticatedUser("service-1", "booking-service@vayro.internal", "INTERNAL_SERVICE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idempotencyKey").value("VEHICLE_RETURNED:VYR-REST-02"))
                .andExpect(jsonPath("$.recipientRole").value("ADMIN"));
    }

    @Test
    @DisplayName("SEC-01: GET /api/notifications/invoice/{ref} without auth should return 401")
    void testInvoiceDownload_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/notifications/invoice/VYR-REST-01"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-01: GET /api/notifications/invoice/{ref} by invoice owner should return 200 with PDF")
    void testInvoiceDownload_OwnerCustomer_Success() throws Exception {
        byte[] mockPdf = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2d}; // %PDF-
        when(notificationService.getPdfInvoiceByBookingReference(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenReturn(mockPdf);

        mockMvc.perform(get("/api/notifications/invoice/VYR-REST-01")
                        .with(withAuthenticatedUser("100", "owner@example.com", "USER")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"VAYRO-Invoice-VYR-REST-01.pdf\""));
    }

    @Test
    @DisplayName("SEC-01: GET /api/notifications/invoice/{ref} by other customer should return 403 Forbidden")
    void testInvoiceDownload_DifferentCustomer_Forbidden() throws Exception {
        when(notificationService.getPdfInvoiceByBookingReference(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to view or download this invoice."));

        mockMvc.perform(get("/api/notifications/invoice/VYR-REST-01")
                        .with(withAuthenticatedUser("101", "attacker@example.com", "USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("SEC-01: GET /api/notifications/invoice/{ref} by ADMIN should return 200 with PDF")
    void testInvoiceDownload_Admin_Success() throws Exception {
        byte[] mockPdf = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2d};
        when(notificationService.getPdfInvoiceByBookingReference(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenReturn(mockPdf);

        mockMvc.perform(get("/api/notifications/invoice/VYR-REST-01")
                        .with(withAuthenticatedUser("admin-1", "admin@vayro.com", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    @DisplayName("SEC-01: GET /api/notifications/invoice/{ref} for missing invoice should return 404")
    void testInvoiceDownload_NotFound() throws Exception {
        when(notificationService.getPdfInvoiceByBookingReference(eq("VYR-MISSING"), any(AuthenticatedUser.class)))
                .thenThrow(new InvoiceNotFoundException("Invoice not found for booking reference: VYR-MISSING"));

        mockMvc.perform(get("/api/notifications/invoice/VYR-MISSING")
                        .with(withAuthenticatedUser("100", "owner@example.com", "USER")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("SEC-01: GET /api/notifications/invoice/{ref} by disabled user should return 403 ACCOUNT_DISABLED")
    void testInvoiceDownload_DisabledUser_Returns403() throws Exception {
        when(notificationService.getPdfInvoiceByBookingReference(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenThrow(new com.vayro.notification.exception.AccountDisabledException("Account is disabled. Please contact support."));

        mockMvc.perform(get("/api/notifications/invoice/VYR-REST-01")
                        .with(withAuthenticatedUser("100", "disabled@example.com", "USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ACCOUNT_DISABLED"));
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/latest/{ref} unauthenticated returns 401")
    void testGetLatestNotification_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/notifications/latest/VYR-REST-01"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/latest/{ref} other customer returns 403 Forbidden")
    void testGetLatestNotification_DifferentCustomer_Returns403() throws Exception {
        when(notificationService.getLatestNotificationForBooking(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to view this notification."));

        mockMvc.perform(get("/api/notifications/latest/VYR-REST-01")
                        .with(withAuthenticatedUser("102", "attacker@example.com", "USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/latest/{ref} by owner returns 200 with notification")
    void testGetLatestNotification_OwnerCustomer_Success() throws Exception {
        NotificationResponse mockResponse = new NotificationResponse();
        mockResponse.setId(10L);
        mockResponse.setBookingReference("VYR-REST-01");
        mockResponse.setRecipientEmail("owner@example.com");
        mockResponse.setStatus(NotificationStatus.SENT);

        when(notificationService.getLatestNotificationForBooking(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/notifications/latest/VYR-REST-01")
                        .with(withAuthenticatedUser("100", "owner@example.com", "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingReference").value("VYR-REST-01"))
                .andExpect(jsonPath("$.recipientEmail").value("owner@example.com"));
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/latest/{ref} by admin returns 200")
    void testGetLatestNotification_Admin_Success() throws Exception {
        NotificationResponse mockResponse = new NotificationResponse();
        mockResponse.setId(10L);
        mockResponse.setBookingReference("VYR-REST-01");
        mockResponse.setRecipientEmail("customer@example.com");
        mockResponse.setStatus(NotificationStatus.SENT);

        when(notificationService.getLatestNotificationForBooking(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/notifications/latest/VYR-REST-01")
                        .with(withAuthenticatedUser("admin-1", "admin@vayro.com", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingReference").value("VYR-REST-01"));
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/latest/{ref} by INTERNAL_SERVICE returns 200")
    void testGetLatestNotification_InternalService_Success() throws Exception {
        NotificationResponse mockResponse = new NotificationResponse();
        mockResponse.setId(10L);
        mockResponse.setBookingReference("VYR-REST-01");
        mockResponse.setStatus(NotificationStatus.SENT);

        when(notificationService.getLatestNotificationForBooking(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/notifications/latest/VYR-REST-01")
                        .with(withAuthenticatedUser("service-1", "booking-service@internal.vayro.com", "INTERNAL_SERVICE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingReference").value("VYR-REST-01"));
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/latest/{ref} by disabled user returns 403 ACCOUNT_DISABLED")
    void testGetLatestNotification_DisabledUser_Returns403() throws Exception {
        when(notificationService.getLatestNotificationForBooking(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenThrow(new com.vayro.notification.exception.AccountDisabledException("Account is disabled. Please contact support."));

        mockMvc.perform(get("/api/notifications/latest/VYR-REST-01")
                        .with(withAuthenticatedUser("100", "disabled@example.com", "USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ACCOUNT_DISABLED"));
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/status/{key} unauthenticated returns 401")
    void testGetStatus_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/notifications/status/BOOKING_CONFIRMED:VYR-REST-01"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/status/{key} owner customer returns 200")
    void testGetStatus_OwnerCustomer_Success() throws Exception {
        NotificationResponse mockResponse = new NotificationResponse();
        mockResponse.setId(11L);
        mockResponse.setIdempotencyKey("BOOKING_CONFIRMED:VYR-REST-01");
        mockResponse.setRecipientEmail("owner@example.com");

        when(notificationService.getNotificationByIdempotencyKey(eq("BOOKING_CONFIRMED:VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/notifications/status/BOOKING_CONFIRMED:VYR-REST-01")
                        .with(withAuthenticatedUser("100", "owner@example.com", "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idempotencyKey").value("BOOKING_CONFIRMED:VYR-REST-01"));
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/booking/{ref} unauthenticated returns 401")
    void testGetBookingNotifications_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/notifications/booking/VYR-REST-01"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TASK 1: GET /api/notifications/booking/{ref} owner customer returns 200")
    void testGetBookingNotifications_OwnerCustomer_Success() throws Exception {
        NotificationResponse mockResponse = new NotificationResponse();
        mockResponse.setId(12L);
        mockResponse.setBookingReference("VYR-REST-01");
        mockResponse.setRecipientEmail("owner@example.com");

        when(notificationService.getNotificationsByBookingReference(eq("VYR-REST-01"), any(AuthenticatedUser.class)))
                .thenReturn(List.of(mockResponse));

        mockMvc.perform(get("/api/notifications/booking/VYR-REST-01")
                        .with(withAuthenticatedUser("100", "owner@example.com", "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookingReference").value("VYR-REST-01"));
    }
}
