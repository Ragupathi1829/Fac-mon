package com.factory.monitoring.controller;

import com.factory.monitoring.repository.AlertRepository;
import com.factory.monitoring.repository.MachineRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final MachineRepository machineRepository;
    private final AlertRepository alertRepository;

    public DashboardController(MachineRepository machineRepository,
                               AlertRepository alertRepository) {
        this.machineRepository = machineRepository;
        this.alertRepository = alertRepository;
    }

    /**
     * GET /api/dashboard/kpi
     * Returns all KPI metrics needed by the dashboard in a single call.
     */
    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getKpiSummary() {
        long totalMachines   = machineRepository.count();
        long runningMachines = machineRepository.findAll().stream()
                .filter(m -> "RUNNING".equalsIgnoreCase(m.getStatus()))
                .count();
        long idleMachines    = machineRepository.findAll().stream()
                .filter(m -> "IDLE".equalsIgnoreCase(m.getStatus()))
                .count();
        long stoppedMachines = machineRepository.findAll().stream()
                .filter(m -> "STOPPED".equalsIgnoreCase(m.getStatus()))
                .count();
        long errorMachines   = machineRepository.findAll().stream()
                .filter(m -> "ERROR".equalsIgnoreCase(m.getStatus()))
                .count();

        long activeAlerts   = alertRepository.countByResolvedFalse();
        long criticalAlerts = alertRepository.countByResolvedFalseAndSeverity("CRITICAL");
        long warningAlerts  = alertRepository.countByResolvedFalseAndSeverity("WARNING");

        // Simple OEE approximation: running machines / total machines
        double oee = totalMachines > 0
                ? Math.round((runningMachines * 100.0 / totalMachines) * 10.0) / 10.0
                : 0.0;

        Map<String, Object> kpi = Map.of(
                "totalMachines",   totalMachines,
                "runningMachines", runningMachines,
                "idleMachines",    idleMachines,
                "stoppedMachines", stoppedMachines,
                "errorMachines",   errorMachines,
                "activeAlerts",    activeAlerts,
                "criticalAlerts",  criticalAlerts,
                "warningAlerts",   warningAlerts,
                "oeePercent",      oee
        );

        return ResponseEntity.ok(kpi);
    }
}
