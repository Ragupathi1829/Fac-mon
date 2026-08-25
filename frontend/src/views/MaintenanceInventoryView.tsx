import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';

const MaintenanceInventoryView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState<{
    machineId: number;
    scheduledDate: string;
    engineerName: string;
    notes: string;
    type: 'PREVENTIVE' | 'CORRECTIVE' | 'AI_RECOMMENDED';
  }>({
    machineId: 1,
    scheduledDate: '',
    engineerName: '',
    notes: '',
    type: 'PREVENTIVE',
  });
  const [orderFeedback, setOrderFeedback] = useState<Record<number, string>>({});
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PREVENTIVE' | 'CORRECTIVE' | 'AI_RECOMMENDED'>('ALL');
  const [inventorySearch, setInventorySearch] = useState('');

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
        cost: form.type === 'PREVENTIVE' ? 250 : form.type === 'AI_RECOMMENDED' ? 400 : 600,
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
      payload: { id: itemId, stock: currentStock + 10 },
    });
    setOrderFeedback(prev => ({ ...prev, [itemId]: '✅ +10 Stock Ingested!' }));
    setTimeout(() => {
      setOrderFeedback(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }, 2500);
  };

  // Filtered maintenance list
  const filteredMaintenance = state.maintenance.filter(item => {
    if (activeFilter === 'ALL') return true;
    return item.type === activeFilter;
  });

  // Filtered inventory list
  const filteredInventory = state.inventory.filter(item => {
    if (!inventorySearch.trim()) return true;
    return item.partName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
           item.partNumber.toLowerCase().includes(inventorySearch.toLowerCase());
  });

  const lowStockCount = state.inventory.filter(i => i.stockLevel < i.minRequired).length;

  return (
    <div className="app-root">
      <Navbar />
      <div className="dashboard-container">
        {/* Header Strip */}
        <header className="maintenance-header-strip">
          <div>
            <div className="maint-title-row">
              <span className="maint-badge-pulse">🛠️ INDUSTRY 4.0 RESOURCE HUB</span>
              {lowStockCount > 0 && (
                <span className="maint-badge-warning">
                  ⚠️ {lowStockCount} Spare Part(s) Below Threshold
                </span>
              )}
            </div>
            <h1 className="maint-main-title">Maintenance & Spare Parts Inventory</h1>
            <p className="system-time">Real-time work order orchestration & predictive spare stock allocation</p>
          </div>
        </header>

        <main className="maintenance-layout-grid">
          {/* Main Left: Inventory & Work Orders */}
          <div className="maintenance-left-column">
            
            {/* ── 1. Spare Parts Inventory Card ── */}
            <div className="maint-card-panel">
              <div className="maint-card-header">
                <div>
                  <h3 className="maint-card-title">📦 Smart Spare Parts Inventory</h3>
                  <p className="maint-card-sub">Automated procurement triggers & critical component tracking</p>
                </div>
                <div className="inventory-search-wrap">
                  <input 
                    type="text" 
                    placeholder="Search parts or SKU..." 
                    className="inventory-search-input"
                    value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="maint-table-wrapper">
                <table className="maint-custom-table">
                  <thead>
                    <tr>
                      <th>Part Details</th>
                      <th>Part SKU</th>
                      <th>Current Level</th>
                      <th>Health Index</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Procurement Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(item => {
                      const lowStock = item.stockLevel < item.minRequired;
                      const stockPct = Math.min(100, Math.round((item.stockLevel / (item.minRequired * 2)) * 100));
                      return (
                        <tr key={item.id} className={lowStock ? 'row-warning' : ''}>
                          <td>
                            <div className="part-name-cell">
                              <span className="part-icon">🔩</span>
                              <span className="part-title">{item.partName}</span>
                            </div>
                          </td>
                          <td className="font-mono text-muted">{item.partNumber}</td>
                          <td>
                            <span className="stock-number-pill">
                              <strong>{item.stockLevel}</strong> / {item.minRequired} {item.unit}
                            </span>
                          </td>
                          <td style={{ minWidth: '130px' }}>
                            <div className="stock-meter-wrap">
                              <div className="stock-meter-track">
                                <div 
                                  className={`stock-meter-fill ${lowStock ? 'fill-low' : 'fill-good'}`}
                                  style={{ width: `${stockPct}%` }}
                                />
                              </div>
                              <span className="stock-meter-text">{stockPct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`stock-status-tag ${lowStock ? 'tag-low' : 'tag-good'}`}>
                              {lowStock ? '⚠️ Low Stock' : '✅ Optimal'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className={`btn-stock-action ${orderFeedback[item.id] ? 'ordered' : ''}`}
                              onClick={() => handleRestock(item.id, item.stockLevel)}
                            >
                              {orderFeedback[item.id] || '⚡ Order +10 Units'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 2. Work Orders Card ── */}
            <div className="maint-card-panel">
              <div className="maint-card-header">
                <div>
                  <h3 className="maint-card-title">📋 Scheduled Maintenance Orders</h3>
                  <p className="maint-card-sub">Active tickets, assigned field engineers, and completion stages</p>
                </div>
                
                {/* Filter Tabs */}
                <div className="workorder-filter-tabs">
                  <button 
                    className={`wo-filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('ALL')}
                  >
                    All ({state.maintenance.length})
                  </button>
                  <button 
                    className={`wo-filter-btn ${activeFilter === 'PREVENTIVE' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('PREVENTIVE')}
                  >
                    Preventive
                  </button>
                  <button 
                    className={`wo-filter-btn ${activeFilter === 'CORRECTIVE' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('CORRECTIVE')}
                  >
                    Corrective
                  </button>
                  <button 
                    className={`wo-filter-btn ${activeFilter === 'AI_RECOMMENDED' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('AI_RECOMMENDED')}
                  >
                    AI Suggested
                  </button>
                </div>
              </div>

              <div className="maint-table-wrapper">
                <table className="maint-custom-table">
                  <thead>
                    <tr>
                      <th>Machine Unit</th>
                      <th>Scheduled Date</th>
                      <th>Lead Engineer</th>
                      <th>Diagnostic Notes</th>
                      <th>Type</th>
                      <th>Est. Cost</th>
                      <th>Ticket Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaintenance.map(job => (
                      <tr key={job.id}>
                        <td>
                          <div className="machine-code-cell">
                            <span className="code-badge">⚙️</span>
                            <span className="code-title">{job.machineName}</span>
                          </div>
                        </td>
                        <td className="font-mono text-muted">{job.scheduledDate}</td>
                        <td>
                          <span className="engineer-pill">👤 {job.engineerName}</span>
                        </td>
                        <td className="notes-cell" title={job.notes}>{job.notes || 'Routine checkup'}</td>
                        <td>
                          <span className={`work-type-pill type-${job.type.toLowerCase()}`}>
                            {job.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="font-mono text-cyan">₹{(job.cost * 83).toLocaleString()}</td>
                        <td>
                          <span className={`job-status-pill status-${job.status.toLowerCase()}`}>
                            <span className="status-dot" />
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

          {/* Right Column: Work Order Dispatch Form */}
          <aside className="maint-right-sidebar">
            <div className="maint-dispatch-card">
              <div className="dispatch-header">
                <div className="dispatch-icon-wrap">⚡</div>
                <div>
                  <h3 className="dispatch-title">Dispatch Work Order</h3>
                  <p className="dispatch-sub">Assign priority tickets to maintenance crew</p>
                </div>
              </div>

              <form className="dispatch-form" onSubmit={handleScheduleSubmit}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Target Machine</label>
                  <select
                    className="form-select-modern"
                    value={form.machineId}
                    onChange={e => setForm({ ...form, machineId: Number(e.target.value) })}
                  >
                    {state.machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.machineCode}) - Status: {m.status}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Scheduled Date</label>
                  <input
                    type="date"
                    className="form-input-modern"
                    value={form.scheduledDate}
                    onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Lead Engineer</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    placeholder="e.g., Rajesh Sharma (Sr. Tech)"
                    value={form.engineerName}
                    onChange={e => setForm({ ...form, engineerName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Work Order Classification</label>
                  <select
                    className="form-select-modern"
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                  >
                    <option value="PREVENTIVE">🛡️ Preventive Maintenance</option>
                    <option value="CORRECTIVE">🔧 Corrective Breakdown Action</option>
                    <option value="AI_RECOMMENDED">🤖 AI Telemetry Prescribed Fix</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Technical Notes & Directive</label>
                  <textarea
                    className="form-textarea-modern"
                    rows={3}
                    placeholder="Provide diagnostic directives or parts replacement checklist..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="dispatch-summary-box">
                  <div className="summary-row">
                    <span>Estimated Labor & Spares:</span>
                    <strong className="text-cyan">
                      {form.type === 'PREVENTIVE' ? '₹20,750 ($250)' : form.type === 'AI_RECOMMENDED' ? '₹33,200 ($400)' : '₹49,800 ($600)'}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Priority Level:</span>
                    <strong style={{ color: form.type === 'CORRECTIVE' ? '#ff3b6a' : '#00e68a' }}>
                      {form.type === 'CORRECTIVE' ? 'HIGH PRIORITY' : 'ROUTINE'}
                    </strong>
                  </div>
                </div>

                <button className="btn-dispatch-submit" type="submit">
                  <span>🚀 Dispatch Work Order</span>
                </button>
              </form>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default MaintenanceInventoryView;

