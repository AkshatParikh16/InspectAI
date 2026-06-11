const { useState, useEffect } = React;

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ── Pass rate ring ────────────────────────────────────────────────────────────
function PassRateRing({ value }) {
  const pct = Math.round((value || 0) * 100);
  const displayed = useCountUp(pct, 1500);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - (mounted ? (value || 0) : 0));
  const color = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ position: 'relative', width: '130px', height: '130px' }}>
      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r="54" fill="none" stroke="#2A2A3A" strokeWidth="10"/>
        <circle cx="65" cy="65" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '26px', fontWeight: '800', color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
          {displayed}%
        </span>
        <span style={{ fontSize: '10px', color: '#60607A', marginTop: '2px' }}>pass rate</span>
      </div>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const size = 160, cx = 80, cy = 80, outerR = 66, innerR = 46;
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const [hovered, setHovered] = useState(null);

  function toXY(deg, r) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(startDeg, endDeg) {
    const s = toXY(startDeg, outerR), e = toXY(endDeg, outerR);
    const si = toXY(startDeg, innerR), ei = toXY(endDeg, innerR);
    const lg = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s.x.toFixed(1)} ${s.y.toFixed(1)}`,
      `A ${outerR} ${outerR} 0 ${lg} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`,
      `L ${ei.x.toFixed(1)} ${ei.y.toFixed(1)}`,
      `A ${innerR} ${innerR} 0 ${lg} 0 ${si.x.toFixed(1)} ${si.y.toFixed(1)}`,
      'Z',
    ].join(' ');
  }

  let cum = 0;
  const segments = data.map(d => {
    const start = (cum / total) * 360;
    cum += d.count;
    return { ...d, path: arc(start, (cum / total) * 360) };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color}
            opacity={hovered === null || hovered === i ? 1 : 0.35}
            style={{ cursor: 'default', transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            <title>{s.type}: {s.count}</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#F1F1FA">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#60607A">failures</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px',
            opacity: hovered === null || hovered === i ? 1 : 0.4, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: s.color, flexShrink: 0 }}/>
            <span style={{ fontSize: '11px', color: '#A0A0B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.type.replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#F1F1FA', fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trend line ────────────────────────────────────────────────────────────────
function TrendLine({ runs }) {
  const W = 500, H = 100;
  const pad = { t: 8, r: 12, b: 26, l: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const minV = 0, maxV = 1;

  const data = [...runs].reverse();
  if (data.length < 2) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: H, color: '#60607A', fontSize: '12px' }}>
        Need ≥2 completed runs for a trend line
      </div>
    );
  }

  const xFn = i => pad.l + (i / (data.length - 1)) * iW;
  const yFn = v => pad.t + iH - v * iH;
  const pts = data.map((d, i) => `${xFn(i).toFixed(1)},${yFn(d.pass_rate || 0).toFixed(1)}`).join(' ');
  const area = [
    `${xFn(0).toFixed(1)},${yFn(data[0].pass_rate || 0).toFixed(1)}`,
    ...data.slice(1).map((d, i) => `${xFn(i+1).toFixed(1)},${yFn(d.pass_rate || 0).toFixed(1)}`),
    `${xFn(data.length-1).toFixed(1)},${(pad.t+iH).toFixed(1)}`,
    `${xFn(0).toFixed(1)},${(pad.t+iH).toFixed(1)}`,
  ].join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="trendFill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(v => (
        <line key={v} x1={pad.l} y1={yFn(v)} x2={W-pad.r} y2={yFn(v)} stroke="#2A2A3A" strokeWidth="1"/>
      ))}
      <polygon points={area} fill="url(#trendFill2)"/>
      <polyline points={pts} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => (
        <circle key={i} cx={xFn(i)} cy={yFn(d.pass_rate||0)} r="3.5" fill="#22C55E" stroke="#0A0A0F" strokeWidth="2">
          <title>{new Date(d.created_at).toLocaleDateString()}: {Math.round((d.pass_rate||0)*100)}%</title>
        </circle>
      ))}
      {data.filter((_,i) => i === 0 || i === data.length-1 || i % Math.ceil(data.length/4) === 0).map((d, _, arr) => {
        const idx = data.indexOf(d);
        return (
          <text key={idx} x={xFn(idx)} y={H-6} textAnchor="middle" fontSize="9" fill="#60607A">
            {new Date(d.created_at).toLocaleDateString('en', { month:'short', day:'numeric' })}
          </text>
        );
      })}
      {[0.25, 0.5, 0.75].map(v => (
        <text key={v} x={pad.l-4} y={yFn(v)+4} textAnchor="end" fontSize="9" fill="#60607A">{Math.round(v*100)}%</text>
      ))}
    </svg>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyOverview({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '380px', padding: '40px 20px' }}>
        <div style={{
          width: '64px', height: '64px', margin: '0 auto 20px',
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '10px' }}>
          No evaluations yet
        </h2>
        <p style={{ fontSize: '14px', color: '#60607A', lineHeight: '1.6', marginBottom: '24px' }}>
          Run your first test to see AI system pass rate, failure breakdown, trend analysis, and actionable fix recommendations.
        </p>
        <button
          onClick={() => onNavigate('run-tests')}
          style={{
            padding: '11px 24px',
            background: 'linear-gradient(135deg,#6366F1,#818CF8)',
            borderRadius: '9px', fontSize: '14px', fontWeight: '700', color: '#fff',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)',
          }}
        >
          Run First Evaluation
        </button>
      </div>
    </div>
  );
}

// ── Overview page ─────────────────────────────────────────────────────────────
function Overview({ runs, loading, error, onNavigate }) {
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60607A' }}>
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ color: '#EF4444', fontSize: '14px' }}>Could not reach API: {error}</div>
        <div style={{ color: '#60607A', fontSize: '12px' }}>Make sure the InspectAI server is running at port 8000</div>
      </div>
    );
  }

  const completed = runs.filter(r => r.status === 'completed');
  if (completed.length === 0) return <EmptyOverview onNavigate={onNavigate} />;

  const latest = completed[0];
  const totalScenarios = completed.reduce((s, r) => s + (r.total_scenarios || 0), 0);
  const totalFailures  = completed.reduce((s, r) => s + (r.total_failures  || 0), 0);
  const avgPassRate    = completed.reduce((s, r) => s + (r.pass_rate || 0), 0) / completed.length;

  // Build failure breakdown from latest completed run
  const failureBreakdown = (() => {
    if (!latest) return [];
    const colors = { POLICY_VIOLATION:'#EF4444', HALLUCINATION:'#6366F1', INCOMPLETE:'#F59E0B', WRONG_ANSWER:'#EC4899', CONTEXT_LOSS:'#8B5CF6', ESCALATION_FAILURE:'#06B6D4' };
    const breakdown = latest.results_json?.failure_breakdown || {};
    return Object.entries(breakdown).filter(([,v]) => v > 0).map(([k, v]) => ({
      type: k, count: v, color: colors[k] || '#818CF8',
    }));
  })();

  const displayedScenarios = useCountUp(totalScenarios);
  const displayedRuns      = useCountUp(completed.length);

  return (
    <div className="page-scroll">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Overview</h1>
          <div style={{ fontSize: '13px', color: '#60607A' }}>
            {latest.company_name} · {latest.system_type.replace(/_/g,' ')} · {completed.length} run{completed.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={() => onNavigate('run-tests')}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg,#6366F1,#818CF8)',
            borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff',
            display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: '0 0 20px rgba(99,102,241,0.35)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Run New Test
        </button>
      </div>

      {/* Bento grid */}
      <div className="grid g-4" style={{ marginBottom: '16px' }}>
        {/* Pass rate ring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <PassRateRing value={latest.pass_rate || 0} />
          <div style={{ fontSize: '12px', color: '#60607A', textAlign: 'center' }}>
            {latest.pass_rate !== null ? `${Math.round((latest.pass_rate||0) * (latest.total_scenarios||0))} / ${latest.total_scenarios} passed` : '—'}
          </div>
        </div>

        {/* Failure donut — spans 2 */}
        <div className="card span-2">
          <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '14px' }}>
            Failure Breakdown · Latest Run
          </div>
          {failureBreakdown.length > 0
            ? <DonutChart data={failureBreakdown} />
            : <div style={{ color: '#22C55E', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>All scenarios passed</div>
          }
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Total Scenarios', val: displayedScenarios, color: '#F1F1FA' },
            { label: 'Completed Runs', val: displayedRuns, color: '#818CF8' },
            { label: 'Avg Pass Rate', val: `${Math.round(avgPassRate*100)}%`, color: avgPassRate >= 0.8 ? '#22C55E' : avgPassRate >= 0.6 ? '#F59E0B' : '#EF4444' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#60607A', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend line — full width */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>
          Pass Rate Trend · {completed.length} Run{completed.length !== 1 ? 's' : ''}
        </div>
        <TrendLine runs={completed} />
      </div>

      {/* Recent runs */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Recent Runs</div>
          <button onClick={() => onNavigate('results')} style={{ fontSize: '11px', color: '#818CF8', background: 'transparent' }}>View all →</button>
        </div>
        {completed.slice(0, 5).map((run, i) => {
          const pr = Math.round((run.pass_rate || 0) * 100);
          const c = pr >= 80 ? '#22C55E' : pr >= 60 ? '#F59E0B' : '#EF4444';
          return (
            <div key={run.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 4 ? '1px solid #1A1A26' : 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#818CF8', flexShrink: 0 }}>
                {run.company_name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.company_name}</div>
                <div style={{ fontSize: '11px', color: '#60607A' }}>{run.system_type.replace(/_/g,' ')} · {run.total_scenarios} scenarios</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: c, fontFamily: 'JetBrains Mono, monospace' }}>{pr}%</div>
                <div style={{ fontSize: '10px', color: '#60607A' }}>{new Date(run.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.Overview = Overview;
