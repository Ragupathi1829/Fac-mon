package com.factory.monitoring;

import com.factory.monitoring.domain.OtpVerification;
import com.factory.monitoring.repository.OtpVerificationRepository;
import com.factory.monitoring.service.OtpService;
import com.factory.monitoring.service.SmsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpVerificationRepository otpVerificationRepository;

    @Mock
    private SmsService smsService;

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService(otpVerificationRepository, smsService);
        ReflectionTestUtils.setField(otpService, "expirationMinutes", 5);
        ReflectionTestUtils.setField(otpService, "maxAttempts", 5);
        ReflectionTestUtils.setField(otpService, "resendCooldownSeconds", 60);
        ReflectionTestUtils.setField(otpService, "maxRequestsPerHour", 5);
    }

    @Test
    @DisplayName("1. Valid Indian phone number formats are normalized to +91XXXXXXXXXX")
    void testValidPhoneNormalization() {
        assertEquals("+919876543210", otpService.normalizePhone("9876543210"));
        assertEquals("+919876543210", otpService.normalizePhone("+919876543210"));
        assertEquals("+919876543210", otpService.normalizePhone("919876543210"));
        assertEquals("+919876543210", otpService.normalizePhone("09876543210"));
        assertEquals("+919876543210", otpService.normalizePhone("+91 98765 43210"));
    }

    @Test
    @DisplayName("2. Invalid phone numbers are rejected")
    void testInvalidPhoneRejection() {
        assertThrows(IllegalArgumentException.class, () -> otpService.normalizePhone(null));
        assertThrows(IllegalArgumentException.class, () -> otpService.normalizePhone(""));
        assertThrows(IllegalArgumentException.class, () -> otpService.normalizePhone("12345"));
        assertThrows(IllegalArgumentException.class, () -> otpService.normalizePhone("1234567890")); // Starts with 1 (Indian mobile starts with 6-9)
    }

    @Test
    @DisplayName("3. Send OTP generates 6-digit code and dispatches via SmsService")
    void testSendOtpSuccess() {
        when(otpVerificationRepository.countByContactAndCreatedAtAfter(any(), any())).thenReturn(0);
        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(otpVerificationRepository.findByContactAndTypeAndPurposeAndVerifiedFalse(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        String result = otpService.generateAndSendOtp("9876543210", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN);

        assertEquals("OTP sent successfully", result);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(smsService, times(1)).sendOtp(eq("+919876543210"), otpCaptor.capture());
        String generatedOtp = otpCaptor.getValue();
        assertNotNull(generatedOtp);
        assertEquals(6, generatedOtp.length());
        assertTrue(generatedOtp.matches("\\d{6}"));

        verify(otpVerificationRepository, times(1)).save(any(OtpVerification.class));
    }

    @Test
    @DisplayName("4. Rate limiting: More than 5 requests per hour throws exception")
    void testRateLimiting() {
        when(otpVerificationRepository.countByContactAndCreatedAtAfter(eq("+919876543210"), any()))
                .thenReturn(5);

        Exception ex = assertThrows(RuntimeException.class, () ->
                otpService.generateAndSendOtp("9876543210", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN));

        assertTrue(ex.getMessage().contains("Too many OTP requests"));
        verify(smsService, never()).sendOtp(any(), any());
    }

    @Test
    @DisplayName("5. Resend Cooldown: Requesting within 60s throws cooldown exception")
    void testResendCooldown() {
        when(otpVerificationRepository.countByContactAndCreatedAtAfter(any(), any())).thenReturn(1);
        OtpVerification recentOtp = OtpVerification.builder()
                .contact("+919876543210")
                .createdAt(LocalDateTime.now().minusSeconds(20))
                .verified(false)
                .build();
        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.of(recentOtp));

        Exception ex = assertThrows(RuntimeException.class, () ->
                otpService.generateAndSendOtp("9876543210", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN));

        assertTrue(ex.getMessage().contains("Please wait"));
        verify(smsService, never()).sendOtp(any(), any());
    }

    @Test
    @DisplayName("6. Verify correct OTP succeeds and marks OTP as verified")
    void testVerifyCorrectOtp() {
        // Generate an OTP first to get the real hash
        when(otpVerificationRepository.countByContactAndCreatedAtAfter(any(), any())).thenReturn(0);
        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.empty());

        ArgumentCaptor<OtpVerification> entityCaptor = ArgumentCaptor.forClass(OtpVerification.class);
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);

        otpService.generateAndSendOtp("9876543210", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN);
        verify(otpVerificationRepository).save(entityCaptor.capture());
        verify(smsService).sendOtp(any(), codeCaptor.capture());

        OtpVerification savedOtp = entityCaptor.getValue();
        String generatedCode = codeCaptor.getValue();

        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.of(savedOtp));

        boolean verified = otpService.verifyOtp("9876543210", generatedCode, OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN);
        assertTrue(verified);
        assertTrue(savedOtp.isVerified());
    }

    @Test
    @DisplayName("7. Verify incorrect OTP fails and increments attempt count")
    void testVerifyIncorrectOtp() {
        OtpVerification otp = OtpVerification.builder()
                .contact("+919876543210")
                .otpHash("dummyhash")
                .type(OtpVerification.OtpType.MOBILE)
                .purpose(OtpVerification.OtpPurpose.LOGIN)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.of(otp));

        Exception ex = assertThrows(RuntimeException.class, () ->
                otpService.verifyOtp("9876543210", "999999", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN));

        assertTrue(ex.getMessage().contains("Incorrect OTP"));
        assertEquals(1, otp.getAttempts());
    }

    @Test
    @DisplayName("8. Expired OTP is rejected")
    void testExpiredOtp() {
        OtpVerification otp = OtpVerification.builder()
                .contact("+919876543210")
                .otpHash("dummyhash")
                .type(OtpVerification.OtpType.MOBILE)
                .purpose(OtpVerification.OtpPurpose.LOGIN)
                .expiresAt(LocalDateTime.now().minusMinutes(1)) // Expired
                .attempts(0)
                .verified(false)
                .createdAt(LocalDateTime.now().minusMinutes(6))
                .build();

        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.of(otp));

        Exception ex = assertThrows(RuntimeException.class, () ->
                otpService.verifyOtp("9876543210", "123456", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN));

        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("9. 5 failed attempts invalidates OTP")
    void testMaxAttemptsReached() {
        OtpVerification otp = OtpVerification.builder()
                .contact("+919876543210")
                .otpHash("dummyhash")
                .type(OtpVerification.OtpType.MOBILE)
                .purpose(OtpVerification.OtpPurpose.LOGIN)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(5) // Max reached
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.of(otp));

        Exception ex = assertThrows(RuntimeException.class, () ->
                otpService.verifyOtp("9876543210", "123456", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN));

        assertTrue(ex.getMessage().contains("Too many incorrect attempts"));
    }

    @Test
    @DisplayName("10. Prevent OTP reuse after verification")
    void testOtpReusePrevented() {
        OtpVerification otp = OtpVerification.builder()
                .contact("+919876543210")
                .otpHash("dummyhash")
                .type(OtpVerification.OtpType.MOBILE)
                .purpose(OtpVerification.OtpPurpose.LOGIN)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(1)
                .verified(true) // Already verified
                .createdAt(LocalDateTime.now())
                .build();

        when(otpVerificationRepository.findTopByContactAndTypeAndPurposeOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.of(otp));

        Exception ex = assertThrows(RuntimeException.class, () ->
                otpService.verifyOtp("9876543210", "123456", OtpVerification.OtpType.MOBILE, OtpVerification.OtpPurpose.LOGIN));

        assertTrue(ex.getMessage().contains("already been used") || ex.getMessage().contains("invalidated"));
    }
}
