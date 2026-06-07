import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

class CommissionBase(BaseModel):
    adoption_price: Decimal
    commission_percentage: Decimal
    commission_amount: Decimal
    status: str
    notes: Optional[str] = None

class CommissionCreate(BaseModel):
    adoption_id: uuid.UUID
    farmer_id: uuid.UUID
    adoption_price: Decimal
    commission_percentage: Decimal
    commission_amount: Decimal

class CommissionResponse(CommissionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    adoption_id: uuid.UUID
    farmer_id: uuid.UUID
    released_at: Optional[datetime]
    released_by_admin_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

class CommissionListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    adoption_id: uuid.UUID
    farmer_id: uuid.UUID
    adoption_price: Decimal
    commission_percentage: Decimal
    commission_amount: Decimal
    status: str
    created_at: datetime
