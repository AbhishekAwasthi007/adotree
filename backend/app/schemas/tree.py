import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class TreeBase(BaseModel):
    fruit_type: str
    tree_age: int
    health_score: float = 10.0
    expected_yield: float
    price: Decimal
    tree_images: Optional[List[str]] = []
    live_camera_enabled: bool = False
    status: str = "available"

class TreeCreate(TreeBase):
    farm_id: uuid.UUID

class TreeUpdate(BaseModel):
    fruit_type: Optional[str] = None
    tree_age: Optional[int] = None
    health_score: Optional[float] = None
    expected_yield: Optional[float] = None
    price: Optional[Decimal] = None
    tree_images: Optional[List[str]] = None
    live_camera_enabled: Optional[bool] = None
    status: Optional[str] = None

from app.schemas.farm import FarmResponse

class TreeResponse(TreeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    farm_id: uuid.UUID
    created_at: datetime
    farm: Optional[FarmResponse] = None
