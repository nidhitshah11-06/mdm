import asyncio
import logging
import re
from datetime import date
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
import pulp
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.database import get_db
from app.models.schema import Bill, CalibrationLog, Factory, Machine, OptimizationResult, ProcessType, WeeklyObservation
from app.schemas.pydantic_schemas import (
    BillResponse,
    CalibratedMachineDTO,
    CalibrationResponse,
    ClusterBenchmarkItem,
    FactoryCreate,
    FactoryDetailResponse,
    FactoryResponse,
    MachineCreate,
    MachineDTO,
    MachineResponse,
    OptimizationResultResponse,
    ScheduleResponse,
    SupervisorNotificationRequest,
    SupervisorNotificationResponse,
    WeeklyObservationCreate,
    WeeklyObservationResponse,
)
from app.services.benchmark_service import generate_cluster_benchmark
from app.services.calibration_engine import calibrate_factory_twin
from app.services.compliance_service import generate_dpr
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


@router.get(
    "/factory/{factory_id}/weekly-observations",
    response_model=list[WeeklyObservationResponse],
)
async def list_weekly_observations(factory_id: UUID, db: Database) -> list[dict]:
    if await db.get(Factory, factory_id) is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    result = await db.execute(
        select(WeeklyObservation, CalibrationLog)
        .outerjoin(
            CalibrationLog,
            CalibrationLog.source_weekly_observation_id == WeeklyObservation.id,
        )
        .where(WeeklyObservation.factory_id == factory_id)
        .order_by(WeeklyObservation.week_start.desc())
    )
    entries = []
    for observation, calibration in result.all():
        machine_observations = observation.machine_observations
        issues = [
            f"{item['machine_name']}: reported {item['status']}"
            + (f", {item['downtime_hours']:g} hours downtime" if item["downtime_hours"] else "")
            for item in machine_observations
            if item["status"] != "operational" or item["downtime_hours"] > 0
        ]
        entries.append({
            "id": observation.id,
            "factory_id": observation.factory_id,
            "week_start": observation.week_start,
            "hours_observed": observation.hours_observed,
            "total_kwh": observation.total_kwh,
            "production_quantity": observation.production_quantity,
            "production_unit": observation.production_unit,
            "machine_observations": machine_observations,
            "notes": observation.notes,
            "created_at": observation.created_at,
            "calibrated_duty_cycles": calibration.calibrated_duty_cycles if calibration else {},
            "simulation_error_pct": calibration.simulation_error_pct if calibration else None,
            "alert_required": bool(issues),
            "reported_issues": issues,
        })
    return entries


@router.post(
    "/factory/{factory_id}/weekly-observations",
    response_model=WeeklyObservationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def record_weekly_observation(
    factory_id: UUID,
    payload: WeeklyObservationCreate,
    db: Database,
) -> dict:
    factory = await db.get(Factory, factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    if payload.week_start > date.today():
        raise HTTPException(status_code=422, detail="week_start cannot be in the future")
    if any(item.downtime_hours > payload.hours_observed for item in payload.machine_observations):
        raise HTTPException(status_code=422, detail="Machine downtime cannot exceed hours_observed")

    duplicate = await db.execute(
        select(WeeklyObservation.id).where(
            WeeklyObservation.factory_id == factory_id,
            WeeklyObservation.week_start == payload.week_start,
        )
    )
    if duplicate.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409,
            detail="An observation already exists for this factory and week",
        )

    machine_result = await db.execute(
        select(Machine).where(Machine.factory_id == factory_id).order_by(Machine.id)
    )
    machine_rows = list(machine_result.scalars().all())
    if not machine_rows:
        raise HTTPException(status_code=409, detail="Add machine records before weekly calibration")
    machine_by_id = {machine.id: machine for machine in machine_rows}
    submitted_by_id = {item.machine_id: item for item in payload.machine_observations}
    if set(submitted_by_id) != set(machine_by_id):
        raise HTTPException(
            status_code=422,
            detail="Submit one weekly status for every registered machine and no unregistered machines",
        )

    machine_observations = []
    duty_bounds = []
    for machine in machine_rows:
        item = submitted_by_id[machine.id]
        if item.status.value == "down" and item.downtime_hours < payload.hours_observed:
            raise HTTPException(
                status_code=422,
                detail=f"{machine.name}: a machine reported down for the week must use full-period downtime",
            )
        machine_observations.append({
            **item.model_dump(mode="json"),
            "machine_name": machine.name,
        })
        availability = max(0.0, 1.0 - item.downtime_hours / payload.hours_observed)
        duty_bounds.append((0.0, availability))

    machine_dtos = [MachineDTO.model_validate(machine) for machine in machine_rows]
    try:
        duty_cycles, error_pct = await asyncio.to_thread(
            calibrate_factory_twin,
            machine_dtos,
            payload.total_kwh,
            payload.hours_observed,
            duty_bounds,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception("Weekly twin calibration failed for factory %s", factory_id)
        raise HTTPException(status_code=500, detail="Weekly calibration failed") from exc

    observation_id = uuid4()
    observation = WeeklyObservation(
        id=observation_id,
        factory_id=factory_id,
        week_start=payload.week_start,
        hours_observed=payload.hours_observed,
        total_kwh=payload.total_kwh,
        production_quantity=payload.production_quantity,
        production_unit=payload.production_unit,
        machine_observations=machine_observations,
        notes=payload.notes,
    )
    calibration = CalibrationLog(
        factory_id=factory_id,
        calibrated_duty_cycles=duty_cycles,
        simulation_error_pct=error_pct,
        source_weekly_observation_id=observation_id,
        actual_energy_kwh=payload.total_kwh,
        observed_period_hours=payload.hours_observed,
    )
    db.add_all([observation, calibration])
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        cause = getattr(exc.orig, "__cause__", None)
        constraint_name = getattr(exc.orig, "constraint_name", None) or getattr(
            cause, "constraint_name", None
        )
        if constraint_name == "uq_weekly_observation_factory_week":
            raise HTTPException(
                status_code=409,
                detail="An observation already exists for this factory and week",
            ) from exc
        raise
    await db.refresh(observation)
    issues = [
        f"{item['machine_name']}: reported {item['status']}"
        + (f", {item['downtime_hours']:g} hours downtime" if item["downtime_hours"] else "")
        for item in machine_observations
        if item["status"] != "operational" or item["downtime_hours"] > 0
    ]
    return WeeklyObservationResponse.model_validate({
        "id": observation.id,
        "factory_id": observation.factory_id,
        "week_start": observation.week_start,
        "hours_observed": observation.hours_observed,
        "total_kwh": observation.total_kwh,
        "production_quantity": observation.production_quantity,
        "production_unit": observation.production_unit,
        "machine_observations": machine_observations,
        "notes": observation.notes,
        "created_at": observation.created_at,
        "calibrated_duty_cycles": calibration.calibrated_duty_cycles,
        "simulation_error_pct": calibration.simulation_error_pct,
        "alert_required": bool(issues),
        "reported_issues": issues,
    })


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

    opt_result = OptimizationResult(
        factory_id=factory_id,
        hourly_schedule=schedule.hourly_schedule,
        optimized_daily_cost=schedule.optimized_daily_cost,
        baseline_daily_cost=schedule.baseline_daily_cost,
        estimated_daily_savings=schedule.estimated_daily_savings,
        savings_percent=schedule.savings_percent,
        peak_capacity_kw=bill.peak_demand_kva * settings.peak_demand_power_factor,
    )
    db.add(opt_result)
    await db.commit()

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


@router.get("/factory", response_model=list[FactoryResponse])
async def list_factories(db: Database) -> list[Factory]:
    result = await db.execute(select(Factory).order_by(Factory.created_at.desc()))
    return result.scalars().all()


@router.get("/factory/{factory_id}", response_model=FactoryDetailResponse)
async def get_factory(factory_id: UUID, db: Database):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Factory).options(selectinload(Factory.machines)).where(Factory.id == factory_id)
    )
    factory = result.scalar_one_or_none()
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    latest_bill = await _latest_bill(db, factory_id)
    cal_result = await db.execute(
        select(CalibrationLog)
        .where(CalibrationLog.factory_id == factory_id)
        .order_by(CalibrationLog.timestamp.desc())
        .limit(1)
    )
    latest_calibration = cal_result.scalar_one_or_none()
    return FactoryDetailResponse(
        id=factory.id,
        name=factory.name,
        sector=factory.sector,
        phone_number=factory.phone_number,
        udyam_number=factory.udyam_number,
        created_at=factory.created_at,
        machines=[
            MachineResponse(
                id=m.id,
                factory_id=m.factory_id,
                name=m.name,
                rated_kw=m.rated_kw,
                process_type=m.process_type,
                max_daily_hours=m.max_daily_hours,
            )
            for m in factory.machines
        ],
        latest_bill=BillResponse.model_validate(latest_bill) if latest_bill else None,
        latest_calibration=CalibrationResponse(
            factory_id=latest_calibration.factory_id,
            calibrated_duty_cycles=latest_calibration.calibrated_duty_cycles,
            simulation_error_pct=latest_calibration.simulation_error_pct,
            timestamp=latest_calibration.timestamp,
        ) if latest_calibration else None,
    )


@router.get("/factory/{factory_id}/machines", response_model=list[MachineResponse])
async def list_machines(factory_id: UUID, db: Database):
    factory = await db.get(Factory, factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    result = await db.execute(
        select(Machine).where(Machine.factory_id == factory_id).order_by(Machine.name)
    )
    return [
        MachineResponse(
            id=m.id,
            factory_id=m.factory_id,
            name=m.name,
            rated_kw=m.rated_kw,
            process_type=m.process_type,
            max_daily_hours=m.max_daily_hours,
        )
        for m in result.scalars().all()
    ]


@router.post("/factory/{factory_id}/machines", response_model=MachineResponse, status_code=status.HTTP_201_CREATED)
async def add_machine(factory_id: UUID, payload: MachineCreate, db: Database):
    factory = await db.get(Factory, factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    machine = Machine(factory_id=factory_id, **payload.model_dump())
    db.add(machine)
    await db.commit()
    await db.refresh(machine)
    return MachineResponse(
        id=machine.id,
        factory_id=machine.factory_id,
        name=machine.name,
        rated_kw=machine.rated_kw,
        process_type=machine.process_type,
        max_daily_hours=machine.max_daily_hours,
    )


@router.get("/factory/{factory_id}/bills", response_model=list[BillResponse])
async def list_bills(factory_id: UUID, db: Database):
    factory = await db.get(Factory, factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    result = await db.execute(
        select(Bill)
        .where(Bill.factory_id == factory_id)
        .order_by(Bill.billing_month.desc(), Bill.id.desc())
    )
    return result.scalars().all()


@router.get("/factory/{factory_id}/calibration", response_model=CalibrationResponse)
async def get_latest_calibration(factory_id: UUID, db: Database):
    factory = await db.get(Factory, factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    result = await db.execute(
        select(CalibrationLog)
        .where(CalibrationLog.factory_id == factory_id)
        .order_by(CalibrationLog.timestamp.desc())
        .limit(1)
    )
    calibration = result.scalar_one_or_none()
    if calibration is None:
        raise HTTPException(status_code=404, detail="No calibration found for this factory")
    return CalibrationResponse(
        factory_id=calibration.factory_id,
        calibrated_duty_cycles=calibration.calibrated_duty_cycles,
        simulation_error_pct=calibration.simulation_error_pct,
        timestamp=calibration.timestamp,
    )


@router.get("/factory/{factory_id}/schedule", response_model=OptimizationResultResponse)
async def get_latest_schedule(factory_id: UUID, db: Database):
    factory = await db.get(Factory, factory_id)
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    result = await db.execute(
        select(OptimizationResult)
        .where(OptimizationResult.factory_id == factory_id)
        .order_by(OptimizationResult.created_at.desc())
        .limit(1)
    )
    opt = result.scalar_one_or_none()
    if opt is None:
        raise HTTPException(status_code=404, detail="No optimization result found for this factory")
    return OptimizationResultResponse.model_validate(opt)


@router.get("/benchmark/cluster", response_model=list[ClusterBenchmarkItem])
async def cluster_benchmark(sector: str = "textile"):
    items = generate_cluster_benchmark(sector)
    return [ClusterBenchmarkItem(**item) for item in items]


@router.get("/compliance/dpr/{factory_id}")
async def get_dpr(factory_id: UUID, db: Database):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Factory).options(selectinload(Factory.machines)).where(Factory.id == factory_id)
    )
    factory = result.scalar_one_or_none()
    if factory is None:
        raise HTTPException(status_code=404, detail="Factory not found")
    latest_bill = await _latest_bill(db, factory_id)
    cal_result = await db.execute(
        select(CalibrationLog)
        .where(CalibrationLog.factory_id == factory_id)
        .order_by(CalibrationLog.timestamp.desc())
        .limit(1)
    )
    calibration = cal_result.scalar_one_or_none()
    return generate_dpr(factory, latest_bill, calibration)