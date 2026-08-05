package com.factory.monitoring.repository;

import com.factory.monitoring.domain.TelemetryLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TelemetryLogRepository extends JpaRepository<TelemetryLog, Long> {

    List<TelemetryLog> findByMachineIdOrderByTimestampDesc(Long machineId, Pageable pageable);

    List<TelemetryLog> findByMachineIdAndTimestampBetweenOrderByTimestampDesc(
            Long machineId,
            LocalDateTime from,
            LocalDateTime to
    );

    @Query("SELECT t FROM TelemetryLog t WHERE t.machine.id = :machineId ORDER BY t.timestamp DESC")
    List<TelemetryLog> findLatestByMachineId(@Param("machineId") Long machineId, Pageable pageable);

    @Query("SELECT t FROM TelemetryLog t ORDER BY t.timestamp DESC")
    List<TelemetryLog> findAllRecent(Pageable pageable);
}
