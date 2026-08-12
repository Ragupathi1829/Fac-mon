import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CATEGORY_COLORS: Record<string, string> = {
  GOVT_BEE: '#00e68a',
  GOVT_PLI: '#00d4ff',
  PCB_CLEARANCE: '#ffb020',
  SAFETY_LOTO: '#ff3b6a',
  MANUAL: '#3b82f6',
  REPORT: '#a78bfa',
};

const OFFICIAL_GOVT_DOCS = [
  { id: 101, title: 'BEE Star Rating Energy Audit Certificate 2026', category: 'GOVT_BEE', fileSize: '3.4 MB', uploadedDate: '2026-07-10', authority: 'Bureau of Energy Efficiency', status: 'VERIFIED' },
  { id: 102, title: 'PLI Clean Manufacturing Subsidy Approval (Form 4B)', category: 'GOVT_PLI', fileSize: '2.8 MB', uploadedDate: '2026-06-22', authority: 'Ministry of Heavy Industries', status: 'APPROVED' },
  { id: 103, title: 'Pollution Control Board Consent to Operate (CTO)', category: 'PCB_CLEARANCE', fileSize: '4.1 MB', uploadedDate: '2026-05-18', authority: 'State Pollution Control Board', status: 'VALID' },
  { id: 104, title: 'ISO 14001:2015 & ISO 50001 Environmental Audit', category: 'REPORT', fileSize: '5.2 MB', uploadedDate: '2026-07-30', authority: 'Bureau Veritas Certification', status: 'PASSED' },
  { id: 105, title: 'Lockout-Tagout (LOTO) Factory Safety & Inspector Compliance', category: 'SAFETY_LOTO', fileSize: '1.4 MB', uploadedDate: '2026-08-02', authority: 'Directorate of Industrial Safety', status: 'MANDATORY' },
  { id: 106, title: 'Smart Extruder Operating Manual & Sensor Schematics', category: 'MANUAL', fileSize: '4.8 MB', uploadedDate: '2026-05-12', authority: 'OEM Technical Support', status: 'ACTIVE' },
];

const DocumentCenterView: React.FC = () => {
  const [docsList, setDocsList] = useState(OFFICIAL_GOVT_DOCS);
  const [filter, setFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredDocs = docsList.filter(doc => filter === 'ALL' || doc.category === filter);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setFeedback(`Uploading ${file.name} to Govt Compliance Vault...`);
    setTimeout(() => {
      const newDoc = {
        id: Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: 'GOVT_BEE',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedDate: new Date().toISOString().split('T')[0],
        authority: 'Uploaded by Factory Owner',
        status: 'PENDING VERIFICATION',
      };
      setDocsList([newDoc, ...docsList]);
      setFeedback(`Successfully uploaded and submitted for audit verification.`);
      setTimeout(() => setFeedback(null), 3500);
    }, 1500);
  };

  const handleDownload = (docTitle: string) => {
    const csvContent = "data:text/plain;charset=utf-8," + encodeURIComponent(`OFFICIAL GOVERNMENT COMPLIANCE DOCUMENT\nTitle: ${docTitle}\nVerified by Ministry Audit Portal\nStatus: Official Record Valid`);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${docTitle.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-root">
      <Navbar />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Government Schemes & Compliance Document Center</h1>
          <p className="system-time">PULSE · BEE, PLI, PCB & ISO Regulatory Repositories</p>
        </header>

        <main className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.75rem' }}>
          
          {/* Left Panel: Filter Menu */}
          <aside className="alert-center" style={{ height: 'fit-content', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#f0f4f8', marginBottom: '0.5rem' }}>Compliance Vault</h3>
            {[
              { id: 'ALL', label: '📂 All Official Records' },
              { id: 'GOVT_BEE', label: '⚡ BEE Energy Audits' },
              { id: 'GOVT_PLI', label: '💰 PLI Subsidy Approvals' },
              { id: 'PCB_CLEARANCE', label: '🌱 PCB Consent (CTO)' },
              { id: 'SAFETY_LOTO', label: '🛡️ Inspector Safety (LOTO)' },
              { id: 'MANUAL', label: '📘 Machine Manuals' },
            ].map(item => (
              <button
                key={item.id}
                className={`filter-tab ${filter === item.id ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', display: 'block', padding: '0.55rem 0.85rem', fontSize: '0.78rem' }}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
            
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
              <label className="btn-add-machine" style={{ cursor: 'pointer', display: 'inline-flex', width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #00e68a, #00d4ff)', color: '#000', fontWeight: 800 }}>
                📤 Upload Compliance PDF
                <input type="file" style={{ display: 'none' }} onChange={handleSimulateUpload} />
              </label>
              {feedback && (
                <p style={{ fontSize: '0.72rem', color: '#00e68a', marginTop: '0.5rem', textAlign: 'center', fontWeight: 600 }}>{feedback}</p>
              )}
            </div>
          </aside>

          {/* Right Panel: Document List */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ color: '#ffffff' }}>Official Regulatory Certificates ({filteredDocs.length})</h3>
              <span style={{ fontSize: '0.75rem', color: '#00e68a', fontWeight: 700 }}>✅ All Certificates Audited & Current</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {filteredDocs.map(doc => {
                const color = CATEGORY_COLORS[doc.category] || '#64748b';
                return (
                  <div
                    key={doc.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s ease'
                    }}
                    className="document-card"
                  >
                    <div>
                      {/* Top Row: File icon and Category Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div style={{ color }}>
                          <FileIcon />
                        </div>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '0.18rem 0.6rem',
                          borderRadius: '12px',
                          background: `${color}20`,
                          color,
                          border: `1px solid ${color}40`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em'
                        }}>
                          {doc.status}
                        </span>
                      </div>
                      
                      {/* File Details */}
                      <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.3rem', lineHeight: 1.4, fontWeight: 700 }}>
                        {doc.title}
                      </h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.2rem' }}>
                        🏛️ {doc.authority}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Size: {doc.fileSize} • Uploaded: {doc.uploadedDate}
                      </p>
                    </div>

                    {/* Dedicated Download Button */}
                    <button
                      className="btn-submit"
                      style={{ 
                        width: '100%', 
                        textAlign: 'center', 
                        padding: '0.5rem', 
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        marginTop: '0.5rem',
                        borderRadius: '10px'
                      }}
                      onClick={() => handleDownload(doc.title)}
                    >
                      📥 Download Official Document
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      </div>

      <style>{`
        .document-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 212, 255, 0.3) !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
};

export default DocumentCenterView;
