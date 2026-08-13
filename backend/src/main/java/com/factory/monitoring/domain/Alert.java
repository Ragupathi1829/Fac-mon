package com.factory.monitoring.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts", indexes = {
        @Index(name = "idx_alert_machine_id", columnList = "machine_id"),
        @Index(name = "idx_alert_resolved", columnList = "resolved"),
        @Index(name = "idx_alert_type", columnList = "alert_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(nullable = false, length = 20)
    private String severity; // INFO, WARNING, CRITICAL

    @Column(name = "alert_type", length = 50)
    private String alertType; // TEMPERATURE, VIBRATION, PRESSURE, POWER

    @Column(name = "actual_value")
    private Double actualValue;

    @Column(name = "threshold_value")
    private Double thresholdValue;

    @Column(name = "machine_status", length = 20)
    private String machineStatus;

    @Column(nullable = false)
    private Boolean resolved;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (resolved == null) {
            resolved = false;
        }
    }
}
