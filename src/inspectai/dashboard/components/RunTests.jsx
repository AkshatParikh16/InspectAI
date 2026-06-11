const { useState } = React;

const SYSTEM_TYPES = [
  { id: 'CUSTOMER_SUPPORT', label: 'Customer Support', desc: 'Refund, return, shipping, escalation policies', icon: '💬' },
  { id: 'RAG',              label: 'RAG / Knowledge Base', desc: 'Retrieval accuracy, citation, hallucination',  icon: '📚' },
  { id: 'MULTI_AGENT',      label: 'Multi-Agent Pipeline', desc: 'Tool use, task completion, cost/step limits',  icon: '🤖' },
];

const MODELS = [
  'claude-sonnet-4-6', 'claude-opus-4-8', 'gpt-4o', 'gpt-4o-mini',
  'gemini-2.0-flash', 'llama-3.3-70b-instruct',
];

const COST_PER_SCENARIO = 0.012;

function CostBar({ label, value, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ fontSize: '12px', color: '#A0A0B8', minWidth: '130px' }}>{label}</div>
      <div style={{ flex: 1, height: '4px', background: '#2A2A3A', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min((value/max)*100,100)}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }}/>
      </div>
      <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#F1F1FA', minWidth: '50px', textAlign: 'right' }}>
        ${value.toFixed(2)}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 12px', background: '#1A1A26',
      borderRadius: '8px', cursor: 'pointer',
      border: value ? '1px solid rgba(99,102,241,0.4)' : '1px solid #2A2A3A',
      transition: 'border-color 0.15s',
    }}>
      <div style={{
        width: '36px', height: '20px', background: value ? '#6366F1' : '#2A2A3A',
        borderRadius: '10px', position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: '2px', left: value ? '18px' : '2px',
          width: '16px', height: '16px', background: '#fff', borderRadius: '50%',
          transition: 'left 0.2s',
        }}/>
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#F1F1FA' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#60607A' }}>{desc}</div>
      </div>
    </div>
  );
}

function RunTests({ onNavigate, onRunStarted }) {
  const [systemType, setSystemType]       = useState('CUSTOMER_SUPPORT');
  const [companyName, setCompanyName]     = useState('');
  const [industry, setIndustry]           = useState('retail');
  const [targetModel, setTargetModel]     = useState('claude-sonnet-4-6');
  const [endpoint, setEndpoint]           = useState('');
  const [apiKey, setApiKey]               = useState('');
  const [scenarioCount, setScenarioCount] = useState(20);
  const [dryRun, setDryRun]               = useState(false);
  const [refundThreshold, setRefundThreshold]       = useState(50);
  const [returnWindow, setReturnWindow]             = useState(30);
  const [maxDiscount, setMaxDiscount]               = useState(15);
  const [escalateKeywords, setEscalateKeywords]     = useState('manager, supervisor, legal');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const estimatedCost = dryRun ? 0 : scenarioCount * COST_PER_SCENARIO;
  const canSubmit = !submitting && companyName.trim() && endpoint.trim();

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        company_name: companyName.trim(),
        industry,
        system_type: systemType,
        target_model: targetModel,
        target_endpoint: endpoint.trim(),
        api_key: apiKey,
        scenario_count: scenarioCount,
        dry_run: dryRun,
        policy: {
          refund_threshold: refundThreshold,
          return_window_days: returnWindow,
          max_discount_percent: maxDiscount,
          escalate_on_keywords: escalateKeywords.split(',').map(s => s.trim()).filter(Boolean),
          prohibited_actions: [],
        },
      };
      const { run_id } = await window.API.startRun(payload);
      onRunStarted(run_id);
    } catch (e) {
      setSubmitError(e.message);
      setSubmitting(false);
    }
  }

  const lbl = { fontSize: '12px', color: '#A0A0B8', marginBottom: '5px', display: 'block' };
  const inp = { width: '100%', background: '#1A1A26', border: '1px solid #2A2A3A', borderRadius: '8px', color: '#F1F1FA', fontSize: '13px', padding: '9px 12px' };

  return (
    <div className="page-scroll">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Run Tests</h1>
        <div style={{ fontSize: '13px', color: '#60607A' }}>Configure and launch an adversarial evaluation run against your AI system</div>
      </div>

      <div className="grid g-sidebar">
        {/* Left: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* System type */}
          <div className="card">
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '12px' }}>System Type</div>
            {SYSTEM_TYPES.map(st => {
              const isSelected = systemType === st.id;
              return (
                <div key={st.id} onClick={() => setSystemType(st.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 13px',
                  borderRadius: '9px', cursor: 'pointer', marginBottom: '8px',
                  border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid #2A2A3A',
                  background: isSelected ? 'rgba(99,102,241,0.08)' : '#1A1A26',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{st.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: isSelected ? '#818CF8' : '#F1F1FA' }}>{st.label}</div>
                    <div style={{ fontSize: '11px', color: '#60607A', marginTop: '2px' }}>{st.desc}</div>
                  </div>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', flexShrink: 0, border: isSelected ? '5px solid #6366F1' : '2px solid #3A3A50', transition: 'all 0.15s' }}/>
                </div>
              );
            })}
          </div>

          {/* Target system */}
          <div className="card">
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '12px' }}>Target System</div>
            <div className="grid g-2" style={{ gap: '12px' }}>
              <div>
                <label style={lbl}>Company Name *</label>
                <input style={inp} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Corp"/>
              </div>
              <div>
                <label style={lbl}>Industry</label>
                <select style={inp} value={industry} onChange={e => setIndustry(e.target.value)}>
                  <option value="retail">Retail / E-commerce</option>
                  <option value="finance">Finance / Banking</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="legal">Legal</option>
                  <option value="saas">SaaS / Tech</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Target AI Model</label>
                <select style={inp} value={targetModel} onChange={e => setTargetModel(e.target.value)}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>API Endpoint *</label>
                <input style={inp} value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.yourcompany.com/chat"/>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>API Key</label>
                <input type="password" style={inp} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-… (not stored)"/>
              </div>
            </div>
          </div>

          {/* Policy config (customer support only) */}
          {systemType === 'CUSTOMER_SUPPORT' && (
            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '12px' }}>Policy Configuration</div>
              <div className="grid g-2" style={{ gap: '12px' }}>
                <div>
                  <label style={lbl}>Refund Threshold ($)</label>
                  <input type="number" style={inp} value={refundThreshold} onChange={e => setRefundThreshold(+e.target.value)} min="0"/>
                </div>
                <div>
                  <label style={lbl}>Return Window (days)</label>
                  <input type="number" style={inp} value={returnWindow} onChange={e => setReturnWindow(+e.target.value)} min="0"/>
                </div>
                <div>
                  <label style={lbl}>Max Discount (%)</label>
                  <input type="number" style={inp} value={maxDiscount} onChange={e => setMaxDiscount(+e.target.value)} min="0" max="100"/>
                </div>
                <div>
                  <label style={lbl}>Escalate on Keywords</label>
                  <input style={inp} value={escalateKeywords} onChange={e => setEscalateKeywords(e.target.value)} placeholder="manager, supervisor, legal"/>
                </div>
              </div>
            </div>
          )}

          {/* Test config */}
          <div className="card">
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '12px' }}>Test Configuration</div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Scenario Count</label>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#818CF8', fontFamily: 'JetBrains Mono, monospace' }}>{scenarioCount}</span>
              </div>
              <input type="range" min="5" max="500" step="5" value={scenarioCount} onChange={e => setScenarioCount(+e.target.value)} style={{ width: '100%' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#60607A', marginTop: '4px' }}>
                <span>5 (quick)</span><span>50 (standard)</span><span>500 (thorough)</span>
              </div>
            </div>
            <Toggle value={dryRun} onChange={setDryRun}
              label="Dry Run (no real AI calls)"
              desc="Validate config and preview cost without spending credits"
            />
          </div>
        </div>

        {/* Right: cost estimate + submit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '14px' }}>Cost Estimate</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <CostBar label="Scenario Generation" value={scenarioCount * 0.002} max={1.5} color="#6366F1"/>
              <CostBar label="Panel Evaluation (3×)" value={scenarioCount * 0.007} max={1.5} color="#818CF8"/>
              <CostBar label="Failure Analysis"    value={scenarioCount * 0.001} max={1.5} color="#A5B4FC"/>
              <CostBar label="Fix Recommendations" value={scenarioCount * 0.002} max={1.5} color="#C7D2FE"/>
            </div>
            <div style={{ height: '1px', background: '#2A2A3A', marginBottom: '12px' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#A0A0B8' }}>Total Estimated</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: dryRun ? '#22C55E' : '#F1F1FA', fontFamily: 'JetBrains Mono, monospace' }}>
                {dryRun ? '$0.00' : `$${estimatedCost.toFixed(2)}`}
              </span>
            </div>

            {submitError && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '12px', color: '#EF4444', marginBottom: '12px', lineHeight: '1.4' }}>
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '12px',
                background: canSubmit ? 'linear-gradient(135deg,#6366F1,#818CF8)' : '#2A2A3A',
                borderRadius: '9px', fontSize: '14px', fontWeight: '700',
                color: canSubmit ? '#fff' : '#60607A',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? '0 0 24px rgba(99,102,241,0.35)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {submitting
                ? 'Starting…'
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                   {dryRun ? 'Dry Run' : 'Start Evaluation'}</>
              }
            </button>

            {!companyName.trim() && <div style={{ fontSize: '11px', color: '#60607A', textAlign: 'center', marginTop: '8px' }}>Company name required</div>}
            {!endpoint.trim()    && <div style={{ fontSize: '11px', color: '#60607A', textAlign: 'center', marginTop: '4px' }}>API endpoint required</div>}
          </div>

          {/* Pipeline info */}
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
              Evaluation Pipeline
            </div>
            {[
              { step: '1', label: 'Scenario Generation',  desc: 'Policy-aware adversarial prompts', color: '#22C55E' },
              { step: '2', label: 'Rule Checks',          desc: 'Free — instant programmatic checks', color: '#22C55E' },
              { step: '3', label: 'LLM Judge Panel',      desc: '3 independent judges, majority vote', color: '#6366F1' },
              { step: '4', label: 'Failure Clustering',   desc: 'HDBSCAN + sentence embeddings', color: '#F59E0B' },
              { step: '5', label: 'Fix Recommendations',  desc: '5 actionable fix types generated', color: '#EC4899' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: `${item.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '700', color: item.color,
                }}>{item.step}</div>
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
