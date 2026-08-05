import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { machineApi } from '../services/api';
import MachineCard from './MachineCard';

type StatusFilter = 'ALL' | 'RUNNING' | 'IDLE' | 'STOPPED' | 'ERROR';

const MachineGrid: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

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
    const matchesStatus = filter === 'ALL' || m.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.machineCode.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    ALL:     state.machines.length,
    RUNNING: state.machines.filter(m => m.status === 'RUNNING').length,
    IDLE:    state.machines.filter(m => m.status === 'IDLE').length,
    STOPPED: state.machines.filter(m => m.status === 'STOPPED').length,
    ERROR:   state.machines.filter(m => m.status === 'ERROR').length,
  };

  return (
    <div className="machine-grid-container">
      <div className="machine-grid-header">
        <h2>Factory Floor Machines</h2>
        <span className="machine-count">{state.machines.length} machines registered</span>
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
          placeholder="Search machines…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
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
  );
};

export default MachineGrid;
