import os
import re
from typing import Dict, List, Any, Optional
from pypdf import PdfReader
from app.core.logging import logger
from app.ingestion.prompt_defense import prompt_defense

class ParsedPage:
    def __init__(self, page_number: int, text: str):
        self.page_number = page_number
        self.text = text

class ParsedDocument:
    def __init__(
        self,
        title: str,
        authors: List[str],
        abstract: str,
        pages: List[ParsedPage],
        sections: List[Dict[str, Any]],
        references: List[str],
        metadata: Dict[str, Any]
    ):
        self.title = title
        self.authors = authors
        self.abstract = abstract
        self.pages = pages
        self.sections = sections
        self.references = references
        self.metadata = metadata

class PDFParser:
    """Intelligent PDF parser extracting structured research paper content, sections, and metadata."""
    
    SECTION_PATTERNS = [
        (r'^(?:(?:\d+\.?)?\s*)?(?:abstract|summary)\b', 'Abstract'),
        (r'^(?:(?:\d+\.?)?\s*)?introduction\b', 'Introduction'),
        (r'^(?:(?:\d+\.?)?\s*)?(?:related\s+work|prior\s+work|background|literature\s+review)\b', 'Related Work'),
        (r'^(?:(?:\d+\.?)?\s*)?(?:methodology|method|model|approach|architecture|proposed\s+method)\b', 'Methodology'),
        (r'^(?:(?:\d+\.?)?\s*)?(?:experiments|experimental\s+setup|evaluation|implementation)\b', 'Experiments'),
        (r'^(?:(?:\d+\.?)?\s*)?(?:results|empirical\s+results|findings|ablation\s+studies)\b', 'Results'),
        (r'^(?:(?:\d+\.?)?\s*)?(?:discussion|limitations|broader\s+impact)\b', 'Discussion'),
        (r'^(?:(?:\d+\.?)?\s*)?(?:conclusion|concluding\s+remarks|future\s+work)\b', 'Conclusion'),
        (r'^(?:(?:\d+\.?)?\s*)?(?:references|bibliography)\b', 'References'),
    ]

    def parse_pdf(self, file_path: str) -> ParsedDocument:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at: {file_path}")

        try:
            reader = PdfReader(file_path)
            raw_pages: List[ParsedPage] = []
            full_text = ""

            for idx, page in enumerate(reader.pages):
                extracted = page.extract_text() or ""
                clean_text = prompt_defense.sanitize_text(extracted)
                if clean_text:
                    raw_pages.append(ParsedPage(page_number=idx + 1, text=clean_text))
                    full_text += clean_text + "\n\n"

            # Check if there is companion text file (for synthetic or OCR papers)
            txt_path = os.path.splitext(file_path)[0] + ".txt"
            if not raw_pages and os.path.exists(txt_path):
                with open(txt_path, "r", encoding="utf-8") as tf:
                    t_content = prompt_defense.sanitize_text(tf.read())
                    raw_pages.append(ParsedPage(page_number=1, text=t_content))
                    full_text = t_content

            if not raw_pages:
                raw_pages.append(ParsedPage(page_number=1, text="Research paper content."))
                full_text = "Research paper content."

            # Extract Document Title
            title = self._extract_title(reader, raw_pages, file_path)
            
            # Extract Abstract
            abstract = self._extract_abstract(full_text)
            
            # Extract Authors
            authors = self._extract_authors(reader, raw_pages)
            
            # Extract Sections
            sections = self._extract_sections(raw_pages)
            
            # Extract References
            references = self._extract_references(full_text)

            meta = {
                "num_pages": len(raw_pages),
                "author_meta": reader.metadata.author if reader.metadata else None,
                "creation_date": str(reader.metadata.creation_date) if reader.metadata and reader.metadata.creation_date else None,
            }

            return ParsedDocument(
                title=title,
                authors=authors,
                abstract=abstract,
                pages=raw_pages,
                sections=sections,
                references=references,
                metadata=meta
            )
        except Exception as e:
            logger.error(f"Failed to parse PDF {file_path}: {e}", exc_info=True)
            raise

    def _extract_title(self, reader: PdfReader, pages: List[ParsedPage], file_path: str) -> str:
        # Check PDF metadata first
        if reader.metadata and reader.metadata.title:
            t = str(reader.metadata.title).strip()
            if len(t) > 5 and not t.lower().endswith(".pdf") and not t.lower().startswith("untitled"):
                return t

        if pages and pages[0].text:
            lines = [line.strip() for line in pages[0].text.split('\n') if line.strip()]
            # Filter header noise like arXiv headers or page numbers
            candidates = []
            for line in lines[:10]:
                if re.match(r'^(?:arxiv:|draft|conference|ieee|acm|preprint|\d+)', line, re.IGNORECASE):
                    continue
                if len(line) >= 5:
                    candidates.append(line)
            if candidates:
                # Top candidate
                return candidates[0][:300]

        # Fallback to filename
        base = os.path.basename(file_path)
        clean_name = os.path.splitext(base)[0].replace("_", " ").replace("-", " ")
        return clean_name.title()

    def _extract_abstract(self, full_text: str) -> str:
        match = re.search(r'abstract[\s\:\-\—\.\n]+(.*?)(?=\n\s*(?:1\.?\s*)?introduction|\n\s*keywords|\n\s*index\s+terms|\n\s*\d+\.\s+[A-Z])', full_text, re.IGNORECASE | re.DOTALL)
        if match:
            abstract_content = match.group(1).strip()
            # Clean up whitespace
            abstract_content = re.sub(r'\s+', ' ', abstract_content)
            return abstract_content[:3000]
        return ""

    def _extract_authors(self, reader: PdfReader, pages: List[ParsedPage]) -> List[str]:
        authors = []
        if reader.metadata and reader.metadata.author:
            auth_meta = str(reader.metadata.author).strip()
            if auth_meta and len(auth_meta) > 2:
                # Split common delimiters
                parts = re.split(r'[,;]|\band\b', auth_meta)
                for p in parts:
                    name = p.strip()
                    if name and len(name) > 2:
                        authors.append(name)
        
        if not authors and pages and pages[0].text:
            lines = [line.strip() for line in pages[0].text.split('\n') if line.strip()]
            # Look between title (line 0) and Abstract
            in_author_zone = False
            for line in lines[1:8]:
                if re.search(r'abstract', line, re.IGNORECASE):
                    break
                if re.search(r'(@|university|institute|lab|department|research)', line, re.IGNORECASE):
                    continue
                if len(line) > 2 and len(line) < 60 and not re.search(r'\d{4}', line):
                    parts = re.split(r'[,;*†‡]|\band\b', line)
                    for p in parts:
                        name = p.strip()
                        if name and len(name) > 2 and not name.isdigit():
                            authors.append(name)

        return list(dict.fromkeys(authors))[:10]

    def _extract_sections(self, pages: List[ParsedPage]) -> List[Dict[str, Any]]:
        sections = []
        current_section = "Introduction"
        current_paragraphs: List[Dict[str, Any]] = []

        for page in pages:
            lines = page.text.split('\n')
            p_buffer = []
            
            for line in lines:
                clean_l = line.strip()
                if not clean_l:
                    if p_buffer:
                        p_text = " ".join(p_buffer)
                        current_paragraphs.append({
                            "page": page.page_number,
                            "section": current_section,
                            "text": p_text
                        })
                        p_buffer = []
                    continue

                # Check if this line is a section heading
                is_heading = False
                matched_sec = None
                for pattern, sec_name in self.SECTION_PATTERNS:
                    if re.match(pattern, clean_l, re.IGNORECASE):
                        is_heading = True
                        matched_sec = sec_name
                        break

                if is_heading and len(clean_l) < 80:
                    if p_buffer:
                        p_text = " ".join(p_buffer)
                        current_paragraphs.append({
                            "page": page.page_number,
                            "section": current_section,
                            "text": p_text
                        })
                        p_buffer = []
                    
                    if current_paragraphs:
                        sections.append({
                            "name": current_section,
                            "paragraphs": current_paragraphs
                        })
                        current_paragraphs = []
                    current_section = matched_sec
                else:
                    p_buffer.append(clean_l)

            if p_buffer:
                p_text = " ".join(p_buffer)
                current_paragraphs.append({
                    "page": page.page_number,
                    "section": current_section,
                    "text": p_text
                })

        if current_paragraphs:
            sections.append({
                "name": current_section,
                "paragraphs": current_paragraphs
            })

        return sections

    def _extract_references(self, full_text: str) -> List[str]:
        references = []
        match = re.search(r'\n\s*(?:references|bibliography)\s*\n(.*)', full_text, re.IGNORECASE | re.DOTALL)
        if match:
            ref_block = match.group(1)
            # Split numbered references [1], [2], 1., 2.
            raw_refs = re.split(r'\n\s*(?:\[\d+\]|\d+\.)\s*', ref_block)
            for r in raw_refs:
                cleaned = re.sub(r'\s+', ' ', r).strip()
                if len(cleaned) > 15:
                    references.append(cleaned)
        return references[:100]

pdf_parser = PDFParser()
