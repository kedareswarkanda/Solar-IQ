"""
SolarIQ Diagnostics & Analysis Services
Provides:
- Solar Panel Health Score (0-100 breakdown)
- Performance Diagnostics & Actionable Recommendations
- Energy Loss Breakdown (Waterfall structure)
- Daily Hourly Performance Simulation (06:00 to 18:00)
"""

import math
from typing import Dict, Any, List

try:
    from physics.engine import calculate_physics_power
    from ml.model import ml_manager
    from optimization.optimizer import optimize_panel_configuration
except ImportError:
    from backend.physics.engine import calculate_physics_power
    from backend.ml.model import ml_manager
    from backend.optimization.optimizer import optimize_panel_configuration

def calculate_solar_health_score(params: Dict[str, Any], ai_power: float, physics_power: float) -> Dict[str, Any]:
    """
    Computes a project-generated 0-100 Solar Health Score with component breakdown.
    """
    panel_temp = float(params.get("panel_temp", 35.0))
    soiling = float(params.get("soiling", 3.0))
    shading = float(params.get("shading", 5.0))
    tilt = float(params.get("tilt", 25.0))

    num_panels = int(params.get("num_panels", 1))
    single_rated = float(params.get("rated_power", 400.0))
    total_rated_power = single_rated * num_panels

    ratio = (ai_power / total_rated_power) if total_rated_power > 0 else 0.5
    energy_score = min(30.0, max(5.0, ratio * 35.0))

    if panel_temp <= 30.0:
        thermal_score = 25.0
    elif panel_temp <= 45.0:
        thermal_score = 25.0 - ((panel_temp - 30.0) * 0.5)
    else:
        thermal_score = max(5.0, 17.5 - ((panel_temp - 45.0) * 0.7))

    soiling_score = max(0.0, 15.0 - (soiling * 0.4))
    shading_score = max(0.0, 15.0 - (shading * 0.35))
    tilt_diff = abs(tilt - 30.0)
    orientation_score = max(3.0, 15.0 - (tilt_diff * 0.3))

    total_score = round(energy_score + thermal_score + soiling_score + shading_score + orientation_score, 1)
    total_score = min(100.0, max(0.0, total_score))

    if total_score >= 85:
        status = "Excellent"
    elif total_score >= 70:
        status = "Good"
    elif total_score >= 50:
        status = "Moderate"
    else:
        status = "Poor"

    return {
        "health_score": total_score,
        "status": status,
        "breakdown": {
            "energy_performance": round(energy_score, 1),
            "thermal_condition": round(thermal_score, 1),
            "soiling_condition": round(soiling_score, 1),
            "shading_condition": round(shading_score, 1),
            "orientation_alignment": round(orientation_score, 1)
        },
        "disclaimer": "SolarIQ Performance Indicator — project-generated rating based on current operating parameters."
    }

def generate_performance_diagnostics(params: Dict[str, Any], opt_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Identifies performance alerts, contributing factors, and actionable recommendations.
    """
    irradiance = float(params.get("irradiance", 850.0))
    panel_temp = float(params.get("panel_temp", 35.0))
    shading = float(params.get("shading", 5.0))
    soiling = float(params.get("soiling", 3.0))
    tilt = float(params.get("tilt", 25.0))

    optimal_tilt = opt_result["optimized_config"]["tilt"]
    gain_pct = opt_result["percentage_gain"]

    factors = []
    recommendations = []
    insights = []

    if irradiance < 400.0:
        factors.append("Low solar irradiance (Cloudy/overcast conditions)")
        recommendations.append("System power is limited by available sunlight. No physical action required.")
        insights.append("Low solar irradiance is the primary factor limiting energy generation.")

    if panel_temp > 45.0:
        factors.append(f"Elevated panel temperature ({panel_temp}°C)")
        recommendations.append("Ensure adequate ventilation space under solar panels to reduce thermal derating.")
        insights.append(f"High panel temperature of {panel_temp}°C reduces PV cell efficiency.")

    if shading > 8.0:
        factors.append(f"Significant obstruction / shading ({shading}%)")
        recommendations.append("Trim nearby tree branches or reposition obstructions causing partial shading.")
        insights.append(f"Shading loss of {shading}% degrades cell string voltage output.")

    if soiling > 5.0:
        factors.append(f"Dust / soiling accumulation ({soiling}%)")
        recommendations.append("Clean solar panel glass surface to remove dust, pollen, and debris.")
        insights.append(f"Cleaning soiling layer ({soiling}%) could restore up to {round(soiling*0.8, 1)}% output.")

    if abs(tilt - optimal_tilt) >= 5.0:
        factors.append(f"Suboptimal tilt angle (Current: {tilt}°, Optimal: {optimal_tilt}°)")
        recommendations.append(f"Adjust panel tilt to recommended {optimal_tilt}° angle to capture peak direct solar radiation.")
        insights.append(f"Re-adjusting tilt from {tilt}° to {optimal_tilt}° provides an estimated +{gain_pct}% output boost.")

    if not factors:
        factors.append("Operating within optimal parameters")
        recommendations.append("Maintain routine panel cleaning and monitor system metrics.")
        insights.append("Panel array is operating efficiently with minimal environmental losses.")

    return {
        "contributing_factors": factors,
        "recommendations": recommendations,
        "insights": insights
    }

def generate_energy_loss_breakdown(phys_res: Dict[str, Any], ai_power: float) -> List[Dict[str, Any]]:
    """
    Creates a visual waterfall loss breakdown structure.
    """
    raw_potential = phys_res["potential_raw_w"]
    losses = phys_res["losses"]

    temp_loss = losses["temperature_loss_w"]
    shading_loss = losses["shading_loss_w"]
    soiling_loss = losses["soiling_loss_w"]
    orientation_loss = losses["orientation_loss_w"]

    return [
        {"stage": "Potential Solar Energy", "value_w": raw_potential, "type": "potential"},
        {"stage": "Temperature Loss", "value_w": -temp_loss, "type": "loss"},
        {"stage": "Shading Loss", "value_w": -shading_loss, "type": "loss"},
        {"stage": "Soiling Loss", "value_w": -soiling_loss, "type": "loss"},
        {"stage": "Orientation Loss", "value_w": -orientation_loss, "type": "loss"},
        {"stage": "Usable Electrical Output", "value_w": ai_power, "type": "output"}
    ]

def simulate_daily_profile(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates an hourly simulation profile from 06:00 to 18:00 (13 sample points)
    and integrates total expected daily energy in kWh.
    """
    peak_irradiance = float(params.get("irradiance", 850.0))
    ambient_base = float(params.get("ambient_temp", 25.0))
    num_panels = int(params.get("num_panels", 1))
    panel_area = float(params.get("area", 2.0))
    total_area = panel_area * num_panels

    hourly_data = []
    total_energy_wh = 0.0

    for hour in range(6, 19):
        progress = (hour - 6) / 12.0
        sun_factor = max(0.0, math.sin(progress * math.pi))

        h_irradiance = round(peak_irradiance * sun_factor, 1)
        h_panel_temp = round(ambient_base + (h_irradiance * 0.022) + ((hour - 12) * 0.5 if hour >= 12 else 0), 1)

        h_params = dict(params)
        h_params["irradiance"] = h_irradiance
        h_params["panel_temp"] = h_panel_temp
        h_params["time_of_day"] = float(hour)

        if h_irradiance > 10.0:
            h_power = ml_manager.predict(h_params)
        else:
            h_power = 0.0

        h_efficiency = round((h_power / (h_irradiance * total_area) * 100.0), 2) if (h_irradiance * total_area) > 0 else 0.0

        hourly_data.append({
            "hour": f"{hour:02d}:00",
            "time_decimal": hour,
            "irradiance": h_irradiance,
            "panel_temp": h_panel_temp,
            "power_w": h_power,
            "efficiency": h_efficiency
        })

        total_energy_wh += h_power

    daily_energy_kwh = round(total_energy_wh / 1000.0, 2)

    return {
        "daily_energy_kwh": daily_energy_kwh,
        "peak_power_w": max([d["power_w"] for d in hourly_data]),
        "hourly_profile": hourly_data
    }
