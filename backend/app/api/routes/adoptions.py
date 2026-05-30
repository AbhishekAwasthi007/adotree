from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, get_current_user
from app.schemas.adoption import AdoptionCreate, AdoptionResponse
from app.models.adoption import Adoption
from app.models.tree import Tree
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.models.user import User
from app.services.payment import RazorpayService

router = APIRouter()
razorpay_service = RazorpayService()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_adoption_order(
    payload: AdoptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a pending adoption for a tree and initiates a Razorpay Order.
    Returns the Razorpay Order ID and pending adoption details to the client.
    """
    # Verify if tree is available
    query = select(Tree).where(Tree.id == payload.tree_id)
    result = await db.execute(query)
    tree = result.scalar_one_or_none()
    
    if not tree:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found.")
        
    if tree.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This tree is already adopted or under maintenance."
        )

    # 1. Create a pending adoption record in Postgres
    adoption = Adoption(
        user_id=current_user.id,
        tree_id=tree.id,
        custom_tree_name=payload.custom_tree_name or f"My {tree.fruit_type}",
        occasion_type=payload.occasion_type,
        dedication_message=payload.dedication_message,
        adoption_duration=payload.adoption_duration,
        subscription_status="pending" # Activated upon webhook verification
    )
    
    db.add(adoption)
    await db.flush() # Yields adoption.id

    # 2. Call Razorpay to generate order
    order_data = await razorpay_service.create_order(
        amount_in_rupees=float(tree.price),
        receipt_id=str(adoption.id)
    )
    
    await db.commit()

    return {
        "adoption_id": adoption.id,
        "subscription_status": "pending",
        "price": tree.price,
        "razorpay_order_id": order_data.get("id"),
        "razorpay_key_id": order_data.get("key_id", "rzp_test_mockkeyid123")
    }

@router.get("/my-orchard", response_model=List[AdoptionResponse])
async def get_my_orchard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Adoption).options(
        selectinload(Adoption.tree).selectinload(Tree.farm).selectinload(Farm.farmer)
    ).where(
        (Adoption.user_id == current_user.id) &
        (Adoption.subscription_status == "active")
    )
    result = await db.execute(query)
    adoptions = result.scalars().all()
    return list(adoptions)
