import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class AdminBankAccount(Base):
    __tablename__ = "admin_bank_accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Bank Account Details
    account_holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    ifsc_code: Mapped[str] = mapped_column(String(20), nullable=False)
    upi_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Account Status
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    # Verification
    verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
