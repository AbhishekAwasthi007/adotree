import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AdminBankAccountCreate(BaseModel):
    account_holder_name: str
    bank_name: str
    account_number: str
    ifsc_code: str
    upi_id: Optional[str] = None

class AdminBankAccountUpdate(BaseModel):
    account_holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None

class AdminBankAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    account_holder_name: str
    bank_name: str
    account_number: str
    ifsc_code: str
    upi_id: Optional[str]
    is_active: bool
    verified: bool
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
