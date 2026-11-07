"""
SolarIQ Machine Learning Engine
Trains and loads an XGBoost Regressor (with RandomForest fallback) on physics-informed synthetic solar data.
Computes model performance metrics (R2, MAE, RMSE), feature importances, and provides multi-panel array prediction inference.
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List

try:
    from physics.engine import calculate_physics_power
except ImportError:
    from backend.physics.engine import calculate_physics_power

# Check ML libraries availability
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "solariq_model.pkl")

FEATURE_NAMES = [
    "irradiance",
    "ambient_temp",
    "panel_temp",
    "humidity",
    "wind_speed",
    "tilt",
    "azimuth",
    "panel_type_code",
    "shading",
    "soiling",
    "age",
    "time_of_day"
]

PANEL_TYPE_MAP = {
    "Monocrystalline": 0,
    "Polycrystalline": 1,
    "Thin-film": 2
}

class SolarIQModelManager:
    def __init__(self):
        self.model = None
        self.model_name = "XGBoost Regressor" if HAS_XGBOOST else "Random Forest Regressor"
        self.metrics = {
            "r2": 0.0,
            "mae": 0.0,
            "rmse": 0.0,
            "actual_vs_predicted": [],
            "feature_importance": []
        }

    def generate_synthetic_dataset(self, num_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
        """
        Generates physics-grounded synthetic dataset with controlled real-world environmental noise.
        """
        np.random.seed(random_seed)

        irradiance = np.random.uniform(100, 1100, num_samples)
        ambient_temp = np.random.uniform(5, 42, num_samples)
        panel_temp = ambient_temp + (irradiance * 0.025) + np.random.normal(0, 2.5, num_samples)
        humidity = np.random.uniform(15, 90, num_samples)
        wind_speed = np.random.uniform(0.5, 12.0, num_samples)
        tilt = np.random.uniform(0, 75, num_samples)
        azimuth = np.random.uniform(100, 260, num_samples)
        panel_types = np.random.choice(["Monocrystalline", "Polycrystalline", "Thin-film"], num_samples)
        shading = np.random.exponential(scale=5.0, size=num_samples).clip(0, 40)
        soiling = np.random.exponential(scale=4.0, size=num_samples).clip(0, 30)
        age = np.random.uniform(0, 20, num_samples)
        time_of_day = np.random.uniform(6.5, 17.5, num_samples)

        target_power = []

        for i in range(num_samples):
            p_dict = {
                "irradiance": irradiance[i],
                "ambient_temp": ambient_temp[i],
                "panel_temp": panel_temp[i],
                "num_panels": 1,
                "area": 2.0,
                "rated_power": 400.0,
                "efficiency": 20.0,
                "tilt": tilt[i],
                "azimuth": azimuth[i],
                "panel_type": panel_types[i],
                "age": age[i],
                "soiling": soiling[i],
                "shading": shading[i],
                "weather": "Sunny" if irradiance[i] > 600 else ("Partly Cloudy" if irradiance[i] > 300 else "Cloudy"),
                "time_of_day": time_of_day[i]
            }
            phys_res = calculate_physics_power(p_dict)
            p_base = phys_res["physics_power_w"]

            wind_cooling_bonus = 1.0 + (wind_speed[i] * 0.005)
            humidity_attenuation = 1.0 - (humidity[i] * 0.0003)
            random_noise = np.random.normal(1.0, 0.03)

            p_real = p_base * wind_cooling_bonus * humidity_attenuation * random_noise
            p_real = max(0.0, min(p_real, 480.0))
            target_power.append(p_real)

        df = pd.DataFrame({
            "irradiance": irradiance,
            "ambient_temp": ambient_temp,
            "panel_temp": panel_temp,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "tilt": tilt,
            "azimuth": azimuth,
            "panel_type_code": [PANEL_TYPE_MAP[t] for t in panel_types],
            "shading": shading,
            "soiling": soiling,
            "age": age,
            "time_of_day": time_of_day,
            "power_w": target_power
        })

        return df

    def train_or_load_model(self, force_retrain: bool = False):
        """
        Loads pre-trained model file if present, otherwise generates dataset & trains new model.
        """
        os.makedirs(MODEL_DIR, exist_ok=True)

        if os.path.exists(MODEL_PATH) and not force_retrain:
            try:
                with open(MODEL_PATH, "rb") as f:
                    saved_data = pickle.load(f)
                    self.model = saved_data["model"]
                    self.metrics = saved_data["metrics"]
                    self.model_name = saved_data.get("model_name", self.model_name)
                    print(f"[SolarIQ ML] Loaded pre-trained model: {self.model_name} (R2={self.metrics['r2']:.4f})")
                    return
            except Exception as e:
                print(f"[SolarIQ ML] Failed loading saved model ({e}), retraining...")

        print("[SolarIQ ML] Generating dataset and training AI model...")
        df = self.generate_synthetic_dataset(num_samples=5000)

        X = df[FEATURE_NAMES]
        y = df["power_w"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=42, test_size=0.2)

        if HAS_XGBOOST:
            regressor = xgb.XGBRegressor(
                n_estimators=150,
                learning_rate=0.08,
                max_depth=6,
                random_state=42,
                n_jobs=-1
            )
            self.model_name = "XGBoost Regressor"
        else:
            regressor = RandomForestRegressor(
                n_estimators=100,
                max_depth=12,
                random_state=42,
                n_jobs=-1
            )
            self.model_name = "Random Forest Regressor"

        regressor.fit(X_train, y_train)

        y_pred = regressor.predict(X_test)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        if hasattr(regressor, "feature_importances_"):
            importances = regressor.feature_importances_
        else:
            importances = np.ones(len(FEATURE_NAMES)) / len(FEATURE_NAMES)

        feature_imp_list = [
            {"feature": name.replace("_", " ").title(), "importance": float(imp)}
            for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
        ]

        actual_vs_pred = [
            {"actual": round(float(act), 2), "predicted": round(float(prd), 2)}
            for act, prd in zip(y_test.iloc[:60], y_pred[:60])
        ]

        self.model = regressor
        self.metrics = {
            "r2": round(float(r2), 4),
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "actual_vs_predicted": actual_vs_pred,
            "feature_importance": feature_imp_list,
            "model_name": self.model_name
        }

        try:
            with open(MODEL_PATH, "wb") as f:
                pickle.dump({
                    "model": self.model,
                    "metrics": self.metrics,
                    "model_name": self.model_name
                }, f)
            print(f"[SolarIQ ML] Model saved successfully: {self.model_name} (R2={r2:.4f}, MAE={mae:.2f})")
        except Exception as e:
            print(f"[SolarIQ ML] Warning: Could not save model to file ({e})")

    def predict(self, params: Dict[str, Any]) -> float:
        """
        Runs ML model inference for given parameter payload, scaling prediction by num_panels.
        """
        if self.model is None:
            self.train_or_load_model()

        panel_type_str = str(params.get("panel_type", "Monocrystalline"))
        panel_type_code = PANEL_TYPE_MAP.get(panel_type_str, 0)

        feature_row = pd.DataFrame([{
            "irradiance": float(params.get("irradiance", 850.0)),
            "ambient_temp": float(params.get("ambient_temp", 25.0)),
            "panel_temp": float(params.get("panel_temp", 35.0)),
            "humidity": float(params.get("humidity", 50.0)),
            "wind_speed": float(params.get("wind_speed", 3.0)),
            "tilt": float(params.get("tilt", 25.0)),
            "azimuth": float(params.get("azimuth", 180.0)),
            "panel_type_code": panel_type_code,
            "shading": float(params.get("shading", 5.0)),
            "soiling": float(params.get("soiling", 3.0)),
            "age": float(params.get("age", 2.0)),
            "time_of_day": float(params.get("time_of_day", 12.0))
        }])

        pred_single = float(self.model.predict(feature_row)[0])
        num_panels = int(params.get("num_panels", 1))
        rated_single = float(params.get("rated_power", 400.0))
        total_rated = rated_single * num_panels

        pred_array = pred_single * num_panels
        pred_val_clamped = round(max(0.0, min(pred_array, total_rated * 1.25)), 2)
        return pred_val_clamped

ml_manager = SolarIQModelManager()
