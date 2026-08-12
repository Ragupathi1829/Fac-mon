package com.factory.monitoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Request body for POST /api/otp/send */
public record SendOtpRequest(
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9 \\-]{7,15}$", message = "Invalid phone number format")
    String phone
) {}
