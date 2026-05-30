import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user, get_current_farmer
from app.schemas.farmer import FarmerCreate, FarmerResponse, FarmerUpdate, FarmerBase
from app.models.farmer import Farmer
from app.models.user import User, UserRole

router = APIRouter()

@router.post("/", response_model=FarmerResponse, status_code=status.HTTP_201_CREATED)
async def create_farmer_profile(
    payload: FarmerBase,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new Farmer profile and elevates user roles.
    """
    query = select(Farmer).where(Farmer.user_id == current_user.id)
    result = await db.execute(query)
    existing_farmer = result.scalar_one_or_none()
    if existing_farmer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farmer profile already exists for this user account."
        )
        
    farmer = Farmer(
        user_id=current_user.id,
        farm_name=payload.farm_name,
        farm_description=payload.farm_description,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        organic_certified=payload.organic_certified,
        verified=False, # Must be verified by admin
        rating=5.0
    )
    
    # Update user role to farmer
    current_user.role = UserRole.FARMER
    db.add(farmer)
    db.add(current_user)
    await db.commit()
    await db.refresh(farmer)
    return farmer

@router.get("/me", response_model=FarmerResponse)
async def read_farmer_me(current_farmer: Farmer = Depends(get_current_farmer)):
    """
    Retrieves the current authenticated farmer's profile.
    """
    return current_farmer

@router.put("/me", response_model=FarmerResponse)
async def update_farmer_me(
    payload: FarmerUpdate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the current farmer's profile.
    """
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_farmer, field, value)
        
    db.add(current_farmer)
    await db.commit()
    await db.refresh(current_farmer)
    return current_farmer

@router.get("/{id}", response_model=FarmerResponse)
async def get_farmer_by_id(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Retrieves details of a specific farmer by their UUID.
    """
    query = select(Farmer).where(Farmer.id == id)
    result = await db.execute(query)
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer not found.")
    return farmer
