from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.verify import ClaimVerifyRequest, ClaimVerificationResponse
from app.agents.claim_verifier import claim_verifier

router = APIRouter()

@router.post("/claim", response_model=ClaimVerificationResponse, summary="Verify Scientific Claim & Consensus")
async def verify_claim(
    payload: ClaimVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verifies a scientific claim against indexed literature and produces an evidence-grounded consensus verdict."""
    try:
        return await claim_verifier.verify_claim(session=db, request=payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Claim verification failed: {str(e)}"
        )
