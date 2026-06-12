function TopBar({ user, company, monitoringStatus, lastScanAt, onLogout }) {
  const { StatusBadge, formatRelativeTime } = window.Shared;

  return (
    <header style={{
      height: 'var(--topbar-height)', minHeight: 'var(--topbar-height)',
      background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <StatusBadge status={monitoringStatus} />
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          Last scan: <strong style={{ color: '#374151' }}>{formatRelativeTime(lastScanAt)}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          padding: '6px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: '8px', fontSize: '12px', color: '#64748B',
        }}>
          Embedded in <strong style={{ color: '#4F46E5' }}>{company} Chatbot</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{user.name || user.email}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{user.email}</div>
          </div>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '700', color: '#fff',
          }}>
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>

        <button onClick={onLogout} title="Sign out" style={{
          padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: '8px', fontSize: '12px', color: '#64748B', fontWeight: '500',
        }}>
          Sign out
        </button>
      </div>
    </header>
  );
}

window.TopBar = TopBar;
