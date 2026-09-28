import asyncio
import json
import os
import sys

# Add api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.database import AsyncSessionLocal, init_db
from app.agents.podcast_agent import podcast_agent
from app.agents.claim_verifier import claim_verifier
from app.schemas.podcast import PodcastGenerateRequest
from app.schemas.verify import ClaimVerifyRequest
from app.core.logging import logger

async def run_demo():
    print("==================================================")
    print("  DeepGraph AI - Podcast & Verification Showcase  ")
    print("==================================================")

    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Generate Research Audio Briefing
        print("\n[1/2] Generating Dual-Host Audio Briefing Script...")
        req_podcast = PodcastGenerateRequest(
            topic="Vision Transformers vs Residual Networks",
            style="debate",
            duration_target_minutes=5
        )
        episode = await podcast_agent.generate_podcast(session=session, request=req_podcast)
        
        print(f"  * Episode Title: {episode.title}")
        print(f"  * Subtitle:      {episode.subtitle}")
        print(f"  * Total Turns:   {len(episode.dialogue)} dialogue lines")
        print(f"  * Duration Est.: {episode.total_duration_estimate_seconds}s")
        print(f"  * Chapters:      {len(episode.chapters)}")
        print("\n  Dialogue Sample:")
        for turn in episode.dialogue[:3]:
            print(f"    [{turn.timestamp_formatted}] {turn.speaker} ({turn.tone}): {turn.text[:90]}...")

        # 2. Automated Scientific Claim Verification
        print("\n[2/2] Running Scientific Claim Consensus Verification...")
        test_claims = [
            "Residual learning enables training of significantly deeper neural networks without vanishing gradients.",
            "Self-attention layers have strictly linear time and memory complexity with respect to image resolution."
        ]

        for claim in test_claims:
            print(f"\n  * Evaluating Assertion: \"{claim}\"")
            req_verify = ClaimVerifyRequest(claim=claim)
            verdict_res = await claim_verifier.verify_claim(session=session, request=req_verify)
            
            print(f"    -> Verdict:    {verdict_res.verdict}")
            print(f"    -> Confidence: {verdict_res.confidence * 100:.1f}%")
            print(f"    -> Summary:    {verdict_res.consensus_summary}")
            print(f"    -> Evidence:   {len(verdict_res.supporting_evidence)} supporting, {len(verdict_res.refuting_evidence)} counter-evidence")

        # 3. Save Sample Export
        out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "sample_podcast_episode.json")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(episode.model_dump_json(indent=2))
        print(f"\n[SUCCESS] Sample podcast export saved to: {out_path}")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_demo())
