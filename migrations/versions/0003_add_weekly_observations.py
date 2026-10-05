"""Add weekly observations and calibration lineage."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_add_weekly_observations"
down_revision: Union[str, None] = "0002_add_optimization_results"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "weekly_observations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("factory_id", sa.Uuid(), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("hours_observed", sa.Float(), nullable=False),
        sa.Column("total_kwh", sa.Float(), nullable=False),
        sa.Column("production_quantity", sa.Float(), nullable=True),
        sa.Column("production_unit", sa.String(length=40), nullable=True),
        sa.Column("machine_observations", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["factory_id"], ["factories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "factory_id", "week_start", name="uq_weekly_observation_factory_week"
        ),
    )
    op.create_index(
        "ix_weekly_observations_factory_id", "weekly_observations", ["factory_id"]
    )
    op.add_column(
        "calibration_logs",
        sa.Column("source_weekly_observation_id", sa.Uuid(), nullable=True),
    )
    op.add_column("calibration_logs", sa.Column("actual_energy_kwh", sa.Float(), nullable=True))
    op.add_column(
        "calibration_logs", sa.Column("observed_period_hours", sa.Float(), nullable=True)
    )
    op.create_foreign_key(
        "fk_calibration_logs_weekly_observation",
        "calibration_logs",
        "weekly_observations",
        ["source_weekly_observation_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_calibration_logs_source_weekly_observation_id",
        "calibration_logs",
        ["source_weekly_observation_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_calibration_logs_source_weekly_observation_id",
        table_name="calibration_logs",
    )
    op.drop_constraint(
        "fk_calibration_logs_weekly_observation",
        "calibration_logs",
        type_="foreignkey",
    )
    op.drop_column("calibration_logs", "observed_period_hours")
    op.drop_column("calibration_logs", "actual_energy_kwh")
    op.drop_column("calibration_logs", "source_weekly_observation_id")
    op.drop_index(
        "ix_weekly_observations_factory_id", table_name="weekly_observations"
    )
    op.drop_table("weekly_observations")
