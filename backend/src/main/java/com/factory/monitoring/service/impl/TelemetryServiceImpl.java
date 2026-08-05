package com.factory.monitoring.service.impl;

import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.domain.TelemetryLog;
import com.factory.monitoring.dto.TelemetryLogDto;
import com.factory.monitoring.exception.ResourceNotFoundException;
import com.factory.monitoring.repository.MachineRepository;
import com.factory.monitoring.repository.TelemetryLogRepository;
import com.factory.monitoring.service.TelemetryService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TelemetryServiceImpl implements TelemetryService {

    private final TelemetryLogRepository telemetryLogRepository;
    private final MachineRepository machineRepository;

    public TelemetryServiceImpl(TelemetryLogRepository telemetryLogRepository,
                                MachineRepository machineRepository) {
        this.telemetryLogRepository = telemetryLogRepository;
        this.machineRepository = machineRepository;
    }

    @Override
    public TelemetryLogDto saveTelemetry(TelemetryLogDto dto) {
        Machine machine = machineRepository.findById(dto.getMachineId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Machine not found with id: " + dto.getMachineId()));

        TelemetryLog log = TelemetryLog.builder()
                .machine(machine)
                .temperature(dto.getTemperature())
                .vibration(dto.getVibration())
                .pressure(dto.getPressure())
                .powerConsumption(dto.getPowerConsumption())
                .timestamp(dto.getTimestamp())
                .build();

        TelemetryLog saved = telemetryLogRepository.save(log);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TelemetryLogDto> getLatestByMachine(Long machineId, int limit) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }
        return telemetryLogRepository
                .findByMachineIdOrderByTimestampDesc(machineId, PageRequest.of(0, limit))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TelemetryLogDto> getRecentAll(int limit) {
        return telemetryLogRepository
                .findAllRecent(PageRequest.of(0, limit))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TelemetryLogDto getLatestSnapshot(Long machineId) {
        List<TelemetryLog> logs = telemetryLogRepository
                .findLatestByMachineId(machineId, PageRequest.of(0, 1));
        if (logs.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No telemetry data found for machine id: " + machineId);
        }
        return toDto(logs.get(0));
    }

    // ─── Mapping Helper ──────────────────────────────────────────────────────────

    private TelemetryLogDto toDto(TelemetryLog log) {
        return TelemetryLogDto.builder()
                .id(log.getId())
                .machineId(log.getMachine().getId())
                .machineCode(log.getMachine().getMachineCode())
                .machineName(log.getMachine().getName())
                .temperature(log.getTemperature())
                .vibration(log.getVibration())
                .pressure(log.getPressure())
                .powerConsumption(log.getPowerConsumption())
                .timestamp(log.getTimestamp())
                .build();
    }
}
