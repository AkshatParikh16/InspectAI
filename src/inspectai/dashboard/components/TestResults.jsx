const { useState, useMemo } = React;

const FAIL_COLORS = {
  POLICY_VIOLATION:'#EF4444', HALLUCINATION:'#6366F1', INCOMPLETE:'#F59E0B',
  WRONG_ANSWER:'#EC4899', ESCALATION_FAILURE:'#06B6D4', CONTEXT_LOSS:'#8B5CF6',
};

function Badge({ text, color }) {
  return (
    <span style={{
      padding: '3px 8px', background: `${color}1A`, border: `1px solid ${color}40`,
      color, borderRadius: '5px', fontSize: '11px', fontWeight: '600',
      whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace',
    }}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

function StatusPip({ passed }) {
  const color = passed ? '#22C55E' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }}/>
      <span style={{ fontSize: '11px', fontWeight: '600', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {passed ? 'pass' : 'fail'}
      </span>
    </div>
  );
}

function ExpandedRow({ result }) {
  // result is a raw TestResult from results_json.results
  const scenario = result.scenario || {};
  const verdict  = result.panel_verdict || {};
  const judges   = verdict.individual_verdicts || [];

  return (
    <tr>
      <td colSpan="6" style={{ padding: '0 16px 16px 54px' }}>
        <div style={{ background: '#12121A', borderRadius: '10px', border: '1px solid #2A2A3A', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { label: 'Input', text: scenario.input || '—' },
              { label: 'Expected Behavior', text: scenario.expected_behavior || '—' },
              { label: 'Actual Response', text: result.actual_response || '—', fail: !result.passed },
            ].map(({ label, text, fail }) => (
              <div key={label} style={{
                padding: '12px 14px', borderRight: '1px solid #1A1A26',
                background: fail ? 'rgba(239,68,68,0.03)' : 'transparent',
              }}>
                <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: '#F1F1FA', lineHeight: '1.5' }}>{text}</div>
              </div>
            ))}
          </div>
          {judges.length > 0 && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #1A1A26' }}>
              <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>
                Judge Panel ({judges.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {judges.map((j, i) => {
                  const jColor = j.passed ? '#22C55E' : '#EF4444';
                  return (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 10px', background: '#1A1A26', borderRadius: '7px', fontSize: '12px' }}>
                      <div style={{ padding: '2px 7px', background: `${jColor}15`, border: `1px solid ${jColor}35`, color: jColor, borderRadius: '4px', fontSize: '10px', fontWeight: '700', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                        {j.passed ? 'PASS' : 'FAIL'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#A0A0B8', fontSize: '11px', marginBottom: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                          {j.judge_model || 'judge'}
                        </div>
                        <div style={{ color: '#60607A', lineHeight: '1.4' }}>{j.reasoning || '—'}</div>
                      </div>
                      <div style={{ color: '#60607A', fontSize: '11px', flexShrink: 0 }}>
                        {j.confidence ? `${Math.round(j.confidence * 100)}%` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyResults({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px', padding: '40px 20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F1F1FA', marginBottom: '10px' }}>No results yet</h2>
        <p style={{ fontSize: '13px', color: '#60607A', lineHeight: '1.6', marginBottom: '24px' }}>
          Complete a test run to see per-scenario pass/fail results with full judge panel reasoning.
        </p>
        <button onClick={() => onNavigate('run-tests')} style={{
          padding: '10px 22px', background: 'linear-gradient(135deg,#6366F1,#818CF8)',
          borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff',
        }}>
          Run a Test
        </button>
      </div>
    </div>
  );
}

function RunningIndicator() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        border: '3px solid #2A2A3A', borderTopColor: '#6366F1',
        animation: 'spin 0.9s linear infinite',
      }}/>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#F1F1FA', textAlign: 'center', marginBottom: '6px' }}>
          Evaluation in progress…
        </div>
        <div style={{ fontSize: '12px', color: '#60607A', textAlign: 'center' }}>
          Running scenarios · analysing failures · generating fixes
        </div>
      </div>
    </div>
  );
}

function TestResults({ runs, currentRun, detailsLoading, onNavigate }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType,   setFilterType]   = useState('all');
  const [search,       setSearch]       = useState('');
  const [expandedId,   setExpandedId]   = useState(null);

  if (!currentRun && runs.filter(r => r.status === 'completed').length === 0) {
    return <EmptyResults onNavigate={onNavigate} />;
  }
  if (currentRun && currentRun.status === 'running') return <RunningIndicator />;
  if (detailsLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60607A' }}>
        Loading results…
      </div>
    );
  }

  const rawResults = currentRun?.results_json?.results || [];
  if (rawResults.length === 0) return <EmptyResults onNavigate={onNavigate} />;

  const passCount = rawResults.filter(r => r.passed).length;
  const failCount = rawResults.length - passCount;

  const filtered = useMemo(() => rawResults.filter(r => {
    if (filterStatus === 'pass' && !r.passed)         return false;
    if (filterStatus === 'fail' && r.passed)          return false;
    if (filterType !== 'all' && r.failure_type !== filterType) return false;
    const input = r.scenario?.input || r.actual_response || '';
    if (search && !input.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [rawResults, filterStatus, filterType, search]);

  const selectStyle = { background: '#1A1A26', border: '1px solid #2A2A3A', borderRadius: '7px', color: '#F1F1FA', fontSize: '12px', padding: '7px 10px' };

  return (
    <div className="page-scroll">
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Test Results</h1>
        <div style={{ fontSize: '13px', color: '#60607A' }}>
          {currentRun?.company_name} · {rawResults.length} scenarios · {new Date(currentRun?.created_at).toLocaleString()}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Passed',  val: passCount, color: '#22C55E' },
          { label: 'Failed',  val: failCount, color: '#EF4444' },
          { label: 'Showing', val: filtered.length, color: '#6366F1' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 16px', background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '9px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: '#60607A' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '10px', padding: '10px 14px', background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input
          style={{ flex: 1, minWidth: '160px', background: '#1A1A26', border: '1px solid #2A2A3A', borderRadius: '7px', color: '#F1F1FA', fontSize: '13px', padding: '7px 11px' }}
          placeholder="Search input text…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>
        <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {Object.keys(FAIL_COLORS).map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
        {(filterStatus !== 'all' || filterType !== 'all' || search) && (
          <button onClick={() => { setFilterStatus('all'); setFilterType('all'); setSearch(''); }}
            style={{ padding: '7px 12px', background: '#2A2A3A', borderRadius: '7px', fontSize: '12px', color: '#A0A0B8' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A3A' }}>
              {['#', 'Status', 'Input', 'Failure Type', 'Confidence', 'Latency'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', background: '#0D0D16', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const isExpanded = expandedId === r.id;
              const input = r.scenario?.input || r.actual_response || '—';
              return (
                <React.Fragment key={r.id || i}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    style={{ borderBottom: '1px solid #1A1A26', cursor: 'pointer', background: isExpanded ? '#14141E' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#14141E'; }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '11px 14px', width: '48px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60607A" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        <span style={{ fontSize: '11px', color: '#60607A', fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}><StatusPip passed={r.passed}/></td>
                    <td style={{ padding: '11px 14px', maxWidth: '340px' }}>
                      <div style={{ fontSize: '13px', color: '#F1F1FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{input}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {r.failure_type
                        ? <Badge text={r.failure_type} color={FAIL_COLORS[r.failure_type] || '#818CF8'}/>
                        : <span style={{ color: '#2A2A3A', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: r.confidence_score >= 0.9 ? '#22C55E' : r.confidence_score >= 0.75 ? '#F59E0B' : '#EF4444' }}>
                      {r.confidence_score != null ? `${Math.round(r.confidence_score * 100)}%` : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: '#A0A0B8', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                      {r.latency_ms != null ? `${Math.round(r.latency_ms)}ms` : '—'}
                    </td>
                  </tr>
                  {isExpanded && <ExpandedRow result={r}/>}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#60607A', fontSize: '13px' }}>
            No results match the current filters
          </div>
        )}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #1A1A26', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#60607A' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={() => onNavigate('analysis')} style={{ fontSize: '12px', color: '#818CF8', background: 'transparent' }}>
            Analyze failures →
          </button>
        </div>
      </div>
    </div>
  );
}

window.TestResults = TestResults;
