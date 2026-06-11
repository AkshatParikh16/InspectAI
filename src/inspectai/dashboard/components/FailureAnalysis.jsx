const { useState } = React;

const TYPE_COLORS = {
  POLICY_VIOLATION: '#EF4444',
  HALLUCINATION:    '#6366F1',
  INCOMPLETE:       '#F59E0B',
  WRONG_ANSWER:     '#EC4899',
  ESCALATION_FAIL:  '#06B6D4',
  CONTEXT_LOSS:     '#8B5CF6',
};

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values, color }) {
  const W = 80, H = 30;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const xStep = W / (values.length - 1);
  const pts = values.map((v, i) =>
    `${(i * xStep).toFixed(1)},${(H - ((v - min) / range) * H * 0.85 - H * 0.07).toFixed(1)}`
  ).join(' ');
  const area = [
    `${pts.split(' ')[0]}`,
    ...pts.split(' ').slice(1),
    `${(xStep * (values.length - 1)).toFixed(1)},${H}`,
    `0,${H}`,
  ].join(' ');

  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  const trend = lastVal > prevVal ? '↑' : lastVal < prevVal ? '↓' : '–';
  const trendColor = trend === '↑' ? '#EF4444' : trend === '↓' ? '#22C55E' : '#60607A';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width={W} height={H} style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#spark-${color.slice(1)})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx={(xStep * (values.length - 1)).toFixed(1)}
          cy={(H - ((lastVal - min) / range) * H * 0.85 - H * 0.07).toFixed(1)}
          r="3" fill={color} stroke="#12121A" strokeWidth="1.5"
        />
      </svg>
      <span style={{ fontSize: '11px', color: trendColor, fontWeight: '600' }}>{trend}</span>
    </div>
  );
}

// ── Cluster SVG map ───────────────────────────────────────────────────────────
function ClusterMap({ clusters, selectedId, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const maxCount = Math.max(...clusters.map(c => c.count));
  const W = 500, H = 290;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {clusters.map(c => (
          <radialGradient key={c.id} id={`clusterGlow-${c.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={c.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={c.color} stopOpacity="0" />
          </radialGradient>
        ))}
        {clusters.map(c => (
          <filter key={c.id} id={`glow-${c.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={selectedId === c.id ? '6' : '3'} result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        ))}
        {/* Grid lines */}
      </defs>

      {/* Background grid */}
      {[...Array(5)].map((_, i) => (
        <line key={`hg-${i}`} x1="0" y1={H * (i + 1) / 6} x2={W} y2={H * (i + 1) / 6}
          stroke="#1A1A26" strokeWidth="1" />
      ))}
      {[...Array(7)].map((_, i) => (
        <line key={`vg-${i}`} x1={W * (i + 1) / 8} y1="0" x2={W * (i + 1) / 8} y2={H}
          stroke="#1A1A26" strokeWidth="1" />
      ))}

      {/* Connecting lines between clusters (faint) */}
      {clusters.map((c, i) =>
        clusters.slice(i + 1).map((c2) => (
          <line key={`${c.id}-${c2.id}`}
            x1={c.cx} y1={c.cy} x2={c2.cx} y2={c2.cy}
            stroke="#2A2A3A" strokeWidth="1" strokeDasharray="4,4" />
        ))
      )}

      {/* Cluster nodes */}
      {clusters.map(c => {
        const r = 26 + (c.count / maxCount) * 36;
        const isSelected = selectedId === c.id;
        const isHovered  = hovered === c.id;
        const scale = isSelected ? 1.08 : isHovered ? 1.04 : 1;

        return (
          <g
            key={c.id}
            style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
            transform={`translate(${c.cx},${c.cy}) scale(${scale}) translate(${-c.cx},${-c.cy})`}
            onClick={() => onSelect(isSelected ? null : c.id)}
            onMouseEnter={() => setHovered(c.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Glow halo */}
            <circle cx={c.cx} cy={c.cy} r={r * 2.2}
              fill={`url(#clusterGlow-${c.id})`}
              opacity={isSelected || isHovered ? 1 : 0.5}
            />
            {/* Ring */}
            <circle cx={c.cx} cy={c.cy} r={r + 5}
              fill="none"
              stroke={c.color}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={isSelected ? 'none' : '5,3'}
              opacity={isSelected ? 0.8 : 0.3}
            />
            {/* Main circle */}
            <circle cx={c.cx} cy={c.cy} r={r}
              fill={c.color}
              opacity={isSelected ? 0.92 : isHovered ? 0.8 : 0.65}
              filter={`url(#glow-${c.id})`}
            />
            {/* Count */}
            <text x={c.cx} y={c.cy - 5} textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">
              {c.count}
            </text>
            {/* Failure type label */}
            <text x={c.cx} y={c.cy + 12} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.75)" fontWeight="600">
              {c.type.replace(/_/g, ' ')}
            </text>
            {/* Cluster label below */}
            <text x={c.cx} y={c.cy + r + 16} textAnchor="middle" fontSize="11" fill={isSelected ? c.color : '#A0A0B8'} fontWeight={isSelected ? '600' : '400'}>
              {c.label.length > 22 ? c.label.slice(0, 22) + '…' : c.label}
            </text>
          </g>
        );
      })}

      {/* Axis labels */}
      <text x="8" y="14" fontSize="9" fill="#3A3A50" fontStyle="italic">← less severe</text>
      <text x={W - 8} y="14" fontSize="9" fill="#3A3A50" fontStyle="italic" textAnchor="end">more severe →</text>
    </svg>
  );
}

// ── Cluster detail panel ──────────────────────────────────────────────────────
function ClusterDetail({ cluster, onFix }) {
  const [copied, setCopied] = useState(false);

  function copyFix() {
    navigator.clipboard && navigator.clipboard.writeText(cluster.immediatefix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const priorityColor = cluster.priority === 'HIGH' ? '#EF4444' : '#F59E0B';

  return (
    <div style={{
      background: '#12121A', border: '1px solid #2A2A3A',
      borderRadius: '12px', overflow: 'hidden',
      borderTop: `3px solid ${cluster.color}`,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1A1A26' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#F1F1FA', lineHeight: '1.3' }}>
            {cluster.label}
          </div>
          <span style={{
            padding: '3px 9px',
            background: `${priorityColor}15`,
            border: `1px solid ${priorityColor}35`,
            borderRadius: '5px',
            fontSize: '11px', fontWeight: '700', color: priorityColor,
            flexShrink: 0,
          }}>
            {cluster.priority} PRIORITY
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#60607A' }}>
          <span style={{ color: cluster.color, fontWeight: '600', fontFamily: 'JetBrains Mono, monospace' }}>
            {cluster.count} failures
          </span>
          <span>{cluster.type.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Root cause */}
        <div>
          <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>
            Root Cause
          </div>
          <div style={{ fontSize: '13px', color: '#D0D0E8', lineHeight: '1.5' }}>
            {cluster.rootCause}
          </div>
        </div>

        {/* Evidence */}
        <div>
          <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>
            Evidence
          </div>
          <div style={{ fontSize: '13px', color: '#A0A0B8', lineHeight: '1.5' }}>
            {cluster.evidence}
          </div>
        </div>

        {/* Example failures */}
        <div>
          <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>
            Example AI Outputs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {cluster.examples.map((ex, i) => (
              <div key={i} style={{
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: '7px',
                fontSize: '12px', color: '#F1F1FA', lineHeight: '1.4',
                fontStyle: 'italic',
              }}>
                "{ex}"
              </div>
            ))}
          </div>
        </div>

        {/* Immediate fix */}
        <div>
          <div style={{ fontSize: '11px', color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>
            Immediate Fix
          </div>
          <div style={{
            padding: '12px',
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '8px',
            fontSize: '12px', color: '#D0D0E8', lineHeight: '1.5', fontFamily: 'JetBrains Mono, monospace',
            marginBottom: '10px',
          }}>
            {cluster.immediatefix}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={copyFix}
              style={{
                flex: 1,
                padding: '8px',
                background: copied ? 'rgba(34,197,94,0.12)' : '#1A1A26',
                border: `1px solid ${copied ? '#22C55E40' : '#2A2A3A'}`,
                borderRadius: '7px',
                fontSize: '12px', fontWeight: '600',
                color: copied ? '#22C55E' : '#A0A0B8',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied' : 'Copy Fix'}
            </button>
            <button
              onClick={onFix}
              style={{
                flex: 2,
                padding: '8px',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '7px',
                fontSize: '12px', fontWeight: '600', color: '#818CF8',
              }}
            >
              View Full Recommendations →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Failure type summary row ──────────────────────────────────────────────────
function FailureTypeRow({ type, count, total, trendValues, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid #1A1A26',
    }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: '#F1F1FA', marginBottom: '4px' }}>
          {type.replace(/_/g, ' ')}
        </div>
        <div style={{ height: '3px', background: '#1A1A26', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: color, borderRadius: '2px' }} />
        </div>
      </div>
      <Sparkline values={trendValues} color={color} />
      <div style={{
        fontSize: '14px', fontWeight: '700',
        color, fontFamily: 'JetBrains Mono, monospace',
        minWidth: '24px', textAlign: 'right',
      }}>
        {count}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function FailureAnalysis({ onNavigate }) {
  const data = window.MOCK_DATA;
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const selectedCluster = data.failureClusters.find(c => c.id === selectedClusterId);
  const totalFailures = data.activeFailures;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Failure Analysis</h1>
          <div style={{ fontSize: '13px', color: '#60607A' }}>
            HDBSCAN clustering · {totalFailures} failures across {data.failureClusters.length} clusters · Click a cluster to explore
          </div>
        </div>
        <button
          onClick={() => onNavigate('fixes')}
          style={{
            padding: '9px 18px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '8px',
            fontSize: '13px', fontWeight: '600', color: '#818CF8',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          View Fix Recommendations
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Left: cluster map + breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Cluster map */}
          <div style={{
            background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '12px', padding: '20px',
          }}>
            <div style={{ fontSize: '12px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              Failure Cluster Map
            </div>
            <ClusterMap
              clusters={data.failureClusters}
              selectedId={selectedClusterId}
              onSelect={setSelectedClusterId}
            />
            {!selectedClusterId && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#60607A', marginTop: '12px' }}>
                Click a cluster to view details →
              </div>
            )}
          </div>

          {/* Failure type breakdown with sparklines */}
          <div style={{
            background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '12px', padding: '20px',
          }}>
            <div style={{ fontSize: '12px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>
              Failure Type Trends · 10 Runs
            </div>
            <div style={{ fontSize: '11px', color: '#60607A', marginBottom: '14px' }}>
              Sparkline shows count per run — up arrows indicate worsening
            </div>
            {data.failureBreakdown.map((fb) => (
              <FailureTypeRow
                key={fb.type}
                type={fb.type}
                count={fb.count}
                total={totalFailures}
                trendValues={data.failureTrends[fb.type] || []}
                color={fb.color}
              />
            ))}
          </div>

          {/* D5 Contrast insight */}
          <div style={{
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{ fontSize: '12px', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>
              D5 Contrastive Insight · Passes vs Failures
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  label: 'Dollar amounts in user message',
                  passVal: '12%', failVal: '87%',
                  insight: 'Almost all refund policy failures involve explicit dollar amounts. Passing responses never mention amounts — they redirect to policy.',
                },
                {
                  label: 'Multi-part questions',
                  passVal: '8%', failVal: '71%',
                  insight: 'Incomplete failures cluster heavily around messages with 3+ questions. Single-question messages almost always pass.',
                },
                {
                  label: 'Specific locations or times requested',
                  passVal: '5%', failVal: '94%',
                  insight: 'Hallucination failures are strongly correlated with questions that implicitly invite the AI to invent specific facts.',
                },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px', background: '#0D0D16', borderRadius: '8px', border: '1px solid #2A2A3A' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#F1F1FA', marginBottom: '8px' }}>
                    "{item.label}"
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22C55E' }} />
                      <span style={{ fontSize: '11px', color: '#A0A0B8' }}>In passing: </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#22C55E', fontFamily: 'JetBrains Mono, monospace' }}>{item.passVal}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} />
                      <span style={{ fontSize: '11px', color: '#A0A0B8' }}>In failures: </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#EF4444', fontFamily: 'JetBrains Mono, monospace' }}>{item.failVal}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#60607A', lineHeight: '1.4' }}>{item.insight}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: cluster detail or placeholder */}
        <div>
          {selectedCluster
            ? <ClusterDetail cluster={selectedCluster} onFix={() => onNavigate('fixes')} />
            : (
              <div style={{
                background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '12px',
                padding: '40px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#F1F1FA', marginBottom: '8px' }}>
                  Select a Cluster
                </div>
                <div style={{ fontSize: '13px', color: '#60607A', lineHeight: '1.5', marginBottom: '20px' }}>
                  Click any cluster in the map to see root cause analysis, evidence, and the immediate fix recommendation.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.failureClusters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClusterId(c.id)}
                      style={{
                        padding: '10px 14px',
                        background: '#1A1A26',
                        border: '1px solid #2A2A3A',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#F1F1FA' }}>{c.label}</div>
                        <div style={{ fontSize: '11px', color: '#60607A' }}>{c.count} failures · {c.priority} priority</div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60607A" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

window.FailureAnalysis = FailureAnalysis;
