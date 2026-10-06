"""
Live Paper Search & Fetch Provider for ArXiv and PubMed.
Enables real-time literature discovery directly from academic open-access repositories.
"""
import xml.etree.ElementTree as ET
import httpx
from typing import List, Dict, Any, Optional
from app.core.logging import logger

class LivePaperFetcher:
    ARXIV_API_URL = "http://export.arxiv.org/api/query"
    PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

    @classmethod
    async def search_arxiv(cls, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search arXiv for academic preprints using the official arXiv API.
        """
        params = {
            "search_query": f"all:{query}",
            "start": 0,
            "max_results": min(max_results, 30),
            "sortBy": "relevance",
            "sortOrder": "descending"
        }
        
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.get(cls.ARXIV_API_URL, params=params)
                response.raise_for_status()
                
            root = ET.fromstring(response.text)
            ns = {
                "atom": "http://www.w3.org/2005/Atom",
                "arxiv": "http://arxiv.org/schemas/atom"
            }
            
            papers = []
            for entry in root.findall("atom:entry", ns):
                title_elem = entry.find("atom:title", ns)
                summary_elem = entry.find("atom:summary", ns)
                published_elem = entry.find("atom:published", ns)
                id_elem = entry.find("atom:id", ns)
                
                title = title_elem.text.strip().replace("\n", " ") if title_elem is not None and title_elem.text else "Untitled"
                summary = summary_elem.text.strip().replace("\n", " ") if summary_elem is not None and summary_elem.text else ""
                published = published_elem.text.strip()[:10] if published_elem is not None and published_elem.text else ""
                raw_id = id_elem.text.strip() if id_elem is not None and id_elem.text else ""
                arxiv_id = raw_id.split("/abs/")[-1] if "/abs/" in raw_id else raw_id
                
                authors = []
                for author_elem in entry.findall("atom:author", ns):
                    name_elem = author_elem.find("atom:name", ns)
                    if name_elem is not None and name_elem.text:
                        authors.append(name_elem.text.strip())
                
                pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf" if arxiv_id else ""
                primary_cat_elem = entry.find("arxiv:primary_category", ns)
                category = primary_cat_elem.attrib.get("term", "cs.AI") if primary_cat_elem is not None else "General"
                
                # DOI if present
                doi_elem = entry.find("arxiv:doi", ns)
                doi = doi_elem.text.strip() if doi_elem is not None and doi_elem.text else None

                papers.append({
                    "id": f"arxiv:{arxiv_id}",
                    "source": "arXiv",
                    "source_id": arxiv_id,
                    "title": title,
                    "abstract": summary,
                    "authors": authors,
                    "published_date": published,
                    "year": int(published[:4]) if len(published) >= 4 and published[:4].isdigit() else 2024,
                    "pdf_url": pdf_url,
                    "url": f"https://arxiv.org/abs/{arxiv_id}",
                    "category": category,
                    "doi": doi
                })
            
            return papers
        except Exception as e:
            logger.warning(f"Live arXiv search failed for query '{query}': {e}")
            return []

    @classmethod
    async def search_pubmed(cls, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search PubMed biomedical database using NCBI Entrez E-utilities.
        """
        try:
            search_params = {
                "db": "pubmed",
                "term": query,
                "retmode": "json",
                "retmax": min(max_results, 25),
                "sort": "relevance"
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.get(cls.PUBMED_SEARCH_URL, params=search_params)
                res.raise_for_status()
                data = res.json()
                id_list = data.get("esearchresult", {}).get("idlist", [])
                
                if not id_list:
                    return []
                
                sum_params = {
                    "db": "pubmed",
                    "id": ",".join(id_list),
                    "retmode": "json"
                }
                sum_res = await client.get(cls.PUBMED_SUMMARY_URL, params=sum_params)
                sum_res.raise_for_status()
                sum_data = sum_res.json()
                
            result = sum_data.get("result", {})
            papers = []
            for pmid in id_list:
                item = result.get(pmid)
                if not item:
                    continue
                
                title = item.get("title", "Untitled").rstrip(".")
                pubdate = item.get("pubdate", "")
                year = int(pubdate[:4]) if len(pubdate) >= 4 and pubdate[:4].isdigit() else 2024
                
                authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
                source_journal = item.get("source", "PubMed")
                
                # Extract DOI if available in articleids
                doi = None
                for article_id in item.get("articleids", []):
                    if article_id.get("idtype") == "doi":
                        doi = article_id.get("value")
                        break

                papers.append({
                    "id": f"pubmed:{pmid}",
                    "source": "PubMed",
                    "source_id": pmid,
                    "title": title,
                    "abstract": f"Biomedical paper published in {source_journal}. PMID: {pmid}",
                    "authors": authors,
                    "published_date": pubdate,
                    "year": year,
                    "pdf_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    "category": source_journal,
                    "doi": doi
                })
            return papers
        except Exception as e:
            logger.warning(f"Live PubMed search failed for query '{query}': {e}")
            return []

    @classmethod
    async def search_all(cls, query: str, source: str = "all", max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Unified search dispatcher across arXiv and PubMed.
        """
        results = []
        if source in ["arxiv", "all"]:
            arxiv_res = await cls.search_arxiv(query, max_results=max_results)
            results.extend(arxiv_res)
        if source in ["pubmed", "all"]:
            pubmed_res = await cls.search_pubmed(query, max_results=max_results)
            results.extend(pubmed_res)
        return results
