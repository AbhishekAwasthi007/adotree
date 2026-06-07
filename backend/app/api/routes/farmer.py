import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, get_current_farmer
from app.models.farmer import Farmer
from app.models.farm import Farm
from app.models.tree import Tree
from app.models.harvest import Harvest
from app.models.delivery import Delivery
from app.models.memory import TreeMemory
from app.models.adoption import Adoption
from app.schemas.tree import TreeCreate, TreeResponse, TreeUpdate
from app.schemas.harvest import HarvestCreate, HarvestResponse
from app.core.websocket import manager
from app.services.notification import NotificationService
from app.services.storage import storage_service

router = APIRouter()

@router.get("/trees", response_model=List[TreeResponse])
async def list_farmer_trees(
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all trees registered under the current farmer's farms.
    """
    # Fetch all farms of the farmer
    query_farms = select(Farm.id).where(Farm.farmer_id == current_farmer.id)
    result_farms = await db.execute(query_farms)
    farm_ids = result_farms.scalars().all()
    
    if not farm_ids:
        return []

    query_trees = select(Tree).options(selectinload(Tree.farm)).where(Tree.farm_id.in_(farm_ids))
    result_trees = await db.execute(query_trees)
    trees = result_trees.scalars().all()
    return list(trees)

@router.post("/tree", response_model=TreeResponse, status_code=status.HTTP_201_CREATED)
async def farmer_create_tree(
    payload: TreeCreate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows a verified farmer to add a new tree to one of their registered farms.
    """
    # Verify the farm belongs to the farmer
    query_farm = select(Farm).where((Farm.id == payload.farm_id) & (Farm.farmer_id == current_farmer.id))
    result_farm = await db.execute(query_farm)
    farm = result_farm.scalar_one_or_none()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farm not found or does not belong to you."
        )

    tree = Tree(
        farm_id=payload.farm_id,
        fruit_type=payload.fruit_type,
        tree_age=payload.tree_age,
        health_score=payload.health_score,
        expected_yield=payload.expected_yield,
        price=payload.price,
        tree_images=payload.tree_images,
        live_camera_enabled=payload.live_camera_enabled,
        status="available"
    )
    db.add(tree)
    await db.commit()
    await db.refresh(tree)

    # Eagerly load the farm relationship to avoid lazy-load after session close
    result = await db.execute(
        select(Tree).options(selectinload(Tree.farm)).where(Tree.id == tree.id)
    )
    tree = result.scalar_one()
    return tree

@router.put("/tree/{id}", response_model=TreeResponse)
async def farmer_update_tree(
    id: uuid.UUID,
    payload: TreeUpdate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows a farmer to update a tree's health parameters, age, price, or camera status.
    """
    query = select(Tree).options(selectinload(Tree.farm)).join(Farm, Tree.farm_id == Farm.id).where(
        (Tree.id == id) & (Farm.farmer_id == current_farmer.id)
    )
    result = await db.execute(query)
    tree = result.scalar_one_or_none()

    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree not found or does not belong to you."
        )

    update_data = payload.model_dump(exclude_unset=True)
    
    # Track if health changes or status changes to trigger a realtime WS event
    health_changed = payload.health_score is not None and payload.health_score != tree.health_score
    status_changed = payload.status is not None and payload.status != tree.status
    
    for field, value in update_data.items():
        setattr(tree, field, value)
        
    db.add(tree)
    await db.commit()

    result = await db.execute(
        select(Tree).options(selectinload(Tree.farm)).where(Tree.id == tree.id)
    )
    tree = result.scalar_one()

    # 1. Trigger realtime WS broadcasts if tree gets updated or flowers
    if health_changed or status_changed:
        event_name = "TREE_UPDATED"
        if tree.health_score > 9.5 and health_changed:
            event_name = "TREE_FLOWERING" # Micro-animation prompt!
            
        # Find active adoptions for this tree to push WebSocket alerts
        query_adoptions = select(Adoption).where((Adoption.tree_id == tree.id) & (Adoption.subscription_status == "active"))
        result_adoptions = await db.execute(query_adoptions)
        adoptions = result_adoptions.scalars().all()
        
        for adoption in adoptions:
            await manager.publish_event(
                channel="websocket_adoptions",
                event_type=event_name,
                data={
                    "adoption_id": str(adoption.id),
                    "tree_id": str(tree.id),
                    "custom_tree_name": adoption.custom_tree_name,
                    "health_score": tree.health_score,
                    "status": tree.status
                }
            )

    return tree

@router.post("/story", status_code=status.HTTP_201_CREATED)
async def farmer_upload_story(
    title: str,
    description: str,
    media: Optional[List[str]] = None,
    tree_id: Optional[uuid.UUID] = None,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new Story memory card/update. If a tree_id is provided,
    publishes the update specifically to that tree's timeline;
    otherwise, publishes to ALL active trees under this farmer.
    """
    # 1. Fetch active adoptions to update
    filters = [Adoption.subscription_status == "active"]
    if tree_id:
        filters.append(Adoption.tree_id == tree_id)
    else:
        # Get all trees of this farmer
        query_trees = select(Tree.id).join(Farm, Tree.farm_id == Farm.id).where(Farm.farmer_id == current_farmer.id)
        result_trees = await db.execute(query_trees)
        tree_ids = result_trees.scalars().all()
        filters.append(Adoption.tree_id.in_(tree_ids))
        
    query_adoptions = select(Adoption).where(*filters)
    result_adoptions = await db.execute(query_adoptions)
    adoptions = result_adoptions.scalars().all()
    
    if not adoptions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active adoptions found to receive this story."
        )

    saved_memories = []
    for adoption in adoptions:
        memory = TreeMemory(
            adoption_id=adoption.id,
            title=title,
            description=description,
            media=media or [],
            memory_type="story"
        )
        db.add(memory)
        saved_memories.append(memory)
        
        # Dispatch Realtime WS Alert
        await manager.publish_event(
            channel="websocket_adoptions",
            event_type="NEW_MEMORY",
            data={
                "adoption_id": str(adoption.id),
                "title": title,
                "description": description,
                "media": media
            }
        )

    await db.commit()
    return {"message": f"Story successfully published to {len(saved_memories)} tree timelines."}

@router.post("/harvest", response_model=HarvestResponse, status_code=status.HTTP_201_CREATED)
async def farmer_create_harvest(
    payload: HarvestCreate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Logs tree yield logs. Triggers automatic delivery dispatch tracking.
    """
    # Verify tree ownership
    query = select(Tree).join(Farm, Tree.farm_id == Farm.id).where(
        (Tree.id == payload.tree_id) & (Farm.farmer_id == current_farmer.id)
    )
    result = await db.execute(query)
    tree = result.scalar_one_or_none()
    
    if not tree:
        raise HTTPException(status_code=403, detail="Tree does not belong to your farm.")

    # 1. Save Harvest record
    harvest = Harvest(
        tree_id=tree.id,
        quantity=payload.quantity,
        quality_grade=payload.quality_grade
    )
    db.add(harvest)
    await db.flush() # Yields harvest.id

    # 2. Automatically initialize shipping delivery
    delivery = Delivery(
        harvest_id=harvest.id,
        tracking_number=f"TR-DEL-{uuid.uuid4().hex[:8].upper()}",
        status="processing",
        estimated_delivery=None
    )
    db.add(delivery)

    # 3. Create a memory entry on the tree's timeline
    query_adoptions = select(Adoption).where(
        (Adoption.tree_id == tree.id) & (Adoption.subscription_status == "active")
    )
    result_adoptions = await db.execute(query_adoptions)
    adoptions = result_adoptions.scalars().all()
    
    for adoption in adoptions:
        memory = TreeMemory(
            adoption_id=adoption.id,
            title="Harvest Time! 🍊",
            description=f"Great news! We harvested {payload.quantity}kg of premium (Grade {payload.quality_grade}) fruits from your tree today! We are packaging them for delivery.",
            memory_type="harvest"
        )
        db.add(memory)
        
        # Publish websocket
        await manager.publish_event(
            channel="websocket_adoptions",
            event_type="HARVEST_READY",
            data={
                "adoption_id": str(adoption.id),
                "harvest_id": str(harvest.id),
                "quantity": payload.quantity
            }
        )

    await db.commit()
    await db.refresh(harvest)
    return harvest

@router.post("/livestream", status_code=status.HTTP_200_OK)
async def control_livestream(
    tree_id: uuid.UUID,
    is_live: bool,
    stream_url: Optional[str] = None,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Enables/Disables the live camera stream for an adopted tree.
    Broadcasting a LIVE_STREAM_STARTED WebSocket alert to all tree adopters.
    """
    query = select(Tree).join(Farm, Tree.farm_id == Farm.id).where(
        (Tree.id == tree_id) & (Farm.farmer_id == current_farmer.id)
    )
    result = await db.execute(query)
    tree = result.scalar_one_or_none()
    
    if not tree:
        raise HTTPException(status_code=403, detail="Tree does not belong to your farm.")

    tree.live_camera_enabled = is_live
    db.add(tree)
    await db.commit()

    if is_live:
        # Find active adoptions to alert
        query_adoptions = select(Adoption).where(
            (Adoption.tree_id == tree.id) & (Adoption.subscription_status == "active")
        )
        result_adoptions = await db.execute(query_adoptions)
        adoptions = result_adoptions.scalars().all()
        
        for adoption in adoptions:
            await manager.publish_event(
                channel="websocket_adoptions",
                event_type="LIVE_STREAM_STARTED",
                data={
                    "adoption_id": str(adoption.id),
                    "tree_id": str(tree_id),
                    "stream_url": stream_url or "https://rtsp-stream.tree-adoption.org/live/cam_1"
                }
            )

    return {
        "status": "success",
        "message": f"Livestream successfully {'started' if is_live else 'stopped'}."
    }


@router.post("/upload-image")
async def farmer_upload_image(
    file: UploadFile = File(...),
    current_farmer: Farmer = Depends(get_current_farmer),
):
    """
    Upload an image file (tree photos, farm photos, etc.) and return the stored URL.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed."
        )
    url = await storage_service.upload_file(file, folder="trees")
    return {"url": url}

@router.get("/photo-requests")
async def list_photo_requests(
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all pending/active live photo requests for this farmer.
    """
    # 1. Get all farm IDs for this farmer
    query_farms = select(Farm.id).where(Farm.farmer_id == current_farmer.id)
    result_farms = await db.execute(query_farms)
    farm_ids = result_farms.scalars().all()
    
    if not farm_ids:
        return []
        
    # 2. Get all tree IDs for this farmer
    query_trees = select(Tree.id).where(Tree.farm_id.in_(farm_ids))
    result_trees = await db.execute(query_trees)
    tree_ids = result_trees.scalars().all()
    
    if not tree_ids:
        return []
        
    # 3. Get all adoptions for these trees
    query_adoptions = select(Adoption.id).where(Adoption.tree_id.in_(tree_ids))
    result_adoptions = await db.execute(query_adoptions)
    adoption_ids = result_adoptions.scalars().all()
    
    if not adoption_ids:
        return []
        
    # 4. Find all memories of type "live_photo_request"
    query_requests = select(TreeMemory).options(
        selectinload(TreeMemory.adoption).selectinload(Adoption.tree)
    ).where(
        (TreeMemory.adoption_id.in_(adoption_ids)) &
        (TreeMemory.memory_type == "live_photo_request")
    ).order_by(TreeMemory.created_at.desc())
    result_requests = await db.execute(query_requests)
    requests = result_requests.scalars().all()
    
    return [
        {
            "id": str(r.id),
            "adoption_id": str(r.adoption_id),
            "custom_tree_name": r.adoption.custom_tree_name,
            "tree_id": str(r.adoption.tree_id),
            "fruit_type": r.adoption.tree.fruit_type,
            "title": r.title,
            "description": r.description,
            "created_at": r.created_at.isoformat(),
        }
        for r in requests
    ]

@router.post("/photo-requests/{request_id}/upload")
async def upload_requested_photo(
    request_id: uuid.UUID,
    media_url: str,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: AsyncSession = Depends(get_db)
):
    """
    Fulfills a live photo request by uploading the snapshot.
    """
    from datetime import datetime, timezone

    # 1. Fetch request memory
    query_request = select(TreeMemory).options(
        selectinload(TreeMemory.adoption).selectinload(Adoption.tree).selectinload(Tree.farm)
    ).where(TreeMemory.id == request_id)
    result_request = await db.execute(query_request)
    request_memory = result_request.scalar_one_or_none()
    
    if not request_memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
        
    # 2. Check ownership
    if request_memory.adoption.tree.farm.farmer_id != current_farmer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This tree is not registered to your farm."
        )
        
    # 3. Update memory type to live_photo_upload and attach the photo url
    request_memory.memory_type = "live_photo_upload"
    request_memory.title = "Live Photo Update 📸"
    request_memory.description = "Here is the fresh snapshot of your tree uploaded by the farmer!"
    request_memory.media = [media_url]
    request_memory.created_at = datetime.now(timezone.utc).replace(tzinfo=None)
    
    db.add(request_memory)
    await db.commit()
    return {"status": "success", "message": "Photo uploaded successfully."}
