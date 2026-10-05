import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProcessType(str, enum.Enum):
    CONTINUOUS = "continuous"
    SHIFTABLE = "shiftable"


class Factory(Base):
    __tablename__ = "factories"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sector: Mapped[str] = mapped_column(String(120), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(32), nullable=False)
    udyam_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    machines: Mapped[list["Machine"]] = relationship(
        back_populates="factory", cascade="all, delete-orphan"
    )
    bills: Mapped[list["Bill"]] = relationship(
        back_populates="factory", cascade="all, delete-orphan"
    )
    calibration_logs: Mapped[list["CalibrationLog"]] = relationship(
        back_populates="factory", cascade="all, delete-orphan"
    )
    weekly_observations: Mapped[list["WeeklyObservation"]] = relationship(
        back_populates="factory", cascade="all, delete-orphan"
    )
    optimization_results: Mapped[list["OptimizationResult"]] = relationship(
        back_populates="factory", cascade="all, delete-orphan"
    )


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    factory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    rated_kw: Mapped[float] = mapped_column(Float, nullable=False)
    process_type: Mapped[ProcessType] = mapped_column(
        Enum(
            ProcessType,
            name="process_type",
            values_callable=lambda values: [v.value for v in values],
        ),
        nullable=False,
        default=ProcessType.SHIFTABLE,
    )
    max_daily_hours: Mapped[float] = mapped_column(Float, nullable=False, default=24.0)

    factory: Mapped[Factory] = relationship(back_populates="machines")


class Bill(Base):
    __tablename__ = "bills"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    factory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    billing_month: Mapped[str] = mapped_column(String(7), nullable=False)
    total_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    peak_demand_kva: Mapped[float] = mapped_column(Float, nullable=False)
    tod_peak_kwh: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    tod_offpeak_kwh: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    raw_ocr_json: Mapped[dict] = mapped_column(JSONB, nullable=False)

    factory: Mapped[Factory] = relationship(back_populates="bills")


class CalibrationLog(Base):
    __tablename__ = "calibration_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    factory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    calibrated_duty_cycles: Mapped[dict] = mapped_column(JSONB, nullable=False)
    simulation_error_pct: Mapped[float] = mapped_column(Float, nullable=False)
    source_weekly_observation_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("weekly_observations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    actual_energy_kwh: Mapped[float | None] = mapped_column(Float, nullable=True)
    observed_period_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    factory: Mapped[Factory] = relationship(back_populates="calibration_logs")


class WeeklyObservation(Base):
    __tablename__ = "weekly_observations"
    __table_args__ = (
        UniqueConstraint("factory_id", "week_start", name="uq_weekly_observation_factory_week"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    factory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    hours_observed: Mapped[float] = mapped_column(Float, nullable=False)
    total_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    production_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    production_unit: Mapped[str | None] = mapped_column(String(40), nullable=True)
    machine_observations: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    factory: Mapped[Factory] = relationship(back_populates="weekly_observations")


class OptimizationResult(Base):
    __tablename__ = "optimization_results"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    factory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hourly_schedule: Mapped[dict] = mapped_column(JSONB, nullable=False)
    optimized_daily_cost: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_daily_cost: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_daily_savings: Mapped[float] = mapped_column(Float, nullable=False)
    savings_percent: Mapped[float] = mapped_column(Float, nullable=False)
    peak_capacity_kw: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    factory: Mapped[Factory] = relationship(back_populates="optimization_results")
