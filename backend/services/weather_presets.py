"""
SolarIQ Weather City Climate Presets Module
Provides solar climate parameters for major global solar hubs.
"""

WEATHER_CITY_PRESETS = {
    "Phoenix, AZ (Desert Sun)": {
        "city": "Phoenix, AZ",
        "irradiance": 980.0,
        "ambient_temp": 38.0,
        "panel_temp": 58.0,
        "humidity": 20.0,
        "wind_speed": 2.8,
        "weather": "Sunny",
        "tilt": 25.0,
        "azimuth": 180.0,
        "shading": 0.0,
        "soiling": 4.0
    },
    "Madrid, Spain (Mediterranean)": {
        "city": "Madrid, Spain",
        "irradiance": 860.0,
        "ambient_temp": 29.0,
        "panel_temp": 42.0,
        "humidity": 45.0,
        "wind_speed": 3.2,
        "weather": "Sunny",
        "tilt": 30.0,
        "azimuth": 180.0,
        "shading": 2.0,
        "soiling": 2.0
    },
    "Cairo, Egypt (Sahara Sun)": {
        "city": "Cairo, Egypt",
        "irradiance": 1050.0,
        "ambient_temp": 36.0,
        "panel_temp": 54.0,
        "humidity": 30.0,
        "wind_speed": 4.1,
        "weather": "Sunny",
        "tilt": 28.0,
        "azimuth": 180.0,
        "shading": 0.0,
        "soiling": 8.0
    },
    "London, UK (Temperate Overcast)": {
        "city": "London, UK",
        "irradiance": 420.0,
        "ambient_temp": 18.0,
        "panel_temp": 24.0,
        "humidity": 75.0,
        "wind_speed": 5.2,
        "weather": "Cloudy",
        "tilt": 35.0,
        "azimuth": 180.0,
        "shading": 8.0,
        "soiling": 1.5
    },
    "Mumbai, India (Tropical Sun)": {
        "city": "Mumbai, India",
        "irradiance": 880.0,
        "ambient_temp": 33.0,
        "panel_temp": 48.0,
        "humidity": 70.0,
        "wind_speed": 2.5,
        "weather": "Partly Cloudy",
        "tilt": 19.0,
        "azimuth": 180.0,
        "shading": 3.0,
        "soiling": 5.0
    },
    "Sydney, Australia (Southern Sun)": {
        "city": "Sydney, Australia",
        "irradiance": 920.0,
        "ambient_temp": 27.0,
        "panel_temp": 40.0,
        "humidity": 50.0,
        "wind_speed": 4.0,
        "weather": "Sunny",
        "tilt": 33.0,
        "azimuth": 0.0,
        "shading": 1.0,
        "soiling": 2.0
    }
}
