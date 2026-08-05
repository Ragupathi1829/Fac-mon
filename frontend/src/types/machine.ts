export type MachineStatus = 'RUNNING' | 'IDLE' | 'STOPPED' | 'ERROR';

export interface Machine {
  id: number;
  machineCode: string;
  name: string;
  type: string;
  status: MachineStatus;
  location: string;
}

export interface TelemetryLog {
  id: number;
  machineId: number;
  machineCode: string;
  machineName: string;
  temperature: number;
  vibration: number;
  pressure: number;
  powerConsumption: number;
  timestamp: string;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: number;
  machineId: number;
  machineCode: string;
  machineName: string;
  message: string;
  severity: AlertSeverity;
  resolved: boolean;
  timestamp: string;
  resolvedAt?: string;
}

export interface KpiData {
  totalMachines: number;
  runningMachines: number;
  idleMachines: number;
  stoppedMachines: number;
  errorMachines: number;
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  oeePercent: number;
}

export interface AlertCounts {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

// WebSocket message types dispatched by the backend simulator
export type WsMessageType = 'TELEMETRY' | 'ALERT' | 'STATUS_SUMMARY';

export interface WsTelemetryMessage extends TelemetryLog {
  type: 'TELEMETRY';
  status: MachineStatus;
}

export interface WsAlertMessage extends Alert {
  type: 'ALERT';
}

export interface WsStatusSummary {
  type: 'STATUS_SUMMARY';
  timestamp: string;
  total: number;
  running: number;
  idle: number;
  stopped: number;
  error: number;
  activeAlerts: number;
}

export type WsMessage = WsTelemetryMessage | WsAlertMessage | WsStatusSummary;

export type UserRole = 'FACTORY_OWNER' | 'PRODUCTION_MANAGER' | 'MAINTENANCE_ENGINEER' | 'MACHINE_OPERATOR' | 'QUALITY_INSPECTOR' | 'ADMIN';

export interface EnrichedTelemetryLog extends TelemetryLog {
  voltage: number;
  current: number;
  rpm: number;
  humidity: number;
  oilLevel: number;
  noise: number;
  motorLoad: number;
  productionSpeed: number;
  healthScore: number;
  aiRecommendation?: string;
  predictedFailureProb?: number;
  predictedFailureTime?: number;
}

export interface Worker {
  id: number;
  name: string;
  avatar: string;
  assignedMachineId?: number;
  assignedMachineName?: string;
  role: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  attendance: 'PRESENT' | 'ABSENT';
  safetyTraining: boolean;
  performanceScore: number;
}

export interface InventoryItem {
  id: number;
  partName: string;
  partNumber: string;
  stockLevel: number;
  minRequired: number;
  unit: string;
  cost: number;
  supplier: string;
}

export interface MaintenanceRecord {
  id: number;
  machineId: number;
  machineName: string;
  scheduledDate: string;
  engineerName: string;
  cost: number;
  sparePartsUsed: string[];
  notes: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'AI_RECOMMENDED';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface FactoryDoc {
  id: number;
  title: string;
  category: 'MANUAL' | 'SAFETY' | 'REPORT' | 'INVOICE';
  fileSize: string;
  uploadedDate: string;
  machineId?: number;
}

