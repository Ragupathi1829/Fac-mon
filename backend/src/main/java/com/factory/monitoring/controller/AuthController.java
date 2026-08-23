package com.factory.monitoring.controller;

import com.factory.monitoring.domain.User;
import com.factory.monitoring.dto.LoginRequest;
import com.factory.monitoring.dto.LoginResponse;
import com.factory.monitoring.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody com.factory.monitoring.dto.RegisterRequest request) {
        try {
            User user = authService.register(request);
            return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "userId", user.getId(),
                "employeeId", user.getEmployeeId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Stateless JWT: logout is handled on the frontend by clearing the token.
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    /**
     * Validates a stored JWT-like token by extracting the user from the DB.
     * Called by the frontend on every app startup to confirm session is still valid.
     * Token format: JWT_BEARER_<uuid>_<ROLE>
     * In a full JWT implementation, this would verify the cryptographic signature.
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer JWT_BEARER_")) {
                return ResponseEntity.status(401).body(Map.of("valid", false, "message", "No valid token provided"));
            }
            LoginResponse user = authService.validateToken(authHeader.substring(7));
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Session expired or invalid"));
            }
            return ResponseEntity.ok(Map.of("valid", true, "user", user));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Session validation failed"));
        }
    }
}
