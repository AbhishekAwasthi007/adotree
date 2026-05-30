import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class TreeMemoryBase(BaseModel):
    title: str
    description: str
    media: Optional[List[str]] = []
    memory_type: str = "growth_update"

class TreeMemoryCreate(TreeMemoryBase):
    adoption_id: uuid.UUID

class TreeMemoryResponse(TreeMemoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    adoption_id: uuid.UUID
    created_at: datetime
