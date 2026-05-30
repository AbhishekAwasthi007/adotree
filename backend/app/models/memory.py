import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class TreeMemory(Base):
    __tablename__ = "tree_memories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    adoption_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("adoptions.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    media: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True) # Stores list of photo/video URLs
    memory_type: Mapped[str] = mapped_column(String(100), default="growth_update", nullable=False) # e.g. flowering, leafing, harvest, story, AI_update
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    adoption: Mapped["Adoption"] = relationship("Adoption", back_populates="memories")
