"""
SolarIQ Backend Test Suite
"""

import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient

from main import app, hash_password
from database.mongo_db import db_manager
from physics.engine import calculate_physics_power
from ml.model import ml_manager
from optimization.optimizer import optimize_panel_configuration
from services.diagnostics import calculate_solar_health_score, simulate_daily_profile
from services.carbon import calculate_carbon_offset
from services.email_service import email_service

db_manager.seed_default_accounts(hash_password)
client = TestClient(app)


def test_physics_engine_basic():
    params = {
        "irradiance": 850.0,
        "ambient_temp": 25.0,
        "panel_temp": 35.0,
        "num_panels": 10,
        "area": 2.0,
        "rated_power": 400.0,
        "efficiency": 20.0,
        "tilt": 25.0,
        "azimuth": 180.0,
        "shading": 0.0,
        "soiling": 0.0
    }
    res = calculate_physics_power(params)
    assert "physics_power_w" in res
    assert res["physics_power_w"] > 0.0
    assert res["num_panels"] == 10
    assert res["total_rated_kw"] == 4.0

def test_ml_manager_prediction():
    ml_manager.train_or_load_model()
    params = {
        "irradiance": 850.0,
        "ambient_temp": 25.0,
        "panel_temp": 35.0,
        "humidity": 50.0,
        "wind_speed": 3.0,
        "num_panels": 2,
        "tilt": 25.0,
        "azimuth": 180.0,
        "panel_type": "Monocrystalline",
        "shading": 5.0,
        "soiling": 3.0,
        "age": 2.0,
        "time_of_day": 12.0
    }
    power = ml_manager.predict(params)
    assert isinstance(power, float)
    assert power >= 0.0
    assert ml_manager.metrics["r2"] > 0.0

def test_carbon_offset_calculation():
    c = calculate_carbon_offset(daily_energy_kwh=10.0)
    assert c["co2_avoided_kg_daily"] == 7.07
    assert c["equivalent_trees_planted"] > 0.0

def test_optimizer_tilt_sweep():
    params = {
        "irradiance": 850.0,
        "panel_temp": 35.0,
        "num_panels": 1,
        "tilt": 10.0,
        "azimuth": 180.0,
        "rated_power": 400.0
    }
    # Mode 1: Tilt Angle Only
    opt_tilt = optimize_panel_configuration(params, mode="tilt")
    assert "optimized_config" in opt_tilt
    assert len(opt_tilt["search_curve"]) > 5
    assert opt_tilt["optimized_config"]["power_w"] >= opt_tilt["current_config"]["power_w"]

    # Mode 2: Orientation / Azimuth Only
    opt_az = optimize_panel_configuration(params, mode="azimuth")
    assert "optimized_config" in opt_az
    assert len(opt_az["search_curve"]) > 5

    # Mode 3: Dual-Axis Co-Optimization
    opt_both = optimize_panel_configuration(params, mode="both")
    assert "optimized_config" in opt_both
    assert len(opt_both["search_curve"]) > 5

    # API Endpoint check for /api/optimize
    api_opt = client.post("/api/optimize", json={"params": params, "mode": "tilt"})
    assert api_opt.status_code == 200
    assert "optimized_config" in api_opt.json()

def test_api_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_api_analyze_endpoint():
    payload = {
        "irradiance": 850.0,
        "ambient_temp": 32.0,
        "panel_temp": 40.0,
        "humidity": 55.0,
        "wind_speed": 3.0,
        "weather": "Sunny",
        "time_of_day": 12.0,
        "num_panels": 4,
        "area": 2.0,
        "rated_power": 400.0,
        "efficiency": 20.0,
        "tilt": 25.0,
        "azimuth": 180.0,
        "panel_type": "Monocrystalline",
        "age": 2.0,
        "soiling": 3.0,
        "shading": 5.0
    }
    response = client.post("/api/analyze", json=payload, headers={"X-SolarIQ-User-Email": "test_engineer@solariq.io"})
    assert response.status_code == 200
    data = response.json()
    assert "ai_power_w" in data
    assert "carbon_impact" in data
    assert data["array_specs"]["num_panels"] == 4

def test_email_otp_flow():
    db_manager.delete_user_account("otp_test_user@solariq.io")
    email = "otp_test_user@solariq.io"

    # 1. Registration without verification -> Must be rejected (400) when email verification is required
    orig_is_configured = email_service.is_email_configured
    email_service.is_email_configured = lambda: True
    try:
        unverified_reg = client.post("/api/auth/register", json={
            "name": "OTP Test User",
            "email": email,
            "password": "password123"
        })
        assert unverified_reg.status_code == 400
        assert "verify your email" in unverified_reg.json()["detail"].lower()
    finally:
        email_service.is_email_configured = orig_is_configured

    # 2. Test send-otp behavior (returns 503 if SMTP is not configured in .env, or 200 if configured)
    send_res = client.post("/api/auth/send-otp", json={"email": email})
    assert send_res.status_code in (200, 503)
    if send_res.status_code == 503:
        assert "email service is not configured" in send_res.json()["detail"].lower()
    else:
        assert send_res.json()["status"] == "success"
        assert "otp" not in send_res.json()  # Ensure OTP is NEVER exposed in API response

    # 3. Verify with wrong OTP -> Rejected
    bad_verify = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000000"})
    assert bad_verify.status_code == 400

    # 4. Save and mark verified directly for registration test
    db_manager.save_otp(email, "dummy_hash", "2099-01-01 00:00:00")
    db_manager.mark_otp_verified(email)

    # 5. Registration after verification -> Succeeds
    verified_reg = client.post("/api/auth/register", json={
        "name": "OTP Test User",
        "email": email,
        "password": "password123"
    })
    assert verified_reg.status_code == 200
    assert verified_reg.json()["user"]["email"] == email



def test_user_registration_and_login():
    db_manager.delete_user_account("test_engineer@solariq.io")
    email = "test_engineer@solariq.io"

    # Pre-verify email for registration test
    db_manager.save_otp(email, "dummy_hash", "2099-01-01 00:00:00")
    db_manager.mark_otp_verified(email)

    reg_payload = {
        "name": "Test Engineer",
        "email": email,
        "password": "securepassword123",
        "role": "user"
    }
    # 1. Register new user
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200
    assert res.json()["user"]["email"] == email

    # 2. Duplicate registration attempt should be rejected (409 Conflict)
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 409

    # 3. Successful login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": "securepassword123"
    })
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "user"

    # 4. Incorrect password should be rejected (401)
    bad_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401

def test_admin_login_and_authorization():
    # 1. Admin login with correct credentials
    admin_login = client.post("/api/auth/login", json={
        "email": "99240040247@klu.ac.in",
        "password": "Kedar@12345"
    })
    assert admin_login.status_code == 200
    assert admin_login.json()["user"]["role"] == "admin"

    # 2. Admin login with incorrect password -> 401
    bad_admin_login = client.post("/api/auth/login", json={
        "email": "99240040247@klu.ac.in",
        "password": "WrongPassword999!"
    })
    assert bad_admin_login.status_code == 401

    # 3. Attempt login with old demo credentials -> must be rejected (401)
    demo_admin_login = client.post("/api/auth/login", json={
        "email": "admin@solariq.io",
        "password": "admin123"
    })
    assert demo_admin_login.status_code == 401

    demo_user_login = client.post("/api/auth/login", json={
        "email": "user@solariq.io",
        "password": "user123"
    })
    assert demo_user_login.status_code == 401

    # 4. Admin accessing admin stats -> Allowed
    admin_headers = {"X-SolarIQ-User-Email": "99240040247@klu.ac.in"}
    stats_res = client.get("/api/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert "total_users" in stats_res.json()

    # 5. Normal user accessing admin stats -> 403 Forbidden
    user_headers = {"X-SolarIQ-User-Email": "test_engineer@solariq.io"}
    forbidden_res = client.get("/api/admin/stats", headers=user_headers)
    assert forbidden_res.status_code == 403

def test_user_data_isolation():
    db_manager.save_otp("usera@solariq.io", "dummy", "2099-01-01 00:00:00")
    db_manager.mark_otp_verified("usera@solariq.io")
    db_manager.save_otp("userb@solariq.io", "dummy", "2099-01-01 00:00:00")
    db_manager.mark_otp_verified("userb@solariq.io")

    client.post("/api/auth/register", json={"name": "User A", "email": "usera@solariq.io", "password": "pass123userA", "role": "user"})
    client.post("/api/auth/register", json={"name": "User B", "email": "userb@solariq.io", "password": "pass123userB", "role": "user"})

    # User A creates analysis
    headers_a = {"X-SolarIQ-User-Email": "usera@solariq.io"}
    analyze_payload = {
        "irradiance": 850.0, "ambient_temp": 25.0, "panel_temp": 35.0,
        "humidity": 50.0, "wind_speed": 3.0, "weather": "Sunny", "time_of_day": 12.0,
        "num_panels": 1, "area": 2.0, "rated_power": 400.0, "efficiency": 20.0,
        "tilt": 25.0, "azimuth": 180.0, "panel_type": "Monocrystalline",
        "age": 2.0, "soiling": 3.0, "shading": 5.0
    }
    client.post("/api/analyze", json=analyze_payload, headers=headers_a)

    # User A checks history
    hist_a_res = client.get("/api/history", headers=headers_a)
    assert hist_a_res.status_code == 200
    hist_a = hist_a_res.json()
    assert isinstance(hist_a, list)
    assert len(hist_a) >= 1
    assert all(h.get("user_email") == "usera@solariq.io" for h in hist_a)

    # User B checks history -> should NOT see User A's history
    headers_b = {"X-SolarIQ-User-Email": "userb@solariq.io"}
    hist_b_res = client.get("/api/history", headers=headers_b)
    assert hist_b_res.status_code == 200
    hist_b = hist_b_res.json()
    assert isinstance(hist_b, list)
    assert not any(h.get("user_email") == "usera@solariq.io" for h in hist_b)


def test_account_disabling_and_profile():
    headers_admin = {"X-SolarIQ-User-Email": "99240040247@klu.ac.in"}
    headers_user = {"X-SolarIQ-User-Email": "test_engineer@solariq.io"}

    # 1. Update Profile
    prof_res = client.post("/api/auth/profile", json={
        "name": "Updated Operator Name",
        "location": "Solar Site Alpha"
    }, headers=headers_user)
    assert prof_res.status_code == 200

    # 2. Disable user account via admin endpoint
    client.patch("/api/admin/users/test_engineer@solariq.io/status", json={"status": "disabled"}, headers=headers_admin)

    # 3. Disabled user login attempt -> 403 Forbidden
    disabled_login = client.post("/api/auth/login", json={
        "email": "test_engineer@solariq.io",
        "password": "securepassword123"
    })
    assert disabled_login.status_code == 403

    # Re-enable user account for operational state
    client.patch("/api/admin/users/test_engineer@solariq.io/status", json={"status": "active"}, headers=headers_admin)

def test_location_and_weather_endpoints():
    headers_user = {"X-SolarIQ-User-Email": "test_engineer@solariq.io"}
    
    # 1. Countries
    res_c = client.get("/api/location/countries")
    assert res_c.status_code == 200
    assert any(c["name"] == "India" for c in res_c.json())

    # 2. States for India
    res_s = client.get("/api/location/states?country=India")
    assert res_s.status_code == 200
    assert "Andhra Pradesh" in res_s.json()
    assert "Tamil Nadu" in res_s.json()

    # 3. Districts for Tamil Nadu (all 38 districts, zero Andhra Pradesh cross-contamination)
    res_tn = client.get("/api/location/districts?country=India&state=Tamil%20Nadu")
    assert res_tn.status_code == 200
    tn_districts = res_tn.json()
    assert len(tn_districts) == 38
    assert "Pudukkottai" in tn_districts
    assert "Chennai" in tn_districts
    assert "Anantapur" not in tn_districts
    assert "Chittoor" not in tn_districts
    assert "Kurnool" not in tn_districts

    # 4. Districts for Andhra Pradesh
    res_d = client.get("/api/location/districts?country=India&state=Andhra%20Pradesh")
    assert res_d.status_code == 200
    assert "Anantapur" in res_d.json()
    assert "Pudukkottai" not in res_d.json()

    # 5. Mandals for Pudukkottai, Tamil Nadu
    res_tn_m = client.get("/api/location/mandals?country=India&state=Tamil%20Nadu&district=Pudukkottai")
    assert res_tn_m.status_code == 200
    assert "Pudukkottai" in res_tn_m.json()
    assert "Alangudi" in res_tn_m.json()
    assert "Aranthangi" in res_tn_m.json()

    # 6. Global countries: UK, Spain, Egypt
    res_uk_s = client.get("/api/location/states?country=United%20Kingdom")
    assert res_uk_s.status_code == 200
    assert "England" in res_uk_s.json()
    assert "Scotland" in res_uk_s.json()

    res_uk_d = client.get("/api/location/districts?country=United%20Kingdom&state=England")
    assert res_uk_d.status_code == 200
    assert "Greater London" in res_uk_d.json()

    res_es_s = client.get("/api/location/states?country=Spain")
    assert res_es_s.status_code == 200
    assert "Community of Madrid" in res_es_s.json()
    assert "Catalonia" in res_es_s.json()

    res_eg_s = client.get("/api/location/states?country=Egypt")
    assert res_eg_s.status_code == 200
    assert "Cairo Governorate" in res_eg_s.json()

    # 7. Coordinates resolve for Pudukkottai
    res_res = client.get("/api/location/resolve?country=India&state=Tamil%20Nadu&district=Pudukkottai&mandal=Pudukkottai&village=Pudukkottai%20Town")
    assert res_res.status_code == 200
    assert abs(res_res.json()["latitude"] - 10.3833) < 0.01

    # 8. Mandals for Anantapur
    res_m = client.get("/api/location/mandals?country=India&state=Andhra%20Pradesh&district=Anantapur")
    assert res_m.status_code == 200
    assert "Anantapur" in res_m.json()

    # 5. Live Weather for Anantapur coordinates
    res_w = client.get("/api/weather/live?lat=14.6819&lon=77.6006")
    assert res_w.status_code == 200
    w_data = res_w.json()
    assert "ambient_temp" in w_data
    assert "irradiance" in w_data

    # 6. User location preference save & retrieve
    pref_payload = {
        "country": "India",
        "state": "Andhra Pradesh",
        "district": "Anantapur",
        "mandal": "Anantapur",
        "village": "Kakkalapalli",
        "latitude": 14.6542,
        "longitude": 77.5891,
        "display_name": "Kakkalapalli, Anantapur Mandal, Anantapur, Andhra Pradesh, India"
    }
    res_save = client.post("/api/user/location-preference", json=pref_payload, headers=headers_user)
    assert res_save.status_code == 200
    
    res_get = client.get("/api/user/location-preference", headers=headers_user)
    assert res_get.status_code == 200
    assert res_get.json()["village"] == "Kakkalapalli"

def test_public_registration_role_enforcement():
    db_manager.delete_user_account("hacker@solariq.io")
    db_manager.save_otp("hacker@solariq.io", "dummy_hash", "2099-01-01 00:00:00")
    db_manager.mark_otp_verified("hacker@solariq.io")

    res = client.post("/api/auth/register", json={
        "name": "Hacker User",
        "email": "hacker@solariq.io",
        "password": "password123",
        "role": "admin"
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "user"

def test_profile_photo_upload():
    headers = {"X-SolarIQ-User-Email": "test_engineer@solariq.io"}
    dummy_jpg = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00DummyJpgData"

    # 1. Valid JPG photo upload -> Succeeds
    res = client.post(
        "/api/user/profile/photo",
        files={"file": ("test_passport.jpg", dummy_jpg, "image/jpeg")},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "/uploads/profile_photos/" in data["photo_url"]

    # 2. Invalid file format -> Rejected (400)
    bad_res = client.post(
        "/api/user/profile/photo",
        files={"file": ("malicious.exe", b"binarydata", "application/x-msdownload")},
        headers=headers
    )
    assert bad_res.status_code == 400

    # 3. Check /api/auth/me reflects uploaded photo URL
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json().get("photo") == data["photo_url"]

def test_reports_crud_and_user_isolation():
    headers_a = {"X-SolarIQ-User-Email": "usera@solariq.io"}
    headers_b = {"X-SolarIQ-User-Email": "userb@solariq.io"}

    # 1. User A creates report
    rep_res = client.post("/api/reports", json={
        "title": "User A Solar Audit Report",
        "inputs": {"num_panels": 10, "tilt": 25},
        "results": {"daily_energy_kwh": 45.2}
    }, headers=headers_a)
    assert rep_res.status_code == 200
    report_id = rep_res.json()["id"]

    # 2. User A retrieves reports -> contains User A's report
    reps_a = client.get("/api/reports", headers=headers_a)
    assert reps_a.status_code == 200
    assert any(r.get("title") == "User A Solar Audit Report" for r in reps_a.json())

    # 3. User B retrieves reports -> does NOT contain User A's report
    reps_b = client.get("/api/reports", headers=headers_b)
    assert reps_b.status_code == 200
    assert not any(r.get("title") == "User A Solar Audit Report" for r in reps_b.json())

    # 4. User B attempts to delete User A's report -> rejected
    del_b = client.delete(f"/api/reports/{report_id}", headers=headers_b)
    assert del_b.status_code == 404

    # 5. User A deletes own report -> success
    del_a = client.delete(f"/api/reports/{report_id}", headers=headers_a)
    assert del_a.status_code == 200

def test_admin_database_status_endpoint():
    headers_admin = {"X-SolarIQ-User-Email": "99240040247@klu.ac.in"}
    res = client.get("/api/admin/database", headers=headers_admin)
    assert res.status_code == 200
    data = res.json()
    assert "database" in data
    assert "collections" in data
    colls = data["collections"]
    assert "users" in colls
    assert "history" in colls
    assert "scenarios" in colls
    assert "location_preferences" in colls
    assert "activity_logs" in colls
    assert "reports" in colls

def test_registration_validation_and_security_controls():
    # 1. Test registration with mismatched passwords -> 400
    res_mismatch = client.post("/api/auth/register", json={
        "name": "Mismatch Test",
        "email": "mismatch@test.com",
        "password": "Password123",
        "confirm_password": "DifferentPassword456"
    })
    assert res_mismatch.status_code == 400
    assert "passwords do not match" in res_mismatch.json()["detail"].lower()

    # 2. Test registration with password < 6 characters -> 400 or 422 (Pydantic validation error)
    res_short = client.post("/api/auth/register", json={
        "name": "Short Password Test",
        "email": "short@test.com",
        "password": "123",
        "confirm_password": "123"
    })
    assert res_short.status_code in (400, 422)

    # 3. Test attempting to register the administrator email through public registration -> 400
    res_admin_reg = client.post("/api/auth/register", json={
        "name": "Fake Admin",
        "email": "99240040247@klu.ac.in",
        "password": "HackerPassword123",
        "confirm_password": "HackerPassword123"
    })
    assert res_admin_reg.status_code == 400
    assert "administrator account cannot be registered" in res_admin_reg.json()["detail"].lower()

    # 4. Test unauthenticated request to protected endpoint -> 401
    res_unauth = client.get("/api/auth/me")
    assert res_unauth.status_code == 401


