const { useState, useMemo } = React;
const { PageHeader, EmptyState, IssueTypeBadge, PriorityBadge } = window.Shared;
const FAIL_COLORS = window.FAIL_COLORS;

function IssueDetail({ issue, onClose }) {
  const judges = issue.panel_verdict?.individual_verdicts || [];
  return (
    <div className="card" style={{ borderTop: `3px solid ${FAIL_COLORS[issue.failure_type] || '#6366F1'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <IssueTypeBadge type={issue.failure_type} />
        <button onClick={onClose} style={{ background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#64748B' }}>Close</button>
      </div>

      {[
        { label: 'Customer Input', text: issue.input },
        { label: 'Expected Behavior', text: issue.expected },
        { label: 'Chatbot Response', text: issue.actual, highlight: true },
      ].map(({ label, text, highlight }) => (
        <div key={label} style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
          <div style={{
            fontSize: '13px', color: '#0F172A', lineHeight: '1.55', padding: '10px 12px',
            background: highlight ? '#FEF2F2' : '#F8FAFC', borderRadius: '8px',
            border: `1px solid ${highlight ? '#FECACA' : '#E2E8F0'}`,
          }}>{text || '—'}</div>
        </div>
      ))}

      {issue.root_cause && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Root Cause</div>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{issue.root_cause}</div>
        </div>
      )}

      {judges.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Evaluation Panel
          </div>
          {judges.map((j, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', padding: '8px 10px', marginBottom: '6px',
              background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0',
            }}>
              <span style={{
                padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                background: j.passed ? '#D1FAE5' : '#FEE2E2',
                color: j.passed ? '#059669' : '#DC2626',
              }}>{j.passed ? 'PASS' : 'FAIL'}</span>
              <div style={{ flex: 1, fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>{j.reasoning || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildIssues(run) {
  if (!run) return [];
  const patterns = run.analysis_json?.failure_patterns || [];
  const rawFails = (run.results_json?.results || []).filter(r => !r.passed);
  const patternMap = {};
  patterns.forEach(p => { patternMap[p.failure_type] = p; });
  return rawFails.map(r => {
    const pattern = patternMap[r.failure_type];
    return {
      id: r.id,
      failure_type: r.failure_type,
      priority: pattern?.suggested_priority || 'MEDIUM',
      input: r.scenario?.input || r.actual_response || '',
      expected: r.scenario?.expected_behavior || '',
      actual: r.actual_response || '',
      confidence: r.confidence_score,
      latency_ms: r.latency_ms,
      panel_verdict: r.panel_verdict,
      root_cause: pattern?.root_cause || '',
      cluster_label: pattern?.cluster_label || '',
    };
  });
}

function Issues({ runs, currentRun, detailsLoading, onNavigate }) {
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [selectedId, setSelectedId] = useState(null);

  if (detailsLoading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>Loading issues…</div>;
  }

  const hasRuns = (runs || []).filter(r => r.status === 'completed').length > 0;

  // No real runs yet — honest onboarding state
  if (!hasRuns) {
    return (
      <div className="page-scroll">
        <PageHeader title="Issues" subtitle="Failures detected across your monitored scenarios" />
        <div className="card" style={{ maxWidth: '560px', margin: '40px auto', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 20px',
            background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '10px' }}>No results yet</h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.65', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px' }}>
            Run your first monitoring cycle to see which scenarios your chatbot fails — policy violations, hallucinations, escalation failures, and more.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('settings')} style={{
              padding: '10px 20px', background: '#4F46E5', color: '#fff',
              borderRadius: '8px', fontWeight: '600', fontSize: '14px',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}>Configure Settings →</button>
            <button onClick={() => onNavigate('dashboard')} style={{
              padding: '10px 20px', background: '#F8FAFC', color: '#64748B',
              border: '1px solid #E2E8F0', borderRadius: '8px', fontWeight: '500', fontSize: '14px',
            }}>Back to Dashboard</button>
          </div>
          <div style={{ marginTop: '32px', padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'left' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
              What you'll see after your first scan
            </div>
            {['Policy violations — chatbot acting outside authorized scope', 'Hallucinations — fabricated facts about orders or policies', 'Escalation failures — not routing to a human when required', 'Incomplete responses — ignoring part of a customer\'s request'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '7px', fontSize: '13px', color: '#475569' }}>
                <span style={{ color: '#4F46E5', fontWeight: '700', flexShrink: 0, marginTop: '1px' }}>→</span>{item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const issues = useMemo(() => buildIssues(currentRun), [currentRun]);

  if (issues.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title="No open issues"
        description="Your chatbot passed all monitored scenarios in the latest cycle. InspectAI will alert you here when new issues are detected."
        action={
          <button onClick={() => onNavigate('dashboard')} style={{
            padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: '8px', fontWeight: '600',
          }}>Back to Dashboard</button>
        }
      />
    );
  }

  const filtered = issues.filter(i => {
    if (filter !== 'all' && i.failure_type !== filter) return false;
    if (search && !i.input.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = issues.find(i => i.id === selectedId);
  const typeCounts = issues.reduce((acc, i) => {
    acc[i.failure_type] = (acc[i.failure_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-scroll">
      <PageHeader
        title="Issues"
        subtitle={`${issues.length} open issue${issues.length !== 1 ? 's' : ''} detected in latest monitoring cycle`}
        actions={
          <button onClick={() => onNavigate('remediation')} style={{
            padding: '9px 16px', background: '#4F46E5', color: '#fff',
            borderRadius: '8px', fontSize: '13px', fontWeight: '600',
          }}>
            View Remediation Plan →
          </button>
        }
      />

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{
          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
          background: filter === 'all' ? '#4F46E5' : '#F1F5F9',
          color: filter === 'all' ? '#fff' : '#64748B',
          border: filter === 'all' ? 'none' : '1px solid #E2E8F0',
        }}>All ({issues.length})</button>
        {Object.entries(typeCounts).map(([type, count]) => (
          <button key={type} onClick={() => setFilter(type)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
            background: filter === type ? `${FAIL_COLORS[type]}18` : '#F1F5F9',
            color: filter === type ? FAIL_COLORS[type] : '#64748B',
            border: `1px solid ${filter === type ? FAIL_COLORS[type] + '40' : '#E2E8F0'}`,
          }}>{type.replace(/_/g, ' ')} ({count})</button>
        ))}
      </div>

      <div className="grid g-sidebar">
        <div>
          <div style={{ marginBottom: '12px' }}>
            <input
              placeholder="Search issue descriptions…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.map((issue, i) => (
              <div key={issue.id || i}
                onClick={() => setSelectedId(issue.id === selectedId ? null : issue.id)}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                  background: selectedId === issue.id ? '#EEF2FF' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (selectedId !== issue.id) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (selectedId !== issue.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                  <IssueTypeBadge type={issue.failure_type} />
                  <PriorityBadge priority={issue.priority} />
                </div>
                <div style={{
                  fontSize: '13px', color: '#0F172A', lineHeight: '1.45',
                  overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {issue.input}
                </div>
                {issue.cluster_label && (
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>{issue.cluster_label}</div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No issues match your filters</div>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: 0 }}>
          {selected
            ? <IssueDetail issue={selected} onClose={() => setSelectedId(null)} />
            : (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>👈</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', marginBottom: '6px' }}>Select an issue</div>
                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                  Click any issue to see the customer input, chatbot response, and evaluation details.
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

window.Issues = Issues;
