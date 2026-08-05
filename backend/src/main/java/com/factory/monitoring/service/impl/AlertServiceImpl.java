package com.factory.monitoring.service.impl;

import com.factory.monitoring.domain.Alert;
import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.dto.AlertDto;
import com.factory.monitoring.exception.ResourceNotFoundException;
import com.factory.monitoring.repository.AlertRepository;
import com.factory.monitoring.repository.MachineRepository;
import com.factory.monitoring.service.AlertService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;
    private final MachineRepository machineRepository;

    public AlertServiceImpl(AlertRepository alertRepository,
                            MachineRepository machineRepository) {
        this.alertRepository = alertRepository;
        this.machineRepository = machineRepository;
    }

    @Override
    public AlertDto createAlert(AlertDto dto) {
        Machine machine = machineRepository.findById(dto.getMachineId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Machine not found with id: " + dto.getMachineId()));

        Alert alert = Alert.builder()
                .machine(machine)
                .message(dto.getMessage())
                .severity(dto.getSeverity().toUpperCase())
                .resolved(false)
                .timestamp(LocalDateTime.now())
                .build();

        Alert saved = alertRepository.save(alert);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertDto> getActiveAlerts() {
        return alertRepository.findByResolvedFalseOrderByTimestampDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertDto> getRecentAlerts(int limit) {
        return alertRepository.findAllRecent(PageRequest.of(0, limit))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertDto> getAlertsByMachine(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }
        return alertRepository.findByMachineIdOrderByTimestampDesc(machineId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public AlertDto resolveAlert(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Alert not found with id: " + alertId));

        if (Boolean.TRUE.equals(alert.getResolved())) {
            throw new IllegalStateException("Alert " + alertId + " is already resolved.");
        }

        alert.setResolved(true);
        alert.setResolvedAt(LocalDateTime.now());
        Alert saved = alertRepository.save(alert);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveAlerts() {
        return alertRepository.countByResolvedFalse();
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveAlertsBySeverity(String severity) {
        return alertRepository.countByResolvedFalseAndSeverity(severity.toUpperCase());
    }

    // ─── Mapping Helper ──────────────────────────────────────────────────────────

    private AlertDto toDto(Alert alert) {
        return AlertDto.builder()
                .id(alert.getId())
                .machineId(alert.getMachine().getId())
                .machineCode(alert.getMachine().getMachineCode())
                .machineName(alert.getMachine().getName())
                .message(alert.getMessage())
                .severity(alert.getSeverity())
                .resolved(alert.getResolved())
                .timestamp(alert.getTimestamp())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }
}
