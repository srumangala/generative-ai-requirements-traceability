from sqlalchemy import String, Text, DateTime, Float, ForeignKey, JSON, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.database.base import Base

class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    test_case_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    prerequisites: Mapped[list[str]] = mapped_column(JSON)
    steps: Mapped[list[str]] = mapped_column(JSON)
    expected_result: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
        )   
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    related_requirement: Mapped[str | None] = mapped_column(
        ForeignKey("requirements.requirement_id"),
        nullable=True,
        index=True,
    )

    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )