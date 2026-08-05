import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useApp } from '../context/AppContext';

const mockMonthlyData = [
  { month: 'Jan', recycledBottles: 240000, yarnProduced: 8500, co2Saved: 12000, waterSaved: 36000 },
  { month: 'Feb', recycledBottles: 300000, yarnProduced: 10200, co2Saved: 15000, waterSaved: 45000 },
  { month: 'Mar', recycledBottles: 350000, yarnProduced: 12000, co2Saved: 17500, waterSaved: 52500 },
  { month: 'Apr', recycledBottles: 280000, yarnProduced: 9500, co2Saved: 14000, waterSaved: 42000 },
  { month: 'May', recycledBottles: 420000, yarnProduced: 14500, co2Saved: 21000, waterSaved: 63000 },
  { month: 'Jun', recycledBottles: 490000, yarnProduced: 16800, co2Saved: 24500, waterSaved: 73500 },
  { month: 'Jul', recycledBottles: 510000, yarnProduced: 17500, co2Saved: 25500, waterSaved: 76500 },
];

const SustainabilityDashboard: React.FC = () => {
  const { state } = useApp();
  const [liveBottles, setLiveBottles] = useState(1284560);
  const [liveYarn, setLiveYarn] = useState(45290.4);
  const [liveCo2, setLiveCo2] = useState(64228.0);
  const [liveWater, setLiveWater] = useState(192684.0);

  // Real-time ticking based on running machines
  useEffect(() => {
    const runningCount = state.machines.filter(m => m.status === 'RUNNING').length;
    if (runningCount === 0) return;

    const interval = setInterval(() => {
      // 1 machine produces ~1.5 kg yarn per second, equivalent to recycling ~75 PET bottles
      const bottlesRecycledPerSec = runningCount * 65;
      const yarnProducedPerSec = runningCount * 1.3;
      
      setLiveBottles(prev => prev + bottlesRecycledPerSec);
      setLiveYarn(prev => prev + yarnProducedPerSec);
      setLiveCo2(prev => prev + (yarnProducedPerSec * 1.42)); // 1.42 kg CO2 saved per kg recycled yarn
      setLiveWater(prev => prev + (yarnProducedPerSec * 4.25)); // 4.25 L water saved per kg recycled yarn
    }, 1000);

    return () => clearInterval(interval);
  }, [state.machines]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,PET Bottles Recycled,Yarn Produced (kg),CO2 Saved (kg),Water Saved (Liters)\n"
      + mockMonthlyData.map(d => `${d.month},${d.recycledBottles},${d.yarnProduced},${d.co2Saved},${d.waterSaved}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sustainability_Report_Shree_Renga_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* Overview Metric Grid */}
      <div className="kpi-panel">
        <div className="kpi-card kpi-card-emerald">
          <div className="kpi-card-icon" style={{ color: '#00e68a' }}>♻️</div>
          <div className="kpi-card-body">
            <h3>PET Bottles Recycled</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.9rem' }}>
              {liveBottles.toLocaleString()}
            </p>
            <p className="kpi-sub" style={{ color: '#00e68a' }}>Live counter ticking...</p>
          </div>
        </div>

        <div className="kpi-card kpi-card-cyan">
          <div className="kpi-card-icon" style={{ color: '#00d4ff' }}>🧵</div>
          <div className="kpi-card-body">
            <h3>Polyester Yarn</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.9rem' }}>
              {liveYarn.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg</span>
            </p>
            <p className="kpi-sub">Total recycled output</p>
          </div>
        </div>

        <div className="kpi-card kpi-card-blue">
          <div className="kpi-card-icon" style={{ color: '#3b82f6' }}>🌱</div>
          <div className="kpi-card-body">
            <h3>CO₂ Offset</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.9rem' }}>
              {liveCo2.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg</span>
            </p>
            <p className="kpi-sub" style={{ color: '#00d4ff' }}>Equivalent to 2,900 trees planted</p>
          </div>
        </div>

        <div className="kpi-card kpi-card-amber">
          <div className="kpi-card-icon" style={{ color: '#ffb020' }}>💧</div>
          <div className="kpi-card-body">
            <h3>Water Conserved</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.9rem' }}>
              {liveWater.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>L</span>
            </p>
            <p className="kpi-sub">Saved vs Virgin process</p>
          </div>
        </div>
      </div>

      {/* Details charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="chart-card">
          <h3>PET Recycling Trends (Monthly Volume)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mockMonthlyData}>
              <defs>
                <linearGradient id="colorRecycle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e68a" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00e68a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8b9dc3', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b9dc3', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="recycledBottles" stroke="#00e68a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRecycle)" name="Bottles Recycled" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Yarn Output vs Resource Savings</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mockMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8b9dc3', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b9dc3', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="yarnProduced" fill="#00d4ff" radius={[4, 4, 0, 0]} name="Yarn Produced (kg)" />
              <Bar dataKey="co2Saved" fill="#ffb020" radius={[4, 4, 0, 0]} name="CO2 Saved (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sustainability Actions Footer */}
      <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ color: '#f0f4f8', marginBottom: '0.2rem' }}>Shree Renga Polyester Sustainability Standards</h4>
          <p style={{ color: '#8b9dc3', fontSize: '0.78rem' }}>All metrics correspond to certified ISO 14044 Life Cycle Assessment (LCA) standards for recycled products.</p>
        </div>
        <button className="btn-add-machine" onClick={handleExport}>
          📥 Export Sustainability Report
        </button>
      </div>
    </div>
  );
};

export default SustainabilityDashboard;
