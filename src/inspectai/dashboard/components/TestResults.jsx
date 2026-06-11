const { useState, useMemo } = React;

const FAILURE_COLORS = {
  POLICY_VIOLATION: '#EF4444',
  HALLUCINATION:    '#6366F1',
  INCOMPLETE:       '#F59E0B',
  WRONG_ANSWER:     '#EC4899',
  ESCALATION_FAIL:  '#06B6D4',
  CONTEXT_LOSS:     '#8B5CF6',
};

function Badge({ text, color }) {
  return (
    <span style={{
      padding: '3px 8px',
      background: `${color}1A`,
      border: `1px solid ${color}40`,
      color: color,
      borderRadius: '5px',
      fontSize: '11px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: '0.2px',
    }}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

function StatusPip({ status }) {
  const color = status === 'pass' ? '#22C55E' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: '12px', fontWeight: '600', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {status}
      </span>
    </div>
  );
}

function ConfidencePip({ value }) {
  const color = value >= 0.9 ? '#22C55E' : value >= 0.75 ? '#F59E0B' : '#EF4444';
  return (
    <span style={{ fontSize: '12px', fontWeight: '600', color, fontFamily: 'JetBrains Mono, monospace' }}>
      {Math.round(value * 100)}%
    </span>
  );
}

function JudgeRow({ judge }) {
  const verdictColor = judge.verdict === 'pass' ? '#22C55E' : '#EF4444';
  const shortModel = judge.model.split('-').slice(0, 2).join('-');
  return (
    <div style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      padding: '8px 10px', borderRadius: '7px', background: '#1A1A26',
      fontSize: '12px',
    }}>
      <div style={{
        padding: '2px 7px',
        background: `${verdictColor}15`,
        border: `1px solid ${verdictColor}35`,
        color: verdictColor,
        borderRadius: '4px',
        fontSize: '10px', fontWeight: '700',
        textTransform: 'uppercase',
        flexShrink: 0, alignSelf: 'flex-start',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {judge.verdict.toUpperCase()}
      </div>
      <div>
        <div style={{ fontWeight: '600', color: '#A0A0B8', marginBottom: '3px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
          {shortModel}
        </div>
        <div style={{ color: '#60607A', lineHeight: '1.4' }}>{judge.reasoning}</div>
      </div>
      <div style={{ marginLeft: 'auto', color: '#60607A', fontSize: '11px', flexShrink: 0 }}>
        {Math.round(judge.confidence * 100)}%
      </div>
    </div>
  );
}

function ExpandedRow({ result }) {
  return (
    <tr>
      <td colSpan="6" style={{ padding: '0 16px 16px 56px' }}>
        <div style={{
          background: '#12121A',
          borderRadius: '10px',
          border: '1px solid #2A2A3A',
          overflow: 'hidden',
        }}>
          {/* Input / Expected / Actual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #2A2A3A' }}>
            {[
              { label: 'Input', text: result.input,    bgAccent: '' },
              { label: 'Expected', text: result.expected, bgAccent: '' },
              { label: 'Actual Output', text: result.actual, bgAccent: result.status === 'fail' ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.04)' },
            ].map(({ label, text, bgAccent }) => (
              <div key={label} style={{ padding: '12px 14px', background: bgAccent, borderRight: '1px solid #2A2A3A' }}>
                <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '12px', color: '#F1F1FA', lineHeight: '1.5' }}>{text}</div>
              </div>
            ))}
          </div>

          {/* Judge verdicts */}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>
              Judge Panel ({result.judges.length} judges)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {result.judges.map((j, i) => <JudgeRow key={i} judge={j} />)}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

function TestResults({ onNavigate }) {
  const data = window.MOCK_DATA;
  const [filterStatus, setFilterStatus]  = useState('all');
  const [filterType, setFilterType]      = useState('all');
  const [searchQuery, setSearchQuery]    = useState('');
  const [expandedId, setExpandedId]      = useState(null);

  const filtered = useMemo(() => {
    return data.testResults.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterType   !== 'all' && r.failureType !== filterType) return false;
      if (searchQuery && !r.input.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filterStatus, filterType, searchQuery]);

  const passCount = filtered.filter((r) => r.status === 'pass').length;
  const failCount = filtered.filter((r) => r.status === 'fail').length;

  const selectStyle = {
    background: '#1A1A26', border: '1px solid #2A2A3A', borderRadius: '7px',
    color: '#F1F1FA', fontSize: '12px', padding: '7px 10px', cursor: 'pointer',
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Test Results</h1>
        <div style={{ fontSize: '13px', color: '#60607A' }}>
          QuickShop Support Bot · Run May 9, 2025 · 200 scenarios
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Passed',  value: data.testResults.filter(r => r.status === 'pass').length, color: '#22C55E', total: data.testResults.length },
          { label: 'Failed',  value: data.testResults.filter(r => r.status === 'fail').length, color: '#EF4444', total: data.testResults.length },
          { label: 'Showing', value: filtered.length, color: '#6366F1', total: data.testResults.length },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '12px 16px', background: '#12121A', border: '1px solid #2A2A3A',
            borderRadius: '9px', display: 'flex', gap: '10px', alignItems: 'center',
          }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
              {s.value}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#F1F1FA' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: '#60607A' }}>of {s.total}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center',
        padding: '12px 16px',
        background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '10px',
        marginBottom: '16px',
      }}>
        <input
          style={{
            flex: 1, background: '#1A1A26', border: '1px solid #2A2A3A',
            borderRadius: '7px', color: '#F1F1FA', fontSize: '13px', padding: '8px 12px',
          }}
          placeholder="Search by input text…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select style={selectStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pass">Pass Only</option>
          <option value="fail">Fail Only</option>
        </select>
        <select style={selectStyle} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Failure Types</option>
          <option value="POLICY_VIOLATION">Policy Violation</option>
          <option value="HALLUCINATION">Hallucination</option>
          <option value="INCOMPLETE">Incomplete</option>
          <option value="ESCALATION_FAIL">Escalation Fail</option>
          <option value="WRONG_ANSWER">Wrong Answer</option>
          <option value="CONTEXT_LOSS">Context Loss</option>
        </select>
        {(filterStatus !== 'all' || filterType !== 'all' || searchQuery) && (
          <button
            onClick={() => { setFilterStatus('all'); setFilterType('all'); setSearchQuery(''); }}
            style={{ padding: '7px 12px', background: '#2A2A3A', borderRadius: '7px', fontSize: '12px', color: '#A0A0B8' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A3A' }}>
              {['#', 'Status', 'Input (truncated)', 'Failure Type', 'Confidence', 'Latency'].map((h) => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: '11px', fontWeight: '600', color: '#60607A',
                  textTransform: 'uppercase', letterSpacing: '0.7px',
                  background: '#0D0D16',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((result, i) => {
              const isExpanded = expandedId === result.id;
              return (
                <React.Fragment key={result.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : result.id)}
                    style={{
                      borderBottom: '1px solid #1A1A26',
                      cursor: 'pointer',
                      background: isExpanded ? '#16161F' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#14141E'; }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#60607A', fontFamily: 'JetBrains Mono, monospace', width: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60607A" strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        {result.id}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusPip status={result.status} />
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '360px' }}>
                      <div style={{
                        fontSize: '13px', color: '#F1F1FA',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {result.input}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {result.failureType
                        ? <Badge text={result.failureType} color={FAILURE_COLORS[result.failureType] || '#818CF8'} />
                        : <span style={{ fontSize: '12px', color: '#2A2A3A' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ConfidencePip value={result.confidence} />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#A0A0B8', fontFamily: 'JetBrains Mono, monospace' }}>
                      {result.latency}ms
                    </td>
                  </tr>
                  {isExpanded && <ExpandedRow result={result} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#60607A' }}>
            No results match the current filters
          </div>
        )}

        <div style={{ padding: '12px 16px', borderTop: '1px solid #1A1A26', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#60607A' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} · {passCount} pass · {failCount} fail
          </span>
          <button
            onClick={() => onNavigate('analysis')}
            style={{ fontSize: '12px', color: '#818CF8', background: 'transparent', padding: '6px 10px', borderRadius: '6px' }}
          >
            Analyze failures →
          </button>
        </div>
      </div>
    </div>
  );
}

window.TestResults = TestResults;
