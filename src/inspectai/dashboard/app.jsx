// Main application — reads component globals set by each component file
const { useState } = React;

// Component globals set by each component file (window.X = X)
const Sidebar             = window.Sidebar;
const Overview            = window.Overview;
const RunTests            = window.RunTests;
const TestResults         = window.TestResults;
const FailureAnalysis     = window.FailureAnalysis;
const FixRecommendations  = window.FixRecommendations;

const PAGES = {
  overview:     Overview,
  'run-tests':  RunTests,
  results:      TestResults,
  analysis:     FailureAnalysis,
  fixes:        FixRecommendations,
};

function App() {
  const [currentPage, setCurrentPage] = useState('overview');

  const Page = PAGES[currentPage] || Overview;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Page onNavigate={setCurrentPage} />
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
