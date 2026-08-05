package com.factory.monitoring.repository;

import com.factory.monitoring.domain.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
    boolean existsByMachineCode(String machineCode);
    Optional<Machine> findByMachineCode(String machineCode);
}
