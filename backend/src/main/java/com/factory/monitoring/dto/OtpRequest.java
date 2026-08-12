package com.factory.monitoring.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpRequest {
    @Pattern(regexp = "^\\+?[0-9 \\-]{7,15}$", message = "Invalid phone number format")
    private String mobile;

    @Email(message = "Invalid email format")
    private String email;
}
