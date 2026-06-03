import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from sqlalchemy import Numeric, DateTime, ForeignKey, String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.core.database import Base

class CommissionStatus(str, enum.Enum):
    PENDING = "pending"
    HELD = "held"
    RELEASED = "released"

class Commission(Base):
    __tablename__ = "commissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    adoption_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("adoptions.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Commission Details
    adoption_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    commission_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)  # e.g., 70.00
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Status tracking
    status: Mapped[CommissionStatus] = mapped_column(Enum(CommissionStatus), default=CommissionStatus.PENDING, nullable=False, index=True)
    
    # Release tracking
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    released_by_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Additional Details
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    adoption: Mapped["Adoption"] = relationship("Adoption", uselist=False)
    farmer: Mapped["Farmer"] = relationship("Farmer", uselist=False)
    released_by_admin: Mapped[Optional["User"]] = relationship("User", uselist=False)
