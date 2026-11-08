"""Changed foriegn key to requirement id and not db only id

Revision ID: f609048ec0eb
Revises: 67ab8eea08b6
Create Date: 2026-11-08 22:08:56.645460

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f609048ec0eb'
down_revision: Union[str, Sequence[str], None] = '67ab8eea08b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Remove old relationship:
    # related_requirement -> requirements.id
    op.drop_constraint(
        'fk_test_cases_related_requirement',
        'test_cases',
        type_='foreignkey'
    )

    # 2. Change INTEGER -> VARCHAR(50)
    op.alter_column(
        'test_cases',
        'related_requirement',
        existing_type=sa.Integer(),
        type_=sa.String(length=50),
        existing_nullable=True
    )

    # 3. Create new relationship:
    # related_requirement -> requirements.requirement_id
    op.create_foreign_key(
        'fk_test_cases_related_requirement',
        'test_cases',
        'requirements',
        ['related_requirement'],
        ['requirement_id']
    )


def downgrade() -> None:
    op.drop_constraint(
        'fk_test_cases_related_requirement',
        'test_cases',
        type_='foreignkey'
    )

    op.alter_column(
        'test_cases',
        'related_requirement',
        existing_type=sa.String(length=50),
        type_=sa.Integer(),
        existing_nullable=True
    )

    op.create_foreign_key(
        'fk_test_cases_related_requirement',
        'test_cases',
        'requirements',
        ['related_requirement'],
        ['id']
    )
