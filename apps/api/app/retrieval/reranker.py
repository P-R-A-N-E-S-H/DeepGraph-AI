import re
import math
from typing import List, Dict, Any, Optional
from app.schemas.search import SearchResultItem

class CrossEncoderReranker:
    """Reranks hybrid retrieval candidate documents using cross-attention heuristics, MMR diversity, and deduplication."""

    def __init__(self, lambda_diversity: float = 0.7):
        self.lambda_diversity = lambda_diversity

    def _tokenize(self, text: str) -> set[str]:
        return set(re.findall(r'\b[a-zA-Z0-9_-]{3,}\b', text.lower()))

    def _jaccard_similarity(self, set1: set[str], set2: set[str]) -> float:
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return intersection / union if union > 0 else 0.0

    def calculate_cross_score(self, query: str, document_text: str, base_score: float) -> float:
        """Computes contextual relevance score based on exact terms, contiguous matching, and base similarity."""
        q_tokens = self._tokenize(query)
        d_tokens = self._tokenize(document_text)

        if not q_tokens:
            return base_score

        # Term overlap
        term_overlap = len(q_tokens.intersection(d_tokens)) / len(q_tokens)

        # Exact phrase bonus
        clean_q = query.lower().strip()
        clean_d = document_text.lower()
        phrase_bonus = 0.25 if clean_q in clean_d else 0.0

        # BM25-like length normalized term density
        density = (term_overlap * 2.0) / (1.0 + (len(d_tokens) / 100.0))

        # Fused rerank score
        reranked_score = (0.45 * base_score) + (0.35 * term_overlap) + (0.20 * min(density, 1.0)) + phrase_bonus
        return min(round(reranked_score, 4), 1.0)

    def deduplicate(self, items: List[SearchResultItem], similarity_threshold: float = 0.85) -> List[SearchResultItem]:
        """Eliminates redundant or near-duplicate passages from the candidate list."""
        unique_items: List[SearchResultItem] = []
        token_sets: List[set[str]] = []

        for item in items:
            tokens = self._tokenize(item.text)
            is_duplicate = False
            for prev_tokens in token_sets:
                sim = self._jaccard_similarity(tokens, prev_tokens)
                if sim >= similarity_threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_items.append(item)
                token_sets.append(tokens)

        return unique_items

    def rerank_mmr(
        self,
        query: str,
        items: List[SearchResultItem],
        top_k: int = 10,
        similarity_threshold: float = 0.85
    ) -> List[SearchResultItem]:
        """Performs deduplication, cross-scoring, and Maximal Marginal Relevance reranking for maximum diversity."""
        # 1. Deduplicate
        deduped = self.deduplicate(items, similarity_threshold=similarity_threshold)
        if not deduped:
            return []

        # 2. Score with cross-scorer
        for item in deduped:
            item.score = self.calculate_cross_score(query, item.text, item.score)

        # 3. MMR selection
        selected: List[SearchResultItem] = []
        candidates = sorted(deduped, key=lambda x: x.score, reverse=True)

        if not candidates:
            return []

        # Pick highest scoring item first
        selected.append(candidates.pop(0))

        while len(selected) < min(top_k, len(deduped)) and candidates:
            best_mmr = -float('inf')
            best_idx = 0

            for i, cand in enumerate(candidates):
                cand_tokens = self._tokenize(cand.text)
                
                # Maximum similarity to already selected items
                max_sim_to_selected = 0.0
                for sel in selected:
                    sim = self._jaccard_similarity(cand_tokens, self._tokenize(sel.text))
                    if sim > max_sim_to_selected:
                        max_sim_to_selected = sim

                mmr_score = (self.lambda_diversity * cand.score) - ((1.0 - self.lambda_diversity) * max_sim_to_selected)
                if mmr_score > best_mmr:
                    best_mmr = mmr_score
                    best_idx = i

            selected.append(candidates.pop(best_idx))

        return selected

cross_encoder_reranker = CrossEncoderReranker()
