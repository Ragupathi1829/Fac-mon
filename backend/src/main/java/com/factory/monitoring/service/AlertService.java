package com.factory.monitoring.service;

import com.factory.monitoring.dto.AlertDto;

import java.util.List;

public interface AlertService {

    /**
     * Create a new alert for a given machine.
     */
    AlertDto createAlert(AlertDto dto);

    /**
     * Retrieve all unresolved alerts ordered by timestamp descending.
     */
    List<AlertDto> getActiveAlerts();

    /**
     * Retrieve recent alerts (resolved and unresolved), limited by count.
     */
    List<AlertDto> getRecentAlerts(int limit);

    /**
     * Get all alerts for a specific machine.
     */
    List<AlertDto> getAlertsByMachine(Long machineId);

    /**
     * Mark a specific alert as resolved.
     */
    AlertDto resolveAlert(Long alertId);

    /**
     * Count of currently unresolved alerts (used by KPI panel).
     */
    long countActiveAlerts();

    long countTotalAlerts();

    /**
     * Count unresolved alerts by severity level.
     */
    long countActiveAlertsBySeverity(String severity);
}
