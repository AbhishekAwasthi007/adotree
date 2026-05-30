import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class FarmerBase(BaseModel):
    farm_name: str
    farm_description: str
    location: str
    latitude: float
    longitude: float
    organic_certified: bool = False

class FarmerCreate(FarmerBase):
    user_id: uuid.UUID

class FarmerUpdate(BaseModel):
    farm_name: Optional[str] = None
    farm_description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    organic_certified: Optional[bool] = None
    verified: Optional[bool] = None
    rating: Optional[float] = None

class FarmerResponse(FarmerBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    verified: bool
    rating: float
    created_at: datetime
