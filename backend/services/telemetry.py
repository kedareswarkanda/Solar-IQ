"""
SolarIQ Telemetry Simulation Service
Simulates real-time hardware detection sensor feeds:
- Pyranometer Irradiance Sensor (W/m² flux)
- Rear Backsheet PT100 Core Thermal Thermistor (°C)
- Optical Dust / Soiling Sensor (%)
- Shading Photodiode Sensor Array (%)
- Mechanical Servo Actuator Alignment Status
"""

import random
import time
from typing import Dict, Any

def generate_telemetry_snapshot(current_params: Dict[str, Any], target_tilt: float = None) -> Dict[str, Any]:
    """
    Generates realistic IoT sensor telemetry readings with micro-fluctuations.
    """
    base_irradiance = float(current_params.get("irradiance", 850.0))
    base_panel_temp = float(current_params.get("panel_temp", 35.0))
    base_soiling = float(current_params.get("soiling", 3.0))
    base_shading = float(current_params.get("shading", 5.0))
    current_tilt = float(current_params.get("tilt", 25.0))

    target = target_tilt if target_tilt is not None else current_tilt
    tilt_deviation = abs(current_tilt - target)
    actuator_locked = tilt_deviation < 1.0

    irr_reading = max(0.0, round(base_irradiance + random.uniform(-4.5, 4.5), 1))
    temp_reading = max(-10.0, round(base_panel_temp + random.uniform(-0.3, 0.3), 1))
    soil_reading = max(0.0, round(base_soiling + random.uniform(-0.1, 0.1), 1))
    shade_reading = max(0.0, round(base_shading + random.uniform(-0.2, 0.2), 1))

    if temp_reading > 50.0:
        thermal_status = "CRITICAL_HIGH"
    elif temp_reading > 40.0:
        thermal_status = "WARM"
    else:
        thermal_status = "NORMAL"

    return {
        "timestamp_ms": int(time.time() * 1000),
        "sensors": {
            "pyranometer_irradiance_wm2": irr_reading,
            "pt100_thermal_temp_c": temp_reading,
            "optical_soiling_percent": soil_reading,
            "shading_photodiode_percent": shade_reading
        },
        "actuator": {
            "current_tilt_deg": current_tilt,
            "target_tilt_deg": target,
            "servo_state": "LOCKED" if actuator_locked else "ACTUATING",
            "servo_progress_percent": 100 if actuator_locked else max(0, int(100 - (tilt_deviation * 3)))
        },
        "thermal_status": thermal_status
    }
