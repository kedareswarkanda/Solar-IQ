import sys
import os

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from tests.test_backend import (
    test_physics_engine_basic,
    test_ml_manager_prediction,
    test_carbon_offset_calculation,
    test_optimizer_tilt_sweep,
    test_api_health_endpoint,
    test_api_analyze_endpoint,
    test_email_otp_flow,
    test_user_registration_and_login,
    test_admin_login_and_authorization,
    test_user_data_isolation,
    test_account_disabling_and_profile,
    test_profile_photo_upload,
    test_location_and_weather_endpoints,
    test_public_registration_role_enforcement,
    test_reports_crud_and_user_isolation,
    test_admin_database_status_endpoint,
    test_registration_validation_and_security_controls
)

def run_all_tests():
    print("[SolarIQ Test Runner] Starting test suite...", flush=True)
    test_physics_engine_basic()
    print("  [OK] test_physics_engine_basic PASSED", flush=True)
    test_ml_manager_prediction()
    print("  [OK] test_ml_manager_prediction PASSED", flush=True)
    test_carbon_offset_calculation()
    print("  [OK] test_carbon_offset_calculation PASSED", flush=True)
    test_optimizer_tilt_sweep()
    print("  [OK] test_optimizer_tilt_sweep PASSED", flush=True)
    test_api_health_endpoint()
    print("  [OK] test_api_health_endpoint PASSED", flush=True)
    test_api_analyze_endpoint()
    print("  [OK] test_api_analyze_endpoint PASSED", flush=True)
    test_email_otp_flow()
    print("  [OK] test_email_otp_flow PASSED", flush=True)
    test_user_registration_and_login()
    print("  [OK] test_user_registration_and_login PASSED", flush=True)
    test_admin_login_and_authorization()
    print("  [OK] test_admin_login_and_authorization PASSED", flush=True)
    test_user_data_isolation()
    print("  [OK] test_user_data_isolation PASSED", flush=True)
    test_account_disabling_and_profile()
    print("  [OK] test_account_disabling_and_profile PASSED", flush=True)
    test_profile_photo_upload()
    print("  [OK] test_profile_photo_upload PASSED", flush=True)
    test_location_and_weather_endpoints()
    print("  [OK] test_location_and_weather_endpoints PASSED", flush=True)
    test_public_registration_role_enforcement()
    print("  [OK] test_public_registration_role_enforcement PASSED", flush=True)
    test_reports_crud_and_user_isolation()
    print("  [OK] test_reports_crud_and_user_isolation PASSED", flush=True)
    test_admin_database_status_endpoint()
    print("  [OK] test_admin_database_status_endpoint PASSED", flush=True)
    test_registration_validation_and_security_controls()
    print("  [OK] test_registration_validation_and_security_controls PASSED", flush=True)
    print("[SolarIQ Test Runner] ALL TESTS PASSED SUCCESSFULLY!", flush=True)


if __name__ == "__main__":
    run_all_tests()

