"""Add optimization_results table."""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_add_optimization_results"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("factories", sa.Column("udyam_number", sa.String(length=30), nullable=True))
    op.create_table(
        "optimization_results",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("factory_id", sa.Uuid(), nullable=False),
        sa.Column("hourly_schedule", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("optimized_daily_cost", sa.Float(), nullable=False),
        sa.Column("baseline_daily_cost", sa.Float(), nullable=False),
        sa.Column("estimated_daily_savings", sa.Float(), nullable=False),
        sa.Column("savings_percent", sa.Float(), nullable=False),
        sa.Column("peak_capacity_kw", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["factory_id"], ["factories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_optimization_results_factory_id", "optimization_results", ["factory_id"])


def downgrade() -> None:
    op.drop_index("ix_optimization_results_factory_id", table_name="optimization_results")
    op.drop_table("optimization_results")
    op.drop_column("factories", "udyam_number")
