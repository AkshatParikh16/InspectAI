const { useState, useEffect } = React;

const SYSTEM_TYPES = [
  { id: 'CUSTOMER_SUPPORT', label: 'Customer Support', desc: 'Refund, return, shipping, escalation policies', icon: '💬' },
  { id: 'RAG',              label: 'RAG / Knowledge Base', desc: 'Retrieval accuracy, citation, hallucination', icon: '📚' },
  { id: 'MULTI_AGENT',      label: 'Multi-Agent Pipeline', desc: 'Tool use, task completion, cost/step limits', icon: '🤖' },
];

const MODELS = [
  'claude-sonnet-4-6',
  'claude-opus-4-8',
  'gpt-4o',
  'gpt-4o-mini',
  'gemini-2.0-flash',
  'llama-3.3-70b-instruct',
];

const COST_PER_SCENARIO = 0.012;

function CostBar({ label, value, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ fontSize: '12px', color: '#A0A0B8', minWidth: '130px' }}>{label}</div>
      <div style={{ flex: 1, height: '4px', background: '#2A2A3A', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#F1F1FA', minWidth: '50px', textAlign: 'right' }}>
        ${value.toFixed(2)}
      </div>
    </div>
  );
}

function RunTests({ onNavigate }) {
  const [selectedType, setSelectedType] = useState('CUSTOMER_SUPPORT');
  const [companyName, setCompanyName] = useState('QuickShop');
  const [industry, setIndustry] = useState('retail');
  const [targetModel, setTargetModel] = useState('claude-sonnet-4-6');
  const [targetEndpoint, setTargetEndpoint] = useState('https://api.yourcompany.com/chat');
  const [scenarioCount, setScenarioCount] = useState(50);
  const [useRealDocs, setUseRealDocs] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');

  const estimatedCost = dryRun ? 0 : scenarioCount * COST_PER_SCENARIO;
  const estimatedTime  = Math.ceil(scenarioCount * 0.8 / 60);

  function handleRun() {
    setRunning(true);
    setProgress(0);
    const phases = [
      'Initializing judge panel…',
      'Generating scenarios…',
      'Calling target AI…',
      'Running panel evaluation…',
      'Analyzing failures…',
      'Generating fix recommendations…',
    ];
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress(Math.min(step * 17, 100));
      setPhase(phases[Math.min(step - 1, phases.length - 1)]);
      if (step >= 6) {
        clearInterval(interval);
        setTimeout(() => {
          setRunning(false);
          setProgress(0);
          setPhase('');
          onNavigate('results');
        }, 800);
      }
    }, 600);
  }

  const card = { background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '12px', padding: '20px' };
  const labelStyle = { fontSize: '12px', color: '#A0A0B8', marginBottom: '6px', display: 'block' };
  const inputStyle = { width: '100%', background: '#1A1A26', border: '1px solid #2A2A3A', borderRadius: '8px', color: '#F1F1FA', fontSize: '13px', padding: '9px 12px' };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Run Tests</h1>
        <div style={{ fontSize: '13px', color: '#60607A' }}>Configure and launch an adversarial evaluation run</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* System type */}
          <div style={card}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '14px' }}>System Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SYSTEM_TYPES.map((st) => {
                const isSelected = selectedType === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedType(st.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '9px',
                      border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid #2A2A3A',
                      background: isSelected ? 'rgba(99,102,241,0.08)' : '#1A1A26',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{st.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: isSelected ? '#818CF8' : '#F1F1FA' }}>{st.label}</div>
                      <div style={{ fontSize: '11px', color: '#60607A', marginTop: '2px' }}>{st.desc}</div>
                    </div>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                      border: isSelected ? '5px solid #6366F1' : '2px solid #3A3A50',
                      transition: 'all 0.15s',
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target system */}
          <div style={card}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '14px' }}>Target System</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input
                  style={inputStyle}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <select style={inputStyle} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="retail">Retail / E-commerce</option>
                  <option value="finance">Finance / Banking</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="legal">Legal</option>
                  <option value="saas">SaaS / Tech</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Target AI Model</label>
                <select style={inputStyle} value={targetModel} onChange={(e) => setTargetModel(e.target.value)}>
                  {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>API Endpoint</label>
                <input
                  style={inputStyle}
                  value={targetEndpoint}
                  onChange={(e) => setTargetEndpoint(e.target.value)}
                  placeholder="https://api.yourcompany.com/chat"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>API Key</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-… (stored only in memory)"
                />
              </div>
            </div>
          </div>

          {/* Test configuration */}
          <div style={card}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '14px' }}>Test Configuration</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Scenario Count</label>
                <span style={{
                  fontSize: '14px', fontWeight: '700', color: '#818CF8',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {scenarioCount}
                </span>
              </div>
              <input
                type="range"
                min="10" max="500" step="10"
                value={scenarioCount}
                onChange={(e) => setScenarioCount(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#60607A', marginTop: '4px' }}>
                <span>10 (quick)</span><span>100 (standard)</span><span>500 (thorough)</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Use Real Documents for RAG Testing', desc: 'Upload PDFs or scrape company site for grounded scenarios', value: useRealDocs, setter: setUseRealDocs },
                { label: 'Dry Run (no AI calls)', desc: 'Validate config and preview cost estimate without spending credits', value: dryRun, setter: setDryRun },
              ].map(({ label, desc, value, setter }) => (
                <div
                  key={label}
                  onClick={() => setter(!value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px',
                    background: '#1A1A26',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: value ? '1px solid rgba(99,102,241,0.4)' : '1px solid #2A2A3A',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    width: '36px', height: '20px',
                    background: value ? '#6366F1' : '#2A2A3A',
                    borderRadius: '10px',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '2px', left: value ? '18px' : '2px',
                      width: '16px', height: '16px',
                      background: '#fff',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#F1F1FA' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: '#60607A' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: cost estimate + run button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: 0 }}>
          <div style={card}>
            <div style={{ fontSize: '12px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              Cost Estimate
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <CostBar label="Scenario Generation" value={scenarioCount * 0.002}       max={1.5} color="#6366F1" />
              <CostBar label="Panel Evaluation (3×)"  value={scenarioCount * 0.007}    max={1.5} color="#818CF8" />
              <CostBar label="Failure Analysis"       value={scenarioCount * 0.001}    max={1.5} color="#A5B4FC" />
              <CostBar label="Fix Recommendations"    value={scenarioCount * 0.002}    max={1.5} color="#C7D2FE" />
            </div>

            <div style={{ height: '1px', background: '#2A2A3A', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#A0A0B8' }}>Total Estimated</span>
              <span style={{
                fontSize: '22px', fontWeight: '800',
                color: dryRun ? '#22C55E' : '#F1F1FA',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {dryRun ? '$0.00' : `$${estimatedCost.toFixed(2)}`}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#60607A', marginBottom: '16px' }}>
              {dryRun ? 'Dry run — no credits used' : `~${estimatedTime} min · ${scenarioCount} scenarios`}
            </div>

            {running && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A0A0B8', marginBottom: '6px' }}>
                  <span>{phase}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: '6px', background: '#2A2A3A', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                    borderRadius: '3px',
                    transition: 'width 0.5s',
                    boxShadow: '0 0 12px rgba(99,102,241,0.6)',
                  }} />
                </div>
              </div>
            )}

            <button
              onClick={handleRun}
              disabled={running || !companyName || !targetEndpoint}
              style={{
                width: '100%',
                padding: '12px',
                background: running
                  ? '#2A2A3A'
                  : 'linear-gradient(135deg, #6366F1, #818CF8)',
                borderRadius: '9px',
                fontSize: '14px', fontWeight: '700', color: running ? '#60607A' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: running || !companyName ? 'not-allowed' : 'pointer',
                boxShadow: running ? 'none' : '0 0 24px rgba(99,102,241,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {running
                ? <><span style={{ fontSize: '16px' }}>⟳</span> Running…</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                   {dryRun ? 'Dry Run' : 'Start Evaluation'}</>
              }
            </button>
          </div>

          {/* Quick info */}
          <div style={{ ...card, padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
              Evaluation Pipeline
            </div>
            {[
              { step: '1', label: 'Rule Checks', desc: 'Free · instant', color: '#22C55E' },
              { step: '2', label: 'LLM Judge Panel', desc: '3 independent judges', color: '#6366F1' },
              { step: '3', label: 'Failure Clustering', desc: 'HDBSCAN + embeddings', color: '#F59E0B' },
              { step: '4', label: 'Fix Recommendations', desc: 'Actionable code fixes', color: '#EC4899' },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: `rgba(${item.color === '#22C55E' ? '34,197,94' : item.color === '#6366F1' ? '99,102,241' : item.color === '#F59E0B' ? '245,158,11' : '236,72,153'},0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '700', color: item.color,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#F1F1FA' }}>{item.label}</div>
                  <div style={{ fontSize: '10px', color: '#60607A' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.RunTests = RunTests;
