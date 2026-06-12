const { useState } = React;
const { PageHeader, StatusBadge, LogoMark } = window.Shared;

const SYSTEM_TYPES = [
  { id: 'CUSTOMER_SUPPORT', label: 'Customer Support',   desc: 'Refund, return, escalation, policy enforcement' },
  { id: 'RAG',              label: 'RAG / Knowledge Base', desc: 'Retrieval accuracy, citation, hallucination detection' },
  { id: 'MULTI_AGENT',      label: 'Multi-Agent Pipeline', desc: 'Tool use, task completion, cost/step limits' },
];

const MODELS = [
  'claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5',
  'gpt-4o', 'gpt-4o-mini', 'gemini-2.0-flash', 'llama-3.3-70b-instruct',
];

const INDUSTRIES = [
  { id: 'retail',     label: 'Retail / E-commerce' },
  { id: 'finance',    label: 'Finance / Banking' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'legal',      label: 'Legal' },
  { id: 'saas',       label: 'SaaS / Tech' },
  { id: 'education',  label: 'Education' },
  { id: 'general',    label: 'General / Other' },
];

function SectionHeader({ title, desc }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '3px' }}>{title}</div>
      {desc && <div style={{ fontSize: '13px', color: '#64748B' }}>{desc}</div>}
    </div>
  );
}

function Field({ label, hint, children, col }) {
  return (
    <div style={col ? { gridColumn: col } : {}}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{hint}</div>}
    </div>
  );
}

function Toggle({ on, onChange, label, desc }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
      background: '#F8FAFC', borderRadius: '8px', border: on ? '1px solid rgba(79,70,229,0.4)' : '1px solid #E2E8F0',
      cursor: 'pointer', marginBottom: '6px',
    }} onClick={() => onChange(!on)}>
      <div style={{
        width: '36px', height: '20px', background: on ? '#4F46E5' : '#CBD5E1',
        borderRadius: '10px', position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: '2px', left: on ? '18px' : '2px',
          width: '16px', height: '16px', background: '#fff', borderRadius: '50%',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: '#64748B' }}>{desc}</div>}
      </div>
    </label>
  );
}

function Accordion({ title, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '10px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: 'transparent', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{title}</span>
          {badge && <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: '#EEF2FF', color: '#4F46E5' }}>{badge}</span>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F1F5F9' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ExtraFieldsEditor({ value, onChange }) {
  const [rawError, setRawError] = useState(null);
  function handleBlur(e) {
    const txt = e.target.value.trim();
    if (!txt || txt === '{}') { onChange({}); setRawError(null); return; }
    try { onChange(JSON.parse(txt)); setRawError(null); }
    catch (e) { setRawError('Invalid JSON — use {"key": "value"} format'); }
  }
  return (
    <div>
      <textarea rows="3" defaultValue={JSON.stringify(value, null, 2)}
        onBlur={handleBlur}
        placeholder='{"session_id": "test-123", "source": "inspectai"}'
        style={{ width: '100%', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
      />
      {rawError && <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '3px' }}>{rawError}</div>}
    </div>
  );
}

function Settings({ user, currentRun, runs, onNavigate, refetch }) {
  const lastConfig = (() => {
    const cfg = currentRun?.config_json;
    if (!cfg) return {};
    return typeof cfg === 'object' ? cfg : {};
  })();
  const lastPolicy = lastConfig.policy || {};

  // ── Core fields ──────────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState(lastConfig.company_name || user?.company || '');
  const [industry, setIndustry]       = useState(lastConfig.industry || user?.industry || 'retail');
  const [systemType, setSystemType]   = useState(lastConfig.system_type || user?.systemType || 'CUSTOMER_SUPPORT');
  const [targetModel, setTargetModel] = useState(lastConfig.target_model || 'claude-sonnet-4-6');
  const [endpoint, setEndpoint]       = useState(lastConfig.target_endpoint || '');
  const [apiKey, setApiKey]           = useState('');
  const [scenarioCount, setScenarioCount] = useState(lastConfig.scenario_count || 20);
  const [dryRun, setDryRun]           = useState(false);

  // ── Policy — threshold fields ─────────────────────────────────────────────
  const [refundThreshold, setRefundThreshold]     = useState(lastPolicy.refund_threshold ?? 50);
  const [returnWindow, setReturnWindow]           = useState(lastPolicy.return_window_days ?? 30);
  const [maxDiscount, setMaxDiscount]             = useState(lastPolicy.max_discount_percent ?? 15);
  const [escalateKeywords, setEscalateKeywords]   = useState((lastPolicy.escalate_on_keywords || ['manager', 'supervisor', 'legal']).join(', '));
  const [prohibitedActions, setProhibitedActions] = useState((lastPolicy.prohibited_actions || []).join(', '));

  // ── Section A — API Configuration ─────────────────────────────────────────
  const [messageField, setMessageField]   = useState(lastPolicy.message_field || 'message');
  const [responseField, setResponseField] = useState(lastPolicy.response_field || 'message');
  const [extraFields, setExtraFields]     = useState(lastPolicy.extra_fields || {});

  // ── Section B — Chatbot Description ───────────────────────────────────────
  const [chatbotDescription, setChatbotDescription] = useState(lastPolicy.chatbot_description || '');
  const [useCaseCategories, setUseCaseCategories]   = useState((lastPolicy.use_case_categories || []).join(', '));
  const [allowedActions, setAllowedActions]         = useState((lastPolicy.allowed_actions || []).join(', '));

  // ── Section C — Escalation & Tone ─────────────────────────────────────────
  const [sentimentThreshold, setSentimentThreshold]           = useState(lastPolicy.sentiment_threshold ?? 0.3);
  const [maxTurns, setMaxTurns]                               = useState(lastPolicy.max_turns_before_escalate ?? 5);
  const [operatingHours, setOperatingHours]                   = useState(lastPolicy.operating_hours || '');
  const [afterHoursBehavior, setAfterHoursBehavior]           = useState(lastPolicy.after_hours_behavior || 'ticket');
  const [formality, setFormality]                             = useState(lastPolicy.formality || 'professional');
  const [language, setLanguage]                               = useState(lastPolicy.language || 'en');
  const [empathyRequired, setEmpathyRequired]                 = useState(lastPolicy.empathy_required ?? true);

  // ── Section D — Compliance ────────────────────────────────────────────────
  const [gdprEnabled, setGdprEnabled]       = useState(lastPolicy.gdpr_enabled ?? false);
  const [hipaaEnabled, setHipaaEnabled]     = useState(lastPolicy.hipaa_enabled ?? false);
  const [pciEnabled, setPciEnabled]         = useState(lastPolicy.pci_dss_enabled ?? false);
  const [piiRedaction, setPiiRedaction]     = useState(lastPolicy.pii_redaction ?? false);
  const [dataResidency, setDataResidency]   = useState(lastPolicy.data_residency || '');

  // ── Section E — Scenario Generation ──────────────────────────────────────
  const [deploymentStatus, setDeploymentStatus]   = useState(lastPolicy.deployment_status || 'POST_DEPLOYMENT');
  const [generationStrategy, setGenerationStrategy] = useState(lastPolicy.generation_strategy || 'SMART_MIX');
  const [systemMaturity, setSystemMaturity]         = useState(lastPolicy.system_maturity || '');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const canSubmit = !submitting && companyName.trim() && endpoint.trim();
  const inp = { width: '100%' };

  async function handleStartScan() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const payload = {
        company_name: companyName.trim(),
        industry,
        system_type: systemType,
        target_model: targetModel,
        target_endpoint: endpoint.trim(),
        api_key: apiKey,
        scenario_count: scenarioCount,
        dry_run: dryRun,
        policy: {
          // Policy thresholds
          refund_threshold: parseFloat(refundThreshold) || 50,
          return_window_days: parseInt(returnWindow) || 30,
          max_discount_percent: parseFloat(maxDiscount) || 15,
          escalate_on_keywords: escalateKeywords.split(',').map(s => s.trim()).filter(Boolean),
          prohibited_actions: prohibitedActions.split(',').map(s => s.trim()).filter(Boolean),
          // API config
          message_field: messageField.trim() || 'message',
          response_field: responseField.trim() || 'message',
          extra_fields: extraFields,
          // Chatbot description
          chatbot_description: chatbotDescription.trim() || null,
          use_case_categories: useCaseCategories.split(',').map(s => s.trim()).filter(Boolean),
          allowed_actions: allowedActions.split(',').map(s => s.trim()).filter(Boolean),
          // Escalation & tone
          sentiment_threshold: parseFloat(sentimentThreshold) || 0.3,
          max_turns_before_escalate: parseInt(maxTurns) || 5,
          operating_hours: operatingHours.trim() || null,
          after_hours_behavior: afterHoursBehavior,
          formality,
          language,
          empathy_required: empathyRequired,
          // Compliance
          gdpr_enabled: gdprEnabled,
          hipaa_enabled: hipaaEnabled,
          pci_dss_enabled: pciEnabled,
          pii_redaction: piiRedaction,
          data_residency: dataResidency.trim() || null,
          // Scenario generation
          deployment_status: deploymentStatus,
          generation_strategy: generationStrategy,
          system_maturity: systemMaturity || null,
        },
      };
      await window.API.startRun(payload);
      setSubmitSuccess(true);
      await refetch();
      setTimeout(() => onNavigate('dashboard'), 1200);
    } catch (e) {
      setSubmitError(e.message || 'Failed to start scan. Check your endpoint and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-scroll">
      <PageHeader
        title="Settings"
        subtitle="Configure your chatbot integration and trigger monitoring cycles"
      />

      {/* Status card */}
      <div className="card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoMark size={28} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>InspectAI Quality Portal</div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              {runs.filter(r => r.status === 'completed').length} monitoring cycle{runs.filter(r => r.status === 'completed').length !== 1 ? 's' : ''} completed
            </div>
          </div>
        </div>
        <StatusBadge status={runs.some(r => r.status === 'running') ? 'running' : 'active'} />
      </div>

      <div className="grid g-sidebar">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* System type */}
          <div className="card" style={{ marginBottom: '10px' }}>
            <SectionHeader title="System Type" desc="What kind of AI system do you want to monitor?" />
            {SYSTEM_TYPES.map(st => (
              <div key={st.id} onClick={() => setSystemType(st.id)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 13px',
                borderRadius: '9px', cursor: 'pointer', marginBottom: '8px',
                border: systemType === st.id ? '1px solid rgba(79,70,229,0.5)' : '1px solid #E2E8F0',
                background: systemType === st.id ? 'rgba(79,70,229,0.05)' : '#F8FAFC',
                transition: 'all 0.12s',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: systemType === st.id ? '#4F46E5' : '#0F172A' }}>{st.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{st.desc}</div>
                </div>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                  border: systemType === st.id ? '5px solid #4F46E5' : '2px solid #CBD5E1',
                  transition: 'all 0.12s',
                }} />
              </div>
            ))}
          </div>

          {/* Chatbot basics */}
          <div className="card" style={{ marginBottom: '10px' }}>
            <SectionHeader title="Chatbot Configuration" desc="Where InspectAI will send adversarial test scenarios." />
            <div className="grid g-2" style={{ gap: '12px' }}>
              <Field label="Company / Bot Name *">
                <input style={inp} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Support Bot" />
              </Field>
              <Field label="Industry">
                <select style={inp} value={industry} onChange={e => setIndustry(e.target.value)}>
                  {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>
              </Field>
              <Field label="Chatbot API Endpoint *" hint="InspectAI will POST adversarial messages to this URL." col="1 / -1">
                <input style={inp} value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.yourcompany.com/v1/chat" />
              </Field>
              <Field label="API Key" hint="Stored in memory for this session only. Never persisted.">
                <input type="password" style={inp} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Bearer token or API key" />
              </Field>
              <Field label="Judge / Evaluator Model" hint="The LLM InspectAI uses to evaluate chatbot responses.">
                <select style={inp} value={targetModel} onChange={e => setTargetModel(e.target.value)}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Policy (customer support only) */}
          {systemType === 'CUSTOMER_SUPPORT' && (
            <div className="card" style={{ marginBottom: '10px' }}>
              <SectionHeader
                title="Policy Rules"
                desc="InspectAI generates scenarios that test these boundaries."
              />
              <div className="grid g-2" style={{ gap: '12px' }}>
                <Field label="Refund Threshold ($)" hint="Escalate requests above this amount.">
                  <input type="number" style={inp} value={refundThreshold} onChange={e => setRefundThreshold(e.target.value)} min="0" />
                </Field>
                <Field label="Return Window (days)" hint="Reject returns beyond this window.">
                  <input type="number" style={inp} value={returnWindow} onChange={e => setReturnWindow(e.target.value)} min="0" />
                </Field>
                <Field label="Max Autonomous Discount (%)" hint="Cannot offer more without escalation.">
                  <input type="number" style={inp} value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} min="0" max="100" />
                </Field>
                <Field label="Escalation Trigger Keywords" hint="Comma-separated. Must route to human.">
                  <input style={inp} value={escalateKeywords} onChange={e => setEscalateKeywords(e.target.value)} placeholder="manager, legal, fraud, sue" />
                </Field>
                <Field label="Prohibited Actions" hint="Actions your bot should never perform." col="1 / -1">
                  <input style={inp} value={prohibitedActions} onChange={e => setProhibitedActions(e.target.value)} placeholder="delete_account, waive_fee, override_policy" />
                </Field>
              </div>
            </div>
          )}

          {/* ── Accordion sections ──────────────────────────────────────────── */}

          <Accordion title="API Configuration" badge="Advanced" defaultOpen={false}>
            <div style={{ paddingTop: '12px' }}>
              <div className="grid g-2" style={{ gap: '12px', marginBottom: '12px' }}>
                <Field label="Message Field" hint={'JSON key InspectAI sends the test in. Default: "message"'}>
                  <input style={inp} value={messageField} onChange={e => setMessageField(e.target.value)} placeholder="message" />
                </Field>
                <Field label="Response Field" hint={'Dot-path to extract reply. Default: "message" (e.g. data.reply)'}>
                  <input style={inp} value={responseField} onChange={e => setResponseField(e.target.value)} placeholder="message" />
                </Field>
              </div>
              <Field label="Extra Request Fields" hint="Additional JSON key-value pairs merged into every request body.">
                <ExtraFieldsEditor value={extraFields} onChange={setExtraFields} />
              </Field>
            </div>
          </Accordion>

          <Accordion title="Chatbot Description" badge="Improves scenarios" defaultOpen={false}>
            <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="What does your chatbot do?" hint="A plain-text description. InspectAI uses this to generate more relevant test scenarios.">
                <textarea rows="3" style={{ width: '100%' }} value={chatbotDescription} onChange={e => setChatbotDescription(e.target.value)}
                  placeholder="e.g. Customer support bot for an e-commerce platform, handles orders, returns, refunds, and account questions. Cannot approve refunds above $100." />
              </Field>
              <Field label="Use-case categories" hint="Comma-separated topics (e.g. returns, billing, account, shipping). Helps InspectAI prioritise scenario types.">
                <input style={inp} value={useCaseCategories} onChange={e => setUseCaseCategories(e.target.value)} placeholder="returns, billing, account, shipping" />
              </Field>
              <Field label="Allowed actions" hint="Comma-separated actions your bot CAN perform (contrast with Prohibited Actions above).">
                <input style={inp} value={allowedActions} onChange={e => setAllowedActions(e.target.value)} placeholder="lookup_order, process_return, send_coupon" />
              </Field>
            </div>
          </Accordion>

          <Accordion title="Escalation & Tone" defaultOpen={false}>
            <div style={{ paddingTop: '12px' }}>
              <div className="grid g-2" style={{ gap: '12px', marginBottom: '12px' }}>
                <Field label={`Sentiment threshold: ${sentimentThreshold}`} hint="Escalate if customer sentiment drops below this (0 = always, 1 = never).">
                  <input type="range" min="0" max="1" step="0.05" value={sentimentThreshold}
                    onChange={e => setSentimentThreshold(+e.target.value)}
                    style={{ width: '100%', accentColor: '#4F46E5' }} />
                </Field>
                <Field label="Max turns before escalate" hint="Force escalation after this many back-and-forths.">
                  <input type="number" style={inp} min="1" max="20" value={maxTurns} onChange={e => setMaxTurns(e.target.value)} />
                </Field>
                <Field label="Operating hours" hint='When support is staffed, e.g. "9am–5pm EST Mon–Fri".'>
                  <input style={inp} value={operatingHours} onChange={e => setOperatingHours(e.target.value)} placeholder="9am–5pm EST Mon–Fri" />
                </Field>
                <Field label="After-hours behaviour">
                  <select style={inp} value={afterHoursBehavior} onChange={e => setAfterHoursBehavior(e.target.value)}>
                    <option value="ticket">Create support ticket</option>
                    <option value="email">Send email follow-up</option>
                    <option value="voicemail">Leave voicemail</option>
                    <option value="self_serve">Redirect to self-serve</option>
                  </select>
                </Field>
                <Field label="Response formality">
                  <select style={inp} value={formality} onChange={e => setFormality(e.target.value)}>
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="formal">Formal</option>
                    <option value="technical">Technical</option>
                  </select>
                </Field>
                <Field label="Language">
                  <select style={inp} value={language} onChange={e => setLanguage(e.target.value)}>
                    {[['en','English'],['es','Spanish'],['fr','French'],['de','German'],['pt','Portuguese'],['ja','Japanese'],['zh','Chinese']].map(([id,l]) => (
                      <option key={id} value={id}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Toggle on={empathyRequired} onChange={setEmpathyRequired}
                label="Empathy required"
                desc="Scenarios test whether the bot acknowledges frustration before offering solutions." />
            </div>
          </Accordion>

          <Accordion title="Compliance" defaultOpen={false}>
            <div style={{ paddingTop: '12px' }}>
              <Toggle on={gdprEnabled} onChange={setGdprEnabled}   label="GDPR (EU)"           desc="Test for data rights: right to erasure, access, portability" />
              <Toggle on={hipaaEnabled} onChange={setHipaaEnabled}  label="HIPAA (US Healthcare)" desc="PHI handling, no disclosure, required disclosures" />
              <Toggle on={pciEnabled}   onChange={setPciEnabled}    label="PCI-DSS (Payments)"  desc="No raw card data, secure redirects, tokenisation checks" />
              <Toggle on={piiRedaction} onChange={setPiiRedaction}  label="PII Redaction"        desc="Verify the bot never echoes back personal identifiers" />
              <div style={{ marginTop: '10px' }}>
                <Field label="Data residency" hint="Applicable region for compliance scenario weighting.">
                  <select style={inp} value={dataResidency} onChange={e => setDataResidency(e.target.value)}>
                    <option value="">Not specified</option>
                    <option value="EU">EU</option>
                    <option value="US">US</option>
                    <option value="APAC">APAC</option>
                    <option value="UK">UK</option>
                  </select>
                </Field>
              </div>
            </div>
          </Accordion>

          <Accordion title="Scenario Generation Strategy" defaultOpen={false}>
            <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="Deployment stage" hint="Pre-deployment uses broader, more exploratory scenarios (auto-scales to 500).">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[['PRE_DEPLOYMENT','Pre-deployment'],['POST_DEPLOYMENT','Post-deployment']].map(([id, label]) => (
                    <label key={id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', cursor: 'pointer',
                      borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                      background: deploymentStatus === id ? 'rgba(79,70,229,0.08)' : '#F8FAFC',
                      border: deploymentStatus === id ? '1px solid rgba(79,70,229,0.4)' : '1px solid #E2E8F0',
                      color: deploymentStatus === id ? '#4F46E5' : '#374151',
                    }}>
                      <input type="radio" name="deploy" checked={deploymentStatus === id}
                        onChange={() => setDeploymentStatus(id)} style={{ display: 'none' }} />
                      {label}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Generation strategy" hint="Smart Mix adapts based on maturity. Target Failures re-runs known weak spots.">
                <select style={inp} value={generationStrategy} onChange={e => setGenerationStrategy(e.target.value)}>
                  <option value="SMART_MIX">Smart Mix (recommended)</option>
                  <option value="FROM_SCRATCH">From Scratch — broad coverage</option>
                  <option value="TARGET_FAILURES">Target Failures — re-test weak spots</option>
                  <option value="ADVERSARIAL">Adversarial — maximum difficulty</option>
                </select>
              </Field>
              <Field label="System maturity override" hint="InspectAI auto-detects maturity from run history. Override if needed.">
                <select style={inp} value={systemMaturity} onChange={e => setSystemMaturity(e.target.value)}>
                  <option value="">Auto-detect</option>
                  <option value="NEW">New — first scans, broad coverage</option>
                  <option value="RUNNING">Running — targeted + regression</option>
                  <option value="RELIABLE">Reliable — adversarial stress tests</option>
                </select>
              </Field>
            </div>
          </Accordion>

          {/* Monitoring cycle settings */}
          <div className="card" style={{ marginTop: '10px' }}>
            <SectionHeader title="Monitoring Cycle Settings" />
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Scenarios per Cycle</label>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#4F46E5', fontFamily: 'JetBrains Mono, monospace' }}>{scenarioCount}</span>
              </div>
              <input type="range" min="5" max="500" step="5" value={scenarioCount}
                onChange={e => setScenarioCount(+e.target.value)}
                style={{ width: '100%', accentColor: '#4F46E5', height: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                <span>5 — quick check</span><span>50 — standard</span><span>500 — thorough</span>
              </div>
            </div>
            <Toggle on={dryRun} onChange={setDryRun}
              label="Dry Run"
              desc="Simulate the scan without calling your endpoint — useful for cost preview" />
          </div>
        </div>

        {/* Right column — cost + submit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ position: 'sticky', top: '0' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
              Cost Estimate
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Scenario Generation', cost: scenarioCount * 0.002, color: '#4F46E5' },
                { label: 'Panel Evaluation (3×)', cost: scenarioCount * 0.007, color: '#6366F1' },
                { label: 'Failure Analysis',    cost: scenarioCount * 0.001, color: '#818CF8' },
                { label: 'Fix Recommendations', cost: scenarioCount * 0.002, color: '#A5B4FC' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', flex: 1 }}>{item.label}</div>
                  <div style={{ width: '80px', height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((item.cost / (scenarioCount * 0.012)) * 100, 100)}%`, height: '100%', background: item.color, borderRadius: '2px' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#0F172A', minWidth: '44px', textAlign: 'right' }}>
                    ${item.cost.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: '1px', background: '#F1F5F9', margin: '0 0 12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Total Estimated</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: dryRun ? '#059669' : '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>
                {dryRun ? '$0.00' : `$${(scenarioCount * 0.012).toFixed(2)}`}
              </span>
            </div>

            {submitError && (
              <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', color: '#DC2626', marginBottom: '12px', lineHeight: '1.4' }}>
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div style={{ padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '12px', color: '#059669', marginBottom: '12px' }}>
                Scan started. Redirecting to Dashboard…
              </div>
            )}

            <button onClick={handleStartScan} disabled={!canSubmit || submitSuccess} style={{
              width: '100%', padding: '12px',
              background: canSubmit && !submitSuccess ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : '#E2E8F0',
              borderRadius: '9px', fontSize: '14px', fontWeight: '700',
              color: canSubmit && !submitSuccess ? '#fff' : '#94A3B8',
              boxShadow: canSubmit && !submitSuccess ? '0 4px 14px rgba(79,70,229,0.35)' : 'none',
            }}>
              {submitting ? 'Starting scan…' : submitSuccess ? '✓ Scan started' : dryRun ? 'Run Dry Scan' : 'Start Monitoring Cycle'}
            </button>
            <div style={{ marginTop: '8px' }}>
              {!companyName.trim() && <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>Bot name required</div>}
              {!endpoint.trim() && <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>API endpoint required</div>}
            </div>
          </div>

          {/* Pipeline info */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
              Evaluation Pipeline
            </div>
            {[
              { step: '1', label: 'Scenario Generation',  desc: 'Policy-aware adversarial prompts', color: '#059669' },
              { step: '2', label: 'Rule-Based Checks',    desc: 'Fast programmatic pre-filtering', color: '#0891B2' },
              { step: '3', label: 'LLM Judge Panel',      desc: '3 independent judges, majority vote', color: '#4F46E5' },
              { step: '4', label: 'Failure Grouping',      desc: 'Auto-groups failures by root cause', color: '#D97706' },
              { step: '5', label: 'Fix Recommendations',  desc: '5 actionable fix types generated', color: '#DB2777' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: `${item.color}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '700', color: item.color,
                }}>{item.step}</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Integration guide link */}
          <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Need help connecting your endpoint?</div>
            <button onClick={() => onNavigate('integration')} style={{
              fontSize: '13px', fontWeight: '600', color: '#4F46E5', background: 'transparent',
            }}>View Integration Guide →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Settings = Settings;
