package com.factory.monitoring.config;

import com.factory.monitoring.domain.Machine;
import com.factory.monitoring.repository.MachineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Seeds sample machine data on first startup (when the machines table is empty).
 * Only runs when the "dev" or "default" profile is active.
 */
@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner seedSampleData(MachineRepository machineRepository) {
        return args -> {
            if (machineRepository.count() > 0) {
                log.info("DataInitializer: machines table already has data — skipping seed.");
                return;
            }

            log.info("DataInitializer: seeding sample factory machines...");

            String[][] sampleData = {
                    {"MCH-001", "CNC Milling Machine #1",   "CNC",         "RUNNING", "Zone A - Bay 1"},
                    {"MCH-002", "CNC Milling Machine #2",   "CNC",         "RUNNING", "Zone A - Bay 2"},
                    {"MCH-003", "Hydraulic Press #1",        "PRESS",       "IDLE",    "Zone B - Bay 1"},
                    {"MCH-004", "Conveyor Belt Alpha",       "CONVEYOR",    "RUNNING", "Zone B - Bay 3"},
                    {"MCH-005", "Robotic Arm Welder #1",     "WELDING",     "RUNNING", "Zone C - Bay 1"},
                    {"MCH-006", "Robotic Arm Welder #2",     "WELDING",     "STOPPED", "Zone C - Bay 2"},
                    {"MCH-007", "Laser Cutter #1",           "LASER",       "RUNNING", "Zone D - Bay 1"},
                    {"MCH-008", "Industrial Lathe #1",       "LATHE",       "ERROR",   "Zone A - Bay 4"},
                    {"MCH-009", "Paint Spray Booth",         "COATING",     "IDLE",    "Zone E - Bay 1"},
                    {"MCH-010", "Assembly Station #1",       "ASSEMBLY",    "RUNNING", "Zone F - Bay 1"},
                    {"MCH-011", "Quality Inspection Camera", "INSPECTION",  "RUNNING", "Zone F - Bay 2"},
                    {"MCH-012", "Packaging Unit #1",         "PACKAGING",   "RUNNING", "Zone G - Bay 1"},
            };

            for (String[] data : sampleData) {
                Machine machine = new Machine();
                machine.setMachineCode(data[0]);
                machine.setName(data[1]);
                machine.setType(data[2]);
                machine.setStatus(data[3]);
                machine.setLocation(data[4]);
                machineRepository.save(machine);
                log.info("  Seeded machine: {} - {}", data[0], data[1]);
            }

            log.info("DataInitializer: seeding complete — {} machines registered.", sampleData.length);
        };
    }
}
