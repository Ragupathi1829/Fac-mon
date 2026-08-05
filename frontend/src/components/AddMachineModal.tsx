import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { machineApi } from '../services/api';

interface AddMachineModalProps {
  onClose: () => void;
}

const MACHINE_TYPES = ['EXTRUDER', 'CNC_MILL', 'LATHE', 'PRESS', 'WELDER', 'CONVEYOR', 'ROBOT_ARM', 'COMPRESSOR', 'FURNACE', 'GRINDER'];

const AddMachineModal: React.FC<AddMachineModalProps> = ({ onClose }) => {
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    machineCode: '',
    name: '',
    type: 'EXTRUDER',
    location: '',
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
      const machine = await machineApi.create({
        machineCode: form.machineCode.trim().toUpperCase(),
        name: form.name.trim(),
        type: form.type,
        location: form.location.trim(),
        status: 'IDLE',
      });
      dispatch({ type: 'ADD_MACHINE', payload: machine });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to add machine' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{success ? '✅ Machine Added!' : '➕ Add New Machine'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {success ? (
          <p style={{ color: '#00e68a', fontWeight: 600, textAlign: 'center', padding: '2rem 0' }}>
            {form.name} has been registered successfully.
          </p>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Machine Code</label>
              <input
                className="form-input"
                placeholder="e.g., M005"
                value={form.machineCode}
                onChange={e => setForm({ ...form, machineCode: e.target.value })}
              />
              {errors.machineCode && <span className="form-error">{errors.machineCode}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Machine Name</label>
              <input
                className="form-input"
                placeholder="e.g., CNC Mill 3"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
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
              <label className="form-label">Location</label>
              <input
                className="form-input"
                placeholder="e.g., Plant A"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>

            {errors.submit && <span className="form-error">{errors.submit}</span>}

            <button className="btn-submit" type="submit" disabled={submitting}>
              {submitting ? 'Adding…' : '🏭 Register Machine'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddMachineModal;
