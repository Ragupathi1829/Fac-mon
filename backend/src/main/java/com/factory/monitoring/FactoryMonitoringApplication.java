package com.factory.monitoring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FactoryMonitoringApplication {
    public static void main(String[] args) {
        SpringApplication.run(FactoryMonitoringApplication.class, args);
    }
}
