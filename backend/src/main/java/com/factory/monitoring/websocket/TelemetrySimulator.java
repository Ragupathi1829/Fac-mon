package com.factory.monitoring.websocket;

import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.domain.TelemetryLog;
import com.factory.monitoring.domain.Alert;
import com.factory.monitoring.dto.AlertDto;
import com.factory.monitoring.repository.AlertRepository;
import com.factory.monitoring.repository.MachineRepository;
import com.factory.monitoring.repository.TelemetryLogRepository;
import com.factory.monitoring.service.AlertService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Simulates real factory telemetry data and broadcasts it over WebSocket.
 * Runs every 3 seconds for all RUNNING machines.
 * Also auto-generates alerts when sensor values breach thresholds.
 */
@Component
public class TelemetrySimulator {

    private static final Logger log = LoggerFactory.getLogger(TelemetrySimulator.class);

    // Thresholds for auto-alert generation
    private static final double TEMP_CRITICAL   = 90.0;
    private static final double TEMP_WARNING    = 75.0;
    private static final double VIB_CRITICAL    = 8.5;
    private static final double VIB_WARNING     = 6.0;
    private static final double PRESSURE_CRITICAL = 9.5;
    private static final double PRESSURE_WARNING  = 8.0;
    private static final double POWER_CRITICAL  = 95.0;

    private final MachineRepository      machineRepository;
    private final TelemetryLogRepository telemetryLogRepository;
    private final AlertRepository        alertRepository;
    private final AlertService           alertService;
    private final MachineWebSocketHandler webSocketHandler;
    private final ObjectMapper           objectMapper;
    private final Random                 random = new Random();

    public TelemetrySimulator(MachineRepository machineRepository,
                              TelemetryLogRepository telemetryLogRepository,
                              AlertRepository alertRepository,
                              AlertService alertService,
                              MachineWebSocketHandler webSocketHandler) {
        this.machineRepository      = machineRepository;
        this.telemetryLogRepository = telemetryLogRepository;
        this.alertRepository        = alertRepository;
        this.alertService           = alertService;
        this.webSocketHandler       = webSocketHandler;
        this.objectMapper           = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Every 3 seconds: generate telemetry for all RUNNING machines, persist, and broadcast.
     */
    @Scheduled(fixedRate = 3000)
    @Transactional
    public void simulateTelemetry() {
        List<Machine> machines = machineRepository.findAll();
        if (machines.isEmpty()) return;

        for (Machine machine : machines) {
            if (!"RUNNING".equalsIgnoreCase(machine.getStatus())) continue;

            // Generate sensor readings
            double temperature     = randomInRange(55.0, 95.0);
            double vibration       = randomInRange(1.0, 10.0);
            double pressure        = randomInRange(4.0, 10.5);
            double powerConsumption = randomInRange(40.0, 100.0);

            // Persist telemetry
            TelemetryLog telemetryLog = TelemetryLog.builder()
                    .machine(machine)
                    .temperature(round2(temperature))
                    .vibration(round2(vibration))
                    .pressure(round2(pressure))
                    .powerConsumption(round2(powerConsumption))
                    .timestamp(LocalDateTime.now())
                    .build();
            TelemetryLog saved = telemetryLogRepository.save(telemetryLog);

            // Build WebSocket payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "TELEMETRY");
            payload.put("machineId", machine.getId());
            payload.put("machineCode", machine.getMachineCode());
            payload.put("machineName", machine.getName());
            payload.put("temperature", saved.getTemperature());
            payload.put("vibration", saved.getVibration());
            payload.put("pressure", saved.getPressure());
            payload.put("powerConsumption", saved.getPowerConsumption());
            payload.put("timestamp", saved.getTimestamp().toString());
            payload.put("status", machine.getStatus());

            broadcastJson(payload);

            // Check thresholds and auto-create alerts
            checkAndCreateAlert(machine, "temperature", temperature,
                    TEMP_CRITICAL, TEMP_WARNING, "°C");
            checkAndCreateAlert(machine, "vibration", vibration,
                    VIB_CRITICAL, VIB_WARNING, " mm/s");
            checkAndCreateAlert(machine, "pressure", pressure,
                    PRESSURE_CRITICAL, PRESSURE_WARNING, " bar");
            if (powerConsumption >= POWER_CRITICAL) {
                createAlertAndBroadcast(machine, "CRITICAL",
                        String.format("Power consumption critical: %.1f kW on %s",
                                powerConsumption, machine.getName()));
            }
        }
    }

    /**
     * Every 30 seconds: broadcast a machine status summary to all clients.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional(readOnly = true)
    public void broadcastStatusSummary() {
        List<Machine> machines = machineRepository.findAll();
        if (machines.isEmpty()) return;

        Map<String, Object> summary = new HashMap<>();
        summary.put("type", "STATUS_SUMMARY");
        summary.put("timestamp", LocalDateTime.now().toString());
        summary.put("total",   machines.size());
        summary.put("running", machines.stream().filter(m -> "RUNNING".equalsIgnoreCase(m.getStatus())).count());
        summary.put("idle",    machines.stream().filter(m -> "IDLE".equalsIgnoreCase(m.getStatus())).count());
        summary.put("stopped", machines.stream().filter(m -> "STOPPED".equalsIgnoreCase(m.getStatus())).count());
        summary.put("error",   machines.stream().filter(m -> "ERROR".equalsIgnoreCase(m.getStatus())).count());
        summary.put("activeAlerts", alertRepository.countByResolvedFalse());

        broadcastJson(summary);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private void checkAndCreateAlert(Machine machine, String sensor, double value,
                                     double criticalThreshold, double warningThreshold,
                                     String unit) {
        if (value >= criticalThreshold) {
            createAlertAndBroadcast(machine, "CRITICAL",
                    String.format("%s CRITICAL on %s: %.2f%s",
                            capitalize(sensor), machine.getName(), value, unit));
        } else if (value >= warningThreshold) {
            // Only fire warning alerts probabilistically to avoid flooding
            if (random.nextDouble() < 0.15) {
                createAlertAndBroadcast(machine, "WARNING",
                        String.format("%s warning on %s: %.2f%s",
                                capitalize(sensor), machine.getName(), value, unit));
            }
        }
    }

    private void createAlertAndBroadcast(Machine machine, String severity, String message) {
        try {
            AlertDto dto = AlertDto.builder()
                    .machineId(machine.getId())
                    .message(message)
                    .severity(severity)
                    .build();
            AlertDto created = alertService.createAlert(dto);

            Map<String, Object> alertPayload = new HashMap<>();
            alertPayload.put("type", "ALERT");
            alertPayload.put("id", created.getId());
            alertPayload.put("machineId", created.getMachineId());
            alertPayload.put("machineCode", created.getMachineCode());
            alertPayload.put("machineName", created.getMachineName());
            alertPayload.put("message", created.getMessage());
            alertPayload.put("severity", created.getSeverity());
            alertPayload.put("resolved", created.getResolved());
            alertPayload.put("timestamp", created.getTimestamp().toString());

            broadcastJson(alertPayload);
        } catch (Exception e) {
            log.error("Failed to create/broadcast alert: {}", e.getMessage());
        }
    }

    private void broadcastJson(Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            webSocketHandler.broadcast(json);
        } catch (Exception e) {
            log.error("Failed to serialize/broadcast telemetry: {}", e.getMessage());
        }
    }

    private double randomInRange(double min, double max) {
        return min + (max - min) * random.nextDouble();
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
