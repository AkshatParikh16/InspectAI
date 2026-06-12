const { useState } = React;
const { PageHeader, EmptyState, PriorityBadge } = window.Shared;

const FIX_META = {
  PROMPT_ADDITION:      { label: 'Prompt Update',         color: '#4F46E5', icon: '✏️' },
  GUARDRAIL_RULE:       { label: 'Guardrail',             color: '#059669', icon: '🛡️' },
  ARCHITECTURE_CHANGE:  { label: 'Architecture',          color: '#D97706', icon: '🏗️' },
  POLICY_CLARIFICATION: { label: 'Policy Clarification',  color: '#0891B2', icon: '📋' },
  FINE_TUNING_DATA:     { label: 'Fine-tuning Data',      color: '#DB2777', icon: '🎯' },
};

function TaskCard({ fix, status, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied]     = useState(false);
  const meta = FIX_META[fix.fix_type] || FIX_META.PROMPT_ADDITION;

  function copy() {
    navigator.clipboard?.writeText(`Problem:\n${fix.problem}\n\nSuggested fix:\n${fix.suggested_fix}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusColors = {
    open: '#64748B', in_progress: '#D97706', done: '#059669',
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '10px' }}>
      <div style={{ padding: '14px 16px', borderLeft: `3px solid ${meta.color}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>{meta.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>{fix.title}</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {fix.failure_pattern} · {fix.affected_scenarios} scenario{fix.affected_scenarios !== 1 ? 's' : ''}
            </div>
          </div>
          <PriorityBadge priority={fix.suggested_priority} />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            padding: '3px 8px', background: `${meta.color}12`, color: meta.color,
            borderRadius: '5px', fontSize: '11px', fontWeight: '600',
          }}>{meta.label}</span>

          <select value={status} onChange={e => onStatusChange(fix.id || fix.title, e.target.value)} style={{
            padding: '4px 8px', fontSize: '11px', fontWeight: '600',
            color: statusColors[status], borderColor: `${statusColors[status]}40`,
          }}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <button onClick={() => setExpanded(!expanded)} style={{
            marginLeft: 'auto', fontSize: '12px', color: '#4F46E5', background: 'transparent', fontWeight: '600',
          }}>
            {expanded ? 'Hide details' : 'View details'}
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>PROBLEM</div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{fix.problem}</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>SUGGESTED FIX</div>
              <div style={{
                padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: '8px', fontSize: '12px', color: '#166534', lineHeight: '1.5',
                fontFamily: 'JetBrains Mono, monospace',
              }}>{fix.suggested_fix}</div>
            </div>
            {fix.implementation_steps?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>IMPLEMENTATION STEPS</div>
                {fix.implementation_steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px', color: '#64748B' }}>
                    <span style={{ color: '#4F46E5', fontWeight: '700' }}>{i + 1}.</span>{step}
                  </div>
                ))}
              </div>
            )}
            <button onClick={copy} style={{
              padding: '7px 12px', background: copied ? '#D1FAE5' : '#F1F5F9',
              borderRadius: '6px', fontSize: '12px', fontWeight: '600',
              color: copied ? '#059669' : '#64748B',
            }}>{copied ? '✓ Copied' : 'Copy for your team'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Remediation({ runs, currentRun, detailsLoading, onNavigate }) {
  const [taskStatus, setTaskStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem('inspectai_task_status') || '{}'); }
    catch { return {}; }
  });

  function updateStatus(id, status) {
    const next = { ...taskStatus, [id]: status };
    setTaskStatus(next);
    localStorage.setItem('inspectai_task_status', JSON.stringify(next));
  }

  if (detailsLoading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>Loading remediation plan…</div>;
  }

  const hasRuns = (runs || []).filter(r => r.status === 'completed').length > 0;

  // No real runs yet — honest onboarding state
  if (!hasRuns) {
    return (
      <div className="page-scroll">
        <PageHeader title="Remediation Plan" subtitle="Prioritized action items generated from detected failures" />
        <div className="card" style={{ maxWidth: '560px', margin: '40px auto', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 20px',
            background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '10px' }}>No fix plan yet</h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.65', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px' }}>
            InspectAI generates a prioritized remediation plan automatically after your first monitoring cycle — no manual effort needed.
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
              What you'll get after your first scan
            </div>
            {[
              { color: '#4F46E5', label: 'Prompt additions', desc: 'Exact text to add to your system prompt to prevent each failure type' },
              { color: '#059669', label: 'Guardrail rules',  desc: 'Input/output filters to block unsafe responses at runtime' },
              { color: '#D97706', label: 'Architecture changes', desc: 'Structural improvements like retrieval augmentation' },
              { color: '#DB2777', label: 'Fine-tuning data', desc: 'Ready-to-use JSONL training pairs from your actual failures' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: '5px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const report = currentRun?.fixes_json;
  const fixes = report?.fixes || [];

  if (fixes.length === 0) {
    return (
      <EmptyState
        icon="🎉"
        title="No remediation needed"
        description="Your chatbot is performing well. InspectAI will generate a remediation plan automatically when issues are detected."
        action={
          <button onClick={() => onNavigate('dashboard')} style={{
            padding: '10px 20px', background: '#4F46E5', color: '#fff', borderRadius: '8px', fontWeight: '600',
          }}>Back to Dashboard</button>
        }
      />
    );
  }

  const high = fixes.filter(f => f.suggested_priority === 'HIGH');
  const medium = fixes.filter(f => f.suggested_priority === 'MEDIUM');
  const low = fixes.filter(f => f.suggested_priority === 'LOW');
  const doneCount = fixes.filter(f => taskStatus[f.id || f.title] === 'done').length;

  return (
    <div className="page-scroll">
      <PageHeader
        title="Remediation Plan"
        subtitle="Action items for your team — prioritized by business impact"
      />

      {/* Progress summary */}
      <div className="grid g-4" style={{ marginBottom: '20px' }}>
        {[
          { label: 'Total Actions', val: fixes.length, color: '#0F172A' },
          { label: 'High Priority', val: high.length, color: '#DC2626' },
          { label: 'Completed', val: doneCount, color: '#059669' },
          { label: 'Est. Improvement', val: report.estimated_improvement || '—', color: '#4F46E5', small: true },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{s.label}</div>
            <div style={{
              fontSize: s.small ? '14px' : '24px', fontWeight: '800', color: s.color,
              fontFamily: s.small ? 'inherit' : 'JetBrains Mono, monospace',
            }}>{s.val}</div>
          </div>
        ))}
      </div>

      {report.estimated_improvement && (
        <div className="card" style={{
          marginBottom: '20px', background: 'linear-gradient(135deg, #EEF2FF, #FFFFFF)',
          borderColor: '#C7D2FE',
        }}>
          <div style={{ fontSize: '13px', color: '#4338CA', lineHeight: '1.5' }}>
            <strong>Expected impact:</strong> {report.estimated_improvement}. Complete high-priority items first for maximum quality improvement.
          </div>
        </div>
      )}

      {high.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} />
            High Priority — Address First
          </div>
          {high.map(f => (
            <TaskCard key={f.id || f.title} fix={f} status={taskStatus[f.id || f.title] || 'open'} onStatusChange={updateStatus} />
          ))}
        </div>
      )}

      {medium.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#D97706', marginBottom: '12px' }}>Medium Priority</div>
          {medium.map(f => (
            <TaskCard key={f.id || f.title} fix={f} status={taskStatus[f.id || f.title] || 'open'} onStatusChange={updateStatus} />
          ))}
        </div>
      )}

      {low.length > 0 && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#059669', marginBottom: '12px' }}>Low Priority</div>
          {low.map(f => (
            <TaskCard key={f.id || f.title} fix={f} status={taskStatus[f.id || f.title] || 'open'} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

window.Remediation = Remediation;
