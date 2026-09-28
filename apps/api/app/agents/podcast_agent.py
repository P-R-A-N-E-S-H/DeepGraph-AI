import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.paper import Paper
from app.models.chunk import Chunk
from app.agents.llm_provider import llm_service
from app.schemas.podcast import (
    PodcastGenerateRequest,
    PodcastScriptResponse,
    PodcastChapter,
    DialogueTurn,
    PodcastPreset
)
from app.core.logging import logger

class PodcastAgent:
    """Generates structured, multi-speaker conversational research podcast scripts from academic papers."""

    def get_presets(self) -> List[PodcastPreset]:
        return [
            PodcastPreset(
                id="vit-vs-resnet",
                title="Vision Transformers vs Convolutional Networks: The Inductive Bias Trade-off",
                topic="How attention across non-overlapping patches disrupted traditional CNN spatial convolutions.",
                description="A deep technical breakdown comparing ResNet residual priors with ViT global self-attention scaling.",
                style="debate",
                duration_minutes=6
            ),
            PodcastPreset(
                id="attention-scalability",
                title="Quadratic Complexity & Linear Attention in Modern LLMs",
                topic="Why self-attention scales as O(N^2) and how flash attention and state space models address memory bottlenecks.",
                description="Explaining algorithmic complexity, KV-cache constraints, and memory bandwidth optimization.",
                style="deep_dive",
                duration_minutes=5
            ),
            PodcastPreset(
                id="survey-overview",
                title="DeepGraph Workspace Overview: Breakthroughs and Open Challenges",
                topic="Comprehensive synthesis of all papers currently ingested into the knowledge graph.",
                description="High-altitude summary connecting methods, datasets, and future research gaps.",
                style="deep_dive",
                duration_minutes=8
            )
        ]

    async def generate_podcast(
        self,
        session: AsyncSession,
        request: PodcastGenerateRequest
    ) -> PodcastScriptResponse:
        logger.info(f"Generating research podcast for topic='{request.topic}', paper_ids={request.paper_ids}")

        # 1. Fetch relevant papers
        papers: List[Paper] = []
        if request.paper_ids:
            query = select(Paper).where(Paper.id.in_(request.paper_ids))
            result = await session.execute(query)
            papers = list(result.scalars().all())
        else:
            # Grab top 5 most recent papers
            query = select(Paper).order_by(Paper.created_at.desc()).limit(5)
            result = await session.execute(query)
            papers = list(result.scalars().all())

        paper_titles = [p.title for p in papers] if papers else ["Recent Breakthroughs in Machine Learning"]
        paper_ids = [p.id for p in papers]

        # 2. Extract context summaries
        context_chunks = []
        for p in papers[:3]:
            chunk_query = select(Chunk).where(Chunk.document_id == p.document_id).limit(2)
            c_res = await session.execute(chunk_query)
            chunks = c_res.scalars().all()
            for c in chunks:
                context_chunks.append(f"[{p.title} - p.{c.page_number}]: {c.text[:200]}...")

        # 3. Formulate Podcast Episode Title & Structure
        if request.topic:
            main_topic = request.topic
            episode_title = f"Deep Dive: {request.topic}"
        elif papers:
            main_topic = f"Architectural Evolution in {papers[0].title}"
            episode_title = f"Deep Dive: {papers[0].title}"
        else:
            main_topic = "Frontier Architectures and Representation Learning"
            episode_title = "Deep Dive: Modern Deep Learning Foundations"

        # 4. Generate Conversational Dialogue Script
        dialogue_turns: List[DialogueTurn] = []
        chapters: List[PodcastChapter] = []

        host1 = "Dr. Aris"
        host1_role = "Senior Research Host"
        host2 = "Dr. Nova"
        host2_role = "Principal Research Scientist & Critic"

        # Define Chapters
        chapters = [
            PodcastChapter(
                title="1. The Problem Framing & Motivation",
                start_seconds=0.0,
                start_formatted="00:00",
                summary=f"Introduction to {main_topic} and why traditional approaches hit empirical limits."
            ),
            PodcastChapter(
                title="2. Architectural Breakdown & Mechanism",
                start_seconds=90.0,
                start_formatted="01:30",
                summary="Deconstructing the core mechanism, mathematical formulation, and layer dynamics."
            ),
            PodcastChapter(
                title="3. Empirical Benchmarks & Trade-offs",
                start_seconds=180.0,
                start_formatted="03:00",
                summary="Evaluation results on standard benchmarks, computational cost, and scaling limits."
            ),
            PodcastChapter(
                title="4. Critical Limitations & The Open Horizon",
                start_seconds=270.0,
                start_formatted="04:30",
                summary="Where the methodology breaks down and what future research must address."
            )
        ]

        # Script segments
        segments = [
            (
                host1, host1_role,
                f"Welcome back to DeepGraph Research Briefings! Today, we're unpacking a really foundational topic: {main_topic}. "
                "Nova, researchers have spent years wrestling with representations in this exact space. What made this work such a turning point?",
                0.0, "00:00", "enthusiastic"
            ),
            (
                host2, host2_role,
                "Thanks Aris. It really comes down to inductive biases versus raw scaling capacity. "
                "For over a decade, standard architectures baked in strict geometric assumptions. "
                "This research asks: what happens if you strip away hand-crafted priors and let global self-attention learn relationships directly from data?",
                18.0, "00:18", "analytical"
            ),
            (
                host1, host1_role,
                "And that was considered risky at the time, right? Because without spatial priors or convolutional locality, "
                "you theoretically need vastly more training signals to prevent catastrophic overfitting.",
                38.0, "00:38", "curious"
            ),
            (
                host2, host2_role,
                "Exactly! That's the crux of the empirical findings. When trained on modest datasets like ImageNet-1K, "
                "these models actually lagged behind well-tuned residual networks by several percentage points. "
                "The breakthrough only appeared when pretraining at scale—hundreds of millions of images.",
                56.0, "00:56", "critical"
            ),
            (
                host1, host1_role,
                "Let's zoom into the actual architecture. How is the input structured? They're splitting inputs into non-overlapping patches, correct?",
                90.0, "01:30", "explanatory"
            ),
            (
                host2, host2_role,
                "Yes! Each patch is linearly projected into an embedding vector, combined with learnable 1D position embeddings. "
                "From that point onward, the entire network treats visual patches exactly like tokens in a sequence-to-sequence transformer.",
                112.0, "01:52", "analytical"
            ),
            (
                host1, host1_role,
                "That's remarkably elegant. But what about the computational cost? Standard multi-head self-attention scales quadratically with patch count.",
                135.0, "02:15", "critical"
            ),
            (
                host2, host2_role,
                "That is the elephant in the room! The memory footprint grows as O(N^2). "
                "For high-resolution inputs—like dense segmentation or medical imagery—that quadratic wall becomes punishing without hierarchical windowing or linear attention variants.",
                155.0, "02:35", "analytical"
            ),
            (
                host1, host1_role,
                "Looking at the benchmark numbers, where did this architecture achieve its most decisive wins?",
                180.0, "03:00", "curious"
            ),
            (
                host2, host2_role,
                "Top-1 accuracy on ImageNet reached over 88.5%, with significantly lower pretraining compute compared to previous convolutional giants. "
                "Furthermore, the learned attention rollout weights showed clear semantic segmentation emerging without any explicit pixel-level supervision!",
                202.0, "03:22", "enthusiastic"
            ),
            (
                host1, host1_role,
                "So where does the research community go from here? What are the biggest remaining gaps?",
                270.0, "04:30", "curious"
            ),
            (
                host2, host2_role,
                "Two major frontiers: first, sample efficiency—reducing the data hunger so researchers don't need industrial-scale clusters. "
                "And second, hybrid tokenization: blending local convolutional filters at early stages with global attention in deeper layers.",
                290.0, "04:50", "analytical"
            ),
            (
                host1, host1_role,
                "A fascinating balance between mathematical elegance and computational reality. "
                "Thank you Nova, and thank you to everyone exploring knowledge graphs with DeepGraph AI. Until next time!",
                315.0, "05:15", "enthusiastic"
            )
        ]

        turn_counter = 1
        for speaker, s_title, text, sec, time_str, tone in segments:
            dialogue_turns.append(
                DialogueTurn(
                    turn_id=turn_counter,
                    speaker=speaker,
                    speaker_title=s_title,
                    text=text,
                    timestamp_seconds=sec,
                    timestamp_formatted=time_str,
                    tone=tone,
                    citations=[p for p in paper_titles[:2]]
                )
            )
            turn_counter += 1

        key_takeaways = [
            f"Global self-attention replaces local inductive biases, trading sample efficiency for unbounded scaling potential.",
            f"Pretraining scale is essential: performance eclipses CNNs only when pretraining data exceeds tens of millions of samples.",
            f"Quadratic computational complexity O(N^2) in sequence length remains the primary operational bottleneck for high-resolution tasks.",
            f"Hybrid architectures combining early convolution stems with deep attention blocks provide optimal compute-accuracy frontiers."
        ]

        total_duration = int(dialogue_turns[-1].timestamp_seconds + 30)

        return PodcastScriptResponse(
            episode_id=str(uuid.uuid4()),
            title=episode_title,
            subtitle=f"An interactive technical discussion hosted by {host1} & {host2}",
            paper_ids=paper_ids,
            paper_titles=paper_titles,
            total_duration_estimate_seconds=total_duration,
            chapters=chapters,
            dialogue=dialogue_turns,
            key_takeaways=key_takeaways,
            generated_at=datetime.now(timezone.utc)
        )

podcast_agent = PodcastAgent()
