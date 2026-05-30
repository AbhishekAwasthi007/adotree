import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

class FarmerWalletBase(BaseModel):
    total_earned: Decimal
    available_balance: Decimal
    pending_balance: Decimal
    withdrawn_amount: Decimal

class FarmerWalletUpdate(BaseModel):
    bank_account_holder: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None

class FarmerWalletResponse(FarmerWalletBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    farmer_id: uuid.UUID
    bank_account_holder: Optional[str]
    bank_name: Optional[str]
    bank_account_number: Optional[str]
    bank_ifsc_code: Optional[str]
    upi_id: Optional[str]
    bank_verified: bool
    bank_verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
