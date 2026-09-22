import pytest
from app.ingestion.pdf_parser import PDFParser, ParsedPage
from app.ingestion.chunker import StructureAwareChunker, TextChunk
from app.ingestion.entity_extractor import EntityExtractor

def test_pdf_parser_section_detection():
    parser = PDFParser()
    pages = [
        ParsedPage(page_number=1, text="Deep Residual Learning\nAbstract\nWe present deep residual learning.\n1. Introduction\nDeeper neural networks are difficult to train."),
        ParsedPage(page_number=2, text="2. Methodology\nWe formulate residual mapping.\n3. Experiments\nWe evaluate on ImageNet.")
    ]
    sections = parser._extract_sections(pages)
    section_names = [s["name"] for s in sections]
    assert "Introduction" in section_names or "Abstract" in section_names

def test_structure_aware_chunker():
    chunker = StructureAwareChunker(target_chunk_tokens=50, max_chunk_tokens=100)
    parser = PDFParser()
    pages = [ParsedPage(page_number=1, text="Introduction\n" + ("Deep learning is transforming AI. " * 30))]
    parsed_doc = parser.parse_pdf.__wrapped__ if hasattr(parser.parse_pdf, "__wrapped__") else None
    
    from app.ingestion.pdf_parser import ParsedDocument
    doc = ParsedDocument(
        title="Test Paper",
        authors=["Author A"],
        abstract="Test Abstract",
        pages=pages,
        sections=[{"name": "Introduction", "paragraphs": [{"page": 1, "text": "Deep learning is transforming AI. " * 30}]}],
        references=[],
        metadata={}
    )
    chunks = chunker.chunk_document(doc)
    assert len(chunks) >= 1
    assert chunks[0].section in ["Abstract", "Introduction"]
    assert chunks[0].page_number == 1

def test_entity_extractor_deterministic():
    extractor = EntityExtractor()
    sample_text = "We evaluate ResNet-50 and Vision Transformer on CIFAR-10 and ImageNet, achieving 94.2% top-1 accuracy using Self-Attention."
    payload = extractor.extract_deterministic(sample_text)

    assert "ResNet-50" in payload.models or "Vision Transformer" in payload.models
    assert "CIFAR-10" in payload.datasets or "ImageNet" in payload.datasets
    assert "Self-Attention" in payload.methods
    assert len(payload.metrics) >= 1
    assert payload.metrics[0].value == 94.2
