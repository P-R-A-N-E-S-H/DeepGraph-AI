import pytest
from app.services.export_service import export_service

def test_export_service_bibtex():
    sample_paper = {
        "id": "p-1",
        "title": "Deep Residual Learning for Image Recognition",
        "authors": [{"name": "Kaiming He"}, {"name": "Xiangyu Zhang"}],
        "year": 2016,
        "venue": "CVPR",
        "doi": "10.1109/CVPR.2016.90",
        "arxiv_id": "1512.03385",
        "abstract": "Deeper neural networks are more difficult to train."
    }
    
    bibtex = export_service.generate_bibtex([sample_paper])
    assert "@article{" in bibtex
    assert "title     = {Deep Residual Learning for Image Recognition}" in bibtex
    assert "author    = {Kaiming He and Xiangyu Zhang}" in bibtex
    assert "year      = {2016}" in bibtex
    assert "doi       = {10.1109/CVPR.2016.90}" in bibtex

def test_export_service_ris():
    sample_paper = {
        "id": "p-1",
        "title": "Attention Is All You Need",
        "authors": [{"name": "Ashish Vaswani"}, {"name": "Noam Shazeer"}],
        "year": 2017,
        "venue": "NeurIPS",
        "doi": "10.5555/3295222.3295349"
    }

    ris = export_service.generate_ris([sample_paper])
    assert "TY  - JOUR" in ris
    assert "TI  - Attention Is All You Need" in ris
    assert "AU  - Ashish Vaswani" in ris
    assert "ER  - " in ris

def test_export_service_formatted_citations():
    sample_paper = {
        "id": "p-1",
        "title": "Graph Attention Networks",
        "authors": ["Petar Velickovic", "Guillem Cucurull"],
        "year": 2018,
        "venue": "ICLR"
    }

    apa = export_service.generate_formatted_citation(sample_paper, style="apa")
    assert "Petar Velickovic, Guillem Cucurull (2018). Graph Attention Networks. *ICLR*." in apa

    ieee = export_service.generate_formatted_citation(sample_paper, style="ieee")
    assert "Petar Velickovic, Guillem Cucurull, \"Graph Attention Networks,\" *ICLR*, 2018." in ieee
