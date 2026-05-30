import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, get_current_user
from app.models.chat import ChatMessage
from app.models.adoption import Adoption
from app.models.tree import Tree
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.models.user import User, UserRole
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.core.websocket import manager

router = APIRouter()

def _to_response(msg: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=msg.id,
        adoption_id=msg.adoption_id,
        sender_id=msg.sender_id,
        sender_role=msg.sender_role,
        sender_name=msg.sender.name if msg.sender else "",
        message=msg.message,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )

@router.post("/send", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify adoption exists and user is participant (adopter or farmer of that tree)
    result = await db.execute(
        select(Adoption).options(
            selectinload(Adoption.tree).selectinload(Tree.farm).selectinload(Farm.farmer)
        ).where(Adoption.id == payload.adoption_id)
    )
    adoption = result.scalar_one_or_none()
    if not adoption:
        raise HTTPException(status_code=404, detail="Adoption not found.")

    # Determine sender role
    is_adopter = adoption.user_id == current_user.id
    farmer_user_id = adoption.tree.farm.farmer.user_id if adoption.tree and adoption.tree.farm and adoption.tree.farm.farmer else None
    is_farmer = current_user.id == farmer_user_id or current_user.role in [UserRole.FARMER, UserRole.ADMIN]

    if not is_adopter and not is_farmer:
        raise HTTPException(status_code=403, detail="Not a participant of this adoption.")

    sender_role = "user" if is_adopter else "farmer"

    msg = ChatMessage(
        adoption_id=payload.adoption_id,
        sender_id=current_user.id,
        sender_role=sender_role,
        message=payload.message,
    )
    db.add(msg)
    await db.commit()

    # Reload with sender
    result2 = await db.execute(
        select(ChatMessage).options(selectinload(ChatMessage.sender))
        .where(ChatMessage.id == msg.id)
    )
    msg = result2.scalar_one()

    response_data = _to_response(msg)

    # Push via WebSocket to both participants
    ws_payload = {
        "event": "NEW_CHAT_MESSAGE",
        "data": {
            "adoption_id": str(payload.adoption_id),
            "id": str(msg.id),
            "sender_id": str(msg.sender_id),
            "sender_role": msg.sender_role,
            "sender_name": msg.sender.name,
            "message": msg.message,
            "created_at": msg.created_at.isoformat(),
        }
    }
    await manager.send_to_adoption(str(payload.adoption_id), ws_payload)
    # Also push to the other participant's user socket
    other_user_id = str(farmer_user_id) if is_adopter else str(adoption.user_id)
    await manager.send_to_user(other_user_id, ws_payload)

    return response_data


@router.get("/messages/{adoption_id}", response_model=List[ChatMessageResponse])
async def get_messages(
    adoption_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Adoption).options(
            selectinload(Adoption.tree).selectinload(Tree.farm).selectinload(Farm.farmer)
        ).where(Adoption.id == adoption_id)
    )
    adoption = result.scalar_one_or_none()
    if not adoption:
        raise HTTPException(status_code=404, detail="Adoption not found.")

    farmer_user_id = adoption.tree.farm.farmer.user_id if adoption.tree and adoption.tree.farm and adoption.tree.farm.farmer else None
    is_participant = adoption.user_id == current_user.id or current_user.id == farmer_user_id or current_user.role in [UserRole.FARMER, UserRole.ADMIN]
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not a participant.")

    msgs_result = await db.execute(
        select(ChatMessage).options(selectinload(ChatMessage.sender))
        .where(ChatMessage.adoption_id == adoption_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msgs_result.scalars().all()

    # Mark unread messages as read for current user
    for m in messages:
        if not m.is_read and m.sender_id != current_user.id:
            m.is_read = True
            db.add(m)
    await db.commit()

    return [_to_response(m) for m in messages]


@router.get("/conversations", response_model=List[dict])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all chat threads for the current user (adopter or farmer)."""
    if current_user.role in [UserRole.FARMER, UserRole.ADMIN]:
        # Get all adoptions for trees owned by this farmer
        farmer_result = await db.execute(
            select(Farmer).where(Farmer.user_id == current_user.id)
        )
        farmer = farmer_result.scalar_one_or_none()
        if not farmer:
            return []
        farm_ids_result = await db.execute(select(Farm.id).where(Farm.farmer_id == farmer.id))
        farm_ids = farm_ids_result.scalars().all()
        tree_ids_result = await db.execute(select(Tree.id).where(Tree.farm_id.in_(farm_ids)))
        tree_ids = tree_ids_result.scalars().all()
        adoptions_result = await db.execute(
            select(Adoption).options(
                selectinload(Adoption.user),
                selectinload(Adoption.tree)
            ).where(Adoption.tree_id.in_(tree_ids))
        )
    else:
        adoptions_result = await db.execute(
            select(Adoption).options(
                selectinload(Adoption.user),
                selectinload(Adoption.tree).selectinload(Tree.farm).selectinload(Farm.farmer)
            ).where(Adoption.user_id == current_user.id)
        )

    adoptions = adoptions_result.scalars().all()
    conversations = []

    for adoption in adoptions:
        # Get last message
        last_msg_result = await db.execute(
            select(ChatMessage).options(selectinload(ChatMessage.sender))
            .where(ChatMessage.adoption_id == adoption.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        # Unread count
        unread_result = await db.execute(
            select(ChatMessage).where(
                ChatMessage.adoption_id == adoption.id,
                ChatMessage.sender_id != current_user.id,
                ChatMessage.is_read == False
            )
        )
        unread_count = len(unread_result.scalars().all())

        other_name = adoption.user.name if current_user.role in [UserRole.FARMER, UserRole.ADMIN] else (
            adoption.tree.farm.farmer.farm_name if adoption.tree and adoption.tree.farm and adoption.tree.farm.farmer else "Farmer"
        )

        conversations.append({
            "adoption_id": str(adoption.id),
            "custom_tree_name": adoption.custom_tree_name,
            "tree_type": adoption.tree.fruit_type if adoption.tree else "",
            "tree_image": adoption.tree.tree_images[0] if adoption.tree and adoption.tree.tree_images else "",
            "other_name": other_name,
            "last_message": last_msg.message if last_msg else "",
            "last_message_time": last_msg.created_at.isoformat() if last_msg else adoption.adoption_date.isoformat(),
            "unread_count": unread_count,
        })

    conversations.sort(key=lambda x: x["last_message_time"], reverse=True)
    return conversations
