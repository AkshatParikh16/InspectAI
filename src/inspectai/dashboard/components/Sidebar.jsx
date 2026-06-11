const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',            icon: GridIcon    },
  { id: 'run-tests',   label: 'Run Tests',           icon: PlayIcon    },
  { id: 'results',     label: 'Test Results',        icon: ListIcon    },
  { id: 'analysis',    label: 'Failure Analysis',    icon: ClusterIcon },
  { id: 'fixes',       label: 'Fix Recommendations', icon: WrenchIcon  },
];

function GridIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function PlayIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function ListIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function ClusterIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>; }
function WrenchIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>; }

function Sidebar({ currentPage, onNavigate, runs = [], loading }) {
  const completed = runs.filter(r => r.status === 'completed');
  const latest = completed[0];
  const passPercent = latest ? Math.round(latest.pass_rate * 100) : null;
  const statusColor = passPercent === null ? '#60607A' : passPercent >= 80 ? '#22C55E' : passPercent >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <aside className="app-sidebar" style={{
      width: '220px', minWidth: '220px', height: '100vh',
      background: '#0D0D16', borderRight: '1px solid #2A2A3A',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #2A2A3A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px', flexShrink: 0,
            background: 'linear-gradient(135deg,#6366F1,#818CF8)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', color: '#fff', fontSize: '14px',
          }}>I</div>
          <span className="sidebar-label" style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px' }}>
            InspectAI
          </span>
        </div>
      </div>

      {/* Active system status */}
      {latest && (
        <div className="sidebar-status" style={{
          margin: '10px 10px 2px',
          padding: '10px 12px',
          background: '#12121A', borderRadius: '8px', border: '1px solid #2A2A3A',
        }}>
          <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
            Last Run
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#F1F1FA', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {latest.company_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: statusColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
              {passPercent}%
            </span>
            <span style={{ fontSize: '11px', color: '#60607A' }}>pass rate</span>
          </div>
        </div>
      )}

      {loading && !latest && (
        <div style={{ padding: '12px 16px', fontSize: '12px', color: '#60607A' }}>Loading…</div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '6px 8px', overflow: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '9px 10px', borderRadius: '7px', marginBottom: '2px',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: isActive ? '#818CF8' : '#A0A0B8',
                fontSize: '13px', fontWeight: isActive ? '600' : '400',
                textAlign: 'left',
                transition: 'background 0.1s, color 0.1s',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1A1A26'; e.currentTarget.style.color = '#F1F1FA'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A0A0B8'; }}}
            >
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}><Icon /></span>
              <span className="sidebar-label">{item.label}</span>
              {isActive && <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: '#818CF8', flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ padding: '12px', borderTop: '1px solid #2A2A3A' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
          <span style={{ color: '#60607A' }}>Total runs</span>
          <span style={{ color: '#A0A0B8', fontFamily: 'JetBrains Mono, monospace' }}>{runs.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#60607A' }}>Completed</span>
          <span style={{ color: '#A0A0B8', fontFamily: 'JetBrains Mono, monospace' }}>{completed.length}</span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#60607A', textAlign: 'center' }}>
          v0.1.0 · InspectAI
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
