import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ChatMessageCreate(BaseModel):
    adoption_id: uuid.UUID
    message: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    adoption_id: uuid.UUID
    sender_id: uuid.UUID
    sender_role: str
    sender_name: str = ""
    message: str
    is_read: bool
    created_at: datetime
