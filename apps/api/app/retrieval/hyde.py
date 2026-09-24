import re
from typing import List, Dict, Any, Optional
from app.agents.llm_provider import llm_service
from app.core.logging import logger

class HyDEGenerator:
    """Generates Hypothetical Document Embeddings (HyDE) and expanded sub-queries for precision technical retrieval."""

    @staticmethod
    def generate_heuristic_hypothetical_abstract(query: str) -> str:
        """Fallback rule-based hypothetical passage generator when LLM is unavailable."""
        clean = query.strip()
        return (
            f"Abstract: In this paper, we investigate {clean}. We analyze theoretical properties, "
            f"computational scaling limits, and empirical benchmark performance. Our findings demonstrate "
            f"that {clean} provides measurable efficiency and accuracy improvements over standard baselines."
        )

    async def generate_hypothetical_passage(self, query: str, model: Optional[str] = None) -> str:
        """Uses LLM to synthesize a hypothetical academic abstract answering the user's research query."""
        prompt = (
            f"You are an expert scientific author. Write a concise, highly technical hypothetical abstract (1 paragraph) "
            f"for a research paper that directly answers or explores the following technical question:\n\n"
            f"Query: \"{query}\"\n\n"
            f"Do not include commentary or greetings. Output only the hypothetical abstract paragraph."
        )

        try:
            hypothetical = await llm_service.generate_text(prompt=prompt, model=model)
            if hypothetical and len(hypothetical.strip()) > 30:
                return hypothetical.strip()
        except Exception as e:
            logger.warning(f"HyDE LLM generation failed ({e}). Using deterministic heuristic fallback.")

        return self.generate_heuristic_hypothetical_abstract(query)

    async def expand_queries(self, query: str) -> List[str]:
        """Generates diverse technical sub-queries, synonyms, and acronym expansions."""
        queries = [query]
        
        # Rule-based acronym and synonym expansion
        acronym_map = {
            "rag": "retrieval augmented generation",
            "llm": "large language models",
            "sota": "state of the art",
            "moe": "mixture of experts",
            "vit": "vision transformer",
            "kg": "knowledge graph",
            "gnn": "graph neural network",
            "nlp": "natural language processing",
            "cv": "computer vision",
            "rlhf": "reinforcement learning from human feedback",
            "dpo": "direct preference optimization"
        }

        tokens = re.findall(r'\b[a-zA-Z0-9]+\b', query.lower())
        for token in tokens:
            if token in acronym_map:
                expanded = re.sub(rf'\b{token}\b', acronym_map[token], query, flags=re.IGNORECASE)
                if expanded not in queries:
                    queries.append(expanded)

        return queries

hyde_generator = HyDEGenerator()
