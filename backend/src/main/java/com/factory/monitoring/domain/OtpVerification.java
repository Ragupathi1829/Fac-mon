package com.factory.monitoring.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications", indexes = {
    @Index(name = "idx_otp_contact_type", columnList = "contact, type"),
    @Index(name = "idx_otp_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Normalized phone number: +91XXXXXXXXXX */
    @Column(nullable = false)
    private String contact;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpType type;

    /**
     * Purpose of this OTP — LOGIN or REGISTER.
     * Prevents an OTP generated for login being used for registration and vice versa.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OtpPurpose purpose = OtpPurpose.LOGIN;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum OtpType {
        MOBILE, EMAIL
    }

    public enum OtpPurpose {
        LOGIN, REGISTER, FORGOT_PASSWORD
    }
}
