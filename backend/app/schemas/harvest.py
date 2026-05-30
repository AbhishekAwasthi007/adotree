import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class HarvestBase(BaseModel):
    tree_id: uuid.UUID
    quantity: float
    quality_grade: str

class HarvestCreate(HarvestBase):
    pass

class HarvestResponse(HarvestBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    harvest_date: datetime
