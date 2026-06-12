// InspectAI Portal API client
window.FAIL_COLORS = {
  POLICY_VIOLATION:  '#EF4444',
  HALLUCINATION:     '#6366F1',
  INCOMPLETE:        '#F59E0B',
  WRONG_ANSWER:      '#EC4899',
  CONTEXT_LOSS:      '#8B5CF6',
  ESCALATION_FAIL:   '#06B6D4',
  ESCALATION_FAILURE:'#06B6D4',
};

window.API = {
  async getRuns() {
    const r = await fetch('/api/runs');
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  },

  async getRun(id) {
    const r = await fetch(`/api/runs/${id}`);
    if (!r.ok) return null;
    return r.json();
  },

  async startRun(payload) {
    const r = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const msg = await r.text().catch(() => r.statusText);
      throw new Error(msg || `HTTP ${r.status}`);
    }
    return r.json();
  },

  async getDemo() {
    const r = await fetch('/demo');
    if (!r.ok) throw new Error('Demo unavailable');
    return r.json();
  },

  async getHealth() {
    const r = await fetch('/health');
    if (!r.ok) throw new Error('API unavailable');
    return r.json();
  },

  /** Build a full run-like object from the static mock data for empty state fallback */
  buildDemoRun() {
    const m = window._MOCK_DATA_REMOVED;
    if (!m) return null;
    return {
      id: 'demo-shopeasy',
      company_name: 'ShopEasy',
      system_type: 'CUSTOMER_SUPPORT',
      status: 'completed',
      pass_rate: m.passRate,
      total_scenarios: 20,
      total_failures: 7,
      run_cost_usd: 0.24,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),

      config_json: {
        company_name: 'ShopEasy',
        industry: 'retail',
        system_type: 'CUSTOMER_SUPPORT',
        target_endpoint: 'https://api.shopeasy.example/v1/chat',
        target_model: 'claude-sonnet-4-6',
        scenario_count: 20,
        policy: {
          refund_threshold: 50,
          return_window_days: 30,
          max_discount_percent: 15,
          escalate_on_keywords: ['manager', 'supervisor', 'legal', 'fraud', 'sue'],
        },
      },

      results_json: {
        pass_rate: m.passRate,
        total_scenarios: 20,
        passed: 13,
        failed: 7,
        failure_breakdown: { POLICY_VIOLATION: 3, HALLUCINATION: 3, ESCALATION_FAIL: 1 },
        results: m.testResults.slice(0, 20).map(r => ({
          id: String(r.id),
          passed: r.status === 'pass',
          failure_type: r.failureType,
          confidence_score: r.confidence,
          latency_ms: r.latency,
          actual_response: r.actual,
          scenario: { input: r.input, expected_behavior: r.expected },
          panel_verdict: {
            individual_verdicts: r.judges.map(j => ({
              judge_model: j.model,
              passed: j.verdict === 'pass',
              confidence: j.confidence,
              reasoning: j.reasoning,
            })),
          },
        })),
      },

      analysis_json: {
        insight_summary: 'ShopEasy support bot shows a 73% pass rate with policy enforcement as the primary risk area. Refund threshold and escalation handling need immediate attention.',
        contrast_insights: 'Passing responses maintain policy boundaries and provide factual answers. Failing responses typically attempt unauthorized autonomous actions or fabricate order data.',
        failure_patterns: m.failureClusters.map(c => ({
          failure_type: c.type,
          scenario_count: c.count,
          root_cause: c.rootCause,
          evidence: c.evidence,
          example_inputs: c.examples,
          immediate_fix: c.immediatefix,
          suggested_priority: c.priority,
          cluster_label: c.label,
          percentage_of_total_failures: Math.round((c.count / 54) * 100),
        })),
      },

      fixes_json: {
        estimated_improvement: '+18-24% pass rate improvement if all HIGH priority fixes applied',
        fixes: [
          ...m.fixRecommendations.promptAdditions.map(f => ({
            id: String(f.id), title: f.title, fix_type: 'PROMPT_ADDITION',
            failure_type: f.failureType, failure_pattern: f.pattern,
            affected_scenarios: f.affectedScenarios, suggested_priority: f.priority,
            problem: f.problem, suggested_fix: f.suggestedFix,
            implementation_steps: f.steps, estimated_impact: f.impact,
          })),
          ...m.fixRecommendations.guardrailRules.map(f => ({
            id: String(f.id), title: f.title, fix_type: 'GUARDRAIL_RULE',
            failure_type: f.failureType, failure_pattern: f.pattern,
            affected_scenarios: f.affectedScenarios, suggested_priority: f.priority,
            problem: f.problem, suggested_fix: f.suggestedFix,
            implementation_steps: f.steps, estimated_impact: f.impact,
          })),
          ...m.fixRecommendations.otherActions.map(f => ({
            id: String(f.id), title: f.title, fix_type: f.type || 'ARCHITECTURE_CHANGE',
            failure_type: f.failureType, failure_pattern: f.pattern,
            affected_scenarios: f.affectedScenarios, suggested_priority: f.priority,
            problem: f.problem, suggested_fix: f.suggestedFix,
            implementation_steps: f.steps, estimated_impact: f.impact,
          })),
        ],
      },
    };
  },
};
