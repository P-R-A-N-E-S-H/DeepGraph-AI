import httpx
import re
from typing import Optional, Dict, Any
from app.core.logging import logger

class CrossRefService:
    """Service to fetch verified publication metadata, DOI resolutions, and publisher details via CrossRef API."""

    BASE_URL = "https://api.crossref.org/works"

    @staticmethod
    def clean_doi(doi: str) -> str:
        doi = re.sub(r'^https?://(?:dx\.)?doi\.org/', '', doi.strip())
        return doi

    async def fetch_doi_metadata(self, doi: str) -> Optional[Dict[str, Any]]:
        clean_doi_str = self.clean_doi(doi)
        url = f"{self.BASE_URL}/{clean_doi_str}"
        headers = {"User-Agent": "DeepGraphAI/1.0 (mailto:support@deepgraph.ai)"}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    logger.warning(f"CrossRef lookup returned status {res.status_code} for DOI {clean_doi_str}")
                    return None

                data = res.json().get("message", {})
                
                # Extract author names
                authors = []
                for a in data.get("author", []):
                    given = a.get("given", "")
                    family = a.get("family", "")
                    full_name = f"{given} {family}".strip() if (given or family) else a.get("name", "Unknown")
                    affiliation = ""
                    if a.get("affiliation") and len(a["affiliation"]) > 0:
                        affiliation = a["affiliation"][0].get("name", "")
                    authors.append({"name": full_name, "affiliation": affiliation})

                # Extract year
                published_parts = data.get("published-print", {}).get("date-parts") or data.get("published-online", {}).get("date-parts")
                year = published_parts[0][0] if published_parts and len(published_parts[0]) > 0 else None

                # Extract container title (journal / conference)
                container = data.get("container-title", [])
                venue = container[0] if isinstance(container, list) and container else str(container)

                return {
                    "doi": clean_doi_str,
                    "title": data.get("title", ["Untitled"])[0] if data.get("title") else "Untitled",
                    "authors": authors,
                    "year": year,
                    "venue": venue or data.get("publisher", ""),
                    "publisher": data.get("publisher", ""),
                    "citation_count": data.get("is-referenced-by-count", 0),
                    "url": data.get("URL", f"https://doi.org/{clean_doi_str}"),
                    "issn": data.get("ISSN", []),
                    "type": data.get("type", "journal-article")
                }
        except Exception as e:
            logger.error(f"Error fetching CrossRef metadata for {doi}: {e}")
            return None

crossref_service = CrossRefService()
