const { useState } = React;

const TYPE_COLORS = {
  POLICY_VIOLATION:'#EF4444', HALLUCINATION:'#6366F1', INCOMPLETE:'#F59E0B',
  WRONG_ANSWER:'#EC4899', CONTEXT_LOSS:'#8B5CF6', ESCALATION_FAILURE:'#06B6D4',
};

// ── Cluster map (SVG) ─────────────────────────────────────────────────────────
function ClusterMap({ patterns, selectedId, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const W = 500, H = 280;
  if (!patterns.length) return null;

  const maxCount = Math.max(...patterns.map(p => p.scenario_count));

  // Place clusters deterministically based on index
  const positions = [
    { x: 140, y: 110 }, { x: 355, y: 90 }, { x: 255, y: 200 },
    { x: 90,  y: 200 }, { x: 410, y: 190 }, { x: 245, y: 60 },
  ];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {patterns.map((p, i) => {
          const color = TYPE_COLORS[p.failure_type] || '#818CF8';
          return (
            <radialGradient key={i} id={`halo-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </radialGradient>
          );
        })}
      </defs>

      {/* Grid */}
      {[...Array(4)].map((_,i) => <line key={`h${i}`} x1="0" y1={H*(i+1)/5} x2={W} y2={H*(i+1)/5} stroke="#1A1A26" strokeWidth="1"/>)}
      {[...Array(5)].map((_,i) => <line key={`v${i}`} x1={W*(i+1)/6} y1="0" x2={W*(i+1)/6} y2={H} stroke="#1A1A26" strokeWidth="1"/>)}

      {/* Connecting lines */}
      {patterns.slice(0, Math.min(patterns.length, 6)).map((_, i) =>
        patterns.slice(i+1, Math.min(patterns.length, 6)).map((_, j) => {
          const a = positions[i], b = positions[i+1+j];
          return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2A2A3A" strokeWidth="1" strokeDasharray="4,4"/>;
        })
      )}

      {patterns.slice(0, 6).map((p, i) => {
        const pos = positions[i];
        const color = TYPE_COLORS[p.failure_type] || '#818CF8';
        const r = 22 + (p.scenario_count / maxCount) * 34;
        const isSelected = selectedId === i;
        const isHovered  = hovered === i;
        const scale = isSelected ? 1.08 : isHovered ? 1.04 : 1;

        return (
          <g key={i} style={{ cursor: 'pointer' }}
            transform={`translate(${pos.x},${pos.y}) scale(${scale}) translate(${-pos.x},${-pos.y})`}
            onClick={() => onSelect(isSelected ? null : i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            <circle cx={pos.x} cy={pos.y} r={r*2.3} fill={`url(#halo-${i})`} opacity={isSelected || isHovered ? 1 : 0.5}/>
            <circle cx={pos.x} cy={pos.y} r={r+5} fill="none" stroke={color} strokeWidth={isSelected ? 2 : 1} strokeDasharray={isSelected ? 'none' : '5,3'} opacity={isSelected ? 0.8 : 0.25}/>
            <circle cx={pos.x} cy={pos.y} r={r} fill={color} opacity={isSelected ? 0.9 : isHovered ? 0.75 : 0.6}/>
            <text x={pos.x} y={pos.y - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{p.scenario_count}</text>
            <text x={pos.x} y={pos.y + 12} textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.8)" fontWeight="600">{p.failure_type.replace(/_/g,' ')}</text>
            <text x={pos.x} y={pos.y + r + 16} textAnchor="middle" fontSize="10.5" fill={isSelected ? color : '#A0A0B8'} fontWeight={isSelected ? '600' : '400'}>
              {(p.cluster_label || p.root_cause || '').slice(0, 24)}…
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Cluster detail ────────────────────────────────────────────────────────────
function ClusterDetail({ pattern, onFix }) {
  const [copied, setCopied] = useState(false);
  const color = TYPE_COLORS[pattern.failure_type] || '#818CF8';
  const fix = pattern.immediate_fix || '';

  function copyFix() {
    navigator.clipboard && navigator.clipboard.writeText(fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '12px', overflow: 'hidden', borderTop: `3px solid ${color}` }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #1A1A26' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#F1F1FA', lineHeight: '1.3' }}>
            {pattern.cluster_label || pattern.root_cause || 'Failure Cluster'}
          </div>
          <span style={{ padding: '2px 9px', background: '#EF444415', border: '1px solid #EF444435', borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#EF4444', flexShrink: 0 }}>
            {(pattern.suggested_priority || 'MEDIUM')} PRIORITY
          </span>
        </div>
        <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
          <span style={{ color, fontWeight: '600', fontFamily: 'JetBrains Mono, monospace' }}>{pattern.scenario_count} failures</span>
          <span style={{ color: '#60607A' }}>{pattern.failure_type.replace(/_/g,' ')}</span>
          <span style={{ color: '#60607A' }}>{pattern.percentage_of_total_failures ? `${Math.round(pattern.percentage_of_total_failures)}% of total` : ''}</span>
        </div>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px' }}>Root Cause</div>
          <div style={{ fontSize: '13px', color: '#D0D0E8', lineHeight: '1.5' }}>{pattern.root_cause || '—'}</div>
        </div>

        {pattern.evidence && (
          <div>
            <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px' }}>Evidence</div>
            <div style={{ fontSize: '13px', color: '#A0A0B8', lineHeight: '1.5' }}>{pattern.evidence}</div>
          </div>
        )}

        {pattern.example_inputs && pattern.example_inputs.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>Example Inputs</div>
            {pattern.example_inputs.slice(0, 3).map((ex, i) => (
              <div key={i} style={{ padding: '7px 11px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '6px', fontSize: '12px', color: '#F1F1FA', lineHeight: '1.4', marginBottom: '5px', fontStyle: 'italic' }}>
                "{ex}"
              </div>
            ))}
          </div>
        )}

        {fix && (
          <div>
            <div style={{ fontSize: '10px', color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>Immediate Fix</div>
            <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: '7px', fontSize: '12px', color: '#D0D0E8', lineHeight: '1.5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
              {fix}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={copyFix} style={{ flex: 1, padding: '8px', background: copied ? 'rgba(34,197,94,0.1)' : '#1A1A26', border: `1px solid ${copied ? '#22C55E40' : '#2A2A3A'}`, borderRadius: '7px', fontSize: '12px', fontWeight: '600', color: copied ? '#22C55E' : '#A0A0B8', transition: 'all 0.2s' }}>
                {copied ? '✓ Copied' : 'Copy Fix'}
              </button>
              <button onClick={onFix} style={{ flex: 2, padding: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '7px', fontSize: '12px', fontWeight: '600', color: '#818CF8' }}>
                Full Recommendations →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyAnalysis({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px', padding: '40px 20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F1F1FA', marginBottom: '10px' }}>No failure analysis yet</h2>
        <p style={{ fontSize: '13px', color: '#60607A', lineHeight: '1.6', marginBottom: '24px' }}>
          Failure analysis runs automatically after each test. Complete a test run to see HDBSCAN-clustered failure patterns with root cause analysis.
        </p>
        <button onClick={() => onNavigate('run-tests')} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#6366F1,#818CF8)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
          Run a Test
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function FailureAnalysis({ currentRun, detailsLoading, onNavigate }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  if (detailsLoading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60607A' }}>Loading…</div>;

  const analysis = currentRun?.analysis_json;
  if (!analysis || !analysis.failure_patterns || analysis.failure_patterns.length === 0) {
    if (!currentRun || currentRun.status === 'running') {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60607A' }}>
          {currentRun?.status === 'running' ? 'Evaluation in progress…' : 'No analysis available'}
        </div>
      );
    }
    return <EmptyAnalysis onNavigate={onNavigate} />;
  }

  const patterns = analysis.failure_patterns;
  const testRun  = analysis.test_run || {};
  const selected = selectedIdx !== null ? patterns[selectedIdx] : null;

  return (
    <div className="page-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Failure Analysis</h1>
          <div style={{ fontSize: '13px', color: '#60607A' }}>
            {patterns.length} cluster{patterns.length !== 1 ? 's' : ''} · {testRun.failed || 0} failures · Click a cluster to explore
          </div>
        </div>
        <button onClick={() => onNavigate('fixes')} style={{ padding: '9px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#818CF8', display: 'flex', alignItems: 'center', gap: '7px' }}>
          View Fix Recommendations →
        </button>
      </div>

      <div className="grid g-sidebar">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cluster map */}
          <div className="card">
            <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '14px' }}>Failure Cluster Map</div>
            <ClusterMap patterns={patterns} selectedId={selectedIdx} onSelect={setSelectedIdx}/>
            {selectedIdx === null && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#60607A', marginTop: '10px' }}>Click a cluster to view details →</div>
            )}
          </div>

          {/* Pattern list */}
          <div className="card">
            <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>All Patterns</div>
            {patterns.map((p, i) => {
              const color = TYPE_COLORS[p.failure_type] || '#818CF8';
              const isSelected = selectedIdx === i;
              return (
                <div key={i} onClick={() => setSelectedIdx(isSelected ? null : i)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < patterns.length-1 ? '1px solid #1A1A26' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? color : '#F1F1FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.cluster_label || p.root_cause || p.failure_type}
                    </div>
                    <div style={{ fontSize: '11px', color: '#60607A' }}>{p.failure_type.replace(/_/g,' ')} · {p.suggested_priority || 'MEDIUM'} priority</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{p.scenario_count}</div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60607A" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              );
            })}
          </div>

          {/* Contrast insights */}
          {analysis.contrast_insights && (
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>Contrastive Insights</div>
              <div style={{ fontSize: '13px', color: '#D0D0E8', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{analysis.contrast_insights}</div>
            </div>
          )}

          {analysis.insight_summary && (
            <div className="card">
              <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>Summary</div>
              <div style={{ fontSize: '13px', color: '#D0D0E8', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{analysis.insight_summary}</div>
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div>
          {selected
            ? <ClusterDetail pattern={selected} onFix={() => onNavigate('fixes')}/>
            : (
              <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#F1F1FA', marginBottom: '8px' }}>Select a Cluster</div>
                <div style={{ fontSize: '12px', color: '#60607A', lineHeight: '1.5' }}>Click any cluster in the map or list to view root cause, evidence, and an immediate fix suggestion.</div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

window.FailureAnalysis = FailureAnalysis;
