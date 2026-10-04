import random
import math
from app.schemas.pydantic_schemas import ClusterBenchmarkItem

SECTOR_BENCHMARKS = {
    "textile": (3.2, 0.6),
    "spinning": (3.2, 0.6),
    "foundry": (580.0, 80.0),
    "casting": (580.0, 80.0),
    "ceramic": (1.8, 0.3),
    "tile": (1.8, 0.3),
}
DEFAULT_BENCHMARK = (5.0, 1.0)


def _get_benchmark_params(sector: str) -> tuple[float, float]:
    sector_lower = sector.lower()
    for key, params in SECTOR_BENCHMARKS.items():
        if key in sector_lower:
            return params
    return DEFAULT_BENCHMARK


def generate_cluster_benchmark(sector: str, seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    mean, std = _get_benchmark_params(sector)
    results = []
    for i in range(1, 16):
        # Box-Muller transform for normal distribution without numpy dependency
        u1 = rng.random()
        u2 = rng.random()
        z = math.sqrt(-2 * math.log(max(u1, 1e-10))) * math.cos(2 * math.pi * u2)
        sec = max(mean * 0.3, mean + std * z)
        monthly_kwh = sec * rng.uniform(8000, 25000)
        results.append({
            "id": f"SME-{i:03d}",
            "sec_kwh_per_unit": round(sec, 3),
            "sector": sector,
            "monthly_kwh": round(monthly_kwh, 1),
            "is_current_factory": False,
        })
    return results
