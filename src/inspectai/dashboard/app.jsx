const { useState, useEffect, useCallback } = React;

const Landing      = window.Landing;
const Login        = window.Login;
const TopBar       = window.TopBar;
const Sidebar      = window.Sidebar;
const Dashboard    = window.Dashboard;
const Issues       = window.Issues;
const Remediation  = window.Remediation;
const Scenarios    = window.Scenarios;
const Reports      = window.Reports;
const Settings     = window.Settings;
const Integration  = window.Integration;

const PAGES = {
  dashboard:   Dashboard,
  issues:      Issues,
  remediation: Remediation,
  scenarios:   Scenarios,
  reports:     Reports,
  settings:    Settings,
  integration: Integration,
};

// ── Error boundary: prevents blank white screen on render crash ───────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  render() {
    if (this.state.error) {
      return (
        React.createElement('div', {
          style: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif',
            background: '#F4F6FA', padding: '32px', textAlign: 'center',
          }
        },
          React.createElement('div', { style: { fontSize: '40px', marginBottom: '16px' } }, '⚠️'),
          React.createElement('h2', { style: { fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' } }, 'Something went wrong'),
          React.createElement('p', { style: { fontSize: '13px', color: '#64748B', maxWidth: '440px', lineHeight: '1.6', marginBottom: '16px' } },
            'The portal encountered an error. ' + (this.state.error && this.state.error.message ? this.state.error.message : 'Unknown error') + '. Try signing out and back in.'
          ),
          React.createElement('button', {
            onClick: () => { sessionStorage.clear(); window.location.reload(); },
            style: {
              padding: '10px 22px', background: '#4F46E5', color: '#fff',
              borderRadius: '8px', fontWeight: '600', fontSize: '14px',
              border: 'none', cursor: 'pointer',
            }
          }, 'Sign out & Reload')
        )
      );
    }
    return this.props.children;
  }
}

const SESSION_KEY = 'inspectai_portal_session';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Back-fill name if missing (old session format)
    if (s && !s.name) {
      s.name = (s.email || 'User').split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }
    return s;
  } catch (e) { return null; }
}

function App() {
  const [session, setSession]             = useState(loadSession);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage]     = useState('dashboard');
  const [runs, setRuns]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [currentRunDetails, setCurrentRunDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Build demo run immediately from static data (no async needed)
  const demoRun = window.API.buildDemoRun();

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.API.getRuns();
      setRuns(data);
      if (!selectedRunId) {
        const latest = data.find(r => r.status === 'completed') || data[0];
        if (latest) setSelectedRunId(latest.id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  useEffect(() => {
    if (session) fetchRuns();
  }, [session]);

  useEffect(() => {
    if (!selectedRunId || !session) return;
    setDetailsLoading(true);
    window.API.getRun(selectedRunId)
      .then(d => setCurrentRunDetails(d))
      .catch(() => setCurrentRunDetails(null))
      .finally(() => setDetailsLoading(false));
  }, [selectedRunId, session]);

  function handleLogin(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setSession(user);
    setShowLoginModal(false);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setRuns([]);
    setCurrentRunDetails(null);
    setSelectedRunId(null);
    setCurrentPage('dashboard');
  }

  // ── Unauthenticated: landing + optional login modal ───────────────────────
  if (!session) {
    return (
      <>
        <Landing onSignIn={() => setShowLoginModal(true)} demoRun={demoRun} />
        {showLoginModal && (
          <Login onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        )}
      </>
    );
  }

  // ── Authenticated portal ──────────────────────────────────────────────────
  const completed = runs.filter(r => r.status === 'completed');
  const latest = completed[0];
  const issueCount = latest?.total_failures || 0;
  const passRate = latest?.pass_rate ?? demoRun?.pass_rate ?? null;
  const monitoringStatus = runs.some(r => r.status === 'running') ? 'running' : 'active';
  const lastScanAt = latest?.created_at || null;

  const Page = (PAGES[currentPage] && typeof PAGES[currentPage] === 'function') ? PAGES[currentPage] : Dashboard;
  const sharedProps = {
    runs,
    currentRun: currentRunDetails,
    loading,
    detailsLoading,
    error,
    user: session,
    selectedRunId,
    onSelectRun: setSelectedRunId,
    onNavigate: setCurrentPage,
    refetch: fetchRuns,
    demoRun,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        company={session.company}
        issueCount={issueCount}
        passRate={passRate}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F4F6FA' }}>
        <TopBar
          user={session}
          company={session.company}
          monitoringStatus={monitoringStatus}
          lastScanAt={lastScanAt}
          onLogout={handleLogout}
        />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Page {...sharedProps} />
        </main>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
