import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cover_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    gallery: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True) # stores a list of gallery image URLs
    soil_type: Mapped[str] = mapped_column(String(100), nullable=False)
    farm_size: Mapped[float] = mapped_column(Float, nullable=False) # In acres/hectares
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="farms")
    trees: Mapped[List["Tree"]] = relationship("Tree", back_populates="farm", cascade="all, delete-orphan")
