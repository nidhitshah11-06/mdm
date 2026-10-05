"""Insert a clearly labelled, synthetic demo factory and records."""

import asyncio
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.schema import (
    Bill,
    CalibrationLog,
    Factory,
    Machine,
    OptimizationResult,
    ProcessType,
    WeeklyObservation,
)
from app.schemas.pydantic_schemas import CalibratedMachineDTO, MachineDTO
from app.services.calibration_engine import calibrate_factory_twin
from app.services.scheduler_service import optimize_shift_schedule

FACTORY_NAME = "DEMO — Synthetic Shree Ganesh Textiles"
MACHINE_SPECS = (
    ("Ring Frame A", 22.0, ProcessType.SHIFTABLE, 16.0),
    ("Air Compressor", 15.0, ProcessType.SHIFTABLE, 16.0),
    ("Dyeing Vat", 30.0, ProcessType.SHIFTABLE, 12.0),
    ("Utility Pump", 7.5, ProcessType.SHIFTABLE, 16.0),
    ("Lighting", 5.0, ProcessType.CONTINUOUS, 24.0),
)
WEEKLY_READINGS = (
    (date(2026, 9, 7), 168.0, 9_800.0, 1_850.0, "kg", "Air Compressor", 8.0),
    (date(2026, 9, 14), 168.0, 10_400.0, 1_920.0, "kg", "Ring Frame A", 4.0),
    (date(2026, 9, 21), 168.0, 10_100.0, 1_880.0, "kg", "Utility Pump", 12.0),
)
TARIFFS = {
    str(hour): 4.5 if 12 <= hour < 18 else 10.0 if 18 <= hour < 22 else 7.0
    for hour in range(24)
}


async def seed_demo() -> None:
    async with SessionLocal() as session:
        result = await session.execute(
            select(Factory).where(Factory.name == FACTORY_NAME)
        )
        if result.scalar_one_or_none() is not None:
            print(f"Demo preset already exists: {FACTORY_NAME}. No changes made.")
            return

        factory = Factory(
            name=FACTORY_NAME,
            sector="Textile (synthetic demo)",
            phone_number="+10000000000",
            udyam_number=None,
        )
        session.add(factory)
        await session.flush()

        machines = [
            Machine(
                factory_id=factory.id,
                name=name,
                rated_kw=rated_kw,
                process_type=process_type,
                max_daily_hours=max_daily_hours,
            )
            for name, rated_kw, process_type, max_daily_hours in MACHINE_SPECS
        ]
        session.add_all(machines)
        await session.flush()

        machine_dtos = [MachineDTO.model_validate(machine) for machine in machines]
        bill = Bill(
            factory_id=factory.id,
            billing_month="2026-09",
            total_kwh=40_300.0,
            peak_demand_kva=90.0,
            tod_peak_kwh=15_800.0,
            tod_offpeak_kwh=24_500.0,
            raw_ocr_json={
                "tod_rates": TARIFFS,
                "synthetic_demo_data": True,
                "disclaimer": "Illustrative values, not measured factory data.",
            },
        )
        session.add(bill)

        latest_duty_cycles: dict[str, float] = {}
        for week_start, hours, energy, production, unit, affected_machine, downtime in WEEKLY_READINGS:
            machine_observations = [
                {
                    "machine_id": str(machine.id),
                    "machine_name": machine.name,
                    "status": "degraded" if machine.name == affected_machine else "operational",
                    "downtime_hours": downtime if machine.name == affected_machine else 0.0,
                    "notes": "Synthetic demo observation.",
                }
                for machine in machines
            ]
            bounds = [
                (
                    0.0,
                    max(
                        0.0,
                        1.0 - observation["downtime_hours"] / hours,
                    ),
                )
                for observation in machine_observations
            ]
            duty_cycles, residual = calibrate_factory_twin(
                machine_dtos, energy, hours, bounds
            )
            latest_duty_cycles = duty_cycles
            observation = WeeklyObservation(
                factory_id=factory.id,
                week_start=week_start,
                hours_observed=hours,
                total_kwh=energy,
                production_quantity=production,
                production_unit=unit,
                machine_observations=machine_observations,
                notes="SYNTHETIC DEMO DATA — not measured at a real factory.",
            )
            session.add(observation)
            await session.flush()
            session.add(
                CalibrationLog(
                    factory_id=factory.id,
                    calibrated_duty_cycles=duty_cycles,
                    simulation_error_pct=residual,
                    source_weekly_observation_id=observation.id,
                    actual_energy_kwh=energy,
                    observed_period_hours=hours,
                    timestamp=datetime.combine(
                        week_start + timedelta(days=6),
                        time(17),
                        tzinfo=UTC,
                    ),
                )
            )

        calibrated_machines = [
            CalibratedMachineDTO.model_validate(
                {
                    **machine_dto.model_dump(),
                    "duty_cycle": latest_duty_cycles[str(machine.id)],
                }
            )
            for machine, machine_dto in zip(machines, machine_dtos, strict=True)
        ]
        schedule = optimize_shift_schedule(
            calibrated_machines,
            TARIFFS,
            peak_demand_capacity_kw=bill.peak_demand_kva * 0.9,
        )
        session.add(
            OptimizationResult(
                factory_id=factory.id,
                hourly_schedule=schedule.hourly_schedule,
                optimized_daily_cost=schedule.optimized_daily_cost,
                baseline_daily_cost=schedule.baseline_daily_cost,
                estimated_daily_savings=schedule.estimated_daily_savings,
                savings_percent=schedule.savings_percent,
                peak_capacity_kw=bill.peak_demand_kva * 0.9,
            )
        )
        await session.commit()
        print(
            f"Inserted synthetic demo factory {factory.id} with "
            f"{len(machines)} machines, one bill, three weekly readings, "
            "calibration history, and an optimizer result."
        )
        print("This preset contains illustrative data, not real factory measurements.")


if __name__ == "__main__":
    asyncio.run(seed_demo())
