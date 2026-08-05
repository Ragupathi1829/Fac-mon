package com.factory.monitoring.service.impl;

import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.dto.MachineDto;
import com.factory.monitoring.exception.ResourceNotFoundException;
import com.factory.monitoring.repository.MachineRepository;
import com.factory.monitoring.service.MachineService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MachineServiceImpl implements MachineService {

    private final MachineRepository machineRepository;

    public MachineServiceImpl(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }

    @Override
    public List<MachineDto> getAllMachines() {
        return machineRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public MachineDto getMachineById(Long id) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + id));
        return convertToDto(machine);
    }

    @Override
    public MachineDto createMachine(MachineDto machineDto) {
        if (machineRepository.existsByMachineCode(machineDto.getMachineCode())) {
            throw new IllegalArgumentException("Machine code '" + machineDto.getMachineCode() + "' is already in use.");
        }
        Machine machine = convertToEntity(machineDto);
        machine.setId(null); // Ensure ID is generated automatically
        Machine savedMachine = machineRepository.save(machine);
        return convertToDto(savedMachine);
    }

    @Override
    public MachineDto updateMachine(Long id, MachineDto machineDto) {
        Machine existingMachine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + id));

        // Check if machine code has changed and if the new code is already in use
        if (!existingMachine.getMachineCode().equals(machineDto.getMachineCode())) {
            if (machineRepository.existsByMachineCode(machineDto.getMachineCode())) {
                throw new IllegalArgumentException("Machine code '" + machineDto.getMachineCode() + "' is already in use.");
            }
            existingMachine.setMachineCode(machineDto.getMachineCode());
        }

        existingMachine.setName(machineDto.getName());
        existingMachine.setType(machineDto.getType());
        existingMachine.setStatus(machineDto.getStatus());
        existingMachine.setLocation(machineDto.getLocation());

        Machine updatedMachine = machineRepository.save(existingMachine);
        return convertToDto(updatedMachine);
    }

    @Override
    public MachineDto updateMachineStatus(Long id, String status) {
        Machine existingMachine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + id));

        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty");
        }
        existingMachine.setStatus(status);
        Machine updatedMachine = machineRepository.save(existingMachine);
        return convertToDto(updatedMachine);
    }

    @Override
    public void deleteMachine(Long id) {
        Machine existingMachine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + id));
        machineRepository.delete(existingMachine);
    }

    private MachineDto convertToDto(Machine machine) {
        MachineDto dto = new MachineDto();
        dto.setId(machine.getId());
        dto.setMachineCode(machine.getMachineCode());
        dto.setName(machine.getName());
        dto.setType(machine.getType());
        dto.setStatus(machine.getStatus());
        dto.setLocation(machine.getLocation());
        return dto;
    }

    private Machine convertToEntity(MachineDto dto) {
        Machine entity = new Machine();
        entity.setId(dto.getId());
        entity.setMachineCode(dto.getMachineCode());
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setStatus(dto.getStatus());
        entity.setLocation(dto.getLocation());
        return entity;
    }
}
