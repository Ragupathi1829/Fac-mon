import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useApp } from '../context/AppContext';

const mockMonthlyData = [
  { month: 'Jan', recycledBottles: 240000, yarnProduced: 8500, co2Saved: 12000, waterSaved: 36000, energyConsumption: 42000, greenPowerPct: 62 },
  { month: 'Feb', recycledBottles: 300000, yarnProduced: 10200, co2Saved: 15000, waterSaved: 45000, energyConsumption: 48000, greenPowerPct: 68 },
  { month: 'Mar', recycledBottles: 350000, yarnProduced: 12000, co2Saved: 17500, waterSaved: 52500, energyConsumption: 51000, greenPowerPct: 74 },
  { month: 'Apr', recycledBottles: 280000, yarnProduced: 9500, co2Saved: 14000, waterSaved: 42000, energyConsumption: 41000, greenPowerPct: 70 },
  { month: 'May', recycledBottles: 420000, yarnProduced: 14500, co2Saved: 21000, waterSaved: 63000, energyConsumption: 59000, greenPowerPct: 82 },
  { month: 'Jun', recycledBottles: 490000, yarnProduced: 16800, co2Saved: 24500, waterSaved: 73500, energyConsumption: 64000, greenPowerPct: 88 },
  { month: 'Jul', recycledBottles: 510000, yarnProduced: 17500, co2Saved: 25500, waterSaved: 76500, energyConsumption: 66000, greenPowerPct: 91 },
];

interface GovtScheme {
  code: string;
  name: string;
  authority: string;
  badge: string;
  rating: string;
  metric: string;
  status: 'COMPLIANT' | 'QUALIFIED' | 'SURPLUS' | 'CERTIFIED';
  subsidyEligible: string;
  details: string;
  compliancePercentage: number;
}

// National Government Schemes Compliance Data
const GOVT_SCHEMES: GovtScheme[] = [
  {
    code: 'BEE-SEC',
    name: 'BEE Star Rating Scheme (India)',
    authority: 'Bureau of Energy Efficiency · Ministry of Power',
    badge: '5-STAR GOLD',
    rating: '⭐⭐⭐⭐⭐ 5 Star Rated',
    metric: '0.42 kWh/kg (National Benchmark: <0.55 kWh/kg)',
    status: 'COMPLIANT',
    subsidyEligible: '₹12.5 Lakhs Annual State Grid Tariff Rebate',
    details: 'Verified by third-party energy auditor. Specific energy consumption (SEC) reduced by 23.6% compared to baseline year.',
    compliancePercentage: 98,
  },
  {
    code: 'PLI-CLEAN',
    name: 'PLI Clean Manufacturing Scheme',
    authority: 'Ministry of Heavy Industries & Textile Board',
    badge: 'TIER-1 LEADER',
    rating: 'Tier-1 Certified',
    metric: '92.4% Post-Consumer Recycled PET Ingestion',
    status: 'QUALIFIED',
    subsidyEligible: '4% Production Linked Direct Incentive Active',
    details: 'Meets automated circularity audit rules with direct blockchain-verified batch tracking of recycled rPET chips.',
    compliancePercentage: 94,
  },
  {
    code: 'PAT-ESCERT',
    name: 'PAT Scheme Cycle VI (Perform, Achieve & Trade)',
    authority: 'Ministry of Power & Energy Management Centre',
    badge: 'SURPLUS CREDITS',
    rating: '+340 ESCerts Accrued',
    metric: '18% Energy Intensity Reduction',
    status: 'SURPLUS',
    subsidyEligible: '₹34 Lakhs Tradable ESCerts on IEX Energy Exchange',
    details: 'Achieved target 9 months ahead of compliance deadline. Energy savings certificates issued for trading on power exchanges.',
    compliancePercentage: 100,
  },
  {
    code: 'ISO-14001',
    name: 'ISO 14001:2015 & ISO 50001:2018',
    authority: 'International Organization for Standardization · TUV Nord',
    badge: 'AUDIT PASSED',
    rating: 'Zero Non-Conformity Audit',
    metric: 'Carbon Footprint Neutral Roadmap: 2028 Target',
    status: 'CERTIFIED',
    subsidyEligible: 'Global Green Export Tariff Exemption (EU/US)',
    details: 'Zero liquid discharge (ZLD) closed-loop recycling water filtration active with 99.2% water reuse efficiency.',
    compliancePercentage: 96,
  },
];

const SustainabilityDashboard: React.FC = () => {
  const { state } = useApp();
  const [liveBottles, setLiveBottles] = useState(1284560);
  const [liveYarn, setLiveYarn] = useState(45290.4);
  const [liveCo2, setLiveCo2] = useState(64228.0);
  const [liveWater, setLiveWater] = useState(192684.0);
  const [selectedScheme, setSelectedScheme] = useState<GovtScheme | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schemes' | 'analytics'>('overview');

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
      + "Govt Scheme,Authority,Status,Rating,Metric,Eligible Incentive,Audit Details\n"
      + GOVT_SCHEMES.map(s => `"${s.name}","${s.authority}","${s.status}","${s.rating}","${s.metric}","${s.subsidyEligible}","${s.details}"`).join("\n")
      + "\n\nMonth,PET Bottles Recycled,Yarn Produced (kg),CO2 Saved (kg),Water Saved (Liters),Energy (kWh),Green Power %\n"
      + mockMonthlyData.map(d => `${d.month},${d.recycledBottles},${d.yarnProduced},${d.co2Saved},${d.waterSaved},${d.energyConsumption},${d.greenPowerPct}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `National_BEE_PLI_Compliance_Audit_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runningMachinesCount = state.machines.filter(m => m.status === 'RUNNING').length;

  return (
    <div className="sustainability-view-root">
      {/* ── Top Hero Banner with Live ESG Badges ── */}
      <div className="sustainability-hero-card">
        <div className="hero-content-left">
          <div className="hero-badge-strip">
            <span className="badge-pill-verified">
              <span className="verified-dot" />
              BEE & PLI CERTIFIED COMPLIANT
            </span>
            <span className="badge-pill-iso">ISO 50001:2018</span>
            <span className="badge-pill-live">
              ⚡ {runningMachinesCount} Active Eco-Lines
            </span>
          </div>

          <h2 className="sustainability-hero-title">
            Clean Manufacturing & Circular Economy Intelligence
          </h2>
          <p className="sustainability-hero-desc">
            Autonomous carbon tracking, Bureau of Energy Efficiency (BEE) 5-star validation, and National PLI subsidy compliance portal for eco-textile processing.
          </p>
        </div>

        <div className="hero-actions-right">
          <button 
            className="btn-export-audit"
            onClick={handleExport}
            title="Download full CSV dataset"
          >
            <span className="btn-icon">📄</span>
            <span>Export Govt Audit CSV</span>
          </button>
        </div>
      </div>

      {/* ── View Navigation Tabs ── */}
      <div className="sustainability-nav-strip">
        <button 
          className={`sustain-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span>🌱</span> Live Real-time Impact
        </button>
        <button 
          className={`sustain-tab-btn ${activeTab === 'schemes' ? 'active' : ''}`}
          onClick={() => setActiveTab('schemes')}
        >
          <span>🏛️</span> National Schemes & Subsidies ({GOVT_SCHEMES.length})
        </button>
        <button 
          className={`sustain-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span>📈</span> Energy & CO₂ Trends
        </button>
      </div>

      {/* ── 1. Live Overview Metrics & Gauge Cards ── */}
      {(activeTab === 'overview' || activeTab === 'analytics') && (
        <div className="sustain-metric-grid">
          {/* Card 1: PET Bottles Recycled */}
          <div className="sustain-stat-card card-emerald">
            <div className="stat-card-header">
              <div className="stat-card-icon-wrap">♻️</div>
              <span className="stat-card-tag tag-emerald">+12.4% vs Last Shift</span>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">PET Bottles Diverted</span>
              <div className="stat-card-num-row">
                <span className="stat-card-number font-mono">{liveBottles.toLocaleString()}</span>
                <span className="stat-card-unit">units</span>
              </div>
              <div className="stat-progress-bar-wrap">
                <div className="stat-progress-bar-fill fill-emerald" style={{ width: '88%' }} />
              </div>
              <span className="stat-card-sub">Daily Shift Target: 1.5M Units (88% Reached)</span>
            </div>
          </div>

          {/* Card 2: Yarn Produced & Energy Intensity */}
          <div className="sustain-stat-card card-cyan">
            <div className="stat-card-header">
              <div className="stat-card-icon-wrap">⚡</div>
              <span className="stat-card-tag tag-cyan">BEE 5-STAR LEADER</span>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">Specific Energy Consumption</span>
              <div className="stat-card-num-row">
                <span className="stat-card-number font-mono">0.42</span>
                <span className="stat-card-unit">kWh / kg</span>
              </div>
              <div className="stat-progress-bar-wrap">
                <div className="stat-progress-bar-fill fill-cyan" style={{ width: '92%' }} />
              </div>
              <span className="stat-card-sub">Produced {liveYarn.toFixed(1)} kg virgin-grade rPET yarn</span>
            </div>
          </div>

          {/* Card 3: CO2 Saved */}
          <div className="sustain-stat-card card-blue">
            <div className="stat-card-header">
              <div className="stat-card-icon-wrap">🌍</div>
              <span className="stat-card-tag tag-blue">PAT VI: +340 ESCerts</span>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">Net Carbon Offset</span>
              <div className="stat-card-num-row">
                <span className="stat-card-number font-mono">{(liveCo2 / 1000).toFixed(2)}</span>
                <span className="stat-card-unit">Tonnes CO₂e</span>
              </div>
              <div className="stat-progress-bar-wrap">
                <div className="stat-progress-bar-fill fill-blue" style={{ width: '95%' }} />
              </div>
              <span className="stat-card-sub">Equivalent to planting ~2,840 mature trees</span>
            </div>
          </div>

          {/* Card 4: Water Conserved */}
          <div className="sustain-stat-card card-amber">
            <div className="stat-card-header">
              <div className="stat-card-icon-wrap">💧</div>
              <span className="stat-card-tag tag-amber">ZLD 99.2% RECIRCULATION</span>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">Water Recycled & Conserved</span>
              <div className="stat-card-num-row">
                <span className="stat-card-number font-mono">{(liveWater / 1000).toFixed(1)}</span>
                <span className="stat-card-unit">kL Saved</span>
              </div>
              <div className="stat-progress-bar-wrap">
                <div className="stat-progress-bar-fill fill-amber" style={{ width: '91%' }} />
              </div>
              <span className="stat-card-sub">Zero discharge system active on washing line</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Government Schemes Compliance Grid ── */}
      {(activeTab === 'overview' || activeTab === 'schemes') && (
        <div className="sustain-section-card">
          <div className="sustain-section-header">
            <div>
              <h3 className="section-title">🏛️ National Subsidy & Regulatory Compliance Verification</h3>
              <p className="section-subtitle">Real-time status of central government schemes, carbon credits, and tariff rebates.</p>
            </div>
            <span className="compliance-status-badge">100% AUDIT READY</span>
          </div>

          <div className="schemes-interactive-grid">
            {GOVT_SCHEMES.map(scheme => {
              const isSelected = selectedScheme?.code === scheme.code;
              return (
                <div 
                  key={scheme.code}
                  className={`scheme-modern-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedScheme(isSelected ? null : scheme)}
                >
                  <div className="scheme-card-top">
                    <span className="scheme-code-badge">{scheme.code}</span>
                    <span className={`scheme-status-pill status-${scheme.status.toLowerCase()}`}>
                      {scheme.status}
                    </span>
                  </div>

                  <h4 className="scheme-card-name">{scheme.name}</h4>
                  <p className="scheme-card-authority">{scheme.authority}</p>

                  <div className="scheme-metric-pillbox">
                    <div className="metric-primary-row">
                      <span className="metric-rating">{scheme.rating}</span>
                    </div>
                    <p className="metric-detail-text">{scheme.metric}</p>
                  </div>

                  <div className="scheme-compliance-row">
                    <div className="compliance-text-wrap">
                      <span>Compliance Score</span>
                      <span className="compliance-pct">{scheme.compliancePercentage}%</span>
                    </div>
                    <div className="compliance-bar-track">
                      <div 
                        className="compliance-bar-thumb" 
                        style={{ width: `${scheme.compliancePercentage}%` }} 
                      />
                    </div>
                  </div>

                  <div className="scheme-subsidy-footer">
                    <div className="subsidy-badge">
                      <span>💰</span>
                      <span>{scheme.subsidyEligible}</span>
                    </div>
                    <span className="scheme-expand-arrow">{isSelected ? '▲' : '▼'}</span>
                  </div>

                  {isSelected && (
                    <div className="scheme-expanded-tray">
                      <p className="tray-details">{scheme.details}</p>
                      <div className="tray-actions">
                        <button className="btn-tray-audit" onClick={(e) => { e.stopPropagation(); handleExport(); }}>
                          ⬇️ Download Certificate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. High-Tech Analytics Charts ── */}
      {(activeTab === 'overview' || activeTab === 'analytics') && (
        <div className="sustain-charts-row">
          {/* Chart 1: PET Recycling Volume */}
          <div className="sustain-chart-card">
            <div className="chart-title-row">
              <div>
                <h4 className="chart-headline">PET Recycling & Recovery Trajectory</h4>
                <p className="chart-subline">Monthly volume throughput (bottles processed)</p>
              </div>
              <span className="chart-badge-glow">📈 +112% YTD</span>
            </div>
            
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMonthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRecycleGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e68a" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00e68a" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#5e8391" tick={{ fill: '#8ca6b2', fontSize: 11 }} />
                  <YAxis stroke="#5e8391" tick={{ fill: '#8ca6b2', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(8, 24, 32, 0.95)', 
                      border: '1px solid rgba(0, 230, 138, 0.4)', 
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      fontSize: '0.8rem'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="recycledBottles" 
                    stroke="#00e68a" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRecycleGlow)" 
                    name="Bottles Recycled" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Energy Consumption vs CO2 Saved */}
          <div className="sustain-chart-card">
            <div className="chart-title-row">
              <div>
                <h4 className="chart-headline">BEE Energy Intensity vs Carbon Offsets</h4>
                <p className="chart-subline">Comparison of total kWh drawn vs net kg CO₂ neutralized</p>
              </div>
              <span className="chart-badge-glow" style={{ borderColor: '#00d4ff', color: '#00d4ff' }}>
                ⚡ 91% Green Grid
              </span>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMonthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#5e8391" tick={{ fill: '#8ca6b2', fontSize: 11 }} />
                  <YAxis stroke="#5e8391" tick={{ fill: '#8ca6b2', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(8, 24, 32, 0.95)', 
                      border: '1px solid rgba(0, 212, 255, 0.4)', 
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      fontSize: '0.8rem'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                  <Bar dataKey="energyConsumption" fill="#00d4ff" radius={[6, 6, 0, 0]} name="Grid Energy (kWh)" />
                  <Bar dataKey="co2Saved" fill="#00e68a" radius={[6, 6, 0, 0]} name="CO₂ Offsets (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SustainabilityDashboard;

