package com.factory.monitoring.service;

import com.factory.monitoring.dto.MachineDto;
import java.util.List;

public interface MachineService {
    List<MachineDto> getAllMachines();
    MachineDto getMachineById(Long id);
    MachineDto createMachine(MachineDto machineDto);
    MachineDto updateMachine(Long id, MachineDto machineDto);
    MachineDto updateMachineStatus(Long id, String status);
    void deleteMachine(Long id);
}
