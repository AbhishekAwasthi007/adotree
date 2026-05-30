import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Numeric, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Tree(Base):
    __tablename__ = "trees"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    fruit_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # e.g. Mango, Avocado
    tree_age: Mapped[int] = mapped_column(Integer, nullable=False) # In years
    health_score: Mapped[float] = mapped_column(Float, default=10.0, nullable=False) # Out of 10
    expected_yield: Mapped[float] = mapped_column(Float, nullable=False) # In kg per year
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False) # Price to adopt
    tree_images: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True) # List of image URLs
    live_camera_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="available", nullable=False) # e.g., available, adopted, reserved
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="trees")
    adoptions: Mapped[List["Adoption"]] = relationship("Adoption", back_populates="tree", cascade="all, delete-orphan")
    harvests: Mapped[List["Harvest"]] = relationship("Harvest", back_populates="tree", cascade="all, delete-orphan")
