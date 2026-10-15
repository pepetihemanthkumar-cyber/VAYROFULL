package com.vayro.users.config;

import com.vayro.users.entity.Role;
import com.vayro.users.entity.User;
import com.vayro.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private Environment environment;

    private AdminInitializer adminInitializer;

    @BeforeEach
    void setUp() {
        adminInitializer = new AdminInitializer(userRepository, passwordEncoder, environment);
        lenient().when(environment.getActiveProfiles()).thenReturn(new String[]{"default"});
    }

    @Test
    @DisplayName("When bootstrap is disabled, no accounts are initialized")
    void testBootstrapDisabled() {
        ReflectionTestUtils.setField(adminInitializer, "bootstrapEnabled", false);
        ReflectionTestUtils.setField(adminInitializer, "demoAccountsEnabled", false);

        adminInitializer.run();

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("When bootstrap is enabled with credentials, admin account is created")
    void testAdminBootstrapEnabled() {
        ReflectionTestUtils.setField(adminInitializer, "bootstrapEnabled", true);
        ReflectionTestUtils.setField(adminInitializer, "adminEmail", "admin@vayro.com");
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "SecureAdminPass123!");
        ReflectionTestUtils.setField(adminInitializer, "demoAccountsEnabled", false);

        when(userRepository.existsByEmail("admin@vayro.com")).thenReturn(false);
        when(passwordEncoder.encode("SecureAdminPass123!")).thenReturn("encodedPassword");

        adminInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("admin@vayro.com");
        assertThat(savedUser.getRole()).isEqualTo(Role.ADMIN);
        assertThat(savedUser.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    @DisplayName("When demoAccountsEnabled is true in dev, demo customer is created")
    void testDemoAccountCreatedInDev() {
        ReflectionTestUtils.setField(adminInitializer, "bootstrapEnabled", false);
        ReflectionTestUtils.setField(adminInitializer, "demoAccountsEnabled", true);

        when(userRepository.existsByEmail("customer@vayro.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedCustPass");

        adminInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("customer@vayro.com");
        assertThat(savedUser.getRole()).isEqualTo(Role.USER);
    }

    @Test
    @DisplayName("When environment is production, demo customer creation is strictly blocked")
    void testDemoAccountBlockedInProduction() {
        ReflectionTestUtils.setField(adminInitializer, "bootstrapEnabled", false);
        ReflectionTestUtils.setField(adminInitializer, "demoAccountsEnabled", true);

        when(environment.getActiveProfiles()).thenReturn(new String[]{"production"});

        adminInitializer.run();

        verify(userRepository, never()).save(any(User.class));
        verify(userRepository, never()).existsByEmail("customer@vayro.com");
    }
}
