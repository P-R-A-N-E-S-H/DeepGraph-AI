import re
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel
from app.schemas.search import SearchResultItem

class CompressedChunk(BaseModel):
    chunk_id: str
    original_text: str
    compressed_text: str
    original_token_count: int
    compressed_token_count: int
    compression_ratio_pct: float
    retained_salient_sentences: List[str]

class ContextualChunkCompressor:
    """
    Trims irrelevant surrounding boilerplate sentences from retrieved chunks,
    preserving high-density factual assertions, numerical results, and direct query overlaps.
    """

    @staticmethod
    def _sentence_split(text: str) -> List[str]:
        # Split sentences by period followed by whitespace or newline
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        return [s.strip() for s in sentences if len(s.strip()) > 10]

    def compress_chunk(self, query: str, chunk: SearchResultItem, max_sentences: int = 4) -> CompressedChunk:
        query_terms = set(re.findall(r'\w+', query.lower()))
        sentences = self._sentence_split(chunk.text)

        if len(sentences) <= 2:
            return CompressedChunk(
                chunk_id=chunk.chunk_id,
                original_text=chunk.text,
                compressed_text=chunk.text,
                original_token_count=len(chunk.text.split()),
                compressed_token_count=len(chunk.text.split()),
                compression_ratio_pct=0.0,
                retained_salient_sentences=sentences
            )

        scored_sentences: List[Tuple[str, float]] = []
        for idx, s in enumerate(sentences):
            s_words = set(re.findall(r'\w+', s.lower()))
            overlap = len(query_terms.intersection(s_words))
            
            # Boost sentences with numbers, metrics or percentages
            has_metric = bool(re.search(r'\d+(?:\.\d+)?%?|\b(?:accuracy|latency|f1|bleu|speedup|param)\b', s.lower()))
            metric_boost = 1.5 if has_metric else 1.0

            # Position weight (earlier sentences often establish definitions)
            pos_weight = 1.2 if idx == 0 else 1.0

            score = (overlap * 2.0 + (1.0 if has_metric else 0.0)) * pos_weight * metric_boost
            scored_sentences.append((s, score))

        # Select top salient sentences while preserving original order
        top_indices = sorted(
            sorted(range(len(scored_sentences)), key=lambda i: scored_sentences[i][1], reverse=True)[:max_sentences]
        )

        retained = [sentences[i] for i in top_indices]
        compressed_txt = " ".join(retained)

        orig_len = max(1, len(chunk.text.split()))
        comp_len = len(compressed_txt.split())
        ratio = round(((orig_len - comp_len) / orig_len) * 100.0, 1)

        return CompressedChunk(
            chunk_id=chunk.chunk_id,
            original_text=chunk.text,
            compressed_text=compressed_txt,
            original_token_count=orig_len,
            compressed_token_count=comp_len,
            compression_ratio_pct=ratio,
            retained_salient_sentences=retained
        )

    def compress_all(self, query: str, chunks: List[SearchResultItem]) -> List[SearchResultItem]:
        compressed_results: List[SearchResultItem] = []
        for c in chunks:
            comp = self.compress_chunk(query, c)
            c_copy = c.model_copy()
            c_copy.text = comp.compressed_text
            compressed_results.append(c_copy)
        return compressed_results

context_compressor = ContextualChunkCompressor()
