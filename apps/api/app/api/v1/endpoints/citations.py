from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.citations import CitationNetworkAnalysisResponse
from app.graph.citation_network import citation_analyzer

router = APIRouter()

@router.get("/analysis", response_model=CitationNetworkAnalysisResponse, summary="Analyze Citation Network & Bibliographic Coupling")
async def analyze_citations(
    db: AsyncSession = Depends(get_db)
):
    """Computes full bibliographic coupling, co-citation clusters, HITS hub/authority scores, and PageRank."""
    try:
        return await citation_analyzer.analyze_network(session=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Citation network analysis failed: {str(e)}"
        )
