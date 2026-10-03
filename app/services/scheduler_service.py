import math
from dataclasses import dataclass

import pulp

from app.models.schema import ProcessType
from app.schemas.pydantic_schemas import CalibratedMachineDTO


@dataclass(frozen=True)
class ScheduleResult:
    hourly_schedule: dict[str, list[int]]
    optimized_daily_cost: float
    baseline_daily_cost: float
    estimated_daily_savings: float
    savings_percent: float


def _hourly_rates(tod_tariffs: dict[str, float]) -> list[float]:
    normalized = {key.strip().lower().replace("-", "_"): value for key, value in tod_tariffs.items()}
    hour_keys = [str(hour) for hour in range(24)]
    if all(key in normalized for key in hour_keys):
        return [normalized[key] for key in hour_keys]

    aliases = {
        "offpeak": "off_peak",
        "off_peak": "off_peak",
        "shoulder": "shoulder",
        "normal": "shoulder",
        "peak": "peak",
    }
    rates = {aliases[key]: value for key, value in normalized.items() if key in aliases}
    missing = {"off_peak", "shoulder", "peak"} - rates.keys()
    if missing:
        raise ValueError(
            "Tariffs must provide rates for every hour 0-23 or named off_peak, shoulder, and peak periods"
        )
    hourly: list[float] = []
    for hour in range(24):
        period = "off_peak" if hour < 6 else "peak" if 18 <= hour < 22 else "shoulder"
        hourly.append(rates[period])
    return hourly


def optimize_shift_schedule(
    machines: list[CalibratedMachineDTO],
    tod_tariffs: dict[str, float],
    peak_demand_capacity_kw: float | None = None,
) -> ScheduleResult:
    if not machines:
        raise ValueError("At least one machine is required to create a schedule")
    if not tod_tariffs:
        raise ValueError("At least one time-of-day tariff is required")
    hourly_rates = _hourly_rates(tod_tariffs)
    if any(not math.isfinite(rate) or rate < 0 for rate in hourly_rates):
        raise ValueError("Tariff rates must be finite and non-negative")

    machine_keys = [str(machine.id if machine.id is not None else machine.name) for machine in machines]
    if len(set(machine_keys)) != len(machine_keys):
        raise ValueError("Machines must have unique IDs or names for scheduling")

    required_hours: dict[str, int] = {}
    for key, machine in zip(machine_keys, machines, strict=True):
        if machine.process_type == ProcessType.SHIFTABLE:
            raw_hours = machine.max_daily_hours * machine.duty_cycle
            hours = math.ceil(raw_hours - 1e-9)
            if hours > machine.max_daily_hours:
                raise ValueError(f"{machine.name} needs more whole-hour slots than its daily limit allows")
            required_hours[key] = hours

    fixed_load_kw = sum(
        machine.rated_kw * machine.duty_cycle
        for machine in machines
        if machine.process_type == ProcessType.CONTINUOUS
    )
    if peak_demand_capacity_kw is None:
        peak_demand_capacity_kw = fixed_load_kw + sum(
            machine.rated_kw
            for machine in machines
            if machine.process_type == ProcessType.SHIFTABLE
        )
    if not math.isfinite(peak_demand_capacity_kw) or peak_demand_capacity_kw <= 0:
        raise ValueError("Peak demand capacity must be a finite positive value")
    if fixed_load_kw > peak_demand_capacity_kw + 1e-9:
        raise ValueError("Continuous machine load exceeds the peak demand capacity")

    shiftable_keys = [
        key for key, machine in zip(machine_keys, machines, strict=True)
        if machine.process_type == ProcessType.SHIFTABLE
    ]
    def build_model(
        name: str, minimize_cost: bool
    ) -> tuple[pulp.LpProblem, dict[tuple[str, int], pulp.LpVariable]]:
        model = pulp.LpProblem(name, pulp.LpMinimize)
        model_variables = {
            (key, hour): model.add_variable(
                f"{name}_run_{index}_{hour}", cat=pulp.LpBinary
            )
            for index, key in enumerate(shiftable_keys)
            for hour in range(24)
        }
        if minimize_cost:
            model += pulp.lpSum(
                hourly_rates[hour]
                * pulp.lpSum(
                    machine.rated_kw * model_variables[(key, hour)]
                    for key, machine in zip(machine_keys, machines, strict=True)
                    if machine.process_type == ProcessType.SHIFTABLE
                )
                for hour in range(24)
            )
        else:
            model += pulp.lpSum(
                hour * model_variables[(key, hour)]
                for key in shiftable_keys
                for hour in range(24)
            )
        for key in shiftable_keys:
            model += pulp.lpSum(
                model_variables[(key, hour)] for hour in range(24)
            ) == required_hours[key]
        for hour in range(24):
            model += fixed_load_kw + pulp.lpSum(
                machine.rated_kw * model_variables[(key, hour)]
                for key, machine in zip(machine_keys, machines, strict=True)
                if machine.process_type == ProcessType.SHIFTABLE
            ) <= peak_demand_capacity_kw
        return model, model_variables

    solver = pulp.COIN_CMD(msg=False)
    optimized_model, optimized_variables = build_model("sme_twin_cost_min", minimize_cost=True)
    baseline_model, baseline_variables = build_model("sme_twin_earliest_feasible", minimize_cost=False)
    if optimized_model.solve(solver) != pulp.LpStatusOptimal:
        raise ValueError("No feasible operating schedule satisfies the peak demand capacity")
    if baseline_model.solve(solver) != pulp.LpStatusOptimal:
        raise ValueError("Could not compute a feasible tariff-unaware baseline schedule")

    def result_schedule(
        model: pulp.LpProblem, model_variables: dict[tuple[str, int], pulp.LpVariable]
    ) -> dict[str, list[int]]:
        schedule: dict[str, list[int]] = {}
        for key, machine in zip(machine_keys, machines, strict=True):
            if machine.process_type == ProcessType.CONTINUOUS:
                schedule[key] = [1] * 24
            else:
                schedule[key] = [
                    int(round(float(pulp.value(model_variables[(key, hour)]) or 0.0)))
                    for hour in range(24)
                ]
        return schedule

    def calculate_cost(schedule: dict[str, list[int]]) -> float:
        total = 0.0
        for hour, rate in enumerate(hourly_rates):
            load_kw = fixed_load_kw + sum(
                machine.rated_kw * schedule[key][hour]
                for key, machine in zip(machine_keys, machines, strict=True)
                if machine.process_type == ProcessType.SHIFTABLE
            )
            total += rate * load_kw
        return total

    optimized_schedule = result_schedule(optimized_model, optimized_variables)
    baseline_schedule = result_schedule(baseline_model, baseline_variables)
    optimized_cost = calculate_cost(optimized_schedule)
    baseline_cost = calculate_cost(baseline_schedule)
    savings = max(0.0, baseline_cost - optimized_cost)
    savings_percent = savings / baseline_cost * 100.0 if baseline_cost > 0 else 0.0
    return ScheduleResult(
        hourly_schedule=optimized_schedule,
        optimized_daily_cost=optimized_cost,
        baseline_daily_cost=baseline_cost,
        estimated_daily_savings=savings,
        savings_percent=savings_percent,
    )