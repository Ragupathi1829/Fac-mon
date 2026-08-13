package com.factory.monitoring.service;

import com.factory.monitoring.domain.Alert;
import com.factory.monitoring.repository.AlertRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MachineHealthService {

    private final AlertRepository alertRepository;

    public MachineHealthService(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public int calculateHealthScore(Long machineId, String status) {
        if ("ERROR".equalsIgnoreCase(status)) {
            return 0; // Absolute zero for error state
        }
        
        int score = 100;
        
        if ("STOPPED".equalsIgnoreCase(status)) {
            score -= 30;
        }
        
        List<Alert> activeAlerts = alertRepository.findActiveByMachineId(machineId);
        
        for (Alert alert : activeAlerts) {
            if ("CRITICAL".equalsIgnoreCase(alert.getSeverity())) {
                score -= 20;
            } else if ("WARNING".equalsIgnoreCase(alert.getSeverity())) {
                score -= 10;
            }
        }
        
        return Math.max(0, score);
    }
}
