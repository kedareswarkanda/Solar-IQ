"""
SolarIQ Carbon Offset & Environmental Impact Service
Calculates:
- CO2 Emissions Avoided (kg CO2)
- Equivalent Trees Planted (Trees/year & Trees/day equivalent)
- Gasoline Car Miles Offset
"""

def calculate_carbon_offset(daily_energy_kwh: float) -> dict:
    """
    Computes environmental carbon offset metrics based on daily clean solar generation (kWh/day).
    Grid emissions factor: 0.707 kg CO2 / kWh (Global weighted average clean conversion).
    Tree absorption factor: 1 tree absorbs ~21.77 kg CO2 per year (~0.0596 kg CO2/day).
    Passenger vehicle emissions: ~0.404 kg CO2 per mile (~2.475 miles / kg CO2).
    """
    co2_kg_daily = round(daily_energy_kwh * 0.707, 2)
    co2_kg_annual = round(co2_kg_daily * 365.25, 2)

    trees_equivalent = round(co2_kg_daily / 0.0596, 1)
    car_miles_equivalent = round(co2_kg_daily * 2.475, 1)

    return {
        "co2_avoided_kg_daily": co2_kg_daily,
        "co2_avoided_kg_annual": co2_kg_annual,
        "equivalent_trees_planted": trees_equivalent,
        "equivalent_car_miles_offset": car_miles_equivalent,
        "grid_factor_note": "Calculated using 0.707 kg CO2/kWh grid displacement factor."
    }
