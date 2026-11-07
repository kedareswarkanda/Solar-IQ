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

export default function WeatherLocationSelector({ 
  currentLocation, 
  liveWeather, 
  onLocationAndWeatherChange,
  cityPresets,
  onSelectCityPreset 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Geographic Hierarchy State
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);

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
      .then(res => setCountries(res.data || []))
      .catch(err => console.error('Failed fetching countries:', err));
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
        setStates(res.data || []);
        setLoadingStep('');
      })
      .catch(err => {
        console.error('Failed fetching states:', err);
        setLoadingStep('');
      });
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountry || !selectedState) return;
    setLoadingStep('Loading districts...');
    axios.get(`/api/location/districts?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}`)
      .then(res => {
        setDistricts(res.data || []);
        setLoadingStep('');
      })
      .catch(err => {
        console.error('Failed fetching districts:', err);
        setLoadingStep('');
      });
  }, [selectedCountry, selectedState]);

  useEffect(() => {
    if (!selectedCountry || !selectedState || !selectedDistrict) return;
    setLoadingStep('Loading mandals...');
    axios.get(`/api/location/mandals?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`)
      .then(res => {
        setMandals(res.data || []);
        setLoadingStep('');
      })
      .catch(err => {
        console.error('Failed fetching mandals:', err);
        setLoadingStep('');
      });
  }, [selectedCountry, selectedState, selectedDistrict]);

  useEffect(() => {
    if (!selectedCountry || !selectedState || !selectedDistrict || !selectedMandal) return;
    setLoadingStep('Loading villages...');
    axios.get(`/api/location/villages?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}&mandal=${encodeURIComponent(selectedMandal)}`)
      .then(res => {
        setVillages(res.data || []);
        setLoadingStep('');
      })
      .catch(err => {
        console.error('Failed fetching villages:', err);
        setLoadingStep('');
      });
  }, [selectedCountry, selectedState, selectedDistrict, selectedMandal]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      axios.get(`/api/location/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => {
          setSearchResults(res.data || []);
          setIsSearching(false);
        })
        .catch(err => {
          console.error('Location search failed:', err);
          setIsSearching(false);
        });
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

    if (!navigator.geolocation) {
      setErrorMessage("Location services are not supported by this browser.");
      return;
    }

    setIsLocatingUser(true);
    setLoadingStep("Acquiring GPS coordinates...");

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const accuracyMeters = Math.round(accuracy || 0);

        if (accuracyMeters > 150000) {
          const accFormatted = `±${(accuracyMeters / 1000).toFixed(1)} km`;
          setErrorMessage(`Location accuracy is extremely low (${accFormatted}). Please enter your location manually.`);
          setIsLocatingUser(false);
          setLoadingStep('');
          return;
        }

        try {
          setLoadingStep("Reverse geocoding coordinates...");
          const revRes = await axios.get(`/api/location/reverse-geocode?lat=${latitude}&lon=${longitude}&accuracy=${accuracyMeters}`);
          const locData = revRes.data;

          if (locData.status === "error") {
            setErrorMessage(locData.message || "Unable to reverse geocode location.");
            setIsLocatingUser(false);
            setLoadingStep('');
            return;
          }

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
            display_name: locData.display_name || "",
            source: "gps"
          };

          setPendingGpsLocation(pendingPref);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setErrorMessage("Unable to identify your current location. Please select your location manually.");
        } finally {
          setIsLocatingUser(false);
          setLoadingStep('');
        }
      },
      (error) => {
        setIsLocatingUser(false);
        setLoadingStep('');
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage("Location access was denied. Please enable location access or select your location manually.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage("Your current location could not be determined. Please try again or select manually.");
        } else if (error.code === error.TIMEOUT) {
          setErrorMessage("Location detection timed out. Please try again or select manually.");
        } else {
          setErrorMessage("Unable to detect your location. Please select it manually.");
        }
      },
      geoOptions
    );
  };

  const handleConfirmGpsLocation = async () => {
    if (!pendingGpsLocation) return;
    setLoadingStep("Fetching live local weather...");
    try {
      const weatherRes = await axios.get(`/api/weather/live?lat=${pendingGpsLocation.latitude}&lon=${pendingGpsLocation.longitude}`);
      const wData = weatherRes.data;

      setSelectedCountry(pendingGpsLocation.country);
      setSelectedState(pendingGpsLocation.state);
      setSelectedDistrict(pendingGpsLocation.district);
      setSelectedMandal(pendingGpsLocation.mandal);
      setSelectedVillage(pendingGpsLocation.village);

      await axios.post('/api/user/location-preference', pendingGpsLocation);
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
      const weatherRes = await axios.get(`/api/weather/live?lat=${result.latitude}&lon=${result.longitude}`);
      
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
      setSelectedState(locationPref.state);
      setSelectedDistrict(locationPref.district);
      setSelectedMandal(locationPref.mandal);
      setSelectedVillage(locationPref.village);
      setSearchQuery('');
      setSearchResults([]);
      setPendingGpsLocation(null);

      await axios.post('/api/user/location-preference', locationPref);
      if (onLocationAndWeatherChange) {
        onLocationAndWeatherChange(locationPref, weatherRes.data);
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
      const resolveRes = await axios.get(
        `/api/location/resolve?country=${encodeURIComponent(selectedCountry)}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}&mandal=${encodeURIComponent(selectedMandal)}&village=${encodeURIComponent(selectedVillage)}`
      );
      const coords = resolveRes.data;

      if (coords.status === "error") {
        setErrorMessage(coords.message || "Coordinates could not be resolved for selected location.");
        setLoadingStep('');
        return;
      }

      const weatherRes = await axios.get(`/api/weather/live?lat=${coords.latitude}&lon=${coords.longitude}`);
      const wData = weatherRes.data;

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

      await axios.post('/api/user/location-preference', locationPref);
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
      const weatherRes = await axios.get(`/api/weather/live?lat=${lat}&lon=${lon}`);
      if (onLocationAndWeatherChange) {
        onLocationAndWeatherChange(currentLocation, weatherRes.data);
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
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">State / Province</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={!states.length}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select State...</option>
                {states.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">District / County</label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!districts.length}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select District...</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">Mandal / Taluk / Sub-district</label>
              <select
                value={selectedMandal}
                onChange={(e) => handleMandalChange(e.target.value)}
                disabled={!mandals.length}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select Mandal / Sub-district...</option>
                {mandals.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8F2635] mb-1">Village / Locality</label>
              <select
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!villages.length}
                className="w-full bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#E86A6A] disabled:opacity-50"
              >
                <option value="" disabled>Select Village / Locality...</option>
                {villages.map((v) => (
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
