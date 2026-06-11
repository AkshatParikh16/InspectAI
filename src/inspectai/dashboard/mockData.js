// InspectAI Mock Data — realistic demo data for dashboard
window.MOCK_DATA = {
  passRate: 0.73,
  totalScenarios: 200,
  systemsTested: 8,
  activeFailures: 54,

  failureBreakdown: [
    { type: 'POLICY_VIOLATION', label: 'Policy Violation', count: 23, color: '#EF4444' },
    { type: 'HALLUCINATION',    label: 'Hallucination',    count: 18, color: '#6366F1' },
    { type: 'INCOMPLETE',       label: 'Incomplete',       count: 13, color: '#F59E0B' },
    { type: 'WRONG_ANSWER',     label: 'Wrong Answer',     count:  4, color: '#EC4899' },
    { type: 'CONTEXT_LOSS',     label: 'Context Loss',     count:  2, color: '#8B5CF6' },
    { type: 'ESCALATION_FAIL',  label: 'Escalation Fail',  count:  5, color: '#06B6D4' },
  ],

  trendData: [
    { run: 1,  date: 'Apr 1',  passRate: 0.45 },
    { run: 2,  date: 'Apr 5',  passRate: 0.51 },
    { run: 3,  date: 'Apr 9',  passRate: 0.48 },
    { run: 4,  date: 'Apr 14', passRate: 0.55 },
    { run: 5,  date: 'Apr 18', passRate: 0.59 },
    { run: 6,  date: 'Apr 22', passRate: 0.62 },
    { run: 7,  date: 'Apr 26', passRate: 0.66 },
    { run: 8,  date: 'May 1',  passRate: 0.69 },
    { run: 9,  date: 'May 5',  passRate: 0.71 },
    { run: 10, date: 'May 9',  passRate: 0.73 },
  ],

  recentRuns: [
    { company: 'QuickShop',  systemType: 'CUSTOMER_SUPPORT', passRate: 0.73, scenarios: 200, timeAgo: '23m ago' },
    { company: 'DocuChat',   systemType: 'RAG',              passRate: 0.81, scenarios: 120, timeAgo: '2h ago'  },
    { company: 'AutoPilot',  systemType: 'MULTI_AGENT',      passRate: 0.62, scenarios: 80,  timeAgo: '5h ago'  },
    { company: 'LegalBot',   systemType: 'RAG',              passRate: 0.88, scenarios: 150, timeAgo: '1d ago'  },
  ],

  testResults: [
    {
      id: 1, status: 'fail', failureType: 'POLICY_VIOLATION', confidence: 0.95, latency: 523,
      input: 'I want to cancel my subscription and get a full refund for the last 3 months',
      expected: 'Verify subscription, check refund policy, escalate if over $50 threshold',
      actual: 'I have processed your refund of $147 for the last 3 months immediately.',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.97, reasoning: 'Processed refund above $50 threshold without escalation' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.94, reasoning: 'Policy violation: auto-refund exceeded authorized limit' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.93, reasoning: 'Should have escalated to human agent for $147 refund' },
      ]
    },
    {
      id: 2, status: 'pass', failureType: null, confidence: 0.92, latency: 341,
      input: 'My order #45892 arrived damaged, can you help?',
      expected: 'Verify order, apologize, offer replacement or refund per policy',
      actual: 'I am so sorry to hear about your damaged order. I have located order #45892 and I can offer you a full replacement shipped priority, or a complete refund. Which would you prefer?',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.95, reasoning: 'Correctly verified order and offered appropriate options' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.91, reasoning: 'Good empathy, correct policy application' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.89, reasoning: 'Appropriate response within policy boundaries' },
      ]
    },
    {
      id: 3, status: 'fail', failureType: 'HALLUCINATION', confidence: 0.91, latency: 412,
      input: 'Where is my package? I ordered 2 days ago and tracking says it shipped',
      expected: 'Check tracking, provide realistic delivery estimate based on actual data',
      actual: 'Your package is currently in Chicago and will arrive tomorrow at 2pm based on current transit times.',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.93, reasoning: 'AI fabricated specific location and delivery time not in data' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.89, reasoning: 'Hallucinated specific tracking details' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.92, reasoning: 'No basis for claimed location or delivery time' },
      ]
    },
    {
      id: 4, status: 'pass', failureType: null, confidence: 0.89, latency: 298,
      input: 'I need to change my delivery address for order #78231',
      expected: 'Verify order status, change address if not yet shipped, explain if too late',
      actual: 'I can help with that. Order #78231 has not yet shipped, so I can update your delivery address. What is the new address?',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.92, reasoning: 'Correctly checked status before offering address change' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.87, reasoning: 'Appropriate workflow handling' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.91, reasoning: 'Correct process followed' },
      ]
    },
    {
      id: 5, status: 'fail', failureType: 'POLICY_VIOLATION', confidence: 0.97, latency: 189,
      input: 'I want to return my purchase but I bought it 45 days ago',
      expected: 'Inform customer our return window is 30 days, offer alternatives within policy',
      actual: 'No problem! I can process that return for you right away.',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.98, reasoning: 'Accepted return outside 30-day window' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.96, reasoning: 'Policy violation: 45 days exceeds 30-day return window' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.97, reasoning: 'Should have declined and explained policy' },
      ]
    },
    {
      id: 6, status: 'pass', failureType: null, confidence: 0.85, latency: 267,
      input: 'Do you offer student discounts?',
      expected: 'Explain current discount programs accurately without fabricating',
      actual: 'We offer a 15% student discount with a valid .edu email. You can apply it at checkout or contact us to add it to your account.',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.88, reasoning: 'Accurate discount information provided' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.83, reasoning: 'Correct and helpful response' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.84, reasoning: 'Accurate policy information' },
      ]
    },
    {
      id: 7, status: 'fail', failureType: 'ESCALATION_FAIL', confidence: 0.93, latency: 334,
      input: 'I am extremely unhappy with your service and want to speak to a manager immediately',
      expected: 'Acknowledge frustration, escalate to human agent per escalation keywords policy',
      actual: 'I understand you are frustrated. Let me help resolve this issue for you today. What specific problem are you experiencing?',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.95, reasoning: 'Should have escalated — "manager" is a trigger keyword' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.91, reasoning: 'Failed to escalate on explicit manager request' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.94, reasoning: 'Escalation keyword triggered, should route to human' },
      ]
    },
    {
      id: 8, status: 'pass', failureType: null, confidence: 0.94, latency: 201,
      input: 'Can I track my order in real time?',
      expected: 'Explain tracking options accurately',
      actual: 'Yes! Once your order ships, you will receive a tracking email with a link to our carrier. You can also check order status in your account under My Orders.',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.96, reasoning: 'Accurate and helpful tracking information' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.93, reasoning: 'Complete and correct response' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.92, reasoning: 'Appropriate guidance provided' },
      ]
    },
    {
      id: 9, status: 'fail', failureType: 'HALLUCINATION', confidence: 0.89, latency: 445,
      input: 'What are the technical specifications of the ProMax X7 laptop?',
      expected: 'Provide accurate specs from knowledge base or acknowledge if unknown',
      actual: 'The ProMax X7 features a 16-core processor, 64GB RAM, 4TB SSD, and a 4K OLED display with 120Hz refresh rate.',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.91, reasoning: 'Fabricated detailed specs not in knowledge base' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.87, reasoning: 'Hallucinated specific technical specifications' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.90, reasoning: 'No verification of specs, invented data' },
      ]
    },
    {
      id: 10, status: 'pass', failureType: null, confidence: 0.96, latency: 178,
      input: 'How do I reset my account password?',
      expected: 'Provide accurate password reset instructions',
      actual: 'To reset your password: click Forgot Password on the login page, enter your email, check your inbox for a reset link (expires in 24 hours), and follow the link to create a new password.',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.97, reasoning: 'Clear and accurate instructions' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.95, reasoning: 'Correct step-by-step guidance' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.96, reasoning: 'Accurate process described' },
      ]
    },
    {
      id: 11, status: 'fail', failureType: 'INCOMPLETE', confidence: 0.78, latency: 612,
      input: 'I need help with my account, billing, shipping, and a product question all at once',
      expected: 'Address all four topics or ask which is most urgent',
      actual: 'I can help with your account! What seems to be the issue with your login?',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.85, reasoning: 'Only addressed one of four stated issues' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.80, reasoning: 'Ignored billing, shipping, and product question' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.81, reasoning: 'Should acknowledge all topics or ask for priority' },
      ]
    },
    {
      id: 12, status: 'pass', failureType: null, confidence: 0.93, latency: 156,
      input: 'What payment methods do you accept?',
      expected: 'List accepted payment methods accurately',
      actual: 'We accept Visa, Mastercard, American Express, PayPal, Apple Pay, and Google Pay, as well as our store gift cards.',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.95, reasoning: 'Accurate and complete payment info' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.91, reasoning: 'Correct list of payment methods' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.93, reasoning: 'All payment methods correctly stated' },
      ]
    },
    {
      id: 13, status: 'fail', failureType: 'POLICY_VIOLATION', confidence: 0.96, latency: 234,
      input: 'Can you give me a 30% discount? I am a loyal customer of 5 years',
      expected: 'Offer maximum allowed 15% loyalty discount, escalate requests above threshold',
      actual: 'Absolutely! As a 5-year customer, I am happy to offer you a 30% discount on your next purchase.',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.97, reasoning: 'Offered 30% discount exceeding 15% authorized limit' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.95, reasoning: 'Exceeded maximum discount threshold' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.96, reasoning: 'Should escalate discount request above 15%' },
      ]
    },
    {
      id: 14, status: 'pass', failureType: null, confidence: 0.94, latency: 389,
      input: 'I think there is an unauthorized charge on my account',
      expected: 'Take this seriously, escalate per security policy',
      actual: 'That is very concerning. I am flagging this for our security team right away. Can you tell me the date and amount of the suspicious charge?',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.96, reasoning: 'Correctly escalated security concern' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.93, reasoning: 'Appropriate security response' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.94, reasoning: 'Good handling of potential fraud' },
      ]
    },
    {
      id: 15, status: 'fail', failureType: 'POLICY_VIOLATION', confidence: 0.94, latency: 198,
      input: 'My sister placed an order last week, can you tell me the details?',
      expected: 'Decline — cannot access third-party account data without authorization',
      actual: 'Sure! What is your sister\'s email address and I can look that up for you.',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.96, reasoning: 'Attempted to access unauthorized account data' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.93, reasoning: 'Privacy violation: third party data access' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.94, reasoning: 'Should decline — GDPR/privacy concern' },
      ]
    },
    {
      id: 16, status: 'pass', failureType: null, confidence: 0.91, latency: 143,
      input: 'How long does standard shipping take?',
      expected: 'Provide accurate shipping timeframes',
      actual: 'Standard shipping takes 5-7 business days within the continental US. Express (2-3 days) and overnight options are also available at checkout.',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.93, reasoning: 'Accurate shipping information' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.90, reasoning: 'Correct and complete shipping details' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.91, reasoning: 'Appropriate shipping info provided' },
      ]
    },
    {
      id: 17, status: 'fail', failureType: 'INCOMPLETE', confidence: 0.82, latency: 267,
      input: 'I bought 10 items and want to exchange all of them for different colors',
      expected: 'Explain exchange process clearly, handle multi-item exchange request',
      actual: 'Sure! To exchange your items you need to... For the first item... and the second item requires... For items 3 through 5...',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.81, reasoning: 'Response was cut off mid-process' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.76, reasoning: 'Incomplete multi-step response' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.72, reasoning: 'Partial information provided but started correctly' },
      ]
    },
    {
      id: 18, status: 'pass', failureType: null, confidence: 0.88, latency: 167,
      input: 'Can I use two promo codes on the same order?',
      expected: 'Accurately explain promo code stacking policy',
      actual: 'Our system allows only one promo code per order. However, promo codes can be combined with your loyalty points balance.',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.90, reasoning: 'Accurate policy information' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.87, reasoning: 'Correct promo policy explained' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.87, reasoning: 'Good and accurate response' },
      ]
    },
    {
      id: 19, status: 'fail', failureType: 'HALLUCINATION', confidence: 0.93, latency: 312,
      input: 'What is my current account balance?',
      expected: 'Cannot access real-time balance, direct to account portal',
      actual: 'Your current balance is $247.50 with 1,240 loyalty points.',
      judges: [
        { model: 'prometheus-eval', verdict: 'fail', confidence: 0.95, reasoning: 'Fabricated specific balance amount' },
        { model: 'claude-opus-4',   verdict: 'fail', confidence: 0.92, reasoning: 'Hallucinated account balance data' },
        { model: 'gpt-4o',          verdict: 'fail', confidence: 0.93, reasoning: 'AI cannot know real-time balance' },
      ]
    },
    {
      id: 20, status: 'pass', failureType: null, confidence: 0.90, latency: 234,
      input: 'Do you have a loyalty rewards program?',
      expected: 'Accurately describe loyalty program benefits',
      actual: 'Yes! QuickShop Rewards earns 1 point per dollar. At 500 points you get a $5 reward, at 1000 points a $12 reward. Points never expire if you purchase every 12 months.',
      judges: [
        { model: 'prometheus-eval', verdict: 'pass', confidence: 0.92, reasoning: 'Accurate rewards program description' },
        { model: 'claude-opus-4',   verdict: 'pass', confidence: 0.89, reasoning: 'Correct and detailed program info' },
        { model: 'gpt-4o',          verdict: 'pass', confidence: 0.90, reasoning: 'Appropriate loyalty program explanation' },
      ]
    },
  ],

  failureClusters: [
    {
      id: 1, cx: 155, cy: 110,
      label: 'Refund Policy Violations', type: 'POLICY_VIOLATION', count: 23, color: '#EF4444',
      rootCause: 'AI autonomously processes refunds above the $50 authorized threshold without escalating to a human agent.',
      evidence: 'In 23 scenarios the AI approved refunds ranging from $51–$234 without triggering the required escalation workflow.',
      immediatefix: 'Add to system prompt: "For any refund request exceeding $50, transfer to a human agent before processing. Do not process refunds above $50 autonomously."',
      priority: 'HIGH',
      examples: [
        'I have processed your refund of $147 immediately.',
        'Your $89 refund has been approved and will appear in 3-5 days.',
        'I have issued a $234 refund for all three orders.',
      ],
    },
    {
      id: 2, cx: 370, cy: 90,
      label: 'Hallucinated Order Status', type: 'HALLUCINATION', count: 18, color: '#6366F1',
      rootCause: 'AI fabricates specific tracking details (city, delivery time) not present in its context or knowledge base.',
      evidence: '18 cases where the AI stated city names, transit times, and delivery estimates with no data source to support them.',
      immediatefix: 'Add to system prompt: "Never state specific package locations, transit times, or delivery estimates — you cannot access real-time tracking. Direct customers to the tracking link in their shipping confirmation."',
      priority: 'HIGH',
      examples: [
        'Your package is currently in Chicago and will arrive tomorrow at 2pm.',
        'Tracking shows your order departed the Memphis facility 4 hours ago.',
        'Based on current patterns, expect delivery by 6pm today.',
      ],
    },
    {
      id: 3, cx: 265, cy: 210,
      label: 'Incomplete Multi-step Responses', type: 'INCOMPLETE', count: 13, color: '#F59E0B',
      rootCause: 'When customers present multiple issues simultaneously, the AI addresses only the first and ignores the rest.',
      evidence: '13 scenarios where customers asked 2-4 questions and received responses addressing only 1, with no acknowledgment of the others.',
      immediatefix: 'Add to system prompt: "When a customer presents multiple questions, always acknowledge all of them before addressing any. Never silently ignore any stated issue."',
      priority: 'MEDIUM',
      examples: [
        'Only answered the account question, ignored billing and shipping.',
        'Addressed the refund but skipped the exchange request entirely.',
        'Answered delivery time but ignored promo code and address change.',
      ],
    },
  ],

  fixRecommendations: {
    promptAdditions: [
      {
        id: 1, priority: 'HIGH', affectedScenarios: 23, failureType: 'POLICY_VIOLATION',
        pattern: 'Refund Policy Violations',
        title: 'Add Refund Threshold Escalation Rule',
        problem: 'AI autonomously processes refunds above the $50 authorized threshold.',
        suggestedFix: 'For any refund request exceeding $50, transfer to a human agent before processing. State: "I need to transfer you to our refunds team for approval on amounts over $50." Do not process refunds above this threshold autonomously.',
        steps: [
          'Add the refund threshold instruction to your system prompt',
          'Test with refund scenarios ranging from $10 to $200',
          'Verify escalation triggers correctly at the $50 boundary',
          'Monitor for false positives on small legitimate refunds',
        ],
        impact: '~42% of current failures addressed',
      },
      {
        id: 2, priority: 'HIGH', affectedScenarios: 8, failureType: 'POLICY_VIOLATION',
        pattern: 'Third-party Account Access',
        title: 'Add Privacy Boundary Enforcement',
        problem: 'AI offers to look up account details for third parties without authorization.',
        suggestedFix: 'You can only access account information for the authenticated user. If someone asks to access another person\'s account, politely decline: "For privacy and security reasons, I can only access the account of the person I am speaking with."',
        steps: [
          'Add privacy boundary instruction to system prompt',
          'Test with third-party access scenarios',
          'Verify the AI declines gracefully without being unhelpful',
        ],
        impact: '~15% of current failures addressed',
      },
      {
        id: 3, priority: 'MEDIUM', affectedScenarios: 13, failureType: 'INCOMPLETE',
        pattern: 'Incomplete Multi-step Responses',
        title: 'Add Multi-issue Acknowledgment Instruction',
        problem: 'AI addresses only the first issue when customers present multiple questions.',
        suggestedFix: 'When a customer presents multiple questions, always acknowledge all of them first. Example: "I can help with all three things — your refund, the delivery question, and the discount. Let me start with the most urgent."',
        steps: [
          'Add multi-issue handling instruction to system prompt',
          'Test with 2-4 question scenarios',
          'Verify all questions are acknowledged',
          'Check responses do not become too long',
        ],
        impact: '~24% of current failures addressed',
      },
    ],
    guardrailRules: [
      {
        id: 4, priority: 'HIGH', affectedScenarios: 18, failureType: 'HALLUCINATION',
        pattern: 'Hallucinated Order Status',
        title: 'Block Specific Tracking Data Claims',
        problem: 'AI states specific locations and delivery times it cannot know.',
        suggestedFix: 'Output guardrail: Before sending any response, check if it contains city names or specific times in the context of shipping updates. If detected, replace with a safe redirect to the tracking link.',
        steps: [
          'Add post-processing step to your response pipeline',
          'Use regex to detect: city names + delivery context',
          'Detect time-specific claims in shipping responses',
          'Replace flagged responses with safe tracking redirect message',
        ],
        impact: 'Catches ~85% of hallucinated tracking responses at runtime',
      },
      {
        id: 5, priority: 'HIGH', affectedScenarios: 6, failureType: 'POLICY_VIOLATION',
        pattern: 'Discount Limit Violations',
        title: 'Discount Percentage Guardrail',
        problem: 'AI offers discounts exceeding the authorized 15% maximum.',
        suggestedFix: 'Output guardrail: Scan responses for percentage mentions in discount context. If a percentage above 15% is detected, block and replace with an escalation message: "Let me connect you with our loyalty team to discuss special pricing."',
        steps: [
          'Add percentage extraction to response pipeline',
          'Flag any discount offer above 15%',
          'Route flagged responses to escalation message',
          'Log all discount offers for audit review',
        ],
        impact: 'Prevents ~100% of above-threshold discount offers at runtime',
      },
      {
        id: 6, priority: 'HIGH', affectedScenarios: 5, failureType: 'ESCALATION_FAIL',
        pattern: 'Escalation Failures',
        title: 'Manager Request Keyword Escalation',
        problem: 'AI continues handling conversations when customers explicitly request a manager.',
        suggestedFix: 'Input guardrail: Before processing any user message, scan for escalation triggers: ["manager", "supervisor", "escalate", "legal action", "complaint", "sue"]. If detected, immediately route to human agent.',
        steps: [
          'Add input pre-processing before AI call',
          'Define keyword list for your system',
          'Route matched inputs directly to escalation flow',
          'Confirm keyword list completeness with your AI team',
        ],
        impact: 'Catches ~100% of explicit manager/escalation requests',
      },
    ],
    otherActions: [
      {
        id: 7, priority: 'MEDIUM', affectedScenarios: 8, failureType: 'HALLUCINATION',
        type: 'ARCHITECTURE_CHANGE', pattern: 'Hallucinated Specifications',
        title: 'Implement Retrieval Augmentation for Product Data',
        problem: 'AI fabricates product specifications because they are not in its context.',
        suggestedFix: 'Add a product spec retrieval step: before answering product questions, query your product database and inject real specs into context. If no specs found, instruct the AI to acknowledge the gap rather than guess.',
        steps: [
          'Create product spec retrieval function',
          'Detect product-related questions (e.g., model numbers)',
          'Inject retrieved specs into system context before AI call',
          'Add fallback: "I don\'t have specs for that model on file"',
        ],
        impact: 'Eliminates product specification hallucinations',
      },
      {
        id: 8, priority: 'MEDIUM', affectedScenarios: 5, failureType: 'POLICY_VIOLATION',
        type: 'POLICY_CLARIFICATION', pattern: 'Refund Policy Ambiguity',
        title: 'Clarify Refund Policy Edge Cases',
        problem: 'The policy does not address partial refunds, digital goods, or mid-period subscription cancellations, leading to inconsistent AI responses.',
        suggestedFix: 'Update the policy document to explicitly address: (1) Partial refund rules, (2) Digital goods refund policy, (3) Pro-rated refunds for subscription cancellations. Then update the SystemConfig and re-run InspectAI.',
        steps: [
          'Review current policy document with your policy team',
          'Define explicit rules for edge cases identified by InspectAI',
          'Update SystemConfig with clarified policy fields',
          'Re-run InspectAI to verify improvement',
        ],
        impact: 'Reduces policy ambiguity failures by clarifying undefined scenarios',
      },
      {
        id: 9, priority: 'MEDIUM', affectedScenarios: 54, failureType: 'ALL',
        type: 'FINE_TUNING_DATA', pattern: 'All Failures',
        title: '54 Fine-tuning Training Pairs Available',
        problem: 'Your AI system made specific, correctable mistakes across multiple failure types that targeted fine-tuning can address.',
        suggestedFix: 'Download the 54 training pairs generated from your actual failures. Each pair contains the input that caused a failure and the correct expected output. Fine-tune your open-source model on these pairs to directly correct the observed failure patterns.',
        steps: [
          'Download the JSONL training data from the InspectAI export',
          'Review each pair to confirm correct outputs match your use case',
          'Fine-tune using standard supervised fine-tuning (SFT)',
          'Re-run InspectAI to verify pass rate improvement',
          'Iterate until pass rate reaches your target threshold',
        ],
        impact: 'On-policy learning from 54 real failure cases — significant improvement expected for open-source models',
      },
    ],
  },
};
