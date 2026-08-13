package com.factory.monitoring.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDto {

    private Long id;
    private Long machineId;
    private String machineCode;
    private String machineName;
    private String message;
    private String severity; // INFO, WARNING, CRITICAL
    private String alertType; // TEMPERATURE, VIBRATION, PRESSURE, POWER
    private Double actualValue;
    private Double thresholdValue;
    private String machineStatus;
    private Boolean resolved;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime resolvedAt;
}
