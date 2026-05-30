import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TransactionBase(BaseModel):
    transaction_type: str
    status: str
    amount: Decimal
    description: str
    notes: Optional[str] = None

class TransactionCreate(BaseModel):
    transaction_type: str
    amount: Decimal
    from_user_id: Optional[uuid.UUID] = None
    to_user_id: Optional[uuid.UUID] = None
    adoption_id: Optional[uuid.UUID] = None
    payment_id: Optional[uuid.UUID] = None
    delivery_id: Optional[uuid.UUID] = None
    description: str
    notes: Optional[str] = None
    commission_percentage: Optional[Decimal] = None
    commission_amount: Optional[Decimal] = None

class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    from_user_id: Optional[uuid.UUID]
    to_user_id: Optional[uuid.UUID]
    adoption_id: Optional[uuid.UUID]
    payment_id: Optional[uuid.UUID]
    delivery_id: Optional[uuid.UUID]
    released_by_admin_id: Optional[uuid.UUID]
    released_at: Optional[datetime]
    commission_percentage: Optional[Decimal]
    commission_amount: Optional[Decimal]
    created_at: datetime
    updated_at: datetime

class TransactionListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    transaction_type: str
    status: str
    amount: Decimal
    description: str
    created_at: datetime
