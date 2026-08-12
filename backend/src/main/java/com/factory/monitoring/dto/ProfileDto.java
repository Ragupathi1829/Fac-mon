package com.factory.monitoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileDto {
    private Long id;
    private String employeeId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String alternateEmail;
    private String address;
    private String emergencyContact;
    private String profileImage;
    private String role;
    private String department;
    private String designation;
    private String factoryName;
    private String shift;
    private String status;
    private String lastLogin;
}
