from inspectai.models.schemas import UserPersona

UNIVERSAL_PERSONAS: list[UserPersona] = [
    UserPersona(
        name="Frustrated First Timer",
        age_range="22-32",
        communication_style="informal, typos, incomplete sentences, uses lowercase",
        emotional_state="frustrated, impatient, confused",
        tech_savviness="low",
        typical_issues=["can't find order", "confused by process", "doesn't understand policy"],
        example_phrases=[
            "where is my stuff??",
            "i ordered like 3 days ago and nothing",
            "this is so confusing i dont know what to do",
            "why is this so hard",
        ],
        industry_relevance=["retail", "saas", "delivery"],
        created_from="universal",
    ),
    UserPersona(
        name="Polite But Persistent",
        age_range="40-60",
        communication_style="formal, complete sentences, patient but firm",
        emotional_state="calm but determined, won't give up",
        tech_savviness="medium",
        typical_issues=["billing discrepancy", "policy questions", "wants clear answers"],
        example_phrases=[
            "I would like to understand why I was charged twice",
            "I have been waiting for a response for several days now",
            "Could you please explain your return policy in detail",
            "I would appreciate a clear answer to my question",
        ],
        industry_relevance=["fintech", "healthcare", "insurance", "retail"],
        created_from="universal",
    ),
    UserPersona(
        name="Angry Escalator",
        age_range="30-50",
        communication_style="aggressive, demanding, uses caps for emphasis",
        emotional_state="very angry, threatening to leave or dispute",
        tech_savviness="medium",
        typical_issues=["bad experience", "wants compensation", "feels disrespected"],
        example_phrases=[
            "I want to speak to a manager RIGHT NOW",
            "This is absolutely UNACCEPTABLE",
            "I'm going to dispute this with my bank",
            "You've lost a customer. I'm done.",
        ],
        industry_relevance=["retail", "fintech", "telecom", "delivery"],
        created_from="universal",
    ),
    UserPersona(
        name="Confused Senior",
        age_range="62-78",
        communication_style="polite, verbose, easily confused, over-explains",
        emotional_state="anxious, uncertain, worried about making mistakes",
        tech_savviness="very_low",
        typical_issues=[
            "can't navigate system",
            "doesn't understand process",
            "worried about security",
        ],
        example_phrases=[
            "My grandson helped me set this up but I'm not sure I did it right",
            "I pressed something and now I don't know what happened",
            "Is this the right place to ask about my account?",
            "I don't want to make things worse by doing the wrong thing",
        ],
        industry_relevance=["healthcare", "fintech", "insurance", "retail"],
        created_from="universal",
    ),
    UserPersona(
        name="Smart Manipulator",
        age_range="20-35",
        communication_style="clever, probing, tests boundaries subtly",
        emotional_state="calculated, persistent, knows the system",
        tech_savviness="high",
        typical_issues=[
            "trying to get exceptions",
            "testing policy limits",
            "wants special treatment",
        ],
        example_phrases=[
            "I know your policy says 30 days but I'm a long-time customer",
            "The last agent made an exception for me last time",
            "I'll just dispute with PayPal if you can't help me today",
            "Other companies do this without any issue",
        ],
        industry_relevance=["retail", "saas", "fintech", "delivery"],
        created_from="universal",
    ),
    UserPersona(
        name="Brief and Cryptic",
        age_range="18-30",
        communication_style="extremely short messages, no context, expects AI to figure it out",
        emotional_state="neutral, impatient, minimal effort",
        tech_savviness="medium",
        typical_issues=["order issues", "account problems"],
        example_phrases=[
            "not working",
            "where",
            "refund",
            "help",
            "???",
        ],
        industry_relevance=["retail", "saas", "delivery", "gaming"],
        created_from="universal",
    ),
    UserPersona(
        name="Over Explainer",
        age_range="35-55",
        communication_style=(
            "extremely detailed, provides too much irrelevant context, long messages"
        ),
        emotional_state="anxious, wants to make sure everything is understood",
        tech_savviness="medium",
        typical_issues=["complex multi-part issues", "needs step by step help"],
        example_phrases=[
            (
                "So last Tuesday, actually it might have been Wednesday, I was trying to place "
                "an order and before that I had previously ordered in March and that went fine "
                "but this time something different happened and I'm not sure if it's related to "
                "my account or the website..."
            ),
            "I want to explain everything so you have the full picture",
        ],
        industry_relevance=["healthcare", "insurance", "fintech", "retail"],
        created_from="universal",
    ),
    UserPersona(
        name="Repeat Contacter",
        age_range="28-50",
        communication_style="frustrated references to previous contacts, demands continuity",
        emotional_state="exhausted, fed up, losing trust",
        tech_savviness="medium",
        typical_issues=[
            "unresolved previous issue",
            "feels ignored",
            "wants someone to actually fix it",
        ],
        example_phrases=[
            "I've already contacted you THREE times about this",
            "The last agent told me it was resolved but it wasn't",
            "Can someone actually look into this instead of giving me the same answer",
            "I have a ticket number from last week: this is a follow up",
        ],
        industry_relevance=["telecom", "retail", "fintech", "saas"],
        created_from="universal",
    ),
    UserPersona(
        name="Third Party Caller",
        age_range="30-55",
        communication_style=(
            "explains they are contacting on behalf of someone else,"
            " provides secondhand information"
        ),
        emotional_state="concerned, helpful, sometimes uncertain about details",
        tech_savviness="medium",
        typical_issues=["managing account for family member", "limited access to account details"],
        example_phrases=[
            "I'm calling on behalf of my elderly mother",
            "My husband asked me to sort this out for him",
            "I don't have all the details but I think the order number is...",
            "She can't use the computer so I'm helping her",
        ],
        industry_relevance=["healthcare", "insurance", "retail", "fintech"],
        created_from="universal",
    ),
    UserPersona(
        name="Emoji and Informal",
        age_range="16-28",
        communication_style="heavy emoji use, internet slang, abbreviations, casual",
        emotional_state="casual but expects fast help",
        tech_savviness="high",
        typical_issues=["quick fixes", "delivery updates", "simple account questions"],
        example_phrases=[
            "heyyy so my order hasn't arrived yet 😭 been waiting forever",
            "can u help me pls 🙏🙏",
            "ngl this is kinda frustrating rn",
            "omg finally someone!! ok so here's the thing 👇",
        ],
        industry_relevance=["retail", "delivery", "gaming", "beauty"],
        created_from="universal",
    ),
    UserPersona(
        name="Formal Complaint Writer",
        age_range="40-65",
        communication_style=(
            "structured paragraphs, formal language,"
            " references consumer rights, documents everything"
        ),
        emotional_state="calm but serious, knows their rights",
        tech_savviness="medium",
        typical_issues=[
            "significant financial issue",
            "wants formal resolution",
            "potential legal action",
        ],
        example_phrases=[
            "I am writing to formally raise a complaint regarding...",
            "As per your terms and conditions section 4.2...",
            "I am aware of my rights under consumer protection law",
            "I request a written response within 5 business days",
        ],
        industry_relevance=["fintech", "insurance", "telecom", "retail"],
        created_from="universal",
    ),
    UserPersona(
        name="Guilt Tripper",
        age_range="35-60",
        communication_style="emotional appeals, references loyalty and past positive experiences",
        emotional_state="disappointed, hurt, appealing to empathy",
        tech_savviness="low",
        typical_issues=["wants exception to policy", "feels loyalty should be rewarded"],
        example_phrases=[
            "I've been a loyal customer for over 8 years",
            "I've never complained before and always recommended you to friends",
            "I'm really disappointed because I always trusted your company",
            "After everything I've spent here I didn't expect to be treated this way",
        ],
        industry_relevance=["retail", "telecom", "fintech", "hospitality"],
        created_from="universal",
    ),
    UserPersona(
        name="Non-Native English Speaker",
        age_range="25-50",
        communication_style=(
            "grammatical patterns from first language, formal but with errors, literal translations"
        ),
        emotional_state="polite, sometimes uncertain about word choice",
        tech_savviness="medium",
        typical_issues=["misunderstood policy", "language barrier causing confusion"],
        example_phrases=[
            "Please I want to know about my order which I make last week",
            "The delivery man he did not come to my house",
            "I am not understanding why the charge is different",
            "Can you please explain me the process",
        ],
        industry_relevance=["retail", "delivery", "fintech", "healthcare"],
        created_from="universal",
    ),
    UserPersona(
        name="Comparison Maker",
        age_range="25-45",
        communication_style="references competitors frequently, uses comparison as leverage",
        emotional_state="calculating, considering switching",
        tech_savviness="high",
        typical_issues=["pricing concerns", "feature gaps", "wants better deal"],
        example_phrases=[
            "Your competitor does this automatically with no hassle",
            "I was about to switch to them but gave you one more chance",
            "They offer free returns no questions asked",
            "Why do you charge for this when everyone else does it free",
        ],
        industry_relevance=["saas", "fintech", "telecom", "retail"],
        created_from="universal",
    ),
    UserPersona(
        name="Panicking About Urgency",
        age_range="20-50",
        communication_style="urgent, time-pressured, explains deadline repeatedly",
        emotional_state="panicking, stressed, needs immediate resolution",
        tech_savviness="medium",
        typical_issues=[
            "time sensitive delivery",
            "urgent account access",
            "event-dependent order",
        ],
        example_phrases=[
            "I need this resolved TODAY it's extremely urgent",
            "This is for my daughter's birthday tomorrow and nothing has arrived",
            "I have a flight in 3 hours and can't access my account",
            "Please I'm begging you this cannot wait",
        ],
        industry_relevance=["retail", "delivery", "travel", "fintech"],
        created_from="universal",
    ),
    UserPersona(
        name="Suspicious and Distrustful",
        age_range="40-65",
        communication_style="questions everything, asks for verification, worried about scams",
        emotional_state="distrustful, cautious, protective",
        tech_savviness="low",
        typical_issues=["unexpected charges", "account security", "worried about fraud"],
        example_phrases=[
            "How do I know this is actually your company and not a scam",
            "I didn't authorize this charge and I want to know who did",
            "I'm not giving you any information until you verify who you are",
            "I've been reading about AI chatbots stealing data",
        ],
        industry_relevance=["fintech", "healthcare", "insurance", "retail"],
        created_from="universal",
    ),
    UserPersona(
        name="Multi-Issue Sender",
        age_range="28-48",
        communication_style=(
            "combines multiple unrelated problems in one message, jumps between topics"
        ),
        emotional_state="overwhelmed, wants everything resolved at once",
        tech_savviness="medium",
        typical_issues=[
            "multiple simultaneous problems",
            "billing AND delivery AND account issues",
        ],
        example_phrases=[
            (
                "I have a few things - first my order is late, also I was charged twice, "
                "and I also want to update my address and can you check if my loyalty "
                "points are correct"
            ),
            "While I have you can you also help me with something else",
        ],
        industry_relevance=["retail", "telecom", "fintech", "saas"],
        created_from="universal",
    ),
    UserPersona(
        name="Vague Problem Describer",
        age_range="20-45",
        communication_style="extremely vague, assumes AI knows the context, minimal details",
        emotional_state="casual, assumes it will be obvious",
        tech_savviness="low",
        typical_issues=[
            "unclear what they actually need",
            "requires multiple clarification rounds",
        ],
        example_phrases=[
            "it's not working",
            "the thing I ordered is wrong",
            "something happened with my account",
            "you know the problem I had before? still not fixed",
        ],
        industry_relevance=["retail", "saas", "delivery", "gaming"],
        created_from="universal",
    ),
    UserPersona(
        name="Overly Apologetic",
        age_range="25-45",
        communication_style="apologizes repeatedly, minimizes their own problem, very gentle",
        emotional_state="timid, doesn't want to cause trouble, grateful for any help",
        tech_savviness="low",
        typical_issues=["legitimate issues they feel bad about raising"],
        example_phrases=[
            "I'm so sorry to bother you with this, I'm sure you're very busy",
            "I know it's probably my fault but I'm not sure what happened",
            "I hate to complain but I'm a little confused about my order",
            "Please don't worry if it's too much trouble",
        ],
        industry_relevance=["retail", "healthcare", "saas"],
        created_from="universal",
    ),
    UserPersona(
        name="Business Professional",
        age_range="30-50",
        communication_style="direct, time-pressured, expects efficiency, no small talk",
        emotional_state="neutral, professional, impatient with inefficiency",
        tech_savviness="high",
        typical_issues=[
            "account management",
            "billing for business",
            "bulk orders",
            "API or integration issues",
        ],
        example_phrases=[
            "I need this escalated immediately. Our operations depend on this.",
            "What is the SLA for resolution on this ticket",
            "I manage 50 accounts and need a bulk solution not one-by-one",
            "Send me the technical documentation. I don't need the basic explanation.",
        ],
        industry_relevance=["saas", "fintech", "logistics", "healthcare"],
        created_from="universal",
    ),
]


def get_personas_for_context(
    has_description: bool,
    has_conversations: bool,
    industry: str | None = None,
) -> list[UserPersona]:
    """
    Returns the appropriate set of universal personas
    based on available context.

    Industry filtering: if industry is provided,
    prioritizes personas relevant to that industry
    but always includes all 20 universal personas
    as the base. Industry-specific personas will be
    generated dynamically by the ScenarioGenerator.
    """
    if industry:
        relevant = [
            p for p in UNIVERSAL_PERSONAS
            if industry.lower() in [i.lower() for i in p.industry_relevance]
        ]
        others = [p for p in UNIVERSAL_PERSONAS if p not in relevant]
        return relevant + others
    return UNIVERSAL_PERSONAS


PERSONA_RETIREMENT_THRESHOLD = 0.05
# Personas with failure_discovery_rate below this
# after 5+ uses get marked as retired

PERSONA_HIGH_VALUE_THRESHOLD = 0.40
# Personas with failure_discovery_rate above this
# get marked as high_value and used more frequently
