package com.factory.monitoring.controller;

import com.factory.monitoring.dto.AlertDto;
import com.factory.monitoring.service.AlertService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    /**
     * POST /api/alerts
     * Create a new alert manually (also triggered internally by the simulator).
     */
    @PostMapping
    public ResponseEntity<AlertDto> createAlert(@RequestBody AlertDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertService.createAlert(dto));
    }

    /**
     * GET /api/alerts/active or /api/alerts/unresolved
     * All unresolved alerts, newest first.
     */
    @GetMapping({"/active", "/unresolved"})
    public ResponseEntity<List<AlertDto>> getActiveAlerts() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    /**
     * GET /api/alerts/recent?limit=50
     * Recent alerts regardless of resolved state (for the alert center panel).
     */
    @GetMapping("/recent")
    public ResponseEntity<List<AlertDto>> getRecentAlerts(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(alertService.getRecentAlerts(limit));
    }

    /**
     * GET /api/alerts/machine/{machineId}
     * All alerts for a specific machine.
     */
    @GetMapping("/machine/{machineId}")
    public ResponseEntity<List<AlertDto>> getAlertsByMachine(@PathVariable Long machineId) {
        return ResponseEntity.ok(alertService.getAlertsByMachine(machineId));
    }

    /**
     * PATCH /api/alerts/{id}/resolve OR PUT /api/alerts/{id}/resolve
     * Mark an alert as resolved.
     */
    @RequestMapping(value = "/{id}/resolve", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AlertDto> resolveAlert(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.resolveAlert(id));
    }

    /**
     * GET /api/alerts/stats
     * Returns alert statistics (for KPI panel).
     */
    @GetMapping({"/counts", "/stats"})
    public ResponseEntity<Map<String, Long>> getAlertStats() {
        long total = alertService.countTotalAlerts();
        long unresolved = alertService.countActiveAlerts();
        
        Map<String, Long> counts = Map.of(
                "totalAlerts", total,
                "criticalAlerts", alertService.countActiveAlertsBySeverity("CRITICAL"),
                "warningAlerts",  alertService.countActiveAlertsBySeverity("WARNING"),
                "infoAlerts",     alertService.countActiveAlertsBySeverity("INFO"),
                "unresolvedAlerts", unresolved,
                "resolvedAlerts", total - unresolved
        );
        return ResponseEntity.ok(counts);
    }
}
