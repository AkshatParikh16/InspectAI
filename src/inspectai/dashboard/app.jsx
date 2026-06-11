const { useState, useEffect, useCallback } = React;

const Sidebar            = window.Sidebar;
const Overview           = window.Overview;
const RunTests           = window.RunTests;
const TestResults        = window.TestResults;
const FailureAnalysis    = window.FailureAnalysis;
const FixRecommendations = window.FixRecommendations;

const PAGES = {
  overview:    Overview,
  'run-tests': RunTests,
  results:     TestResults,
  analysis:    FailureAnalysis,
  fixes:       FixRecommendations,
};

function App() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [runs, setRuns]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [currentRunDetails, setCurrentRunDetails] = useState(null);
  const [detailsLoading, setDetailsLoading]        = useState(false);

  // Fetch run list
  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.API.getRuns();
      setRuns(data);
      // Auto-select the most recent completed run
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

  useEffect(() => { fetchRuns(); }, []);

  // Fetch full details whenever selectedRunId changes
  useEffect(() => {
    if (!selectedRunId) return;
    setDetailsLoading(true);
    window.API.getRun(selectedRunId)
      .then(d => setCurrentRunDetails(d))
      .catch(() => setCurrentRunDetails(null))
      .finally(() => setDetailsLoading(false));
  }, [selectedRunId]);

  // After starting a new run: poll until done, then refresh list + details
  const handleRunStarted = useCallback((runId) => {
    setSelectedRunId(runId);
    setCurrentRunDetails({ id: runId, status: 'running' });
    setCurrentPage('results');

    window.API.poll(runId, (run) => {
      setCurrentRunDetails(run);
      // Optimistically update the list entry
      setRuns(prev => {
        const idx = prev.findIndex(r => r.id === runId);
        if (idx === -1) return [run, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...run };
        return next;
      });
    }).then(() => fetchRuns());
  }, [fetchRuns]);

  const Page = PAGES[currentPage] || Overview;
  const sharedProps = {
    runs,
    currentRun: currentRunDetails,
    loading,
    detailsLoading,
    error,
    selectedRunId,
    onSelectRun: (id) => setSelectedRunId(id),
    onNavigate: setCurrentPage,
    onRunStarted: handleRunStarted,
    refetch: fetchRuns,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        runs={runs}
        loading={loading}
      />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Page {...sharedProps} />
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
