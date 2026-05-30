import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class FarmBase(BaseModel):
    name: str
    cover_image: Optional[str] = None
    gallery: Optional[List[str]] = []
    soil_type: str
    farm_size: float

class FarmCreate(FarmBase):
    farmer_id: uuid.UUID

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    cover_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    soil_type: Optional[str] = None
    farm_size: Optional[float] = None

from app.schemas.farmer import FarmerResponse

class FarmResponse(FarmBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    farmer_id: uuid.UUID
    created_at: datetime
    farmer: Optional[FarmerResponse] = None
