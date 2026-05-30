import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.tree import TreeResponse

class AdoptionBase(BaseModel):
    custom_tree_name: Optional[str] = None
    occasion_type: Optional[str] = None
    dedication_message: Optional[str] = None
    adoption_duration: int = 12

class AdoptionCreate(AdoptionBase):
    tree_id: uuid.UUID
    payment_id: Optional[uuid.UUID] = None

class AdoptionUpdate(BaseModel):
    custom_tree_name: Optional[str] = None
    dedication_message: Optional[str] = None
    subscription_status: Optional[str] = None

class AdoptionResponse(AdoptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    tree_id: uuid.UUID
    adoption_date: datetime
    subscription_status: str
    tree: Optional[TreeResponse] = None
