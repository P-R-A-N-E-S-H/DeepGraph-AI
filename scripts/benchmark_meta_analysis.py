"""
DeepGraph AI - Statistical Meta-Analysis & Heterogeneity Benchmark Runner
Validates inverse variance weighting, Cochran's Q, and I^2 metrics.
"""
import sys
import os
import math
import asyncio
import time

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.database import AsyncSessionLocal, init_db
from app.agents.meta_analysis_agent import meta_analysis_agent

async def run_meta_benchmark():
    print("=" * 80)
    print("DeepGraph AI - Statistical Meta-Analysis Benchmark Suite")
    print("=" * 80)

    await init_db()

    async with AsyncSessionLocal() as session:
        t0 = time.time()
        res = await meta_analysis_agent.compute_meta_analysis(
            session=session,
            paper_ids=[],
            topic="Attention Mechanisms vs Recurrent Networks",
            metric_name="Standardized Accuracy Gain (SMD)"
        )
        latency = round((time.time() - t0) * 1000.0, 2)

        print(f"\n[1/3] Statistical Synthesis Completed in {latency}ms")
        print(f"  -> Analyzed Studies: {len(res.studies)}")
        print(f"  -> Pooled Effect Size (Fixed): {res.pooled_effect_fixed:.3f}")
        print(f"  -> 95% Confidence Interval: [{res.pooled_ci_lower:.3f}, {res.pooled_ci_upper:.3f}]")
        print(f"  -> z-score: {res.z_score:.2f} (p = {res.p_value:.4f})")

        print(f"\n[2/3] Validating Heterogeneity Metrics...")
        print(f"  -> Cochran's Q Statistic: {res.heterogeneity_q:.2f}")
        print(f"  -> Higgins I^2 Index: {res.heterogeneity_i2_percentage:.1f}% ({res.heterogeneity_interpretation})")
        assert 0.0 <= res.heterogeneity_i2_percentage <= 100.0
        assert res.heterogeneity_q >= 0.0

        print(f"\n[3/3] Validating Inverse-Variance Weights...")
        total_w = sum(s.weight_percentage for s in res.studies)
        print(f"  -> Total Weight Sum: {total_w:.1f}%")
        assert abs(total_w - 100.0) < 0.5

        print("\n" + "=" * 80)
        print("Meta-Analysis Benchmark Result: 100% SUCCESS (ALL STATISTICAL ASSERTS PASSED)")
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_meta_benchmark())
