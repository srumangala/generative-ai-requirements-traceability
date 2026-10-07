from sqlalchemy import String, Text
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

    text: Mapped[str] = mapped_column(Text)