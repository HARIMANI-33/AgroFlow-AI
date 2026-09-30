"""add pickup_location to crop_listings

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-29 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add pickup_location column as nullable to crop_listings."""
    op.add_column('crop_listings', sa.Column('pickup_location', sa.String(255), nullable=True))


def downgrade() -> None:
    """Revert pickup_location column from crop_listings."""
    op.drop_column('crop_listings', 'pickup_location')
