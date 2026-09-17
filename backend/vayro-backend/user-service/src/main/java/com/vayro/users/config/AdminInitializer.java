package com.vayro.users.config;

import com.vayro.users.entity.Role;
import com.vayro.users.entity.User;
import com.vayro.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Bootstrap runner to initialize an admin account in development environments when explicitly enabled.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap-enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${app.admin.email:admin@vayro.com}")
    private String adminEmail;

    @Value("${app.admin.password:VayroAdmin2026!}")
    private String adminPassword;

    @Value("${app.admin.first-name:Vayro}")
    private String adminFirstName;

    @Value("${app.admin.last-name:Admin}")
    private String adminLastName;

    @Value("${app.admin.phone:+91 98200 11223}")
    private String adminPhone;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            log.info("Admin bootstrap initializer is disabled.");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (!userRepository.existsByEmail(normalizedEmail)) {
            User admin = new User();
            admin.setFirstName(adminFirstName.trim());
            admin.setLastName(adminLastName.trim());
            admin.setEmail(normalizedEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setPhone(adminPhone.trim());
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);

            userRepository.save(admin);
            log.info("Development admin account initialized for: {}", normalizedEmail);
        } else {
            log.info("Admin account already exists for: {}", normalizedEmail);
        }

        String customerEmail = "customer@vayro.com";
        if (!userRepository.existsByEmail(customerEmail)) {
            User customer = new User();
            customer.setFirstName("Vayro");
            customer.setLastName("Customer");
            customer.setEmail(customerEmail);
            customer.setPassword(passwordEncoder.encode("Password123!"));
            customer.setPhone("+91 98765 43210");
            customer.setRole(Role.USER);
            customer.setEnabled(true);

            userRepository.save(customer);
            log.info("Development customer account initialized for: {}", customerEmail);
        }
    }
}
