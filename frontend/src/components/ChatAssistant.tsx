import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface Message {
  sender: 'USER' | 'ASSISTANT';
  text: string;
  time: string;
}

const PRESET_QUESTIONS = [
  'Which machines are idle?',
  'Why did health drop?',
  'Which machine has lowest health?',
  'Show maintenance due this week',
  'What are today\'s sustainability metrics?',
];

const ChatAssistant: React.FC = () => {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ASSISTANT', text: 'Hello! I am your PULSE Industry 4.0 AI Assistant. How can I help you manage the factory floor today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const processQuery = (query: string): string => {
    const q = query.toLowerCase();
    
    // 1. Idle machines
    if (q.includes('idle') || q.includes('not running') || q.includes('inactive')) {
      const idle = state.machines.filter(m => m.status === 'IDLE');
      if (idle.length === 0) return 'All registered machines are currently active or undergoing maintenance.';
      return `There are currently ${idle.length} idle machines: ${idle.map(m => `${m.name} (${m.machineCode})`).join(', ')}.`;
    }

    // 2. Lowest health machine
    if (q.includes('lowest health') || q.includes('healthiest') || q.includes('worst health')) {
      const sorted = Object.values(state.latestTelemetry)
        .sort((a, b) => a.healthScore - b.healthScore);
      if (sorted.length === 0) return 'No telemetry data is available to assess health scores.';
      const lowest = sorted[0];
      return `The machine with the lowest health score is ${lowest.machineName} (${lowest.machineCode}) at ${lowest.healthScore}% health. Recommendation: ${lowest.aiRecommendation || 'Nominal diagnostics'}.`;
    }

    // 3. Health check general
    if (q.includes('health') || q.includes('why did')) {
      const lowHealth = Object.values(state.latestTelemetry).filter(t => t.healthScore < 85);
      if (lowHealth.length === 0) return 'All machines are operating with excellent health indices (above 85%).';
      return `Degraded health detected on ${lowHealth.length} components: ${lowHealth.map(h => `${h.machineName} is at ${h.healthScore}% due to excessive sensor readings`).join(', ')}.`;
    }

    // 4. Maintenance schedule
    if (q.includes('maintenance') || q.includes('schedule') || q.includes('due')) {
      const upcoming = state.maintenance.filter(m => m.status === 'SCHEDULED');
      if (upcoming.length === 0) return 'There is no preventive maintenance scheduled for the upcoming shifts.';
      return `Upcoming maintenance orders: \n` + upcoming.map(m => `- ${m.machineName} on ${m.scheduledDate} by ${m.engineerName} (${m.notes})`).join('\n');
    }

    // 5. Sustainability metrics
    if (q.includes('sustainability') || q.includes('bottle') || q.includes('recycle') || q.includes('co2')) {
      const runningCount = state.machines.filter(m => m.status === 'RUNNING').length;
      return `Shree Renga Polyester Plant Sustainability summary: \n` +
             `- Active recycling lines: ${runningCount}\n` +
             `- Estimated PET bottles processed today: ~1,280,000+ units\n` +
             `- Estimated carbon offsets saved: ~64.2 tonnes CO₂ equivalents.`;
    }

    // 6. Active alerts
    if (q.includes('alert') || q.includes('warning') || q.includes('critical') || q.includes('error')) {
      const active = state.alerts.filter(a => !a.resolved);
      if (active.length === 0) return 'All systems nominal. No unresolved alerts on the floor.';
      return `There are currently ${active.length} active alerts:\n` + active.map(a => `- [${a.severity}] on ${a.machineCode}: ${a.message}`).join('\n');
    }

    // Default response
    return `Understood. Currently, there are ${state.machines.length} total registered machines in Factory Floor A. ` +
           `${state.machines.filter(m => m.status === 'RUNNING').length} are actively running, and OEE stands at ${state.kpi?.oeePercent || 92}%. ` +
           `Let me know if you need specific advice on maintenance, telemetry warnings, or shift operations.`;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = {
      sender: 'USER',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const assistantText = processQuery(text);
      const assistantMsg: Message = {
        sender: 'ASSISTANT',
        text: assistantText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 600);
  };

  return (
    <>
      {/* Drawer Button */}
      <button 
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
          border: 'none', color: '#000', fontSize: '1.5rem', cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(0,230,138,0.3)', zIndex: 190,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.25s'
        }}
        onClick={() => setOpen(!open)}
        className="chat-toggle-btn"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Slide-out Drawer */}
      {open && (
        <div 
          style={{
            position: 'fixed', top: '80px', right: '24px', bottom: '100px',
            width: '380px', background: 'var(--bg-secondary)', 
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--border-radius-lg)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            zIndex: 180, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}
        >
          {/* Drawer Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <div>
              <h4 style={{ color: '#f0f4f8' }}>PULSE AI Assistant</h4>
              <p style={{ color: 'var(--accent-emerald)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Online • Copilot Engine</p>
            </div>
          </div>

          {/* Messages view */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {messages.map((m, i) => (
              <div 
                key={i} 
                style={{ 
                  alignSelf: m.sender === 'USER' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%', display: 'flex', flexDirection: 'column',
                  alignItems: m.sender === 'USER' ? 'flex-end' : 'flex-start'
                }}
              >
                <div 
                  style={{
                    background: m.sender === 'USER' ? 'var(--accent-cyan-glow)' : 'rgba(255,255,255,0.04)',
                    color: m.sender === 'USER' ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    border: `1px solid ${m.sender === 'USER' ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    padding: '0.6rem 0.85rem', borderRadius: '12px', fontSize: '0.78rem',
                    lineHeight: 1.4, whiteSpace: 'pre-line'
                  }}
                >
                  {m.text}
                </div>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>{m.time}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick presets */}
          <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.4rem', overflowX: 'auto', whiteSpace: 'nowrap' }} className="chat-presets">
            {PRESET_QUESTIONS.map((q, i) => (
              <button 
                key={i} 
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--text-secondary)', padding: '0.25rem 0.6rem', borderRadius: '20px',
                  fontSize: '0.66rem', cursor: 'pointer', fontFamily: 'inherit'
                }}
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Send Input */}
          <form 
            style={{ padding: '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem' }}
            onSubmit={e => { e.preventDefault(); handleSend(input); }}
          >
            <input 
              style={{
                flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-primary)', padding: '0.5rem 0.85rem', borderRadius: '10px',
                fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit'
              }}
              placeholder="Ask a question..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button 
              type="submit"
              style={{
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
                color: 'var(--accent-cyan)', padding: '0 0.85rem', borderRadius: '10px',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '0.78rem'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-presets::-webkit-scrollbar { display: none; }
        .chat-toggle-btn:hover {
          transform: scale(1.06);
        }
      `}</style>
    </>
  );
};

export default ChatAssistant;
