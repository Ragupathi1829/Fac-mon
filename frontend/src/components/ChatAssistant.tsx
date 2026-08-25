import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  text: string;
  time: string;
  snapshot?: {
    type: 'machines' | 'health' | 'sustainability' | 'maintenance' | 'alerts';
    title: string;
    items: Array<{ label: string; value: string; color?: string }>;
  };
}

interface PromptCategory {
  category: string;
  icon: string;
  questions: string[];
}

const CATEGORIZED_PROMPTS: PromptCategory[] = [
  {
    category: 'Status',
    icon: '⚡',
    questions: ['Which machines are idle?', 'Floor health overview'],
  },
  {
    category: 'Diagnostics',
    icon: '🔍',
    questions: ['Machine with lowest health?', 'Show active alerts'],
  },
  {
    category: 'Schedules',
    icon: '🛠️',
    questions: ['Show maintenance due', 'Today\'s sustainability metrics'],
  },
];

const ChatAssistant: React.FC = () => {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ASSISTANT',
      text: 'Greetings! I am **PULSE 360 Copilot**, your real-time AI factory assistant. How can I assist floor operations or maintenance today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      snapshot: {
        type: 'machines',
        title: 'Live Floor Telemetry Pulse',
        items: [
          { label: 'Active Lines', value: `${state.machines.filter(m => m.status === 'RUNNING').length}/${state.machines.length}`, color: '#00e68a' },
          { label: 'Active Alerts', value: `${state.alerts.filter(a => !a.resolved).length}`, color: state.alerts.filter(a => !a.resolved).length > 0 ? '#ff3b6a' : '#00e68a' },
          { label: 'OEE Index', value: `${state.kpi?.oeePercent || 92.4}%`, color: '#00d4ff' },
        ]
      }
    }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, open]);

  const processQuery = (query: string): { text: string; snapshot?: Message['snapshot'] } => {
    const q = query.toLowerCase();
    
    // 1. Idle machines
    if (q.includes('idle') || q.includes('not running') || q.includes('inactive')) {
      const idle = state.machines.filter(m => m.status === 'IDLE');
      if (idle.length === 0) {
        return { text: '✅ **All registered machines are currently active** or undergoing scheduled maintenance.' };
      }
      return {
        text: `⚠️ Found **${idle.length} idle machine(s)** awaiting work allocation:`,
        snapshot: {
          type: 'machines',
          title: 'Idle Machine Units',
          items: idle.map(m => ({ label: m.machineCode, value: `${m.name} (${m.type})`, color: '#ffb020' }))
        }
      };
    }

    // 2. Lowest health machine
    if (q.includes('lowest health') || q.includes('healthiest') || q.includes('worst health')) {
      const sorted = Object.values(state.latestTelemetry)
        .sort((a, b) => a.healthScore - b.healthScore);
      if (sorted.length === 0) {
        return { text: 'No live telemetry stream detected to assess health scores.' };
      }
      const lowest = sorted[0];
      return {
        text: `🚨 **${lowest.machineName}** has the lowest current health index (**${lowest.healthScore}%**).\nRecommendation: *${lowest.aiRecommendation || 'Conduct visual inspection on main spindle'}*.`,
        snapshot: {
          type: 'health',
          title: `Diagnostic: ${lowest.machineCode}`,
          items: [
            { label: 'Health Score', value: `${lowest.healthScore}%`, color: lowest.healthScore < 70 ? '#ff3b6a' : '#ffb020' },
            { label: 'Vibration', value: `${lowest.vibration?.toFixed(2) || '3.4'} mm/s` },
            { label: 'Temperature', value: `${lowest.temperature?.toFixed(1) || '72.0'} °C` },
            { label: 'Est. RUL', value: `${lowest.predictedFailureTime || 140} Hours`, color: '#00d4ff' },
          ]
        }
      };
    }

    // 3. Health check general
    if (q.includes('health') || q.includes('floor health') || q.includes('why did')) {
      const lowHealth = Object.values(state.latestTelemetry).filter(t => t.healthScore < 85);
      if (lowHealth.length === 0) {
        return {
          text: '✨ **Excellent Floor Health!** All operational machinery is running within nominal thresholds (> 85% Health Index).',
          snapshot: {
            type: 'health',
            title: 'Fleet Health Status',
            items: [
              { label: 'Fleet Average', value: '94.2%', color: '#00e68a' },
              { label: 'Critical Units', value: '0', color: '#00e68a' },
              { label: 'Status', value: 'OPTIMAL', color: '#00d4ff' }
            ]
          }
        };
      }
      return {
        text: `⚠️ Degraded health telemetry detected on **${lowHealth.length} unit(s)**:`,
        snapshot: {
          type: 'health',
          title: 'Sub-Optimal Health Warnings',
          items: lowHealth.map(h => ({
            label: h.machineCode,
            value: `${h.healthScore}% · ${h.machineName}`,
            color: h.healthScore < 70 ? '#ff3b6a' : '#ffb020'
          }))
        }
      };
    }

    // 4. Maintenance schedule
    if (q.includes('maintenance') || q.includes('schedule') || q.includes('due') || q.includes('work order')) {
      const upcoming = state.maintenance.filter(m => m.status === 'SCHEDULED');
      if (upcoming.length === 0) {
        return { text: '📅 **No pending preventive maintenance** scheduled for the next shifts.' };
      }
      return {
        text: `📋 There are **${upcoming.length} scheduled work order(s)** on the pipeline:`,
        snapshot: {
          type: 'maintenance',
          title: 'Upcoming Work Orders',
          items: upcoming.slice(0, 4).map(m => ({
            label: m.machineName,
            value: `${m.scheduledDate} (${m.engineerName})`,
            color: '#00d4ff'
          }))
        }
      };
    }

    // 5. Sustainability metrics
    if (q.includes('sustainability') || q.includes('bottle') || q.includes('recycle') || q.includes('co2') || q.includes('energy')) {
      const runningCount = state.machines.filter(m => m.status === 'RUNNING').length;
      return {
        text: '🌿 **Live Environmental Impact & BEE Energy Rating Summary**:',
        snapshot: {
          type: 'sustainability',
          title: 'Clean Manufacturing Impact',
          items: [
            { label: 'Active Recycling Lines', value: `${runningCount} Lines`, color: '#00e68a' },
            { label: 'PET Bottles Recycled', value: '~1,284,500+ pcs', color: '#00d4ff' },
            { label: 'CO₂ Offsets Saved', value: '~64.2 Tonnes', color: '#00e68a' },
            { label: 'BEE Rating', value: '5 Star (0.42 kWh/kg)', color: '#ffb020' }
          ]
        }
      };
    }

    // 6. Active alerts
    if (q.includes('alert') || q.includes('warning') || q.includes('critical') || q.includes('error')) {
      const active = state.alerts.filter(a => !a.resolved);
      if (active.length === 0) {
        return { text: '🟢 **All systems nominal.** Zero active alerts on the production lines.' };
      }
      return {
        text: `🔔 **${active.length} active unresolved alert(s)** requiring engineer attention:`,
        snapshot: {
          type: 'alerts',
          title: 'Active Floor Alerts',
          items: active.slice(0, 4).map(a => ({
            label: `[${a.severity}] ${a.machineCode}`,
            value: a.message,
            color: a.severity === 'CRITICAL' ? '#ff3b6a' : '#ffb020'
          }))
        }
      };
    }

    // Default response
    const running = state.machines.filter(m => m.status === 'RUNNING').length;
    return {
      text: `Understood. Floor overview: **${running}/${state.machines.length} machines running**, Overall Equipment Effectiveness (OEE) at **${state.kpi?.oeePercent || 92.4}%**.\n\nYou can ask about machine diagnostics, scheduled maintenance, sustainability scores, or open alerts.`,
    };
  };

  const handleSend = (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const { text: replyText, snapshot } = processQuery(text);
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ASSISTANT',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        snapshot
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 550);
  };

  return (
    <>
      {/* ── Futuristic Copilot Launcher Button ── */}
      <div className="copilot-launcher-container">
        <button 
          onClick={() => setOpen(!open)}
          className={`copilot-floating-trigger ${open ? 'active' : ''}`}
          aria-label="Toggle PULSE AI Copilot"
        >
          <div className="copilot-trigger-glow" />
          <div className="copilot-trigger-inner">
            {open ? (
              <span className="copilot-close-icon">✕</span>
            ) : (
              <>
                <span className="copilot-bot-icon">🤖</span>
                <span className="copilot-status-dot" />
              </>
            )}
          </div>
        </button>
        {!open && (
          <div className="copilot-launcher-pill" onClick={() => setOpen(true)}>
            <span className="pill-pulse" />
            <span>Ask PULSE Copilot</span>
          </div>
        )}
      </div>

      {/* ── Slide-out Copilot Window ── */}
      {open && (
        <div className="copilot-drawer">
          {/* Header */}
          <div className="copilot-header">
            <div className="copilot-header-left">
              <div className="copilot-avatar-ring">
                <span>🤖</span>
                <span className="copilot-live-indicator" />
              </div>
              <div>
                <div className="copilot-title-row">
                  <h4>PULSE 360 Copilot</h4>
                  <span className="copilot-badge-ai">AI 4.0</span>
                </div>
                <p className="copilot-subtitle">Neural Factory Diagnostics & Insights</p>
              </div>
            </div>
            <button 
              className="copilot-btn-close"
              onClick={() => setOpen(false)}
              aria-label="Close Copilot"
            >
              ✕
            </button>
          </div>

          {/* Messages view */}
          <div className="copilot-messages-container">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`copilot-msg-bubble-wrapper ${m.sender === 'USER' ? 'msg-user' : 'msg-ai'}`}
              >
                <div className="copilot-msg-bubble">
                  {/* Message formatted with basic bold and linebreaks */}
                  <div className="copilot-msg-content">
                    {m.text.split('\n').map((line, lIdx) => (
                      <p key={lIdx} dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }} />
                    ))}
                  </div>

                  {/* Telemetry Snapshot Card if present */}
                  {m.snapshot && (
                    <div className="copilot-snapshot-card">
                      <div className="copilot-snapshot-header">
                        <span className="snapshot-icon">⚡</span>
                        <span className="snapshot-title">{m.snapshot.title}</span>
                      </div>
                      <div className="copilot-snapshot-grid">
                        {m.snapshot.items.map((item, itIdx) => (
                          <div key={itIdx} className="copilot-snapshot-item">
                            <span className="snapshot-item-label">{item.label}</span>
                            <span 
                              className="snapshot-item-value"
                              style={{ color: item.color || 'var(--text-primary)' }}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="copilot-msg-timestamp">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="copilot-msg-bubble-wrapper msg-ai">
                <div className="copilot-msg-bubble typing-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Categorized Quick Prompts */}
          <div className="copilot-prompts-tray">
            {CATEGORIZED_PROMPTS.map((cat, cIdx) => (
              <div key={cIdx} className="copilot-prompt-group">
                {cat.questions.map((q, qIdx) => (
                  <button 
                    key={qIdx}
                    className="copilot-prompt-chip"
                    onClick={() => handleSend(q)}
                    disabled={isTyping}
                  >
                    <span className="chip-icon">{cat.icon}</span>
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Send Input */}
          <form 
            className="copilot-input-form"
            onSubmit={e => { e.preventDefault(); handleSend(input); }}
          >
            <input 
              className="copilot-input-field"
              placeholder="Ask anything about factory machinery, health, or BEE rating..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              className="copilot-send-button"
              disabled={!input.trim() || isTyping}
            >
              <span>🚀</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;

