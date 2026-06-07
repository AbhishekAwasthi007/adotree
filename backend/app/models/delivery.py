import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    harvest_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("harvests.id", ondelete="CASCADE"), nullable=False, index=True)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="processing", nullable=False) # processing, shipped, out_for_delivery, delivered
    estimated_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    actual_delivery_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivery_proof: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Signature, image URL, confirmation
    
    # Payment release tracking
    payment_released: Mapped[bool] = mapped_column(default=False, nullable=False)
    payment_released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    harvest: Mapped["Harvest"] = relationship("Harvest", back_populates="deliveries")
