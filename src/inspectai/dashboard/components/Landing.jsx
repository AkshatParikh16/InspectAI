const { useState, useEffect } = React;
const { LogoMark, gradeFromPassRate } = window.Shared;

// ── Inline SVG icons ─────────────────────────────────────────────────────────
function ShieldIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function ZapIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function TargetIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function TrendIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function FileIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function UsersIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

// ── Demo preview card ────────────────────────────────────────────────────────
function DemoPreview({ demoRun }) {
  if (!demoRun) {
    return (
      <div style={{
        background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0',
        height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94A3B8', fontSize: '14px',
      }}>Loading preview…</div>
    );
  }

  const grade = gradeFromPassRate(demoRun.pass_rate);
  const pct = Math.round(demoRun.pass_rate * 100);
  const patterns = demoRun.analysis_json?.failure_patterns || [];
  const issues = (demoRun.results_json?.results || []).filter(r => !r.passed).slice(0, 3);
  const FAIL_COLORS = window.FAIL_COLORS;

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(79,70,229,0.08)',
      border: '1px solid #E2E8F0', pointerEvents: 'none',
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FCA5A5' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FDE68A' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#BBF7D0' }} />
        <div style={{ flex: 1, margin: '0 12px', background: '#E2E8F0', borderRadius: '4px', height: '18px' }} />
        <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>InspectAI · ShopEasy Portal</div>
      </div>

      <div style={{ display: 'flex', height: '320px' }}>
        {/* Mini sidebar */}
        <div style={{ width: '140px', background: '#FFFFFF', borderRight: '1px solid #F1F5F9', padding: '12px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', marginBottom: '8px' }}>
            <LogoMark size={20} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A' }}>InspectAI</span>
          </div>
          {['Dashboard', 'Issues', 'Remediation', 'Reports'].map((item, i) => (
            <div key={item} style={{
              padding: '7px 9px', borderRadius: '6px', marginBottom: '2px', fontSize: '11px', fontWeight: i === 0 ? '600' : '400',
              background: i === 0 ? 'rgba(79,70,229,0.08)' : 'transparent',
              color: i === 0 ? '#4F46E5' : '#94A3B8',
            }}>{item}</div>
          ))}
          <div style={{ marginTop: '12px', padding: '8px', background: '#F8FAFC', borderRadius: '6px' }}>
            <div style={{ fontSize: '9px', color: '#94A3B8', marginBottom: '3px' }}>QUALITY GRADE</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: grade.color }}>{grade.letter}</div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>{pct}% pass rate</div>
          </div>
        </div>

        {/* Mini main */}
        <div style={{ flex: 1, padding: '14px', background: '#F8FAFC', overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' }}>
            Dashboard · ShopEasy
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'Open Issues', val: demoRun.total_failures, color: '#DC2626' },
              { label: 'Monitored', val: demoRun.total_scenarios, color: '#0F172A' },
              { label: 'Quality', val: `${pct}%`, color: grade.color },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: '8px', padding: '8px 10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '9px', color: '#94A3B8', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Failure breakdown */}
          <div style={{ background: '#fff', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0', marginBottom: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>ISSUE CATEGORIES</div>
            {patterns.map(p => {
              const total = patterns.reduce((s, x) => s + x.scenario_count, 0) || 1;
              return (
                <div key={p.failure_type} style={{ marginBottom: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '9px', color: '#64748B' }}>{p.failure_type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#0F172A' }}>{p.scenario_count}</span>
                  </div>
                  <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                    <div style={{ width: `${(p.scenario_count / total) * 100}%`, height: '100%', background: FAIL_COLORS[p.failure_type] || '#6366F1', borderRadius: '2px' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sample issue */}
          {issues[0] && (
            <div style={{ background: '#FEF2F2', borderRadius: '6px', padding: '8px', border: '1px solid #FECACA', fontSize: '9px' }}>
              <div style={{ color: '#DC2626', fontWeight: '600', marginBottom: '3px' }}>{(issues[0].failure_type || '').replace(/_/g, ' ')}</div>
              <div style={{ color: '#374151', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {issues[0].scenario?.input || issues[0].actual_response || '—'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Landing component ────────────────────────────────────────────────────
function Landing({ onSignIn, demoRun }) {
  const [scrolled,       setScrolled]       = useState(false);
  const [activeSection,  setActiveSection]  = useState('');
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [btnHover,       setBtnHover]       = useState('');   // 'signin' | 'started'
  const [btnPress,       setBtnPress]       = useState('');

  const NAV_LINKS = [
    { label: 'How it works',      href: 'how-it-works' },
    { label: 'Features',          href: 'features' },
    { label: 'What we detect',    href: 'failure-types' },
    { label: 'Sample dashboard',  href: 'demo-preview' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track which section is in view
  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href);
    const observers = ids.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o && o.disconnect());
  }, []);

  function scrollTo(id) {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const features = [
    {
      icon: <ShieldIcon />, color: '#4F46E5',
      title: 'Policy-Aware Testing',
      desc: 'Generates adversarial scenarios from your actual policy rules — refund limits, escalation keywords, prohibited actions.',
    },
    {
      icon: <TargetIcon />, color: '#059669',
      title: '3-Judge Evaluation Panel',
      desc: 'Every response is evaluated by three independent LLM judges with majority vote. Calibrated against human agreement scores.',
    },
    {
      icon: <ZapIcon />, color: '#D97706',
      title: 'Automatic Failure Grouping',
      desc: 'Similar failures are automatically grouped by root cause — no manual labeling needed. Instantly see your top problem areas and how many scenarios triggered each one.',
    },
    {
      icon: <TrendIcon />, color: '#DC2626',
      title: 'Quality Grades & Trends',
      desc: 'Every monitoring cycle produces a quality grade (A–F), pass rate, and deployment verdict. Trend tracking across releases.',
    },
    {
      icon: <FileIcon />, color: '#0891B2',
      title: 'Fix Recommendations',
      desc: 'Prioritized prompt additions, guardrail rules, architecture changes, and fine-tuning data — all generated automatically.',
    },
    {
      icon: <UsersIcon />, color: '#7C3AED',
      title: 'Stakeholder Reports',
      desc: 'One-click executive summaries and full technical reports for engineering, compliance, and product teams.',
    },
  ];

  const steps = [
    { num: '01', title: 'Configure your policy', desc: 'Enter your company name, chatbot endpoint, and business rules (refund limits, escalation keywords, prohibited actions).' },
    { num: '02', title: 'InspectAI monitors continuously', desc: 'Adversarial scenarios are generated from your policy and fired at your live endpoint. No manual test authoring.' },
    { num: '03', title: 'Failures are detected & grouped', desc: 'A 3-judge AI panel evaluates every response. Failures are automatically grouped by root cause — you immediately see what kind of issues your chatbot has and how many.' },
    { num: '04', title: 'Get your fix plan', desc: 'Receive a prioritized remediation plan with prompt changes, guardrails, and fine-tuning data. Track quality over time.' },
  ];

  return (
    <div style={{ background: '#FFFFFF', fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes navPulse { 0%,100% { box-shadow:0 2px 10px rgba(79,70,229,0.35); } 50% { box-shadow:0 4px 18px rgba(79,70,229,0.55); } }
        .nav-link-item { position:relative; padding:7px 14px; border-radius:7px; font-size:14px; font-weight:500; color:#374151; text-decoration:none; transition:background 0.15s, color 0.15s; cursor:pointer; background:none; border:none; font-family:inherit; }
        .nav-link-item:hover { background:#F1F5F9; color:#0F172A; }
        .nav-link-item.active { color:#4F46E5; font-weight:600; }
        .nav-link-item::after { content:''; position:absolute; bottom:3px; left:50%; right:50%; height:2px; background:#4F46E5; border-radius:2px; transition:left 0.2s, right 0.2s; }
        .nav-link-item.active::after { left:14px; right:14px; }
        .nav-link-item:hover::after { left:14px; right:14px; }
        .mobile-menu { display:none; flex-direction:column; gap:4px; padding:12px 5% 16px; background:rgba(255,255,255,0.98); backdrop-filter:blur(16px); border-bottom:1px solid #E2E8F0; animation:fadeSlideDown 0.18s ease; }
        .hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:8px; border-radius:7px; }
        .hamburger:hover { background:#F1F5F9; }
        .hamburger span { display:block; width:22px; height:2px; background:#374151; border-radius:2px; transition:all 0.2s; }
        @media (max-width:768px) { .nav-links-desktop { display:none !important; } .hamburger { display:flex !important; } }
        @media (min-width:769px) { .mobile-menu { display:none !important; } }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid ' + (scrolled ? '#E2E8F0' : 'rgba(226,232,240,0.4)'),
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
        boxShadow: scrolled ? '0 1px 12px rgba(15,23,42,0.06)' : 'none',
      }}>
        <div style={{ padding: '0 5%', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Brand */}
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveSection(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', transition: 'opacity 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <div style={{ transition: 'transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08) rotate(-4deg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0)'; }}
            >
              <LogoMark size={28} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.4px' }}>InspectAI</span>
          </a>

          {/* Nav links — desktop */}
          <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {NAV_LINKS.map(link => (
              <button key={link.label} onClick={() => scrollTo(link.href)}
                className={'nav-link-item' + (activeSection === link.href ? ' active' : '')}
              >{link.label}</button>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={onSignIn} style={{
              padding: '8px 16px', background: 'transparent', color: '#374151',
              borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              border: '1px solid #E2E8F0',
              transition: 'border-color 0.15s, color 0.15s, transform 0.1s',
              transform: btnPress === 'signin' ? 'scale(0.96)' : btnHover === 'signin' ? 'scale(1.02)' : 'scale(1)',
              borderColor: btnHover === 'signin' ? '#CBD5E1' : '#E2E8F0',
              color: btnHover === 'signin' ? '#0F172A' : '#374151',
            }}
              onMouseEnter={() => setBtnHover('signin')}
              onMouseLeave={() => { setBtnHover(''); setBtnPress(''); }}
              onMouseDown={() => setBtnPress('signin')}
              onMouseUp={() => setBtnPress('')}
            >
              Sign In
            </button>
            <button onClick={onSignIn} style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
              color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
              boxShadow: btnHover === 'started' ? '0 6px 20px rgba(79,70,229,0.5)' : '0 2px 10px rgba(79,70,229,0.35)',
              transform: btnPress === 'started' ? 'scale(0.96)' : btnHover === 'started' ? 'translateY(-1px) scale(1.02)' : 'scale(1)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              animation: btnHover === 'started' ? 'none' : 'navPulse 3s ease-in-out infinite',
            }}
              onMouseEnter={() => setBtnHover('started')}
              onMouseLeave={() => { setBtnHover(''); setBtnPress(''); }}
              onMouseDown={() => setBtnPress('started')}
              onMouseUp={() => setBtnPress('')}
            >
              Get Started →
            </button>

            {/* Hamburger — mobile only */}
            <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
              <span style={{ transform: mobileOpen ? 'rotate(45deg) translateY(7px)' : '' }} />
              <span style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span style={{ transform: mobileOpen ? 'rotate(-45deg) translateY(-7px)' : '' }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="mobile-menu">
            {NAV_LINKS.map(link => (
              <button key={link.label} onClick={() => scrollTo(link.href)}
                className={'nav-link-item' + (activeSection === link.href ? ' active' : '')}
                style={{ textAlign: 'left', width: '100%' }}
              >{link.label}</button>
            ))}
            <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
            <button onClick={() => { setMobileOpen(false); onSignIn(); }}
              className="nav-link-item" style={{ textAlign: 'left', width: '100%', color: '#4F46E5', fontWeight: '600' }}
            >Sign In →</button>
          </div>
        )}
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: '100px', paddingBottom: '80px', paddingLeft: '5%', paddingRight: '5%',
        background: 'linear-gradient(180deg, #EEF2FF 0%, #FFFFFF 60%)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800',
          color: '#0F172A', lineHeight: '1.1', letterSpacing: '-1px',
          maxWidth: '800px', margin: '0 auto 20px',
        }}>
          Find what breaks your AI<br />
          <span style={{ color: '#4F46E5' }}>before your customers do.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)', color: '#64748B', lineHeight: '1.7',
          maxWidth: '600px', margin: '0 auto 36px',
        }}>
          InspectAI embeds in your chatbot and runs adversarial tests continuously —
          detecting policy violations, hallucinations, and escalation failures automatically.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <button
            onClick={onSignIn}
            style={{
              padding: '13px 28px', background: '#4F46E5', color: '#fff',
              borderRadius: '10px', fontSize: '15px', fontWeight: '700',
              boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
            }}
          >
            Sign In to Portal →
          </button>
          <a href="#demo-preview" style={{
            padding: '13px 28px', background: '#FFFFFF', color: '#0F172A',
            borderRadius: '10px', fontSize: '15px', fontWeight: '600',
            border: '1px solid #E2E8F0', textDecoration: 'none',
            boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
          }}>
            See Sample Dashboard ↓
          </a>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { val: '500+', label: 'Scenarios per cycle' },
            { val: '3×',   label: 'Independent LLM judges' },
            { val: '6',    label: 'Failure types detected' },
            { val: '5',    label: 'Fix types generated' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#4F46E5', fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo preview ──────────────────────────────────────────────────── */}
      <section id="demo-preview" style={{ padding: '60px 5%', background: '#F8FAFC', scrollMarginTop: '64px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Sample Portal
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px', margin: '0 0 10px' }}>
              Your AI quality portal, ready to use
            </h2>
            <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>
              Sign in to see your own chatbot's data. Below is the ShopEasy sample workspace.
            </p>
          </div>
          <DemoPreview demoRun={demoRun} />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 5%', background: '#FFFFFF', scrollMarginTop: '64px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              How it works
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>
              From policy to production quality
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '13px', color: '#4F46E5',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>{step.num}</div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #C7D2FE, transparent)', display: 'none' }} />
                  )}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 5%', background: '#F8FAFC', scrollMarginTop: '64px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Features
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px', margin: '0 0 12px' }}>
              Everything your team needs
            </h2>
            <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '520px', margin: '0 auto' }}>
              InspectAI handles the full evaluation pipeline — no test authoring, no manual review.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: '#FFFFFF', borderRadius: '12px', padding: '24px',
                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', marginBottom: '16px',
                  background: `${f.color}12`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: f.color,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What InspectAI detects ─────────────────────────────────────────── */}
      <section id="failure-types" style={{ padding: '80px 5%', background: '#FFFFFF', scrollMarginTop: '64px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px', margin: '0 0 10px' }}>
              Six failure types, detected automatically
            </h2>
            <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>
              No human annotation required. The 3-judge panel classifies each failure into a specific category.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {[
              { type: 'POLICY VIOLATION', desc: 'Chatbot acts outside its authorized scope — wrong refund amount, unauthorized discount, prohibited action.', color: '#DC2626' },
              { type: 'HALLUCINATION', desc: 'AI invents specific facts not present in its context — order details, prices, delivery times.', color: '#4F46E5' },
              { type: 'ESCALATION FAILURE', desc: 'Fails to route to a human agent when triggered by keywords, sentiment, or turn count.', color: '#0891B2' },
              { type: 'INCOMPLETE RESPONSE', desc: 'Only addresses the first issue when a customer presents multiple questions.', color: '#D97706' },
              { type: 'WRONG ANSWER', desc: 'Incorrect factual information about policies, products, or procedures.', color: '#DB2777' },
              { type: 'CONTEXT LOSS', desc: 'Loses track of conversation history in multi-turn interactions.', color: '#7C3AED' },
            ].map(item => (
              <div key={item.type} style={{
                padding: '16px', borderRadius: '10px',
                background: `${item.color}06`, border: `1px solid ${item.color}20`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: item.color }}>{item.type}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 5%', textAlign: 'center',
        background: 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #6366F1 100%)',
      }}>
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px', marginBottom: '16px' }}>
          Your AI has blind spots.<br />InspectAI finds them.
        </h2>
        <p style={{ fontSize: '18px', color: '#C7D2FE', marginBottom: '36px', maxWidth: '500px', margin: '0 auto 36px' }}>
          Sign in to your quality portal and see your chatbot's first monitoring report.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onSignIn} style={{
            padding: '14px 32px', background: '#FFFFFF', color: '#4F46E5',
            borderRadius: '10px', fontSize: '15px', fontWeight: '700',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            Sign In to Portal →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
          {['Policy-aware testing', '3-judge AI evaluation', 'Smart failure grouping', 'Automated fix plans'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#C7D2FE', fontSize: '13px' }}>
              <div style={{ color: '#86EFAC' }}><CheckIcon /></div>{item}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ padding: '32px 5%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoMark size={24} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9' }}>InspectAI</span>
          <span style={{ fontSize: '12px', color: '#475569' }}>v0.1.0 · MIT License</span>
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          Automated adversarial testing for AI systems
        </div>
      </footer>
    </div>
  );
}

window.Landing = Landing;
