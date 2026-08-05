# Telemetry Simulation Prompts

This directory holds prompts or guidelines used to model simulated factory machines and environments.

## Machine Anomaly Generator Prompt

```
You are a simulator for a CNC milling machine.
Generate 5 minutes of telemetry data at 10-second intervals (30 values).
Introduce a spindle overheating anomaly starting at minute 3, showing temperature spiking from 45C to 95C.
The output must be JSON format with fields:
- machineId: "cnc-01"
- timestamp
- temperature (C)
- vibration (mm/s)
- pressure (bar)
- powerConsumption (kW)
```

## Production Target Metric Simulation Prompt

```
Calculate typical OEE (Overall Equipment Effectiveness) targets for a packaging machine line:
- Availability target: 92%
- Performance target: 95%
- Quality target: 99%
Show formula and expected nominal outcome metrics.
```
