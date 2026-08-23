package com.factory.monitoring.service;

import com.factory.monitoring.domain.User;
import com.factory.monitoring.domain.UserRole;
import com.factory.monitoring.dto.LoginRequest;
import com.factory.monitoring.dto.LoginResponse;
import com.factory.monitoring.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void initDefaultUsers() {
        if (userRepository.count() == 0) {
            seedUser("EMP-1001", "Ragaav", "admin@factory.com", "+919876543210", "admin123", UserRole.ADMIN, "Executive Board", "Chief Factory Admin");
            seedUser("EMP-1002", "Vikram Manager", "manager@factory.com", "+919876543211", "manager123", UserRole.FACTORY_MANAGER, "Production Ops", "Plant General Manager");
            seedUser("EMP-1003", "Rajesh Engineer", "engineer@factory.com", "+919876543212", "engineer123", UserRole.MAINTENANCE_ENGINEER, "Equipment Maintenance", "Senior Reliability Engineer");
            seedUser("EMP-1004", "Anand Operator", "operator@factory.com", "+919876543213", "operator123", UserRole.MACHINE_OPERATOR, "Extruder Sector A", "Senior Machine Specialist");
            seedUser("EMP-1005", "Meera Inspector", "quality@factory.com", "+919876543214", "quality123", UserRole.QUALITY_INSPECTOR, "Quality Assurance", "Chief Quality Auditor");
        }
    }

    private void seedUser(String empId, String name, String email, String phone, String password, UserRole role, String dept, String desig) {
        User u = User.builder()
                .employeeId(empId)
                .fullName(name)
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(password))
                .role(role)
                .department(dept)
                .designation(desig)
                .status("ACTIVE")
                .emailVerified(true)
                .mobileVerified(true)
                .factoryLocation("SmartFactory Unit 1 · Chennai")
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(u);
    }

    public User register(com.factory.monitoring.dto.RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists.");
        }
        
        String empId = request.getEmployeeId() != null && !request.getEmployeeId().isEmpty() 
                ? request.getEmployeeId() 
                : "EMP-" + (int)(Math.random() * 9000 + 1000);

        String normalizedPhone = request.getPhone();
        if (normalizedPhone != null && !normalizedPhone.trim().isEmpty()) {
            String cleaned = normalizedPhone.replaceAll("[^0-9]", "");
            if (cleaned.startsWith("91") && cleaned.length() == 12) cleaned = cleaned.substring(2);
            else if (cleaned.startsWith("0") && cleaned.length() == 11) cleaned = cleaned.substring(1);
            if (cleaned.length() == 10) normalizedPhone = "+91" + cleaned;
        }
        
        User newUser = User.builder()
                .employeeId(empId)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(normalizedPhone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : UserRole.MACHINE_OPERATOR)
                .department(request.getDepartment())
                .designation(request.getDesignation())
                .factoryLocation(request.getFactoryLocation() != null ? request.getFactoryLocation() : "SmartFactory Unit 1 · Chennai")
                .status("ACTIVE")
                .emailVerified(true)
                .mobileVerified(true)
                .createdAt(LocalDateTime.now())
                .build();
                
        return userRepository.save(newUser);
    }

    public LoginResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid credentials. Please check your factory email and password.");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials. Please check your factory email and password.");
        }
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return buildLoginResponse(user);
    }

    public LoginResponse loginByPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.startsWith("91") && cleaned.length() == 12) cleaned = cleaned.substring(2);
        else if (cleaned.startsWith("0") && cleaned.length() == 11) cleaned = cleaned.substring(1);
        String normalizedPhone = (cleaned.length() == 10) ? "+91" + cleaned : "+" + cleaned;

        Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);
        if (userOpt.isEmpty()) {
            // Also check un-prefixed cleaned phone just in case older data stored 10 digits
            userOpt = userRepository.findByPhone(cleaned);
        }
        if (userOpt.isEmpty()) {
            return null; // Signals requiresRegistration
        }
        User user = userOpt.get();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return buildLoginResponse(user);
    }

    private LoginResponse buildLoginResponse(User user) {
        String token = "JWT_BEARER_" + UUID.randomUUID().toString() + "_" + user.getRole();

        return LoginResponse.builder()
                .token(token)
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .designation(user.getDesignation())
                .shift("Morning Shift (06:00 - 14:00)")
                .factoryLocation("SmartFactory Unit 1 · Chennai")
                .lastLogin(user.getLastLogin())
                .build();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Validates a token by extracting the role suffix and finding the matching user.
     * Token format: JWT_BEARER_<uuid>_<ROLE>
     * Returns the LoginResponse if valid, null if the token cannot be resolved.
     */
    public LoginResponse validateToken(String token) {
        if (token == null || !token.startsWith("JWT_BEARER_")) {
            return null;
        }
        try {
            // Token format: JWT_BEARER_<uuid>_<ROLE>
            // The role is the last underscore-delimited segment
            String[] parts = token.split("_");
            // parts[0]=JWT, parts[1]=BEARER, parts[2]=<uuid-part1>, ..., parts[last]=ROLE
            // UUID has 5 parts separated by - but the full token uses _ as separator
            // Safe approach: find the matching user by checking all users whose role appears at the end
            UserRole role = UserRole.valueOf(parts[parts.length - 1]);
            return userRepository.findAll().stream()
                    .filter(u -> u.getRole() == role)
                    .filter(u -> u.getLastLogin() != null)
                    .sorted((a, b) -> b.getLastLogin().compareTo(a.getLastLogin()))
                    .findFirst()
                    .map(this::buildLoginResponse)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
