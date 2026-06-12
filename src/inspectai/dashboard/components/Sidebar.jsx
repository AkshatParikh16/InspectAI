const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: HomeIcon },
  { id: 'issues',      label: 'Issues',      icon: AlertIcon },
  { id: 'remediation', label: 'Remediation', icon: WrenchIcon },
  { id: 'scenarios',   label: 'Scenarios',   icon: ListIcon },
  { id: 'reports',     label: 'Reports',     icon: ReportIcon },
  { id: 'settings',    label: 'Settings',    icon: SettingsIcon },
  { id: 'integration', label: 'Integration', icon: BookIcon },
];

function HomeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function AlertIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function WrenchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
}
function ReportIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function ListIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>;
}
function BookIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}

function Sidebar({ currentPage, onNavigate, company, issueCount, passRate, onGoHome }) {
  const { gradeFromPassRate, LogoMark } = window.Shared;
  const grade = passRate != null ? gradeFromPassRate(passRate) : null;

  return (
    <aside className="app-sidebar" style={{
      width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)', height: '100%',
      background: '#FFFFFF', borderRight: '1px solid #E2E8F0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #E2E8F0' }}>
        <button
          onClick={() => onNavigate('dashboard')}
          title="Go to Dashboard"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px',
            background: 'transparent', padding: '4px', borderRadius: '8px',
            transition: 'background 0.12s', width: '100%', textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogoMark size={30} />
          <div className="sidebar-label">
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.3px' }}>InspectAI</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Quality Portal</div>
          </div>
        </button>

        {company && (
          <div className="sidebar-label" style={{
            padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0',
          }}>
            <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
              Organization
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {company}
            </div>
            {grade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{
                  fontSize: '16px', fontWeight: '800', color: grade.color,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>{grade.letter}</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>{Math.round(passRate * 100)}% quality score</span>
              </div>
            )}
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflow: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          const badge = item.id === 'issues' && issueCount > 0 ? issueCount : null;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} title={item.label} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
              background: isActive ? 'rgba(79,70,229,0.08)' : 'transparent',
              color: isActive ? '#4F46E5' : '#64748B',
              fontSize: '13px', fontWeight: isActive ? '600' : '500', textAlign: 'left',
              transition: 'all 0.12s',
            }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}}
            >
              <Icon />
              <span className="sidebar-label" style={{ flex: 1 }}>{item.label}</span>
              {badge && (
                <span className="sidebar-label" style={{
                  padding: '1px 7px', background: '#FEE2E2', color: '#DC2626',
                  borderRadius: '10px', fontSize: '11px', fontWeight: '700',
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-label" style={{ padding: '14px 18px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.5' }}>
          InspectAI monitors your chatbot continuously. Issues are detected and reported here automatically.
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
