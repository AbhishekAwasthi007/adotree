import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.user import UserRole

class UserBase(BaseModel):
    name: str
    mobile: str
    profile_image: Optional[str] = None
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_image: Optional[str] = None
    eco_points: Optional[int] = None
    streak_count: Optional[int] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    eco_points: int
    streak_count: int
    created_at: datetime
    updated_at: datetime
