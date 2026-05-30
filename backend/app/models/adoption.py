import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Adoption(Base):
    __tablename__ = "adoptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tree_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trees.id", ondelete="CASCADE"), nullable=False, index=True)
    custom_tree_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # Naming ceremony result
    occasion_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # Birthday, Anniversary, etc.
    dedication_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    adoption_duration: Mapped[int] = mapped_column(Integer, default=12, nullable=False) # Duration in months
    adoption_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    subscription_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False) # active, expired, cancelled

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="adoptions")
    tree: Mapped["Tree"] = relationship("Tree", back_populates="adoptions")
    ceremony: Mapped[Optional["Ceremony"]] = relationship("Ceremony", back_populates="adoption", uselist=False, cascade="all, delete-orphan")
    memories: Mapped[List["TreeMemory"]] = relationship("TreeMemory", back_populates="adoption", cascade="all, delete-orphan")
