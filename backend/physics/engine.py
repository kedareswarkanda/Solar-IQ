"""
SolarIQ Physics Engine
Transparent simplified photovoltaic physics model incorporating:
- Multi-panel array sizing (P_raw = G * (A * num_panels) * eta)
- Temperature derating coefficient (gamma)
- Solar position & tilt/orientation incidence geometry
- Shading & dust/soiling losses
- Panel degradation over time
"""

import math
from typing import Dict, Any

def calculate_physics_power(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate theoretical physics baseline power and component loss factors for multi-panel array.
    """
    irradiance = float(params.get("irradiance", 850.0))          # W/m2
    ambient_temp = float(params.get("ambient_temp", 25.0))       # °C
    panel_temp = float(params.get("panel_temp", 35.0))           # °C
    num_panels = int(params.get("num_panels", 1))                # Multi-panel count (1 to 200)
    panel_area = float(params.get("area", 2.0))                  # m2 per panel
    total_area = panel_area * num_panels                         # Total array surface area
    single_rated = float(params.get("rated_power", 400.0))       # W per panel
    total_rated_power = single_rated * num_panels                # Total array rated STC power in W
    efficiency = float(params.get("efficiency", 20.0))          # % (e.g. 20%)
    tilt = float(params.get("tilt", 25.0))                      # degrees (0 - 90)
    azimuth = float(params.get("azimuth", 180.0))               # degrees (0 - 360, 180=South)
    panel_type = str(params.get("panel_type", "Monocrystalline")) # Monocrystalline, Polycrystalline, Thin-film
    age = float(params.get("age", 2.0))                          # years
    soiling = float(params.get("soiling", 3.0))                  # % dust/soiling loss
    shading = float(params.get("shading", 5.0))                  # % shading loss
    weather = str(params.get("weather", "Sunny"))               # Sunny, Partly Cloudy, Cloudy, Rainy
    time_of_day = float(params.get("time_of_day", 12.0))        # Hour (0.0 to 24.0)

    # 1. Base unadjusted optical power for array
    p_raw = irradiance * total_area * (efficiency / 100.0)

    # 2. Temperature Derating Factor (f_temp)
    gamma_map = {
        "Monocrystalline": 0.0040, # -0.40% per °C
        "Polycrystalline": 0.0045, # -0.45% per °C
        "Thin-film": 0.0025       # -0.25% per °C
    }
    gamma = gamma_map.get(panel_type, 0.0040)
    temp_diff = panel_temp - 25.0
    f_temp = max(0.5, 1.0 - (gamma * temp_diff))

    # 3. Solar Geometry & Tilt / Orientation Factor (f_tilt)
    ideal_tilt = 30.0
    ideal_azimuth = 180.0

    tilt_rad_diff = math.radians(abs(tilt - ideal_tilt))
    azimuth_rad_diff = math.radians(abs(azimuth - ideal_azimuth) / 2.0)
    
    solar_hour_angle = math.radians((time_of_day - 12.0) * 15.0) # 15° per hour
    sun_elevation = max(0.1, math.cos(solar_hour_angle))

    f_tilt = max(0.2, math.cos(tilt_rad_diff) * math.cos(azimuth_rad_diff) * sun_elevation)

    # 4. Shading Factor (f_shade)
    f_shade = max(0.0, 1.0 - (shading / 100.0))

    # 5. Soiling / Dust Factor (f_dust)
    f_dust = max(0.5, 1.0 - (soiling / 100.0))

    # 6. Age Degradation Factor (f_age) (0.5% degradation per year)
    f_age = max(0.70, 1.0 - (0.005 * age))

    # 7. Weather attenuation factor (f_weather)
    weather_map = {
        "Sunny": 1.0,
        "Partly Cloudy": 0.85,
        "Cloudy": 0.50,
        "Rainy": 0.25
    }
    f_weather = weather_map.get(weather, 1.0)

    # Combine factors for simplified physics power estimate
    p_physics = p_raw * f_temp * f_tilt * f_shade * f_dust * f_age * f_weather

    p_physics_clamped = round(max(0.0, min(p_physics, total_rated_power * 1.25)), 2)

    loss_temperature_w = round(p_raw * (1.0 - f_temp), 2)
    loss_shading_w = round(p_raw * f_temp * (1.0 - f_shade), 2)
    loss_soiling_w = round(p_raw * f_temp * f_shade * (1.0 - f_dust), 2)
    loss_orientation_w = round(p_raw * f_temp * f_shade * f_dust * (1.0 - f_tilt), 2)
    
    potential_raw_w = round(p_raw, 2)

    return {
        "physics_power_w": p_physics_clamped,
        "potential_raw_w": potential_raw_w,
        "num_panels": num_panels,
        "total_area_m2": round(total_area, 2),
        "total_rated_kw": round(total_rated_power / 1000.0, 2),
        "f_temp": round(f_temp, 4),
        "f_tilt": round(f_tilt, 4),
        "f_shade": round(f_shade, 4),
        "f_dust": round(f_dust, 4),
        "f_age": round(f_age, 4),
        "f_weather": round(f_weather, 4),
        "losses": {
            "temperature_loss_w": max(0.0, loss_temperature_w),
            "shading_loss_w": max(0.0, loss_shading_w),
            "soiling_loss_w": max(0.0, loss_soiling_w),
            "orientation_loss_w": max(0.0, loss_orientation_w)
        }
    }
