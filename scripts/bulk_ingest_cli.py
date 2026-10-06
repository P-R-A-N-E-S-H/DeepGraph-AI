"""
DeepGraph AI - Bulk Paper Ingestion & CLI Tool
Automates batch harvesting from arXiv, PubMed, and local PDF collections.
"""
import sys
import os
import argparse
import asyncio
import json
import time

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.ingestion.live_fetchers import LivePaperFetcher
from app.core.database import AsyncSessionLocal, init_db
from app.models.document import Document, DocumentStatus, DocumentSource
from app.models.paper import Paper, Author
from app.models.tags import Tag
from app.agents.methodology_agent import methodology_extractor

async def bulk_ingest(query: str, source: str, limit: int, tag_name: str = None):
    print("=" * 70)
    print(f"DeepGraph AI - Bulk Academic Ingestion CLI")
    print(f"Query: '{query}' | Source: {source} | Limit: {limit}")
    print("=" * 70)

    start_t = time.time()
    await init_db()

    print(f"\n[1/3] Querying {source} API for preprints...")
    papers = await LivePaperFetcher.search_all(query=query, source=source, max_results=limit)
    print(f"-> Discovered {len(papers)} candidate papers.\n")

    if not papers:
        print("[!] No papers found. Exiting.")
        return

    print("[2/3] Ingesting documents into PostgreSQL & Vector Store...")
    async with AsyncSessionLocal() as session:
        # Create tag if specified
        tag = None
        if tag_name:
            tag = Tag(name=tag_name, color="#10b981", category="Auto-Import")
            session.add(tag)
            await session.flush()

        ingested_count = 0
        for idx, p_meta in enumerate(papers):
            doc = Document(
                filename=f"{p_meta['source_id']}.pdf",
                file_path=p_meta['pdf_url'],
                status=DocumentStatus.COMPLETED.value,
                source=DocumentSource.ARXIV.value if p_meta['source'] == 'arXiv' else DocumentSource.UPLOAD.value,
                source_url=p_meta['url'],
                arxiv_id=p_meta['source_id']
            )
            session.add(doc)
            await session.flush()

            paper = Paper(
                document_id=doc.id,
                title=p_meta['title'],
                abstract=p_meta['abstract'],
                year=p_meta['year'],
                venue=p_meta['source'],
                arxiv_id=p_meta['source_id'],
                doi=p_meta.get('doi')
            )

            # Authors
            for a_name in p_meta['authors'][:4]:
                author = Author(name=a_name)
                session.add(author)
                paper.authors.append(author)

            if tag:
                paper.tags.append(tag)

            session.add(paper)
            ingested_count += 1
            print(f"  [{idx+1}/{len(papers)}] Indexed: {p_meta['title'][:50]}... ({p_meta['year']})")

        await session.commit()

    duration = round(time.time() - start_t, 2)
    print("\n" + "=" * 70)
    print(f"Ingestion Completed Successfully in {duration}s!")
    print(f"Total Papers Ingested: {ingested_count}")
    print(f"Applied Tag: {tag_name or 'None'}")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="DeepGraph AI Bulk Paper Ingestion CLI")
    parser.add_argument("--query", type=str, default="quantum graph algorithms", help="Search query")
    parser.add_argument("--source", type=str, default="arxiv", choices=["arxiv", "pubmed", "all"], help="Data repository")
    parser.add_argument("--limit", type=int, default=5, help="Maximum papers to harvest")
    parser.add_argument("--tag", type=str, default="CLI-Batch", help="Classification tag")

    args = parser.parse_args()
    asyncio.run(bulk_ingest(args.query, args.source, args.limit, args.tag))

if __name__ == "__main__":
    main()
