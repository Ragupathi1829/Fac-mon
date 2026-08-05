import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Machine, Alert, KpiData, TelemetryLog, WsMessage } from '../types/machine';

// ─── State Shape ─────────────────────────────────────────────────────────────

interface AppState {
  machines: Machine[];
  alerts: Alert[];
  kpi: KpiData | null;
  // Latest telemetry per machineId
  latestTelemetry: Record<number, TelemetryLog>;
  // Live telemetry history per machineId (last 50 points)
  telemetryHistory: Record<number, TelemetryLog[]>;
  isConnected: boolean;
  machinesLoading: boolean;
  alertsLoading: boolean;
  kpiLoading: boolean;
}

const initialState: AppState = {
  machines: [],
  alerts: [],
  kpi: null,
  latestTelemetry: {},
  telemetryHistory: {},
  isConnected: false,
  machinesLoading: true,
  alertsLoading: true,
  kpiLoading: true,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_MACHINES'; payload: Machine[] }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'SET_KPI'; payload: KpiData }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'RESOLVE_ALERT'; payload: Alert }
  | { type: 'UPDATE_MACHINE_STATUS'; payload: { machineId: number; status: string } }
  | { type: 'SET_TELEMETRY'; payload: TelemetryLog }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: { key: 'machinesLoading' | 'alertsLoading' | 'kpiLoading'; value: boolean } }
  | { type: 'ADD_MACHINE'; payload: Machine }
  | { type: 'REMOVE_MACHINE'; payload: number };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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

    case 'ADD_MACHINE':
      return { ...state, machines: [...state.machines, action.payload] };

    case 'REMOVE_MACHINE':
      return { ...state, machines: state.machines.filter(m => m.id !== action.payload) };

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
      case 'TELEMETRY':
        dispatch({ type: 'SET_TELEMETRY', payload: msg });
        // Update machine status from live data
        dispatch({
          type: 'UPDATE_MACHINE_STATUS',
          payload: { machineId: msg.machineId, status: msg.status },
        });
        break;

      case 'ALERT':
        dispatch({ type: 'ADD_ALERT', payload: msg });
        break;

      case 'STATUS_SUMMARY':
        // Refresh KPI from summary if available
        break;
    }
  }, []);

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
