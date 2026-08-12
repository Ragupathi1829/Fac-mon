package com.factory.monitoring.repository;

import com.factory.monitoring.domain.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    
    Optional<OtpVerification> findTopByContactAndTypeOrderByCreatedAtDesc(String contact, OtpVerification.OtpType type);
    
    java.util.List<OtpVerification> findByContactAndTypeAndVerifiedFalse(String contact, OtpVerification.OtpType type);
    
}
