import re
from typing import List, Dict, Any
from app.ingestion.pdf_parser import ParsedDocument

class TextChunk:
    def __init__(
        self,
        chunk_index: int,
        page_number: int,
        section: str,
        text: str,
        token_count: int
    ):
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.section = section
        self.text = text
        self.token_count = token_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
            "section": self.section,
            "text": self.text,
            "token_count": self.token_count
        }

class StructureAwareChunker:
    """Chunks documents preserving section headers, page numbers, and semantic boundaries."""

    def __init__(self, target_chunk_tokens: int = 350, max_chunk_tokens: int = 500, overlap_tokens: int = 50):
        self.target_chunk_tokens = target_chunk_tokens
        self.max_chunk_tokens = max_chunk_tokens
        self.overlap_tokens = overlap_tokens

    def _approx_token_count(self, text: str) -> int:
        # Approximate tokens (words * 1.3 or whitespace splitting)
        words = text.split()
        return int(len(words) * 1.25)

    def chunk_document(self, parsed_doc: ParsedDocument) -> List[TextChunk]:
        chunks: List[TextChunk] = []
        chunk_index = 0

        # Special chunk for Abstract if present
        if parsed_doc.abstract and len(parsed_doc.abstract) > 30:
            chunks.append(TextChunk(
                chunk_index=chunk_index,
                page_number=1,
                section="Abstract",
                text=f"Abstract: {parsed_doc.abstract}",
                token_count=self._approx_token_count(parsed_doc.abstract)
            ))
            chunk_index += 1

        # Process each detected section
        for section in parsed_doc.sections:
            sec_name = section.get("name", "Main")
            if sec_name.lower() in ["references", "bibliography"]:
                continue # Bibliography handled separately by citation extractor

            paragraphs = section.get("paragraphs", [])
            current_buffer = []
            current_tokens = 0
            current_page = 1

            for p in paragraphs:
                p_text = p.get("text", "").strip()
                p_page = p.get("page", 1)
                current_page = p_page

                if not p_text:
                    continue

                p_tokens = self._approx_token_count(p_text)

                if current_tokens + p_tokens > self.max_chunk_tokens and current_buffer:
                    combined_text = " ".join(current_buffer)
                    chunks.append(TextChunk(
                        chunk_index=chunk_index,
                        page_number=current_page,
                        section=sec_name,
                        text=combined_text,
                        token_count=current_tokens
                    ))
                    chunk_index += 1

                    # Keep last sentence/paragraph for overlap context
                    overlap_p = current_buffer[-1] if len(current_buffer) > 1 else ""
                    overlap_tokens = self._approx_token_count(overlap_p) if overlap_p else 0
                    
                    if overlap_tokens <= self.overlap_tokens:
                        current_buffer = [overlap_p] if overlap_p else []
                        current_tokens = overlap_tokens
                    else:
                        current_buffer = []
                        current_tokens = 0

                current_buffer.append(p_text)
                current_tokens += p_tokens

            if current_buffer:
                combined_text = " ".join(current_buffer)
                chunks.append(TextChunk(
                    chunk_index=chunk_index,
                    page_number=current_page,
                    section=sec_name,
                    text=combined_text,
                    token_count=current_tokens
                ))
                chunk_index += 1

        # Fallback if no sections were detected
        if not chunks:
            for page in parsed_doc.pages:
                if not page.text.strip():
                    continue
                words = page.text.split()
                for i in range(0, len(words), 250):
                    sub_words = words[i:i + 250]
                    text = " ".join(sub_words)
                    chunks.append(TextChunk(
                        chunk_index=chunk_index,
                        page_number=page.page_number,
                        section="Main",
                        text=text,
                        token_count=int(len(sub_words) * 1.25)
                    ))
                    chunk_index += 1

        return chunks

chunker = StructureAwareChunker()
