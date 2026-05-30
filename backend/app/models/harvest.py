import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Harvest(Base):
    __tablename__ = "harvests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tree_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trees.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False) # In kg
    quality_grade: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. A, B, C, Premium
    
    harvest_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    tree: Mapped["Tree"] = relationship("Tree", back_populates="harvests")
    deliveries: Mapped[List["Delivery"]] = relationship("Delivery", back_populates="harvest", cascade="all, delete-orphan")
