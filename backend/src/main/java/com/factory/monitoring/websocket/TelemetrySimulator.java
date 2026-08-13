package com.factory.monitoring.websocket;

import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.domain.TelemetryLog;
import com.factory.monitoring.domain.Alert;
import com.factory.monitoring.config.TelemetryConfig;
import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.domain.TelemetryLog;
import com.factory.monitoring.repository.AlertRepository;
import com.factory.monitoring.repository.MachineRepository;
import com.factory.monitoring.repository.TelemetryLogRepository;
import com.factory.monitoring.service.TelemetryService;
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
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simulates real factory telemetry data and broadcasts it over WebSocket.
 * Runs every 3 seconds for all RUNNING machines.
 */
@Component
public class TelemetrySimulator {

    private static final Logger log = LoggerFactory.getLogger(TelemetrySimulator.class);

    private final TelemetryConfig        config;
    private final MachineRepository      machineRepository;
    private final TelemetryLogRepository telemetryLogRepository;
    private final AlertRepository        alertRepository;
    private final TelemetryService       telemetryService;
    private final MachineWebSocketHandler webSocketHandler;
    private final ObjectMapper           objectMapper;
    private final Random                 random = new Random();
    
    // Store baselines so machines don't jump wildly between extremes
    private final Map<Long, Map<String, Double>> machineBaselines = new ConcurrentHashMap<>();

    public TelemetrySimulator(TelemetryConfig config,
                              MachineRepository machineRepository,
                              TelemetryLogRepository telemetryLogRepository,
                              AlertRepository alertRepository,
                              TelemetryService telemetryService,
                              MachineWebSocketHandler webSocketHandler) {
        this.config = config;
        this.machineRepository      = machineRepository;
        this.telemetryLogRepository = telemetryLogRepository;
        this.alertRepository        = alertRepository;
        this.telemetryService       = telemetryService;
        this.webSocketHandler       = webSocketHandler;
        this.objectMapper           = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Every 3 seconds: generate telemetry for all RUNNING machines, persist, and broadcast.
     */
    @Scheduled(fixedRate = 3000)
    @Scheduled(fixedRate = 3000)
    public void simulateTelemetry() {
        if (!config.getSimulator().isEnabled()) {
            return;
        }
        
        List<Machine> machines = machineRepository.findAll();
        if (machines.isEmpty()) return;

        for (Machine machine : machines) {
            if (!"RUNNING".equalsIgnoreCase(machine.getStatus())) continue;

            Map<String, Double> baselines = machineBaselines.computeIfAbsent(machine.getId(), id -> generateBaselines(machine));

            // Fluctuate around baseline by ±3%
            double temperature     = fluctuate(baselines.get("temperature"), 3.0);
            double vibration       = fluctuate(baselines.get("vibration"), 3.0);
            double pressure        = fluctuate(baselines.get("pressure"), 3.0);
            double powerConsumption = fluctuate(baselines.get("power"), 3.0);

            // Periodically inject a spike to trigger an alert engine rule (1% chance per cycle per machine)
            if (random.nextDouble() < 0.01) {
                temperature += 20.0; 
            } else if (random.nextDouble() < 0.01) {
                vibration += 3.0;
            } else if (random.nextDouble() < 0.01) {
                powerConsumption += 20.0;
            }

            com.factory.monitoring.dto.TelemetryLogDto dto = com.factory.monitoring.dto.TelemetryLogDto.builder()
                    .machineId(machine.getId())
                    .temperature(round2(temperature))
                    .vibration(round2(vibration))
                    .pressure(round2(pressure))
                    .powerConsumption(round2(powerConsumption))
                    .timestamp(LocalDateTime.now())
                    .build();

            // Calling telemetryService.saveTelemetry will trigger AlertEngineService under the hood
            com.factory.monitoring.dto.TelemetryLogDto saved = telemetryService.saveTelemetry(dto);

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

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    
    private Map<String, Double> generateBaselines(Machine machine) {
        Map<String, Double> baselines = new HashMap<>();
        // Generate a normal baseline completely independently per machine
        baselines.put("temperature", randomInRange(50.0, 70.0));
        baselines.put("vibration", randomInRange(2.0, 4.0));
        baselines.put("pressure", randomInRange(5.0, 7.0));
        baselines.put("power", randomInRange(50.0, 75.0));
        return baselines;
    }
    
    private double fluctuate(double baseline, double percentageMax) {
        double diff = baseline * (percentageMax / 100.0);
        return randomInRange(baseline - diff, baseline + diff);
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
