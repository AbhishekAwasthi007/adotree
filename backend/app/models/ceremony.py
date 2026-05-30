import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Ceremony(Base):
    __tablename__ = "ceremonies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    adoption_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("adoptions.id", ondelete="CASCADE"), unique=True, nullable=False)
    certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True) # Generated PDF URL
    ceremony_video: Mapped[Optional[str]] = mapped_column(String(500), nullable=True) # Digital ceremony recording/animation link
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    adoption: Mapped["Adoption"] = relationship("Adoption", back_populates="ceremony")
