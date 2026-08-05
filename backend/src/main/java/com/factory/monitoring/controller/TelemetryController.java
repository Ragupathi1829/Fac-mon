package com.factory.monitoring.controller;

import com.factory.monitoring.dto.TelemetryLogDto;
import com.factory.monitoring.service.TelemetryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins = "*")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * POST /api/telemetry
     * Ingest a new telemetry reading (also used by the simulator via service layer).
     */
    @PostMapping
    public ResponseEntity<TelemetryLogDto> ingestTelemetry(
            @Valid @RequestBody TelemetryLogDto dto) {
        TelemetryLogDto saved = telemetryService.saveTelemetry(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/telemetry/machine/{machineId}?limit=50
     * Get recent telemetry history for a specific machine (for charts).
     */
    @GetMapping("/machine/{machineId}")
    public ResponseEntity<List<TelemetryLogDto>> getByMachine(
            @PathVariable Long machineId,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(telemetryService.getLatestByMachine(machineId, limit));
    }

    /**
     * GET /api/telemetry/machine/{machineId}/latest
     * Get only the most recent telemetry snapshot for a machine.
     */
    @GetMapping("/machine/{machineId}/latest")
    public ResponseEntity<TelemetryLogDto> getLatestSnapshot(@PathVariable Long machineId) {
        return ResponseEntity.ok(telemetryService.getLatestSnapshot(machineId));
    }

    /**
     * GET /api/telemetry/recent?limit=20
     * Get recent telemetry across all machines (for the dashboard live feed).
     */
    @GetMapping("/recent")
    public ResponseEntity<List<TelemetryLogDto>> getRecentAll(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(telemetryService.getRecentAll(limit));
    }
}
