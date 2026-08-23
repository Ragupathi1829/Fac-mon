package com.factory.monitoring.controller;

import com.factory.monitoring.domain.OtpVerification;
import com.factory.monitoring.dto.LoginResponse;
import com.factory.monitoring.service.AuthService;
import com.factory.monitoring.service.OtpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/otp")
public class OtpAuthController {

    private static final Logger log = LoggerFactory.getLogger(OtpAuthController.class);

    @Autowired
    private OtpService otpService;

    @Autowired
    private AuthService authService;

    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String rawPhone = request.get("phoneNumber");
        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            rawPhone = request.get("phone");
        }

        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Phone number is required."
            ));
        }

        try {
            otpService.generateAndSendOtp(rawPhone.trim(), OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "OTP sent successfully",
                    "expiresIn", 300
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            String msg = e.getMessage();
            HttpStatus status = msg != null && (msg.contains("wait") || msg.contains("Too many"))
                    ? HttpStatus.TOO_MANY_REQUESTS
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", msg != null ? msg : "Failed to send OTP."
            ));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String rawPhone = request.get("phoneNumber");
        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            rawPhone = request.get("phone");
        }

        String rawOtp = request.get("otp");
        if (rawOtp == null || rawOtp.trim().isEmpty()) {
            rawOtp = request.get("code");
        }

        if (rawPhone == null || rawPhone.trim().isEmpty() || rawOtp == null || rawOtp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Phone number and OTP code are required."
            ));
        }

        try {
            boolean verified = otpService.verifyOtp(rawPhone.trim(), rawOtp.trim(), OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN);
            if (verified) {
                // Check if user already exists
                LoginResponse loginResponse = authService.loginByPhone(rawPhone.trim());
                
                if (loginResponse != null) {
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "OTP verified successfully",
                            "token", loginResponse.getToken(),
                            "user", loginResponse
                    ));
                } else {
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "requiresRegistration", true,
                            "message", "Phone number verified. Please complete your registration."
                    ));
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Incorrect OTP. Please try again."
            ));
        } catch (Exception e) {
            String msg = e.getMessage();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", msg != null ? msg : "Verification failed."
            ));
        }
    }
}

