package com.factory.monitoring.repository;

import com.factory.monitoring.domain.Alert;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByMachineIdOrderByTimestampDesc(Long machineId);

    List<Alert> findByResolvedFalseOrderByTimestampDesc();

    List<Alert> findByResolvedFalseAndSeverityOrderByTimestampDesc(String severity);

    long countByResolvedFalse();

    long countByResolvedFalseAndSeverity(String severity);

    @Query("SELECT a FROM Alert a ORDER BY a.timestamp DESC")
    List<Alert> findAllRecent(Pageable pageable);

    @Query("SELECT a FROM Alert a WHERE a.machine.id = :machineId AND a.resolved = false ORDER BY a.timestamp DESC")
    List<Alert> findActiveByMachineId(@Param("machineId") Long machineId);
}
