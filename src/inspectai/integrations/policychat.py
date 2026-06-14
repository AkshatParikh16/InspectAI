"""
PolicyChat integration for InspectAI.

PolicyChat is a RAG-based insurance policy analysis system.
Users upload PDF documents and ask questions about them.

InspectAI tests PolicyChat by:
1. Checking PolicyChat and Ollama are running
2. Generating a realistic synthetic insurance policy PDF
3. Uploading it to PolicyChat via POST /ingest
4. Building a SystemConfig using the actual PDF content
   as the knowledge base — ground truth exists for every question
5. Generating grounded test scenarios from the PDF
6. Firing scenarios at POST /query with the doc_id
7. Evaluating answers against known correct answers
8. Running failure analysis and generating fix recommendations
9. Returning full results

PolicyChat runs at: http://localhost:8001
InspectAI runs at:  http://localhost:8000

Startup order:
  1. ollama serve
  2. uvicorn app.main:app --port 8001  (PolicyChat)
  3. uvicorn inspectai.main:app --port 8000  (InspectAI)
  4. POST http://localhost:8000/integrations/policychat/test
"""

from __future__ import annotations

import asyncio
import io
from datetime import UTC, datetime

import httpx
import litellm
import structlog

from inspectai.config import settings
from inspectai.models.schemas import (
    DeploymentStatus,
    DocumentProviderConfig,
    DocumentSource,
    RAGConfig,
    RAGDocument,
    RAGKnowledgeBase,
    RetrievalConfig,
    SystemConfig,
    SystemMaturity,
    SystemType,
    TargetAPIConfig,
    TestRunConfig,
)

logger = structlog.get_logger()

POLICYCHAT_BASE_URL = "http://localhost:8001"
INSPECTAI_BASE_URL = "http://localhost:8000"
LLM_TIMEOUT = 30

# ─── Hardcoded test policy ────────────────────────────────────────
# Used as fallback when LLM generation fails
# Also used to generate grounded Q&A pairs

FALLBACK_POLICY_TEXT = """COMPREHENSIVE HEALTH INSURANCE POLICY

Policy Number: INS-2025-TEST-001
Policy Type: Comprehensive Health Insurance
Coverage Period: January 1, 2025 to December 31, 2025
Monthly Premium: $450.00

SECTION 1 — COVERAGE DETAILS

Hospitalization: Covered up to $500,000 per calendar year.
Outpatient Visits: $50 copay per visit. Maximum 20 visits per year.
Emergency Room: $250 copay. Copay waived if patient is admitted.
Prescription Drugs: Tier 1 costs $10. Tier 2 costs $35. Tier 3 costs $70.
Mental Health: 30 sessions per year covered. $40 copay per session.
Preventive Care: 100% covered with no copay when using in-network providers.

SECTION 2 — EXCLUSIONS

Pre-existing conditions are not covered for the first 12 months of the policy.
Cosmetic surgery is excluded unless deemed medically necessary by a physician.
Experimental treatments and clinical trials are not covered.
Dental care requires a separate dental policy.
Vision care requires a separate vision policy.
Weight loss surgery is excluded unless BMI exceeds 40.

SECTION 3 — CLAIMS PROCESS

All claims must be submitted within 90 days of the date of service.
Online submission portal: claims.insuranceco.com
Phone claims line: 1-800-INSURE-1 available Monday to Friday 8am to 6pm EST.
Claims processing time is 15 to 30 business days after receipt.
Incomplete claims will be returned and must be resubmitted within 30 days.
Appeal window: 60 days from the date of claim denial notification.

SECTION 4 — DEDUCTIBLES AND OUT-OF-POCKET COSTS

Annual deductible: $1,500 for individual coverage.
Annual deductible: $3,000 for family coverage.
Out-of-pocket maximum: $6,000 for individual coverage per year.
Out-of-pocket maximum: $12,000 for family coverage per year.
Deductible resets every January 1st regardless of enrollment date.
Copays do not count toward the deductible.
Copays do count toward the out-of-pocket maximum.

SECTION 5 — NETWORK INFORMATION

In-network providers must be used except in genuine emergencies.
Provider directory available at: network.insuranceco.com
Out-of-network services are covered at 40% coinsurance after deductible is met.
Prior authorization is required for all specialist visits.
Prior authorization is required for MRI, CT scans, and surgical procedures.
Emergency care is covered at in-network rates regardless of provider network status.

SECTION 6 — CONTACT INFORMATION

Customer service: 1-800-INSURE-1
Claims portal: claims.insuranceco.com
Provider directory: network.insuranceco.com
Mailing address: InsuranceCo, 123 Coverage Lane, Hartford CT 06101"""


class PolicyChatIntegration:
    """
    Integrates InspectAI with PolicyChat for automated RAG testing.

    Usage:
        integration = PolicyChatIntegration()

        # Full automated test
        result = await integration.run_full_test(scenario_count=50)

        # Quick health check
        health = await integration.check_health()

        # Test single query manually
        answer = await integration.test_single_query(
            query="What is the deductible?",
            doc_id="my_doc_id"
        )
    """

    def __init__(self) -> None:
        self.model = settings.default_model
        self._doc_id: str | None = None

    # ─── Public: health check ─────────────────────────────────────

    async def check_health(self) -> dict:
        """
        Checks if PolicyChat and Ollama are running.
        Returns status dict with next steps.
        """
        policychat_running = await self._check_policychat_running()
        ollama_running = False

        if policychat_running:
            ollama_running = await self._check_ollama_running()

        ready = policychat_running and ollama_running

        return {
            "policychat_running": policychat_running,
            "ollama_running": ollama_running,
            "ready_to_test": ready,
            "policychat_url": POLICYCHAT_BASE_URL,
            "issues": self._get_health_issues(
                policychat_running, ollama_running
            ),
            "next_step": (
                "POST /integrations/policychat/test"
                if ready
                else self._get_startup_hint(
                    policychat_running, ollama_running
                )
            ),
        }

    # ─── Public: full test run ────────────────────────────────────

    async def run_full_test(
        self,
        scenario_count: int = 50,
        dry_run: bool = False,
        budget_limit_usd: float = 5.0,
    ) -> dict:
        """
        Runs a complete InspectAI test against PolicyChat.

        Returns dict with:
        - success: bool
        - doc_id: which document was tested
        - pass_rate: percentage of scenarios that passed
        - failure_patterns: list of failure clusters found
        - fix_recommendations: actionable fixes
        - error: if something went wrong
        """
        logger.info(
            "policychat_test_started",
            scenario_count=scenario_count,
            dry_run=dry_run,
            budget_limit=budget_limit_usd,
        )

        # Step 1 — Check health
        health = await self.check_health()
        if not health["ready_to_test"] and not dry_run:
            return {
                "success": False,
                "error": health["issues"],
                "next_step": health["next_step"],
            }

        # Step 2 — Generate PDF
        logger.info("generating_insurance_policy_pdf")
        pdf_bytes, policy_text = await self._generate_policy_pdf()
        logger.info(
            "pdf_generated",
            pdf_size_bytes=len(pdf_bytes),
            text_length=len(policy_text),
        )

        # Step 3 — Upload to PolicyChat
        doc_id = None
        if not dry_run:
            logger.info("uploading_pdf_to_policychat")
            doc_id = await self._upload_pdf(pdf_bytes)
            if not doc_id:
                return {
                    "success": False,
                    "error": (
                        "Failed to upload test PDF to PolicyChat. "
                        "Check PolicyChat logs for details."
                    ),
                }
            self._doc_id = doc_id
            logger.info("pdf_uploaded_successfully", doc_id=doc_id)
        else:
            doc_id = "dry_run_doc_id"
            logger.info("dry_run_skipping_upload")

        # Step 4 — Build config using actual PDF content
        config = self._build_config(
            policy_text=policy_text,
            doc_id=doc_id,
        )

        run_config = TestRunConfig(
            target_url=f"{POLICYCHAT_BASE_URL}/query",
            target_api_config=TargetAPIConfig(
                url=f"{POLICYCHAT_BASE_URL}/query",
                message_field="query",
                response_field="answer",
                extra_fields={"doc_id": doc_id},
                timeout_seconds=90,
                # PolicyChat uses Ollama locally — can be slow
            ),
            max_scenarios=scenario_count,
            dry_run=dry_run,
            budget_limit_usd=budget_limit_usd,
            deployment_status=DeploymentStatus.POST_DEPLOYMENT,
        )

        # Step 5 — Run full InspectAI pipeline
        logger.info("running_inspectai_pipeline")
        pipeline_result = await self._run_pipeline(
            config=config,
            run_config=run_config,
            policy_text=policy_text,
        )

        return {
            "success": True,
            "doc_id": doc_id,
            "dry_run": dry_run,
            "scenario_count": scenario_count,
            **pipeline_result,
        }

    # ─── Public: single query test ────────────────────────────────

    async def test_single_query(
        self,
        query: str,
        doc_id: str | None = None,
    ) -> dict:
        """
        Tests a single query against PolicyChat.
        Quick way to verify specific behavior during development.
        """
        effective_doc_id = doc_id or self._doc_id

        if not effective_doc_id:
            return {
                "error": (
                    "No doc_id provided and no previous upload found. "
                    "Run run_full_test() first or provide a doc_id."
                )
            }

        try:
            async with httpx.AsyncClient(timeout=90) as client:
                response = await client.post(
                    f"{POLICYCHAT_BASE_URL}/query",
                    json={
                        "query": query,
                        "doc_id": effective_doc_id,
                    },
                )
                response.raise_for_status()
                data = response.json()

                return {
                    "query": query,
                    "doc_id": effective_doc_id,
                    "answer": data.get("answer", ""),
                    "raw_response": data,
                }

        except Exception as e:
            logger.error("single_query_failed", error=str(e))
            return {"error": str(e), "query": query}

    # ─── Private: health checks ───────────────────────────────────

    async def _check_policychat_running(self) -> bool:
        """Checks if PolicyChat server is reachable."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(
                    f"{POLICYCHAT_BASE_URL}/health"
                )
                return response.status_code == 200
        except Exception:
            return False

    async def _check_ollama_running(self) -> bool:
        """Checks if Ollama is running inside PolicyChat."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(
                    f"{POLICYCHAT_BASE_URL}/health"
                )
                data = response.json()
                return data.get("ollama") == "running"
        except Exception:
            return False

    def _get_health_issues(
        self,
        policychat_running: bool,
        ollama_running: bool,
    ) -> list[str]:
        """Returns list of issues found during health check."""
        issues = []
        if not policychat_running:
            issues.append(
                "PolicyChat not running at http://localhost:8001"
            )
        if policychat_running and not ollama_running:
            issues.append(
                "Ollama not running — PolicyChat needs: ollama serve"
            )
        return issues

    def _get_startup_hint(
        self,
        policychat_running: bool,
        ollama_running: bool,
    ) -> str:
        """Returns the most helpful next step hint."""
        if not policychat_running:
            return (
                "Start PolicyChat: "
                "cd /path/to/PolicyChat && "
                "uv run uvicorn app.main:app --port 8001"
            )
        if not ollama_running:
            return "Start Ollama: ollama serve"
        return "POST /integrations/policychat/test"

    # ─── Private: PDF generation ──────────────────────────────────

    async def _generate_policy_pdf(
        self,
    ) -> tuple[bytes, str]:
        """
        Generates a realistic insurance policy PDF.
        First tries LLM generation for variety.
        Falls back to hardcoded policy on failure.
        Returns (pdf_bytes, policy_text).
        """
        # Try LLM generation first for variety
        try:
            policy_text = await self._generate_policy_text_via_llm()
        except Exception as e:
            logger.warning(
                "llm_policy_generation_failed",
                error=str(e),
                fallback="using hardcoded policy",
            )
            policy_text = FALLBACK_POLICY_TEXT

        # Convert to PDF
        pdf_bytes = self._text_to_pdf(policy_text)

        # If PDF creation failed use fallback text as bytes
        if len(pdf_bytes) < 100:
            logger.warning(
                "pdf_creation_failed",
                hint="Install reportlab: uv add reportlab",
            )
            # Return text as bytes — PolicyChat accepts txt too
            pdf_bytes = policy_text.encode("utf-8")

        return pdf_bytes, policy_text

    async def _generate_policy_text_via_llm(self) -> str:
        """
        Uses Claude to generate a unique insurance policy document.
        This gives variety across test runs.
        """
        prompt = """Generate a realistic comprehensive health insurance \
policy document with these exact sections and specific numbers:

POLICY OVERVIEW
- Policy number, type, coverage period, monthly premium

COVERAGE DETAILS
- Hospitalization limit, outpatient copay and visit limit
- Emergency room copay, prescription drug tiers with costs
- Mental health sessions and copay

EXCLUSIONS
- Pre-existing conditions waiting period
- Specific excluded procedures and services

CLAIMS PROCESS
- Submission deadline (days from service)
- Contact methods with specific phone/website
- Processing time and appeal window

DEDUCTIBLES AND OUT-OF-POCKET
- Individual and family deductible amounts
- Individual and family out-of-pocket maximums
- When deductible resets

NETWORK INFORMATION
- In-network vs out-of-network coverage percentages
- Prior authorization requirements
- How to find providers

Use specific numbers throughout — not ranges.
Formal insurance document tone.
500-600 words total.
Return ONLY the document text."""

        async with asyncio.timeout(LLM_TIMEOUT):
            response = await litellm.acompletion(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=800,
            )

        return response.choices[0].message.content.strip()

    def _text_to_pdf(self, text: str) -> bytes:
        """Converts policy text to PDF bytes using reportlab."""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import (
                Paragraph,
                SimpleDocTemplate,
                Spacer,
            )

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72,
            )
            styles = getSampleStyleSheet()
            story = []

            for line in text.split("\n"):
                line = line.strip()
                if not line:
                    story.append(Spacer(1, 6))
                    continue
                try:
                    # Section headers in caps or ending with colon
                    if (
                        line.isupper()
                        or line.startswith("SECTION")
                        or (line.endswith(":") and len(line) < 50)
                    ):
                        story.append(
                            Paragraph(line, styles["Heading2"])
                        )
                    else:
                        story.append(
                            Paragraph(line, styles["Normal"])
                        )
                    story.append(Spacer(1, 3))
                except Exception:
                    continue

            doc.build(story)
            return buffer.getvalue()

        except ImportError:
            logger.warning(
                "reportlab_not_installed",
                hint="uv add reportlab",
            )
            return b""
        except Exception as e:
            logger.error("pdf_build_failed", error=str(e))
            return b""

    # ─── Private: PDF upload ──────────────────────────────────────

    async def _upload_pdf(self, pdf_bytes: bytes) -> str | None:
        """
        Uploads the test PDF to PolicyChat via POST /ingest.
        Returns doc_id from the response or None on failure.
        """
        try:
            # Use .txt if pdf_bytes is actually text
            if pdf_bytes.startswith(b"%PDF"):
                filename = "inspectai_test_policy.pdf"
                content_type = "application/pdf"
            else:
                filename = "inspectai_test_policy.txt"
                content_type = "text/plain"

            async with httpx.AsyncClient(timeout=60) as client:
                files = {
                    "file": (filename, pdf_bytes, content_type)
                }
                response = await client.post(
                    f"{POLICYCHAT_BASE_URL}/ingest",
                    files=files,
                )
                response.raise_for_status()
                data = response.json()

                logger.info(
                    "upload_response",
                    response_keys=list(data.keys()),
                    response_preview=str(data)[:200],
                )

                # Try common doc_id field names PolicyChat might return
                doc_id = (
                    data.get("doc_id")
                    or data.get("document_id")
                    or data.get("id")
                    or data.get("filename")
                    or filename
                )

                return str(doc_id)

        except httpx.HTTPStatusError as e:
            logger.error(
                "upload_http_error",
                status=e.response.status_code,
                response=e.response.text[:300],
            )
            return None
        except Exception as e:
            logger.error("upload_failed", error=str(e))
            return None

    # ─── Private: build InspectAI config ─────────────────────────

    def _build_config(
        self,
        policy_text: str,
        doc_id: str,
    ) -> SystemConfig:
        """
        Builds SystemConfig for PolicyChat.
        Uses the actual uploaded PDF content as knowledge base.
        This means InspectAI knows the correct answer to every question
        it generates — evaluation is objective, no LLM guessing.
        """
        knowledge_doc = RAGDocument(
            content=policy_text,
            source="inspectai_test_policy.pdf",
            source_type=DocumentSource.UPLOADED,
            section="Insurance Policy Test Document",
            is_synthetic=False,
            metadata={
                "doc_id": doc_id,
                "uploaded_at": datetime.now(UTC).isoformat(),
                "integration": "policychat",
            },
        )

        return SystemConfig(
            system_type=SystemType.RAG,
            rag=RAGConfig(
                company_name="PolicyChat",
                domain="insurance",
                hallucination_tolerance=0.0,
                citation_required=False,
                out_of_scope_behavior="refuse",
                deployment_status=DeploymentStatus.POST_DEPLOYMENT,
                maturity=SystemMaturity.RUNNING,
                chatbot_description=(
                    "PolicyChat is an insurance policy analysis RAG system. "
                    "Users upload insurance policy PDF documents and ask "
                    "questions about coverage details, exclusions, claims "
                    "processes, deductibles, and network information. "
                    "The system should only answer from the uploaded document "
                    "content. It should clearly state when information is not "
                    "available in the document rather than guessing."
                ),
                use_case_categories=[
                    "coverage_questions",
                    "exclusion_questions",
                    "claims_process_questions",
                    "deductible_and_cost_questions",
                    "network_questions",
                    "out_of_scope_questions",
                ],
                retrieval=RetrievalConfig(
                    retrieval_strategy="hybrid",
                    top_k=5,
                    confidence_threshold=0.6,
                    reranking_enabled=False,
                ),
                knowledge_base=RAGKnowledgeBase(
                    documents=[knowledge_doc],
                ),
                document_provider=DocumentProviderConfig(
                    enable_synthetic=True,
                    challenge_types=[
                        "out_of_scope",
                        "multi_section",
                        "ambiguous",
                    ],
                    synthetic_count_per_real_doc=2,
                ),
            ),
        )

    # ─── Private: run pipeline ────────────────────────────────────

    async def _run_pipeline(
        self,
        config: SystemConfig,
        run_config: TestRunConfig,
        policy_text: str,
    ) -> dict:
        """
        Runs the complete InspectAI pipeline:
        Generate → Test → Analyze → Fix

        Returns summary dict with key results.
        """
        from inspectai.analyzers.failure_analyzer import FailureAnalyzer
        from inspectai.fixers.fix_recommender import FixRecommender
        from inspectai.generators.scenario_generator import (
            ScenarioGenerator,
        )
        from inspectai.runners.test_runner import TestRunner

        # Generate scenarios
        logger.info("generating_scenarios")
        generator = ScenarioGenerator()
        scenarios = await generator.generate(
            config=config,
            run_config=run_config,
        )
        logger.info(
            "scenarios_generated",
            count=len(scenarios),
        )

        if not scenarios:
            return {
                "error": "No scenarios generated",
                "pass_rate": None,
                "failure_patterns": [],
                "fixes": [],
            }

        # Run tests
        logger.info(
            "running_tests",
            scenario_count=len(scenarios),
            target=POLICYCHAT_BASE_URL,
            dry_run=run_config.dry_run,
        )
        runner = TestRunner()
        results = await runner.run(
            scenarios=scenarios,
            config=config,
            run_config=run_config,
        )
        logger.info(
            "tests_complete",
            total=len(results),
            passed=sum(1 for r in results if r.passed),
            failed=sum(1 for r in results if not r.passed),
        )

        # Analyze failures
        logger.info("analyzing_failures")
        analyzer = FailureAnalyzer()
        analysis = await analyzer.analyze(
            results=results,
            scenarios=scenarios,
            config=config,
            run_config=run_config,
        )
        logger.info(
            "analysis_complete",
            pass_rate=analysis.test_run.pass_rate,
            patterns=len(analysis.failure_patterns),
        )

        # Generate fix recommendations
        logger.info("generating_fix_recommendations")
        recommender = FixRecommender()
        report = await recommender.recommend(
            analysis=analysis,
            config=config,
        )
        logger.info(
            "fixes_generated",
            total_fixes=report.total_fixes,
            high_priority=report.high_priority_count,
        )

        # Build clean summary
        return {
            "pass_rate": analysis.test_run.pass_rate,
            "pass_rate_percent": round(
                analysis.test_run.pass_rate * 100, 1
            ),
            "total_scenarios": len(results),
            "passed": sum(1 for r in results if r.passed),
            "failed": sum(1 for r in results if not r.passed),
            "failure_breakdown": analysis.test_run.failure_breakdown,
            "failure_patterns": [
                {
                    "cluster_label": p.cluster_label,
                    "failure_type": p.failure_type.value,
                    "scenario_count": p.scenario_count,
                    "root_cause": p.root_cause,
                    "immediate_fix": p.immediate_fix,
                    "suggested_priority": p.suggested_priority.value,
                }
                for p in analysis.failure_patterns
            ],
            "insight_summary": analysis.insight_summary,
            "total_fixes": report.total_fixes,
            "high_priority_fixes": report.high_priority_count,
            "fixes": [
                {
                    "title": f.title,
                    "fix_type": f.fix_type.value,
                    "problem": f.problem,
                    "suggested_fix": f.suggested_fix,
                    "priority": f.suggested_priority.value,
                    "estimated_impact": f.estimated_impact,
                }
                for f in report.fixes[:10]
            ],
            "estimated_improvement": report.estimated_improvement,
            "analysis_cost_usd": round(
                analysis.analysis_cost_usd
                + report.generation_cost_usd,
                4,
            ),
        }
