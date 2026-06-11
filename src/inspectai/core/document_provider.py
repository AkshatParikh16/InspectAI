"""
Document provider for InspectAI RAG testing.

Handles all four document sources:
- Source 1: Company uploads PDFs, Word docs, text files directly
- Source 2A: Web scraping from company's own website
- Source 2B: Web scraping from any external URL
- Source 3: Synthetic challenging document generation
             built on top of real scraped content

Hybrid approach:
1. Scrape/receive real content first
2. Use real content as ground truth foundation
3. Generate synthetic challenging variations from real content
4. Convert all to PDFs
5. Upload to target RAG system
6. Generate grounded Q&A pairs with known correct answers

This makes testing objective — ground truth always exists.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import tempfile
from datetime import UTC, datetime
from pathlib import Path

import httpx
import litellm
import structlog

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from inspectai.config import settings
from inspectai.models.schemas import (
    DifficultyLevel,
    DocumentProviderConfig,
    DocumentSource,
    GroundedScenario,
    RAGDocument,
    RAGKnowledgeBase,
    RAGQuestionType,
    RAGTestingMode,
    Scenario,
    SystemConfig,
    SystemType,
)

logger = structlog.get_logger()

LLM_TIMEOUT = 30
COST_PER_1K_TOKENS = 0.003


class DocumentProvider:
    """
    Provides documents for RAG system testing from all four sources.

    Usage:
        provider = DocumentProvider()
        knowledge_base = await provider.build_knowledge_base(
            config=rag_config.document_provider,
            uploaded_documents=uploaded_docs,
        )
        grounded_scenarios = await provider.generate_grounded_scenarios(
            knowledge_base=knowledge_base,
            count=200,
        )
    """

    def __init__(self, model: str | None = None) -> None:
        self.model = model or settings.default_model
        self._cost = 0.0

    async def build_knowledge_base(
        self,
        config: DocumentProviderConfig,
        uploaded_documents: list[RAGDocument] | None = None,
        system_config: SystemConfig | None = None,
    ) -> RAGKnowledgeBase:
        """
        Builds a complete knowledge base combining all sources:
        - Source 1: Uploaded documents (PDFs, text, raw content)
        - Source 2A: Company website scraping
        - Source 2B: External URL scraping
        - Source 3: Synthetic challenging variations

        Fallback chain when nothing is provided:
        1. Try all configured sources
        2. If zero documents found and synthetic_from_scratch=True
           → Generate realistic documents from domain + topics
        3. If still nothing → return empty knowledge base with warning

        All sources combined into one unified knowledge base.
        Synthetic challenging variations always generated on top
        of whatever real content is available.
        """
        all_documents: list[RAGDocument] = []

        # Source 1 — uploaded documents
        if uploaded_documents:
            logger.info(
                "adding_uploaded_documents",
                count=len(uploaded_documents),
            )
            all_documents.extend(uploaded_documents)

        # Source 2A and 2B — run scraping in parallel
        scraping_tasks = []

        if config.company_website_url and config.scrape_paths:
            scraping_tasks.append(
                self.scrape_company_site(
                    base_url=config.company_website_url,
                    paths=config.scrape_paths,
                    timeout=config.scrape_timeout_seconds,
                    max_length=config.max_content_length_per_page,
                )
            )

        if config.external_urls:
            scraping_tasks.append(
                self.scrape_external_urls(
                    urls=config.external_urls,
                    timeout=config.scrape_timeout_seconds,
                    max_length=config.max_content_length_per_page,
                )
            )

        if scraping_tasks:
            scraped_results = await asyncio.gather(
                *scraping_tasks, return_exceptions=True
            )
            for result in scraped_results:
                if isinstance(result, Exception):
                    logger.error("scraping_failed", error=str(result))
                elif isinstance(result, list):
                    all_documents.extend(result)

        # If still no documents — try synthetic from scratch
        real_docs = [d for d in all_documents if not d.is_synthetic]

        if not real_docs and config.synthetic_from_scratch:
            logger.info(
                "no_real_documents_generating_from_scratch",
                domain=config.domain_for_generation,
                topics=config.topics_to_generate,
            )
            scratch_docs = await self.generate_from_scratch(
                domain=config.domain_for_generation,
                topics=config.topics_to_generate,
                count=min(5, config.max_documents_per_source),
                system_config=system_config,
            )
            all_documents.extend(scratch_docs)
            real_docs = scratch_docs

        if not real_docs:
            logger.warning(
                "no_documents_available",
                hint=(
                    "Provide uploaded_documents, company_website_url, "
                    "external_urls, or set synthetic_from_scratch=True"
                ),
            )

        # Source 3 — synthetic challenging variations
        # Always runs on top of whatever real content we have
        if config.enable_synthetic and real_docs:
            synthetic_docs = await self.generate_challenging_variations(
                real_documents=real_docs[:config.max_documents_per_source],
                challenge_types=config.challenge_types,
                count_per_doc=config.synthetic_count_per_real_doc,
                system_config=system_config,
            )
            all_documents.extend(synthetic_docs)

        knowledge_base = RAGKnowledgeBase(
            documents=all_documents,
            testing_mode=RAGTestingMode.HYBRID,
        )

        logger.info(
            "knowledge_base_built",
            total_documents=len(all_documents),
            real_count=len(knowledge_base.real_documents),
            synthetic_count=len(knowledge_base.synthetic_documents),
            total_content_chars=knowledge_base.total_content_length,
            sources_used=self._summarize_sources(all_documents),
        )

        return knowledge_base

    def _summarize_sources(self, documents: list[RAGDocument]) -> dict:
        """Returns count of documents per source type."""
        from collections import Counter
        return dict(Counter(d.source_type.value for d in documents))

    # ─── Source 2A: Company site scraping ─────────────────────────

    async def scrape_company_site(
        self,
        base_url: str,
        paths: list[str],
        timeout: int = 10,
        max_length: int = 5000,
    ) -> list[RAGDocument]:
        """
        Scrapes multiple pages from a company's website.
        Extracts main text — removes nav, footer, scripts.
        """
        if not BS4_AVAILABLE:
            logger.warning(
                "beautifulsoup4_not_available",
                hint="Run: uv add beautifulsoup4 lxml",
            )
            return []

        documents = []
        base_url = base_url.rstrip("/")

        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers={"User-Agent": "InspectAI/1.0 (RAG Testing Tool)"},
        ) as client:
            tasks = [
                self._scrape_single_page(
                    client=client,
                    url=f"{base_url}{path}",
                    source_type=DocumentSource.SCRAPED_COMPANY_SITE,
                    max_length=max_length,
                )
                for path in paths
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.warning("page_scrape_failed", error=str(result))
            elif result is not None:
                documents.append(result)

        logger.info(
            "company_site_scraped",
            base_url=base_url,
            pages_requested=len(paths),
            pages_scraped=len(documents),
        )

        return documents

    # ─── Source 2B: External URL scraping ─────────────────────────

    async def scrape_external_urls(
        self,
        urls: list[str],
        timeout: int = 10,
        max_length: int = 5000,
    ) -> list[RAGDocument]:
        """
        Scrapes content from any external URLs.
        """
        if not BS4_AVAILABLE:
            logger.warning("beautifulsoup4_not_available")
            return []

        documents = []

        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers={"User-Agent": "InspectAI/1.0 (RAG Testing Tool)"},
        ) as client:
            tasks = [
                self._scrape_single_page(
                    client=client,
                    url=url,
                    source_type=DocumentSource.SCRAPED_EXTERNAL,
                    max_length=max_length,
                )
                for url in urls
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.warning("external_scrape_failed", error=str(result))
            elif result is not None:
                documents.append(result)

        logger.info(
            "external_urls_scraped",
            urls_requested=len(urls),
            pages_scraped=len(documents),
        )

        return documents

    async def _scrape_single_page(
        self,
        client: httpx.AsyncClient,
        url: str,
        source_type: DocumentSource,
        max_length: int,
    ) -> RAGDocument | None:
        """
        Scrapes a single page and extracts clean text.
        Removes navigation, headers, footers, scripts.
        """
        try:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "lxml")

            for tag in soup.find_all([
                "nav", "footer", "header", "script",
                "style", "aside", "iframe", "noscript",
            ]):
                tag.decompose()

            main = (
                soup.find("main")
                or soup.find("article")
                or soup.find(id="content")
                or soup.find(class_="content")
                or soup.find(class_="main-content")
                or soup.body
            )

            if not main:
                return None

            text = main.get_text(separator="\n", strip=True)
            text = re.sub(r"\n{3,}", "\n\n", text)
            text = re.sub(r" {2,}", " ", text)
            text = text.strip()

            if len(text) < 50:
                return None

            if len(text) > max_length:
                text = text[:max_length] + "...[truncated]"

            title = soup.find("title")
            title_text = title.get_text(strip=True) if title else url

            return RAGDocument(
                content=text,
                source=url,
                source_type=source_type,
                section=title_text,
                metadata={
                    "scraped_at": datetime.now(UTC).isoformat(),
                    "content_length": len(text),
                    "url": url,
                },
                is_synthetic=False,
            )

        except httpx.HTTPStatusError as e:
            logger.warning(
                "scrape_http_error",
                url=url,
                status=e.response.status_code,
            )
            return None
        except Exception as e:
            logger.warning("scrape_error", url=url, error=str(e))
            return None

    # ─── Source 3: Synthetic challenging generation ────────────────

    async def generate_challenging_variations(
        self,
        real_documents: list[RAGDocument],
        challenge_types: list[str],
        count_per_doc: int = 2,
        system_config: SystemConfig | None = None,
    ) -> list[RAGDocument]:
        """
        Generates synthetic challenging variations from real documents.
        Each variation is harder than the original in a specific way.
        Ground truth stays traceable to the original document.
        """
        tasks = [
            self._generate_single_variation(
                real_doc=doc,
                challenge_types=challenge_types,
                count=count_per_doc,
            )
            for doc in real_documents
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        synthetic_docs: list[RAGDocument] = []
        for result in results:
            if isinstance(result, Exception):
                logger.warning(
                    "synthetic_generation_failed",
                    error=str(result),
                )
            elif isinstance(result, list):
                synthetic_docs.extend(result)

        logger.info(
            "synthetic_variations_generated",
            count=len(synthetic_docs),
            based_on_docs=len(real_documents),
        )

        return synthetic_docs

    async def generate_from_scratch(
        self,
        domain: str,
        topics: list[str],
        count: int = 5,
        system_config: SystemConfig | None = None,
    ) -> list[RAGDocument]:
        """
        Generates realistic test documents from scratch.
        Used when no real documents, website, or URLs available.

        Creates realistic domain-appropriate documents for each topic.
        InspectAI then generates grounded Q&A from these documents.
        """
        if not topics:
            domain_default_topics: dict[str, list[str]] = {
                "general": [
                    "company policies and procedures",
                    "product documentation",
                    "frequently asked questions",
                    "technical specifications",
                    "user guide",
                ],
                "legal": [
                    "service agreement terms",
                    "privacy policy",
                    "liability clauses",
                    "jurisdiction and governing law",
                    "dispute resolution procedures",
                ],
                "medical": [
                    "patient intake procedures",
                    "medication guidelines",
                    "treatment protocols",
                    "emergency procedures",
                    "insurance and billing",
                ],
                "finance": [
                    "account terms and conditions",
                    "fee schedule",
                    "investment risk disclosures",
                    "transaction policies",
                    "compliance requirements",
                ],
                "retail": [
                    "return and refund policy",
                    "shipping and delivery information",
                    "product warranty terms",
                    "loyalty program details",
                    "payment methods accepted",
                ],
            }
            topics = domain_default_topics.get(
                domain.lower(),
                domain_default_topics["general"],
            )[:count]

        # Get company context from system_config if available
        company_context = ""
        if system_config:
            active = system_config.get_active_config()
            if active:
                company_name = getattr(active, "company_name", "")
                industry = getattr(active, "industry", "")
                description = getattr(active, "chatbot_description", "")
                if company_name:
                    company_context = (
                        f"Company: {company_name}\n"
                        f"Industry: {industry}\n"
                    )
                    if description:
                        company_context += f"Context: {description}\n"

        tasks = [
            self._generate_single_document(
                topic=topic,
                domain=domain,
                company_context=company_context,
            )
            for topic in topics[:count]
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        generated_docs: list[RAGDocument] = []
        for result in results:
            if isinstance(result, Exception):
                logger.warning(
                    "from_scratch_generation_failed",
                    error=str(result),
                )
            elif result is not None:
                generated_docs.append(result)

        logger.info(
            "documents_generated_from_scratch",
            count=len(generated_docs),
            domain=domain,
            topics=topics[:count],
        )

        return generated_docs

    async def _generate_single_document(
        self,
        topic: str,
        domain: str,
        company_context: str = "",
    ) -> RAGDocument | None:
        """
        Generates a single realistic document for a topic.
        """
        prompt = f"""Generate a realistic {domain} document about: {topic}

{company_context}
Requirements:
1. Write like a real {domain} document — professional tone
2. Include specific realistic details — numbers, dates, procedures
3. Structure with clear sections and headings
4. Length: 400-600 words
5. Include edge cases and nuances that would challenge an AI
6. Make it realistic enough that questions about it have clear answers

Do NOT use placeholder text like [Company Name] or [Date].
Use realistic fictional names and specific details.

Return ONLY the document content.
No explanation. No meta-commentary. Just the document."""

        try:
            async with asyncio.timeout(LLM_TIMEOUT):
                response = await litellm.acompletion(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.8,
                    max_tokens=800,
                )

            content = response.choices[0].message.content.strip()

            if hasattr(response, "usage") and response.usage:
                tokens = response.usage.total_tokens or 0
                self._cost += (tokens / 1000) * COST_PER_1K_TOKENS

            return RAGDocument(
                content=content,
                source=f"synthetic_scratch_{topic.replace(' ', '_')[:30]}",
                source_type=DocumentSource.SYNTHETIC_CHALLENGING,
                section=topic,
                metadata={
                    "domain": domain,
                    "topic": topic,
                    "generated_at": datetime.now(UTC).isoformat(),
                    "generation_method": "from_scratch",
                },
                is_synthetic=True,
                challenge_type="from_scratch",
            )

        except Exception as e:
            logger.error(
                "single_document_generation_failed",
                topic=topic,
                error=str(e),
            )
            return None

    async def _generate_single_variation(
        self,
        real_doc: RAGDocument,
        challenge_types: list[str],
        count: int,
    ) -> list[RAGDocument]:
        """
        Generates challenging variations of a single real document.
        """
        challenge_descriptions = {
            "contradictory": (
                "Create a variation that introduces a subtle contradiction "
                "in the policy — e.g. two sections that slightly disagree. "
                "Tests whether the RAG handles conflicting information."
            ),
            "multi_section": (
                "Create a variation that requires combining information "
                "from multiple sections to answer correctly. "
                "Tests whether the RAG can synthesize across sections."
            ),
            "out_of_scope": (
                "Add a section about a completely unrelated topic. "
                "Tests whether the RAG correctly refuses out-of-scope questions "
                "instead of hallucinating answers."
            ),
            "ambiguous": (
                "Rewrite some sections using deliberately vague or ambiguous language. "
                "Tests whether the RAG quotes the document accurately "
                "instead of interpreting loosely."
            ),
            "technical_dense": (
                "Add technical jargon and complex terminology. "
                "Tests whether the RAG handles domain-specific language."
            ),
        }

        selected_challenges = challenge_types[:count]
        generated: list[RAGDocument] = []

        for challenge_type in selected_challenges:
            description = challenge_descriptions.get(
                challenge_type,
                "Create a more challenging version of this document.",
            )

            prompt = f"""You are creating a challenging test document \
for AI system evaluation.

ORIGINAL DOCUMENT CONTENT:
{real_doc.content[:2000]}

CHALLENGE TYPE: {challenge_type}
TASK: {description}

Create a modified version of this document that:
1. Keeps the core real information intact
2. Adds the specific challenge described above
3. Remains realistic — looks like a real document
4. Is approximately the same length as the original

Return ONLY the document content. No explanation. No markdown headers.
Just the document text as it would appear in a real file."""

            try:
                async with asyncio.timeout(LLM_TIMEOUT):
                    response = await litellm.acompletion(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7,
                        max_tokens=1500,
                    )

                synthetic_content = response.choices[0].message.content.strip()

                if hasattr(response, "usage") and response.usage:
                    tokens = response.usage.total_tokens or 0
                    self._cost += (tokens / 1000) * COST_PER_1K_TOKENS

                generated.append(
                    RAGDocument(
                        content=synthetic_content,
                        source=f"synthetic_{challenge_type}_{real_doc.id[:8]}",
                        source_type=DocumentSource.SYNTHETIC_CHALLENGING,
                        section=f"{real_doc.section} [{challenge_type}]",
                        metadata={
                            "challenge_type": challenge_type,
                            "based_on": real_doc.source,
                            "generated_at": datetime.now(UTC).isoformat(),
                        },
                        is_synthetic=True,
                        generated_from_source=real_doc.source,
                        challenge_type=challenge_type,
                    )
                )

            except Exception as e:
                logger.warning(
                    "variation_generation_failed",
                    challenge_type=challenge_type,
                    error=str(e),
                )

        return generated

    # ─── PDF creation ─────────────────────────────────────────────

    async def create_pdfs(
        self,
        documents: list[RAGDocument],
        output_dir: str | None = None,
    ) -> list[str]:
        """
        Converts RAGDocument objects to PDF files using reportlab.
        Returns list of PDF file paths.
        """
        if not REPORTLAB_AVAILABLE:
            logger.warning(
                "reportlab_not_available",
                hint="Run: uv add reportlab",
            )
            return []

        if output_dir is None:
            output_dir = tempfile.mkdtemp(prefix="inspectai_docs_")

        Path(output_dir).mkdir(parents=True, exist_ok=True)

        loop = asyncio.get_event_loop()
        pdf_paths = []

        for doc in documents:
            pdf_path = await loop.run_in_executor(
                None,
                self._create_single_pdf,
                doc,
                output_dir,
            )
            if pdf_path:
                pdf_paths.append(pdf_path)

        logger.info(
            "pdfs_created",
            count=len(pdf_paths),
            output_dir=output_dir,
        )

        return pdf_paths

    def _create_single_pdf(
        self,
        doc: RAGDocument,
        output_dir: str,
    ) -> str | None:
        """
        Creates a single PDF from a RAGDocument.
        Runs synchronously — called via run_in_executor.
        """
        try:
            filename = f"inspectai_{doc.id[:8]}.pdf"
            filepath = os.path.join(output_dir, filename)

            pdf_doc = SimpleDocTemplate(
                filepath,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72,
            )

            styles = getSampleStyleSheet()
            story = []

            if doc.section:
                story.append(Paragraph(doc.section, styles["Heading1"]))
                story.append(Spacer(1, 12))

            if doc.source:
                story.append(
                    Paragraph(f"Source: {doc.source}", styles["Italic"])
                )
                story.append(Spacer(1, 12))

            for para_text in doc.content.split("\n\n"):
                para_text = para_text.strip()
                if not para_text:
                    continue
                try:
                    story.append(Paragraph(para_text, styles["Normal"]))
                    story.append(Spacer(1, 6))
                except Exception:
                    continue

            pdf_doc.build(story)
            return filepath

        except Exception as e:
            logger.error("pdf_creation_failed", doc_id=doc.id, error=str(e))
            return None

    # ─── Upload to RAG system ─────────────────────────────────────

    async def upload_to_rag(
        self,
        pdf_paths: list[str],
        upload_endpoint: str,
        upload_field: str = "file",
        headers: dict | None = None,
    ) -> list[str]:
        """
        Uploads PDF files to the target RAG system.
        Returns list of document IDs returned by the RAG system.
        """
        uploaded_ids: list[str] = []

        async with httpx.AsyncClient(
            timeout=60,
            headers=headers or {},
        ) as client:
            for pdf_path in pdf_paths:
                try:
                    with open(pdf_path, "rb") as f:
                        files = {
                            upload_field: (
                                os.path.basename(pdf_path),
                                f,
                                "application/pdf",
                            )
                        }
                        response = await client.post(
                            upload_endpoint, files=files
                        )
                        response.raise_for_status()

                    data = response.json()
                    doc_id = (
                        data.get("id")
                        or data.get("document_id")
                        or data.get("file_id")
                        or pdf_path
                    )
                    uploaded_ids.append(str(doc_id))

                    logger.info(
                        "document_uploaded",
                        pdf=os.path.basename(pdf_path),
                        doc_id=doc_id,
                    )

                except Exception as e:
                    logger.error(
                        "upload_failed",
                        pdf=pdf_path,
                        error=str(e),
                    )

        logger.info(
            "upload_complete",
            total=len(pdf_paths),
            successful=len(uploaded_ids),
        )

        return uploaded_ids

    # ─── Grounded scenario generation ────────────────────────────

    async def generate_grounded_scenarios(
        self,
        knowledge_base: RAGKnowledgeBase,
        count: int = 200,
        system_config: SystemConfig | None = None,
    ) -> list[GroundedScenario]:
        """
        Generates grounded Q&A scenarios from knowledge base documents.
        Each scenario has a known correct answer from the source document.
        Evaluation is objective — no LLM guessing needed.
        """
        scenarios_per_doc = max(1, count // max(1, len(knowledge_base.documents)))

        tasks = [
            self._generate_from_document(
                doc=doc,
                count=scenarios_per_doc,
                system_config=system_config,
            )
            for doc in knowledge_base.documents
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        grounded_scenarios: list[GroundedScenario] = []
        for result in results:
            if isinstance(result, Exception):
                logger.warning(
                    "grounded_scenario_generation_failed",
                    error=str(result),
                )
            elif isinstance(result, list):
                grounded_scenarios.extend(result)

        grounded_scenarios = grounded_scenarios[:count]

        logger.info(
            "grounded_scenarios_generated",
            count=len(grounded_scenarios),
            from_real=sum(
                1 for gs in grounded_scenarios if not gs.is_from_synthetic_doc
            ),
            from_synthetic=sum(
                1 for gs in grounded_scenarios if gs.is_from_synthetic_doc
            ),
        )

        return grounded_scenarios

    async def _generate_from_document(
        self,
        doc: RAGDocument,
        count: int,
        system_config: SystemConfig | None = None,
    ) -> list[GroundedScenario]:
        """
        Generates grounded Q&A pairs from a single document.
        Distributes across all six RAGQuestionTypes.
        """
        prompt = f"""You are generating test questions from a document
for evaluating a RAG AI system.

DOCUMENT CONTENT:
{doc.content[:3000]}

Generate exactly {count} question-answer pairs.
Distribute across these question types:
- SIMPLE: direct factual question from document
- COMPLEX: paraphrased or indirect question
- DISTRACTING: question with misleading context
- SITUATIONAL: question where user context matters
- DOUBLE: two questions combined in one
- CONVERSATIONAL: requires previous context to answer

CRITICAL RULES:
1. Every answer MUST come directly from the document
2. Do not invent information not in the document
3. For DISTRACTING — include misleading info in the question
4. For questions where answer is NOT in document —
   correct_answer should be "This information is not in the document"

Return ONLY valid JSON array:
[
  {{
    "question": "the test question",
    "correct_answer": "exact answer from document",
    "source_chunk": "the exact sentence from document containing answer",
    "question_type": "SIMPLE|COMPLEX|DISTRACTING|SITUATIONAL|DOUBLE|CONVERSATIONAL",
    "difficulty": "EASY|MEDIUM|HARD|ADVERSARIAL"
  }}
]

Return ONLY the JSON array. No explanation. No markdown."""

        try:
            async with asyncio.timeout(LLM_TIMEOUT):
                response = await litellm.acompletion(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=2000,
                )

            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            items = json.loads(raw)

            if hasattr(response, "usage") and response.usage:
                tokens = response.usage.total_tokens or 0
                self._cost += (tokens / 1000) * COST_PER_1K_TOKENS

            grounded: list[GroundedScenario] = []
            for item in items:
                try:
                    scenario = Scenario(
                        system_type=SystemType.RAG,
                        input=item["question"],
                        expected_behavior=(
                            f"Answer correctly based on document. "
                            f"Correct answer: {item['correct_answer']}"
                        ),
                        difficulty=DifficultyLevel(
                            item.get("difficulty", "MEDIUM")
                        ),
                        tags=[
                            "rag",
                            item.get("question_type", "simple").lower(),
                            "grounded",
                        ],
                    )

                    grounded.append(
                        GroundedScenario(
                            scenario=scenario,
                            correct_answer=item["correct_answer"],
                            source_chunk=item.get("source_chunk", ""),
                            source_document_id=doc.id,
                            source_url=doc.source,
                            question_type=RAGQuestionType(
                                item.get("question_type", "SIMPLE")
                            ),
                            is_from_synthetic_doc=doc.is_synthetic,
                        )
                    )

                except Exception as e:
                    logger.warning(
                        "grounded_scenario_parse_error",
                        error=str(e),
                    )
                    continue

            return grounded

        except Exception as e:
            logger.error(
                "document_scenario_generation_failed",
                doc_id=doc.id,
                error=str(e),
            )
            return []

    def get_cost(self) -> float:
        """Returns total LLM cost for this provider session."""
        return round(self._cost, 4)
