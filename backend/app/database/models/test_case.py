from sqlalchemy import String, Text, DateTime, Float, ForeignKey, JSON, func
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

class TestCaseAnalysis(Base):
    __tablename__ = "test_case_analysis"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    test_case_db_id: Mapped[int] = mapped_column(
        ForeignKey("test_cases.id"),
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