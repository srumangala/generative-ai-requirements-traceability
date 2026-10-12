from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

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