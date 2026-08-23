package com.factory.monitoring.controller;

import com.factory.monitoring.dto.SendOtpRequest;
import com.factory.monitoring.dto.VerifyOtpRequest;
import com.factory.monitoring.service.OtpService;
import com.factory.monitoring.domain.OtpVerification;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * OtpController — Legacy / registration-specific REST endpoints for OTP.
 * Maps to /api/otp.
 */
@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        try {
            otpService.generateAndSendOtp(request.phone(), OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.REGISTER);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent successfully",
                "phone", maskPhone(request.phone()),
                "expiresIn", 300
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", e.getMessage() != null ? e.getMessage() : "Failed to send OTP."
            ));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            boolean valid = otpService.verifyOtp(request.phone(), request.code(), OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.REGISTER);
            if (valid) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "OTP verified successfully."
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Incorrect OTP. Please try again."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", e.getMessage() != null ? e.getMessage() : "Verification failed."
            ));
        }
    }

    private String maskPhone(String phone) {
        String cleaned = phone.replaceAll("\\s+", "");
        if (cleaned.length() > 4) {
            return "******" + cleaned.substring(cleaned.length() - 4);
        }
        return phone;
    }
}

