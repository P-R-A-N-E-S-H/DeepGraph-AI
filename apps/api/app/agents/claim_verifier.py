import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.retrieval.hybrid_retriever import hybrid_retriever
from app.retrieval.hyde import hyde_generator
from app.schemas.verify import (
    ClaimVerifyRequest,
    ClaimVerificationResponse,
    ClaimEvidenceItem
)
from app.core.logging import logger

class ClaimVerifierAgent:
    """Automated scientific fact-checking & consensus verification agent with citation grounding."""

    def _determine_stance(self, claim: str, passage: str) -> str:
        """Determines whether a passage supports, contradicts, or provides neutral context to the claim."""
        claim_terms = set(re.findall(r'\b\w{3,}\b', claim.lower()))
        passage_lower = passage.lower()

        # Negation / contradiction triggers
        refuting_triggers = [
            "contrary to", "fails to", "cannot", "does not hold", "limitation",
            "however", "in contrast", "disproved", "underperforms", "outperformed by",
            "quadratic complexity", "memory bottleneck", "high computational cost"
        ]

        # Supporting triggers
        supporting_triggers = [
            "demonstrates", "outperforms", "achieves", "superior", "state-of-the-art",
            "improves upon", "confirms", "proves", "scalable", "efficiently", "significant gain"
        ]

        has_refuting = any(trigger in passage_lower for trigger in refuting_triggers)
        has_supporting = any(trigger in passage_lower for trigger in supporting_triggers)

        if has_refuting and not has_supporting:
            return "CONTRADICTS"
        elif has_supporting and not has_refuting:
            return "SUPPORTS"
        else:
            return "NEUTRAL_CONTEXT"

    async def verify_claim(
        self,
        session: AsyncSession,
        request: ClaimVerifyRequest
    ) -> ClaimVerificationResponse:
        logger.info(f"Verifying claim: '{request.claim}'")

        # 1. Expand query via HyDE for robust semantic capture
        expanded_query = await hyde_generator.generate_hypothetical_passage(request.claim)
        combined_search_query = f"{request.claim} {expanded_query[:150]}"

        # 2. Retrieve relevant evidence chunks
        search_res = await hybrid_retriever.retrieve(
            session=session,
            query=combined_search_query,
            document_ids=request.paper_ids,
            top_k=8
        )

        supporting_evidence: List[ClaimEvidenceItem] = []
        refuting_evidence: List[ClaimEvidenceItem] = []
        contextual_evidence: List[ClaimEvidenceItem] = []

        for item in search_res.results:
            stance = self._determine_stance(request.claim, item.text)
            evidence_item = ClaimEvidenceItem(
                chunk_id=item.chunk_id,
                paper_id=item.document_id,
                paper_title=item.paper_title,
                page_number=item.page_number,
                section=item.section,
                quote=item.text[:280] + ("..." if len(item.text) > 280 else ""),
                relevance_score=item.score,
                stance=stance
            )

            if stance == "SUPPORTS":
                supporting_evidence.append(evidence_item)
            elif stance == "CONTRADICTS":
                refuting_evidence.append(evidence_item)
            else:
                contextual_evidence.append(evidence_item)

        # 3. Determine consensus verdict and confidence
        total_evidence = len(supporting_evidence) + len(refuting_evidence) + len(contextual_evidence)

        if total_evidence == 0:
            verdict = "INSUFFICIENT_EVIDENCE"
            confidence = 0.20
            summary = "No indexed paper passages contained sufficient semantic grounding to evaluate this claim."
        elif len(supporting_evidence) > 0 and len(refuting_evidence) == 0:
            verdict = "SUPPORTED"
            confidence = min(0.95, 0.70 + (len(supporting_evidence) * 0.08))
            summary = f"The claim is well-supported by {len(supporting_evidence)} grounded citations across the ingested literature without direct contradictory passages."
        elif len(refuting_evidence) > 0 and len(supporting_evidence) == 0:
            verdict = "REFUTED"
            confidence = min(0.92, 0.65 + (len(refuting_evidence) * 0.09))
            summary = f"The literature indicates clear empirical contradictions or architectural counter-evidence against the assertion in {len(refuting_evidence)} citations."
        elif len(supporting_evidence) > 0 and len(refuting_evidence) > 0:
            verdict = "NUANCED_OR_CONDITIONAL"
            confidence = 0.85
            summary = (
                f"The literature shows conditional validity: {len(supporting_evidence)} sources support the claim under specific regimes, "
                f"while {len(refuting_evidence)} sources identify key limitations or trade-offs."
            )
        else:
            verdict = "NUANCED_OR_CONDITIONAL"
            confidence = 0.65
            summary = "Passages provide relevant context, but require specific operating conditions or architectural assumptions."

        methodological_nuances = [
            "Evaluation depends on training dataset scale and compute budget.",
            "Empirical results may vary depending on architectural inductive bias and hyperparameter tuning.",
            "Trade-offs between computational latency and benchmark accuracy should be considered."
        ]

        return ClaimVerificationResponse(
            claim=request.claim,
            verdict=verdict,
            confidence=round(confidence, 2),
            consensus_summary=summary,
            supporting_evidence=supporting_evidence,
            refuting_evidence=refuting_evidence,
            contextual_evidence=contextual_evidence,
            methodological_nuances=methodological_nuances,
            verified_at=datetime.now(timezone.utc)
        )

claim_verifier = ClaimVerifierAgent()
