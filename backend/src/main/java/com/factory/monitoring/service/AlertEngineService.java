package com.factory.monitoring.service;

import com.factory.monitoring.config.TelemetryConfig;
import com.factory.monitoring.domain.Alert;
import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.domain.TelemetryLog;
import com.factory.monitoring.dto.AlertDto;
import com.factory.monitoring.repository.AlertRepository;
import com.factory.monitoring.websocket.MachineWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AlertEngineService {

    private static final Logger log = LoggerFactory.getLogger(AlertEngineService.class);

    private final TelemetryConfig config;
    private final AlertRepository alertRepository;
    private final AlertService alertService;
    private final MachineWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    public AlertEngineService(TelemetryConfig config,
                              AlertRepository alertRepository,
                              AlertService alertService,
                              MachineWebSocketHandler webSocketHandler) {
        this.config = config;
        this.alertRepository = alertRepository;
        this.alertService = alertService;
        this.webSocketHandler = webSocketHandler;
        
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public void evaluateTelemetry(TelemetryLog log) {
        Machine m = log.getMachine();
        
        evaluateSensor(m, "TEMPERATURE", log.getTemperature(), 
                config.getThresholds().getTemperature().getWarning(), 
                config.getThresholds().getTemperature().getCritical(), "°C");
                
        evaluateSensor(m, "VIBRATION", log.getVibration(), 
                config.getThresholds().getVibration().getWarning(), 
                config.getThresholds().getVibration().getCritical(), " mm/s");
                
        evaluateSensor(m, "PRESSURE", log.getPressure(), 
                config.getThresholds().getPressure().getWarning(), 
                config.getThresholds().getPressure().getCritical(), " bar");
                
        evaluateSensor(m, "POWER", log.getPowerConsumption(), 
                config.getThresholds().getPower().getWarning(), 
                config.getThresholds().getPower().getCritical(), " kW");
    }

    private void evaluateSensor(Machine machine, String alertType, double actualValue, 
                                double warningThreshold, double criticalThreshold, String unit) {
        
        List<Alert> activeAlerts = alertRepository.findActiveByMachineIdAndAlertType(machine.getId(), alertType);
        Alert activeAlert = activeAlerts.isEmpty() ? null : activeAlerts.get(0);
        
        String newSeverity = null;
        if (actualValue >= criticalThreshold) {
            newSeverity = "CRITICAL";
        } else if (actualValue >= warningThreshold) {
            newSeverity = "WARNING";
        }
        
        // Scenario 1: Normal condition, but we have an active alert -> Resolve it
        if (newSeverity == null && activeAlert != null) {
            resolveIncident(activeAlert, actualValue);
            return;
        }
        
        // Scenario 2: Abnormal condition, and no active alert -> Create a new one
        if (newSeverity != null && activeAlert == null) {
            createIncident(machine, alertType, actualValue, newSeverity, 
                    newSeverity.equals("CRITICAL") ? criticalThreshold : warningThreshold, unit);
            return;
        }
        
        // Scenario 3: Abnormal condition, AND active alert exists -> check if severity worsened
        if (newSeverity != null && activeAlert != null) {
            // Update actual value tracker
            activeAlert.setActualValue(actualValue);
            activeAlert.setMachineStatus(machine.getStatus());
            
            // If it escalated from WARNING to CRITICAL
            if ("CRITICAL".equals(newSeverity) && "WARNING".equals(activeAlert.getSeverity())) {
                activeAlert.setSeverity("CRITICAL");
                activeAlert.setMessage(formatMessage(alertType, machine.getName(), newSeverity, actualValue, unit));
                activeAlert.setThresholdValue(criticalThreshold);
                alertRepository.save(activeAlert);
                broadcastAlert(activeAlert);
            } else {
                // Just save the updated value silently without spamming notifications
                alertRepository.save(activeAlert);
            }
        }
    }

    private void createIncident(Machine machine, String alertType, double actualValue, 
                                String severity, double thresholdValue, String unit) {
        Alert alert = Alert.builder()
                .machine(machine)
                .alertType(alertType)
                .severity(severity)
                .actualValue(actualValue)
                .thresholdValue(thresholdValue)
                .machineStatus(machine.getStatus())
                .message(formatMessage(alertType, machine.getName(), severity, actualValue, unit))
                .resolved(false)
                .timestamp(LocalDateTime.now())
                .build();
                
        Alert saved = alertRepository.save(alert);
        broadcastAlert(saved);
    }
    
    private void resolveIncident(Alert alert, double finalValue) {
        alert.setResolved(true);
        alert.setResolvedAt(LocalDateTime.now());
        alert.setActualValue(finalValue);
        Alert saved = alertRepository.save(alert);
        
        // Broadcast resolution
        broadcastAlert(saved);
    }
    
    private String formatMessage(String alertType, String machineName, String severity, double value, String unit) {
        String capitalizedType = alertType.substring(0, 1).toUpperCase() + alertType.substring(1).toLowerCase();
        return String.format("%s %s on %s: %.2f%s", capitalizedType, severity, machineName, value, unit);
    }

    private void broadcastAlert(Alert alert) {
        try {
            Map<String, Object> alertPayload = new HashMap<>();
            alertPayload.put("type", "ALERT");
            alertPayload.put("id", alert.getId());
            alertPayload.put("machineId", alert.getMachine().getId());
            alertPayload.put("machineCode", alert.getMachine().getMachineCode());
            alertPayload.put("machineName", alert.getMachine().getName());
            alertPayload.put("message", alert.getMessage());
            alertPayload.put("severity", alert.getSeverity());
            alertPayload.put("alertType", alert.getAlertType());
            alertPayload.put("resolved", alert.getResolved());
            alertPayload.put("timestamp", alert.getTimestamp().toString());
            if (alert.getResolvedAt() != null) {
                alertPayload.put("resolvedAt", alert.getResolvedAt().toString());
            }

            String json = objectMapper.writeValueAsString(alertPayload);
            webSocketHandler.broadcast(json);
        } catch (Exception e) {
            log.error("Failed to broadcast alert: {}", e.getMessage());
        }
    }
}
