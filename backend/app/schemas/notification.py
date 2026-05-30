import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    user_id: uuid.UUID
    title: str
    message: str
    notification_type: str = "in_app"

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_read: bool
    created_at: datetime
