package com.vayro.users.config;

import com.vayro.users.entity.Role;
import com.vayro.users.entity.User;
import com.vayro.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Bootstrap runner to initialize an admin account in development environments when explicitly enabled.
 * Demo/test accounts are strictly prohibited in production.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${app.admin.bootstrap-enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.first-name:Vayro}")
    private String adminFirstName;

    @Value("${app.admin.last-name:Admin}")
    private String adminLastName;

    @Value("${app.admin.phone:+91 98200 11223}")
    private String adminPhone;

    @Value("${app.demo-accounts.enabled:false}")
    private boolean demoAccountsEnabled;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        initializeAdmin();
        initializeDemoAccounts();
    }

    private void initializeAdmin() {
        if (!bootstrapEnabled) {
            log.info("Admin bootstrap initializer is disabled (ADMIN_BOOTSTRAP_ENABLED=false).");
            return;
        }

        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("Admin bootstrap is enabled but ADMIN_EMAIL or ADMIN_PASSWORD is empty. Skipping bootstrap account creation.");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (!userRepository.existsByEmail(normalizedEmail)) {
            User admin = new User();
            admin.setFirstName(adminFirstName != null && !adminFirstName.isBlank() ? adminFirstName.trim() : "Vayro");
            admin.setLastName(adminLastName != null && !adminLastName.isBlank() ? adminLastName.trim() : "Admin");
            admin.setEmail(normalizedEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setPhone(adminPhone != null && !adminPhone.isBlank() ? adminPhone.trim() : "+91 98200 11223");
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);

            userRepository.save(admin);
            log.info("Admin bootstrap initialized account for: {}", normalizedEmail);
        } else {
            log.info("Admin account already exists for: {}", normalizedEmail);
        }
    }

    private void initializeDemoAccounts() {
        if (!demoAccountsEnabled) {
            log.info("Demo account initialization is disabled (app.demo-accounts.enabled=false).");
            return;
        }

        if (isProductionEnvironment()) {
            log.warn("Production environment detected! Test/demo account creation is strictly forbidden in production.");
            return;
        }

        String customerEmail = "customer@vayro.com";
        if (!userRepository.existsByEmail(customerEmail)) {
            User customer = new User();
            customer.setFirstName("Vayro");
            customer.setLastName("Customer");
            customer.setEmail(customerEmail);
            customer.setPassword(passwordEncoder.encode("VayroCustomer2026!"));
            customer.setPhone("+91 98765 43210");
            customer.setRole(Role.USER);
            customer.setEnabled(true);

            userRepository.save(customer);
            log.info("Demo customer initialized account for development: {}", customerEmail);
        }
    }

    private boolean isProductionEnvironment() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        String appEnv = System.getenv("APP_ENV");
        if (appEnv != null && ("prod".equalsIgnoreCase(appEnv) || "production".equalsIgnoreCase(appEnv))) {
            return true;
        }
        return false;
    }
}
