package com.factory.monitoring.service;

import com.factory.monitoring.domain.OtpVerification;
import com.factory.monitoring.repository.OtpVerificationRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private final OtpVerificationRepository otpVerificationRepository;
    private final java.security.SecureRandom random = new java.security.SecureRandom();

    @Value("${twilio.enabled:false}")
    private boolean twilioEnabled;

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone-number:}")
    private String twilioPhoneNumber;

    public OtpService(OtpVerificationRepository otpVerificationRepository) {
        this.otpVerificationRepository = otpVerificationRepository;
    }

    /** Initialize Twilio SDK once on startup if enabled */
    @PostConstruct
    public void initTwilio() {
        if (twilioEnabled) {
            Twilio.init(twilioAccountSid, twilioAuthToken);
            log.info("✅ Twilio SMS initialized — real OTPs will be sent via SMS.");
        } else {
            log.info("ℹ️  Twilio disabled — OTPs will be printed to console (dev mode).");
        }
    }

    @Transactional
    public String generateAndSendOtp(String contact, OtpVerification.OtpType type) {
        // Check for 30 seconds resend cooldown
        Optional<OtpVerification> latestOtpOpt = otpVerificationRepository
                .findTopByContactAndTypeOrderByCreatedAtDesc(contact, type);

        if (latestOtpOpt.isPresent()) {
            OtpVerification latestOtp = latestOtpOpt.get();
            if (!latestOtp.isVerified() &&
                    ChronoUnit.SECONDS.between(latestOtp.getCreatedAt(), LocalDateTime.now()) < 30) {
                throw new RuntimeException("Please wait at least 30 seconds before requesting a new OTP.");
            }
        }

        // Invalidate old unverified OTPs
        java.util.List<OtpVerification> oldOtps =
                otpVerificationRepository.findByContactAndTypeAndVerifiedFalse(contact, type);
        for (OtpVerification oldOtp : oldOtps) {
            oldOtp.setVerified(true);
        }
        otpVerificationRepository.saveAll(oldOtps);

        // Generate 6-digit OTP
        String otp = String.format("%06d", random.nextInt(1000000));

        // Hash OTP with contact as salt (never store plain OTP)
        String otpHash = hashOtp(contact, otp);

        OtpVerification otpVerification = OtpVerification.builder()
                .contact(contact)
                .otpHash(otpHash)
                .type(type)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .verified(false)
                .build();

        otpVerificationRepository.save(otpVerification);

        if (twilioEnabled) {
            // ── PRODUCTION: Send real SMS via Twilio ─────────────────────────
            try {
                Message message = Message.creator(
                        new PhoneNumber(contact),
                        new PhoneNumber(twilioPhoneNumber),
                        "SmartFactory 360 — Your OTP is: " + otp + ". Valid for 5 minutes. Do not share."
                ).create();
                log.info("SMS sent to {} via Twilio. SID: {}", contact, message.getSid());
            } catch (Exception e) {
                log.error("❌ Failed to send SMS via Twilio: {}", e.getMessage());
                throw new RuntimeException("SMS delivery failed. Please try again.");
            }
        } else {
            // ── DEV MODE: Print OTP to console ───────────────────────────────
            System.out.println("====================================");
            System.out.println("        OTP DEVELOPMENT MODE        ");
            System.out.println("====================================");
            System.out.println("Type    : " + type.name());
            System.out.println("Contact : " + contact);
            System.out.println("OTP     : " + otp);
            System.out.println("Expires : 5 minutes");
            System.out.println("====================================");
        }

        return "OTP sent successfully";
    }

    @Transactional
    public boolean verifyOtp(String contact, String otp, OtpVerification.OtpType type) {
        Optional<OtpVerification> otpOpt = otpVerificationRepository
                .findTopByContactAndTypeOrderByCreatedAtDesc(contact, type);

        if (otpOpt.isEmpty()) {
            return false;
        }

        OtpVerification otpVerification = otpOpt.get();

        if (otpVerification.isVerified()) {
            return false; // already verified
        }

        if (otpVerification.getAttempts() >= 5) {
            return false; // max attempts reached
        }

        otpVerification.setAttempts(otpVerification.getAttempts() + 1);

        if (LocalDateTime.now().isAfter(otpVerification.getExpiresAt())) {
            otpVerificationRepository.save(otpVerification);
            return false; // expired
        }

        if (!hashOtp(contact, otp).equals(otpVerification.getOtpHash())) {
            otpVerificationRepository.save(otpVerification);
            return false; // invalid otp
        }

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
}
