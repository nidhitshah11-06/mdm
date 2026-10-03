from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.models.schema import ProcessType

PhoneNumber = Annotated[str, StringConstraints(pattern=r"^\+[1-9]\d{7,14}$")]


class FactoryCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    sector: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    phone_number: PhoneNumber


class FactoryResponse(FactoryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class MachineDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID | None = None
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    rated_kw: Annotated[float, Field(gt=0, le=100_000)]
    process_type: ProcessType = ProcessType.SHIFTABLE
    max_daily_hours: Annotated[float, Field(gt=0, le=24)] = 24.0


class CalibratedMachineDTO(MachineDTO):
    duty_cycle: Annotated[float, Field(ge=0.05, le=1.0)]


class BillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    factory_id: UUID
    billing_month: str
    total_kwh: float
    peak_demand_kva: float
    tod_peak_kwh: float
    tod_offpeak_kwh: float


class CalibrationResponse(BaseModel):
    factory_id: UUID
    calibrated_duty_cycles: dict[str, float]
    simulation_error_pct: float
    timestamp: datetime


class ScheduleResponse(BaseModel):
    factory_id: UUID
    hourly_schedule: dict[str, list[int]]
    optimized_daily_cost: float
    baseline_daily_cost: float
    estimated_daily_savings: float
    savings_percent: float
    peak_capacity_kw: float


class SupervisorNotificationRequest(BaseModel):
    factory_id: UUID
    message_hindi: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
    send_whatsapp: bool = True
    alert_text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)] | None = None


class SupervisorNotificationResponse(BaseModel):
    call_sid: str
    whatsapp_sid: str | None = None
    whatsapp_error: str | None = None