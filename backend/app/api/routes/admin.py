import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.api.deps import get_db, get_current_admin
from app.schemas.user import UserResponse
from app.schemas.farmer import FarmerResponse
from app.models.user import User
from app.models.farmer import Farmer
from app.models.adoption import Adoption
from app.models.payment import Payment

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows admins to list and search all registered users.
    """
    query = select(User).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    return list(users)

@router.get("/farmers", response_model=List[FarmerResponse])
async def list_all_farmers(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all farmer registrations with verified/unverified statuses.
    """
    query = select(Farmer).offset(skip).limit(limit)
    result = await db.execute(query)
    farmers = result.scalars().all()
    return list(farmers)

@router.put("/farmer/approve", response_model=FarmerResponse)
async def approve_farmer(
    farmer_id: uuid.UUID,
    verified: bool = True,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Approves or revokes farmer credentials and platform verifications.
    """
    query = select(Farmer).where(Farmer.id == farmer_id)
    result = await db.execute(query)
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer registration record not found."
        )
        
    farmer.verified = verified
    db.add(farmer)
    await db.commit()
    await db.refresh(farmer)
    return farmer

@router.get("/analytics", status_code=status.HTTP_200_OK)
async def platform_analytics(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves key platform metrics (eco points total, active adoptions, revenue totals, farmer metrics).
    """
    # 1. Total active adoptions
    count_adoptions = await db.execute(select(func.count()).select_from(Adoption).where(Adoption.subscription_status == "active"))
    total_adoptions = count_adoptions.scalar() or 0
    
    # 2. Total revenue generated
    sum_revenue = await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "completed"))
    total_revenue = sum_revenue.scalar() or 0.0
    
    # 3. User distribution
    count_users = await db.execute(select(func.count()).select_from(User))
    total_users = count_users.scalar() or 0
    
    # 4. Registered farmers
    count_farmers = await db.execute(select(func.count()).select_from(Farmer))
    total_farmers = count_farmers.scalar() or 0

    return {
        "active_adoptions": total_adoptions,
        "total_revenue": float(total_revenue),
        "registered_users": total_users,
        "registered_farmers": total_farmers,
        "nature_eco_points_awarded": total_users * 125 # simulated award totals
    }
