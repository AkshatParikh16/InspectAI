const { useState, useMemo } = React;
const { StatusBadge, EmptyState } = window.Shared;

const DIFF_COLOR = { EASY: '#22C55E', MEDIUM: '#F59E0B', HARD: '#EF4444', CRITICAL: '#7C3AED' };
const DIFF_BG    = { EASY: '#F0FDF4', MEDIUM: '#FFFBEB', HARD: '#FEF2F2', CRITICAL: '#F5F3FF' };

const TYPE_COLOR = {
  POLICY_VIOLATION:        { bg: '#FEF2F2', txt: '#DC2626' },
  TONE_VIOLATION:          { bg: '#FFF7ED', txt: '#EA580C' },
  HALLUCINATION:           { bg: '#EFF6FF', txt: '#2563EB' },
  SECURITY_BREACH:         { bg: '#F5F3FF', txt: '#7C3AED' },
  COMPLIANCE_VIOLATION:    { bg: '#ECFDF5', txt: '#059669' },
  ESCALATION_FAILURE:      { bg: '#FFF1F2', txt: '#E11D48' },
  FACTUAL_ERROR:           { bg: '#F0F9FF', txt: '#0369A1' },
  UNHELPFUL_RESPONSE:      { bg: '#FAFAF9', txt: '#78716C' },
};

function typeLabel(t) {
  if (!t) return '';
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function JudgeVerdict({ name, verdict, reasoning, score }) {
  const pass = verdict === 'PASS' || verdict === true;
  return (
    <div style={{
      padding: '10px 12px', borderRadius: '8px', marginBottom: '6px',
      background: pass ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${pass ? '#BBF7D0' : '#FECACA'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {score !== undefined && (
            <span style={{ fontSize: '11px', color: '#64748B' }}>{(score * 100).toFixed(0)}%</span>
          )}
          <span style={{
            fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px',
            background: pass ? '#22C55E' : '#EF4444', color: '#fff',
          }}>{pass ? 'PASS' : 'FAIL'}</span>
        </div>
      </div>
      {reasoning && (
        <p style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
          {reasoning.length > 200 ? reasoning.slice(0, 200) + '…' : reasoning}
        </p>
      )}
    </div>
  );
}

function DetailPanel({ scenario, onClose }) {
  if (!scenario) return (
    <div style={{
      flex: '0 0 380px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px', color: '#94A3B8',
      borderLeft: '1px solid #E2E8F0',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <p style={{ marginTop: '12px', fontSize: '13px' }}>Select a scenario to see details</p>
    </div>
  );

  const passed = scenario.passed;
  const r = scenario;
  const judges = r.judge_results || r.judgments || [];

  return (
    <div style={{
      flex: '0 0 400px', display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #E2E8F0', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: passed ? '#F0FDF4' : '#FEF2F2',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
            background: passed ? '#22C55E' : '#EF4444', color: '#fff',
          }}>{passed ? 'PASSED' : 'FAILED'}</span>
          {r.failure_type && (
            <span style={{
              padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
              background: TYPE_COLOR[r.failure_type]?.bg || '#F1F5F9',
              color: TYPE_COLOR[r.failure_type]?.txt || '#64748B',
            }}>{typeLabel(r.failure_type)}</span>
          )}
        </div>
        <button onClick={onClose} style={{ color: '#94A3B8', fontSize: '18px', background: 'transparent' }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {r.difficulty && (
            <span style={{
              padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
              background: DIFF_BG[r.difficulty] || '#F1F5F9',
              color: DIFF_COLOR[r.difficulty] || '#64748B',
            }}>{r.difficulty}</span>
          )}
          {r.latency_ms !== undefined && (
            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: '#F1F5F9', color: '#64748B' }}>
              {r.latency_ms}ms
            </span>
          )}
          {r.confidence_score !== undefined && (
            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: '#F1F5F9', color: '#64748B' }}>
              Confidence {(r.confidence_score * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* Scenario input */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>User Input</div>
          <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', fontSize: '13px', color: '#0F172A', lineHeight: '1.55', border: '1px solid #E2E8F0' }}>
            {r.scenario_input || r.input || '—'}
          </div>
        </div>

        {/* Expected behavior */}
        {(r.expected_behavior || r.expected) && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Expected Behavior</div>
            <div style={{ padding: '10px 12px', background: '#F0FDF4', borderRadius: '8px', fontSize: '13px', color: '#166534', lineHeight: '1.55', border: '1px solid #BBF7D0' }}>
              {r.expected_behavior || r.expected}
            </div>
          </div>
        )}

        {/* Actual response */}
        {(r.actual_response || r.response) && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Chatbot Response</div>
            <div style={{ padding: '10px 12px', background: passed ? '#F0FDF4' : '#FEF2F2', borderRadius: '8px', fontSize: '13px', color: '#0F172A', lineHeight: '1.55', border: `1px solid ${passed ? '#BBF7D0' : '#FECACA'}` }}>
              {r.actual_response || r.response}
            </div>
          </div>
        )}

        {/* Failure reason */}
        {!passed && r.failure_reason && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Failure Reason</div>
            <div style={{ padding: '10px 12px', background: '#FFF7ED', borderRadius: '8px', fontSize: '13px', color: '#9A3412', lineHeight: '1.55', border: '1px solid #FED7AA' }}>
              {r.failure_reason}
            </div>
          </div>
        )}

        {/* Judge panel */}
        {judges.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
              Judge Panel ({judges.length} judge{judges.length !== 1 ? 's' : ''})
            </div>
            {judges.map((j, i) => (
              <JudgeVerdict key={i}
                name={j.judge_id || j.model || j.name || `Judge ${i + 1}`}
                verdict={j.verdict || j.passed}
                reasoning={j.reasoning || j.explanation}
                score={j.score || j.confidence_score}
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {r.tags && r.tags.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Tags</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {r.tags.map(t => (
                <span key={t} style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '11px', background: '#F1F5F9', color: '#64748B' }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Scenarios({ currentRun, onNavigate }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);

  const allResults = useMemo(() => {
    if (!currentRun?.results_json?.results) return [];
    return currentRun.results_json.results;
  }, [currentRun]);

  const failureTypes = useMemo(() => {
    const types = new Set();
    allResults.forEach(r => { if (!r.passed && r.failure_type) types.add(r.failure_type); });
    return [...types];
  }, [allResults]);

  const tabs = [
    { id: 'all',    label: 'All',    count: allResults.length },
    { id: 'passed', label: 'Passed', count: allResults.filter(r => r.passed).length },
    { id: 'failed', label: 'Failed', count: allResults.filter(r => !r.passed).length },
    ...failureTypes.map(ft => ({ id: ft, label: typeLabel(ft), count: allResults.filter(r => r.failure_type === ft).length })),
  ];

  const visible = useMemo(() => {
    let list = allResults;
    if (activeTab === 'passed') list = list.filter(r => r.passed);
    else if (activeTab === 'failed') list = list.filter(r => !r.passed);
    else if (activeTab !== 'all') list = list.filter(r => r.failure_type === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.scenario_input || r.input || '').toLowerCase().includes(q) ||
        (r.failure_type || '').toLowerCase().includes(q) ||
        (r.failure_reason || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allResults, activeTab, search]);

  const passRate = allResults.length ? Math.round(allResults.filter(r => r.passed).length / allResults.length * 100) : 0;

  // ── Empty / onboarding state ───────────────────────────────────────────────
  if (!currentRun) {
    return (
      <div style={{ padding: '32px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '48px 32px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>No scenarios yet</h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '20px' }}>
            After your first scan, every tested scenario will appear here — both passed and failed — so you can inspect exactly what InspectAI evaluated.
          </p>
          <button onClick={() => onNavigate && onNavigate('settings')} style={{
            padding: '10px 22px', background: 'linear-gradient(135deg,#4F46E5,#6366F1)', borderRadius: '9px',
            fontSize: '14px', fontWeight: '600', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          }}>
            Configure & Start First Scan →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '14px', marginTop: '24px' }}>
          {[
            { icon: '✓', title: 'Pass/Fail filter',     desc: 'Filter by outcome or failure type' },
            { icon: '🔍', title: 'Full scenario detail', desc: 'Input, expected output, chatbot response' },
            { icon: '⚖️', title: '3-judge verdicts',     desc: 'See each judge\'s reasoning & score' },
            { icon: '🏷️', title: 'Difficulty & tags',    desc: 'Easy → Critical scenario classification' },
          ].map(c => (
            <div key={c.title} style={{ padding: '14px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{c.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', marginBottom: '3px' }}>{c.title}</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Scenarios</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
              {allResults.length} scenarios tested · {passRate}% pass rate
            </p>
          </div>
          {/* Summary chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#F0FDF4', color: '#16A34A' }}>
              ✓ {allResults.filter(r => r.passed).length} Passed
            </span>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#FEF2F2', color: '#DC2626' }}>
              ✗ {allResults.filter(r => !r.passed).length} Failed
            </span>
          </div>
        </div>

        {/* Tab strip + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                background: activeTab === t.id ? '#4F46E5' : '#F1F5F9',
                color: activeTab === t.id ? '#fff' : '#64748B',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                {t.label}
                <span style={{
                  padding: '1px 6px', borderRadius: '20px', fontSize: '10px',
                  background: activeTab === t.id ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                  color: activeTab === t.id ? '#fff' : '#94A3B8',
                }}>{t.count}</span>
              </button>
            ))}
          </div>
          <input
            style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', width: '200px', flexShrink: 0 }}
            placeholder="Search scenarios…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', marginTop: '12px' }}>
        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
              <p>No scenarios match this filter.</p>
            </div>
          ) : (
            visible.map((r, i) => {
              const input = r.scenario_input || r.input || '';
              const isSelected = selected && (selected.id === r.id || selected === r);
              return (
                <div key={r.id || i} onClick={() => setSelected(r)} style={{
                  padding: '12px 14px', marginBottom: '6px', borderRadius: '10px', cursor: 'pointer',
                  background: isSelected ? '#EEF2FF' : '#FFFFFF',
                  border: `1px solid ${isSelected ? '#A5B4FC' : '#E2E8F0'}`,
                  boxShadow: isSelected ? '0 0 0 2px rgba(79,70,229,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 0.12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <p style={{ fontSize: '13px', color: '#0F172A', lineHeight: '1.45', margin: 0, flex: 1 }}>
                      {input.length > 120 ? input.slice(0, 120) + '…' : input || <em style={{ color: '#94A3B8' }}>No input</em>}
                    </p>
                    <span style={{
                      flexShrink: 0, padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      background: r.passed ? '#F0FDF4' : '#FEF2F2',
                      color: r.passed ? '#16A34A' : '#DC2626',
                    }}>{r.passed ? 'PASS' : 'FAIL'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
                    {r.failure_type && (
                      <span style={{
                        padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '600',
                        background: TYPE_COLOR[r.failure_type]?.bg || '#F1F5F9',
                        color: TYPE_COLOR[r.failure_type]?.txt || '#64748B',
                      }}>{typeLabel(r.failure_type)}</span>
                    )}
                    {r.difficulty && (
                      <span style={{
                        padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '600',
                        background: DIFF_BG[r.difficulty] || '#F1F5F9',
                        color: DIFF_COLOR[r.difficulty] || '#64748B',
                      }}>{r.difficulty}</span>
                    )}
                    {r.latency_ms !== undefined && (
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>{r.latency_ms}ms</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <DetailPanel scenario={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}

window.Scenarios = Scenarios;
