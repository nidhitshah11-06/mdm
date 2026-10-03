"""Create the SME-Twin domain schema."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    process_type = postgresql.ENUM(
        "continuous", "shiftable", name="process_type", create_type=False
    )
    process_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "factories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("sector", sa.String(length=120), nullable=False),
        sa.Column("phone_number", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "machines",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("factory_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("rated_kw", sa.Float(), nullable=False),
        sa.Column("process_type", process_type, nullable=False),
        sa.Column("max_daily_hours", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["factory_id"], ["factories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_machines_factory_id", "machines", ["factory_id"])
    op.create_table(
        "bills",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("factory_id", sa.Uuid(), nullable=False),
        sa.Column("billing_month", sa.String(length=7), nullable=False),
        sa.Column("total_kwh", sa.Float(), nullable=False),
        sa.Column("peak_demand_kva", sa.Float(), nullable=False),
        sa.Column("tod_peak_kwh", sa.Float(), nullable=False),
        sa.Column("tod_offpeak_kwh", sa.Float(), nullable=False),
        sa.Column("raw_ocr_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["factory_id"], ["factories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bills_factory_id", "bills", ["factory_id"])
    op.create_table(
        "calibration_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("factory_id", sa.Uuid(), nullable=False),
        sa.Column("calibrated_duty_cycles", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("simulation_error_pct", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["factory_id"], ["factories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_calibration_logs_factory_id", "calibration_logs", ["factory_id"])


def downgrade() -> None:
    op.drop_index("ix_calibration_logs_factory_id", table_name="calibration_logs")
    op.drop_table("calibration_logs")
    op.drop_index("ix_bills_factory_id", table_name="bills")
    op.drop_table("bills")
    op.drop_index("ix_machines_factory_id", table_name="machines")
    op.drop_table("machines")
    postgresql.ENUM("continuous", "shiftable", name="process_type").drop(
        op.get_bind(), checkfirst=True
    )
    op.drop_table("factories")