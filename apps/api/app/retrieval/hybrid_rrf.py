import math
import re
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel
from app.schemas.search import SearchResultItem

class RankedCandidate(BaseModel):
    item_id: str
    item: SearchResultItem
    dense_rank: int = 999
    bm25_rank: int = 999
    graph_rank: int = 999
    rrf_score: float = 0.0

class ReciprocalRankFusionReranker:
    """
    Combines ranked candidate lists from Dense Semantic Vector search,
    BM25 Lexical Keyword search, and Knowledge Graph Traversal into a calibrated consensus ranking.
    """

    def __init__(self, rrf_k: int = 60):
        self.rrf_k = rrf_k

    @staticmethod
    def _bm25_tokenize(text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\w+', text) if len(w) > 2]

    def compute_bm25_scores(self, query: str, items: List[SearchResultItem]) -> List[Tuple[SearchResultItem, float]]:
        """
        Lightweight fast in-memory BM25 scorer across retrieved chunks.
        """
        query_terms = self._bm25_tokenize(query)
        if not query_terms or not items:
            return [(it, 0.0) for it in items]

        k1 = 1.5
        b = 0.75
        doc_lengths = [len(self._bm25_tokenize(it.text)) for it in items]
        avgdl = sum(doc_lengths) / max(1, len(doc_lengths))
        n_docs = len(items)

        # Calculate DF
        doc_freq: Dict[str, int] = {}
        for it in items:
            terms_in_doc = set(self._bm25_tokenize(it.text) + self._bm25_tokenize(it.paper_title))
            for t in query_terms:
                if t in terms_in_doc:
                    doc_freq[t] = doc_freq.get(t, 0) + 1

        scored_items = []
        for idx, it in enumerate(items):
            doc_terms = self._bm25_tokenize(it.text) + self._bm25_tokenize(it.paper_title)
            score = 0.0
            doc_len = doc_lengths[idx]

            for t in query_terms:
                df = doc_freq.get(t, 0)
                idf = math.log((n_docs - df + 0.5) / (df + 0.5) + 1.0)
                tf = doc_terms.count(t)
                numerator = tf * (k1 + 1)
                denominator = tf + k1 * (1 - b + b * (doc_len / max(1.0, avgdl)))
                score += idf * (numerator / max(0.001, denominator))

            scored_items.append((it, score))

        scored_items.sort(key=lambda x: x[1], reverse=True)
        return scored_items

    def fuse_rankings(
        self,
        query: str,
        dense_results: List[SearchResultItem],
        graph_boosted_ids: List[str] = None,
        top_k: int = 10
    ) -> List[SearchResultItem]:
        """
        Fuse Dense and Lexical BM25 rankings using Reciprocal Rank Fusion.
        """
        if not dense_results:
            return []

        graph_boosted_ids = graph_boosted_ids or []
        candidates: Dict[str, RankedCandidate] = {}

        # 1. Dense Ranks
        for r_idx, item in enumerate(dense_results):
            candidates[item.chunk_id] = RankedCandidate(
                item_id=item.chunk_id,
                item=item,
                dense_rank=r_idx + 1
            )

        # 2. BM25 Ranks
        bm25_ranked = self.compute_bm25_scores(query, dense_results)
        for r_idx, (item, _) in enumerate(bm25_ranked):
            if item.chunk_id in candidates:
                candidates[item.chunk_id].bm25_rank = r_idx + 1

        # 3. Graph Ranks
        for r_idx, chunk_id in enumerate(graph_boosted_ids):
            if chunk_id in candidates:
                candidates[chunk_id].graph_rank = r_idx + 1

        # 4. Compute RRF Consensus Score
        final_list = []
        for cand in candidates.values():
            rrf = (1.0 / (self.rrf_k + cand.dense_rank)) + (1.0 / (self.rrf_k + cand.bm25_rank))
            if cand.graph_rank < 999:
                rrf += (1.0 / (self.rrf_k + cand.graph_rank))

            # Update item score
            item_copy = cand.item
            item_copy.score = round(rrf * 100.0, 4) # Scaled for readability
            if cand.bm25_rank <= 3 and cand.dense_rank <= 3:
                item_copy.source_type = "hybrid_rrf_consensus"
            final_list.append((item_copy, rrf))

        final_list.sort(key=lambda x: x[1], reverse=True)
        return [item for item, _ in final_list[:top_k]]

rrf_fusion_reranker = ReciprocalRankFusionReranker()
