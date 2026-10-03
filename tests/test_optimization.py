from uuid import uuid4

import pytest

from app.models.schema import ProcessType
from app.schemas.pydantic_schemas import CalibratedMachineDTO, MachineDTO
from app.services.calibration_engine import calibrate_factory_twin
from app.services.scheduler_service import optimize_shift_schedule


def test_calibration_recovers_known_duty_cycle() -> None:
    machine_id = uuid4()
    machines = [MachineDTO(id=machine_id, name="Motor A", rated_kw=10)]

    duty_cycles, error_pct = calibrate_factory_twin(machines, actual_bill_kwh=4_320)

    assert duty_cycles[str(machine_id)] == pytest.approx(0.6, abs=1e-4)
    assert error_pct < 1e-5


def test_scheduler_moves_runtime_to_cheaper_hours() -> None:
    machine_id = uuid4()
    machines = [
        CalibratedMachineDTO(
            id=machine_id,
            name="Motor A",
            rated_kw=10,
            max_daily_hours=8,
            process_type=ProcessType.SHIFTABLE,
            duty_cycle=0.5,
        )
    ]
    tariffs = {
        str(hour): 0.30 if hour < 6 else 0.05 if 12 <= hour < 16 else 0.12
        for hour in range(24)
    }

    result = optimize_shift_schedule(machines, tariffs, peak_demand_capacity_kw=10)

    hours = result.hourly_schedule[str(machine_id)]
    assert sum(hours) == 4
    assert hours[12:16] == [1, 1, 1, 1]
    assert result.optimized_daily_cost < result.baseline_daily_cost
    assert result.estimated_daily_savings > 0


def test_scheduler_rejects_capacity_below_machine_load() -> None:
    machine = CalibratedMachineDTO(
        id=uuid4(),
        name="Motor A",
        rated_kw=10,
        max_daily_hours=8,
        process_type=ProcessType.SHIFTABLE,
        duty_cycle=0.5,
    )
    tariffs = {str(hour): 0.1 for hour in range(24)}

    with pytest.raises(ValueError, match="No feasible operating schedule"):
        optimize_shift_schedule([machine], tariffs, peak_demand_capacity_kw=9)