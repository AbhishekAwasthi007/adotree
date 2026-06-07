import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import Numeric, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class FarmerWallet(Base):
    __tablename__ = "farmer_wallets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Wallet Balance
    total_earned: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    available_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    pending_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    withdrawn_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    
    # Bank Account Details
    bank_account_holder: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bank_ifsc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    upi_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    bank_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    bank_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    farmer: Mapped["Farmer"] = relationship("Farmer", uselist=False)
    # TODO: Fix this relationship - currently causes SQLAlchemy configuration error
    # The relationship tries to join FarmerWallet -> Farmer -> Transaction which is complex
    # Commenting out for now; can be re-implemented as a query method if needed
    # transactions: Mapped[List["Transaction"]] = relationship(
    #     "Transaction",
    #     uselist=True,
    #     viewonly=True,
    #     lazy="select",
    #     sync_backref=False,
    #     foreign_keys="[FarmerWallet.farmer_id]",
    #     primaryjoin="and_("
    #         "foreign(FarmerWallet.farmer_id) == Farmer.id, "
    #         "Farmer.user_id == foreign(Transaction.to_user_id)"
    #     ")"
    # )
