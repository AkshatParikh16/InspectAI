const { useState, useEffect } = React;
const { GradeGauge, PageHeader, StatusBadge, gradeFromPassRate, formatRelativeTime, useCountUp } = window.Shared;
const FAIL_COLORS = window.FAIL_COLORS;

function IssueTreemap({ breakdown }) {
  const total = breakdown.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {breakdown.map(d => (
        <div key={d.type}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#475569' }}>{d.type.replace(/_/g, ' ')}</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>{d.count}</span>
          </div>
          <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${(d.count / total) * 100}%`, height: '100%',
              background: d.color, borderRadius: '4px', transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ runs }) {
  const W = 480, H = 100, pad = { t: 8, r: 12, b: 26, l: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const data = [...runs].reverse();

  if (data.length < 2) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>
        Quality trend appears after multiple monitoring cycles
      </div>
    );
  }

  const xFn = i => pad.l + (i / (data.length - 1)) * iW;
  const yFn = v => pad.t + iH - v * iH;
  const pts = data.map((d, i) => `${xFn(i).toFixed(1)},${yFn(d.pass_rate || 0).toFixed(1)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1.0].map(v => (
        <line key={v} x1={pad.l} y1={yFn(v)} x2={W - pad.r} y2={yFn(v)} stroke="#E2E8F0" strokeWidth="1" />
      ))}
      <polygon points={[
        `${xFn(0)},${yFn(data[0].pass_rate || 0)}`,
        ...data.slice(1).map((d, i) => `${xFn(i + 1)},${yFn(d.pass_rate || 0)}`),
        `${xFn(data.length - 1)},${pad.t + iH}`,
        `${xFn(0)},${pad.t + iH}`,
      ].join(' ')} fill="url(#trendFill)" />
      <polyline points={pts} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={xFn(i)} cy={yFn(d.pass_rate || 0)} r="4" fill="#4F46E5" stroke="#fff" strokeWidth="2" />
      ))}
    </svg>
  );
}

function VerdictCard({ passRate, issueCount }) {
  const grade = gradeFromPassRate(passRate);
  const deploy = passRate >= 0.8 && issueCount < 10;
  return (
    <div className="card" style={{
      borderLeft: `4px solid ${deploy ? '#059669' : '#DC2626'}`,
      background: deploy ? 'linear-gradient(135deg, #F0FDF4, #FFFFFF)' : 'linear-gradient(135deg, #FEF2F2, #FFFFFF)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
        Deployment Verdict
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: deploy ? '#059669' : '#DC2626', marginBottom: '6px' }}>
        {deploy ? '✓ Safe to Deploy' : '✗ Fix Before Deploy'}
      </div>
      <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
        {deploy
          ? `Quality grade ${grade.letter} with ${issueCount} open issues. Your chatbot meets production standards.`
          : `${issueCount} open issues detected. Review remediation plan before your next release.`}
      </p>
    </div>
  );
}


function Dashboard({ runs, currentRun, loading, onNavigate, demoRun }) {
  const completed = runs.filter(r => r.status === 'completed');
  const hasRuns = completed.length > 0;
  const latest = completed[0];
  const isDemo = !hasRuns && !!demoRun;
  const effectiveLatest = latest || (isDemo ? demoRun : null);
  const effectiveCurrent = currentRun || (isDemo ? demoRun : null);
  const monitoringStatus = runs.some(r => r.status === 'running') ? 'running' : (isDemo ? 'demo' : 'active');

  // Hooks must be called unconditionally — before any early returns
  const rawIssueCount = effectiveLatest?.total_failures || 0;
  const countedIssues = useCountUp(isDemo ? 0 : rawIssueCount);
  const displayedIssues = isDemo ? '—' : countedIssues;

  if (loading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>Loading portal…</div>;
  }

  if (!effectiveLatest) {
    return (
      <div className="page-scroll">
        <PageHeader title="Dashboard" subtitle="Your AI quality monitoring overview" />
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Ready to start monitoring</h2>
          <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.6' }}>
            Configure your chatbot endpoint and run your first monitoring cycle to see quality grades, issues, and fix recommendations.
          </p>
          <button onClick={() => onNavigate('settings')} style={{
            padding: '10px 20px', background: '#4F46E5', color: '#fff',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
          }}>Configure Settings →</button>
        </div>
      </div>
    );
  }

  const passRate = effectiveLatest.pass_rate || 0;

  const breakdown = (() => {
    const analysis = effectiveCurrent?.analysis_json;
    if (analysis?.failure_patterns?.length) {
      return analysis.failure_patterns.map(p => ({
        type: p.failure_type,
        count: p.scenario_count,
        color: FAIL_COLORS[p.failure_type] || '#6366F1',
      }));
    }
    const fb = effectiveCurrent?.results_json?.failure_breakdown || {};
    return Object.entries(fb).filter(([, v]) => v > 0).map(([k, v]) => ({
      type: k, count: v, color: FAIL_COLORS[k] || '#6366F1',
    }));
  })();

  const highPriority = isDemo ? '—' : (effectiveCurrent?.fixes_json?.fixes?.filter(f => f.suggested_priority === 'HIGH').length || 0);

  return (
    <div className="page-scroll">
      <PageHeader
        title={`Welcome back${effectiveLatest.company_name ? `, ${effectiveLatest.company_name}` : ''}`}
        subtitle={`${(effectiveLatest.system_type || '').replace(/_/g, ' ')} · Last scan ${formatRelativeTime(effectiveLatest.created_at)}`}
        actions={<StatusBadge status={monitoringStatus} />}
      />

      <div className="grid g-4" style={{ marginBottom: '16px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
            Quality Grade
          </div>
          <GradeGauge passRate={passRate} />
        </div>

        <div className="card span-2">
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
            Issue Categories
          </div>
          {breakdown.length > 0
            ? <IssueTreemap breakdown={breakdown} />
            : <div style={{ color: '#059669', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>No issues detected in latest scan</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Open Issues', val: displayedIssues, color: '#DC2626', onClick: () => onNavigate('issues') },
            { label: 'Scenarios Monitored', val: isDemo ? '—' : (effectiveLatest.total_scenarios || 0), color: '#0F172A' },
            { label: 'High Priority Fixes', val: highPriority, color: '#D97706', onClick: () => onNavigate('remediation') },
          ].map(s => (
            <div key={s.label} className="card" onClick={s.onClick} style={{
              padding: '14px 16px', cursor: s.onClick ? 'pointer' : 'default',
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => { if (s.onClick) e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={e => { if (s.onClick) e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g-2" style={{ marginBottom: '16px' }}>
        <div className="card">
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
            Quality Trend
          </div>
          <TrendChart runs={completed} />
        </div>
        <VerdictCard passRate={passRate} issueCount={rawIssueCount} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Recent Monitoring Cycles
          </div>
          <button onClick={() => onNavigate('reports')} style={{ fontSize: '12px', color: '#4F46E5', background: 'transparent', fontWeight: '600' }}>
            View reports →
          </button>
        </div>
        {(isDemo ? [effectiveLatest] : completed).slice(0, 5).map((run, i) => {
          const pr = Math.round((run.pass_rate || 0) * 100);
          const g = gradeFromPassRate(run.pass_rate);
          return (
            <div key={run.id} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0',
              borderBottom: i < Math.min(completed.length, 5) - 1 ? '1px solid #F1F5F9' : 'none',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: `${g.color}12`, border: `1px solid ${g.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', color: g.color, fontSize: '14px',
              }}>{g.letter}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                  Monitoring cycle · {run.total_scenarios} scenarios
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{formatRelativeTime(run.created_at)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: g.color, fontFamily: 'JetBrains Mono, monospace' }}>{pr}%</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{run.total_failures || 0} issues</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
