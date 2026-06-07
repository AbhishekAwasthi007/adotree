import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.schemas.memory import TreeMemoryResponse
from app.models.memory import TreeMemory
from app.models.adoption import Adoption
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[TreeMemoryResponse])
async def get_tree_memories(
    adoption_id: uuid.UUID = Query(..., description="The Adoption UUID of the tree"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves all timeline entries and growth memories for a specific adopted tree.
    Validates ownership of the adoption.
    """
    # 1. Validate ownership
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

    # 2. Query timeline memories sorted by newest first
    query_memories = select(TreeMemory).where(TreeMemory.adoption_id == adoption_id).order_by(TreeMemory.created_at.desc())
    result_memories = await db.execute(query_memories)
    memories = result_memories.scalars().all()
    
    return list(memories)

@router.post("/{adoption_id}/request-photo", status_code=status.HTTP_201_CREATED)
async def request_live_photo(
    adoption_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a live photo request memory card/alert for the farmer.
    """
    # 1. Validate ownership
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

    # 1.5 Check if a request was already sent in the last 24 hours
    from datetime import datetime, timedelta, timezone
    limit = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
    query_existing = select(TreeMemory).where(
        (TreeMemory.adoption_id == adoption_id) &
        (TreeMemory.memory_type.in_(["live_photo_request", "live_photo_upload"])) &
        (TreeMemory.created_at >= limit)
    )
    result_existing = await db.execute(query_existing)
    existing_request = result_existing.scalars().first()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only request one photo per day. Please wait before requesting again."
        )

    # 2. Create the live photo request as a special TreeMemory entry
    memory = TreeMemory(
        adoption_id=adoption.id,
        title="Live Photo Requested",
        description="A fresh live photo request has been sent to the farmer.",
        media=[],
        memory_type="live_photo_request"
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return {"status": "success", "message": "Request sent successfully."}
