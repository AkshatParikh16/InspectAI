const { useState } = React;
const { LogoMark } = window.Shared;

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }
  return (
    <div style={{ position: 'relative', marginBottom: '20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', background: '#1E293B', borderRadius: '10px 10px 0 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>{lang}</span>
        <button onClick={copy} style={{
          fontSize: '11px', color: copied ? '#4ADE80' : '#94A3B8', background: 'transparent', fontWeight: '500',
        }}>{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <pre style={{
        margin: 0, padding: '14px 16px', background: '#0F172A', borderRadius: '0 0 10px 10px',
        fontSize: '12px', lineHeight: '1.7', color: '#E2E8F0', overflowX: 'auto',
        whiteSpace: 'pre',
      }}>{code}</pre>
    </div>
  );
}

function Section({ num, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0',
      marginBottom: '12px', overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
        padding: '16px 20px', background: 'transparent', textAlign: 'left',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '800', color: '#fff',
        }}>{num}</div>
        <span style={{ flex: 1, fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F1F5F9' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Checklist({ items }) {
  const [done, setDone] = useState({});
  function toggle(i) { setDone(d => ({ ...d, [i]: !d[i] })); }
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} onClick={() => toggle(i)} style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0',
          borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer',
        }}>
          <div style={{
            width: '20px', height: '20px', flexShrink: 0, borderRadius: '6px', marginTop: '1px',
            background: done[i] ? '#4F46E5' : '#F1F5F9',
            border: `2px solid ${done[i] ? '#4F46E5' : '#CBD5E1'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {done[i] && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: done[i] ? '#94A3B8' : '#0F172A', textDecoration: done[i] ? 'line-through' : 'none' }}>
              {item.label}
            </div>
            {item.desc && <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{item.desc}</div>}
          </div>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: done[i] ? '#ECFDF5' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: '700', color: done[i] ? '#22C55E' : '#94A3B8' }}>
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowDiagram() {
  const steps = [
    { icon: '⚙️', label: 'Configure',   sub: 'Fill Settings' },
    { icon: '▶',  label: 'Start Scan',  sub: 'POST /api/runs' },
    { icon: '🧠', label: 'Generate',    sub: 'AI scenarios' },
    { icon: '📤', label: 'Test',        sub: 'POST your endpoint' },
    { icon: '⚖️', label: 'Judge',       sub: '3-model panel' },
    { icon: '📊', label: 'Analyse',     sub: 'Cluster failures' },
    { icon: '🔧', label: 'Fix plan',    sub: 'Prioritised fixes' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0', marginTop: '16px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ textAlign: 'center', padding: '10px 8px', minWidth: '70px' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>{s.label}</div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>{s.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ color: '#CBD5E1', fontSize: '16px', flexShrink: 0 }}>→</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Integration({ onNavigate }) {
  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '24px 28px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
        borderRadius: '14px', padding: '28px 32px', marginBottom: '24px', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <LogoMark size={24} />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Integration Guide</span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px', color: '#FFFFFF' }}>How InspectAI connects to your system</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', margin: 0, maxWidth: '600px' }}>
          InspectAI communicates with your chatbot through a plain HTTP POST — no SDK, no library, no code changes required. It learns from every scan and adapts its test strategy over time.
        </p>
      </div>

      {/* Sections */}
      <Section num="1" title="The HTTP contract — what InspectAI sends and expects" defaultOpen={true}>
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginTop: '12px' }}>
          InspectAI calls your endpoint with an adversarial test message. Your API only needs to accept a JSON body and return a JSON response — nothing else.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#22C55E', marginBottom: '8px' }}>↑ InspectAI sends</div>
            <CodeBlock lang="HTTP Request" code={`POST https://your-api.com/chat
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
  "message": "I want a full refund NOW
              or I'll dispute the charge."
}`} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#4F46E5', marginBottom: '8px' }}>↓ Your chatbot returns</div>
            <CodeBlock lang="HTTP Response" code={`HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "I understand your frustration.
  Let me check your order and see what
  we can do for you right away."
}`} />
          </div>
        </div>
        <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Configurable field names</div>
          <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.7' }}>
            The <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>message</code> key in the request, and the <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>message</code> key in the response, are both configurable in Settings under <strong>API Configuration</strong>. Dot-path notation is supported for nested responses (e.g. <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>data.reply</code>).
          </div>
        </div>
      </Section>

      <Section num="2" title="Monitoring lifecycle — from scan to fix plan">
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginTop: '12px' }}>
          Every scan follows the same pipeline. On subsequent scans, InspectAI uses results from previous runs to generate harder, more targeted scenarios.
        </p>
        <FlowDiagram />
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Scenario generation', desc: 'Based on your system type, industry, policies, and historical failures.' },
            { label: '3-judge evaluation', desc: 'Each response is evaluated by 3 independent AI judges: Prometheus, GPT, Claude.' },
            { label: 'Failure clustering', desc: 'Failed scenarios are grouped by type: Policy Violation, Hallucination, Tone, etc.' },
            { label: 'Fix recommendation', desc: 'Prioritised, actionable fixes targeting the most impactful failure clusters.' },
          ].map(c => (
            <div key={c.label} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{c.label}</div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section num="3" title="What InspectAI learns across runs">
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginTop: '12px' }}>
          InspectAI tracks your chatbot's maturity level and adjusts its strategy after each run.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {[
            { stage: 'NEW', color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D', title: 'First scan', desc: 'Broad coverage — tests all failure types to find the most vulnerable areas.' },
            { stage: 'RUNNING', color: '#3B82F6', bg: '#EFF6FF', border: '#93C5FD', title: 'Ongoing', desc: 'Targeted — re-tests known failure areas with harder variants, tracks regressions.' },
            { stage: 'RELIABLE', color: '#22C55E', bg: '#F0FDF4', border: '#86EFAC', title: 'Mature', desc: 'Adversarial — applies maximum-difficulty edge cases to stress-test the system.' },
          ].map(s => (
            <div key={s.stage} style={{ padding: '14px', borderRadius: '10px', background: s.bg, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: s.color, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{s.stage}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px', padding: '12px 14px', background: '#EEF2FF', borderRadius: '8px', border: '1px solid #C7D2FE', fontSize: '12px', color: '#4338CA' }}>
          <strong>Note:</strong> InspectAI auto-detects maturity from the number of completed runs for your company. You can override this in Settings → Scenario Generation.
        </div>
      </Section>

      <Section num="4" title="Quick-start checklist">
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginTop: '12px' }}>
          Follow these steps to complete your first scan. Click each item to mark it done.
        </p>
        <div style={{ marginTop: '12px' }}>
          <Checklist items={[
            { label: 'Create your account', desc: 'Sign up with your work email and company details.' },
            { label: 'Fill in Settings — company + endpoint', desc: 'Go to Settings and enter your company name and target API URL.' },
            { label: 'Configure API credentials', desc: 'Add your API key so InspectAI can authenticate against your endpoint.' },
            { label: 'Verify endpoint responds correctly', desc: 'Send a test message to confirm your endpoint returns {"message": "..."}.' },
            { label: 'Start your first scan', desc: 'Click "Start Scan" in Settings. The scan runs in the background — check Dashboard for results.' },
            { label: 'Review Issues & Remediation', desc: 'Inspect failures, failure types, and prioritised fix recommendations.' },
            { label: 'Review Scenarios in detail', desc: 'Open the Scenarios page to inspect individual test cases and judge verdicts.' },
            { label: 'Schedule recurring scans', desc: 'Run a new scan after each deployment or weekly to track your chatbot\'s quality over time.' },
          ]} />
        </div>
        <button onClick={() => onNavigate && onNavigate('settings')} style={{
          marginTop: '20px', padding: '11px 22px',
          background: 'linear-gradient(135deg, #4F46E5, #6366F1)', borderRadius: '9px',
          fontSize: '14px', fontWeight: '700', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
        }}>
          Go to Settings →
        </button>
      </Section>

      <Section num="5" title="Field reference — what your endpoint receives">
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginTop: '12px' }}>
          Every InspectAI request is a JSON POST with these fields. All are configurable in Settings.
        </p>
        <CodeBlock lang="Request body (default configuration)" code={`{
  "message":    "<adversarial scenario text>",  // configurable: message_field
  // Any extra_fields you configured are merged here
  // e.g. "session_id": "inspect-<uuid>"
}`} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Field', 'Default', 'Description'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['message_field',  '"message"', 'JSON key InspectAI uses to send the scenario input'],
              ['response_field', '"message"', 'Dot-path to extract chatbot reply from response (e.g. data.reply)'],
              ['extra_fields',   '{}',        'Additional JSON key-value pairs merged into every request'],
              ['api_key',        '""',        'Sent as Authorization: Bearer <key> header if provided'],
            ].map(([f, d, desc]) => (
              <tr key={f} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px 10px' }}><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#4338CA' }}>{f}</code></td>
                <td style={{ padding: '8px 10px', color: '#64748B' }}><code>{d}</code></td>
                <td style={{ padding: '8px 10px', color: '#64748B' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Footer spacer */}
      <div style={{ height: '32px' }} />
    </div>
  );
}

window.Integration = Integration;
