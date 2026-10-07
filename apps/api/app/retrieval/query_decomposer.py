import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SubQueryItem(BaseModel):
    sub_id: int
    sub_query: str
    target_aspect: str  # Methodology, Efficiency, Hardware, Benchmarks, Limitations
    importance_weight: float

class DecomposedQueryPlan(BaseModel):
    original_query: str
    complexity_level: str  # Simple, Moderate, Multi-Faceted Composite
    sub_queries: List[SubQueryItem]
    execution_strategy: str

class MultiQueryDecomposer:
    """
    Decomposes multi-faceted composite research inquiries into targeted atomic sub-queries
    for parallel multi-hop hybrid retrieval.
    """

    ASPECT_KEYWORDS = {
        "Efficiency": ["speed", "latency", "memory", "throughput", "vram", "complexity", "fast", "scaling"],
        "Hardware": ["gpu", "cuda", "h100", "a100", "compute", "accelerator", "hardware", "distributed"],
        "Methodology": ["architecture", "mechanism", "formulation", "loss", "attention", "algorithm", "layer"],
        "Benchmarks": ["dataset", "accuracy", "f1", "bleu", "score", "outperform", "baseline", "results"],
        "Limitations": ["limitation", "tradeoff", "bottleneck", "failure", "drawback", "challenge"]
    }

    def decompose(self, query: str) -> DecomposedQueryPlan:
        clean_q = query.strip()
        words = clean_q.lower().split()

        # Detect composite separators
        has_conjunctions = any(conj in clean_q.lower() for conj in [" and ", " compared to ", " vs ", " as well as ", " while "])
        is_long = len(words) >= 8

        sub_queries: List[SubQueryItem] = []

        if has_conjunctions or is_long:
            complexity = "Multi-Faceted Composite"
            strategy = "Parallel Fan-Out Hybrid Retrieval with Consensus Merging"

            # Aspect 1: Core formulation
            sub_queries.append(SubQueryItem(
                sub_id=1,
                sub_query=f"{clean_q} core architecture and mathematical formulation",
                target_aspect="Methodology",
                importance_weight=0.40
            ))

            # Aspect 2: Performance and benchmark comparison
            sub_queries.append(SubQueryItem(
                sub_id=2,
                sub_query=f"{clean_q} benchmark evaluation metrics and comparative baselines",
                target_aspect="Benchmarks",
                importance_weight=0.35
            ))

            # Aspect 3: Compute efficiency or limitations
            sub_queries.append(SubQueryItem(
                sub_id=3,
                sub_query=f"{clean_q} computational complexity, hardware requirements, and limitations",
                target_aspect="Efficiency",
                importance_weight=0.25
            ))
        else:
            complexity = "Simple"
            strategy = "Direct Single-Hop Hybrid Retrieval"
            sub_queries.append(SubQueryItem(
                sub_id=1,
                sub_query=clean_q,
                target_aspect="Methodology",
                importance_weight=1.0
            ))

        return DecomposedQueryPlan(
            original_query=clean_q,
            complexity_level=complexity,
            sub_queries=sub_queries,
            execution_strategy=strategy
        )

query_decomposer = MultiQueryDecomposer()
