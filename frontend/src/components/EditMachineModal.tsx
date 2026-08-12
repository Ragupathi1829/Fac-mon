import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { machineApi } from '../services/api';
import type { Machine } from '../types/machine';

interface EditMachineModalProps {
  machine: Machine;
  onClose: () => void;
  onUpdated?: (updated: Machine) => void;
}

const MACHINE_TYPES = ['EXTRUDER', 'CNC_MILL', 'LATHE', 'PRESS', 'WELDER', 'CONVEYOR', 'ROBOT_ARM', 'COMPRESSOR', 'FURNACE', 'GRINDER'];
const STATUSES = ['RUNNING', 'IDLE', 'STOPPED', 'ERROR'];

const EditMachineModal: React.FC<EditMachineModalProps> = ({ machine, onClose, onUpdated }) => {
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    machineCode: machine.machineCode,
    name: machine.name,
    type: machine.type,
    location: machine.location,
    status: machine.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.machineCode.trim()) errs.machineCode = 'Machine code is required';
    if (!form.name.trim()) errs.name = 'Machine name is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const updated = await machineApi.update(machine.id, {
        machineCode: form.machineCode.trim().toUpperCase(),
        name: form.name.trim(),
        type: form.type,
        location: form.location.trim(),
        status: form.status,
      });

      dispatch({ type: 'UPDATE_MACHINE_STATUS', payload: { machineId: machine.id, status: form.status } });
      if (onUpdated) onUpdated(updated);
      setSuccess(true);
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to update machine' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{success ? '✅ Machine Updated!' : `✏️ Edit ${machine.machineCode}`}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {success ? (
          <p style={{ color: '#00e68a', fontWeight: 600, textAlign: 'center', padding: '2rem 0' }}>
            Machine specifications updated successfully.
          </p>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Machine Code</label>
              <input
                className="form-input"
                value={form.machineCode}
                onChange={e => setForm({ ...form, machineCode: e.target.value })}
              />
              {errors.machineCode && <span className="form-error">{errors.machineCode}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Machine Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Operating Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as any })}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                {MACHINE_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location / Sector</label>
              <input
                className="form-input"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>

            {errors.submit && <span className="form-error">{errors.submit}</span>}

            <button className="btn-submit" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : '💾 Save Machine Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditMachineModal;
