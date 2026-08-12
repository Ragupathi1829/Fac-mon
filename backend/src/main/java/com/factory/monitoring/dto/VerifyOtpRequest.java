package com.factory.monitoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request body for POST /api/otp/verify */
public record VerifyOtpRequest(
    @NotBlank(message = "Phone number is required")
    String phone,

    @NotBlank(message = "OTP code is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must contain digits only")
    String code
) {}
