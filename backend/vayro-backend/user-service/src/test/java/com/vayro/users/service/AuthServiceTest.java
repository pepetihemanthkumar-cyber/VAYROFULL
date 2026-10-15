package com.vayro.users.service;

import com.vayro.users.dto.AuthResponse;
import com.vayro.users.dto.LoginRequest;
import com.vayro.users.dto.RegisterRequest;
import com.vayro.users.entity.Role;
import com.vayro.users.entity.User;
import com.vayro.users.exception.InvalidCredentialsException;
import com.vayro.users.exception.UserAlreadyExistsException;
import com.vayro.users.repository.UserRepository;
import com.vayro.users.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setFirstName("Rohan");
        sampleUser.setLastName("Verma");
        sampleUser.setEmail("rohan@example.com");
        sampleUser.setPassword("encodedPassword123");
        sampleUser.setPhone("9811122334");
        sampleUser.setRole(Role.USER);
        sampleUser.setEnabled(true);
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("Rohan", "Verma", "rohan@example.com", "Password123!", "9811122334");

        when(userRepository.existsByEmail("rohan@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtService.generateToken(sampleUser)).thenReturn("sample.jwt.token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("sample.jwt.token", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals("rohan@example.com", response.getUser().getEmail());
        assertEquals(Role.USER, response.getUser().getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterDuplicateEmailThrowsConflict() {
        RegisterRequest request = new RegisterRequest("Rohan", "Verma", "rohan@example.com", "Password123!", "9811122334");

        when(userRepository.existsByEmail("rohan@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("rohan@example.com", "Password123!");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("rohan@example.com", "Password123!"));
        when(userRepository.findByEmail("rohan@example.com")).thenReturn(Optional.of(sampleUser));
        when(jwtService.generateToken(sampleUser)).thenReturn("sample.jwt.token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("sample.jwt.token", response.getToken());
        assertEquals("rohan@example.com", response.getUser().getEmail());
    }

    @Test
    void testLoginBadCredentialsThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("rohan@example.com", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void testGoogleAuthSuccessWhenEmailVerified() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier mockVerifier =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken mockToken =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();

        payload.setSubject("google-sub-12345");
        payload.setEmail("verified.user@gmail.com");
        payload.setEmailVerified(true);
        payload.set("given_name", "Verified");
        payload.set("family_name", "GoogleUser");

        when(mockToken.getPayload()).thenReturn(payload);
        when(mockVerifier.verify("valid-token-str")).thenReturn(mockToken);
        authService.setCachedVerifier(mockVerifier);

        when(userRepository.findByGoogleSubjectId("google-sub-12345")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("verified.user@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-random-pwd");

        User savedGoogleUser = new User("Verified", "GoogleUser", "verified.user@gmail.com", "encoded-random-pwd", "+91 98765 43210", Role.USER);
        savedGoogleUser.setId(99L);
        when(userRepository.save(any(User.class))).thenReturn(savedGoogleUser);
        when(jwtService.generateToken(savedGoogleUser)).thenReturn("google.jwt.token");

        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("valid-token-str");
        AuthResponse res = authService.authenticateGoogleUser(req);

        assertNotNull(res);
        assertEquals("google.jwt.token", res.getToken());
        assertEquals("verified.user@gmail.com", res.getUser().getEmail());
    }

    @Test
    void testGoogleAuthRejectsUnverifiedEmail() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier mockVerifier =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken mockToken =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();

        payload.setSubject("google-sub-unverified");
        payload.setEmail("unverified.user@gmail.com");
        payload.setEmailVerified(false);

        when(mockToken.getPayload()).thenReturn(payload);
        when(mockVerifier.verify("unverified-token")).thenReturn(mockToken);
        authService.setCachedVerifier(mockVerifier);

        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("unverified-token");
        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.authenticateGoogleUser(req));
        assertTrue(ex.getMessage().contains("not verified"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testGoogleAuthRejectsMissingEmailVerifiedClaim() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier mockVerifier =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken mockToken =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();

        payload.setSubject("google-sub-missing-claim");
        payload.setEmail("missing.claim@gmail.com");
        payload.setEmailVerified(null); // Missing email_verified claim

        when(mockToken.getPayload()).thenReturn(payload);
        when(mockVerifier.verify("missing-claim-token")).thenReturn(mockToken);
        authService.setCachedVerifier(mockVerifier);

        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("missing-claim-token");
        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.authenticateGoogleUser(req));
        assertTrue(ex.getMessage().contains("not verified"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testGoogleAuthRejectsInvalidSignature() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier mockVerifier =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.class);
        when(mockVerifier.verify("bad-signature-token")).thenThrow(new java.security.GeneralSecurityException("Invalid cryptographic signature"));
        authService.setCachedVerifier(mockVerifier);

        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("bad-signature-token");
        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.authenticateGoogleUser(req));
        assertTrue(ex.getMessage().contains("verification failed"));
    }

    @Test
    void testGoogleAuthRejectsIncorrectAudience() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier mockVerifier =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.class);
        when(mockVerifier.verify("wrong-audience-token")).thenReturn(null); // Verifier returns null when audience does not match
        authService.setCachedVerifier(mockVerifier);

        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("wrong-audience-token");
        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.authenticateGoogleUser(req));
        assertTrue(ex.getMessage().contains("Invalid, expired, or untrusted"));
    }

    @Test
    void testGoogleAuthRejectsExpiredToken() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier mockVerifier =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.class);
        when(mockVerifier.verify("expired-token")).thenReturn(null); // Verifier returns null when token exp has passed
        authService.setCachedVerifier(mockVerifier);

        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("expired-token");
        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.authenticateGoogleUser(req));
        assertTrue(ex.getMessage().contains("Invalid, expired, or untrusted"));
    }

    @Test
    void testGoogleAuthRejectsMissingSubjectId() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier mockVerifier =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken mockToken =
                mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();

        payload.setSubject(""); // Missing subject ID
        payload.setEmail("user@gmail.com");
        payload.setEmailVerified(true);

        when(mockToken.getPayload()).thenReturn(payload);
        when(mockVerifier.verify("no-sub-token")).thenReturn(mockToken);
        authService.setCachedVerifier(mockVerifier);

        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("no-sub-token");
        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.authenticateGoogleUser(req));
        assertTrue(ex.getMessage().contains("subject ID is missing"));
    }

    @Test
    void testGoogleAuthRejectsMissingCredential() {
        com.vayro.users.dto.GoogleAuthRequest req = new com.vayro.users.dto.GoogleAuthRequest("");
        assertThrows(InvalidCredentialsException.class, () -> authService.authenticateGoogleUser(req));
    }
}
