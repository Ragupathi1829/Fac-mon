// API Base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

// ─── Initial IoT Default Machines List ────────────────────────────────────────

export const DEFAULT_MACHINES = [
  {
    id: 1,
    machineCode: 'MCH-101',
    name: 'Extruder Line Alpha',
    type: 'INJECTION_MOLDING',
    status: 'RUNNING',
    location: 'Assembly Line 1 - Bay A',
    installationDate: '2024-03-15',
    lastMaintenanceDate: '2026-07-20',
    failureImpact: 'Main Polyethylene Extrusion Line halted. Downstream blow molding units will starve.',
    productionLossRisk: '4,500 PET Units / Hour',
    financialImpactPerHr: '₹45,000 / Hr',
    fixedSensors: [
      { sensorId: 'SNS-TMP-101A', sensorType: 'TEMPERATURE', modelNumber: 'TMP-PT100-PRO', installationDate: '2024-03-15', calibrationDueDate: '2026-11-15', status: 'ACTIVE', lastReading: '75.8°C' },
      { sensorId: 'SNS-VIB-101B', sensorType: 'VIBRATION', modelNumber: 'VIB-SENS-3D', installationDate: '2024-03-15', calibrationDueDate: '2026-11-15', status: 'ACTIVE', lastReading: '3.7 mm/s' },
      { sensorId: 'SNS-PWR-101C', sensorType: 'POWER', modelNumber: 'PWR-KW-200', installationDate: '2024-03-15', calibrationDueDate: '2026-11-15', status: 'ACTIVE', lastReading: '63.2 kW' },
      { sensorId: 'SNS-PRS-101D', sensorType: 'PRESSURE', modelNumber: 'PRS-BAR-10', installationDate: '2024-03-15', calibrationDueDate: '2026-11-15', status: 'ACTIVE', lastReading: '7.4 bar' }
    ]
  },
  {
    id: 2,
    machineCode: 'MCH-102',
    name: 'CNC Milling Center 5-Axis',
    type: 'CNC_MILL',
    status: 'RUNNING',
    location: 'Machining Sector B',
    installationDate: '2023-11-10',
    lastMaintenanceDate: '2026-06-14',
    failureImpact: 'Precision engine block milling stopped. Assembly line delays for aerospace components.',
    productionLossRisk: '12 Precision Engine Blocks / Hour',
    financialImpactPerHr: '₹85,000 / Hr',
    fixedSensors: [
      { sensorId: 'SNS-VIB-102A', sensorType: 'VIBRATION', modelNumber: 'VIB-ACCEL-5X', installationDate: '2023-11-10', calibrationDueDate: '2026-12-01', status: 'ACTIVE', lastReading: '2.8 mm/s' },
      { sensorId: 'SNS-TMP-102B', sensorType: 'TEMPERATURE', modelNumber: 'TMP-INFRA-800', installationDate: '2023-11-10', calibrationDueDate: '2026-12-01', status: 'ACTIVE', lastReading: '62.4°C' },
      { sensorId: 'SNS-PWR-102C', sensorType: 'POWER', modelNumber: 'PWR-SMART-300', installationDate: '2023-11-10', calibrationDueDate: '2026-12-01', status: 'ACTIVE', lastReading: '48.9 kW' }
    ]
  },
  {
    id: 3,
    machineCode: 'MCH-103',
    name: 'Hydraulic Stamping Press 500T',
    type: 'PRESS',
    status: 'IDLE',
    location: 'Heavy Press Zone C',
    installationDate: '2022-08-05',
    lastMaintenanceDate: '2026-07-30',
    failureImpact: 'Automotive sheet metal body stamping offline. Chassis welding station bottlenecked.',
    productionLossRisk: '250 Stamping Sheets / Hour',
    financialImpactPerHr: '₹62,000 / Hr',
    fixedSensors: [
      { sensorId: 'SNS-PRS-103A', sensorType: 'PRESSURE', modelNumber: 'HYD-PRS-500T', installationDate: '2022-08-05', calibrationDueDate: '2026-10-10', status: 'ACTIVE', lastReading: '0.5 bar' },
      { sensorId: 'SNS-TMP-103B', sensorType: 'TEMPERATURE', modelNumber: 'OIL-TMP-SENS', installationDate: '2022-08-05', calibrationDueDate: '2026-10-10', status: 'ACTIVE', lastReading: '28.1°C' }
    ]
  },
  {
    id: 4,
    machineCode: 'MCH-104',
    name: 'Robotic Welding Cell Arc-6',
    type: 'ROBOTIC_ARM',
    status: 'RUNNING',
    location: 'Welding Bay D',
    installationDate: '2025-01-22',
    lastMaintenanceDate: '2026-08-01',
    failureImpact: 'Automated MIG weld seam line interrupted. Manual welding fallback required.',
    productionLossRisk: '80 Welded Frames / Hour',
    financialImpactPerHr: '₹38,000 / Hr',
    fixedSensors: [
      { sensorId: 'SNS-PWR-104A', sensorType: 'POWER', modelNumber: 'ARC-PWR-400', installationDate: '2025-01-22', calibrationDueDate: '2027-01-20', status: 'ACTIVE', lastReading: '54.1 kW' },
      { sensorId: 'SNS-TMP-104B', sensorType: 'TEMPERATURE', modelNumber: 'NOZZLE-THERM-X', installationDate: '2025-01-22', calibrationDueDate: '2027-01-20', status: 'ACTIVE', lastReading: '71.5°C' }
    ]
  },
  {
    id: 5,
    machineCode: 'MCH-105',
    name: 'Precision Industrial Lathe',
    type: 'LATHE',
    status: 'ERROR',
    location: 'Machining Sector B',
    installationDate: '2023-05-18',
    lastMaintenanceDate: '2026-05-10',
    failureImpact: '🚨 CRITICAL OVERLOAD: Spindle bearing vibration high (9.4 mm/s). Shaft turning stalled.',
    productionLossRisk: '40 Shaft Component Parts / Hour',
    financialImpactPerHr: '₹95,000 / Hr (ACTIVE LOSS)',
    fixedSensors: [
      { sensorId: 'SNS-VIB-105A', sensorType: 'VIBRATION', modelNumber: 'SPINDLE-VIB-CRIT', installationDate: '2023-05-18', calibrationDueDate: '2026-09-15', status: 'FAULTY', lastReading: '9.4 mm/s' },
      { sensorId: 'SNS-TMP-105B', sensorType: 'TEMPERATURE', modelNumber: 'TMP-BEARING-HOT', installationDate: '2023-05-18', calibrationDueDate: '2026-09-15', status: 'ACTIVE', lastReading: '94.2°C' }
    ]
  },
  {
    id: 6,
    machineCode: 'MCH-106',
    name: 'Fiber Laser Cutter 6kW',
    type: 'LASER_CUTTER',
    status: 'STOPPED',
    location: 'Sheet Metal Bay E',
    installationDate: '2024-09-12',
    lastMaintenanceDate: '2026-07-15',
    failureImpact: 'Laser optics head scheduled maintenance. Sheet metal blanking line stopped.',
    productionLossRisk: '120 Cut Metal Panels / Hour',
    financialImpactPerHr: '₹55,000 / Hr',
    fixedSensors: [
      { sensorId: 'SNS-PWR-106A', sensorType: 'POWER', modelNumber: 'LASER-OPT-PWR', installationDate: '2024-09-12', calibrationDueDate: '2026-11-30', status: 'ACTIVE', lastReading: '0.0 kW' },
      { sensorId: 'SNS-HUM-106B', sensorType: 'HUMIDITY', modelNumber: 'OPTIC-HUM-SAFE', installationDate: '2024-09-12', calibrationDueDate: '2026-11-30', status: 'ACTIVE', lastReading: '42.1%' }
    ]
  },
];

export const DEFAULT_ALERTS = [
  { id: 101, machineId: 5, machineCode: 'MCH-105', machineName: 'Precision Industrial Lathe', severity: 'CRITICAL', message: 'Bearing vibration exceeded threshold (9.4 mm/s). Thermal overload risk.', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), resolved: false },
  { id: 102, machineId: 1, machineCode: 'MCH-101', machineName: 'Extruder Line Alpha', severity: 'WARNING', message: 'Nozzle temperature elevated (78.4°C). Monitoring thermal dissipation.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), resolved: false },
  { id: 103, machineId: 3, machineCode: 'MCH-103', machineName: 'Hydraulic Stamping Press 500T', severity: 'INFO', message: 'Machine entered IDLE standby mode after job batch completion.', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), resolved: true, resolvedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
];

// In-memory store for fallback operations
let localMachines = [...DEFAULT_MACHINES];
let localAlerts = [...DEFAULT_ALERTS];

// ─── Generic fetch helper with auth header ───────────────────────────────────

function getStoredToken(): string | null {
  try {
    const user = localStorage.getItem('fac_mon_current_user');
    if (user) {
      const parsed = JSON.parse(user);
      // The token is stored separately in app state; read from a parallel key if set
    }
  } catch (_e) { /* ignore */ }
  // Token is managed by AppContext — read from the same localStorage key used by login
  try {
    const token = localStorage.getItem('fac_mon_token');
    return token;
  } catch (_e) { return null; }
}

async function request<T>(path: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  const token = getStoredToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders, ...options?.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (fallbackData !== undefined && USE_MOCKS) {
      return fallbackData;
    }
    throw err;
  }
}

// ─── Machine API ─────────────────────────────────────────────────────────────

export const machineApi = {
  getAll: () => request<any[]>('/machines', undefined, localMachines),
  getById: (id: number) => {
    const found = localMachines.find(m => m.id === Number(id));
    return request<any>(`/machines/${id}`, undefined, found ?? null);
  },
  create: (data: any) => {
    const newMachine = {
      id: Date.now(),
      machineCode: data.machineCode || `MCH-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name,
      type: data.type || 'INJECTION_MOLDING',
      status: data.status || 'RUNNING',
      location: data.location || 'Assembly Floor - Main Zone',
      installationDate: new Date().toISOString().split('T')[0],
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      failureImpact: data.failureImpact || 'Standard operational line component.',
      productionLossRisk: data.productionLossRisk || '1,000 Units / Hour',
      financialImpactPerHr: data.financialImpactPerHr || '₹20,000 / Hr',
      fixedSensors: data.fixedSensors || [],
    };
    localMachines.unshift(newMachine);
    return request<any>('/machines', { method: 'POST', body: JSON.stringify(data) }, newMachine);
  },
  update: (id: number, data: any) => {
    localMachines = localMachines.map(m => m.id === id ? { ...m, ...data } : m);
    return request<any>(`/machines/${id}`, { method: 'PUT', body: JSON.stringify(data) }, localMachines.find(m => m.id === id));
  },
  updateStatus: (id: number, status: string) => {
    localMachines = localMachines.map(m => m.id === id ? { ...m, status } : m);
    return request<any>(`/machines/${id}/status?status=${status}`, { method: 'PATCH' }, { machineId: id, status });
  },
  delete: (id: number) => {
    localMachines = localMachines.filter(m => m.id !== id);
    return request<void>(`/machines/${id}`, { method: 'DELETE' }, undefined);
  },
};

// ─── Telemetry API ───────────────────────────────────────────────────────────

export const telemetryApi = {
  getLatestByMachine: (machineId: number, limit = 50) =>
    request<any[]>(`/telemetry/machine/${machineId}?limit=${limit}`, undefined, []),
  getLatestSnapshot: (machineId: number) =>
    request<any>(`/telemetry/machine/${machineId}/latest`, undefined, null),
  getRecentAll: (limit = 20) => request<any[]>(`/telemetry/recent?limit=${limit}`, undefined, []),
};

// ─── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, pass: string) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Invalid credentials');
      }
      return await res.json();
    } catch (e: any) {
      if (e.message && e.message !== 'Failed to fetch') {
        throw e; // backend returned an actual error (e.g. invalid credentials)
      }
      
      if (!USE_MOCKS) throw e;
      
      // Standalone Fallback for client-side demo mode (only if backend is down)
      const roleMap: Record<string, any> = {
        'admin@factory.com': { role: 'ADMIN', id: 1, empId: 'EMP-1001', name: 'Ragaav', dept: 'Executive Board', desig: 'Chief Factory Admin' },
        'manager@factory.com': { role: 'FACTORY_MANAGER', id: 2, empId: 'EMP-1002', name: 'Vikram Manager', dept: 'Production Ops', desig: 'Plant General Manager' },
        'engineer@factory.com': { role: 'MAINTENANCE_ENGINEER', id: 3, empId: 'EMP-1003', name: 'Rajesh Engineer', dept: 'Equipment Maintenance', desig: 'Senior Reliability Engineer' },
        'operator@factory.com': { role: 'MACHINE_OPERATOR', id: 4, empId: 'EMP-1004', name: 'Anand Operator', dept: 'Extruder Sector A', desig: 'Senior Machine Specialist' },
        'quality@factory.com': { role: 'QUALITY_INSPECTOR', id: 5, empId: 'EMP-1005', name: 'Meera Inspector', dept: 'Quality Assurance', desig: 'Chief Quality Auditor' },
      };

      const matched = roleMap[email] || { role: 'ADMIN', id: 1, empId: 'EMP-1001', name: 'Ragaav', dept: 'Executive Board', desig: 'Chief Factory Admin' };
      return {
        token: `JWT_BEARER_TOKEN_${matched.role}`,
        id: matched.id,
        employeeId: matched.empId,
        fullName: matched.name,
        email,
        role: matched.role,
        department: matched.dept,
        designation: matched.desig,
        shift: 'Morning Shift (06:00 - 14:00)',
        factoryLocation: 'SmartFactory Unit 1 · Chennai',
      };
    }
  },
  register: async (userData: any) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }
      return await res.json();
    } catch (e: any) {
      if (e.message && e.message !== 'Failed to fetch') {
        throw e;
      }

      if (!USE_MOCKS) throw e;

      // Demo fallback if backend is offline
      return {
        message: 'User registered successfully (Demo Mode)',
        userId: Date.now(),
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`
      };
    }
  }
};

// ─── Alert API ───────────────────────────────────────────────────────────────

export const alertApi = {
  getActive: () => request<any[]>('/alerts/active', undefined, localAlerts.filter(a => !a.resolved)),
  getRecent: (limit = 50) => request<any[]>(`/alerts/recent?limit=${limit}`, undefined, localAlerts),
  getByMachine: (machineId: number) => request<any[]>(`/alerts/machine/${machineId}`, undefined, localAlerts.filter(a => a.machineId === machineId)),
  resolve: (alertId: number) => {
    localAlerts = localAlerts.map(a => a.id === alertId ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a);
    return request<any>(`/alerts/${alertId}/resolve`, { method: 'PATCH' }, localAlerts.find(a => a.id === alertId));
  },
  getCounts: () => {
    const active = localAlerts.filter(a => !a.resolved);
    return request<Record<string, number>>('/alerts/counts', undefined, {
      active: active.length,
      critical: active.filter(a => a.severity === 'CRITICAL').length,
      warning: active.filter(a => a.severity === 'WARNING').length,
    });
  },
};

// ─── Dashboard KPI API ───────────────────────────────────────────────────────

export const dashboardApi = {
  getKpi: () => {
    const total = localMachines.length;
    const running = localMachines.filter(m => m.status === 'RUNNING').length;
    const idle = localMachines.filter(m => m.status === 'IDLE').length;
    const stopped = localMachines.filter(m => m.status === 'STOPPED').length;
    const error = localMachines.filter(m => m.status === 'ERROR').length;
    const activeAlerts = localAlerts.filter(a => !a.resolved);

    const kpiFallback = {
      totalMachines: total,
      runningMachines: running,
      idleMachines: idle,
      stoppedMachines: stopped,
      errorMachines: error,
      oeePercent: total > 0 ? Math.round(((running * 0.95 + idle * 0.5) / total) * 100 * 10) / 10 : 85.5,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === 'CRITICAL').length,
      warningAlerts: activeAlerts.filter(a => a.severity === 'WARNING').length,
    };

    return request<Record<string, any>>('/dashboard/kpi', undefined, kpiFallback);
  },
};

