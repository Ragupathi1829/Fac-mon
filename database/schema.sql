-- Factory Monitoring System — Complete Database Schema
-- Run once to initialize. JPA ddl-auto: update handles incremental changes.

CREATE DATABASE IF NOT EXISTS factory_monitoring;
USE factory_monitoring;

-- ─── 1. Machines ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machines (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY,
    machine_code VARCHAR(50)  NOT NULL UNIQUE,
    name         VARCHAR(100) NOT NULL,
    type         VARCHAR(50)  NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'IDLE',
    location     VARCHAR(100),
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_machine_code (machine_code),
    INDEX idx_machine_status (status)
);

-- ─── 2. Telemetry Logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id                BIGINT    AUTO_INCREMENT PRIMARY KEY,
    machine_id        BIGINT    NOT NULL,
    temperature       DOUBLE    NOT NULL,
    vibration         DOUBLE    NOT NULL,
    pressure          DOUBLE    NOT NULL,
    power_consumption DOUBLE    NOT NULL,
    timestamp         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
    INDEX idx_telemetry_machine_id (machine_id),
    INDEX idx_telemetry_timestamp  (timestamp)
);

-- ─── 3. Alerts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    machine_id  BIGINT       NOT NULL,
    message     VARCHAR(255) NOT NULL,
    severity    VARCHAR(20)  NOT NULL,   -- INFO | WARNING | CRITICAL
    resolved    BOOLEAN      NOT NULL DEFAULT FALSE,
    timestamp   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP    NULL,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
    INDEX idx_alert_machine_id (machine_id),
    INDEX idx_alert_resolved   (resolved),
    INDEX idx_alert_severity   (severity),
    INDEX idx_alert_timestamp  (timestamp)
);
