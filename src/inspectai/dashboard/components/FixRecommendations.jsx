const { useState } = React;

const FIX_TYPE_META = {
  PROMPT_ADDITION:      { label: 'Prompt Addition',      color: '#6366F1', icon: '✏️' },
  GUARDRAIL_RULE:       { label: 'Guardrail Rule',       color: '#22C55E', icon: '🛡️' },
  ARCHITECTURE_CHANGE:  { label: 'Architecture Change',  color: '#F59E0B', icon: '🏗️' },
  POLICY_CLARIFICATION: { label: 'Policy Clarification', color: '#06B6D4', icon: '📋' },
  FINE_TUNING_DATA:     { label: 'Fine-tuning Data',     color: '#EC4899', icon: '🎯' },
};

function PriorityChip({ priority, onChange }) {
  const colors = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' };
  const color = colors[priority] || '#60607A';
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '3px 9px',
          background: `${color}15`,
          border: `1px solid ${color}35`,
          borderRadius: '5px',
          fontSize: '11px', fontWeight: '700', color,
          display: 'flex', alignItems: 'center', gap: '4px',
          cursor: 'pointer',
        }}
      >
        {priority}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 10, marginTop: '4px',
          background: '#1A1A26', border: '1px solid #2A2A3A', borderRadius: '8px',
          overflow: 'hidden', minWidth: '100px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {['HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <div
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              style={{
                padding: '8px 12px',
                fontSize: '12px', fontWeight: '600', color: colors[p],
                cursor: 'pointer',
                background: p === priority ? `${colors[p]}10` : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${colors[p]}10`}
              onMouseLeave={e => e.currentTarget.style.background = p === priority ? `${colors[p]}10` : 'transparent'}
            >
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FixCard({ fix, fixType, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [priority, setPriority] = useState(fix.priority);
  const [copied, setCopied] = useState(false);
  const meta = FIX_TYPE_META[fixType] || FIX_TYPE_META.PROMPT_ADDITION;

  function copyFix() {
    const text = `PROBLEM:\n${fix.problem}\n\nSUGGESTED FIX:\n${fix.suggestedFix}`;
    navigator.clipboard && navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      background: '#12121A',
      border: '1px solid #2A2A3A',
      borderRadius: '11px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Card header — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: '8px',
          borderBottom: expanded ? '1px solid #2A2A3A' : 'none',
          background: expanded ? '#14141E' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#F1F1FA', lineHeight: '1.3', marginBottom: '4px' }}>
              {fix.title}
            </div>
            <div style={{ fontSize: '11px', color: '#60607A' }}>
              {fix.pattern} · {fix.affectedScenarios} scenario{fix.affectedScenarios !== 1 ? 's' : ''} affected
            </div>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60607A" strokeWidth="2"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0, marginTop: '2px' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <PriorityChip priority={priority} onChange={setPriority} />
          <span style={{
            padding: '3px 9px',
            background: `${meta.color}15`,
            border: `1px solid ${meta.color}30`,
            borderRadius: '5px',
            fontSize: '11px', color: meta.color, fontWeight: '500',
          }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{
            fontSize: '11px', color: '#60607A',
            padding: '3px 8px', background: '#1A1A26', borderRadius: '5px',
            border: '1px solid #2A2A3A',
          }}>
            {fix.impact || fix.estimatedImpact}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Problem */}
          <div>
            <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px' }}>
              Problem
            </div>
            <div style={{ fontSize: '12px', color: '#D0D0E8', lineHeight: '1.5' }}>{fix.problem}</div>
          </div>

          {/* Suggested fix */}
          <div>
            <div style={{ fontSize: '10px', color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px' }}>
              Suggested Fix
            </div>
            <div style={{
              padding: '10px 12px',
              background: 'rgba(34,197,94,0.05)',
              border: '1px solid rgba(34,197,94,0.18)',
              borderRadius: '8px',
              fontSize: '12px', color: '#D0D0E8', lineHeight: '1.5',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {fix.suggestedFix}
            </div>
          </div>

          {/* Implementation steps */}
          <div>
            <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>
              Implementation Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {fix.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: '700', color: '#818CF8',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: '12px', color: '#A0A0B8', lineHeight: '1.4', paddingTop: '2px' }}>{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={copyFix}
            style={{
              padding: '8px 12px',
              background: copied ? 'rgba(34,197,94,0.1)' : '#1A1A26',
              border: `1px solid ${copied ? '#22C55E40' : '#2A2A3A'}`,
              borderRadius: '7px',
              fontSize: '12px', fontWeight: '600',
              color: copied ? '#22C55E' : '#A0A0B8',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied to clipboard' : 'Copy fix text'}
          </button>
        </div>
      )}
    </div>
  );
}

function ColumnHeader({ title, count, color, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 16px',
      background: '#0D0D16',
      borderBottom: '1px solid #2A2A3A',
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#F1F1FA' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#60607A' }}>{count} fix{count !== 1 ? 'es' : ''}</div>
      </div>
      <div style={{
        marginLeft: 'auto',
        width: '22px', height: '22px', borderRadius: '50%',
        background: `${color}20`, border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700', color,
      }}>
        {count}
      </div>
    </div>
  );
}

function FixRecommendations({ onNavigate }) {
  const data = window.MOCK_DATA;
  const fixes = data.fixRecommendations;
  const [downloadStarted, setDownloadStarted] = useState(false);
  const totalFixes = fixes.promptAdditions.length + fixes.guardrailRules.length + fixes.otherActions.length;
  const highPriority = [...fixes.promptAdditions, ...fixes.guardrailRules, ...fixes.otherActions].filter(f => f.priority === 'HIGH').length;

  const totalAffected = [...fixes.promptAdditions, ...fixes.guardrailRules, ...fixes.otherActions]
    .reduce((sum, f) => sum + f.affectedScenarios, 0);

  function downloadFinetuning() {
    const fineTuning = fixes.otherActions.find(f => f.type === 'FINE_TUNING_DATA');
    if (!fineTuning) return;
    const jsonl = Array.from({ length: 5 }, (_, i) => JSON.stringify({
      messages: [
        { role: 'user', content: `[Sample training input ${i + 1}]` },
        { role: 'assistant', content: `[Sample correct output ${i + 1}]` },
      ],
      metadata: { failure_type: 'POLICY_VIOLATION', difficulty: 'MEDIUM', system_config_hash: 'demo1234' }
    })).join('\n');
    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inspectai_finetuning_data.jsonl'; a.click();
    URL.revokeObjectURL(url);
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 3000);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '24px 28px 16px',
        borderBottom: '1px solid #2A2A3A',
        background: '#0A0A0F',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F1F1FA', marginBottom: '4px' }}>
              Fix Recommendations
            </h1>
            <div style={{ fontSize: '13px', color: '#60607A' }}>
              {totalFixes} actionable fixes · {highPriority} high priority · Addresses {totalAffected} failure scenarios
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={downloadFinetuning}
              style={{
                padding: '9px 16px',
                background: downloadStarted ? 'rgba(236,72,153,0.12)' : 'rgba(236,72,153,0.08)',
                border: `1px solid ${downloadStarted ? '#EC4899' : 'rgba(236,72,153,0.3)'}`,
                borderRadius: '8px',
                fontSize: '13px', fontWeight: '600',
                color: downloadStarted ? '#EC4899' : '#F472B6',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloadStarted ? 'Downloading…' : 'Download Fine-tuning Data (.jsonl)'}
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Prompt Additions',      count: fixes.promptAdditions.length, color: '#6366F1' },
            { label: 'Guardrail Rules',        count: fixes.guardrailRules.length,  color: '#22C55E' },
            { label: 'Arch / Policy / FT',     count: fixes.otherActions.length,    color: '#F59E0B' },
            { label: 'High Priority',          count: highPriority,                  color: '#EF4444' },
          ].map((s) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px',
              background: '#12121A',
              border: '1px solid #2A2A3A',
              borderRadius: '8px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: '12px', color: '#A0A0B8' }}>{s.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>
                {s.count}
              </span>
            </div>
          ))}
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '8px',
          }}>
            <span style={{ fontSize: '12px', color: '#A0A0B8' }}>Estimated impact</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#22C55E', fontFamily: 'JetBrains Mono, monospace' }}>
              73% → ~89%
            </span>
          </div>
        </div>
      </div>

      {/* Three-column fix layout */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '20px 28px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'start',
      }}>
        {/* Column 1: Prompt Additions */}
        <div style={{ background: '#0D0D16', border: '1px solid #2A2A3A', borderRadius: '12px', overflow: 'hidden' }}>
          <ColumnHeader
            title="Prompt Additions"
            count={fixes.promptAdditions.length}
            color="#6366F1"
            icon="✏️"
          />
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fixes.promptAdditions.map((fix, i) => (
              <FixCard key={fix.id} fix={fix} fixType="PROMPT_ADDITION" defaultExpanded={i === 0} />
            ))}
          </div>
        </div>

        {/* Column 2: Guardrail Rules */}
        <div style={{ background: '#0D0D16', border: '1px solid #2A2A3A', borderRadius: '12px', overflow: 'hidden' }}>
          <ColumnHeader
            title="Guardrail Rules"
            count={fixes.guardrailRules.length}
            color="#22C55E"
            icon="🛡️"
          />
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fixes.guardrailRules.map((fix, i) => (
              <FixCard key={fix.id} fix={fix} fixType="GUARDRAIL_RULE" defaultExpanded={i === 0} />
            ))}
          </div>
        </div>

        {/* Column 3: Architecture / Policy / Fine-tuning */}
        <div style={{ background: '#0D0D16', border: '1px solid #2A2A3A', borderRadius: '12px', overflow: 'hidden' }}>
          <ColumnHeader
            title="Architecture · Policy · Fine-tuning"
            count={fixes.otherActions.length}
            color="#F59E0B"
            icon="🏗️"
          />
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fixes.otherActions.map((fix, i) => (
              <FixCard
                key={fix.id}
                fix={fix}
                fixType={fix.type || 'ARCHITECTURE_CHANGE'}
                defaultExpanded={i === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.FixRecommendations = FixRecommendations;
