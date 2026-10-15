package com.vayro.users.controller;

import com.vayro.users.dto.PageResponse;
import com.vayro.users.dto.PasswordChangeRequest;
import com.vayro.users.dto.UserProfileUpdateRequest;
import com.vayro.users.dto.UserResponse;
import com.vayro.users.dto.UserStatusUpdateRequest;
import com.vayro.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller handling protected user profile and administration endpoints.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        UserResponse response = userService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUserProfile(
            Principal principal,
            @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        UserResponse response = userService.updateUserProfile(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            Principal principal,
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        userService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        if (page != null) {
            Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            PageResponse<UserResponse> paged = userService.getAllUsersPaged(search, pageable);
            return ResponseEntity.ok(paged);
        }
        List<UserResponse> users = userService.getAllUsers(search);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody UserStatusUpdateRequest request
    ) {
        boolean enabled = request.resolveEnabled();
        UserResponse response = userService.updateUserStatus(id, enabled);
        return ResponseEntity.ok(response);
    }
}
