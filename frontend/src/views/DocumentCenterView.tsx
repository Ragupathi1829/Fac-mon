import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ActivityTicker from '../components/ActivityTicker';
import { useApp } from '../context/AppContext';

const DocumentCenterView: React.FC = () => {
  const { state } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'MANUAL' | 'SAFETY' | 'REPORT' | 'INVOICE'>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredDocs = state.documents.filter(doc => filter === 'ALL' || doc.category === filter);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setFeedback(`Uploading ${file.name}...`);
    setTimeout(() => {
      setFeedback(`Successfully uploaded ${file.name} to Document Repository.`);
      setTimeout(() => setFeedback(null), 3000);
    }, 1500);
  };

  return (
    <div className="app-root">
      <Navbar />
      <ActivityTicker />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>📂 Document Center</h1>
          <p className="system-time">PULSE · Manuals & Compliance Records</p>
        </header>

        <main className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.75rem' }}>
          
          {/* Left Panel: Filter Menu */}
          <aside className="alert-center" style={{ height: 'fit-content', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#f0f4f8', marginBottom: '0.5rem' }}>Categories</h3>
            {(['ALL', 'MANUAL', 'SAFETY', 'REPORT', 'INVOICE'] as const).map(cat => (
              <button
                key={cat}
                className={`filter-tab ${filter === cat ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', display: 'block', padding: '0.5rem 0.85rem' }}
                onClick={() => setFilter(cat)}
              >
                {cat === 'ALL' ? '📂 All Files' : cat === 'MANUAL' ? '📖 Manuals' : cat === 'SAFETY' ? '🛡️ Safety Guides' : cat === 'REPORT' ? '📊 Reports' : '🧾 Invoices'}
              </button>
            ))}
            
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
              <label className="btn-add-machine" style={{ cursor: 'pointer', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                📁 Upload Document
                <input type="file" style={{ display: 'none' }} onChange={handleSimulateUpload} />
              </label>
              {feedback && (
                <p style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '0.5rem', textAlign: 'center' }}>{feedback}</p>
              )}
            </div>
          </aside>

          {/* Right Panel: Document List */}
          <div className="chart-card">
            <h3 style={{ marginBottom: '1rem' }}>📄 Repository Files ({filteredDocs.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    position: 'relative',
                    transition: 'all 0.25s'
                  }}
                  className="kpi-card"
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {doc.category === 'MANUAL' ? '📖' : doc.category === 'SAFETY' ? '🛡️' : doc.category === 'REPORT' ? '📊' : '🧾'}
                  </div>
                  <h4 style={{ fontSize: '0.85rem', color: '#f0f4f8', marginBottom: '0.25rem', lineHeight: 1.4 }}>{doc.title}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Size: {doc.fileSize} • Uploaded: {doc.uploadedDate}
                  </p>
                  
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem',
                      borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)'
                    }}>
                      {doc.category}
                    </span>
                    <a
                      href="#"
                      style={{ fontSize: '0.73rem', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}
                      onClick={e => { e.preventDefault(); alert(`Downloading ${doc.title}...`); }}
                    >
                      Download ↓
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default DocumentCenterView;
