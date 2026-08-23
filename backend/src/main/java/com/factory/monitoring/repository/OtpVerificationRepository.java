package com.factory.monitoring.repository;

import com.factory.monitoring.domain.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    
    Optional<OtpVerification> findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(
            String contact, OtpVerification.OtpType type, OtpVerification.OtpPurpose purpose);
    
    java.util.List<OtpVerification> findByContactAndTypeAndPurposeAndVerifiedFalse(
            String contact, OtpVerification.OtpType type, OtpVerification.OtpPurpose purpose);
            
    int countByContactAndCreatedAtAfter(String contact, LocalDateTime since);
}
