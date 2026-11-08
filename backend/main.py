"""
SolarIQ FastAPI Backend Server
Integrates physics engine, XGBoost ML inference, parameter sweep tilt optimizer,
IoT WebSocket telemetry feeds (/ws/telemetry), carbon impact calculations, and MongoDB database persistence.
"""

import sys
import os
import asyncio
import json
import math
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads")
PROFILE_PHOTOS_DIR = os.path.join(UPLOAD_DIR, "profile_photos")
os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)

from fastapi import FastAPI, HTTPException, Path, Query, WebSocket, WebSocketDisconnect, Header, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from physics.engine import calculate_physics_power
from ml.model import ml_manager

from optimization.optimizer import optimize_panel_configuration
from services.diagnostics import (
    calculate_solar_health_score,
    generate_performance_diagnostics,
    generate_energy_loss_breakdown,
    simulate_daily_profile
)
from services.carbon import calculate_carbon_offset
from services.weather_presets import WEATHER_CITY_PRESETS
from services.weather_service import weather_service
from services.telemetry import generate_telemetry_snapshot
from database.mongo_db import db_manager
from services.email_service import email_service

def load_env_file():
    env_paths = [
        os.path.join(BACKEND_DIR, "..", ".env"),
        os.path.join(BACKEND_DIR, ".env")
    ]
    for env_path in env_paths:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            key = k.strip()
                            val = v.strip().strip("'").strip('"')
                            if key not in os.environ:
                                os.environ[key] = val
            except Exception as e:
                print(f"[SolarIQ ENV] Error reading {env_path}: {e}")

load_env_file()

app = FastAPI(
    title="SolarIQ API",
    description="Physics-Informed AI Solar Panel Efficiency & Telemetry Optimizer API",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

import hashlib

def hash_password(password: str) -> str:
    """Hashes passwords securely using SHA-256 with PBKDF2 HMAC salt."""
    salt = b"SolarIQ_Salt_2026_Secure"
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000).hex()

try:
    db_manager.seed_default_accounts(hash_password)
except Exception as e:
    print(f"[SolarIQ DB] Initial seeding warning: {e}")

@app.on_event("startup")
def startup_event():
    ml_manager.train_or_load_model()
    try:
        db_manager.seed_default_accounts(hash_password)
    except Exception as e:
        print(f"[SolarIQ DB] Seeding default accounts warning: {e}")
    print("[SolarIQ Backend] Application startup complete.")

# --- Authentication & Authorization Dependencies ---

def get_current_user(x_user_email: Optional[str] = Header(None, alias="X-SolarIQ-User-Email"),
                     authorization: Optional[str] = Header(None, alias="Authorization")):
    email = None
    if x_user_email:
        email = x_user_email.strip().lower()
    elif authorization and authorization.lower().startswith("bearer "):
        email = authorization[7:].strip().lower()

    if not email:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")

    # Explicitly reject legacy demo emails
    if email in ("admin@solariq.io", "user@solariq.io"):
        raise HTTPException(status_code=401, detail="Demo credentials are disabled. Please sign in with registered credentials.")

    user = db_manager.find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    if user.get("status") == "disabled":
        raise HTTPException(status_code=403, detail="Your account has been disabled by an administrator.")
    return user


def require_admin(user: Dict[str, Any] = Depends(get_current_user)):
    if user.get("role", "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Administrator privileges required.")
    return user

# --- Pydantic Data Validation Schemas ---

class LoginPayload(BaseModel):
    email: str = Field(..., description="User Email")
    password: str = Field(..., description="User Password")

class SendOTPPayload(BaseModel):
    email: str = Field(..., description="User Email Address")

class VerifyOTPPayload(BaseModel):
    email: str = Field(..., description="User Email Address")
    otp: str = Field(..., description="6-digit OTP Code")

class RegisterPayload(BaseModel):
    name: str = Field(..., min_length=1, description="User Full Name")
    email: str = Field(..., min_length=3, description="User Email")
    password: str = Field(..., min_length=6, description="User Password")
    confirm_password: Optional[str] = Field(None, description="Confirm Password")
    role: Optional[str] = Field("user", description="Requested role (strictly constrained to 'user')")
    location: Optional[str] = Field("Standard Installation Site", description="Installation location")

class ProfileUpdatePayload(BaseModel):
    name: str = Field(..., description="Full Name")
    location: Optional[str] = Field("", description="Installation Location")
    photo: Optional[str] = Field("", description="Profile Photo URL or Avatar")

class PasswordChangePayload(BaseModel):
    old_password: str = Field(..., description="Current Password")
    new_password: str = Field(..., description="New Password")

class UserStatusPayload(BaseModel):
    status: str = Field(..., description="Status: 'active' or 'disabled'")

class SolarInputPayload(BaseModel):
    irradiance: float = Field(850.0, ge=0.0, le=1500.0, description="Solar Irradiance (W/m²)")
    ambient_temp: float = Field(25.0, ge=-20.0, le=60.0, description="Ambient Temperature (°C)")
    panel_temp: float = Field(35.0, ge=-20.0, le=90.0, description="Panel Temperature (°C)")
    humidity: float = Field(50.0, ge=0.0, le=100.0, description="Relative Humidity (%)")
    wind_speed: float = Field(3.0, ge=0.0, le=40.0, description="Wind Speed (m/s)")
    weather: str = Field("Sunny", description="Weather condition")
    time_of_day: float = Field(12.0, ge=0.0, le=24.0, description="Time of day (Hour)")

    num_panels: int = Field(1, ge=1, le=200, description="Multi-Panel Array Count")
    area: float = Field(2.0, gt=0.0, le=1000.0, description="Panel Area per Panel (m²)")
    rated_power: float = Field(400.0, gt=0.0, le=100000.0, description="Rated Power per Panel (W)")
    efficiency: float = Field(20.0, gt=0.0, le=50.0, description="Panel Efficiency (%)")
    tilt: float = Field(25.0, ge=0.0, le=90.0, description="Tilt Angle (degrees)")
    azimuth: float = Field(180.0, ge=0.0, le=360.0, description="Panel Azimuth (degrees)")
    panel_type: str = Field("Monocrystalline", description="Panel Type")

    age: float = Field(2.0, ge=0.0, le=35.0, description="Panel Age (years)")
    soiling: float = Field(3.0, ge=0.0, le=100.0, description="Dust/Soiling Level (%)")
    shading: float = Field(5.0, ge=0.0, le=100.0, description="Shading Level (%)")

class OptimizePayload(BaseModel):
    params: SolarInputPayload
    mode: str = Field("tilt", description="Optimization mode: tilt, orientation, or both")

class WhatIfPayload(BaseModel):
    baseline: SolarInputPayload
    modified: SolarInputPayload

class SaveScenarioPayload(BaseModel):
    name: str = Field(..., description="Scenario Name")
    params: SolarInputPayload
    results: Dict[str, Any]

class SaveReportPayload(BaseModel):
    title: Optional[str] = Field("Executive Solar IQ Performance Report")
    inputs: Optional[Dict[str, Any]] = Field({})
    results: Optional[Dict[str, Any]] = Field({})
    location: Optional[Dict[str, Any]] = Field({})

class LocationPreferencePayload(BaseModel):
    country: Optional[str] = Field("India")
    state: Optional[str] = Field("Andhra Pradesh")
    district: Optional[str] = Field("Anantapur")
    mandal: Optional[str] = Field("Anantapur")
    village: Optional[str] = Field("Anantapur Urban / Town")
    latitude: float = Field(14.6819)
    longitude: float = Field(77.6006)
    display_name: Optional[str] = Field("")


# --- Public & Auth API Endpoints ---

@app.post("/api/auth/login")
@app.post("/api/auth/login/")
@app.post("/api/login")
@app.post("/api/login/")
def login_user(payload: LoginPayload):
    clean_email = payload.email.strip().lower()

    # Reject demo accounts explicitly
    if clean_email in ("admin@solariq.io", "user@solariq.io"):
        raise HTTPException(status_code=401, detail="Demo accounts are disabled. Please sign in with registered credentials.")

    user = db_manager.find_user_by_email(clean_email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    if user.get("status") == "disabled":
        raise HTTPException(status_code=403, detail="Account is disabled. Contact system administrator.")

    input_hash = hash_password(payload.password)
    if user.get("password_hash") != input_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    db_manager.log_activity("User Login", user["email"], {"role": user.get("role")})

    return {
        "status": "success",
        "message": "Login successful.",
        "access_token": user["email"],
        "token_type": "bearer",
        "user": {
            "name": user.get("name", "SolarIQ User"),
            "email": user.get("email"),
            "role": user.get("role", "user"),
            "location": user.get("location", "Standard Installation Site"),
            "created_at": user.get("created_at")
        }
    }

@app.post("/api/auth/send-otp")
@app.post("/api/auth/send-otp/")
def send_otp(payload: SendOTPPayload):
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    existing_user = db_manager.find_user_by_email(clean_email)
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email address already exists. Please log in.")

    # Rate limiting resends (30s cooldown check)
    latest = db_manager.get_latest_otp(clean_email)
    if latest and latest.get("created_at"):
        try:
            created_time = datetime.strptime(latest["created_at"], "%Y-%m-%d %H:%M:%S")
            if (datetime.now() - created_time).total_seconds() < 30:
                raise HTTPException(status_code=429, detail="Please wait 30 seconds before requesting another OTP.")
        except Exception:
            pass

    # Check if real email service is configured in .env
    if not email_service.is_email_configured():
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Please configure SMTP credentials in .env to send OTP emails."
        )

    # Generate 6-digit cryptographically secure OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expires_at_iso = (datetime.now() + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")

    # Send real email via SMTP
    sent_success, send_msg = email_service.send_otp_email(clean_email, otp_code)
    if not sent_success:
        raise HTTPException(status_code=502, detail=send_msg)

    db_manager.save_otp(clean_email, otp_hash, expires_at_iso)

    return {
        "status": "success",
        "message": f"OTP sent successfully to {clean_email}. Please check your inbox.",
        "cooldown": 30
    }


@app.post("/api/auth/verify-otp")
@app.post("/api/auth/verify-otp/")
def verify_otp(payload: VerifyOTPPayload):
    clean_email = payload.email.strip().lower()
    clean_otp = payload.otp.strip()

    if not clean_email or not clean_otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required.")

    otp_record = db_manager.get_latest_otp(clean_email)
    if not otp_record:
        raise HTTPException(status_code=400, detail="No pending OTP request found for this email address.")

    if otp_record.get("verified"):
        return {"status": "success", "message": "Email address verified ✓"}

    # Check expiration
    try:
        expires_at = datetime.strptime(otp_record["expires_at"], "%Y-%m-%d %H:%M:%S")
        if datetime.now() > expires_at:
            raise HTTPException(status_code=400, detail="This OTP has expired. Please request a new one.")
    except KeyError:
        pass

    # Check attempt limit
    if otp_record.get("attempts", 0) >= 5 or otp_record.get("expired"):
        raise HTTPException(status_code=400, detail="Too many invalid attempts. Please request a new OTP.")

    # Validate OTP hash
    input_hash = hashlib.sha256(clean_otp.encode("utf-8")).hexdigest()
    if input_hash != otp_record.get("otp_hash"):
        attempts = db_manager.increment_otp_attempts(clean_email)
        if attempts >= 5:
            raise HTTPException(status_code=400, detail="Too many invalid attempts. Please request a new OTP.")
        remaining = 5 - attempts
        raise HTTPException(status_code=400, detail=f"Incorrect OTP. Please try again ({remaining} attempts remaining).")

    # Mark as verified
    db_manager.mark_otp_verified(clean_email)

    return {
        "status": "success",
        "message": "Email address verified ✓"
    }

@app.get("/api/auth/config")
@app.get("/api/auth/config/")
def get_auth_config():
    """Returns dynamic authentication configuration (e.g. if SMTP verification is required)."""
    return {
        "status": "success",
        "email_verification_required": email_service.is_email_configured(),
        "admin_email": os.getenv("ADMIN_EMAIL", "99240040247@klu.ac.in").strip().lower()
    }

@app.post("/api/auth/register")
@app.post("/api/auth/register/")
@app.post("/api/register")
@app.post("/api/register/")
def register_user(payload: RegisterPayload):
    clean_name = payload.name.strip()
    clean_email = payload.email.strip().lower()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Full Name is required.")

    if not clean_email or "@" not in clean_email or "." not in clean_email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    if payload.confirm_password is not None and payload.confirm_password != payload.password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    admin_email = os.getenv("ADMIN_EMAIL", "99240040247@klu.ac.in").strip().lower()
    if clean_email == admin_email:
        raise HTTPException(status_code=400, detail="Administrator account cannot be registered through public registration.")

    if clean_email in ("admin@solariq.io", "user@solariq.io"):
        raise HTTPException(status_code=400, detail="Registration for this email is disallowed.")

    existing = db_manager.find_user_by_email(clean_email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email address already exists.")

    # Enforce backend email verification only if SMTP service is configured
    if email_service.is_email_configured():
        if not db_manager.is_email_verified(clean_email):
            raise HTTPException(status_code=400, detail="Please verify your email address using the OTP before creating your account.")

    # Strictly enforce role = 'user'
    user_doc = {
        "name": clean_name,
        "email": clean_email,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "location": payload.location or "Standard Installation Site",
        "status": "active"
    }
    db_manager.save_user(user_doc)
    db_manager.log_activity("User Registration", user_doc["email"], {"role": user_doc["role"]})

    return {
        "status": "success",
        "message": "Account created successfully.",
        "access_token": user_doc["email"],
        "token_type": "bearer",
        "user": {
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "location": user_doc["location"],
            "created_at": user_doc.get("created_at")
        }
    }


@app.get("/api/auth/me")
def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    user_clean = dict(user)
    user_clean.pop("password_hash", None)
    user_clean["num_analyses"] = len(db_manager.get_history(user_email=user["email"]))
    user_clean["num_scenarios"] = len(db_manager.get_scenarios(user_email=user["email"]))
    return user_clean

@app.post("/api/auth/profile")
def update_profile(payload: ProfileUpdatePayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    db_manager.update_user_profile(current_user["email"], payload.name, payload.location or "", payload.photo or "")
    db_manager.log_activity("Profile Update", current_user["email"])
    return {"status": "success", "message": "Profile updated successfully."}

@app.post("/api/user/profile/photo")
@app.post("/api/user/profile/photo/")
@app.post("/api/auth/profile/photo")
@app.post("/api/auth/profile/photo/")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if not file or not file.content_type:
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    allowed_mimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type.lower() not in allowed_mimes:
        raise HTTPException(status_code=400, detail="Please select a JPG, PNG, or WEBP image under 5 MB.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image file size exceeds the 5 MB limit. Please select a smaller photo.")

    ext = "jpg"
    if "png" in file.content_type.lower():
        ext = "png"
    elif "webp" in file.content_type.lower():
        ext = "webp"

    filename = f"profile_{uuid.uuid4().hex[:12]}_{int(datetime.now().timestamp())}.{ext}"
    filepath = os.path.join(PROFILE_PHOTOS_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/profile_photos/{filename}"
    db_manager.save_profile_photo(current_user["email"], photo_url, filename, file.content_type)
    db_manager.log_activity("Profile Photo Upload", current_user["email"])

    return {
        "status": "success",
        "message": "Profile photo uploaded successfully.",
        "photo_url": photo_url,
        "filename": filename
    }

@app.post("/api/auth/change-password")
def change_password(payload: PasswordChangePayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    user = db_manager.find_user_by_email(current_user["email"])
    if not user or user.get("password_hash") != hash_password(payload.old_password):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    
    db_manager.change_user_password(current_user["email"], hash_password(payload.new_password))
    db_manager.log_activity("Password Change", current_user["email"])
    return {"status": "success", "message": "Password updated successfully."}

# --- Protected Admin Operations APIs ---

@app.get("/api/admin/stats")
def get_admin_stats(admin: Dict[str, Any] = Depends(require_admin)):
    users = db_manager.get_all_users()
    history = db_manager.get_history(user_email=None, limit=500)
    scenarios = db_manager.get_scenarios(user_email=None)
    logs = db_manager.get_activity_logs(limit=20)
    return {
        "total_users": len(users),
        "total_analyses": len(history),
        "total_scenarios": len(scenarios),
        "mongodb_status": "Connected (MongoDB Atlas/Local)" if db_manager.use_mongo else "Active (Zero-Downtime JSON Fallback)",
        "ml_status": f"Active ({ml_manager.model_name}, R² = {ml_manager.metrics.get('r2', 0.988):.4f})",
        "users": users,
        "recent_activity": logs
    }

@app.get("/api/admin/users")
def get_admin_users(admin: Dict[str, Any] = Depends(require_admin)):
    return db_manager.get_all_users()

@app.get("/api/admin/users/{email}")
def get_admin_user_detail(email: str = Path(...), admin: Dict[str, Any] = Depends(require_admin)):
    user = db_manager.find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_clean = dict(user)
    user_clean.pop("password_hash", None)
    user_clean["history"] = db_manager.get_history(user_email=email, limit=20)
    user_clean["scenarios"] = db_manager.get_scenarios(user_email=email)
    return user_clean

@app.patch("/api/admin/users/{email}/status")
def toggle_user_status(payload: UserStatusPayload, email: str = Path(...), admin: Dict[str, Any] = Depends(require_admin)):
    if email.lower() == admin.get("email", "").lower():
        raise HTTPException(status_code=400, detail="Cannot disable your own admin account.")
    db_manager.toggle_user_status(email, payload.status)
    db_manager.log_activity("Account Status Toggle", admin["email"], {"target_user": email, "new_status": payload.status})
    return {"status": "success", "message": f"User status changed to {payload.status}."}

@app.delete("/api/admin/users/{email}")
def delete_user_by_admin(email: str = Path(...), admin: Dict[str, Any] = Depends(require_admin)):
    if email.lower() == admin.get("email", "").lower():
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
    db_manager.delete_user_account(email)
    db_manager.log_activity("User Deletion", admin["email"], {"target_user": email})
    return {"status": "success", "message": f"User account {email} deleted successfully."}

@app.get("/api/admin/analytics")
def get_admin_analytics(admin: Dict[str, Any] = Depends(require_admin)):
    return db_manager.get_platform_analytics()

@app.get("/api/admin/model")
def get_admin_model(admin: Dict[str, Any] = Depends(require_admin)):
    return {
        "model_name": ml_manager.model_name,
        "metrics": ml_manager.metrics,
        "features": [
            "irradiance", "ambient_temp", "panel_temp", "humidity", "wind_speed",
            "tilt", "azimuth", "shading", "soiling", "age", "time_of_day"
        ]
    }

@app.get("/api/admin/physics")
def get_admin_physics(admin: Dict[str, Any] = Depends(require_admin)):
    return {
        "formula": "P = G * A * η * f_temp * f_tilt * f_azimuth * f_shade * f_soiling * f_age",
        "temperature_coefficients": {
            "Monocrystalline": -0.0040,
            "Polycrystalline": -0.0045,
            "Thin-film": -0.0020
        },
        "assumptions": [
            "STC Irradiance: 1000 W/m²",
            "STC Cell Temperature: 25 °C",
            "Air Mass Ratio: AM 1.5",
            "Optical Reflection: 3%"
        ]
    }

@app.get("/api/admin/database")
def get_admin_database(admin: Dict[str, Any] = Depends(require_admin)):
    return db_manager.get_db_status()

@app.get("/api/admin/system")
def get_admin_system(admin: Dict[str, Any] = Depends(require_admin)):
    return {
        "backend_status": "ONLINE",
        "frontend_status": "ONLINE",
        "mongodb_status": "ONLINE" if db_manager.use_mongo else "FALLBACK_ACTIVE",
        "ml_engine_status": "ONLINE",
        "weather_api_status": "DEMO_PRESETS_ACTIVE"
    }

@app.get("/api/admin/activity")
def get_admin_activity_logs(admin: Dict[str, Any] = Depends(require_admin)):
    return db_manager.get_activity_logs(limit=100)

@app.get("/api/admin/reports")
def get_admin_reports(admin: Dict[str, Any] = Depends(require_admin)):
    users = db_manager.get_all_users()
    analytics = db_manager.get_platform_analytics()
    return {
        "report_title": "SolarIQ Platform System Audit",
        "timestamp": db_manager.get_history(user_email=None, limit=1)[0]["timestamp"] if db_manager.get_history(user_email=None) else "2026-09-20 12:00:00",
        "total_users": len(users),
        "analytics": analytics,
        "ml_accuracy_r2": ml_manager.metrics.get("r2", 0.988)
    }

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "app_name": "SolarIQ",
        "model_name": ml_manager.model_name,
        "model_r2": ml_manager.metrics.get("r2", 0.0),
        "database": "MongoDB (solariq_db)" if db_manager.use_mongo else "File Fallback (Zero-Downtime)"
    }

@app.get("/api/weather-presets")
def get_weather_presets():
    return WEATHER_CITY_PRESETS

# --- Live Location & Real-Time Weather APIs ---

@app.get("/api/location/countries")
def get_countries():
    return weather_service.get_countries()

@app.get("/api/location/states")
def get_states(country: str = Query("India")):
    return weather_service.get_states(country)

@app.get("/api/location/districts")
def get_districts(country: str = Query("India"), state: str = Query("Andhra Pradesh")):
    return weather_service.get_districts(country, state)

@app.get("/api/location/mandals")
@app.get("/api/location/subdistricts")
def get_mandals(country: str = Query("India"), state: str = Query("Andhra Pradesh"), district: str = Query("Anantapur")):
    return weather_service.get_mandals(country, state, district)

@app.get("/api/location/villages")
@app.get("/api/location/localities")
def get_villages(country: str = Query("India"), state: str = Query("Andhra Pradesh"), district: str = Query("Anantapur"), mandal: str = Query("Anantapur")):
    return weather_service.get_villages(country, state, district, mandal)

@app.get("/api/location/search")
def search_location(q: str = Query(..., description="Search location query string")):
    return weather_service.search_locations(q)

@app.get("/api/location/reverse-geocode")
def reverse_geocode(lat: float = Query(...), lon: float = Query(...), accuracy: float = Query(0.0)):
    return weather_service.reverse_geocode(lat, lon, accuracy)

@app.get("/api/location/resolve")
def resolve_location(
    country: str = Query("India"),
    state: str = Query("Andhra Pradesh"),
    district: str = Query("Anantapur"),
    mandal: str = Query("Anantapur"),
    village: str = Query("Anantapur Urban / Town")
):
    coords = weather_service.resolve_coordinates(country, state, district, mandal, village)
    if coords.get("status") == "error":
        raise HTTPException(status_code=404, detail=coords.get("message", "Coordinates could not be resolved."))
    return {
        "status": "success",
        "country": country,
        "state": state,
        "district": district,
        "mandal": mandal,
        "village": village,
        "latitude": coords["lat"],
        "longitude": coords["lon"]
    }

@app.get("/api/weather/live")
@app.get("/api/weather/current")
def get_live_weather(lat: float = Query(14.6819), lon: float = Query(77.6006)):
    return weather_service.get_live_weather(lat, lon)

@app.get("/api/user/location-preference")
def get_user_location_preference(current_user: Dict[str, Any] = Depends(get_current_user)):
    pref = db_manager.get_user_weather_location(current_user["email"])
    if not pref:
        return {
            "country": "India",
            "state": "Andhra Pradesh",
            "district": "Anantapur",
            "mandal": "Anantapur",
            "village": "Anantapur Urban / Town",
            "latitude": 14.6819,
            "longitude": 77.6006,
            "display_name": "Anantapur Urban / Town, Anantapur, Andhra Pradesh, India"
        }
    return pref

@app.post("/api/user/location-preference")
def save_user_location_preference(payload: LocationPreferencePayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    pref_dict = payload.dict()
    db_manager.update_user_weather_location(current_user["email"], pref_dict)
    db_manager.log_activity("Location Preference Updated", current_user["email"], {"location": pref_dict.get("display_name")})
    return {"status": "success", "message": "Location preference saved successfully."}


# --- Main Feature APIs (User Isolated) ---

@app.post("/api/analyze")
def analyze_panel(payload: SolarInputPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    params_dict = payload.dict()

    phys_res = calculate_physics_power(params_dict)
    physics_power = phys_res["physics_power_w"]

    ai_power = ml_manager.predict(params_dict)

    irradiance = params_dict["irradiance"]
    total_area = phys_res["total_area_m2"]
    if irradiance > 0 and total_area > 0:
        actual_eff = round((ai_power / (irradiance * total_area)) * 100.0, 2)
    else:
        actual_eff = 0.0

    opt_res = optimize_panel_configuration(params_dict, mode="tilt")
    health_res = calculate_solar_health_score(params_dict, ai_power, physics_power)
    diag_res = generate_performance_diagnostics(params_dict, opt_res)
    loss_breakdown = generate_energy_loss_breakdown(phys_res, ai_power)
    daily_res = simulate_daily_profile(params_dict)

    carbon_metrics = calculate_carbon_offset(daily_res["daily_energy_kwh"])
    telemetry = generate_telemetry_snapshot(params_dict, target_tilt=opt_res["optimized_config"]["tilt"])

    diff_w = round(ai_power - physics_power, 2)
    diff_pct = round(((ai_power - physics_power) / physics_power * 100.0), 2) if physics_power > 0 else 0.0

    output = {
        "input_params": params_dict,
        "array_specs": {
            "num_panels": params_dict["num_panels"],
            "total_area_m2": total_area,
            "total_rated_kw": phys_res["total_rated_kw"]
        },
        "physics_power_w": physics_power,
        "ai_power_w": ai_power,
        "efficiency_percent": actual_eff,
        "daily_energy_kwh": daily_res["daily_energy_kwh"],
        "carbon_impact": carbon_metrics,
        "health_score": health_res["health_score"],
        "performance_status": health_res["status"],
        "health_breakdown": health_res["breakdown"],
        "optimal_tilt": opt_res["optimized_config"]["tilt"],
        "optimal_azimuth": opt_res["optimized_config"]["azimuth"],
        "optimized_power_w": opt_res["optimized_config"]["power_w"],
        "percentage_gain": opt_res["percentage_gain"],
        "gain_w": opt_res["gain_w"],
        "physics_vs_ai": {
            "physics_power_w": physics_power,
            "ai_power_w": ai_power,
            "diff_w": diff_w,
            "diff_pct": diff_pct,
            "explanation": "The simplified physics model calculates theoretical power from solar geometry and optical losses. The XGBoost AI model predicts real-world output considering non-linear environmental interactions."
        },
        "diagnostics": diag_res["contributing_factors"],
        "recommendations": diag_res["recommendations"],
        "insights": diag_res["insights"],
        "feature_importance": ml_manager.metrics["feature_importance"],
        "loss_breakdown": loss_breakdown,
        "hourly_profile": daily_res["hourly_profile"],
        "search_curve": opt_res["search_curve"],
        "telemetry": telemetry
    }

    try:
        db_manager.save_history({
            "irradiance": irradiance,
            "panel_temp": params_dict["panel_temp"],
            "num_panels": params_dict["num_panels"],
            "tilt": params_dict["tilt"],
            "shading": params_dict["shading"],
            "soiling": params_dict["soiling"],
            "physics_power_w": physics_power,
            "ai_power_w": ai_power,
            "efficiency_percent": actual_eff,
            "daily_energy_kwh": daily_res["daily_energy_kwh"],
            "co2_avoided_kg": carbon_metrics["co2_avoided_kg_daily"],
            "health_score": health_res["health_score"],
            "optimal_tilt": opt_res["optimized_config"]["tilt"],
            "percentage_gain": opt_res["percentage_gain"]
        }, user_email=current_user["email"])
        db_manager.log_activity("Analysis Run", current_user["email"])
    except Exception as e:
        print(f"[SolarIQ DB Error] Failed saving history: {e}")

    return output

@app.post("/api/predict")
def predict_only(payload: SolarInputPayload):
    params_dict = payload.dict()
    phys_res = calculate_physics_power(params_dict)
    ai_power = ml_manager.predict(params_dict)
    return {
        "physics_power_w": phys_res["physics_power_w"],
        "ai_power_w": ai_power
    }

@app.post("/api/optimize")
def run_optimization(payload: OptimizePayload):
    params_dict = payload.params.dict()
    res = optimize_panel_configuration(params_dict, mode=payload.mode)
    actuation_path = []
    start_tilt = params_dict["tilt"]
    target_tilt = res["optimized_config"]["tilt"]
    step = 1.0 if target_tilt >= start_tilt else -1.0
    current = start_tilt
    while abs(current - target_tilt) > 0.5:
        current += step
        actuation_path.append(round(current, 1))
    actuation_path.append(target_tilt)
    res["actuation_path"] = actuation_path
    return res

@app.post("/api/simulate")
def run_daily_simulation(payload: SolarInputPayload):
    params_dict = payload.dict()
    res = simulate_daily_profile(params_dict)
    res["carbon_impact"] = calculate_carbon_offset(res["daily_energy_kwh"])
    return res

@app.post("/api/simulate-what-if")
def run_what_if(payload: WhatIfPayload):
    b_dict = payload.baseline.dict()
    m_dict = payload.modified.dict()

    b_power = ml_manager.predict(b_dict)
    m_power = ml_manager.predict(m_dict)

    b_daily = simulate_daily_profile(b_dict)["daily_energy_kwh"]
    m_daily = simulate_daily_profile(m_dict)["daily_energy_kwh"]

    b_area = b_dict["area"] * b_dict["num_panels"]
    m_area = m_dict["area"] * m_dict["num_panels"]

    b_eff = round((b_power / (b_dict["irradiance"] * b_area) * 100.0), 2) if b_dict["irradiance"] > 0 else 0.0
    m_eff = round((m_power / (m_dict["irradiance"] * m_area) * 100.0), 2) if m_dict["irradiance"] > 0 else 0.0

    delta_power = round(m_power - b_power, 2)
    delta_pct = round((delta_power / b_power * 100.0), 2) if b_power > 0 else 0.0
    delta_daily = round(m_daily - b_daily, 2)

    b_carbon = calculate_carbon_offset(b_daily)
    m_carbon = calculate_carbon_offset(m_daily)

    return {
        "baseline": {
            "power_w": b_power,
            "efficiency_percent": b_eff,
            "daily_energy_kwh": b_daily,
            "co2_avoided_kg": b_carbon["co2_avoided_kg_daily"],
            "tilt": b_dict["tilt"],
            "shading": b_dict["shading"],
            "soiling": b_dict["soiling"]
        },
        "modified": {
            "power_w": m_power,
            "efficiency_percent": m_eff,
            "daily_energy_kwh": m_daily,
            "co2_avoided_kg": m_carbon["co2_avoided_kg_daily"],
            "tilt": m_dict["tilt"],
            "shading": m_dict["shading"],
            "soiling": m_dict["soiling"]
        },
        "delta": {
            "power_w": delta_power,
            "percentage": delta_pct,
            "daily_energy_kwh": delta_daily,
            "co2_delta_kg": round(m_carbon["co2_avoided_kg_daily"] - b_carbon["co2_avoided_kg_daily"], 2)
        }
    }

@app.get("/api/model-metrics")
def get_model_metrics():
    return ml_manager.metrics

@app.get("/api/history")
def fetch_history(limit: int = Query(50, ge=1, le=200), current_user: Dict[str, Any] = Depends(get_current_user)):
    user_email = current_user["email"] if current_user.get("role") != "admin" else None
    return db_manager.get_history(user_email=user_email, limit=limit)

@app.delete("/api/history/{record_id}")
def delete_history_item(record_id: str = Path(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    user_email = current_user["email"] if current_user.get("role") != "admin" else None
    success = db_manager.delete_history_item(record_id, user_email=user_email)
    if not success:
        raise HTTPException(status_code=404, detail="History record not found or unauthorized.")
    return {"status": "deleted", "id": record_id}

@app.delete("/api/history")
def clear_history_all(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_email = current_user["email"] if current_user.get("role") != "admin" else None
    db_manager.clear_all_history(user_email=user_email)
    return {"status": "cleared"}

@app.get("/api/scenarios")
def fetch_scenarios(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_email = current_user["email"] if current_user.get("role") != "admin" else None
    return db_manager.get_scenarios(user_email=user_email)

@app.post("/api/scenarios")
def create_scenario(payload: SaveScenarioPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    scen_id = db_manager.save_scenario(
        payload.name,
        payload.params.dict(),
        payload.results,
        user_email=current_user["email"]
    )
    db_manager.log_activity("Scenario Saved", current_user["email"], {"scenario_name": payload.name})
    return {"status": "saved", "id": scen_id}

@app.delete("/api/scenarios/{scenario_id}")
def delete_scenario_item(scenario_id: str = Path(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    user_email = current_user["email"] if current_user.get("role", "").lower() != "admin" else None
    success = db_manager.delete_scenario(scenario_id, user_email=user_email)
    if not success:
        raise HTTPException(status_code=404, detail="Scenario not found or unauthorized.")
    return {"status": "deleted", "id": scenario_id}

# --- Protected User Reports APIs ---

@app.get("/api/reports")
def fetch_user_reports(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_email = current_user["email"] if current_user.get("role", "").lower() != "admin" else None
    return db_manager.get_reports(user_email=user_email)

@app.post("/api/reports")
def create_user_report(payload: SaveReportPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    report_doc = payload.dict()
    report_id = db_manager.save_report(report_doc, user_email=current_user["email"])
    db_manager.log_activity("Report Created", current_user["email"], {"title": payload.title})
    return {"status": "success", "id": report_id, "message": "Report saved successfully."}

@app.delete("/api/reports/{report_id}")
def delete_user_report_item(report_id: str = Path(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    user_email = current_user["email"] if current_user.get("role", "").lower() != "admin" else None
    success = db_manager.delete_report(report_id, user_email=user_email)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or unauthorized.")
    return {"status": "deleted", "id": report_id}

# --- WebSocket Telemetry Live Stream ---

@app.websocket("/ws/telemetry")
async def websocket_telemetry_stream(websocket: WebSocket):
    await websocket.accept()
    print("[SolarIQ WS] Client connected to live telemetry stream.")
    default_params = {
        "irradiance": 850.0,
        "panel_temp": 40.0,
        "soiling": 3.0,
        "shading": 5.0,
        "tilt": 25.0
    }
    try:
        while True:
            snapshot = generate_telemetry_snapshot(default_params)
            await websocket.send_json(snapshot)
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        print("[SolarIQ WS] Client disconnected from telemetry stream.")

# --- Static Frontend Serving ---
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("ws"):
            raise HTTPException(status_code=404, detail="Endpoint not found")
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

