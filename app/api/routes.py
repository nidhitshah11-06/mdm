import asyncio
import logging
import re
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
import pulp
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.schema import Bill, CalibrationLog, Factory, Machine, ProcessType
from app.schemas.pydantic_schemas import (
    BillResponse,
    CalibratedMachineDTO,
    CalibrationResponse,
    FactoryCreate,
    FactoryResponse,
    MachineDTO,
    ScheduleResponse,
    SupervisorNotificationRequest,
    SupervisorNotificationResponse,
)
from app.services.calibration_engine import calibrate_factory_twin
from app.services.notification_service import send_whatsapp_alert, trigger_supervisor_voice_call
from app.services.ocr_service import parse_utility_bill
from app.services.scheduler_service import optimize_shift_schedule

logger = logging.getLogger(__name__)
router = APIRouter()
Database = Annotated[AsyncSession, Depends(get_db)]


async def _latest_bill(db: AsyncSession, factory_id: UUID) -> Bill | None:
    result = await db.execute(
        select(Bill)
        .where(Bill.factory_id == factory_id)
        .order_by(Bill.billing_month.desc(), Bill.id.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.get("/health", tags=["health"])
async def health_check(db: Database) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.post("/factory", response_model=FactoryResponse, status_code=status.HTTP_201_CREATED)
async def register_factory(payload: FactoryCreate, db: Database) -> Factory:
    factory = Factory(**payload.model_dump())
    db.add(factory)
    await db.commit()
    await db.refresh(factory)
    return factory


@router.post("/bill/upload", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def upload_bill(
    factory_id: Annotated[UUID, Form()],
    billing_month: Annotated[str, Form()],
    image: Annotated[UploadFile, File()],
    db: Database,
) -> Bill:
    if re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", billing_month) is None:
        raise HTTPException(status_code=422, detail="billing_month must use YYYY-MM format")
    factory = await db.get(Factory, factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image")

    image_bytes = await image.read(settings.max_upload_bytes + 1)
    if len(image_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Uploaded image exceeds the configured size limit")
    try:
        extracted = await parse_utility_bill(image_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.warning("Bill OCR unavailable: %s", exc)
        raise HTTPException(status_code=503, detail="Bill OCR service is unavailable") from exc

    raw_data = extracted.model_dump(mode="json")
    bill = Bill(
        factory_id=factory_id,
        billing_month=billing_month,
        total_kwh=extracted.total_kwh,
        peak_demand_kva=extracted.peak_demand_kva,
        tod_peak_kwh=extracted.tod_peak_kwh,
        tod_offpeak_kwh=extracted.tod_offpeak_kwh,
        raw_ocr_json=raw_data,
    )
    db.add(bill)

    existing_names_result = await db.execute(
        select(func.lower(Machine.name)).where(Machine.factory_id == factory_id)
    )
    existing_names = set(existing_names_result.scalars().all())
    for detected in extracted.detected_machines:
        normalized_name = detected.name.casefold()
        if normalized_name in existing_names:
            continue
        db.add(
            Machine(
                factory_id=factory_id,
                name=detected.name,
                rated_kw=detected.rated_kw,
                process_type=ProcessType.SHIFTABLE,
                max_daily_hours=24.0,
            )
        )
        existing_names.add(normalized_name)

    await db.commit()
    await db.refresh(bill)
    return bill


@router.post("/twin/calibrate/{factory_id}", response_model=CalibrationResponse)
async def calibrate_factory(factory_id: UUID, db: Database) -> CalibrationLog:
    bill = await _latest_bill(db, factory_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="No bill has been uploaded for this factory")
    machine_result = await db.execute(
        select(Machine).where(Machine.factory_id == factory_id).order_by(Machine.id)
    )
    machines = [MachineDTO.model_validate(machine) for machine in machine_result.scalars().all()]
    try:
        duty_cycles, error_pct = await asyncio.to_thread(
            calibrate_factory_twin,
            machines,
            bill.total_kwh,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception("Twin calibration failed for factory %s", factory_id)
        raise HTTPException(status_code=500, detail="Twin calibration failed") from exc

    calibration = CalibrationLog(
        factory_id=factory_id,
        calibrated_duty_cycles=duty_cycles,
        simulation_error_pct=error_pct,
    )
    db.add(calibration)
    await db.commit()
    await db.refresh(calibration)
    return calibration


@router.post("/twin/optimize/{factory_id}", response_model=ScheduleResponse)
async def optimize_factory(factory_id: UUID, db: Database) -> ScheduleResponse:
    bill = await _latest_bill(db, factory_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="No bill has been uploaded for this factory")
    calibration_result = await db.execute(
        select(CalibrationLog)
        .where(CalibrationLog.factory_id == factory_id)
        .order_by(CalibrationLog.timestamp.desc(), CalibrationLog.id.desc())
        .limit(1)
    )
    calibration = calibration_result.scalar_one_or_none()
    if calibration is None:
        raise HTTPException(status_code=409, detail="Calibrate the factory twin before optimizing")
    machine_result = await db.execute(
        select(Machine).where(Machine.factory_id == factory_id).order_by(Machine.id)
    )
    machines: list[CalibratedMachineDTO] = []
    for machine in machine_result.scalars().all():
        duty_cycle = calibration.calibrated_duty_cycles.get(str(machine.id))
        if duty_cycle is None:
            raise HTTPException(
                status_code=409,
                detail="Machine inventory changed after calibration; recalibrate the factory twin",
            )
        machines.append(
            CalibratedMachineDTO.model_validate(
                {**MachineDTO.model_validate(machine).model_dump(), "duty_cycle": duty_cycle}
            )
        )

    raw_tariffs = bill.raw_ocr_json.get("tod_rates")
    if not isinstance(raw_tariffs, dict):
        raise HTTPException(status_code=422, detail="Bill does not contain usable time-of-day tariffs")
    try:
        schedule = await asyncio.to_thread(
            optimize_shift_schedule,
            machines,
            raw_tariffs,
            bill.peak_demand_kva * settings.peak_demand_power_factor,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except pulp.PulpSolverError as exc:
        logger.exception("MILP solver failed for factory %s", factory_id)
        raise HTTPException(status_code=503, detail="Scheduling solver is unavailable") from exc

    return ScheduleResponse(
        factory_id=factory_id,
        hourly_schedule=schedule.hourly_schedule,
        optimized_daily_cost=schedule.optimized_daily_cost,
        baseline_daily_cost=schedule.baseline_daily_cost,
        estimated_daily_savings=schedule.estimated_daily_savings,
        savings_percent=schedule.savings_percent,
        peak_capacity_kw=bill.peak_demand_kva * settings.peak_demand_power_factor,
    )


@router.post("/notify/supervisor", response_model=SupervisorNotificationResponse)
async def notify_supervisor(
    payload: SupervisorNotificationRequest,
    db: Database,
) -> SupervisorNotificationResponse:
    factory = await db.get(Factory, payload.factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    if payload.send_whatsapp and payload.alert_text is None:
        raise HTTPException(status_code=422, detail="alert_text is required when WhatsApp delivery is enabled")
    try:
        call_sid = await trigger_supervisor_voice_call(factory.phone_number, payload.message_hindi)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Voice notification service is not configured") from exc
    except Exception as exc:
        logger.exception("Twilio voice call failed for factory %s", factory.id)
        raise HTTPException(status_code=502, detail="Voice notification could not be sent") from exc

    whatsapp_sid: str | None = None
    whatsapp_error: str | None = None
    if payload.send_whatsapp and payload.alert_text is not None:
        try:
            whatsapp_sid = await send_whatsapp_alert(factory.phone_number, payload.alert_text)
        except Exception:
            logger.exception("Twilio WhatsApp message failed for factory %s", factory.id)
            whatsapp_error = "Voice call was sent, but WhatsApp delivery failed"
    return SupervisorNotificationResponse(
        call_sid=call_sid,
        whatsapp_sid=whatsapp_sid,
        whatsapp_error=whatsapp_error,
    )