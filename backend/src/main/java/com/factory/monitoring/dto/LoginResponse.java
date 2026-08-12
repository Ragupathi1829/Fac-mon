package com.factory.monitoring.dto;

import com.factory.monitoring.domain.UserRole;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class LoginResponse {
    private String token;
    private Long id;
    private String employeeId;
    private String fullName;
    private String email;
    private UserRole role;
    private String department;
    private String designation;
    private String shift;
    private String factoryLocation;
    private LocalDateTime lastLogin;
}
