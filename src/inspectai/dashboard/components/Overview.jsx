const { useState, useEffect, useRef, useCallback } = React;

// ── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const size = 180, cx = 90, cy = 90, outerR = 72, innerR = 50;

  function toXY(deg, r) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(startDeg, endDeg) {
    const s = toXY(startDeg, outerR), e = toXY(endDeg, outerR);
    const si = toXY(startDeg, innerR), ei = toXY(endDeg, innerR);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s.x.toFixed(2)} ${s.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`,
      `L ${ei.x.toFixed(2)} ${ei.y.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${si.x.toFixed(2)} ${si.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  let cumulative = 0;
  const segments = data.map((d) => {
    const startDeg = (cumulative / total) * 360;
    cumulative += d.count;
    const endDeg = (cumulative / total) * 360;
    return { ...d, path: arcPath(startDeg, endDeg) };
  });

  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill={seg.color}
            opacity={hovered === null || hovered === i ? 1 : 0.4}
            style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <title>{seg.label}: {seg.count} ({Math.round((seg.count / total) * 100)}%)</title>
          </path>
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#F1F1FA">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#60607A">
          failures
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              opacity: hovered === null || hovered === i ? 1 : 0.4,
              transition: 'opacity 0.15s', cursor: 'default',
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#A0A0B8', flex: 1 }}>{seg.label}</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#F1F1FA', fontFamily: 'JetBrains Mono, monospace' }}>
              {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trend line chart ──────────────────────────────────────────────────────────
function TrendLine({ data }) {
  const W = 520, H = 110;
  const pad = { t: 10, r: 16, b: 28, l: 38 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const minV = 0.3, maxV = 1.0;

  const xFn = (i) => pad.l + (i / (data.length - 1)) * iW;
  const yFn = (v) => pad.t + iH - ((v - minV) / (maxV - minV)) * iH;

  const linePoints = data.map((d, i) => `${xFn(i).toFixed(1)},${yFn(d.passRate).toFixed(1)}`).join(' ');
  const areaPoints = [
    `${xFn(0).toFixed(1)},${yFn(data[0].passRate).toFixed(1)}`,
    ...data.slice(1).map((d, i) => `${xFn(i + 1).toFixed(1)},${yFn(d.passRate).toFixed(1)}`),
    `${xFn(data.length - 1).toFixed(1)},${(pad.t + iH).toFixed(1)}`,
    `${xFn(0).toFixed(1)},${(pad.t + iH).toFixed(1)}`,
  ].join(' ');

  const yGridLines = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const xLabelIndices = data.map((_, i) => i).filter((i) => i % 3 === 0 || i === data.length - 1);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#22C55E" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {yGridLines.map((v) => (
        <line key={v}
          x1={pad.l} y1={yFn(v).toFixed(1)} x2={W - pad.r} y2={yFn(v).toFixed(1)}
          stroke="#2A2A3A" strokeWidth="1" />
      ))}

      <polygon points={areaPoints} fill="url(#trendFill)" />
      <polyline points={linePoints} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {data.map((d, i) => (
        <circle key={i} cx={xFn(i).toFixed(1)} cy={yFn(d.passRate).toFixed(1)} r="3.5"
          fill="#22C55E" stroke="#0A0A0F" strokeWidth="2">
          <title>{d.date}: {Math.round(d.passRate * 100)}%</title>
        </circle>
      ))}

      {xLabelIndices.map((i) => (
        <text key={i} x={xFn(i).toFixed(1)} y={H - 6} textAnchor="middle" fontSize="10" fill="#60607A">
          {data[i].date}
        </text>
      ))}

      {[0.5, 0.7].map((v) => (
        <text key={v} x={pad.l - 5} y={yFn(v) + 4} textAnchor="end" fontSize="10" fill="#60607A">
          {Math.round(v * 100)}%
        </text>
      ))}
    </svg>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, accent, icon, animated }) {
  const displayed = animated ? useCountUp(parseInt(value)) : value;
  return (
    <div style={{
      background: '#12121A',
      border: '1px solid #2A2A3A',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ color: '#60607A', fontSize: '12px' }}>{label}</span>
        {icon && <span style={{ marginLeft: 'auto', color: '#60607A' }}>{icon}</span>}
      </div>
      <div style={{
        fontSize: '32px', fontWeight: '800', lineHeight: 1,
        color: accent || '#F1F1FA',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '-1px',
      }}>
        {animated ? displayed : value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: '#60607A', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ── Pass rate ring ─────────────────────────────────────────────────────────────
function PassRateRing({ value }) {
  const percent = Math.round(value * 100);
  const displayedPercent = useCountUp(percent, 1600);
  const strokeDasharray = 2 * Math.PI * 54;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const fillFraction = mounted ? value : 0;
  const strokeDashoffset = strokeDasharray * (1 - fillFraction);
  const ringColor = percent >= 80 ? '#22C55E' : percent >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r="54" fill="none" stroke="#2A2A3A" strokeWidth="10" />
        <circle
          cx="70" cy="70" r="54"
          fill="none"
          stroke={ringColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: '30px', fontWeight: '800', lineHeight: 1,
          color: ringColor,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {displayedPercent}%
        </span>
        <span style={{ fontSize: '11px', color: '#60607A', marginTop: '2px' }}>pass rate</span>
      </div>
    </div>
  );
}

// ── Recent runs table ─────────────────────────────────────────────────────────
function RecentRuns({ runs, onNavigate }) {
  const typeColors = {
    CUSTOMER_SUPPORT: '#6366F1',
    RAG:              '#22C55E',
    MULTI_AGENT:      '#F59E0B',
  };
  return (
    <div>
      {runs.map((run, i) => {
        const pr = Math.round(run.passRate * 100);
        const color = pr >= 80 ? '#22C55E' : pr >= 60 ? '#F59E0B' : '#EF4444';
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 0',
            borderBottom: i < runs.length - 1 ? '1px solid #1A1A26' : 'none',
          }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: `rgba(${typeColors[run.systemType] === '#6366F1' ? '99,102,241' : typeColors[run.systemType] === '#22C55E' ? '34,197,94' : '245,158,11'},0.12)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700',
              color: typeColors[run.systemType] || '#818CF8',
              flexShrink: 0,
            }}>
              {run.company.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '2px' }}>
                {run.company}
              </div>
              <div style={{ fontSize: '11px', color: '#60607A' }}>
                {run.systemType.replace(/_/g, ' ')} · {run.scenarios} scenarios
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color, fontFamily: 'JetBrains Mono, monospace' }}>
                {pr}%
              </div>
              <div style={{ fontSize: '10px', color: '#60607A' }}>{run.timeAgo}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Overview page ────────────────────────────────────────────────────────
function Overview({ onNavigate }) {
  const data = window.MOCK_DATA;
  const passPercent = Math.round(data.passRate * 100);
  const passedCount = data.totalScenarios - data.activeFailures;

  const card = {
    background: '#12121A',
    border: '1px solid #2A2A3A',
    borderRadius: '12px',
    padding: '20px',
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>
            Overview
          </h1>
          <div style={{ fontSize: '13px', color: '#60607A' }}>
            QuickShop Support Bot · CUSTOMER_SUPPORT · Last run 23 min ago
          </div>
        </div>
        <button
          onClick={() => onNavigate('run-tests')}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            borderRadius: '8px',
            fontSize: '13px', fontWeight: '600', color: '#fff',
            display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: '0 0 20px rgba(99,102,241,0.35)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Run New Test
        </button>
      </div>

      {/* Bento grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gridTemplateRows: 'auto auto auto', gap: '16px' }}>

        {/* Pass rate ring — spans 1 col, 1 row */}
        <div style={{
          ...card,
          gridColumn: '1',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '4px',
        }}>
          <PassRateRing value={data.passRate} />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#60607A', textAlign: 'center' }}>
            {passedCount} / {data.totalScenarios} scenarios passed
          </div>
        </div>

        {/* Failure breakdown donut — spans 2 cols */}
        <div style={{ ...card, gridColumn: '2 / 4' }}>
          <div style={{ fontSize: '12px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
            Failure Breakdown
          </div>
          <DonutChart data={data.failureBreakdown} />
        </div>

        {/* Active failures stat */}
        <div style={{ ...card, gridColumn: '4' }}>
          <StatTile
            label="Active Failures"
            value={data.activeFailures}
            sub={`${Math.round((data.activeFailures / data.totalScenarios) * 100)}% failure rate`}
            accent="#EF4444"
            animated
          />
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.failureBreakdown.slice(0, 3).map((fb) => (
              <div key={fb.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', background: '#2A2A3A', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(fb.count / data.activeFailures) * 100}%`,
                    height: '100%',
                    background: fb.color,
                    borderRadius: '2px',
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: '#60607A', minWidth: '22px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{fb.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend line — spans full width */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Pass Rate Trend · Last 10 Runs
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: '11px', color: '#60607A' }}>+28pp improvement since Apr 1</span>
            </div>
          </div>
          <TrendLine data={data.trendData} />
        </div>

        {/* Total scenarios */}
        <div style={{ ...card, gridColumn: '1' }}>
          <div style={{ fontSize: '12px', color: '#60607A', marginBottom: '8px' }}>Total Scenarios</div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#F1F1FA', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-1px' }}>
            {useCountUp(data.totalScenarios)}
          </div>
          <div style={{ fontSize: '12px', color: '#60607A', marginTop: '6px' }}>adversarial + grounded</div>
        </div>

        {/* Systems tested */}
        <div style={{ ...card, gridColumn: '2' }}>
          <div style={{ fontSize: '12px', color: '#60607A', marginBottom: '8px' }}>Systems Tested</div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#F1F1FA', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-1px' }}>
            {useCountUp(data.systemsTested)}
          </div>
          <div style={{ fontSize: '12px', color: '#60607A', marginTop: '6px' }}>across 3 companies</div>
        </div>

        {/* Recent runs — spans 2 cols */}
        <div style={{ ...card, gridColumn: '3 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '12px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Recent Runs
            </div>
            <button
              onClick={() => onNavigate('results')}
              style={{ fontSize: '11px', color: '#818CF8', background: 'transparent', padding: '4px 8px', borderRadius: '4px' }}
            >
              View all →
            </button>
          </div>
          <RecentRuns runs={data.recentRuns} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

window.Overview = Overview;
