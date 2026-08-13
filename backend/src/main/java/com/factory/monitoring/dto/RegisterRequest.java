package com.factory.monitoring.dto;

import com.factory.monitoring.domain.UserRole;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String fullName;
    private String email;
    private String phone;
    private String password;
    private UserRole role;
    private String department;
    private String designation;
    private String employeeId;
    private String factoryLocation;
}
