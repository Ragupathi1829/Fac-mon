package com.factory.monitoring.service;

public interface SmsService {
    void sendOtp(String phoneNumber, String otp);
}
