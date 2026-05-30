import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.schemas.harvest import HarvestResponse
from app.models.harvest import Harvest
from app.models.adoption import Adoption
from app.models.user import User

router = APIRouter()

@router.get("/{tree_id}", response_model=List[HarvestResponse])
async def get_harvests_by_tree(
    tree_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the agricultural harvest yields recorded for a specific tree.
    """
    # Verify user is either admin, farmer, or the current adopter of the tree
    query_adoption = select(Adoption).where(
        (Adoption.tree_id == tree_id) & (Adoption.subscription_status == "active")
    )
    result_adoption = await db.execute(query_adoption)
    adoption = result_adoption.scalar_one_or_none()
    
    if not adoption and current_user.role not in ["farmer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. You do not have active adoptions for this tree."
        )
        
    if adoption and adoption.user_id != current_user.id and current_user.role not in ["farmer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. This adopted tree belongs to another user."
        )

    # Query yields
    query_harvest = select(Harvest).where(Harvest.tree_id == tree_id).order_by(Harvest.harvest_date.desc())
    result_harvest = await db.execute(query_harvest)
    harvests = result_harvest.scalars().all()
    
    return list(harvests)
