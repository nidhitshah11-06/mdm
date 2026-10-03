import math

import numpy as np
from scipy.optimize import minimize

from app.schemas.pydantic_schemas import MachineDTO


def calibrate_factory_twin(
    machines: list[MachineDTO],
    actual_bill_kwh: float,
    total_hours: float = 720.0,
) -> tuple[dict[str, float], float]:
    if not machines:
        raise ValueError("At least one machine is required for calibration")
    if not math.isfinite(actual_bill_kwh) or actual_bill_kwh <= 0:
        raise ValueError("Actual bill energy must be a finite positive value")
    if not math.isfinite(total_hours) or total_hours <= 0:
        raise ValueError("Total calibration hours must be a finite positive value")

    rated_kw = np.asarray([machine.rated_kw for machine in machines], dtype=float)
    maximum_energy = float(np.sum(rated_kw * total_hours))
    initial_duty = float(np.clip(actual_bill_kwh / maximum_energy, 0.05, 1.0))
    initial_guess = np.full(len(machines), initial_duty, dtype=float)

    def objective(duty_cycles: np.ndarray) -> float:
        simulated_kwh = float(np.sum(rated_kw * total_hours * duty_cycles))
        return abs(simulated_kwh - actual_bill_kwh)

    result = minimize(
        objective,
        initial_guess,
        method="SLSQP",
        bounds=[(0.05, 1.0)] * len(machines),
        options={"maxiter": 2_000, "ftol": 1e-9},
    )
    if not np.all(np.isfinite(result.x)):
        raise RuntimeError("Calibration optimizer returned non-finite duty cycles")

    duty_cycles = np.clip(result.x, 0.05, 1.0)
    simulated_kwh = float(np.sum(rated_kw * total_hours * duty_cycles))
    error_pct = abs(simulated_kwh - actual_bill_kwh) / actual_bill_kwh * 100.0
    duty_cycle_mapping = {
        str(machine.id if machine.id is not None else machine.name): float(duty_cycle)
        for machine, duty_cycle in zip(machines, duty_cycles, strict=True)
    }
    return duty_cycle_mapping, error_pct