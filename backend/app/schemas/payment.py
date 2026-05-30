import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

class PaymentBase(BaseModel):
    amount: Decimal
    payment_gateway: str = "Razorpay"
    transaction_id: str
    status: str = "pending"

class PaymentCreate(BaseModel):
    amount: Decimal
    currency: str = "INR"
    receipt: Optional[str] = None

class PaymentVerify(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    tree_id: uuid.UUID
    custom_tree_name: Optional[str] = None
    occasion_type: Optional[str] = None
    dedication_message: Optional[str] = None

class PaymentResponse(PaymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
