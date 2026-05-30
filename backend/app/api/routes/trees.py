import uuid
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.api.deps import get_db
from app.schemas.tree import TreeResponse
from app.models.tree import Tree
from app.models.farm import Farm

router = APIRouter()

@router.get("/", response_model=List[TreeResponse])
async def list_trees(
    farm_id: Optional[uuid.UUID] = Query(None, description="Filter trees by Farm UUID"),
    fruit_type: Optional[str] = Query(None, description="Filter trees by type of fruit, e.g. Mango, Avocado"),
    status: Optional[str] = Query("available", description="Filter by tree status (available, adopted, maintenance)"),
    max_price: Optional[Decimal] = Query(None, description="Filter by maximum price to adopt"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists and filters trees on the platform with query filters.
    """
    filters = []
    if farm_id:
        filters.append(Tree.farm_id == farm_id)
    if fruit_type:
        filters.append(Tree.fruit_type.ilike(f"%{fruit_type}%"))
    if status:
        filters.append(Tree.status == status)
    if max_price:
        filters.append(Tree.price <= max_price)
        
    from sqlalchemy.orm import selectinload
    
    query = select(Tree).where(and_(*filters) if filters else True).options(
        selectinload(Tree.farm).selectinload(Farm.farmer)
    ).offset(skip).limit(limit)
    result = await db.execute(query)
    trees = result.scalars().all()
    return list(trees)

@router.get("/{id}", response_model=TreeResponse)
async def get_tree_details(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Retrieves the complete profile of a specific tree.
    """
    from sqlalchemy.orm import selectinload
    
    query = select(Tree).where(Tree.id == id).options(
        selectinload(Tree.farm).selectinload(Farm.farmer)
    )
    result = await db.execute(query)
    tree = result.scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested tree not found."
        )
    return tree
