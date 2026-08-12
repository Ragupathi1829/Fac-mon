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
 * OtpController — REST endpoints for OTP generation and verification.
 *
 * POST /api/otp/send    → Generate + send OTP to phone number via Twilio SMS
 * POST /api/otp/verify  → Verify submitted OTP code against stored value
 */
@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    /**
     * Send OTP to the given phone number.
     * In production (twilio.enabled=true): real SMS via Twilio.
     * In dev mode (twilio.enabled=false): OTP logged to backend console.
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        try {
            otpService.generateAndSendOtp(request.phone(), OtpVerification.OtpType.MOBILE);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent to " + maskPhone(request.phone()),
                "phone", maskPhone(request.phone())
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "success", false,
                "message", "Failed to send OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * Verify OTP submitted by the user.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean valid = otpService.verifyOtp(request.phone(), request.code(), OtpVerification.OtpType.MOBILE);

        if (valid) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP verified successfully. Worker registration can proceed."
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", "Invalid or expired OTP. Please request a new code."
            ));
        }
    }

    /** Mask phone for response: +91 98765 XXXXX → +91 •••••43210 */
    private String maskPhone(String phone) {
        String cleaned = phone.replaceAll("\\s+", "");
        if (cleaned.length() > 5) {
            return cleaned.substring(0, cleaned.length() - 5) + "•••••";
        }
        return phone;
    }
}
