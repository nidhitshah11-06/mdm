import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Uuid, func
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
            values_callable=lambda values: [value.value for value in values],
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
    raw_ocr_json: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False)

    factory: Mapped[Factory] = relationship(back_populates="bills")


class CalibrationLog(Base):
    __tablename__ = "calibration_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    factory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    calibrated_duty_cycles: Mapped[dict[str, float]] = mapped_column(JSONB, nullable=False)
    simulation_error_pct: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    factory: Mapped[Factory] = relationship(back_populates="calibration_logs")