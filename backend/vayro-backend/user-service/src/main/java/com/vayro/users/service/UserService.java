package com.vayro.users.service;

import com.vayro.users.dto.PageResponse;
import com.vayro.users.dto.UserResponse;
import com.vayro.users.entity.User;
import com.vayro.users.exception.ResourceNotFoundException;
import com.vayro.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.vayro.users.dto.PasswordChangeRequest;
import com.vayro.users.dto.UserProfileUpdateRequest;
import com.vayro.users.exception.AccountDisabledException;
import com.vayro.users.exception.InvalidCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Service managing user retrieval and profile operations.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        if (!user.isEnabled()) {
            throw new AccountDisabledException("Account is disabled. Please contact support.");
        }
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateUserProfile(String email, UserProfileUpdateRequest request) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        if (!user.isEnabled()) {
            throw new AccountDisabledException("Account is disabled. Please contact support.");
        }
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone().trim());
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public void changePassword(String email, PasswordChangeRequest request) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        if (!user.isEnabled()) {
            throw new AccountDisabledException("Account is disabled. Please contact support.");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Cannot change password for social login account without existing password.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as current password.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String search) {
        if (search == null || search.isBlank()) {
            return getAllUsers();
        }
        return userRepository.searchUsersList(search.trim()).stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsersPaged(String search, Pageable pageable) {
        Page<User> page = userRepository.searchUsers(search != null ? search.trim() : null, pageable);
        return new PageResponse<>(
                page.getContent().stream().map(UserResponse::fromEntity).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
}
