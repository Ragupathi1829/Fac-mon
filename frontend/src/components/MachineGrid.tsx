import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { machineApi } from '../services/api';
import AddMachineModal from './AddMachineModal';
import MachineCard from './MachineCard';
import type { Machine } from '../types/machine';

type StatusFilter = 'ALL' | 'RUNNING' | 'IDLE' | 'STOPPED' | 'ERROR';

const getStatus = (m: Machine) => m.status ? m.status.toUpperCase() : 'IDLE';

const MachineGrid: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAddModal, setShowAddModal] = React.useState(false);

  const loadMachines = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'machinesLoading', value: true } });
    try {
      const machines = await machineApi.getAll();
      dispatch({ type: 'SET_MACHINES', payload: machines });
    } catch (err) {
      console.error('Failed to load machines:', err);
      dispatch({ type: 'SET_LOADING', payload: { key: 'machinesLoading', value: false } });
    }
  }, [dispatch]);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const filtered = state.machines.filter(m => {
    const matchesStatus = filter === 'ALL' || getStatus(m) === filter;
    const q = searchQuery.toLowerCase();
    const matchesSensorId = m.fixedSensors?.some(s => s.sensorId.toLowerCase().includes(q) || s.modelNumber.toLowerCase().includes(q));
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.machineCode.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      (m.failureImpact && m.failureImpact.toLowerCase().includes(q)) ||
      (m.productionLossRisk && m.productionLossRisk.toLowerCase().includes(q)) ||
      Boolean(matchesSensorId);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    ALL:     state.machines.length,
    RUNNING: state.machines.filter(m => getStatus(m) === 'RUNNING').length,
    IDLE:    state.machines.filter(m => getStatus(m) === 'IDLE').length,
    STOPPED: state.machines.filter(m => getStatus(m) === 'STOPPED').length,
    ERROR:   state.machines.filter(m => getStatus(m) === 'ERROR').length,
  };

  return (
    <>
      <div className="machine-grid-container">
        <div className="machine-grid-header">
          <div>
            <h2>Factory Floor Machines</h2>
            <span className="machine-count">{state.machines.length} IoT-embedded sensor machines registered</span>
          </div>

          <button 
            className="btn-add-machine"
            onClick={() => setShowAddModal(true)}
            style={{ background: 'var(--accent-pink)', borderColor: 'var(--accent-pink)', color: '#ffffff' }}
          >
            ➕ Add Machine
          </button>
        </div>

      {/* Filters */}
      <div className="machine-filter-bar">
        <div className="filter-tabs">
          {(['ALL', 'RUNNING', 'IDLE', 'STOPPED', 'ERROR'] as StatusFilter[]).map(s => (
            <button
              key={s}
              className={`filter-tab filter-tab-${s.toLowerCase()} ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s} <span className="filter-count">{statusCounts[s]}</span>
            </button>
          ))}
        </div>
        <input
          className="machine-search"
          type="text"
          placeholder="🔍 Search Machine Name, Code, Sensor ID (e.g. SNS-VIB-105A), or Production Impact…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ minWidth: '340px' }}
        />
      </div>

      {/* Grid */}
      {state.machinesLoading ? (
        <div className="machine-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="machine-card skeleton-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="machine-grid">
          <div className="placeholder-card">
            <p>{state.machines.length === 0 ? 'No machines registered. Add a machine to get started.' : 'No machines match your filter.'}</p>
          </div>
        </div>
      ) : (
        <div className="machine-grid">
          {filtered.map(machine => (
            <MachineCard
              key={machine.id}
              machine={machine}
              telemetry={state.latestTelemetry[machine.id]}
              onClick={() => navigate(`/machines/${machine.id}`)}
            />
          ))}
        </div>
      )}
    </div>

    {showAddModal && <AddMachineModal onClose={() => setShowAddModal(false)} />}
  </>
  );
};

export default MachineGrid;
