"""Initial integration schema

Revision ID: 001
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sync_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("status", sa.String(16), server_default="pending"),
        sa.Column("attempt_count", sa.Integer(), server_default="0"),
        sa.Column("crm_response", postgresql.JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_sync_logs_order_id", "sync_logs", ["order_id"])
    op.create_index("ix_sync_logs_event_type", "sync_logs", ["event_type"])
    op.create_index("ix_sync_logs_status", "sync_logs", ["status"])

    op.create_table(
        "crm_order_mappings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), unique=True, nullable=False),
        sa.Column("crm_order_id", sa.String(128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_crm_order_mappings_order_id", "crm_order_mappings", ["order_id"])
    op.create_index("ix_crm_order_mappings_crm_order_id", "crm_order_mappings", ["crm_order_id"])


def downgrade() -> None:
    op.drop_table("crm_order_mappings")
    op.drop_table("sync_logs")
