package com.factory.monitoring.service;

import com.factory.monitoring.dto.TelemetryLogDto;

import java.util.List;

public interface TelemetryService {

    /**
     * Save a new telemetry reading for a machine.
     */
    TelemetryLogDto saveTelemetry(TelemetryLogDto dto);

    /**
     * Get the most recent N telemetry logs for a given machine.
     */
    List<TelemetryLogDto> getLatestByMachine(Long machineId, int limit);

    /**
     * Get all recent telemetry across all machines (for dashboard feed).
     */
    List<TelemetryLogDto> getRecentAll(int limit);

    /**
     * Get the single latest telemetry snapshot for a machine.
     */
    TelemetryLogDto getLatestSnapshot(Long machineId);
}
