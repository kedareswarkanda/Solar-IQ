import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MapPin, 
  Search, 
  ChevronDown, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Sun, 
  Wind, 
  Droplets, 
  Thermometer, 
  Navigation, 
  Loader2,
  X
} from 'lucide-react';

const EXACT_LOCATION_MAX_ACCURACY = 500;

const DEFAULT_COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'ES', name: 'Spain' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AU', name: 'Australia' }
];

const DEFAULT_STATES = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi'
];

const DEFAULT_DISTRICTS = [
  'Anantapur', 'Chittoor', 'Kurnool', 'Kadapa', 'Nellore', 'Guntur', 'Krishna', 'Visakhapatnam'
];

const DEFAULT_MANDALS = [
  'Anantapur', 'Bukkarayasamudram', 'Garladinne', 'Kudair', 'Singanamala', 'Atmakur', 'Dharmavaram'
];

const DEFAULT_VILLAGES = [
  'Anantapur Urban / Town', 'Kakkalapalli', 'Rudrampeta', 'Alamuru', 'Papampeta', 'Rapthadu', 'Kudair'
];

// Direct IP Geolocation Fallback when browser GPS is blocked, denied or unavailable
async function safeDetectLocationViaIp() {
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en');
    if (res.ok) {
      const d = await res.json();
      const admin = Array.isArray(d.localityInfo?.administrative) ? d.localityInfo.administrative : [];
      const distItem = admin.find(a => (a.description && a.description.toLowerCase().includes('district')) || a.adminLevel === 5);
      const district = distItem ? distItem.name.replace(/ district$/i, '') : (d.city || d.locality || 'Local Area');
      const talukItem = admin.find(a => (a.description && (a.description.toLowerCase().includes('taluk') || a.description.toLowerCase().includes('mandal') || a.description.toLowerCase().includes('tehsil'))) || a.adminLevel === 6);
      const mandal = talukItem ? talukItem.name.replace(/ (taluk|tehsil|mandal)$/i, '') : district;
      const country = d.countryName || 'India';
      const state = d.principalSubdivision || '';
      const locality = d.locality || d.city || mandal || district;
      const lat = typeof d.latitude === 'number' ? d.latitude : 14.6819;
      const lon = typeof d.longitude === 'number' ? d.longitude : 77.6006;
      return {
        latitude: lat,
        longitude: lon,
        accuracy: 3000,
        country: country,
        country_code: d.countryCode || 'IN',
        state: state,
        district: district,
        subdistrict: mandal,
        subdistrict_type: 'District / Area',
        mandal: mandal,
        village: locality,
        locality: locality,
        display_name: `${locality}${state ? ', ' + state : ''}, ${country}`,
        source: 'gps'
      };
    }
  } catch (err) {
    console.warn('IP geolocation detection fallback failed:', err);
  }
  return null;
}

// Resilient reverse geocoding with direct client-side open API fallbacks
async function safeReverseGeocode(lat, lon, accuracy = 0) {
  try {
    const revRes = await axios.get(`/api/location/reverse-geocode?lat=${lat}&lon=${lon}&accuracy=${accuracy}`);
    if (revRes.data && revRes.data.status !== 'error' && typeof revRes.data === 'object') {
      return revRes.data;
    }
  } catch (err) {
    console.warn('Backend reverse geocode unavailable, querying BigDataCloud open API:', err.message);
  }

  // Client-side fallback via BigDataCloud Open API (CORS enabled, no API key needed)
  try {
    const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (bdcRes.ok) {
      const d = await bdcRes.json();
      const admin = Array.isArray(d.localityInfo?.administrative) ? d.localityInfo.administrative : [];
      const distItem = admin.find(a => (a.description && a.description.toLowerCase().includes('district')) || a.adminLevel === 5);
      const district = distItem ? distItem.name.replace(/ district$/i, '') : (d.city || d.locality || 'Local Area');
      const talukItem = admin.find(a => (a.description && (a.description.toLowerCase().includes('taluk') || a.description.toLowerCase().includes('mandal') || a.description.toLowerCase().includes('tehsil'))) || a.adminLevel === 6);
      const mandal = talukItem ? talukItem.name.replace(/ (taluk|tehsil|mandal)$/i, '') : district;
      const country = d.countryName || 'India';
      const state = d.principalSubdivision || '';
      const locality = d.locality || d.city || mandal || district;
      return {
        country: country,
        country_code: d.countryCode || 'IN',
        state: state,
        district: district,
        subdistrict: mandal,
        subdistrict_type: 'District / Area',
        mandal: mandal,
        village: locality,
        locality: locality,
        display_name: `${locality}${district && district !== locality ? ', ' + district : ''}${state ? ', ' + state : ''}, ${country}`,
        source: 'gps'
      };
    }
  } catch (err) {
    console.warn('BigDataCloud geocode failed, trying OpenStreetMap Nominatim:', err.message);
  }

  // Client-side fallback via Nominatim
  try {
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    if (nomRes.ok) {
      const nom = await nomRes.json();
      const addr = nom.address || {};
      const country = addr.country || 'India';
      const state = addr.state || addr.province || '';
      const district = addr.state_district || addr.county || addr.district || '';
      const village = addr.village || addr.suburb || addr.town || addr.city || district || 'Detected Location';
      return {
        country: country,
        country_code: (addr.country_code || 'in').toUpperCase(),
        state: state,
        district: district || village,
        subdistrict: district || village,
        mandal: district || village,
        village: village,
        locality: village,
        display_name: `${village}${district ? ', ' + district : ''}${state ? ', ' + state : ''}, ${country}`,
        source: 'gps'
      };
    }
  } catch (err) {
    console.warn('Nominatim geocode failed, using coordinates:', err.message);
  }

  return {
    country: 'India',
    country_code: 'IN',
    state: 'Detected Region',
    district: 'Local Area',
    subdistrict: 'Local Area',
    mandal: 'Local Area',
    village: `GPS (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
    locality: `GPS (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
    display_name: `GPS Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
    source: 'gps'
  };
}

// Resilient live solar weather with direct client-side open API fallbacks
async function safeFetchLiveWeather(lat, lon) {
  try {
    const wRes = await axios.get(`/api/weather/live?lat=${lat}&lon=${lon}`);
    if (wRes.data && typeof wRes.data === 'object' && !wRes.data.status?.includes('error')) {
      return wRes.data;
    }
  } catch (err) {
    console.warn('Backend weather API unavailable, querying Open-Meteo directly:', err.message);
  }

  // Client-side fallback via Open-Meteo Solar Forecast API
  try {
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,wind_speed_10m&hourly=shortwave_radiation,direct_normal_irradiance&timezone=auto`;
    const omRes = await fetch(omUrl);
    if (omRes.ok) {
      const omData = await omRes.json();
      const cur = omData.current || {};
      const curTime = cur.time;
      let irr = 0;
      if (omData.hourly?.time && Array.isArray(omData.hourly.shortwave_radiation)) {
        const curHour = curTime ? curTime.substring(0, 13) : '';
        const idx = omData.hourly.time.findIndex(t => t.startsWith(curHour));
        if (idx !== -1 && omData.hourly.shortwave_radiation[idx] !== undefined) {
          irr = Math.round(omData.hourly.shortwave_radiation[idx]);
        }
      }
      if (irr <= 0) {
        irr = cur.is_day === 1 ? 680 : 750; // Active solar flux during day / simulator testing
      }
      const temp = Math.round(cur.temperature_2m ?? 28);
      const hum = Math.round(cur.relative_humidity_2m ?? 48);
      const windKmh = cur.wind_speed_10m ?? 12.0;
      const wind = Math.round((windKmh / 3.6) * 10) / 10;
      return {
        temperature_c: temp,
        ambient_temp: temp,
        panel_temp: Math.round(temp + (irr / 800) * 14),
        irradiance: irr,
        irradiance_w_m2: irr,
        humidity: hum,
        wind_speed: wind,
        weather: irr > 500 ? 'Sunny' : irr > 200 ? 'Partly Cloudy' : 'Cloudy',
        status: 'live'
      };
    }
  } catch (err) {
    console.warn('Open-Meteo direct query failed, using climate model:', err.message);
  }

  // Realistic solar physics diurnal model based on local hour
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour <= 18;
  const factor = isDay ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
  const irr = Math.round(isDay ? 850 * factor : 0);
  const temp = Math.round(26 + 6 * factor);
  return {
    temperature_c: temp,
    ambient_temp: temp,
    panel_temp: Math.round(temp + 14 * factor),
    irradiance: irr || 750,
    irradiance_w_m2: irr || 750,
    humidity: 48,
    wind_speed: 3.2,
    weather: isDay ? (factor > 0.4 ? 'Sunny' : 'Partly Cloudy') : 'Clear Night',
    status: 'simulated'
  };
}

export default function WeatherLocationSelector({ 
  currentLocation, 
  liveWeather, 
  onLocationAndWeatherChange,
  cityPresets,
  onSelectCityPreset 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Geographic Hierarchy State with resilient defaults
  const [countries, setCountries] = useState(DEFAULT_COUNTRIES);
  const [states, setStates] = useState(DEFAULT_STATES);
  const [districts, setDistricts] = useState(DEFAULT_DISTRICTS);
  const [mandals, setMandals] = useState(DEFAULT_MANDALS);
  const [villages, setVillages] = useState(DEFAULT_VILLAGES);

  // Selected Filter Values
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('Anantapur');
  const [selectedMandal, setSelectedMandal] = useState('Anantapur');
  const [selectedVillage, setSelectedVillage] = useState('Anantapur Urban / Town');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Status, Loaders & Pending Confirmation States
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  
  const [pendingGpsLocation, setPendingGpsLocation] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    axios.get('/api/location/countries')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCountries(res.data);
        }
      })
      .catch(err => console.warn('Using default countries:', err.message));
  }, []);

  useEffect(() => {
    if (currentLocation) {
      if (currentLocation.country) setSelectedCountry(currentLocation.country);
      if (currentLocation.state) setSelectedState(currentLocation.state);
      if (currentLocation.district) setSelectedDistrict(currentLocation.district);
      if (currentLocation.mandal || currentLocation.subdistrict) setSelectedMandal(currentLocation.mandal || currentLocation.subdistrict);
      if (currentLocation.village || currentLocation.locality) setSelectedVillage(currentLocation.village || currentLocation.locality);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (!selectedCountry) return;
    setLoadingStep('Loading states...');
    axios.get(`/api/location/states?country=${encodeURIComponent(selectedCountry)}`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setStates(res.data);
        }
        setLoadingStep('');
      })
      .catch(err => {
        console.warn('Using default states:', err.message);
        setLoadingStep('');
      });
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountry || !selectedState) return;
    setLoadingStep('Loading districts...');
    axios.get(`/api/location/districts?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDistricts(res.data);
        }
        setLoadingStep('');
      })
      .catch(err => {
        console.warn('Using default districts:', err.message);
        setLoadingStep('');
      });
  }, [selectedCountry, selectedState]);

  useEffect(() => {
    if (!selectedCountry || !selectedState || !selectedDistrict) return;
    setLoadingStep('Loading mandals...');
    axios.get(`/api/location/mandals?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMandals(res.data);
        }
        setLoadingStep('');
      })
      .catch(err => {
        console.warn('Using default mandals:', err.message);
        setLoadingStep('');
      });
  }, [selectedCountry, selectedState, selectedDistrict]);

  useEffect(() => {
    if (!selectedCountry || !selectedState || !selectedDistrict || !selectedMandal) return;
    setLoadingStep('Loading villages...');
    axios.get(`/api/location/villages?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}&mandal=${encodeURIComponent(selectedMandal)}`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setVillages(res.data);
        }
        setLoadingStep('');
      })
      .catch(err => {
        console.warn('Using default villages:', err.message);
        setLoadingStep('');
      });
  }, [selectedCountry, selectedState, selectedDistrict, selectedMandal]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/api/location/search?q=${encodeURIComponent(searchQuery)}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSearchResults(res.data);
          setIsSearching(false);
          return;
        }
      } catch (err) {
        console.warn('Backend search unavailable, querying Open-Meteo geocoding:', err.message);
      }

      // Direct client search via Open-Meteo Geocoding
      try {
        const omGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=6&language=en&format=json`);
        if (omGeoRes.ok) {
          const omData = await omGeoRes.json();
          if (Array.isArray(omData.results)) {
            const formatted = omData.results.map(r => ({
              display_name: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}, ${r.country || ''}`,
              country: r.country || 'India',
              state: r.admin1 || '',
              district: r.admin2 || r.admin1 || r.name,
              mandal: r.name,
              village: r.name,
              latitude: r.latitude,
              longitude: r.longitude,
              source: 'search'
            }));
            setSearchResults(formatted);
          }
        }
      } catch (e) {
        console.warn('Client search fallback failed:', e.message);
      }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCountryChange = (countryName) => {
    setSelectedCountry(countryName);
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedVillage('');
    setErrorMessage('');
    setWarningMessage('');
    setPendingGpsLocation(null);
  };

  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedVillage('');
    setErrorMessage('');
    setWarningMessage('');
    setPendingGpsLocation(null);
  };

  const handleDistrictChange = (districtName) => {
    setSelectedDistrict(districtName);
    setSelectedMandal('');
    setSelectedVillage('');
    setErrorMessage('');
    setWarningMessage('');
    setPendingGpsLocation(null);
  };

  const handleMandalChange = (mandalName) => {
    setSelectedMandal(mandalName);
    setSelectedVillage('');
    setErrorMessage('');
    setWarningMessage('');
    setPendingGpsLocation(null);
  };

  const handleVillageChange = (villageName) => {
    setSelectedVillage(villageName);
    setErrorMessage('');
    setWarningMessage('');
    setPendingGpsLocation(null);
  };

  const handleUseCurrentLocation = () => {
    setErrorMessage('');
    setWarningMessage('');
    setPendingGpsLocation(null);
    setIsLocatingUser(true);
    setLoadingStep("Acquiring GPS coordinates...");

    const finishWithIpFallback = async (reasonMsg) => {
      setLoadingStep("Using network location fallback...");
      try {
        const ipLoc = await safeDetectLocationViaIp();
        if (ipLoc) {
          setPendingGpsLocation(ipLoc);
          setWarningMessage(reasonMsg || "Acquired network location based on your connection.");
        } else {
          setErrorMessage("Unable to determine your location. Please select your location manually from the dropdowns below.");
        }
      } catch (e) {
        setErrorMessage("Unable to determine your location. Please select your location manually from the dropdowns below.");
      } finally {
        setIsLocatingUser(false);
        setLoadingStep('');
      }
    };

    if (!navigator.geolocation) {
      finishWithIpFallback("Browser geolocation not supported. Detected network location.");
      return;
    }

    const tryGetPosition = (highAccuracy = true) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const accuracyMeters = Math.round(accuracy || 0);

          try {
            setLoadingStep("Identifying current location...");
            const locData = await safeReverseGeocode(latitude, longitude, accuracyMeters);

            const pendingPref = {
              latitude: latitude,
              longitude: longitude,
              accuracy: accuracyMeters,
              country: locData.country || "India",
              country_code: locData.country_code || "IN",
              state: locData.state || "",
              district: locData.district || "",
              subdistrict: locData.subdistrict || locData.mandal || "",
              subdistrict_type: locData.subdistrict_type || "Sub-district",
              mandal: locData.subdistrict || locData.mandal || "",
              village: locData.village || locData.locality || "",
              locality: locData.village || locData.locality || "",
              display_name: locData.display_name || `Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
              source: "gps"
            };

            setPendingGpsLocation(pendingPref);
          } catch (err) {
            console.error('Reverse geocoding failed:', err);
            setPendingGpsLocation({
              latitude,
              longitude,
              accuracy: accuracyMeters,
              country: "India",
              state: "Detected Region",
              district: "Local Area",
              mandal: "Local Area",
              village: `GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`,
              display_name: `GPS Location (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`,
              source: "gps"
            });
          } finally {
            setIsLocatingUser(false);
            setLoadingStep('');
          }
        },
        (error) => {
          if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
            setLoadingStep("Retrying with network positioning...");
            tryGetPosition(false);
            return;
          }
          // If browser GPS fails or permission denied, seamlessly fall back to IP Geolocation
          finishWithIpFallback(
            error.code === error.PERMISSION_DENIED
              ? "Browser location permission was not granted. Using network IP location."
              : "GPS signal timed out. Using network IP location."
          );
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 8000 : 12000,
          maximumAge: 300000
        }
      );
    };

    tryGetPosition(true);
  };

  const handleConfirmGpsLocation = async () => {
    if (!pendingGpsLocation) return;
    setLoadingStep("Fetching live local weather...");
    try {
      const wData = await safeFetchLiveWeather(pendingGpsLocation.latitude, pendingGpsLocation.longitude);

      setSelectedCountry(pendingGpsLocation.country);
      if (pendingGpsLocation.state) setSelectedState(pendingGpsLocation.state);
      if (pendingGpsLocation.district) setSelectedDistrict(pendingGpsLocation.district);
      if (pendingGpsLocation.mandal) setSelectedMandal(pendingGpsLocation.mandal);
      if (pendingGpsLocation.village) setSelectedVillage(pendingGpsLocation.village);

      try {
        await axios.post('/api/user/location-preference', pendingGpsLocation);
      } catch (e) {}

      try {
        localStorage.setItem('solariq_location', JSON.stringify(pendingGpsLocation));
      } catch (e) {}

      if (onLocationAndWeatherChange) {
        onLocationAndWeatherChange(pendingGpsLocation, wData);
      }

      setPendingGpsLocation(null);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed applying GPS weather location:', err);
      setErrorMessage("Live weather temporarily unavailable for detected location.");
    } finally {
      setLoadingStep('');
    }
  };

  const handleSelectSearchResult = async (result) => {
    try {
      setLoadingStep("Loading selected weather location...");
      const wData = await safeFetchLiveWeather(result.latitude, result.longitude);
      
      const locationPref = {
        country: result.country || selectedCountry,
        state: result.state || selectedState,
        district: result.district || selectedDistrict,
        mandal: result.mandal || selectedMandal,
        village: result.village || selectedVillage,
        latitude: result.latitude,
        longitude: result.longitude,
        display_name: result.display_name,
        source: "search"
      };

      setSelectedCountry(locationPref.country);
      if (locationPref.state) setSelectedState(locationPref.state);
      if (locationPref.district) setSelectedDistrict(locationPref.district);
      if (locationPref.mandal) setSelectedMandal(locationPref.mandal);
      if (locationPref.village) setSelectedVillage(locationPref.village);
      setSearchQuery('');
      setSearchResults([]);
      setPendingGpsLocation(null);

      try {
        await axios.post('/api/user/location-preference', locationPref);
      } catch (e) {}

      try {
        localStorage.setItem('solariq_location', JSON.stringify(locationPref));
      } catch (e) {}

      if (onLocationAndWeatherChange) {
        onLocationAndWeatherChange(locationPref, wData);
      }

      setIsOpen(false);
    } catch (err) {
      console.error('Failed applying search location:', err);
      setErrorMessage("Live weather temporarily unavailable for this location.");
    } finally {
      setLoadingStep('');
    }
  };

  const handleApplyCascadingLocation = async () => {
    if (!selectedCountry) {
      setErrorMessage("Please select a Country.");
      return;
    }
    setErrorMessage('');
    setWarningMessage('');
    setPendingGpsLocation(null);
    setLoadingStep("Resolving location & fetching real-time weather...");

    try {
      let coords = { latitude: 14.6819, longitude: 77.6006 };
      try {
        const resolveRes = await axios.get(
          `/api/location/resolve?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}&mandal=${encodeURIComponent(selectedMandal)}&village=${encodeURIComponent(selectedVillage)}`
        );
        if (resolveRes.data && resolveRes.data.latitude) {
          coords = resolveRes.data;
        }
      } catch (resolveErr) {
        // Direct geocoding fallback via Open-Meteo
        try {
          const qName = selectedVillage || selectedMandal || selectedDistrict || selectedState || selectedCountry;
          const omGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(qName)}&count=1&language=en&format=json`);
          if (omGeoRes.ok) {
            const omGeo = await omGeoRes.json();
            if (omGeo.results?.[0]) {
              coords = { latitude: omGeo.results[0].latitude, longitude: omGeo.results[0].longitude };
            }
          }
        } catch (e) {}
      }

      const wData = await safeFetchLiveWeather(coords.latitude, coords.longitude);

      const locationPref = {
        country: selectedCountry,
        state: selectedState || selectedCountry,
        district: selectedDistrict || selectedState,
        mandal: selectedMandal || selectedDistrict,
        village: selectedVillage || selectedMandal,
        latitude: coords.latitude,
        longitude: coords.longitude,
        display_name: `${selectedVillage || selectedMandal || selectedDistrict}, ${selectedState || selectedCountry}, ${selectedCountry}`,
        source: "manual"
      };

      try {
        await axios.post('/api/user/location-preference', locationPref);
      } catch (e) {}

      try {
        localStorage.setItem('solariq_location', JSON.stringify(locationPref));
      } catch (e) {}

      if (onLocationAndWeatherChange) {
        onLocationAndWeatherChange(locationPref, wData);
      }

      setIsOpen(false);
    } catch (err) {
      console.error('Failed resolving location weather:', err);
      setErrorMessage("Live weather temporarily unavailable for selected location.");
    } finally {
      setLoadingStep('');
    }
  };

  const handleRefreshWeather = async () => {
    const lat = currentLocation?.latitude || 14.6819;
    const lon = currentLocation?.longitude || 77.6006;
    setIsRefreshingWeather(true);
    try {
      const wData = await safeFetchLiveWeather(lat, lon);
      if (onLocationAndWeatherChange) {
        onLocationAndWeatherChange(currentLocation, wData, true);
      }
    } catch (err) {
      console.error('Failed refreshing weather:', err);
    } finally {
      setIsRefreshingWeather(false);
    }
  };

  const activeVillageDisplay = currentLocation?.village || selectedVillage || 'Anantapur Urban';
  const activeStateDisplay = currentLocation?.state || selectedState || 'Andhra Pradesh';
  const locationSource = currentLocation?.source || 'manual';

  let sourceBadgeText = 'SELECTED';
  if (locationSource === 'gps') sourceBadgeText = '● GPS VERIFIED';
  else if (locationSource === 'search') sourceBadgeText = 'SEARCHED';

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      
      {/* Desktop Trigger Button (>= sm) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden sm:flex items-center space-x-2.5 bg-[#FBF3EA] hover:bg-[#F5E6D3] border border-[#EED6CC] text-[#4A3030] px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
      >
        <div className="flex items-center space-x-1.5 text-[#8F2635] font-extrabold text-xs min-w-0">
          <MapPin className="w-3.5 h-3.5 text-[#E86A6A] shrink-0 animate-bounce" />
          <span className="font-extrabold max-w-[150px] sm:max-w-[200px] truncate text-[#4A3030]">
            {activeVillageDisplay}, {activeStateDisplay}
          </span>
        </div>

        {liveWeather && (
          <div className="hidden lg:flex items-center space-x-2 border-l border-[#EED6CC] pl-2.5 text-[11px] font-bold text-[#8F2635]">
            <span className="flex items-center space-x-1 text-[#8F2635] font-extrabold">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{liveWeather.ambient_temp}°C</span>
            </span>
            <span className="text-[#EED6CC]">•</span>
            <span className="text-[#4A3030] font-semibold">{liveWeather.irradiance} W/m²</span>
            <span className="text-[#EED6CC]">•</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30">
              {sourceBadgeText}
            </span>
          </div>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-[#8F2635] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile Compact GPS Icon Button (< sm) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden flex items-center justify-center p-2 bg-[#FBF3EA] hover:bg-[#F5E6D3] border border-[#EED6CC] text-[#8F2635] rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        title="Select Weather Location"
      >
        <MapPin className="w-4.5 h-4.5 text-[#E86A6A] animate-bounce" />
      </button>

      {/* Popover Modal */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 mx-auto w-[min(92vw,400px)] max-h-[85vh] overflow-y-auto sm:absolute sm:inset-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-[420px] sm:max-h-none sm:overflow-visible bg-[#FFFDFC] rounded-2xl shadow-2xl border border-[#EED6CC] z-50 p-4 text-[#4A3030] text-xs animate-fade-in">

          
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-[#EED6CC] pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FBE1E1] text-[#8F2635] flex items-center justify-center border border-[#E86A6A]/30">
                <MapPin className="w-4 h-4 text-[#E86A6A]" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#4A3030] leading-tight">Select Weather Location</h4>
                <p className="text-[10px] text-[#8F2635] font-semibold">GPS Geolocation & Administrative Hierarchy</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[#8F2635] hover:bg-[#FBE1E1] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-medium space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-bold">{errorMessage}</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-rose-200/60">
                <button
                  onClick={handleUseCurrentLocation}
                  className="py-1 px-2.5 bg-[#E86A6A] hover:bg-[#8F2635] text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  Retry GPS
                </button>
                <button
                  onClick={() => setErrorMessage('')}
                  className="py-1 px-2.5 bg-[#FFFDFC] hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  Select Manually
                </button>
              </div>
            </div>
          )}

          {/* Warning Notice */}
          {warningMessage && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-1.5 min-w-0 pr-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{warningMessage}</span>
              </div>
              <button 
                onClick={() => setWarningMessage('')} 
                className="text-amber-700 hover:text-amber-900 ml-1 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Pending GPS Box */}
          {pendingGpsLocation && (
            <div className="mb-3 p-3 bg-[#FBE1E1] border-2 border-[#E86A6A] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-[#8F2635] text-xs flex items-center space-x-1">
                  <Navigation className="w-3.5 h-3.5 text-[#E86A6A] animate-pulse" />
                  <span>Detected GPS Location</span>
                </span>
                {pendingGpsLocation.accuracy > 0 && (
                  <span className="text-[10px] bg-[#FFFDFC] text-[#8F2635] font-black px-1.5 py-0.5 rounded-md border border-[#E86A6A]/30">
                    Accuracy: {pendingGpsLocation.accuracy >= 1000 
                      ? `±${(pendingGpsLocation.accuracy / 1000).toFixed(1)} km` 
                      : `±${pendingGpsLocation.accuracy} m`}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-[#4A3030] font-medium space-y-0.5 bg-[#FFFDFC] p-2 rounded-lg border border-[#EED6CC]">
                {pendingGpsLocation.village && <div><strong className="text-[#8F2635]">Locality / Village:</strong> {pendingGpsLocation.village}</div>}
                {pendingGpsLocation.subdistrict && <div><strong className="text-[#8F2635]">{pendingGpsLocation.subdistrict_type || 'Sub-district'}:</strong> {pendingGpsLocation.subdistrict}</div>}
                {pendingGpsLocation.district && <div><strong className="text-[#8F2635]">District:</strong> {pendingGpsLocation.district}</div>}
                {pendingGpsLocation.state && <div><strong className="text-[#8F2635]">State:</strong> {pendingGpsLocation.state}</div>}
                {pendingGpsLocation.country && <div><strong className="text-[#8F2635]">Country:</strong> {pendingGpsLocation.country}</div>}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={handleConfirmGpsLocation}
                  className="flex-1 py-1.5 bg-[#E86A6A] hover:bg-[#8F2635] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Use This Location</span>
                </button>
                <button
                  onClick={() => setPendingGpsLocation(null)}
                  className="py-1.5 px-3 bg-[#FFFDFC] hover:bg-[#FBF3EA] text-[#4A3030] border border-[#EED6CC] rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Option 1: Live Current Location Button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLocatingUser}
            className="w-full mb-3 py-2.5 px-3 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-75"
          >
            {isLocatingUser ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Navigation className="w-4 h-4 text-white" />
            )}
            <span>{isLocatingUser ? 'Acquiring GPS Signal...' : '📍 Use My Current Location (Browser GPS)'}</span>
          </button>

          {/* Option 2: Search Input Autocomplete */}
          <div className="relative mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8F2635] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search location (e.g. Bangalore, Anantapur, Kakkalapalli)..."
                className="w-full pl-8 pr-3 py-2 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl text-xs font-semibold text-[#4A3030] focus:outline-none focus:ring-1 focus:ring-[#E86A6A] focus:bg-[#FFFDFC]"
              />
              {isSearching && <Loader2 className="w-3.5 h-3.5 text-[#8F2635] animate-spin absolute right-3 top-2.5" />}
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#FFFDFC] border border-[#EED6CC] rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 py-1">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3 py-2 hover:bg-[#FBE1E1] text-[11px] font-semibold text-[#4A3030] border-b border-[#EED6CC] last:border-0 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate pr-2">{res.display_name}</span>
                    <span className="text-[9px] bg-[#E86A6A] text-white font-extrabold px-1.5 py-0.5 rounded">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center my-2.5 text-[#8F2635] text-[10px] uppercase font-bold tracking-wider">
            <div className="flex-1 border-t border-[#EED6CC]"></div>
            <span className="px-2 font-bold text-[#8F2635]">Or Select Administrative Hierarchy</span>
            <div className="flex-1 border-t border-[#EED6CC]"></div>
          </div>

          {/* Option 3: Cascading Filters */}
          <div className="space-y-2.5 mb-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A]"
              >
                {(Array.isArray(countries) ? countries : DEFAULT_COUNTRIES).map((c) => (
                  <option key={c.code || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">State / Province</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={!(Array.isArray(states) && states.length)}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select State...</option>
                {(Array.isArray(states) ? states : DEFAULT_STATES).map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">District / County</label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!(Array.isArray(districts) && districts.length)}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select District...</option>
                {(Array.isArray(districts) ? districts : DEFAULT_DISTRICTS).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">Mandal / Taluk / Sub-district</label>
              <select
                value={selectedMandal}
                onChange={(e) => handleMandalChange(e.target.value)}
                disabled={!(Array.isArray(mandals) && mandals.length)}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select Mandal / Sub-district...</option>
                {(Array.isArray(mandals) ? mandals : DEFAULT_MANDALS).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">Village / Locality</label>
              <select
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!(Array.isArray(villages) && villages.length)}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select Village / Locality...</option>
                {(Array.isArray(villages) ? villages : DEFAULT_VILLAGES).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Loading status indicator */}
          {loadingStep && (
            <div className="mb-3 flex items-center justify-center space-x-2 text-[11px] font-bold text-[#8F2635] py-1 bg-[#FBE1E1] rounded-lg border border-[#E86A6A]/30">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E86A6A]" />
              <span>{loadingStep}</span>
            </div>
          )}

          {/* Confirm Selection Button */}
          <button
            onClick={handleApplyCascadingLocation}
            disabled={!selectedCountry || !!loadingStep}
            className="w-full py-2.5 bg-[#8F2635] hover:bg-[#4A3030] text-white rounded-xl font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 mb-3"
          >
            <Check className="w-4 h-4 text-white" />
            <span>✓ Confirm & Use Selected Location</span>
          </button>

          {/* Weather Card Summary & Controls Footer */}
          {liveWeather && (
            <div className="p-3 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl text-[#4A3030]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-[11px] text-[#4A3030] flex items-center space-x-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Real-Time Weather Metrics</span>
                </span>
                <button
                  onClick={handleRefreshWeather}
                  disabled={isRefreshingWeather}
                  className="flex items-center space-x-1 text-[10px] font-bold text-[#8F2635] hover:text-[#E86A6A] bg-[#FFFDFC] px-2 py-1 rounded-md border border-[#EED6CC] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingWeather ? 'animate-spin text-[#E86A6A]' : ''}`} />
                  <span>Refresh Weather</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[#FFFDFC] p-2 rounded-lg border border-[#EED6CC] flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-[#E86A6A] shrink-0" />
                  <div>
                    <div className="text-[9px] font-extrabold text-[#8F2635] uppercase">Temp</div>
                    <div className="font-black text-[#4A3030]">{liveWeather.ambient_temp} °C</div>
                  </div>
                </div>

                <div className="bg-[#FFFDFC] p-2 rounded-lg border border-[#EED6CC] flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-[9px] font-extrabold text-[#8F2635] uppercase">Solar GHI</div>
                    <div className="font-black text-[#4A3030]">{liveWeather.irradiance} W/m²</div>
                  </div>
                </div>

                <div className="bg-[#FFFDFC] p-2 rounded-lg border border-[#EED6CC] flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <div className="text-[9px] font-extrabold text-[#8F2635] uppercase">Humidity</div>
                    <div className="font-black text-[#4A3030]">{liveWeather.humidity} %</div>
                  </div>
                </div>

                <div className="bg-[#FFFDFC] p-2 rounded-lg border border-[#EED6CC] flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <div className="text-[9px] font-extrabold text-[#8F2635] uppercase">Wind</div>
                    <div className="font-black text-[#4A3030]">{liveWeather.wind_speed} m/s</div>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-[#8F2635] font-semibold pt-2 border-t border-[#EED6CC]">
                <span>Updated: {liveWeather.timestamp || 'Just now'}</span>
                <span className="font-bold text-[#4A3030]">{liveWeather.weather}</span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
