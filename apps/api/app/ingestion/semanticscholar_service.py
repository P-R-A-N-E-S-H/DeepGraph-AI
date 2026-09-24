import httpx
from typing import Optional, Dict, Any, List
from app.core.logging import logger

class SemanticScholarService:
    """Service to fetch academic citation graphs, h-index author metrics, and TLDRs via Semantic Scholar API."""

    BASE_URL = "https://api.semanticscholar.org/graph/v1/paper"

    async def fetch_paper_enrichment(self, identifier: str) -> Optional[Dict[str, Any]]:
        """
        identifier can be:
        - DOI: '10.1038/nrn3241' or 'DOI:10.1038/nrn3241'
        - ArXiv: 'ARXIV:2106.09685' or '2106.09685'
        - Semantic Scholar ID: '649def34f8be52c8b66281af98ae772c99cf93e5'
        - Corpus ID: 'CorpusId:215416146'
        """
        clean_id = identifier.strip()
        if not clean_id.startswith(("DOI:", "ARXIV:", "CorpusId:", "MAG:", "ACL:", "PMID:")) and not len(clean_id) == 40:
            if "/" in clean_id:
                clean_id = f"DOI:{clean_id}"
            elif "." in clean_id and not clean_id.startswith("10."):
                clean_id = f"ARXIV:{clean_id}"

        fields = "title,abstract,year,venue,citationCount,influentialCitationCount,referenceCount,fieldsOfStudy,tldr,openAccessPdf,authors.name,authors.hIndex"
        url = f"{self.BASE_URL}/{clean_id}?fields={fields}"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url)
                if res.status_code != 200:
                    logger.warning(f"Semantic Scholar lookup returned {res.status_code} for {identifier}")
                    return None

                data = res.json()
                authors = []
                for a in data.get("authors", []):
                    authors.append({
                        "name": a.get("name", "Unknown"),
                        "h_index": a.get("hIndex", 0)
                    })

                tldr_text = data.get("tldr", {}).get("text") if isinstance(data.get("tldr"), dict) else None
                oa_pdf = data.get("openAccessPdf", {}).get("url") if isinstance(data.get("openAccessPdf"), dict) else None

                return {
                    "paper_id": data.get("paperId"),
                    "title": data.get("title", ""),
                    "abstract": data.get("abstract", ""),
                    "year": data.get("year"),
                    "venue": data.get("venue", ""),
                    "citation_count": data.get("citationCount", 0),
                    "influential_citation_count": data.get("influentialCitationCount", 0),
                    "reference_count": data.get("referenceCount", 0),
                    "fields_of_study": data.get("fieldsOfStudy", []),
                    "tldr": tldr_text,
                    "open_access_pdf_url": oa_pdf,
                    "authors": authors
                }
        except Exception as e:
            logger.error(f"Error querying Semantic Scholar for {identifier}: {e}")
            return None

semanticscholar_service = SemanticScholarService()
