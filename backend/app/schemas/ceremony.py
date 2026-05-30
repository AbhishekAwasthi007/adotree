import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class CeremonyBase(BaseModel):
    adoption_id: uuid.UUID
    certificate_url: Optional[str] = None
    ceremony_video: Optional[str] = None

class CeremonyCreate(CeremonyBase):
    pass

class CeremonyResponse(CeremonyBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
