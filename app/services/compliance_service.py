from datetime import datetime
from typing import Any

CEA_EMISSION_FACTOR = 0.82  # kg CO2 per kWh (CEA 2023)


def generate_dpr(factory: Any, latest_bill: Any, calibration: Any) -> dict:
    """
    Generate a Detailed Project Report (DPR) for ADEETIE/PAT compliance.
    """
    now = datetime.utcnow().isoformat()

    # Energy calculations
    monthly_kwh = latest_bill.total_kwh if latest_bill else 0.0
    annual_kwh = monthly_kwh * 12
    co2_annual_kg = annual_kwh * CEA_EMISSION_FACTOR
    co2_annual_ton = co2_annual_kg / 1000.0

    # Estimated savings (15% baseline assumption if no optimization run)
    savings_pct = 0.15
    annual_savings_kwh = annual_kwh * savings_pct
    annual_co2_reduction_ton = annual_savings_kwh * CEA_EMISSION_FACTOR / 1000.0

    # Financial calculations (average Indian industrial tariff ~8.5 Rs/kWh)
    avg_tariff = 8.5
    annual_bill_inr = annual_kwh * avg_tariff
    annual_savings_inr = annual_savings_kwh * avg_tariff

    # ADEETIE scheme
    project_cost_inr = min(annual_savings_inr * 3, 5_000_000)  # 3-year payback cap at 50L
    subsidy_pct = 0.04
    loan_amount = min(project_cost_inr, 5_000_000)
    interest_subsidy = loan_amount * subsidy_pct * 3  # 3-year
    emi_monthly = loan_amount / 36  # simple 3-year repayment

    calibration_error = calibration.simulation_error_pct if calibration else None

    machines_list = []
    if hasattr(factory, 'machines') and factory.machines:
        for m in factory.machines:
            machines_list.append({
                "name": m.name,
                "rated_kw": m.rated_kw,
                "process_type": m.process_type.value if hasattr(m.process_type, 'value') else str(m.process_type),
            })

    return {
        "generated_at": now,
        "factory_name": factory.name,
        "factory_sector": factory.sector,
        "executive_summary": {
            "title": f"Detailed Project Report — {factory.name}",
            "sector": factory.sector,
            "report_date": now[:10],
            "annual_energy_kwh": round(annual_kwh, 1),
            "annual_bill_inr": round(annual_bill_inr, 2),
            "potential_savings_pct": savings_pct * 100,
            "potential_annual_savings_inr": round(annual_savings_inr, 2),
            "co2_baseline_ton": round(co2_annual_ton, 2),
            "co2_reduction_ton": round(annual_co2_reduction_ton, 2),
        },
        "energy_profile": {
            "monthly_kwh": round(monthly_kwh, 1),
            "annual_kwh": round(annual_kwh, 1),
            "peak_demand_kva": latest_bill.peak_demand_kva if latest_bill else None,
            "tod_peak_kwh": latest_bill.tod_peak_kwh if latest_bill else None,
            "tod_offpeak_kwh": latest_bill.tod_offpeak_kwh if latest_bill else None,
            "billing_month": latest_bill.billing_month if latest_bill else None,
            "machines": machines_list,
        },
        "identified_inefficiencies": [
            {"id": 1, "description": "Peak-hour operations during high-tariff periods (6 AM–10 PM)", "estimated_waste_kwh": round(monthly_kwh * 0.08, 1), "priority": "HIGH"},
            {"id": 2, "description": "Shiftable loads not scheduled to off-peak windows", "estimated_waste_kwh": round(monthly_kwh * 0.05, 1), "priority": "HIGH"},
            {"id": 3, "description": "High reactive power / low power factor", "estimated_waste_kva": round((latest_bill.peak_demand_kva if latest_bill else 0) * 0.1, 1), "priority": "MEDIUM"},
        ],
        "proposed_interventions": [
            {"id": 1, "intervention": "Load shifting to off-peak (10 PM–6 AM)", "expected_savings_inr_pa": round(annual_savings_inr * 0.6, 2), "implementation_cost_inr": 0, "payback_months": 0},
            {"id": 2, "intervention": "Power factor correction capacitors", "expected_savings_inr_pa": round(annual_savings_inr * 0.2, 2), "implementation_cost_inr": 75000, "payback_months": 10},
            {"id": 3, "intervention": "IE3 motor replacement for continuous loads", "expected_savings_inr_pa": round(annual_savings_inr * 0.2, 2), "implementation_cost_inr": 150000, "payback_months": 18},
        ],
        "financial_analysis": {
            "project_cost_inr": round(project_cost_inr, 2),
            "annual_savings_inr": round(annual_savings_inr, 2),
            "simple_payback_years": round(project_cost_inr / max(annual_savings_inr, 1), 2),
            "npv_5yr_inr": round(annual_savings_inr * 4.33 - project_cost_inr, 2),  # 5yr NPV at 10% discount
            "irr_pct": round(savings_pct * 100 * 2.5, 1),  # approximation
        },
        "adeetie_loan_details": {
            "scheme_name": "ADEETIE — Affordable and Dependable Energy Efficiency Technology for Indian Enterprises",
            "max_loan_inr": 5_000_000,
            "loan_amount_inr": round(loan_amount, 2),
            "interest_subsidy_pct": 4.0,
            "interest_subsidy_amount_inr": round(interest_subsidy, 2),
            "repayment_years": 3,
            "monthly_emi_inr": round(emi_monthly, 2),
            "udyam_number": getattr(factory, 'udyam_number', None),
            "eligibility": "MSME registered under Udyam with minimum 1-year operation",
        },
        "cbam_footprint": {
            "cea_grid_factor_kg_per_kwh": CEA_EMISSION_FACTOR,
            "scope1_kg_co2": 0.0,
            "scope2_kg_co2": round(co2_annual_kg, 2),
            "total_annual_co2_ton": round(co2_annual_ton, 2),
            "co2_reduction_ton_pa": round(annual_co2_reduction_ton, 2),
            "cbam_applicable_sectors": ["Steel", "Cement", "Aluminium", "Fertilisers", "Electricity"],
            "calibration_error_pct": calibration_error,
        },
    }
