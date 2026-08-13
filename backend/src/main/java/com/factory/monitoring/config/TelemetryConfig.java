package com.factory.monitoring.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "telemetry")
@Data
public class TelemetryConfig {

    private Simulator simulator = new Simulator();
    private Thresholds thresholds = new Thresholds();

    @Data
    public static class Simulator {
        private boolean enabled = true;
    }

    @Data
    public static class Thresholds {
        private Sensor temperature = new Sensor(75.0, 85.0);
        private Sensor vibration = new Sensor(5.0, 7.0);
        private Sensor pressure = new Sensor(8.0, 10.0);
        private Sensor power = new Sensor(80.0, 90.0);
    }

    @Data
    public static class Sensor {
        private double warning;
        private double critical;
        
        public Sensor() {}
        
        public Sensor(double warning, double critical) {
            this.warning = warning;
            this.critical = critical;
        }
    }
}
