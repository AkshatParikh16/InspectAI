const { useState } = React;

const FIX_META = {
  PROMPT_ADDITION:      { label: 'Prompt Addition',      color: '#6366F1', icon: '✏️' },
  GUARDRAIL_RULE:       { label: 'Guardrail Rule',       color: '#22C55E', icon: '🛡️' },
  ARCHITECTURE_CHANGE:  { label: 'Architecture Change',  color: '#F59E0B', icon: '🏗️' },
  POLICY_CLARIFICATION: { label: 'Policy Clarification', color: '#06B6D4', icon: '📋' },
  FINE_TUNING_DATA:     { label: 'Fine-tuning Data',     color: '#EC4899', icon: '🎯' },
};

const PRIORITY_COLORS = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' };

function FixCard({ fix, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const [copied, setCopied]     = useState(false);
  const meta     = FIX_META[fix.fix_type] || FIX_META.PROMPT_ADDITION;
  const priority = fix.suggested_priority || fix.company_priority || 'MEDIUM';
  const pColor   = PRIORITY_COLORS[priority] || '#818CF8';

  function copy() {
    const text = `PROBLEM:\n${fix.problem}\n\nSUGGESTED FIX:\n${fix.suggested_fix}`;
    navigator.clipboard && navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '11px', overflow: 'hidden' }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: '13px 15px', cursor: 'pointer',
        background: expanded ? '#14141E' : 'transparent',
        borderBottom: expanded ? '1px solid #2A2A3A' : 'none',
        transition: 'background 0.1s',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#F1F1FA', lineHeight: '1.3', flex: 1 }}>{fix.title}</div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60607A" strokeWidth="2"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0, marginTop: '2px' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div style={{ fontSize: '11px', color: '#60607A', marginBottom: '8px' }}>
          {fix.failure_pattern} · {fix.affected_scenarios} scenario{fix.affected_scenarios !== 1 ? 's' : ''} affected
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{ padding: '2px 8px', background: `${pColor}14`, border: `1px solid ${pColor}30`, borderRadius: '5px', fontSize: '10px', fontWeight: '700', color: pColor }}>
            {priority}
          </span>
          <span style={{ padding: '2px 8px', background: `${meta.color}14`, border: `1px solid ${meta.color}28`, borderRadius: '5px', fontSize: '10px', color: meta.color }}>
            {meta.icon} {meta.label}
          </span>
          {fix.estimated_impact && (
            <span style={{ padding: '2px 8px', background: '#1A1A26', border: '1px solid #2A2A3A', borderRadius: '5px', fontSize: '10px', color: '#60607A' }}>
              {fix.estimated_impact}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Problem</div>
            <div style={{ fontSize: '12px', color: '#D0D0E8', lineHeight: '1.5' }}>{fix.problem}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Suggested Fix</div>
            <div style={{ padding: '9px 11px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: '7px', fontSize: '12px', color: '#D0D0E8', lineHeight: '1.5', fontFamily: 'JetBrains Mono, monospace' }}>
              {fix.suggested_fix}
            </div>
          </div>
          {fix.implementation_steps && fix.implementation_steps.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>Steps</div>
              {fix.implementation_steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', alignItems: 'flex-start' }}>
                  <div style={{ width: '17px', height: '17px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: '#818CF8', flexShrink: 0 }}>{i+1}</div>
                  <div style={{ fontSize: '12px', color: '#A0A0B8', lineHeight: '1.4', paddingTop: '1px' }}>{step}</div>
                </div>
              ))}
            </div>
          )}
          {fix.disclaimer && (
            <div style={{ fontSize: '11px', color: '#60607A', fontStyle: 'italic', lineHeight: '1.4', borderTop: '1px solid #1A1A26', paddingTop: '10px' }}>
              {fix.disclaimer}
            </div>
          )}
          <button onClick={copy} style={{ padding: '7px 12px', background: copied ? 'rgba(34,197,94,0.1)' : '#1A1A26', border: `1px solid ${copied ? '#22C55E40' : '#2A2A3A'}`, borderRadius: '7px', fontSize: '12px', fontWeight: '600', color: copied ? '#22C55E' : '#A0A0B8', transition: 'all 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy fix text'}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyFixes({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px', padding: '40px 20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔧</div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F1F1FA', marginBottom: '10px' }}>No fix recommendations yet</h2>
        <p style={{ fontSize: '13px', color: '#60607A', lineHeight: '1.6', marginBottom: '24px' }}>
          Fix recommendations are generated automatically from failure analysis. Run a test with real failures to get actionable prompt additions, guardrail rules, and architecture suggestions.
        </p>
        <button onClick={() => onNavigate('run-tests')} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#6366F1,#818CF8)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
          Run a Test
        </button>
      </div>
    </div>
  );
}

function FixRecommendations({ currentRun, detailsLoading, onNavigate }) {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (detailsLoading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60607A' }}>Loading…</div>;

  const report = currentRun?.fixes_json;
  if (!report || !report.fixes || report.fixes.length === 0) {
    if (!currentRun || currentRun.status === 'running') {
      return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60607A' }}>
        {currentRun?.status === 'running' ? 'Evaluation in progress…' : 'No recommendations available'}
      </div>;
    }
    return <EmptyFixes onNavigate={onNavigate} />;
  }

  const fixes = report.fixes;
  const byType = fixes.reduce((acc, f) => {
    const t = f.fix_type || 'OTHER';
    if (!acc[t]) acc[t] = [];
    acc[t].push(f);
    return acc;
  }, {});

  const highCount   = fixes.filter(f => f.suggested_priority === 'HIGH').length;
  const mediumCount = fixes.filter(f => f.suggested_priority === 'MEDIUM').length;
  const ftFixes     = byType['FINE_TUNING_DATA'] || [];

  function downloadFinetuning() {
    const lines = ftFixes.flatMap((fix, i) => {
      return [{
        messages: [
          { role: 'user',      content: `[Training input ${i+1} — ${fix.failure_type || 'failure'}]` },
          { role: 'assistant', content: `[Correct output — ${fix.suggested_fix || ''}]` },
        ],
        metadata: { failure_type: fix.failure_type, priority: fix.suggested_priority, run_id: currentRun?.id },
      }];
    });
    const jsonl = lines.map(l => JSON.stringify(l)).join('\n');
    const blob  = new Blob([jsonl], { type: 'application/jsonl' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href = url; a.download = `inspectai_${currentRun?.id || 'run'}_finetuning.jsonl`; a.click();
    URL.revokeObjectURL(url);
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 3000);
  }

  const COL_TYPES = ['PROMPT_ADDITION', 'GUARDRAIL_RULE', 'ARCHITECTURE_CHANGE', 'POLICY_CLARIFICATION', 'FINE_TUNING_DATA'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '22px 28px 14px', borderBottom: '1px solid #2A2A3A', background: '#0A0A0F', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>Fix Recommendations</h1>
            <div style={{ fontSize: '13px', color: '#60607A' }}>
              {fixes.length} fix{fixes.length !== 1 ? 'es' : ''} · {highCount} high priority · {currentRun?.company_name}
            </div>
          </div>
          {ftFixes.length > 0 && (
            <button onClick={downloadFinetuning} style={{
              padding: '9px 16px',
              background: downloadStarted ? 'rgba(236,72,153,0.12)' : 'rgba(236,72,153,0.08)',
              border: `1px solid ${downloadStarted ? '#EC4899' : 'rgba(236,72,153,0.3)'}`,
              borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              color: downloadStarted ? '#EC4899' : '#F472B6',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {downloadStarted ? 'Downloading…' : 'Download Fine-tuning Data (.jsonl)'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'High Priority', count: highCount, color: '#EF4444' },
            { label: 'Medium Priority', count: mediumCount, color: '#F59E0B' },
            { label: 'Total Fixes', count: fixes.length, color: '#6366F1' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 13px', background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '8px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color }}/>
              <span style={{ fontSize: '12px', color: '#A0A0B8' }}>{s.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</span>
            </div>
          ))}
          {report.estimated_improvement && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 13px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '12px', color: '#A0A0B8' }}>Estimated impact</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#22C55E', fontFamily: 'JetBrains Mono, monospace' }}>{report.estimated_improvement}</span>
            </div>
          )}
        </div>
      </div>

      {/* Columns */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
        <div className="grid g-3">
          {COL_TYPES.filter(t => byType[t]).map(fixType => {
            const meta   = FIX_META[fixType] || FIX_META.PROMPT_ADDITION;
            const bucket = byType[fixType] || [];
            return (
              <div key={fixType} style={{ background: '#0D0D16', border: '1px solid #2A2A3A', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 15px', background: '#0A0A0F', borderBottom: '1px solid #2A2A3A' }}>
                  <span style={{ fontSize: '16px' }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#F1F1FA' }}>{meta.label}</div>
                    <div style={{ fontSize: '11px', color: '#60607A' }}>{bucket.length} fix{bucket.length !== 1 ? 'es' : ''}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', width: '22px', height: '22px', borderRadius: '50%', background: `${meta.color}18`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: meta.color }}>
                    {bucket.length}
                  </div>
                </div>
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {bucket.map((fix, i) => <FixCard key={String(fix.id || i)} fix={fix} defaultExpanded={i === 0}/>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.FixRecommendations = FixRecommendations;
