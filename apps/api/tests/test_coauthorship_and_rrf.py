import pytest
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper, Author
from app.graph.coauthorship import coauthorship_analyzer
from app.retrieval.hybrid_rrf import rrf_fusion_reranker
from app.schemas.search import SearchResultItem

@pytest.mark.asyncio
async def test_coauthorship_analyzer(db_session):
    # Setup authors and papers
    a1 = Author(name="Geoffrey Hinton", affiliation="University of Toronto")
    a2 = Author(name="Yann LeCun", affiliation="NYU / Meta")
    a3 = Author(name="Yoshua Bengio", affiliation="Mila")
    db_session.add_all([a1, a2, a3])
    await db_session.flush()

    doc1 = Document(filename="deep_learning_survey.pdf", file_path="/p1", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    doc2 = Document(filename="backpropagation.pdf", file_path="/p2", status=DocumentStatus.COMPLETED.value, source=DocumentSource.UPLOAD.value)
    db_session.add_all([doc1, doc2])
    await db_session.flush()

    p1 = Paper(document_id=doc1.id, title="Deep Learning Nature Review", year=2015)
    p1.authors = [a1, a2, a3]

    p2 = Paper(document_id=doc2.id, title="Learning Representations by Back-propagating Errors", year=1986)
    p2.authors = [a1]

    db_session.add_all([p1, p2])
    await db_session.commit()

    analysis = await coauthorship_analyzer.analyze_coauthorship(db_session)
    assert analysis.total_authors == 3
    assert len(analysis.authors) == 3
    assert len(analysis.collaboration_edges) >= 3  # (Hinton, LeCun), (Hinton, Bengio), (LeCun, Bengio)
    
    # Check top author by paper count (Hinton has 2)
    top_author = analysis.authors[0]
    assert top_author.author_name == "Geoffrey Hinton"
    assert top_author.paper_count == 2
    assert top_author.prolificacy_tier in ["Leading Scientist", "Senior Researcher", "Active Contributor"]

def test_rrf_scoring_and_fusion():
    items = [
        SearchResultItem(
            chunk_id="chunk_1",
            document_id="doc_1",
            paper_title="Graph Neural Networks in Drug Discovery",
            page_number=1,
            section="Introduction",
            text="Graph neural networks enable molecular property prediction and lead optimization.",
            score=0.95,
            source_type="vector"
        ),
        SearchResultItem(
            chunk_id="chunk_2",
            document_id="doc_2",
            paper_title="Transformer Scalability in NLP",
            page_number=2,
            section="Methodology",
            text="Attention mechanisms scale quadratically with sequence length.",
            score=0.88,
            source_type="vector"
        ),
        SearchResultItem(
            chunk_id="chunk_3",
            document_id="doc_3",
            paper_title="Molecular Graph Representations",
            page_number=1,
            section="Abstract",
            text="We evaluate molecular representations and lead optimization metrics.",
            score=0.72,
            source_type="vector"
        )
    ]

    # Compute BM25 scores for query "molecular graph optimization"
    bm25_scored = rrf_fusion_reranker.compute_bm25_scores("molecular graph optimization", items)
    assert len(bm25_scored) == 3
    assert bm25_scored[0][1] > 0.0

    # Fuse rankings
    fused = rrf_fusion_reranker.fuse_rankings(
        query="molecular graph optimization",
        dense_results=items,
        top_k=3
    )
    assert len(fused) == 3
    assert fused[0].chunk_id in ["chunk_1", "chunk_3"]
