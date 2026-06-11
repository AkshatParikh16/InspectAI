const { useState } = React;

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',      icon: GridIcon  },
  { id: 'run-tests',   label: 'Run Tests',     icon: PlayIcon  },
  { id: 'results',     label: 'Test Results',  icon: ListIcon  },
  { id: 'analysis',    label: 'Failure Analysis', icon: ClusterIcon },
  { id: 'fixes',       label: 'Fix Recommendations', icon: WrenchIcon },
];

function GridIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function PlayIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function ListIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function ClusterIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>; }
function WrenchIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>; }

function Sidebar({ currentPage, onNavigate }) {
  const data = window.MOCK_DATA;
  const passPercent = Math.round(data.passRate * 100);
  const statusColor = passPercent >= 80 ? '#22C55E' : passPercent >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      height: '100vh',
      background: '#0D0D16',
      borderRight: '1px solid #2A2A3A',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #2A2A3A',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '700', color: '#fff',
            flexShrink: 0,
          }}>I</div>
          <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px', color: '#F1F1FA' }}>
            InspectAI
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#60607A', paddingLeft: '38px' }}>
          v0.1.0 · Evaluation Suite
        </div>
      </div>

      {/* Active system status */}
      <div style={{
        margin: '12px 12px 4px',
        padding: '12px',
        background: '#12121A',
        borderRadius: '8px',
        border: '1px solid #2A2A3A',
      }}>
        <div style={{ fontSize: '10px', color: '#60607A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          Current System
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F1FA', marginBottom: '4px' }}>
          QuickShop Support
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px', height: '24px',
            background: `rgba(${passPercent >= 80 ? '34,197,94' : passPercent >= 60 ? '245,158,11' : '239,68,68'}, 0.15)`,
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5">
              {passPercent >= 60
                ? <polyline points="20 6 9 17 4 12" />
                : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              }
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '700', color: statusColor, lineHeight: 1 }}>
            {passPercent}%
          </span>
          <span style={{ fontSize: '11px', color: '#60607A' }}>pass rate</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px', overflow: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '7px',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: isActive ? '#818CF8' : '#A0A0B8',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                marginBottom: '2px',
                textAlign: 'left',
                transition: 'background 0.1s, color 0.1s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1A1A26'; e.currentTarget.style.color = '#F1F1FA'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A0A0B8'; } }}
            >
              <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>
                <Icon />
              </span>
              {item.label}
              {isActive && (
                <div style={{
                  marginLeft: 'auto',
                  width: '4px', height: '4px',
                  borderRadius: '50%',
                  background: '#818CF8',
                  flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #2A2A3A',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#60607A' }}>Last run</span>
          <span style={{ color: '#A0A0B8' }}>23 min ago</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#60607A' }}>Systems tested</span>
          <span style={{ color: '#A0A0B8' }}>{data.systemsTested}</span>
        </div>
        <div style={{
          marginTop: '4px',
          padding: '8px 10px',
          background: 'rgba(99,102,241,0.08)',
          borderRadius: '6px',
          border: '1px solid rgba(99,102,241,0.2)',
          fontSize: '11px',
          color: '#818CF8',
          textAlign: 'center',
          cursor: 'pointer',
        }}>
          View API Docs
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
