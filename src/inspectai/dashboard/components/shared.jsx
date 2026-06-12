const { useState, useEffect } = React;

// ── Design tokens (referenced in inline styles) ─────────────────────────────
window.THEME = {
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#0F172A',
  textSecondary: '#64748B',
  textDim: '#94A3B8',
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDim: 'rgba(79,70,229,0.08)',
  success: '#059669',
  successDim: 'rgba(5,150,105,0.08)',
  danger: '#DC2626',
  dangerDim: 'rgba(220,38,38,0.08)',
  warning: '#D97706',
  warningDim: 'rgba(217,119,6,0.08)',
};

const FAIL_COLORS = {
  POLICY_VIOLATION: '#DC2626',
  HALLUCINATION: '#4F46E5',
  INCOMPLETE: '#D97706',
  WRONG_ANSWER: '#DB2777',
  CONTEXT_LOSS: '#7C3AED',
  ESCALATION_FAILURE: '#0891B2',
};

window.FAIL_COLORS = FAIL_COLORS;

function gradeFromPassRate(rate) {
  const pct = Math.round((rate || 0) * 100);
  if (pct >= 90) return { letter: 'A', label: 'Production Ready', color: '#059669' };
  if (pct >= 80) return { letter: 'B', label: 'Good', color: '#0891B2' };
  if (pct >= 70) return { letter: 'C', label: 'Needs Attention', color: '#D97706' };
  if (pct >= 60) return { letter: 'D', label: 'At Risk', color: '#EA580C' };
  return { letter: 'F', label: 'Critical', color: '#DC2626' };
}

window.gradeFromPassRate = gradeFromPassRate;

function formatRelativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

window.formatRelativeTime = formatRelativeTime;

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
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

function GradeGauge({ passRate, size = 140 }) {
  const grade = gradeFromPassRate(passRate);
  const pct = Math.round((passRate || 0) * 100);
  const displayed = useCountUp(pct, 1200);
  const r = (size - 16) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (passRate || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={grade.color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size * 0.28, fontWeight: '800', color: grade.color, lineHeight: 1 }}>
            {grade.letter}
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{displayed}%</span>
        </div>
      </div>
      <span style={{
        fontSize: '12px', fontWeight: '600', color: grade.color,
        padding: '4px 10px', background: `${grade.color}14`, borderRadius: '20px',
      }}>
        {grade.label}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Monitoring Active', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
    running: { label: 'Scan in Progress', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
    paused:  { label: 'Monitoring Paused', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
    failed:  { label: 'Scan Failed', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
    demo:    { label: 'Sample Workspace', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      color: s.color, background: s.bg, border: `1px solid ${s.color}25`,
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%', background: s.color,
        boxShadow: status === 'active' ? `0 0 6px ${s.color}` : 'none',
        animation: status === 'active' ? 'pulse 2s infinite' : 'none',
      }} />
      {s.label}
    </span>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
    }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', marginBottom: '4px', letterSpacing: '-0.3px' }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '20px' }}>{description}</p>
        {action}
      </div>
    </div>
  );
}

function IssueTypeBadge({ type }) {
  const color = FAIL_COLORS[type] || '#6366F1';
  return (
    <span style={{
      padding: '3px 8px', background: `${color}12`, border: `1px solid ${color}30`,
      color, borderRadius: '5px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap',
    }}>
      {(type || 'UNKNOWN').replace(/_/g, ' ')}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = { HIGH: '#DC2626', MEDIUM: '#D97706', LOW: '#059669' };
  const c = colors[priority] || '#64748B';
  return (
    <span style={{
      padding: '2px 8px', background: `${c}12`, border: `1px solid ${c}30`,
      color: c, borderRadius: '4px', fontSize: '10px', fontWeight: '700',
    }}>
      {priority}
    </span>
  );
}

function LogoMark({ size = 32 }) {
  const id = 'lgGrad' + size;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <path d="M16 2L3.5 7.8V15c0 7.2 5.4 13.8 12.5 15.5C23.1 28.8 28.5 22.2 28.5 15V7.8L16 2z"
        fill={`url(#${id})`} />
      <circle cx="15" cy="14.5" r="4.5" stroke="white" strokeWidth="2" fill="none" />
      <line x1="18.2" y1="17.8" x2="22" y2="21.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

window.Shared = {
  useCountUp, GradeGauge, StatusBadge, PageHeader, EmptyState,
  IssueTypeBadge, PriorityBadge, gradeFromPassRate, formatRelativeTime, LogoMark,
};
