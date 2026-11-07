"""
SolarIQ Live Hierarchical Location & Real-Time Weather Service
Provides cascading administrative hierarchy, reverse geocoding, live location search,
and Open-Meteo real-time weather & solar irradiance data integration.
"""

import urllib.request
import urllib.parse
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

# --- In-Memory Caching System ---
CACHE = {
    "weather": {},
    "geocoding": {},
    "search": {}
}

CACHE_TTL_WEATHER = 600  # 10 minutes cache for live weather
CACHE_TTL_GEO = 86400    # 24 hours cache for location structures

# --- Rich Geographic Data for India & Major Global Regions ---

COUNTRIES = [
    {"code": "IN", "name": "India"},
    {"code": "US", "name": "United States"},
    {"code": "GB", "name": "United Kingdom"},
    {"code": "AU", "name": "Australia"},
    {"code": "CA", "name": "Canada"},
    {"code": "DE", "name": "Germany"},
    {"code": "JP", "name": "Japan"},
    {"code": "FR", "name": "France"},
    {"code": "BR", "name": "Brazil"},
    {"code": "ZA", "name": "South Africa"},
    {"code": "AE", "name": "United Arab Emirates"},
    {"code": "SG", "name": "Singapore"},
    {"code": "ES", "name": "Spain"},
    {"code": "IT", "name": "Italy"}
]

INDIA_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Lakshadweep", "Puducherry"
]

US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
]

ANDHRA_PRADESH_DISTRICTS = [
    "Anantapur", "Chittoor", "East Godavari", "Guntur", "YSR Kadapa", "Krishna", "Kurnool",
    "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari",
    "Bapatla", "Eluru", "Kakinada", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam",
    "Sri Sathya Sai", "Tirupati", "Alluri Sitharama Raju"
]

TELANGANA_DISTRICTS = [
    "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally",
    "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad",
    "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool",
    "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
    "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
    "Warangal", "Hanamkonda", "Yadadri Bhuvanagiri"
]

KARNATAKA_DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Urban", "Bengaluru Rural", "Bidar",
    "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada",
    "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar",
    "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru",
    "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"
]

MAHARASHTRA_DISTRICTS = [
    "Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed", "Bhandara",
    "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon",
    "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
    "Nandurbar", "Nashik", "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad",
    "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha",
    "Washim", "Yavatmal"
]

ANANTAPUR_MANDALS = [
    "Anantapur", "Tadpatri", "Guntakal", "Dharmavaram", "Kadiri", "Hindupur", "Rayadurg",
    "Kalyandurg", "Uravakonda", "Pamidi", "Singanamala", "Bukkarayasamudram", "Kudair",
    "Atmakur", "Raptadu", "Kanekal", "Narpala", "Putlur", "Peddavadugur", "Yadiki",
    "Beluguppa", "Bommanahal", "D.Hirehal", "Garladinne", "Kambadur", "Kundurpi",
    "Settur", "Vidapanakal", "Vajrakarur"
]

CHITTOOR_MANDALS = [
    "Chittoor", "Tirupati Urban", "Tirupati Rural", "Madanapalle", "Punganur", "Nagari",
    "Palamaner", "Srikalahasti", "Chandragiri", "Puthalapattu", "Gangadhara Nellore",
    "Bangarupalem", "Kuppam", "Gudipala", "Yadamari", "Karvetinagar", "Vedurukuppam"
]

ANANTAPUR_MANDAL_VILLAGES = [
    "Anantapur Urban / Town", "Kakkalapalli", "Rudrampeta", "Papampeta", "Alamuru",
    "Itikalapalli", "Prasannayapalli", "Katiganakal", "Salakalacheruvu", "Kandukur",
    "Ranga Puram", "Kamarupalli", "Gulimapalem", "Syedapuram", "Manchur"
]

TADPATRI_MANDAL_VILLAGES = [
    "Tadpatri Town", "Alur", "Bhogasamudram", "Bondaladinne", "Bugga", "Challavaripalli",
    "Chintalayamunapalli", "Diguvapalli", "Jamdalam", "Komalapadu", "Nitturu", "Sajjaladinne"
]

GUNTAKAL_MANDAL_VILLAGES = [
    "Guntakal Town", "Donga Obulapuram", "Gathasani", "Kasapuram", "Konasamudram",
    "Nagalapuram", "Nettikanti", "Pathapalem", "Timmanacherla"
]

# Coordinate database for instant offline/cache response
KNOWN_COORDINATES = {
    "anantapur": {"lat": 14.6819, "lon": 77.6006, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Anantapur", "village": "Anantapur Urban / Town"},
    "kakkalapalli": {"lat": 14.6542, "lon": 77.5891, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Anantapur", "village": "Kakkalapalli"},
    "tadpatri": {"lat": 14.9125, "lon": 78.0125, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Tadpatri", "village": "Tadpatri Town"},
    "guntakal": {"lat": 15.1667, "lon": 77.3667, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Guntakal", "village": "Guntakal Town"},
    "tirupati": {"lat": 13.6288, "lon": 79.4192, "country": "India", "state": "Andhra Pradesh", "district": "Tirupati", "mandal": "Tirupati Urban", "village": "Tirupati City"},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "country": "India", "state": "Telangana", "district": "Hyderabad", "mandal": "Hyderabad Urban", "village": "Hyderabad City"},
    "bengaluru": {"lat": 12.9716, "lon": 77.5946, "country": "India", "state": "Karnataka", "district": "Bengaluru Urban", "mandal": "Bengaluru North", "village": "Bengaluru City"},
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "country": "India", "state": "Maharashtra", "district": "Mumbai City", "mandal": "Mumbai Suburban", "village": "Mumbai City"},
    "delhi": {"lat": 28.6139, "lon": 77.2090, "country": "India", "state": "Delhi", "district": "New Delhi", "mandal": "Central Delhi", "village": "New Delhi"},
    "phoenix": {"lat": 33.4484, "lon": -112.0740, "country": "United States", "state": "Arizona", "district": "Maricopa County", "mandal": "Phoenix Metro", "village": "Phoenix City"},
    "madrid": {"lat": 40.4168, "lon": -3.7038, "country": "Spain", "state": "Community of Madrid", "district": "Madrid District", "mandal": "Centro", "village": "Madrid City"},
    "london": {"lat": 51.5074, "lon": -0.1278, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of London", "village": "London City"},
    "sydney": {"lat": -33.8688, "lon": 151.2093, "country": "Australia", "state": "New South Wales", "district": "Sydney Region", "mandal": "Sydney City", "village": "Sydney City"},
    "cairo": {"lat": 30.0444, "lon": 31.2357, "country": "Egypt", "state": "Cairo Governorate", "district": "Cairo Metro", "mandal": "El Tahrir", "village": "Cairo City"}
}


def _http_get_json(url: str, timeout: int = 6) -> Optional[Dict[str, Any]]:
    """Helper to perform HTTP GET requests safely with JSON response."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "SolarIQ-WeatherService/2.0 (Solar Panel Efficiency Platform)"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                data = resp.read().decode("utf-8")
                return json.loads(data)
    except Exception as e:
        print(f"[WeatherService HTTP Warning] GET {url} failed: {e}")
    return None


class WeatherService:
    @staticmethod
    def get_countries() -> List[Dict[str, str]]:
        """Returns list of supported countries."""
        return COUNTRIES

    @staticmethod
    def get_states(country: str) -> List[str]:
        """Returns administrative states/provinces for selected country."""
        country_clean = country.strip().lower()
        if "india" in country_clean or country_clean == "in":
            return INDIA_STATES
        elif "united states" in country_clean or country_clean == "us" or "america" in country_clean:
            return US_STATES
        
        # Try dynamic lookup via Open-Meteo Geocoding for other countries
        cache_key = f"states_{country_clean}"
        if cache_key in CACHE["geocoding"]:
            return CACHE["geocoding"][cache_key]

        query_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(country)}&count=10&language=en&format=json"
        res = _http_get_json(query_url)
        states = set()
        if res and "results" in res:
            for item in res["results"]:
                if item.get("admin1"):
                    states.add(item["admin1"])
        
        state_list = sorted(list(states)) if states else [f"{country} Capital Region", f"Central {country}", f"North {country}", f"South {country}"]
        CACHE["geocoding"][cache_key] = state_list
        return state_list

    @staticmethod
    def get_districts(country: str, state: str) -> List[str]:
        """Returns districts for selected country and state."""
        state_clean = state.strip().lower()
        if "andhra pradesh" in state_clean:
            return ANDHRA_PRADESH_DISTRICTS
        elif "telangana" in state_clean:
            return TELANGANA_DISTRICTS
        elif "karnataka" in state_clean:
            return KARNATAKA_DISTRICTS
        elif "maharashtra" in state_clean:
            return MAHARASHTRA_DISTRICTS
        
        cache_key = f"districts_{country}_{state}".lower()
        if cache_key in CACHE["geocoding"]:
            return CACHE["geocoding"][cache_key]

        # Dynamic search query for districts/admin2
        query_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(state)}&count=20&language=en&format=json"
        res = _http_get_json(query_url)
        districts = set()
        if res and "results" in res:
            for item in res["results"]:
                if item.get("admin2"):
                    districts.add(item["admin2"])
                elif item.get("name") and item.get("name").lower() != state_clean:
                    districts.add(item["name"])

        dist_list = sorted(list(districts)) if districts else [f"{state} Central District", f"{state} North District", f"{state} South District", f"{state} East District"]
        CACHE["geocoding"][cache_key] = dist_list
        return dist_list

    @staticmethod
    def get_mandals(country: str, state: str, district: str) -> List[str]:
        """Returns mandals / subdistricts for selected district."""
        district_clean = district.strip().lower()
        if "anantapur" in district_clean:
            return ANANTAPUR_MANDALS
        elif "chittoor" in district_clean:
            return CHITTOOR_MANDALS
        
        cache_key = f"mandals_{state}_{district}".lower()
        if cache_key in CACHE["geocoding"]:
            return CACHE["geocoding"][cache_key]

        query_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(district)}&count=20&language=en&format=json"
        res = _http_get_json(query_url)
        mandals = set()
        if res and "results" in res:
            for item in res["results"]:
                if item.get("admin3"):
                    mandals.add(item["admin3"])
                elif item.get("admin4"):
                    mandals.add(item["admin4"])

        mandal_list = sorted(list(mandals)) if mandals else [f"{district} Urban Mandal", f"{district} Rural Mandal", f"{district} North Mandal", f"{district} South Mandal"]
        CACHE["geocoding"][cache_key] = mandal_list
        return mandal_list

    @staticmethod
    def get_villages(country: str, state: str, district: str, mandal: str) -> List[str]:
        """Returns villages / localities for selected mandal."""
        mandal_clean = mandal.strip().lower()
        if "anantapur" in mandal_clean:
            return ANANTAPUR_MANDAL_VILLAGES
        elif "tadpatri" in mandal_clean:
            return TADPATRI_MANDAL_VILLAGES
        elif "guntakal" in mandal_clean:
            return GUNTAKAL_MANDAL_VILLAGES
        
        return [
            f"{mandal} Main Town / Locality",
            f"{mandal} North Locality",
            f"{mandal} East Village",
            f"{mandal} South Village",
            f"{mandal} Industrial Area"
        ]

    @staticmethod
    def resolve_coordinates(country: str, state: str, district: str, mandal: str, village: str) -> Dict[str, Any]:
        """Resolves exact latitude and longitude for a given hierarchical location."""
        search_terms = [v for v in [village, mandal, district, state, country] if v and "select" not in v.lower()]
        
        # Priority 1: Check known exact coordinates dictionary
        for term in search_terms:
            t_clean = term.strip().lower()
            if t_clean in KNOWN_COORDINATES:
                return {
                    "status": "success",
                    "lat": KNOWN_COORDINATES[t_clean]["lat"],
                    "lon": KNOWN_COORDINATES[t_clean]["lon"]
                }
        
        # Priority 2: Query Open-Meteo Geocoding API
        query = ", ".join(search_terms[:3])
        query_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(query)}&count=1&language=en&format=json"
        res = _http_get_json(query_url)
        
        if res and "results" in res and len(res["results"]) > 0:
            item = res["results"][0]
            return {"status": "success", "lat": round(item["latitude"], 4), "lon": round(item["longitude"], 4)}
        
        # Priority 3: Query OpenStreetMap Nominatim Search API
        nom_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
        nom_res = _http_get_json(nom_url)
        if nom_res and len(nom_res) > 0:
            item = nom_res[0]
            return {"status": "success", "lat": round(float(item["lat"]), 4), "lon": round(float(item["lon"]), 4)}

        # If unresolved, return error status instead of substituting a fake location
        return {
            "status": "error",
            "message": f"Coordinates could not be resolved for selected location ({query})."
        }

    @staticmethod
    def search_locations(query: str) -> List[Dict[str, Any]]:
        """Performs multi-level global location search across country, state, district, mandal, village."""
        if not query or len(query.strip()) < 2:
            return []
        
        query_clean = query.strip().lower()
        
        # Check instant known coordinates
        results = []
        for key, item in KNOWN_COORDINATES.items():
            if query_clean in key or query_clean in item["village"].lower() or query_clean in item["mandal"].lower() or query_clean in item["district"].lower() or query_clean in item["state"].lower():
                results.append({
                    "display_name": f"{item['village']}, {item['mandal']} Mandal, {item['district']} Dist, {item['state']}, {item['country']}",
                    "village": item["village"],
                    "mandal": item["mandal"],
                    "district": item["district"],
                    "state": item["state"],
                    "country": item["country"],
                    "latitude": item["lat"],
                    "longitude": item["lon"]
                })
        
        # Also query Open-Meteo Geocoding API
        api_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(query)}&count=10&language=en&format=json"
        res = _http_get_json(api_url)
        
        if res and "results" in res:
            for item in res["results"]:
                country = item.get("country", "Unknown")
                state = item.get("admin1", item.get("country", ""))
                district = item.get("admin2", state)
                mandal = item.get("admin3", district)
                village = item.get("name", mandal)
                
                display = f"{village}"
                if mandal and mandal != village:
                    display += f", {mandal}"
                if district and district not in (village, mandal):
                    display += f", {district}"
                if state and state not in (district, country):
                    display += f", {state}"
                display += f", {country}"

                results.append({
                    "display_name": display,
                    "village": village,
                    "mandal": mandal,
                    "district": district,
                    "state": state,
                    "country": country,
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude")
                })

        return results[:10]

    @staticmethod
    def reverse_geocode(lat: float, lon: float, accuracy: float = 0.0) -> Dict[str, Any]:
        """
        Performs normalized multi-tiered reverse geocoding for latitude and longitude.
        Queries OpenStreetMap Nominatim and BigDataCloud APIs to retrieve accurate
        administrative hierarchy (Country -> State -> District -> Subdistrict/Mandal -> Village/Locality).
        """
        # Validate coordinates
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return {
                "status": "error",
                "message": "Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180."
            }

        cache_key = f"rev_{round(lat, 4)}_{round(lon, 4)}"
        if cache_key in CACHE["geocoding"]:
            cached = dict(CACHE["geocoding"][cache_key])
            cached["accuracy"] = accuracy
            return cached

        country = "India"
        country_code = "IN"
        state = ""
        district = ""
        subdistrict = ""
        village = ""

        # Priority 1: Query OpenStreetMap Nominatim API for rich structured address data
        nom_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=en"
        nom_res = _http_get_json(nom_url, timeout=5)

        if nom_res and "address" in nom_res:
            addr = nom_res["address"]
            country = addr.get("country", country)
            country_code = addr.get("country_code", "in").upper()
            state = addr.get("state") or addr.get("province") or addr.get("region") or ""
            
            # Extract District
            dist_raw = addr.get("state_district") or addr.get("district") or addr.get("county") or addr.get("city_district") or ""
            if dist_raw:
                # Normalize spelling variations (e.g. "Anantapuram" -> "Anantapur")
                if "anantapur" in dist_raw.lower():
                    district = "Anantapur"
                elif "bengaluru" in dist_raw.lower() or "bangalore" in dist_raw.lower():
                    district = "Bengaluru Urban"
                else:
                    district = dist_raw

            # Extract Subdistrict (Mandal / Taluk / Tehsil)
            sub_raw = addr.get("county") or addr.get("subdistrict") or addr.get("municipality") or addr.get("mandal") or addr.get("taluk") or addr.get("tehsil") or ""
            if sub_raw and sub_raw != district:
                subdistrict = sub_raw
            else:
                subdistrict = district if district else state

            # Extract Village / Locality / Town / City
            loc_raw = (
                addr.get("village") or addr.get("suburb") or addr.get("neighbourhood") or 
                addr.get("locality") or addr.get("town") or addr.get("city") or 
                addr.get("residential") or addr.get("hamlet") or ""
            )
            village = loc_raw if loc_raw else (subdistrict if subdistrict else state)

        # Priority 2: Fallback to BigDataCloud API if Nominatim returned incomplete state/country
        if not state or not district:
            bdc_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
            bdc_res = _http_get_json(bdc_url, timeout=5)
            if bdc_res:
                country = bdc_res.get("countryName", country)
                country_code = bdc_res.get("countryCode", country_code).upper()
                state = bdc_res.get("principalSubdivision", state)
                locality = bdc_res.get("locality") or bdc_res.get("city") or ""
                
                admin_levels = bdc_res.get("localityInfo", {}).get("administrative", [])
                for level in admin_levels:
                    order = level.get("order")
                    name = level.get("name")
                    if order in [3, 4] and name and name != state:
                        if not district or district == country:
                            district = name
                    elif order in [5, 6] and name:
                        if not subdistrict or subdistrict == district:
                            subdistrict = name

                if locality and not village:
                    village = locality

        # Final Fallbacks for labels
        if not state:
            state = country
        if not district:
            district = state
        if not subdistrict:
            subdistrict = district
        if not village:
            village = subdistrict

        # Determine subdistrict type label (Mandal for AP/Telangana, Taluk for KA/TN, Tehsil for North India)
        state_clean = state.lower()
        if "andhra pradesh" in state_clean or "telangana" in state_clean:
            subdistrict_type = "Mandal"
        elif "karnataka" in state_clean or "tamil nadu" in state_clean or "kerala" in state_clean:
            subdistrict_type = "Taluk"
        elif "india" in country.lower():
            subdistrict_type = "Tehsil"
        else:
            subdistrict_type = "Sub-district"

        # Build clean display name hierarchy
        display_parts = []
        if village:
            display_parts.append(village)
        if subdistrict and subdistrict != village:
            display_parts.append(f"{subdistrict} {subdistrict_type}" if "india" in country.lower() and subdistrict_type not in subdistrict else subdistrict)
        if district and district not in (village, subdistrict):
            display_parts.append(f"{district} Dist" if "india" in country.lower() and "dist" not in district.lower() else district)
        if state and state not in (district, country):
            display_parts.append(state)
        display_parts.append(country)

        display_name = ", ".join(display_parts)

        result = {
            "status": "success",
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "accuracy": round(accuracy, 1),
            "country": country,
            "country_code": country_code,
            "state": state,
            "district": district,
            "subdistrict": subdistrict,
            "subdistrict_type": subdistrict_type,
            "mandal": subdistrict,       # alias for backward compatibility
            "village": village,
            "locality": village,         # alias for backward compatibility
            "display_name": display_name,
            "source": "gps"
        }

        CACHE["geocoding"][cache_key] = result
        return result

    @staticmethod
    def get_live_weather(lat: float, lon: float) -> Dict[str, Any]:
        """Fetches real-time weather and shortwave solar irradiance ($W/m^2$) for given coordinates."""
        cache_key = f"weather_{round(lat, 2)}_{round(lon, 2)}"
        now = time.time()

        if cache_key in CACHE["weather"]:
            cached_data, cached_time = CACHE["weather"][cache_key]
            if now - cached_time < CACHE_TTL_WEATHER:
                return cached_data

        # Query Open-Meteo real-time weather & solar irradiance API
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_normal_irradiance,diffuse_radiation,cloud_cover,weather_code"
            f"&timezone=auto"
        )

        res = _http_get_json(url)

        if res and "current" in res:
            curr = res["current"]
            
            temp_c = curr.get("temperature_2m", 28.0)
            humidity = curr.get("relative_humidity_2m", 50.0)
            wind_kmh = curr.get("wind_speed_10m", 10.0)
            wind_ms = round(wind_kmh / 3.6, 1)  # Convert km/h to m/s
            wind_dir = curr.get("wind_direction_10m", 180)
            cloud_cover = curr.get("cloud_cover", 15.0)
            pressure = curr.get("surface_pressure", 1013.2)
            
            # Solar Radiation (Shortwave Radiation / Global Horizontal Irradiance GHI in W/m²)
            shortwave = curr.get("shortwave_radiation", 0.0)
            direct = curr.get("direct_normal_irradiance", 0.0)
            
            # If shortwave radiation is provided (>0), use it; if night time (0 W/m²), report actual 0
            # For testing/demo during night hours, we provide active GHI if available, or solar geometry potential
            irradiance_w = round(max(0.0, shortwave), 1)
            
            # Calculate panel temperature based on irradiance and ambient temp
            panel_temp_c = round(temp_c + (irradiance_w / 800.0) * 25.0, 1)

            # Map weather code
            wcode = curr.get("weather_code", 0)
            weather_condition = WeatherService.map_weather_code(wcode)

            formatted_time = datetime.now().strftime("%I:%M %p")
            iso_time = datetime.now().isoformat()

            weather_data = {
                "status": "success",
                "is_live": True,
                "latitude": lat,
                "longitude": lon,
                "irradiance": irradiance_w,
                "shortwave_radiation": irradiance_w,
                "direct_radiation": round(direct, 1),
                "ambient_temp": round(temp_c, 1),
                "feels_like": round(temp_c + 1.2, 1),
                "panel_temp": panel_temp_c,
                "humidity": round(humidity, 1),
                "wind_speed": wind_ms,
                "wind_direction": wind_dir,
                "cloud_cover": round(cloud_cover, 1),
                "pressure": round(pressure, 1),
                "weather": weather_condition,
                "uv_index": round(max(0.0, irradiance_w / 100.0), 1),
                "timestamp": formatted_time,
                "updated_at": iso_time,
                "source": "Open-Meteo Real-Time Weather API"
            }

            CACHE["weather"][cache_key] = (weather_data, now)
            return weather_data

        # Fallback if API call fails
        formatted_time = datetime.now().strftime("%I:%M %p")
        return {
            "status": "fallback",
            "is_live": False,
            "latitude": lat,
            "longitude": lon,
            "irradiance": 850.0,
            "ambient_temp": 30.0,
            "panel_temp": 42.0,
            "humidity": 48.0,
            "wind_speed": 3.2,
            "cloud_cover": 20.0,
            "weather": "Sunny (Preset Fallback)",
            "timestamp": formatted_time,
            "updated_at": datetime.now().isoformat(),
            "source": "SolarIQ Backup Presets"
        }

    @staticmethod
    def map_weather_code(code: int) -> str:
        """Maps WMO weather code to clear human-readable string."""
        if code == 0:
            return "Clear Sky / Sunny"
        elif code in (1, 2, 3):
            return "Partly Cloudy"
        elif code in (45, 48):
            return "Foggy"
        elif code in (51, 53, 55, 56, 57):
            return "Light Drizzle"
        elif code in (61, 63, 65, 66, 67):
            return "Rainy"
        elif code in (71, 73, 75, 77):
            return "Snowy"
        elif code in (80, 81, 82):
            return "Rain Showers"
        elif code in (95, 96, 99):
            return "Thunderstorm"
        return "Clear Sky"


weather_service = WeatherService()
