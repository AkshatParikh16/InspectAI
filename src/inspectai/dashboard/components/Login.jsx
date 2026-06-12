const { useState } = React;
const { LogoMark } = window.Shared;

const INDUSTRIES = [
  { id: 'retail',     label: 'Retail / E-commerce' },
  { id: 'finance',    label: 'Finance / Banking' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'legal',      label: 'Legal' },
  { id: 'saas',       label: 'SaaS / Tech' },
  { id: 'education',  label: 'Education' },
  { id: 'general',    label: 'General / Other' },
];

const SYSTEM_TYPES = [
  { id: 'CUSTOMER_SUPPORT', label: 'Customer Support', desc: 'Refund, return, escalation, policy enforcement' },
  { id: 'RAG',              label: 'RAG / Knowledge Base', desc: 'Retrieval accuracy, citation, hallucination' },
  { id: 'MULTI_AGENT',      label: 'Multi-Agent Pipeline', desc: 'Tool use, task completion, cost limits' },
];

function Login({ onLogin, onClose }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [fullName, setFullName]         = useState('');
  const [signupEmail, setSignupEmail]   = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [company, setCompany]           = useState('');
  const [industry, setIndustry]         = useState('retail');
  const [systemType, setSystemType]     = useState('CUSTOMER_SUPPORT');

  const pwMatch = signupPassword === confirmPw || confirmPw === '';
  const signupValid = fullName.trim() && signupEmail.trim() && signupPassword.length >= 6 && company.trim() && pwMatch;
  const loginValid = loginEmail.trim() && loginPassword.length >= 1;

  function handleLogin(e) {
    e.preventDefault();
    if (!loginValid) return;
    setLoading(true);
    setTimeout(() => {
      onLogin({
        email: loginEmail.trim(),
        name: loginEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        company: loginEmail.split('@')[1]?.split('.')[0]?.replace(/\b\w/g, c => c.toUpperCase()) || 'My Company',
        industry: 'retail',
        systemType: 'CUSTOMER_SUPPORT',
      });
      setLoading(false);
    }, 600);
  }

  function handleSignup(e) {
    e.preventDefault();
    if (!signupValid) return;
    setLoading(true);
    setTimeout(() => {
      onLogin({
        email: signupEmail.trim(),
        name: fullName.trim(),
        company: company.trim(),
        industry,
        systemType,
      });
      setLoading(false);
    }, 800);
  }

  const inp = { width: '100%' };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', overflowY: 'auto',
      }}
    >
      <div style={{
        background: '#FFFFFF', borderRadius: '16px', padding: '36px 40px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 24px 60px rgba(15,23,42,0.25)',
        animation: 'modalIn 0.18s cubic-bezier(0.2,0,0,1)',
        margin: 'auto',
      }}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <LogoMark size={28} />
          <span style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.4px' }}>InspectAI</span>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: 'flex', background: '#F1F5F9', borderRadius: '10px',
          padding: '4px', marginBottom: '24px',
        }}>
          {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Create Account' }].map(tab => (
            <button key={tab.id} onClick={() => setMode(tab.id)} style={{
              flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: '600',
              background: mode === tab.id ? '#FFFFFF' : 'transparent',
              color: mode === tab.id ? '#0F172A' : '#64748B',
              boxShadow: mode === tab.id ? '0 1px 3px rgba(15,23,42,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>
              Sign in to your quality portal.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Work email</label>
              <input type="email" required style={inp} value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)} placeholder="you@company.com" autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Password</label>
              <input type="password" required style={inp} value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', marginTop: '4px',
              background: loading ? '#A5B4FC' : 'linear-gradient(135deg, #4F46E5, #6366F1)',
              borderRadius: '10px', fontSize: '15px', fontWeight: '700', color: '#fff',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button type="button" onClick={() => setMode('signup')} style={{
              background: 'transparent', fontSize: '13px', color: '#4F46E5',
              textAlign: 'center', fontWeight: '500',
            }}>
              Don't have an account? Create one →
            </button>
          </form>
        )}

        {/* ── SIGNUP ── */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
              Create your account
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>
              Set up your AI quality portal in seconds.
            </p>

            {/* Account details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Full name *</label>
                <input type="text" required style={inp} value={fullName}
                  onChange={e => setFullName(e.target.value)} placeholder="Alex Johnson" autoFocus />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Work email *</label>
                <input type="email" required style={inp} value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Password *</label>
                <input type="password" required style={inp} value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)} placeholder="min 6 chars" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Confirm password</label>
                <input type="password" style={{
                  ...inp,
                  borderColor: confirmPw && !pwMatch ? '#DC2626' : undefined,
                  boxShadow: confirmPw && !pwMatch ? '0 0 0 3px rgba(220,38,38,0.12)' : undefined,
                }} value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)} placeholder="repeat password" />
              </div>
            </div>

            {/* Company details */}
            <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Company
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Company name *</label>
              <input type="text" required style={inp} value={company}
                onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Industry</label>
              <select style={inp} value={industry} onChange={e => setIndustry(e.target.value)}>
                {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                AI System Type
              </label>
              {SYSTEM_TYPES.map(st => (
                <div key={st.id} onClick={() => setSystemType(st.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                  borderRadius: '8px', cursor: 'pointer', marginBottom: '5px',
                  border: systemType === st.id ? '1px solid rgba(79,70,229,0.5)' : '1px solid #E2E8F0',
                  background: systemType === st.id ? 'rgba(79,70,229,0.05)' : '#F8FAFC',
                }}>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                    border: systemType === st.id ? '4px solid #4F46E5' : '2px solid #CBD5E1',
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: systemType === st.id ? '#4F46E5' : '#0F172A' }}>{st.label}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{st.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading || !signupValid} style={{
              width: '100%', padding: '12px', marginTop: '4px',
              background: signupValid && !loading ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : '#E2E8F0',
              borderRadius: '10px', fontSize: '15px', fontWeight: '700',
              color: signupValid && !loading ? '#fff' : '#94A3B8',
              boxShadow: signupValid && !loading ? '0 4px 14px rgba(79,70,229,0.35)' : 'none',
            }}>
              {loading ? 'Creating account…' : 'Create Account & Sign In'}
            </button>
            {confirmPw && !pwMatch && (
              <div style={{ fontSize: '12px', color: '#DC2626', textAlign: 'center' }}>Passwords do not match</div>
            )}
          </form>
        )}

        {onClose && (
          <button onClick={onClose} style={{
            display: 'block', width: '100%', marginTop: '16px',
            background: 'transparent', fontSize: '13px', color: '#94A3B8', textAlign: 'center',
          }}>
            ← Back to product page
          </button>
        )}
      </div>
    </div>
  );
}

window.Login = Login;
