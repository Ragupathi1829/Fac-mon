package com.factory.monitoring.service;

import com.factory.monitoring.domain.OtpVerification;
import com.factory.monitoring.repository.OtpVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private final OtpVerificationRepository otpVerificationRepository;
    private final SmsService smsService;
    private final SecureRandom random = new SecureRandom();

    @Value("${otp.expiration-minutes:5}")
    private int expirationMinutes;

    @Value("${otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${otp.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;

    @Value("${otp.max-requests-per-hour:5}")
    private int maxRequestsPerHour;

    public OtpService(OtpVerificationRepository otpVerificationRepository, SmsService smsService) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.smsService = smsService;
    }

    /**
     * Normalizes and validates Indian phone numbers.
     * Accepts formats: 9876543210, +919876543210, 919876543210, 09876543210
     * Outputs: +919876543210
     */
    public String normalizePhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number is required.");
        }
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.startsWith("91") && cleaned.length() == 12) {
            cleaned = cleaned.substring(2);
        } else if (cleaned.startsWith("0") && cleaned.length() == 11) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.length() != 10 || !cleaned.matches("^[6-9]\\d{9}$")) {
            throw new IllegalArgumentException("Invalid mobile number. Please provide a valid 10-digit Indian phone number.");
        }
        return "+91" + cleaned;
    }

    @Transactional
    public String generateAndSendOtp(String contact, OtpVerification.OtpType type, OtpVerification.OtpPurpose purpose) {
        String normalizedContact = type == OtpVerification.OtpType.MOBILE ? normalizePhone(contact) : contact;

        // Rate limit: Max requests per hour
        int requestsLastHour = otpVerificationRepository.countByContactAndCreatedAtAfter(
                normalizedContact, LocalDateTime.now().minusHours(1));
        
        if (requestsLastHour >= maxRequestsPerHour) {
            log.warn("Rate limit exceeded for contact: {}", maskContact(normalizedContact));
            throw new RuntimeException("Too many OTP requests. Please try again later.");
        }

        // Check for resend cooldown
        Optional<OtpVerification> latestOtpOpt = otpVerificationRepository
                .findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(normalizedContact, type, purpose);

        if (latestOtpOpt.isPresent()) {
            OtpVerification latestOtp = latestOtpOpt.get();
            long secondsSinceLast = ChronoUnit.SECONDS.between(latestOtp.getCreatedAt(), LocalDateTime.now());
            if (!latestOtp.isVerified() && secondsSinceLast < resendCooldownSeconds) {
                long waitRemaining = resendCooldownSeconds - secondsSinceLast;
                throw new RuntimeException("Please wait " + waitRemaining + " seconds before requesting a new OTP.");
            }
        }

        // Invalidate previous unverified OTPs
        List<OtpVerification> oldOtps =
                otpVerificationRepository.findByContactAndTypeAndPurposeAndVerifiedFalse(normalizedContact, type, purpose);
        for (OtpVerification oldOtp : oldOtps) {
            oldOtp.setVerified(true);
        }
        otpVerificationRepository.saveAll(oldOtps);

        // Generate 6-digit OTP using SecureRandom (000000 - 999999)
        String otp = String.format("%06d", random.nextInt(1000000));

        // Hash OTP with salt (contact)
        String otpHash = hashOtp(normalizedContact, otp);

        OtpVerification otpVerification = OtpVerification.builder()
                .contact(normalizedContact)
                .otpHash(otpHash)
                .type(type)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .attempts(0)
                .verified(false)
                .build();

        otpVerificationRepository.save(otpVerification);

        // Send OTP via SmsService
        if (type == OtpVerification.OtpType.MOBILE) {
            smsService.sendOtp(normalizedContact, otp);
        } else {
            log.warn("Email OTP not yet implemented for {}", maskContact(normalizedContact));
        }

        return "OTP sent successfully";
    }

    @Transactional
    public boolean verifyOtp(String contact, String otp, OtpVerification.OtpType type, OtpVerification.OtpPurpose purpose) {
        String normalizedContact = type == OtpVerification.OtpType.MOBILE ? normalizePhone(contact) : contact;

        Optional<OtpVerification> otpOpt = otpVerificationRepository
                .findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(normalizedContact, type, purpose);

        if (otpOpt.isEmpty()) {
            throw new RuntimeException("No OTP requested for this phone number.");
        }

        OtpVerification otpVerification = otpOpt.get();

        if (otpVerification.isVerified()) {
            throw new RuntimeException("This OTP has already been used or invalidated. Please request a new OTP.");
        }

        if (otpVerification.getAttempts() >= maxAttempts) {
            otpVerification.setVerified(true);
            otpVerificationRepository.save(otpVerification);
            throw new RuntimeException("Too many incorrect attempts. Please request a new OTP.");
        }

        otpVerification.setAttempts(otpVerification.getAttempts() + 1);

        if (LocalDateTime.now().isAfter(otpVerification.getExpiresAt())) {
            otpVerification.setVerified(true);
            otpVerificationRepository.save(otpVerification);
            throw new RuntimeException("This OTP has expired. Please request a new OTP.");
        }

        String computedHash = hashOtp(normalizedContact, otp);
        if (!computedHash.equals(otpVerification.getOtpHash())) {
            if (otpVerification.getAttempts() >= maxAttempts) {
                otpVerification.setVerified(true);
                otpVerificationRepository.save(otpVerification);
                throw new RuntimeException("Too many incorrect attempts. Please request a new OTP.");
            }
            otpVerificationRepository.save(otpVerification);
            throw new RuntimeException("Incorrect OTP. Please try again.");
        }

        // Successfully verified
        otpVerification.setVerified(true);
        otpVerificationRepository.save(otpVerification);

        return true;
    }

    private String hashOtp(String contact, String otp) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String salted = contact + ":" + otp;
            byte[] hashBytes = md.digest(salted.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing OTP", e);
        }
    }

    private String maskContact(String contact) {
        if (contact == null) return "";
        if (contact.length() > 4) {
            return "******" + contact.substring(contact.length() - 4);
        }
        return "******";
    }
}
