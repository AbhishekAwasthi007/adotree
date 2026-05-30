from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.schemas.user import UserResponse, UserUpdate
from app.models.user import User, UserRole
from app.models.farmer import Farmer

router = APIRouter()

@router.get("/me")
async def read_user_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the current authenticated user's profile details.
    Includes farmer_status for farmer-role users.
    """
    response = {
        "id": str(current_user.id),
        "name": current_user.name,
        "mobile": current_user.mobile,
        "profile_image": current_user.profile_image,
        "role": current_user.role.value,
        "eco_points": current_user.eco_points,
        "streak_count": current_user.streak_count,
        "created_at": current_user.created_at.isoformat(),
        "updated_at": current_user.updated_at.isoformat(),
        "farmer_status": None
    }
    
    # Add farmer approval status for farmer role users
    if current_user.role == UserRole.FARMER:
        farmer_query = select(Farmer).where(Farmer.user_id == current_user.id)
        farmer_result = await db.execute(farmer_query)
        farmer = farmer_result.scalar_one_or_none()
        if farmer:
            response["farmer_status"] = "approved" if farmer.verified else "pending"
        else:
            response["farmer_status"] = "no_profile"
    
    return response

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates current user's profile information.
    """
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
