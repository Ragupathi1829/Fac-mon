import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Machine, Alert, KpiData, TelemetryLog, WsMessage, UserRole, EnrichedTelemetryLog, Worker, InventoryItem, MaintenanceRecord, FactoryDoc } from '../types/machine';
import toast from 'react-hot-toast';

// ─── State Shape ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  shift: string;
  factoryLocation: string;
  profileImage?: string;
  phone?: string;
  alternateEmail?: string;
  address?: string;
  emergencyContact?: string;
  timezone?: string;
}

interface AppState {
  machines: Machine[];
  alerts: Alert[];
  kpi: KpiData | null;
  latestTelemetry: Record<number, EnrichedTelemetryLog>;
  telemetryHistory: Record<number, EnrichedTelemetryLog[]>;
  isConnected: boolean;
  machinesLoading: boolean;
  alertsLoading: boolean;
  kpiLoading: boolean;
  
  // SmartFactory 360 Specific State
  authChecking: boolean;
  currentUser: UserProfile | null;
  token: string | null;
  activeRole: UserRole;
  profileActiveTab: 'personal' | 'employment' | 'factory' | 'security' | 'activity' | 'notifications' | 'settings';
  workers: Worker[];
  inventory: InventoryItem[];
  maintenance: MaintenanceRecord[];
  documents: FactoryDoc[];
  auditLogs: string[];
}

const initialWorkers: Worker[] = [
  { id: 1, name: 'Anand Kumar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', assignedMachineId: 1, assignedMachineName: 'Extruder 1', role: 'Machine Operator', shift: 'MORNING', attendance: 'PRESENT', safetyTraining: true, performanceScore: 92 },
  { id: 2, name: 'Vikram Singh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', assignedMachineId: 2, assignedMachineName: 'CNC Mill 2', role: 'Machine Operator', shift: 'MORNING', attendance: 'PRESENT', safetyTraining: true, performanceScore: 88 },
  { id: 3, name: 'Rajesh Sharma', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100', assignedMachineId: 3, assignedMachineName: 'Lathe 3', role: 'Maintenance Technician', shift: 'EVENING', attendance: 'PRESENT', safetyTraining: true, performanceScore: 95 },
  { id: 4, name: 'Meera Patel', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', assignedMachineId: 4, assignedMachineName: 'Welder 4', role: 'Quality Inspector', shift: 'EVENING', attendance: 'PRESENT', safetyTraining: true, performanceScore: 91 },
  { id: 5, name: 'Sanjay Dutt', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100', assignedMachineId: 5, assignedMachineName: 'Press 5', role: 'Machine Operator', shift: 'NIGHT', attendance: 'PRESENT', safetyTraining: false, performanceScore: 78 }
];

const initialInventory: InventoryItem[] = [
  { id: 1, partName: 'High-Load Rotary Bearing', partNumber: 'BRG-2209-X', stockLevel: 3, minRequired: 5, unit: 'pcs', cost: 180, supplier: 'SKF Industries' },
  { id: 2, partName: 'Induction Motor 5.5kW', partNumber: 'MTR-SIEM-05', stockLevel: 2, minRequired: 2, unit: 'pcs', cost: 1200, supplier: 'Siemens Industrial' },
  { id: 3, partName: 'Synthetic Gear Lubricant', partNumber: 'OIL-MOB-EP2', stockLevel: 12, minRequired: 10, unit: 'liters', cost: 25, supplier: 'Mobil Lubricants' },
  { id: 4, partName: 'Heavy Duty V-Belt', partNumber: 'BLT-GATES-C85', stockLevel: 8, minRequired: 6, unit: 'pcs', cost: 45, supplier: 'Gates Belts' },
  { id: 5, partName: 'Optical Proximity Sensor', partNumber: 'SNS-OMR-E2E', stockLevel: 4, minRequired: 4, unit: 'pcs', cost: 75, supplier: 'Omron Automation' }
];

const initialMaintenance: MaintenanceRecord[] = [
  { id: 1, machineId: 1, machineName: 'Extruder 1', scheduledDate: '2026-08-07', engineerName: 'Rajesh Sharma', cost: 450, sparePartsUsed: ['High-Load Rotary Bearing'], notes: 'Scheduled preventive bearing replacement and thermal alignment check.', type: 'PREVENTIVE', status: 'SCHEDULED' },
  { id: 2, machineId: 2, machineName: 'CNC Mill 2', scheduledDate: '2026-08-09', engineerName: 'Karthik Rao', cost: 180, sparePartsUsed: ['Synthetic Gear Lubricant'], notes: 'Periodic lubrication flush and motor current diagnostic.', type: 'PREVENTIVE', status: 'SCHEDULED' },
  { id: 3, machineId: 3, machineName: 'Lathe 3', scheduledDate: '2026-08-04', engineerName: 'Rajesh Sharma', cost: 1200, sparePartsUsed: ['Induction Motor 5.5kW'], notes: 'Corrective action: Motor burnt due to load fluctuations. Replaced.', type: 'CORRECTIVE', status: 'COMPLETED' }
];

const initialDocs: FactoryDoc[] = [
  { id: 1, title: 'Smart Extruder Operating Manual', category: 'MANUAL', fileSize: '4.8 MB', uploadedDate: '2026-05-12', machineId: 1 },
  { id: 2, title: 'Annual Machinery Safety Audit Report', category: 'REPORT', fileSize: '1.2 MB', uploadedDate: '2026-07-28' },
  { id: 3, title: 'Siemens Induction Motor Datasheet', category: 'MANUAL', fileSize: '2.1 MB', uploadedDate: '2026-06-15', machineId: 3 },
  { id: 4, title: 'Lockout-Tagout (LOTO) Compliance Guide', category: 'SAFETY', fileSize: '850 KB', uploadedDate: '2026-08-01' }
];

import { DEFAULT_MACHINES, DEFAULT_ALERTS } from '../services/api';

const STORAGE_KEY_USER = 'fac_mon_current_user';

export const getSavedUser = (): UserProfile | null => {
  const saved = localStorage.getItem(STORAGE_KEY_USER);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.fullName) {
        return parsed;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
};

const initialState: AppState = {
  machines: DEFAULT_MACHINES as Machine[],
  alerts: DEFAULT_ALERTS as Alert[],
  kpi: {
    totalMachines: 6,
    runningMachines: 3,
    idleMachines: 1,
    stoppedMachines: 1,
    errorMachines: 1,
    oeePercent: 88.4,
    activeAlerts: 2,
    criticalAlerts: 1,
    warningAlerts: 1,
  },
  latestTelemetry: {},
  telemetryHistory: {},
  isConnected: true,
  machinesLoading: false,
  alertsLoading: false,
  kpiLoading: false,
  authChecking: true,
  // Always start null — AuthGate will restore session after validating the
  // stored token. This ensures the app never bypasses the login screen.
  currentUser: null,
  token: null,
  activeRole: 'ADMIN',
  profileActiveTab: 'personal',
  workers: initialWorkers,
  inventory: initialInventory,
  maintenance: initialMaintenance,
  documents: initialDocs,
  auditLogs: ['IoT telemetry sensor simulation active', 'Connected to 6 machine nodes', 'System nominal']
};

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_USER_SESSION'; payload: { token: string; user: UserProfile } }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'SET_PROFILE_TAB'; payload: 'personal' | 'employment' | 'factory' | 'security' | 'activity' | 'notifications' | 'settings' }
  | { type: 'LOGOUT' }
  | { type: 'SET_AUTH_CHECKING'; payload: boolean }
  | { type: 'CLEAR_AUTH' }
  | { type: 'SET_MACHINES'; payload: Machine[] }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'SET_KPI'; payload: KpiData }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'RESOLVE_ALERT'; payload: Alert }
  | { type: 'UPDATE_MACHINE_STATUS'; payload: { machineId: number; status: string } }
  | { type: 'SET_TELEMETRY'; payload: EnrichedTelemetryLog }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: { key: 'machinesLoading' | 'alertsLoading' | 'kpiLoading'; value: boolean } }
  | { type: 'ADD_WORKER'; payload: Worker }
  | { type: 'ADD_MACHINE'; payload: Machine }
  | { type: 'REMOVE_MACHINE'; payload: number }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'ADD_MAINTENANCE'; payload: MaintenanceRecord }
  | { type: 'UPDATE_INVENTORY'; payload: { id: number; stock: number } }
  | { type: 'ADD_AUDIT_LOG'; payload: string }
  | { type: 'RESOLVE_ALL_ALERTS' };

// ─── Telemetry Enrichment Utility ────────────────────────────────────────────

function enrichTelemetry(raw: TelemetryLog, machineStatus: string): EnrichedTelemetryLog {
  const isRunning = machineStatus === 'RUNNING';
  
  // Seed-based random generator to keep values smooth and consistent for the same machine
  const seed = raw.machineId * 10 + (new Date(raw.timestamp).getSeconds() % 30);
  const randomVal = (offset: number) => {
    return Math.sin(seed + offset) * 0.5 + 0.5;
  };

  // Generate physics-compliant metrics
  const voltage = isRunning ? 220 + (randomVal(1) * 15 - 7.5) : 0;
  const current = isRunning && voltage > 0 ? (raw.powerConsumption * 1000) / voltage : 0;
  const rpm = isRunning ? 1500 + (randomVal(2) * 500 - 250) : 0;
  const humidity = 45 + (randomVal(3) * 15);
  const oilLevel = Math.max(20, 92 - (raw.machineId * 1.5) - (randomVal(4) * 0.5));
  const noise = isRunning ? 75 + (raw.vibration * 1.8) + (randomVal(5) * 5) : 35;
  const motorLoad = isRunning ? (raw.powerConsumption / 120) * 100 : 0;
  const productionSpeed = isRunning ? Math.round(35 + (rpm / 100) * 0.8 + (randomVal(6) * 5)) : 0;

  // Calculate Health Score
  let healthScore = 100;
  if (raw.temperature > 75) healthScore -= (raw.temperature - 75) * 1.2;
  if (raw.vibration > 6) healthScore -= (raw.vibration - 6) * 3;
  if (raw.pressure > 8) healthScore -= (raw.pressure - 8) * 4;
  if (oilLevel < 80) healthScore -= (80 - oilLevel) * 0.8;
  healthScore = Math.min(100, Math.max(10, Math.round(healthScore)));

  // Generate AI predictions and recommendations
  let aiRecommendation = '';
  let predictedFailureProb = undefined;
  let predictedFailureTime = undefined;

  if (raw.temperature >= 90) {
    aiRecommendation = 'Reduce machine load by 20%. Coolant system pressure is degrading.';
    predictedFailureProb = 92;
    predictedFailureTime = 24;
  } else if (raw.vibration >= 8) {
    aiRecommendation = 'Excessive vibration. Schedule bearing alignment or replacement in next shift.';
    predictedFailureProb = 88;
    predictedFailureTime = 36;
  } else if (raw.pressure >= 9.5) {
    aiRecommendation = 'Pressure check required immediately. Relief valve trigger warning.';
    predictedFailureProb = 85;
    predictedFailureTime = 48;
  } else if (healthScore < 85) {
    aiRecommendation = 'Component efficiency dropping. Inspection due during upcoming scheduled maintenance.';
  }

  return {
    ...raw,
    voltage: Math.round(voltage * 10) / 10,
    current: Math.round(current * 10) / 10,
    rpm: Math.round(rpm),
    humidity: Math.round(humidity * 10) / 10,
    oilLevel: Math.round(oilLevel * 10) / 10,
    noise: Math.round(noise * 10) / 10,
    motorLoad: Math.round(motorLoad * 10) / 10,
    productionSpeed,
    healthScore,
    aiRecommendation: aiRecommendation || undefined,
    predictedFailureProb,
    predictedFailureTime
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER_SESSION': {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(action.payload.user));
      if (action.payload.token) {
        localStorage.setItem('fac_mon_token', action.payload.token);
      }
      return {
        ...state,
        currentUser: action.payload.user,
        token: action.payload.token,
        activeRole: action.payload.user.role,
      };
    }

    case 'UPDATE_USER_PROFILE': {
      const updatedUser = state.currentUser ? { ...state.currentUser, ...action.payload } : null;
      if (updatedUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      }
      return {
        ...state,
        currentUser: updatedUser,
      };
    }

    case 'LOGOUT':
    case 'CLEAR_AUTH': {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem('fac_mon_token');
      return {
        ...state,
        currentUser: null,
        token: null,
        authChecking: false,
      };
    }

    case 'SET_AUTH_CHECKING': {
      return {
        ...state,
        authChecking: action.payload,
      };
    }

    case 'SET_MACHINES':
      return { ...state, machines: action.payload, machinesLoading: false };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload, alertsLoading: false };

    case 'SET_KPI':
      return { ...state, kpi: action.payload, kpiLoading: false };

    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts].slice(0, 100) };

    case 'RESOLVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a => a.id === action.payload.id ? action.payload : a),
      };

    case 'RESOLVE_ALL_ALERTS':
      return {
        ...state,
        alerts: state.alerts.map(a => ({ ...a, resolved: true, resolvedAt: new Date().toISOString() }))
      };

    case 'UPDATE_MACHINE_STATUS':
      return {
        ...state,
        machines: state.machines.map(m =>
          m.id === action.payload.machineId
            ? { ...m, status: action.payload.status as any }
            : m
        ),
      };

    case 'SET_TELEMETRY': {
      const tlog = action.payload;
      const mid = tlog.machineId;
      const prevHistory = state.telemetryHistory[mid] ?? [];
      const newHistory = [...prevHistory, tlog].slice(-50); // keep last 50

      return {
        ...state,
        latestTelemetry: { ...state.latestTelemetry, [mid]: tlog },
        telemetryHistory: { ...state.telemetryHistory, [mid]: newHistory },
      };
    }

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_LOADING':
      return { ...state, [action.payload.key]: action.payload.value };

    case 'ADD_WORKER':
      return {
        ...state,
        workers: [action.payload, ...state.workers],
        auditLogs: [`New worker registered: ${action.payload.name} (${action.payload.role})`, ...state.auditLogs].slice(0, 50)
      };

    case 'ADD_MACHINE':
      return { ...state, machines: [...state.machines, action.payload] };

    case 'REMOVE_MACHINE':
      return { ...state, machines: state.machines.filter(m => m.id !== action.payload) };

    case 'SET_ROLE':
      return {
        ...state,
        activeRole: action.payload,
        auditLogs: [`User switched role to ${action.payload}`, ...state.auditLogs].slice(0, 50)
      };

    case 'ADD_MAINTENANCE':
      return {
        ...state,
        maintenance: [action.payload, ...state.maintenance],
        auditLogs: [`New maintenance job scheduled for ${action.payload.machineName}`, ...state.auditLogs].slice(0, 50)
      };

    case 'UPDATE_INVENTORY':
      return {
        ...state,
        inventory: state.inventory.map(item => item.id === action.payload.id ? { ...item, stockLevel: action.payload.stock } : item)
      };

    case 'ADD_AUDIT_LOG':
      return { ...state, auditLogs: [action.payload, ...state.auditLogs].slice(0, 50) };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  handleWsMessage: (msg: WsMessage) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleWsMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case 'TELEMETRY': {
        const enriched = enrichTelemetry(msg, msg.status);
        dispatch({ type: 'SET_TELEMETRY', payload: enriched });
        dispatch({
          type: 'UPDATE_MACHINE_STATUS',
          payload: { machineId: msg.machineId, status: msg.status },
        });
        break;
      }

      case 'ALERT':
        dispatch({ type: 'ADD_ALERT', payload: msg });
        if (msg.severity === 'CRITICAL') {
          toast.error(`CRITICAL ALERT: ${msg.message}`);
        } else if (msg.severity === 'WARNING') {
          toast(`WARNING: ${msg.message}`, { icon: '⚠️' });
        } else if (msg.resolved) {
          toast.success(`RESOLVED: ${msg.message}`);
        }
        break;

      case 'STATUS_SUMMARY':
        break;
    }
  }, []);

  // (Frontend simulation loop was removed because the backend TelemetrySimulator now provides true real-time websocket data)
  
  return (
    <AppContext.Provider value={{ state, dispatch, handleWsMessage }}>
      {children}
    </AppContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
