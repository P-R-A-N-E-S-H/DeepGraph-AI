import re
from typing import Dict, List, Any, Optional

class ExtractedCitation:
    def __init__(
        self,
        raw_reference: str,
        title: Optional[str] = None,
        authors: List[str] = None,
        year: Optional[int] = None,
        doi: Optional[str] = None,
        arxiv_id: Optional[str] = None,
        confidence: float = 1.0
    ):
        self.raw_reference = raw_reference
        self.title = title
        self.authors = authors or []
        self.year = year
        self.doi = doi
        self.arxiv_id = arxiv_id
        self.confidence = confidence

class CitationExtractor:
    """Extracts structured citation items (title, authors, year, DOI, arXiv ID) from raw reference strings."""

    def extract_from_references(self, raw_references: List[str]) -> List[ExtractedCitation]:
        citations = []
        for raw in raw_references:
            cleaned = raw.strip()
            if len(cleaned) < 15:
                continue

            confidence = 1.0
            
            # Extract Year (4 digits between 1950 and 2030)
            year = None
            year_match = re.search(r'\b(19[5-9]\d|20[0-3]\d)\b', cleaned)
            if year_match:
                year = int(year_match.group(1))
            else:
                confidence -= 0.2

            # Extract DOI
            doi = None
            doi_match = re.search(r'(?:doi(?:\.org)?\/|10\.\d{4,9}\/[-._;()\/:A-Z0-9]+)', cleaned, re.IGNORECASE)
            if doi_match:
                doi = doi_match.group(0)

            # Extract arXiv ID
            arxiv_id = None
            arxiv_match = re.search(r'arXiv:(\d{4}\.\d{4,5}(?:v\d+)?)', cleaned, re.IGNORECASE)
            if arxiv_match:
                arxiv_id = arxiv_match.group(1)

            # Extract Title & Authors heuristics
            # Usually format: Authors (Year). Title. Venue. OR Authors. "Title." Venue, Year.
            title = None
            authors = []

            # Check quotes for title
            quote_title = re.search(r'["“]([^"”]+)["”]', cleaned)
            if quote_title:
                title = quote_title.group(1).strip()
            else:
                # Split by dots
                parts = [p.strip() for p in cleaned.split('.') if len(p.strip()) > 3]
                if len(parts) >= 2:
                    # Part 0 is usually authors
                    auth_part = parts[0]
                    authors = [a.strip() for a in re.split(r'[,;]|\band\b', auth_part) if len(a.strip()) > 2][:5]
                    # Part 1 is usually title
                    title = parts[1]
                elif len(parts) == 1:
                    title = parts[0]
                    confidence -= 0.3

            if not title or len(title) < 5:
                title = cleaned[:100]
                confidence -= 0.3

            citations.append(ExtractedCitation(
                raw_reference=cleaned,
                title=title[:300] if title else None,
                authors=authors,
                year=year,
                doi=doi,
                arxiv_id=arxiv_id,
                confidence=max(0.1, round(confidence, 2))
            ))

        return citations

citation_extractor = CitationExtractor()
