from collections import Counter

import structlog

from inspectai.models.schemas import (
    ConversationInsights,
    ExampleConversation,
    SystemType,
)

logger = structlog.get_logger()


class ConversationAnalyzer:
    """
    Analyzes a company's existing conversations to extract
    behavioral patterns, language styles, and failure signals.

    Uses a three-tier quality system:
    - HIGH quality: full conversations with outcomes, 2+ turns
    - MEDIUM quality: conversations without outcomes but 2+ turns
    - LOW quality: single messages or incomplete conversations

    High quality gets full weight for all extractions.
    Medium quality gets full weight for vocabulary and topics only.
    Low quality gets partial weight for vocabulary only.
    """

    def __init__(self, system_type: SystemType) -> None:
        self.system_type = system_type

    async def analyze(
        self,
        conversations: list[ExampleConversation],
    ) -> ConversationInsights:
        """
        Main entry point. Takes a list of ExampleConversation objects
        and returns a ConversationInsights object.

        If conversations list is empty returns a default
        ConversationInsights with all empty fields.
        """
        if not conversations:
            logger.info(
                "no_conversations_provided",
                system_type=self.system_type,
            )
            return ConversationInsights(total_conversations_analyzed=0)

        high, medium, low = self._tier_conversations(conversations)

        logger.info(
            "conversations_tiered",
            high_quality=len(high),
            medium_quality=len(medium),
            low_quality=len(low),
            total=len(conversations),
        )

        insights = ConversationInsights(
            total_conversations_analyzed=len(conversations)
        )

        insights.user_vocabulary = self._extract_vocabulary(high + medium + low)
        insights.top_issue_categories = self._extract_topics(high + medium)
        insights.dominant_language_patterns = self._extract_language_patterns(
            high + medium
        )
        insights.failure_triggers = self._extract_failure_triggers(high)
        insights.successful_resolutions = self._extract_successful_resolutions(high)
        insights.emotional_tone_distribution = self._analyze_emotional_tone(
            high + medium
        )
        insights.average_message_length = self._calculate_avg_message_length(
            high + medium + low
        )
        insights.extracted_personas = self._extract_persona_hints(high)

        logger.info(
            "conversation_analysis_complete",
            topics_found=len(insights.top_issue_categories),
            failure_triggers=len(insights.failure_triggers),
            vocabulary_size=len(insights.user_vocabulary),
            personas_extracted=len(insights.extracted_personas),
        )

        return insights

    def _tier_conversations(
        self,
        conversations: list[ExampleConversation],
    ) -> tuple[
        list[ExampleConversation],
        list[ExampleConversation],
        list[ExampleConversation],
    ]:
        """
        Splits conversations into three quality tiers.

        HIGH: has outcome AND content length > 20 chars
        MEDIUM: no outcome but content length > 20 chars
        LOW: very short content or missing key fields
        """
        high, medium, low = [], [], []

        for conv in conversations:
            if not conv.content:
                continue

            is_long_enough = len(conv.content) > 20
            has_outcome = conv.outcome is not None and len(conv.outcome) > 0

            if has_outcome and is_long_enough:
                high.append(conv)
            elif is_long_enough:
                medium.append(conv)
            else:
                low.append(conv)

        return high, medium, low

    def _extract_vocabulary(
        self,
        conversations: list[ExampleConversation],
    ) -> list[str]:
        """
        Extracts the most frequently used words from user messages.
        Filters out common stop words.
        Returns top 50 most relevant words.
        """
        STOP_WORDS = {
            "i", "me", "my", "the", "a", "an", "and", "or", "but",
            "in", "on", "at", "to", "for", "of", "with", "is", "was",
            "are", "were", "be", "been", "have", "has", "had", "do",
            "did", "will", "would", "could", "should", "this", "that",
            "it", "its", "we", "you", "your", "they", "their", "what",
            "how", "when", "where", "who", "which", "there", "here",
            "not", "no", "yes", "just", "so", "if", "about", "from",
            "get", "got", "can", "please", "hi", "hello", "hey",
            "thanks", "thank",
        }

        user_messages = [conv for conv in conversations if conv.role == "user"]

        words = []
        for msg in user_messages:
            cleaned = msg.content.lower()
            for char in ".,!?;:()[]{}\"'":
                cleaned = cleaned.replace(char, " ")
            words.extend([
                w for w in cleaned.split()
                if w not in STOP_WORDS and len(w) > 2
            ])

        counter = Counter(words)
        return [word for word, _ in counter.most_common(50)]

    def _extract_topics(
        self,
        conversations: list[ExampleConversation],
    ) -> list[str]:
        """
        Identifies the most common issue categories from conversations.
        Uses keyword matching against a topic taxonomy.
        Returns topics sorted by frequency.
        """
        TOPIC_KEYWORDS = {
            "order_tracking": [
                "order", "tracking", "shipped", "delivery", "arrived",
                "where", "status", "package", "parcel", "dispatch",
            ],
            "returns_refunds": [
                "return", "refund", "money back", "send back",
                "exchange", "wrong item", "damaged", "broken",
            ],
            "billing_payments": [
                "charged", "charge", "payment", "invoice", "bill",
                "price", "cost", "fee", "subscription", "overcharged",
            ],
            "account_access": [
                "login", "password", "account", "access", "locked",
                "reset", "email", "sign in", "username",
            ],
            "product_questions": [
                "product", "item", "size", "color", "available",
                "stock", "specification", "compatible", "works with",
            ],
            "delivery_issues": [
                "late", "delayed", "missing", "lost", "wrong address",
                "not delivered", "driver", "courier", "reschedule",
            ],
            "complaints": [
                "terrible", "awful", "worst", "disappointed",
                "unacceptable", "horrible", "complaint", "disgusting",
            ],
            "cancellations": [
                "cancel", "cancellation", "stop", "end subscription",
                "unsubscribe", "close account",
            ],
            "technical_support": [
                "error", "bug", "not working", "broken", "crash",
                "issue", "problem", "glitch", "fix",
            ],
            "escalation_requests": [
                "manager", "supervisor", "escalate", "complaint",
                "head office", "ceo", "legal", "lawyer",
            ],
        }

        topic_counts: dict[str, int] = Counter()

        all_text = " ".join([
            conv.content.lower()
            for conv in conversations
            if conv.role == "user"
        ])

        for topic, keywords in TOPIC_KEYWORDS.items():
            for keyword in keywords:
                if keyword in all_text:
                    topic_counts[topic] += all_text.count(keyword)

        return [
            topic
            for topic, _ in topic_counts.most_common()
            if topic_counts[topic] > 0
        ]

    def _extract_language_patterns(
        self,
        conversations: list[ExampleConversation],
    ) -> list[str]:
        """
        Identifies dominant language patterns from user messages.
        Returns a list of pattern descriptions.

        Patterns detected:
        - Message length (very short / short / medium / long)
        - Formality level (formal / informal / mixed)
        - Punctuation style (heavy / minimal / normal)
        - Capitalization (all caps / lowercase / normal)
        - Emoji usage (heavy / occasional / none)
        """
        user_messages = [
            conv.content for conv in conversations
            if conv.role == "user" and conv.content
        ]

        if not user_messages:
            return []

        patterns = []

        avg_length = sum(len(m) for m in user_messages) / len(user_messages)
        if avg_length < 30:
            patterns.append("very_short_messages")
        elif avg_length < 80:
            patterns.append("short_messages")
        elif avg_length < 200:
            patterns.append("medium_length_messages")
        else:
            patterns.append("long_detailed_messages")

        informal_markers = [
            "dont", "cant", "wont", "gonna", "wanna", "gotta",
            "kinda", "sorta", "ya", "ur", "u ", "plz", "pls", "omg",
            "ngl", "tbh", "lol", "lmao",
        ]
        all_text_lower = " ".join(user_messages).lower()
        informal_count = sum(1 for marker in informal_markers if marker in all_text_lower)
        if informal_count > len(user_messages) * 0.3:
            patterns.append("informal_language")
        elif informal_count < len(user_messages) * 0.1:
            patterns.append("formal_language")
        else:
            patterns.append("mixed_formality")

        caps_messages = sum(
            1 for m in user_messages
            if sum(1 for c in m if c.isupper()) > len(m) * 0.4
        )
        if caps_messages > len(user_messages) * 0.2:
            patterns.append("frequent_caps_usage")

        emoji_messages = sum(
            1 for m in user_messages if any(ord(c) > 127 for c in m)
        )
        if emoji_messages > len(user_messages) * 0.3:
            patterns.append("heavy_emoji_usage")
        elif emoji_messages > len(user_messages) * 0.1:
            patterns.append("occasional_emoji_usage")

        punct_heavy = sum(
            1 for m in user_messages if m.count("!") + m.count("?") > 2
        )
        if punct_heavy > len(user_messages) * 0.2:
            patterns.append("heavy_punctuation")

        return patterns

    def _extract_failure_triggers(
        self,
        conversations: list[ExampleConversation],
    ) -> list[str]:
        """
        From HIGH quality conversations with BAD outcomes,
        extracts the user messages that preceded failures.
        These become seeds for adversarial scenario generation.
        """
        failure_triggers = []

        for conv in conversations:
            if conv.outcome and (
                "bad" in conv.outcome.lower()
                or "wrong" in conv.outcome.lower()
                or "fail" in conv.outcome.lower()
                or "incorrect" in conv.outcome.lower()
                or "violation" in conv.outcome.lower()
                or "error" in conv.outcome.lower()
            ):
                if conv.role == "user":
                    failure_triggers.append(conv.content)

        return list(dict.fromkeys(failure_triggers))[:20]

    def _extract_successful_resolutions(
        self,
        conversations: list[ExampleConversation],
    ) -> list[str]:
        """
        From HIGH quality conversations with GOOD outcomes,
        extracts the assistant responses that resolved issues.
        These inform what good behavior looks like for this company.
        """
        resolutions = []

        for conv in conversations:
            if conv.outcome and (
                "good" in conv.outcome.lower()
                or "success" in conv.outcome.lower()
                or "resolved" in conv.outcome.lower()
                or "correct" in conv.outcome.lower()
                or "positive" in conv.outcome.lower()
            ):
                if conv.role == "assistant":
                    resolutions.append(conv.content)

        return list(dict.fromkeys(resolutions))[:20]

    def _analyze_emotional_tone(
        self,
        conversations: list[ExampleConversation],
    ) -> dict:
        """
        Analyzes the emotional tone distribution across user messages.
        Returns a dict with tone categories and their percentages.
        """
        TONE_KEYWORDS = {
            "frustrated": [
                "frustrated", "annoyed", "ridiculous", "unacceptable",
                "terrible", "awful", "worst", "hate", "disgusting",
                "??", "!!!", "why is this",
            ],
            "urgent": [
                "urgent", "asap", "immediately", "right now", "today",
                "emergency", "critical", "must", "need now", "please hurry",
            ],
            "confused": [
                "confused", "don't understand", "not sure", "unclear",
                "what does", "how do", "what is", "help me understand",
                "lost", "unsure",
            ],
            "angry": [
                "angry", "furious", "livid", "outraged", "demand",
                "unacceptable", "lawsuit", "lawyer", "dispute",
                "report you", "manager",
            ],
            "neutral": [],
            "positive": [
                "thank", "appreciate", "great", "wonderful", "amazing",
                "helpful", "love", "perfect", "excellent", "happy",
            ],
        }

        user_messages = [
            conv.content.lower()
            for conv in conversations
            if conv.role == "user" and conv.content
        ]

        if not user_messages:
            return {"neutral": 100}

        tone_counts: dict[str, int] = {tone: 0 for tone in TONE_KEYWORDS}

        for message in user_messages:
            detected = False
            for tone, keywords in TONE_KEYWORDS.items():
                if tone == "neutral":
                    continue
                if any(kw in message for kw in keywords):
                    tone_counts[tone] += 1
                    detected = True
                    break
            if not detected:
                tone_counts["neutral"] += 1

        total = len(user_messages)
        return {
            tone: round((count / total) * 100, 1)
            for tone, count in tone_counts.items()
            if count > 0
        }

    def _calculate_avg_message_length(
        self,
        conversations: list[ExampleConversation],
    ) -> int:
        """
        Calculates average length of user messages in characters.
        """
        user_messages = [
            conv.content for conv in conversations
            if conv.role == "user" and conv.content
        ]

        if not user_messages:
            return 0

        return int(sum(len(m) for m in user_messages) / len(user_messages))

    def _extract_persona_hints(
        self,
        conversations: list[ExampleConversation],
    ) -> list[str]:
        """
        From HIGH quality conversations extracts hints about
        what types of users interact with this system.
        Returns a list of persona description strings that the
        ScenarioGenerator uses to create behavioral personas.

        Example output:
        [
            "formal_elderly_user_confused_by_technology",
            "young_informal_user_urgent_delivery_issues",
            "business_professional_billing_focused"
        ]
        """
        hints = []

        user_messages = [
            conv for conv in conversations
            if conv.role == "user" and conv.content
        ]

        for msg in user_messages:
            content = msg.content.lower()
            hint_parts = []

            if any(w in content for w in [
                "grandson", "granddaughter", "elderly", "senior",
                "years old", "retired",
            ]):
                hint_parts.append("elderly_user")
            elif any(w in content for w in [
                "omg", "ngl", "tbh", "lol", "fr ", "bestie",
            ]):
                hint_parts.append("young_user")

            if any(w in content for w in [
                "i am writing", "formally", "hereby", "pursuant",
                "aforementioned",
            ]):
                hint_parts.append("formal")
            elif any(w in content for w in [
                "gonna", "wanna", "ur", "u ", "plz", "omg",
            ]):
                hint_parts.append("informal")

            if any(w in content for w in [
                "urgent", "emergency", "asap", "right now", "today",
            ]):
                hint_parts.append("urgent")
            elif any(w in content for w in [
                "frustrated", "terrible", "worst", "ridiculous",
            ]):
                hint_parts.append("frustrated")

            if any(w in content for w in [
                "business", "company", "invoice", "bulk", "enterprise",
            ]):
                hint_parts.append("business_user")

            if hint_parts:
                hints.append("_".join(hint_parts))

        counter = Counter(hints)
        return [hint for hint, _ in counter.most_common(10)]
