package com.factory.monitoring.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TwilioSmsService implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsService.class);

    @Value("${otp.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone-number:}")
    private String twilioPhoneNumber;

    @PostConstruct
    public void initTwilio() {
        if (smsEnabled) {
            if (twilioAccountSid == null || twilioAccountSid.trim().isEmpty() ||
                twilioAuthToken == null || twilioAuthToken.trim().isEmpty() ||
                twilioPhoneNumber == null || twilioPhoneNumber.trim().isEmpty()) {
                log.error("❌ Twilio SMS is enabled but credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER) are missing!");
            } else {
                Twilio.init(twilioAccountSid, twilioAuthToken);
                log.info("✅ Twilio SMS provider initialized successfully for real production OTP delivery.");
            }
        } else {
            log.info("ℹ️ Twilio SMS disabled (otp.sms.enabled=false). Running in LOCAL DEV mode — OTPs will be output to logs for testing.");
        }
    }

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        String maskedPhone = phoneNumber.length() >= 4 
                ? "******" + phoneNumber.substring(phoneNumber.length() - 4) 
                : "******";

        if (smsEnabled) {
            try {
                String smsBody = "Your Factory Monitoring verification code is " + otp + ". This code expires in 5 minutes. Do not share this code with anyone.";
                Message message = Message.creator(
                        new PhoneNumber(phoneNumber),
                        new PhoneNumber(twilioPhoneNumber),
                        smsBody
                ).create();
                log.info("✅ OTP SMS dispatched via Twilio to {} (SID: {})", maskedPhone, message.getSid());
            } catch (Exception e) {
                log.error("❌ Failed to send SMS via Twilio to {}: {}", maskedPhone, e.getMessage());
                throw new RuntimeException("SMS delivery failed. Please check your SMS provider configuration or try again.");
            }
        } else {
            log.info("====================================");
            log.info("     [DEV ONLY] OTP GENERATED       ");
            log.info("Contact : {}", phoneNumber);
            log.info("OTP     : {}", otp);
            log.info("Expires : 5 minutes");
            log.info("====================================");
        }
    }
}

