"""refactor_user_auth_fields

Revision ID: 9d1a17ffe469
Revises: c3d4e5f6a1b2
Create Date: 2026-08-06 18:09:50.545697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d1a17ffe469'
down_revision: Union[str, None] = 'c3d4e5f6a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename hashed_password to password_hash
    op.alter_column('users', 'hashed_password', new_column_name='password_hash')
    # Add other columns with server defaults to support existing database records
    op.add_column('users', sa.Column('name', sa.String(length=255), nullable=False, server_default=""))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default="false"))
    op.add_column('users', sa.Column('avatar', sa.String(length=1024), nullable=True))
    op.add_column('users', sa.Column('provider', sa.String(length=50), nullable=False, server_default="email"))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default="1"))


def downgrade() -> None:
    op.alter_column('users', 'password_hash', new_column_name='hashed_password')
    op.drop_column('users', 'token_version')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'provider')
    op.drop_column('users', 'avatar')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'name')
