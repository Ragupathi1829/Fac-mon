package com.factory.monitoring.controller;

import com.factory.monitoring.dto.OtpRequest;
import com.factory.monitoring.dto.OtpVerifyRequest;
import com.factory.monitoring.dto.ProfileDto;
import com.factory.monitoring.domain.OtpVerification;
import com.factory.monitoring.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    private final OtpService otpService;

    public ProfileController(OtpService otpService) {
        this.otpService = otpService;
    }

    @GetMapping
    public ResponseEntity<ProfileDto> getProfile() {
        ProfileDto profile = ProfileDto.builder()
                .id(1L)
                .employeeId("EMP-1001")
                .firstName("Ragaav")
                .lastName("")
                .fullName("Ragaav")
                .email("admin@factory.com")
                .phone("+91 98765 43210")
                .alternateEmail("ragu.admin@smartfactory360.com")
                .address("Sector 4, Industrial Expressway, Chennai, TN")
                .emergencyContact("+91 98123 45678 (Spouse)")
                .profileImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200")
                .role("ADMIN")
                .department("Executive Board")
                .designation("Chief Factory Admin & System Director")
                .factoryName("SmartFactory Unit 1 · Chennai")
                .shift("Morning Shift (06:00 - 14:00)")
                .status("ACTIVE")
                .lastLogin("Today, 10:24 AM")
                .build();

        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody ProfileDto dto) {
        return ResponseEntity.ok(Map.of("message", "Profile details updated successfully", "profile", dto));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/upload-photo")
    public ResponseEntity<?> uploadPhoto() {
        return ResponseEntity.ok(Map.of("message", "Photo uploaded successfully"));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, String>>> getActivity() {
        List<Map<String, String>> timeline = List.of(
                Map.of("time", "10:24 AM", "title", "Logged in securely", "date", "Today", "type", "LOGIN"),
                Map.of("time", "09:45 AM", "title", "Approved maintenance workorder for MCH-102", "date", "Today", "type", "WORKFLOW"),
                Map.of("time", "04:15 PM", "title", "Generated BEE Star Rating Audit Report", "date", "Yesterday", "type", "REPORT"),
                Map.of("time", "02:30 PM", "title", "Updated employee shift assignment for Sector B", "date", "Yesterday", "type", "ADMIN")
        );
        return ResponseEntity.ok(timeline);
    }

    @PostMapping("/send-mobile-otp")
    public ResponseEntity<?> sendMobileOtp(@Valid @RequestBody OtpRequest request) {
        if (request.getMobile() == null || request.getMobile().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mobile number is required"));
        }
        try {
            otpService.generateAndSendOtp(request.getMobile(), OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully", "expiresIn", 300));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-mobile-otp")
    public ResponseEntity<?> verifyMobileOtp(@Valid @RequestBody OtpVerifyRequest request) {
        boolean verified = otpService.verifyOtp(request.getMobile(), request.getOtp(), OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN);
        if (verified) {
            return ResponseEntity.ok(Map.of("verified", true, "message", "Mobile number verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "message", "Invalid or expired OTP"));
        }
    }

    @PostMapping("/send-email-otp")
    public ResponseEntity<?> sendEmailOtp(@Valid @RequestBody OtpRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        try {
            otpService.generateAndSendOtp(request.getEmail(), OtpVerification.OtpType.EMAIL, OtpVerification.OtpPurpose.LOGIN);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully", "expiresIn", 300));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-email-otp")
    public ResponseEntity<?> verifyEmailOtp(@Valid @RequestBody OtpVerifyRequest request) {
        boolean verified = otpService.verifyOtp(request.getEmail(), request.getOtp(), OtpVerification.OtpType.EMAIL, OtpVerification.OtpPurpose.LOGIN);
        if (verified) {
            return ResponseEntity.ok(Map.of("verified", true, "message", "Email verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "message", "Invalid or expired OTP"));
        }
    }
}
