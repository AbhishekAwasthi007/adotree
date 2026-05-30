import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_farmer, get_current_user
from app.schemas.farm import FarmCreate, FarmResponse, FarmUpdate, FarmBase
from app.models.farm import Farm
from app.models.farmer import Farmer

router = APIRouter()

@router.post("/", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    payload: FarmBase,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new Farm associated with the current farmer.
    """
    farm = Farm(
        farmer_id=current_farmer.id,
        name=payload.name,
        cover_image=payload.cover_image,
        gallery=payload.gallery,
        soil_type=payload.soil_type,
        farm_size=payload.farm_size
    )
    db.add(farm)
    await db.commit()
    await db.refresh(farm)
    return farm

@router.get("/", response_model=List[FarmResponse])
async def list_farms(
    skip: int = 0,
    limit: int = 100,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists only the farms belonging to the current authenticated farmer.
    """
    query = select(Farm).where(Farm.farmer_id == current_farmer.id).offset(skip).limit(limit)
    result = await db.execute(query)
    farms = result.scalars().all()
    return list(farms)

@router.get("/{id}", response_model=FarmResponse)
async def get_farm_details(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Retrieves the details of a specific farm by its UUID.
    """
    query = select(Farm).where(Farm.id == id)
    result = await db.execute(query)
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    return farm
