package com.factory.monitoring.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry_logs", indexes = {
        @Index(name = "idx_telemetry_machine_id", columnList = "machine_id"),
        @Index(name = "idx_telemetry_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(nullable = false)
    private Double temperature;

    @Column(nullable = false)
    private Double vibration;

    @Column(nullable = false)
    private Double pressure;

    @Column(name = "power_consumption", nullable = false)
    private Double powerConsumption;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
