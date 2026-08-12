import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useApp } from '../context/AppContext';

const mockMonthlyData = [
  { month: 'Jan', recycledBottles: 240000, yarnProduced: 8500, co2Saved: 12000, waterSaved: 36000, energyConsumption: 42000 },
  { month: 'Feb', recycledBottles: 300000, yarnProduced: 10200, co2Saved: 15000, waterSaved: 45000, energyConsumption: 48000 },
  { month: 'Mar', recycledBottles: 350000, yarnProduced: 12000, co2Saved: 17500, waterSaved: 52500, energyConsumption: 51000 },
  { month: 'Apr', recycledBottles: 280000, yarnProduced: 9500, co2Saved: 14000, waterSaved: 42000, energyConsumption: 41000 },
  { month: 'May', recycledBottles: 420000, yarnProduced: 14500, co2Saved: 21000, waterSaved: 63000, energyConsumption: 59000 },
  { month: 'Jun', recycledBottles: 490000, yarnProduced: 16800, co2Saved: 24500, waterSaved: 73500, energyConsumption: 64000 },
  { month: 'Jul', recycledBottles: 510000, yarnProduced: 17500, co2Saved: 25500, waterSaved: 76500, energyConsumption: 66000 },
];

// Government Schemes Compliance Data
const GOVT_SCHEMES = [
  {
    code: 'BEE-SEC',
    name: 'BEE Star Rating Scheme (India)',
    authority: 'Bureau of Energy Efficiency',
    rating: '⭐⭐⭐⭐⭐ 5 Star Rated',
    metric: '0.42 kWh/kg (Threshold: <0.55)',
    status: 'COMPLIANT',
    subsidyEligible: '₹12.5 Lakhs Annual Tariff Rebate',
  },
  {
    code: 'PLI-CLEAN',
    name: 'PLI Clean Manufacturing Scheme',
    authority: 'Ministry of Heavy Industries',
    rating: 'Tier-1 Certified',
    metric: '92.4% Recycled Input Material',
    status: 'QUALIFIED',
    subsidyEligible: '4% Production Subsidy Active',
  },
  {
    code: 'PAT-ESCERT',
    name: 'PAT Scheme Cycle VI (Perform, Achieve & Trade)',
    authority: 'Ministry of Power',
    rating: '+340 ESCerts Earned',
    metric: '18% Energy Intensity Reduction',
    status: 'SURPLUS',
    subsidyEligible: 'Tradable Carbon Credits Available',
  },
  {
    code: 'ISO-14001',
    name: 'ISO 14001:2015 & ISO 50001:2018',
    authority: 'International Organization for Standardization',
    rating: 'Audit Passed (Zero Non-Conformity)',
    metric: 'Carbon Footprint Neutral by 2028',
    status: 'CERTIFIED',
    subsidyEligible: 'Global Export Green Badge',
  },
];

const SustainabilityDashboard: React.FC = () => {
  const { state } = useApp();
  const [liveBottles, setLiveBottles] = useState(1284560);
  const [liveYarn, setLiveYarn] = useState(45290.4);
  const [liveCo2, setLiveCo2] = useState(64228.0);
  const [liveWater, setLiveWater] = useState(192684.0);
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);

  // Real-time ticking based on running machines
  useEffect(() => {
    const runningCount = state.machines.filter(m => m.status === 'RUNNING').length;
    if (runningCount === 0) return;

    const interval = setInterval(() => {
      const bottlesRecycledPerSec = runningCount * 65;
      const yarnProducedPerSec = runningCount * 1.3;
      
      setLiveBottles(prev => prev + bottlesRecycledPerSec);
      setLiveYarn(prev => prev + yarnProducedPerSec);
      setLiveCo2(prev => prev + (yarnProducedPerSec * 1.42));
      setLiveWater(prev => prev + (yarnProducedPerSec * 4.25));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.machines]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Govt Scheme,Authority,Status,Rating / Metric,Eligible Incentive\n"
      + GOVT_SCHEMES.map(s => `"${s.name}","${s.authority}","${s.status}","${s.rating} - ${s.metric}","${s.subsidyEligible}"`).join("\n")
      + "\n\nMonth,PET Bottles Recycled,Yarn Produced (kg),CO2 Saved (kg),Water Saved (Liters),Energy (kWh)\n"
      + mockMonthlyData.map(d => `${d.month},${d.recycledBottles},${d.yarnProduced},${d.co2Saved},${d.waterSaved},${d.energyConsumption}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Govt_BEE_PLI_Compliance_Report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* ── Government Compliance Header Banner ── */}
      <div 
        className="chart-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(0,230,138,0.1), rgba(0,212,255,0.06))',
          border: '1px solid rgba(0,230,138,0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.75rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span style={{ background: '#00e68a', color: '#000', fontWeight: 800, fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              GOVT APPROVED
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
              BEE & PLI Green Manufacturing Compliance Dashboard
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Live energy efficiency ratings and government subsidy tracking verified under Ministry of Power & Ministry of Heavy Industries guidelines.
          </p>
        </div>

        <button 
          className="btn-submit"
          onClick={handleExport}
          style={{ background: 'linear-gradient(135deg, #00e68a, #00d4ff)', color: '#000', fontWeight: 800, padding: '0.6rem 1.4rem' }}
        >
          📄 Download Govt Audit CSV
        </button>
      </div>

      {/* Overview Metric Grid */}
      <div className="kpi-panel">
        <div className="kpi-card kpi-card-emerald">
          <div className="kpi-card-icon" style={{ color: '#00e68a' }}>♻️</div>
          <div className="kpi-card-body">
            <h3>PET Material Recycled</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.8rem' }}>
              {liveBottles.toLocaleString()}
            </p>
            <p className="kpi-sub" style={{ color: '#00e68a' }}>Yarn Produced: {liveYarn.toFixed(1)} kg • Target Passed</p>
          </div>
        </div>

        <div className="kpi-card kpi-card-cyan">
          <div className="kpi-card-icon" style={{ color: '#00d4ff' }}>⚡</div>
          <div className="kpi-card-body">
            <h3>BEE Energy Rating</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.8rem' }}>
              5 Star <span style={{ fontSize: '0.8rem', color: '#00e68a' }}>0.42 kWh/kg</span>
            </p>
            <p className="kpi-sub" style={{ color: '#00d4ff' }}>Top 5% Energy Efficient Factory</p>
          </div>
        </div>

        <div className="kpi-card kpi-card-blue">
          <div className="kpi-card-icon" style={{ color: '#3b82f6' }}>🌱</div>
          <div className="kpi-card-body">
            <h3>CO₂ Offset</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.8rem' }}>
              {liveCo2.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg</span>
            </p>
            <p className="kpi-sub" style={{ color: '#00d4ff' }}>PAT Scheme: +340 ESCerts Earned</p>
          </div>
        </div>

        <div className="kpi-card kpi-card-amber">
          <div className="kpi-card-icon" style={{ color: '#ffb020' }}>💧</div>
          <div className="kpi-card-body">
            <h3>Water Conserved</h3>
            <p className="kpi-value" style={{ fontFamily: 'Inter, monospace', fontSize: '1.8rem' }}>
              {liveWater.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>L</span>
            </p>
            <p className="kpi-sub">Zero Liquid Discharge (ZLD) Active</p>
          </div>
        </div>
      </div>

      {/* ── Government Schemes Compliance Tracker ── */}
      <div className="chart-card">
        <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>🏛️ National Government Schemes & Subsidy Audit Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {GOVT_SCHEMES.map(scheme => (
            <div 
              key={scheme.code}
              style={{
                background: selectedScheme === scheme.code ? 'rgba(0,230,138,0.12)' : 'rgba(255,255,255,0.03)',
                border: selectedScheme === scheme.code ? '1px solid #00e68a' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setSelectedScheme(selectedScheme === scheme.code ? null : scheme.code)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'Inter, monospace' }}>
                  {scheme.code}
                </span>
                <span style={{ 
                  fontSize: '0.62rem', 
                  fontWeight: 800, 
                  padding: '0.15rem 0.55rem', 
                  borderRadius: '12px',
                  background: scheme.status === 'COMPLIANT' || scheme.status === 'QUALIFIED' || scheme.status === 'CERTIFIED' ? 'rgba(0,230,138,0.15)' : 'rgba(255,176,32,0.15)',
                  color: scheme.status === 'COMPLIANT' || scheme.status === 'QUALIFIED' || scheme.status === 'CERTIFIED' ? '#00e68a' : '#ffb020',
                  border: '1px solid rgba(0,230,138,0.3)'
                }}>
                  {scheme.status}
                </span>
              </div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>{scheme.name}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.75rem' }}>{scheme.authority}</p>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00d4ff' }}>{scheme.rating}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{scheme.metric}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#00e68a', fontWeight: 700 }}>
                <span>💰 {scheme.subsidyEligible}</span>
                <span>→</span>
              </div>
            </div>
          ))}
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
          <h3>BEE Energy Consumption (kWh) vs Savings</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mockMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8b9dc3', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b9dc3', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="energyConsumption" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Energy Used (kWh)" />
              <Bar dataKey="co2Saved" fill="#00e68a" radius={[4, 4, 0, 0]} name="CO2 Saved (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityDashboard;
