import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.schemas.ceremony import CeremonyResponse
from app.models.ceremony import Ceremony
from app.models.adoption import Adoption
from app.models.user import User

router = APIRouter()

@router.get("/{adoption_id}", response_model=CeremonyResponse)
async def get_ceremony_by_adoption(
    adoption_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the digital ceremony details and PDF certificate URL for an adoption.
    Validates ownership of the adoption before returning records.
    """
    # 1. Validate ownership of adoption
    query_adoption = select(Adoption).where(Adoption.id == adoption_id)
    result_adoption = await db.execute(query_adoption)
    adoption = result_adoption.scalar_one_or_none()
    
    if not adoption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption record not found.")
        
    if adoption.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. You do not own this adopted tree."
        )

    # 2. Retrieve Ceremony
    query_ceremony = select(Ceremony).where(Ceremony.adoption_id == adoption_id)
    result_ceremony = await db.execute(query_ceremony)
    ceremony = result_ceremony.scalar_one_or_none()
    
    if not ceremony:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ceremony not finalized yet. We are still generating your certificate."
        )
        
    return ceremony
