from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    requirement_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    description: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
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

class RequirementAnalysis(Base):
    __tablename__ = "requirement_analysis"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    requirement_db_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id"),
        index=True,
    )

    analysis: Mapped[str] = mapped_column(Text)
    issues: Mapped[list[dict]] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column(Float)
    suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    llm_model: Mapped[str] = mapped_column(String(100))
    prompt_version: Mapped[str] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

class TestCaseGeneration(Base):
    __tablename__ = "test_case_generation"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    requirement_db_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id"),
        index=True,
    )

    generated_test_cases: Mapped[list[dict]] = mapped_column(JSON)
    llm_model: Mapped[str] = mapped_column(String(100))
    prompt_version: Mapped[str] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )