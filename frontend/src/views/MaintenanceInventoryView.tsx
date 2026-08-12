import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';

const MaintenanceInventoryView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({
    machineId: 1,
    scheduledDate: '',
    engineerName: '',
    notes: '',
    type: 'PREVENTIVE' as const,
  });
  const [orderFeedback, setOrderFeedback] = useState<Record<number, string>>({});

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduledDate || !form.engineerName) return;

    const mach = state.machines.find(m => m.id === Number(form.machineId));

    dispatch({
      type: 'ADD_MAINTENANCE',
      payload: {
        id: state.maintenance.length + 1,
        machineId: Number(form.machineId),
        machineName: mach ? mach.name : 'Unknown Machine',
        scheduledDate: form.scheduledDate,
        engineerName: form.engineerName,
        cost: form.type === 'PREVENTIVE' ? 250 : 600,
        sparePartsUsed: [],
        notes: form.notes,
        type: form.type,
        status: 'SCHEDULED',
      },
    });

    setForm({
      machineId: 1,
      scheduledDate: '',
      engineerName: '',
      notes: '',
      type: 'PREVENTIVE',
    });
  };

  const handleRestock = (itemId: number, currentStock: number) => {
    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: { id: itemId, stock: currentStock + 5 },
    });
    setOrderFeedback(prev => ({ ...prev, [itemId]: 'Order Placed (+$5pcs)' }));
    setTimeout(() => {
      setOrderFeedback(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }, 2000);
  };

  return (
    <div className="app-root">
      <Navbar />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>🛠️ Maintenance & Inventory</h1>
          <p className="system-time">PULSE · Resources & Workorders</p>
        </header>

        <main className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.75rem' }}>
          
          {/* Main Panel: Inventory & Maintenance Tables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Inventory Card */}
            <div className="chart-card">
              <h3 style={{ marginBottom: '1rem' }}>📦 Spare Parts Inventory</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Part Name</th>
                      <th style={{ padding: '0.75rem' }}>Part No.</th>
                      <th style={{ padding: '0.75rem' }}>Stock Level</th>
                      <th style={{ padding: '0.75rem' }}>Min Req.</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.inventory.map(item => {
                      const lowStock = item.stockLevel < item.minRequired;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.partName}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Inter, monospace' }}>{item.partNumber}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>{item.stockLevel} {item.unit}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{item.minRequired}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              color: lowStock ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                              background: lowStock ? 'rgba(255,59,106,0.1)' : 'rgba(0,230,138,0.1)',
                              padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700
                            }}>
                              {lowStock ? '⚠️ Low Stock' : '✅ Healthy'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button 
                              className="btn-outline-action"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem' }}
                              onClick={() => handleRestock(item.id, item.stockLevel)}
                            >
                              {orderFeedback[item.id] || 'Order Stock'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance Log Card */}
            <div className="chart-card">
              <h3 style={{ marginBottom: '1rem' }}>📅 Scheduled Work Orders</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Machine</th>
                      <th style={{ padding: '0.75rem' }}>Date</th>
                      <th style={{ padding: '0.75rem' }}>Engineer</th>
                      <th style={{ padding: '0.75rem' }}>Notes</th>
                      <th style={{ padding: '0.75rem' }}>Type</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.maintenance.map(job => (
                      <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{job.machineName}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{job.scheduledDate}</td>
                        <td style={{ padding: '0.75rem' }}>{job.engineerName}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{job.notes}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85 }}>{job.type}</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            color: job.status === 'COMPLETED' ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                            background: job.status === 'COMPLETED' ? 'rgba(0,230,138,0.1)' : 'rgba(0,212,255,0.1)',
                            padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700
                          }}>
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Panel: Schedule Form */}
          <aside className="alert-center">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📅 New Work Order</h2>
            <form className="modal-form" onSubmit={handleScheduleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Machine</label>
                <select
                  className="form-select"
                  value={form.machineId}
                  onChange={e => setForm({ ...form, machineId: Number(e.target.value) })}
                >
                  {state.machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.machineCode})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Engineer</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Rajesh Sharma"
                  value={form.engineerName}
                  onChange={e => setForm({ ...form, engineerName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as any })}
                >
                  <option value="PREVENTIVE">Preventive Maintenance</option>
                  <option value="CORRECTIVE">Corrective Action</option>
                  <option value="AI_RECOMMENDED">AI Recommendation Fix</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions / Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Details of the job..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button className="btn-submit" type="submit">
                Create Work Order
              </button>
            </form>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default MaintenanceInventoryView;
