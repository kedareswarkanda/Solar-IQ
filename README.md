# SOLARIQ — AI Solar Panel Efficiency Optimizer

> **Tagline:** "Understand. Predict. Optimize. Generate More."  
> **Core Pipeline Architecture:** `PHYSICS → AI PREDICTION → OPTIMIZATION → RECOMMENDATION`

---

## 🌟 Overview & System Purpose

**SolarIQ** is a full-stack renewable energy intelligence application that unifies deterministic solar photovoltaic physics models, trained XGBoost machine learning regressors, automated tilt parameter sweep optimizers, and simulated real-time IoT hardware telemetry feeds into a responsive web platform.

The system evaluates array operating conditions (irradiance, ambient/panel temperatures, humidity, wind, panel count, array geometry, soiling, shading, age, weather, and panel type) to:
1. **Predict Real-World Output**: XGBoost regression model trained on physics-grounded synthetic telemetry ($R^2 = 0.9880$, $\text{MAE} = 5.74\text{ W}$, $\text{RMSE} = 7.82\text{ W}$).
2. **Calculate Physics Baseline**: Deterministic photovoltaic flux equation ($P = G \cdot A \cdot \eta$) incorporating temperature derating ($\gamma$), solar zenith geometry ($\cos \theta$), dust soiling, shading, and aging factors.
3. **Compare Physics vs. AI Predictions**: Side-by-side analytical residual comparison on interactive charts.
4. **Parameter Sweep Optimization**: Sweeps array tilt ($0^\circ \to 80^\circ$) and orientation azimuths to maximize generation gain.
5. **What-If Scenario Simulation**: Side-by-side comparative impact assessment of maintenance interventions (e.g. washing panels, removing shade, adjusting tilt).
6. **Diurnal Yield Profile**: Sunrise-to-sunset generation curve simulation with hourly Wh to kWh conversion.
7. **Performance Diagnostics & Loss Breakdown**: Intelligent insight generation for thermal loss, optical soiling loss, shading obstruction, and tilt derating.
8. **Live AR & ROI Studio**: Photovoltaic photon ray-tracing animation, 16-cell thermal anomaly heatmap visualizer with cooling jet trigger, and 25-year financial payback calculator.
9. **MongoDB Data Persistence**: Zero-downtime persistence for analysis history and scenario logs with environment variable support (`MONGODB_URI`, `MONGODB_DATABASE`) and automatic JSON fallback.
10. **Executive PDF Report Generator**: Printable performance audit report complete with signature lines and verified metrics.

---

## 🚀 Feature Module Matrix

- **Box 1: Dashboard** — Real-time telemetry gauge cards, 4 core KPIs, diurnal power curve, and solar health score indicator.
- **Box 2: Analyzer** — Multi-panel array configurator, ambient weather parameter controls, and energy loss breakdown.
- **Box 3: Optimizer** — Physics-guided parameter sweep (tilt $0^\circ \text{ to } 80^\circ$), mechanical servo alignment tracking loop.
- **Box 4: What-If Simulator** — Dual-scenario side-by-side maintenance delta comparison.
- **Box 9: Live AR & ROI Studio** — Interactive photon ray-tracing visualizer, 16-cell thermal anomaly scanner, and 25-year financial payback calculator.
- **Box 5: Model AI / Metrics** — Statistical performance evaluation ($R^2$, MAE, RMSE, training samples), feature importance breakdown, and physics equations.
- **Box 6: Daily Yield Simulation** — 24-hour solar zenith trajectory and diurnal generation profile.
- **Box 7: History & Logs** — MongoDB persistent analysis logs with individual item and clear-all operations.
- **Box 8: About SolarIQ** — 3-tier architecture overview, tech stack specifications, and system mantra.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite 5, Tailwind CSS v4, Recharts, Lucide React, Axios.
- **Backend API**: Python, FastAPI, Uvicorn.
- **AI & Data Engine**: XGBoost Regressor, Scikit-learn, Pandas, NumPy.
- **Database**: MongoDB / PyMongo (with zero-downtime fallback).
- **Testing**: Pytest test suite.

---

## ⚙️ Quick Start Guide

### 1. Environment Setup
Copy `.env.example` to create your local `.env` configuration:
```bash
cp .env.example .env
```

### 2. Backend Server Execution
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Execution
```bash
cd frontend
npm install
npm run dev
```

### 4. Running Test Suite
```bash
python backend/run_tests.py
```

---

## 🔬 Scientific & Transparency Disclosure

- **Physics Model**: Deterministic, explainable, and scientifically grounded calculations using Standard Test Conditions (STC $1000\text{ W/m}^2$, $25^\circ\text{C}$).
- **AI Predictions**: Generated dynamically by the pre-trained XGBoost model loaded into memory on server startup.
- **Prototype Status**: Simulated telemetry and photon visualizations represent software simulations designed for prototype and demonstration purposes prior to hardware integration.
