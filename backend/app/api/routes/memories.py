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
