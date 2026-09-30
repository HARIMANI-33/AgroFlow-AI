"""add username column to users table

Revision ID: a1b2c3d4e5f6
Revises: 19c087897292
Create Date: 2026-09-29 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '19c087897292'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add username column, populate from phone for existing users, then make unique."""
    # Step 1: Add username column as nullable first
    op.add_column('users', sa.Column('username', sa.String(100), nullable=True))

    # Step 2: Populate existing rows - use phone as default username for backward compat
    op.execute("UPDATE users SET username = phone WHERE username IS NULL AND phone IS NOT NULL")
    # For any remaining rows without phone, use a generated fallback
    op.execute("UPDATE users SET username = 'user_' || REPLACE(CAST(id AS TEXT), '-', '') WHERE username IS NULL")

    # Step 3: Make non-nullable
    op.alter_column('users', 'username', nullable=False)

    # Step 4: Add unique index
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # Step 5: Make phone nullable (was required before, now optional)
    op.alter_column('users', 'phone', nullable=True)


def downgrade() -> None:
    """Revert username changes."""
    op.drop_index('ix_users_username', table_name='users')
    op.drop_column('users', 'username')
    op.alter_column('users', 'phone', nullable=False)
