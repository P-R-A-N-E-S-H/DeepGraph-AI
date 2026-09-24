import re
from typing import List, Dict, Any, Optional
from datetime import datetime

class ExportService:
    """Service to export papers and citations into academic bibliographic formats."""

    @staticmethod
    def _clean_bib_key(title: str, year: Optional[int], authors: List[str]) -> str:
        first_author = "Unknown"
        if authors and len(authors) > 0:
            first_author = authors[0].split()[-1]
        elif isinstance(authors, str) and authors:
            first_author = authors.split()[-1]
            
        first_author = re.sub(r'[^a-zA-Z0-9]', '', first_author)
        yr_str = str(year) if year else str(datetime.now().year)
        
        words = re.findall(r'\b[a-zA-Z]{3,}\b', title)
        title_word = words[0].capitalize() if words else "Paper"
        
        return f"{first_author.lower()}{yr_str}{title_word.lower()}"

    @classmethod
    def generate_bibtex_entry(cls, paper: Dict[str, Any]) -> str:
        title = paper.get("title", "Untitled")
        authors = paper.get("authors", [])
        if isinstance(authors, list):
            author_names = []
            for a in authors:
                if isinstance(a, dict):
                    author_names.append(a.get("name", ""))
                else:
                    author_names.append(str(a))
            author_str = " and ".join(filter(None, author_names))
        else:
            author_str = str(authors)

        year = paper.get("year") or datetime.now().year
        venue = paper.get("venue") or paper.get("journal") or "arXiv preprint"
        doi = paper.get("doi")
        arxiv_id = paper.get("arxiv_id")
        abstract = paper.get("abstract")

        key = cls._clean_bib_key(title, year, [a for a in author_str.split(" and ") if a])

        lines = [f"@article{{{key},"]
        lines.append(f"  title     = {{{title}}},")
        if author_str:
            lines.append(f"  author    = {{{author_str}}},")
        lines.append(f"  journal   = {{{venue}}},")
        lines.append(f"  year      = {{{year}}},")
        if doi:
            lines.append(f"  doi       = {{{doi}}},")
        if arxiv_id:
            lines.append(f"  eprint    = {{{arxiv_id}}},")
            lines.append(f"  archivePrefix = {{arXiv}},")
        if abstract:
            cleaned_abstract = abstract.replace("\n", " ").strip()
            lines.append(f"  abstract  = {{{cleaned_abstract}}},")
        lines.append("}")
        return "\n".join(lines)

    @classmethod
    def generate_bibtex(cls, papers: List[Dict[str, Any]]) -> str:
        entries = [cls.generate_bibtex_entry(p) for p in papers]
        return "\n\n".join(entries)

    @classmethod
    def generate_ris_entry(cls, paper: Dict[str, Any]) -> str:
        lines = ["TY  - JOUR"]
        title = paper.get("title", "Untitled")
        lines.append(f"TI  - {title}")

        authors = paper.get("authors", [])
        if isinstance(authors, list):
            for a in authors:
                name = a.get("name", "") if isinstance(a, dict) else str(a)
                if name:
                    lines.append(f"AU  - {name}")
        elif authors:
            lines.append(f"AU  - {authors}")

        if paper.get("year"):
            lines.append(f"PY  - {paper['year']}")
        if paper.get("venue"):
            lines.append(f"JO  - {paper['venue']}")
        if paper.get("doi"):
            lines.append(f"DO  - {paper['doi']}")
        if paper.get("arxiv_id"):
            lines.append(f"UR  - https://arxiv.org/abs/{paper['arxiv_id']}")
        if paper.get("abstract"):
            lines.append(f"AB  - {paper['abstract'].replace(chr(10), ' ')}")
        lines.append("ER  - ")
        return "\n".join(lines)

    @classmethod
    def generate_ris(cls, papers: List[Dict[str, Any]]) -> str:
        return "\n\n".join([cls.generate_ris_entry(p) for p in papers])

    @classmethod
    def generate_csl_json(cls, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        csl_list = []
        for paper in papers:
            authors = []
            raw_authors = paper.get("authors", [])
            if isinstance(raw_authors, list):
                for a in raw_authors:
                    name = a.get("name", "") if isinstance(a, dict) else str(a)
                    parts = name.split()
                    if len(parts) > 1:
                        authors.append({"family": parts[-1], "given": " ".join(parts[:-1])})
                    elif parts:
                        authors.append({"family": parts[0]})
            item = {
                "id": str(paper.get("id", "")),
                "type": "article-journal",
                "title": paper.get("title", ""),
                "author": authors,
                "container-title": paper.get("venue", "arXiv"),
                "issued": {"date-parts": [[paper.get("year") or datetime.now().year]]},
                "DOI": paper.get("doi"),
                "abstract": paper.get("abstract")
            }
            csl_list.append({k: v for k, v in item.items() if v is not None})
        return csl_list

    @classmethod
    def generate_formatted_citation(cls, paper: Dict[str, Any], style: str = "apa") -> str:
        style = style.lower()
        title = paper.get("title", "Untitled")
        authors = paper.get("authors", [])
        author_names = []
        if isinstance(authors, list):
            for a in authors:
                author_names.append(a.get("name", "") if isinstance(a, dict) else str(a))
        author_str = ", ".join(author_names) if author_names else "Anonymous"
        year = paper.get("year", "n.d.")
        venue = paper.get("venue", "arXiv")
        doi = f" https://doi.org/{paper['doi']}" if paper.get("doi") else ""

        if style == "ieee":
            return f"{author_str}, \"{title},\" *{venue}*, {year}.{doi}"
        elif style == "chicago":
            return f"{author_str}. \"{title}.\" *{venue}* ({year}).{doi}"
        elif style == "harvard":
            return f"{author_str} ({year}) '{title}', *{venue}*.{doi}"
        else: # APA 7th
            return f"{author_str} ({year}). {title}. *{venue}*.{doi}"

export_service = ExportService()
