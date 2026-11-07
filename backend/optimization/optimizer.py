"""
SolarIQ Optimization Engine
Searches the parameter space of tilt angles (0° - 80°) and panel azimuth orientations (90° - 270°)
using the ML predictor to identify the optimal configuration for maximum electrical output.
"""

from typing import Dict, Any, List

try:
    from ml.model import ml_manager
except ImportError:
    from backend.ml.model import ml_manager

def optimize_panel_configuration(params: Dict[str, Any], mode: str = "tilt") -> Dict[str, Any]:
    """
    Evaluates power predictions across candidate tilt angles and azimuth orientations.
    """
    mode = mode.lower()
    current_tilt = float(params.get("tilt", 25.0))
    current_azimuth = float(params.get("azimuth", 180.0))

    # Evaluate current baseline ML prediction
    current_power = ml_manager.predict(params)

    search_curve: List[Dict[str, Any]] = []

    best_power = -1.0
    best_tilt = current_tilt
    best_azimuth = current_azimuth

    if mode == "tilt":
        tilt_candidates = list(range(0, 85, 5))
        for t in tilt_candidates:
            candidate_params = dict(params)
            candidate_params["tilt"] = float(t)
            candidate_params["azimuth"] = current_azimuth

            p_cand = ml_manager.predict(candidate_params)

            search_curve.append({
                "tilt": t,
                "azimuth": int(current_azimuth),
                "power_w": p_cand
            })

            if p_cand > best_power:
                best_power = p_cand
                best_tilt = float(t)
                best_azimuth = current_azimuth

    elif mode in ["orientation", "azimuth"]:
        azimuth_candidates = list(range(90, 285, 15))
        for az in azimuth_candidates:
            candidate_params = dict(params)
            candidate_params["tilt"] = current_tilt
            candidate_params["azimuth"] = float(az)

            p_cand = ml_manager.predict(candidate_params)

            search_curve.append({
                "tilt": int(current_tilt),
                "azimuth": az,
                "power_w": p_cand
            })

            if p_cand > best_power:
                best_power = p_cand
                best_tilt = current_tilt
                best_azimuth = float(az)

    else: # mode == "both"
        tilt_candidates = list(range(10, 75, 10))
        azimuth_candidates = list(range(120, 250, 15))

        for t in tilt_candidates:
            for az in azimuth_candidates:
                candidate_params = dict(params)
                candidate_params["tilt"] = float(t)
                candidate_params["azimuth"] = float(az)

                p_cand = ml_manager.predict(candidate_params)

                if p_cand > best_power:
                    best_power = p_cand
                    best_tilt = float(t)
                    best_azimuth = float(az)

        for t in range(0, 85, 5):
            c_params = dict(params)
            c_params["tilt"] = float(t)
            c_params["azimuth"] = best_azimuth
            p_c = ml_manager.predict(c_params)
            search_curve.append({
                "tilt": t,
                "azimuth": int(best_azimuth),
                "power_w": p_c
            })

    gain_w = max(0.0, round(best_power - current_power, 2))
    percentage_gain = round((gain_w / current_power * 100.0), 2) if current_power > 0 else 0.0

    return {
        "current_config": {
            "tilt": current_tilt,
            "azimuth": current_azimuth,
            "power_w": current_power
        },
        "optimized_config": {
            "tilt": best_tilt,
            "azimuth": best_azimuth,
            "power_w": best_power
        },
        "gain_w": gain_w,
        "percentage_gain": percentage_gain,
        "mode": mode,
        "search_curve": search_curve
    }
