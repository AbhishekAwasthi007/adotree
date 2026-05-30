import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.schemas.delivery import DeliveryResponse
from app.models.delivery import Delivery
from app.models.harvest import Harvest
from app.models.adoption import Adoption
from app.models.user import User

router = APIRouter()

@router.get("/me", response_model=List[DeliveryResponse])
async def get_my_deliveries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves all ongoing and completed fruit harvest deliveries for the current adopter.
    """
    # Trace user deliveries through their adopted trees and harvests
    query = (
        select(Delivery)
        .join(Harvest, Delivery.harvest_id == Harvest.id)
        .join(Adoption, Harvest.tree_id == Adoption.tree_id)
        .where(
            (Adoption.user_id == current_user.id) &
            (Adoption.subscription_status == "active")
        )
        .order_by(Delivery.created_at.desc())
    )
    result = await db.execute(query)
    deliveries = result.scalars().all()
    return list(deliveries)

@router.get("/{id}", response_model=DeliveryResponse)
async def get_delivery_by_id(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves complete tracking details and proof for a specific delivery.
    """
    query = select(Delivery).where(Delivery.id == id)
    result = await db.execute(query)
    delivery = result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested delivery tracking record not found."
        )
        
    # Verify ownership of this delivery
    query_ownership = (
        select(Adoption)
        .join(Harvest, Adoption.tree_id == Harvest.tree_id)
        .where(
            (Harvest.id == delivery.harvest_id) &
            (Adoption.user_id == current_user.id)
        )
    )
    result_ownership = await db.execute(query_ownership)
    ownership = result_ownership.scalar_one_or_none()
    
    if not ownership and current_user.role not in ["farmer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. You do not own this harvest delivery."
        )
        
    return delivery
