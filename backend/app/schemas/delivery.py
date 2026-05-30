import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DeliveryBase(BaseModel):
    harvest_id: uuid.UUID
    tracking_number: Optional[str] = None
    status: str = "processing"
    estimated_delivery: Optional[datetime] = None
    delivery_proof: Optional[str] = None

class DeliveryCreate(DeliveryBase):
    pass

class DeliveryUpdate(BaseModel):
    tracking_number: Optional[str] = None
    status: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivery_proof: Optional[str] = None

class DeliveryResponse(DeliveryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
