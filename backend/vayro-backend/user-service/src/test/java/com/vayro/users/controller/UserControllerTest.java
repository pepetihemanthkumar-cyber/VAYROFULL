package com.vayro.users.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vayro.users.dto.AuthResponse;
import com.vayro.users.dto.LoginRequest;
import com.vayro.users.dto.RegisterRequest;
import com.vayro.users.entity.Role;
import com.vayro.users.entity.User;
import com.vayro.users.repository.UserRepository;
import com.vayro.users.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testGetCurrentUserWithValidJwtReturns200() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("Sarah", "Connor", "sarah@vayro.com", "Password123!", "+919876543210");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(registerResult.getResponse().getContentAsString(), AuthResponse.class);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + authResponse.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("sarah@vayro.com"))
                .andExpect(jsonPath("$.firstName").value("Sarah"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void testGetCurrentUserWithoutJwtReturnsForbiddenOrUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetAllUsersAsRegularUserReturns403Forbidden() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("Regular", "User", "regular@vayro.com", "Password123!", "+919876543210");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(registerResult.getResponse().getContentAsString(), AuthResponse.class);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + authResponse.getToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetAllUsersAsAdminReturns200Ok() throws Exception {
        User admin = new User("Admin", "Vayro", "admin@vayro.com", passwordEncoder.encode("AdminPass123!"), "+919820011223", Role.ADMIN);
        userRepository.save(admin);

        String adminToken = jwtService.generateToken(admin);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].email").value("admin@vayro.com"))
                .andExpect(jsonPath("$[0].role").value("ADMIN"));
    }

    @Test
    void testDisabledUserCannotAccessCurrentUserEndpointWithPreviouslyIssuedToken() throws Exception {
        // 1. Create and save an active user
        User user = new User("Dave", "Bowman", "dave@vayro.com", passwordEncoder.encode("Password123!"), "+919876543210", Role.USER);
        user.setEnabled(true);
        user = userRepository.save(user);

        // 2. Issue valid JWT token while user is active
        String issuedToken = jwtService.generateToken(user);

        // 3. Verify user can access /api/users/me with token
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + issuedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("dave@vayro.com"))
                .andExpect(jsonPath("$.enabled").value(true));

        // 4. Disable user account (simulating admin deactivation)
        user.setEnabled(false);
        userRepository.save(user);

        // 5. User attempts to reuse the previously issued JWT -> MUST return 403 Forbidden
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + issuedToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testActiveUserCanUpdateStatusAsAdminAndIsDisabledImmediately() throws Exception {
        User admin = new User("Admin", "Root", "admin-mgr@vayro.com", passwordEncoder.encode("AdminPass123!"), "+919999999999", Role.ADMIN);
        userRepository.save(admin);
        String adminToken = jwtService.generateToken(admin);

        User customer = new User("John", "Doe", "john.doe@vayro.com", passwordEncoder.encode("CustomerPass123!"), "+919888888888", Role.USER);
        customer.setEnabled(true);
        customer = userRepository.save(customer);
        String customerToken = jwtService.generateToken(customer);

        // Verify customer has active access
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        // Admin disables customer via PATCH /api/users/{id}/status
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/users/" + customer.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        // Customer token is now immediately rejected
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateUserProfileAuthenticatedSuccessAndNeverExposesPasswordHash() throws Exception {
        User user = new User("Jane", "Doe", "jane.doe@vayro.com", passwordEncoder.encode("Password123!"), "+919876543210", Role.USER);
        user.setEnabled(true);
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        String updatePayload = "{\"firstName\": \"Janet\", \"lastName\": \"Smith\", \"phone\": \"+919988776655\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.email").value("jane.doe@vayro.com"))
                .andExpect(jsonPath("$.firstName").value("Janet"))
                .andExpect(jsonPath("$.lastName").value("Smith"))
                .andExpect(jsonPath("$.phone").value("+919988776655"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // Verify database persistence
        User persisted = userRepository.findById(user.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Janet", persisted.getFirstName());
        org.junit.jupiter.api.Assertions.assertEquals("Smith", persisted.getLastName());
        org.junit.jupiter.api.Assertions.assertEquals("+919988776655", persisted.getPhone());
    }

    @Test
    void testUpdateUserProfileUnauthenticatedReturnsForbidden() throws Exception {
        String updatePayload = "{\"firstName\": \"Janet\", \"lastName\": \"Smith\", \"phone\": \"+919988776655\"}";
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateUserProfileValidationFailsOnBlankFirstName() throws Exception {
        User user = new User("Jane", "Doe", "jane.val@vayro.com", passwordEncoder.encode("Password123!"), "+919876543210", Role.USER);
        user.setEnabled(true);
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        String invalidPayload = "{\"firstName\": \"\", \"lastName\": \"Smith\", \"phone\": \"+919988776655\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testChangePasswordSuccessAndVerifiesNewBCryptHash() throws Exception {
        User user = new User("Alice", "Wonder", "alice@vayro.com", passwordEncoder.encode("OldPassword123!"), "+919876543210", Role.USER);
        user.setEnabled(true);
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        String payload = "{\"currentPassword\": \"OldPassword123!\", \"newPassword\": \"NewSecretPassword456!\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully."))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // Verify database persistence of new BCrypt hash
        User updated = userRepository.findById(user.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("NewSecretPassword456!", updated.getPassword()));
        org.junit.jupiter.api.Assertions.assertFalse(passwordEncoder.matches("OldPassword123!", updated.getPassword()));
    }

    @Test
    void testChangePasswordWithIncorrectCurrentPasswordReturns401() throws Exception {
        User user = new User("Bob", "Builder", "bob@vayro.com", passwordEncoder.encode("CorrectPassword123!"), "+919876543210", Role.USER);
        user.setEnabled(true);
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        String payload = "{\"currentPassword\": \"WrongPassword!\", \"newPassword\": \"NewPassword456!\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Current password is incorrect."));
    }

    @Test
    void testChangePasswordSamePasswordReturns400() throws Exception {
        User user = new User("Charlie", "Brown", "charlie@vayro.com", passwordEncoder.encode("SamePassword123!"), "+919876543210", Role.USER);
        user.setEnabled(true);
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        String payload = "{\"currentPassword\": \"SamePassword123!\", \"newPassword\": \"SamePassword123!\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("New password cannot be the same as current password."));
    }

    @Test
    void testChangePasswordTooShortReturns400() throws Exception {
        User user = new User("David", "Copper", "david@vayro.com", passwordEncoder.encode("ValidPass123!"), "+919876543210", Role.USER);
        user.setEnabled(true);
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        String payload = "{\"currentPassword\": \"ValidPass123!\", \"newPassword\": \"short\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
