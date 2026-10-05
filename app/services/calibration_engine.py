import math

import numpy as np
from scipy.optimize import minimize

from app.schemas.pydantic_schemas import MachineDTO


def calibrate_factory_twin(
    machines: list[MachineDTO],
    actual_bill_kwh: float,
    total_hours: float = 720.0,
    duty_cycle_bounds: list[tuple[float, float]] | None = None,
) -> tuple[dict[str, float], float]:
    if not machines:
        raise ValueError("At least one machine is required for calibration")
    if not math.isfinite(actual_bill_kwh) or actual_bill_kwh <= 0:
        raise ValueError("Actual bill energy must be a finite positive value")
    if not math.isfinite(total_hours) or total_hours <= 0:
        raise ValueError("Total calibration hours must be a finite positive value")

    rated_kw = np.asarray([machine.rated_kw for machine in machines], dtype=float)
    bounds = duty_cycle_bounds or [(0.05, 1.0)] * len(machines)
    if len(bounds) != len(machines) or any(
        not math.isfinite(lower)
        or not math.isfinite(upper)
        or lower < 0
        or upper > 1
        or lower > upper
        for lower, upper in bounds
    ):
        raise ValueError("Duty-cycle bounds must be valid and match the machine count")
    maximum_energy = float(np.sum(rated_kw * total_hours))
    initial_duty = float(np.clip(actual_bill_kwh / maximum_energy, 0.0, 1.0))
    initial_guess = np.asarray(
        [np.clip(initial_duty, lower, upper) for lower, upper in bounds], dtype=float
    )

    def objective(duty_cycles: np.ndarray) -> float:
        simulated_kwh = float(np.sum(rated_kw * total_hours * duty_cycles))
        return abs(simulated_kwh - actual_bill_kwh)

    result = minimize(
        objective,
        initial_guess,
        method="SLSQP",
        bounds=bounds,
        options={"maxiter": 2_000, "ftol": 1e-9},
    )
    if not np.all(np.isfinite(result.x)):
        raise RuntimeError("Calibration optimizer returned non-finite duty cycles")

    duty_cycles = np.asarray(
        [np.clip(duty_cycle, lower, upper) for duty_cycle, (lower, upper) in zip(result.x, bounds, strict=True)],
        dtype=float,
    )
    simulated_kwh = float(np.sum(rated_kw * total_hours * duty_cycles))
    error_pct = abs(simulated_kwh - actual_bill_kwh) / actual_bill_kwh * 100.0
    duty_cycle_mapping = {
        str(machine.id if machine.id is not None else machine.name): float(duty_cycle)
        for machine, duty_cycle in zip(machines, duty_cycles, strict=True)
    }
    return duty_cycle_mapping, error_pct