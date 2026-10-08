"""rename requirement text to description

Revision ID: 7a693ade95e0
Revises: 793066004477
Create Date: 2026-10-08 10:06:08.033972

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a693ade95e0'
down_revision: Union[str, Sequence[str], None] = '793066004477'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column(
        "requirements",
        "text",
        new_column_name="description",
    )


def downgrade():
    op.alter_column(
        "requirements",
        "description",
        new_column_name="text",
    )
