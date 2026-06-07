import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.core.database import Base

class TransactionType(str, enum.Enum):
    ADOPTION_PAYMENT = "adoption_payment"  # User → Admin
    PAYMENT_RELEASE = "payment_release"    # Admin → Farmer
    REFUND = "refund"
    COMMISSION = "commission"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Transaction Details
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Who initiated the transaction
    from_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    to_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # References
    adoption_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("adoptions.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("payments.id", ondelete="SET NULL"), nullable=True, index=True)
    delivery_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("deliveries.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Additional Details
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Release Information (for payment releases by admin)
    released_by_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Commission tracking
    commission_percentage: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    commission_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    from_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[from_user_id], uselist=False)
    to_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[to_user_id], uselist=False)
    released_by_admin: Mapped[Optional["User"]] = relationship("User", foreign_keys=[released_by_admin_id], uselist=False)
    adoption: Mapped[Optional["Adoption"]] = relationship("Adoption", uselist=False)
