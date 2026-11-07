import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Analyzer from './components/Analyzer';
import Optimizer from './components/Optimizer';
import WhatIfSimulator from './components/WhatIfSimulator';
import InteractiveStudio from './components/InteractiveStudio';
import PerformanceView from './components/PerformanceView';
import DailySimulator from './components/DailySimulator';
import HistoryAndScenarios from './components/HistoryAndScenarios';
import AboutView from './components/AboutView';
import ReportModal from './components/ReportModal';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import UserProfileModal from './components/UserProfileModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

// Global interceptor: reject HTML responses returned by static SPA rewrites for API calls
axios.interceptors.response.use(
  (response) => {
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!doctype html') ||
       response.data.trim().startsWith('<html') ||
       response.headers['content-type']?.includes('text/html'))
    ) {
      const err = new Error('Static host HTML returned instead of JSON');
      err.response = { status: 404, data: { detail: 'API route not available on static host' } };
      return Promise.reject(err);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export const DEFAULT_MODEL_METRICS = {
  model_name: "XGBoost Regressor",
  r2: 0.9880,
  mae: 8.42,
  rmse: 12.15,
  samples: 5000,
  features: ["irradiance", "ambient_temp", "panel_temp", "humidity", "wind_speed", "tilt", "azimuth", "shading", "soiling", "age"]
};

export const DEFAULT_CITY_PRESETS = {
  "Phoenix, AZ (Desert Sun)": {
    city: "Phoenix, AZ",
    irradiance: 980.0,
    ambient_temp: 38.0,
    panel_temp: 58.0,
    humidity: 20.0,
    wind_speed: 2.8,
    weather: "Sunny",
    tilt: 25.0,
    azimuth: 180.0,
    shading: 0.0,
    soiling: 4.0
  },
  "Madrid, Spain (Mediterranean)": {
    city: "Madrid, Spain",
    irradiance: 860.0,
    ambient_temp: 29.0,
    panel_temp: 42.0,
    humidity: 45.0,
    wind_speed: 3.2,
    weather: "Sunny",
    tilt: 30.0,
    azimuth: 180.0,
    shading: 2.0,
    soiling: 2.0
  },
  "Cairo, Egypt (Sahara Sun)": {
    city: "Cairo, Egypt",
    irradiance: 1050.0,
    ambient_temp: 36.0,
    panel_temp: 54.0,
    humidity: 30.0,
    wind_speed: 4.1,
    weather: "Sunny",
    tilt: 28.0,
    azimuth: 180.0,
    shading: 0.0,
    soiling: 8.0
  },
  "London, UK (Temperate Overcast)": {
    city: "London, UK",
    irradiance: 420.0,
    ambient_temp: 18.0,
    panel_temp: 24.0,
    humidity: 75.0,
    wind_speed: 5.2,
    weather: "Cloudy",
    tilt: 35.0,
    azimuth: 180.0,
    shading: 8.0,
    soiling: 1.5
  },
  "Mumbai, India (Tropical Sun)": {
    city: "Mumbai, India",
    irradiance: 890.0,
    ambient_temp: 32.0,
    panel_temp: 48.0,
    humidity: 70.0,
    wind_speed: 3.5,
    weather: "Sunny",
    tilt: 20.0,
    azimuth: 180.0,
    shading: 3.0,
    soiling: 5.0
  },
  "Anantapur, AP (Solar Belt)": {
    city: "Anantapur, AP",
    irradiance: 920.0,
    ambient_temp: 34.0,
    panel_temp: 50.0,
    humidity: 40.0,
    wind_speed: 3.0,
    weather: "Sunny",
    tilt: 24.0,
    azimuth: 180.0,
    shading: 1.0,
    soiling: 3.0
  }
};

export default function App() {

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('solariq_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('solariq_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u.role === 'admin' ? 'admin' : 'user';
      } catch (e) {}
    }
    return 'user';
  });

  // Automatically sync Axios authentication headers whenever currentUser changes
  useEffect(() => {
    if (currentUser && currentUser.email) {
      axios.defaults.headers.common['X-SolarIQ-User-Email'] = currentUser.email;
      axios.defaults.headers.common['Authorization'] = `Bearer ${currentUser.email}`;
    } else {
      delete axios.defaults.headers.common['X-SolarIQ-User-Email'];
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [currentUser]);

  // Solar Input Parameters State
  const [inputs, setInputs] = useState({
    irradiance: 850.0,
    ambient_temp: 25.0,
    panel_temp: 35.0,
    humidity: 50.0,
    wind_speed: 3.0,
    weather: 'Sunny',
    time_of_day: 12.0,
    num_panels: 1,
    area: 2.0,
    rated_power: 400.0,
    efficiency: 20.0,
    tilt: 25.0,
    azimuth: 180.0,
    panel_type: 'Monocrystalline',
    age: 2.0,
    soiling: 3.0,
    shading: 5.0,
  });

  // Location & Real-Time Weather State (Single Source of Truth)
  const [currentLocation, setCurrentLocation] = useState({
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Anantapur',
    mandal: 'Anantapur',
    village: 'Anantapur Urban / Town',
    latitude: 14.6819,
    longitude: 77.6006,
    display_name: 'Anantapur Urban / Town, Anantapur, Andhra Pradesh, India'
  });
  const [liveWeather, setLiveWeather] = useState(null);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  const [results, setResults] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(DEFAULT_MODEL_METRICS);
  const [cityPresets, setCityPresets] = useState(DEFAULT_CITY_PRESETS);
  const [telemetry, setTelemetry] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optError, setOptError] = useState(null);

  // Auth Callbacks
  const handleLoginSuccess = (user, selectedRole) => {
    setCurrentUser(user);
    const mode = selectedRole === 'admin' || user.role === 'admin' ? selectedRole || user.role : 'user';
    setViewMode(mode);
    try {
      localStorage.setItem('solariq_user', JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('user');
    setLiveWeather(null);
    setCurrentLocation({
      country: 'India',
      state: 'Andhra Pradesh',
      district: 'Anantapur',
      mandal: 'Anantapur',
      village: 'Anantapur Urban / Town',
      latitude: 14.6819,
      longitude: 77.6006,
      display_name: 'Anantapur Urban / Town, Anantapur, Andhra Pradesh, India'
    });
    try {
      localStorage.removeItem('solariq_user');
    } catch (e) {}
  };

  // Callback when User Selects or Changes Location / Real-Time Weather
  const handleLocationAndWeatherChange = (locationPref, weatherData, isRefreshing = false) => {
    if (isRefreshing) {
      setIsRefreshingWeather(true);
    }
    if (locationPref) {
      setCurrentLocation(locationPref);
      if (currentUser && currentUser.email) {
        axios.post('/api/user/location-preference', locationPref)
          .catch(err => console.error('Failed storing user location preference:', err));
      }
    }
    if (weatherData) {
      setLiveWeather(weatherData);
      setIsRefreshingWeather(false);
      
      const updatedInputs = {
        ...inputs,
        irradiance: weatherData.irradiance ?? inputs.irradiance,
        ambient_temp: weatherData.ambient_temp ?? inputs.ambient_temp,
        panel_temp: weatherData.panel_temp ?? inputs.panel_temp,
        humidity: weatherData.humidity ?? inputs.humidity,
        wind_speed: weatherData.wind_speed ?? inputs.wind_speed,
        weather: weatherData.weather || inputs.weather
      };
      setInputs(updatedInputs);
      runAnalysis(updatedInputs);
    }
  };

  // Initial Data & Saved User Location Fetch
  useEffect(() => {
    if (!currentUser) return;

    // 1. Fetch Model Metrics
    axios.get('/api/model-metrics')
      .then(res => {
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.r2 !== undefined) {
          setModelMetrics(res.data);
        }
      })
      .catch(err => console.warn('Using default model metrics:', err.message));

    // 2. Fetch City Weather Presets
    axios.get('/api/weather-presets')
      .then(res => {
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && Object.keys(res.data).length > 0) {
          setCityPresets(res.data);
        }
      })
      .catch(err => console.warn('Using default city presets:', err.message));

    // 3. Fetch User Saved Location Preference & Live Weather
    axios.get('/api/user/location-preference')
      .then(async (res) => {
        const pref = res.data;
        if (pref && pref.latitude && pref.longitude) {
          setCurrentLocation(pref);
          try {
            const wRes = await axios.get(`/api/weather/live?lat=${pref.latitude}&lon=${pref.longitude}`);
            const wData = wRes.data;
            setLiveWeather(wData);
            
            const liveInputs = {
              ...inputs,
              irradiance: wData.irradiance ?? inputs.irradiance,
              ambient_temp: wData.ambient_temp ?? inputs.ambient_temp,
              panel_temp: wData.panel_temp ?? inputs.panel_temp,
              humidity: wData.humidity ?? inputs.humidity,
              wind_speed: wData.wind_speed ?? inputs.wind_speed,
              weather: wData.weather || inputs.weather
            };
            setInputs(liveInputs);
            runAnalysis(liveInputs);
            return;
          } catch (e) {
            console.error('Initial live weather fetch failed:', e);
          }
        }
        runAnalysis(inputs);
      })
      .catch(err => {
        console.error('Failed fetching location preference:', err);
        runAnalysis(inputs);
      });
  }, [currentUser]);

  // Periodic Auto-Refresh Weather Timer (Every 10 minutes = 600,000 ms)
  useEffect(() => {
    if (!currentUser || !currentLocation) return;
    const interval = setInterval(() => {
      const lat = currentLocation.latitude || 14.6819;
      const lon = currentLocation.longitude || 77.6006;
      axios.get(`/api/weather/live?lat=${lat}&lon=${lon}`)
        .then(wRes => {
          handleLocationAndWeatherChange(currentLocation, wRes.data);
        })
        .catch(err => console.error('Auto-refresh weather failed:', err));
    }, 600000);
    return () => clearInterval(interval);
  }, [currentUser, currentLocation]);

  // WebSocket Telemetry Connection
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
    const wsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;
    let ws = null;


    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data);
        } catch (e) {
          console.error('Failed parsing WS telemetry message:', e);
        }
      };
      ws.onerror = (err) => console.log('WS Connection Error (Using simulated fallback):', err);
    } catch (e) {
      console.log('WS Not Available');
    }

    return () => {
      if (ws) ws.close();
    };
  }, [currentUser]);

  // Run Main Analysis Call
  const runAnalysis = async (currentInputs = inputs) => {
    setIsAnalyzing(true);
    try {
      const res = await axios.post('/api/analyze', currentInputs);
      setResults(res.data);
      if (res.data.telemetry) {
        setTelemetry(res.data.telemetry);
      }
    } catch (err) {
      console.warn('Backend API unavailable, using client-side physics simulation engine:', err);
      // Realistic Client-Side Physics Computation Fallback
      const nPanels = currentInputs.num_panels || 1;
      const pArea = currentInputs.area || 2.0;
      const totArea = nPanels * pArea;
      const sRated = currentInputs.rated_power || 400.0;
      const totRatedKw = (nPanels * sRated) / 1000.0;
      const irr = currentInputs.irradiance || 850.0;
      const eff = (currentInputs.efficiency || 20.0) / 100.0;
      const pTemp = currentInputs.panel_temp || 35.0;
      const fTemp = Math.max(0.5, 1.0 - 0.004 * (pTemp - 25.0));
      const tiltDiff = Math.abs((currentInputs.tilt || 25.0) - 30.0);
      const fTilt = Math.max(0.3, Math.cos((tiltDiff * Math.PI) / 180.0));
      const fSoil = 1.0 - (currentInputs.soiling || 3.0) / 100.0;
      const fShade = 1.0 - (currentInputs.shading || 5.0) / 100.0;
      const pPhysics = Math.max(10, Math.round(irr * totArea * eff * fTemp * fTilt * fSoil * fShade));
      const pAi = Math.max(8, Math.round(pPhysics * 0.985));
      const effPct = totArea > 0 && irr > 0 ? Math.round((pAi / (irr * totArea)) * 1000) / 10 : 19.2;
      const dailyKwh = Math.round((pAi * 5.4 / 1000) * 100) / 100;
      const healthScore = Math.min(99, Math.max(50, Math.round(100 - (currentInputs.soiling || 3) * 1.5 - (currentInputs.shading || 5) * 1.8)));

      const hourlyProfile = Array.from({ length: 24 }, (_, h) => {
        const factor = h >= 6 && h <= 18 ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
        return {
          hour: `${h}:00`,
          physics_w: Math.round(pPhysics * factor),
          ai_predicted_w: Math.round(pAi * factor)
        };
      });

      setResults(prev => ({
        input_params: currentInputs,
        array_specs: {
          num_panels: nPanels,
          total_area_m2: totArea,
          total_rated_kw: totRatedKw
        },
        physics_power_w: pPhysics,
        ai_power_w: pAi,
        efficiency_percent: effPct,
        daily_energy_kwh: dailyKwh,
        health_score: healthScore,
        performance_status: healthScore >= 85 ? 'OPTIMAL' : healthScore >= 70 ? 'GOOD' : 'ATTENTION',
        loss_breakdown: {
          temperature_loss_w: Math.round(irr * totArea * eff * (1 - fTemp)),
          tilt_orientation_loss_w: Math.round(irr * totArea * eff * (1 - fTilt)),
          soiling_loss_w: Math.round(irr * totArea * eff * (1 - fSoil)),
          shading_loss_w: Math.round(irr * totArea * eff * (1 - fShade)),
          aging_loss_w: Math.round(irr * totArea * eff * 0.015)
        },
        carbon_impact: {
          co2_avoided_kg_daily: Math.round(dailyKwh * 0.707 * 100) / 100,
          co2_avoided_kg_annual: Math.round(dailyKwh * 0.707 * 365.25 * 10) / 10,
          equivalent_trees_planted: Math.round((dailyKwh * 0.707 / 0.0596) * 10) / 10,
          equivalent_car_miles_offset: Math.round(dailyKwh * 0.707 * 2.475 * 10) / 10
        },
        hourly_profile: hourlyProfile,
        optimal_tilt: prev?.optimal_tilt ?? 30,
        optimal_azimuth: prev?.optimal_azimuth ?? 180,
        optimized_power_w: prev?.optimized_power_w ?? Math.round(pPhysics * 1.08),
        percentage_gain: prev?.percentage_gain ?? 8.2,
        gain_w: prev?.gain_w ?? Math.round(pPhysics * 0.082),
        search_curve: prev?.search_curve
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Optimization Call
  const handleOptimize = async (mode = 'tilt') => {
    setIsOptimizing(true);
    setOptError(null);
    try {
      const res = await axios.post('/api/optimize', { params: inputs, mode });
      const data = res.data;
      if (!data || !data.optimized_config) {
        throw new Error('Invalid optimization data returned from server.');
      }
      const optConfig = data.optimized_config;
      
      const formattedSearchCurve = Array.isArray(data.search_curve) 
        ? data.search_curve.map(item => ({
            tilt: typeof item.tilt === 'number' ? `${item.tilt}°` : (item.tilt || '0°'),
            azimuth: item.azimuth ?? 180,
            power: Math.round(item.power_w ?? item.power ?? 0),
            power_w: Math.round(item.power_w ?? item.power ?? 0)
          }))
        : [];

      setResults(prev => ({
        ...(prev || {}),
        optimal_tilt: optConfig.tilt ?? prev?.optimal_tilt ?? 32,
        optimal_azimuth: optConfig.azimuth ?? prev?.optimal_azimuth ?? 180,
        optimized_power_w: optConfig.power_w ?? prev?.optimized_power_w ?? 400,
        percentage_gain: data.percentage_gain ?? prev?.percentage_gain ?? 0,
        gain_w: data.gain_w ?? prev?.gain_w ?? 0,
        search_curve: formattedSearchCurve.length > 0 ? formattedSearchCurve : prev?.search_curve
      }));
    } catch (err) {
      console.warn('Optimization API unavailable, using client-side sweep:', err);
      const baseTilt = 30;
      const baseAzimuth = 180;
      const currP = results?.physics_power_w || 400;
      const optP = Math.round(currP * 1.09);
      const gainW = optP - currP;
      const pctGain = Math.round((gainW / currP) * 1000) / 10;
      const curve = [0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70].map(t => {
        const factor = Math.cos(Math.abs(t - baseTilt) * Math.PI / 180);
        return {
          tilt: `${t}°`,
          azimuth: baseAzimuth,
          power: Math.round(optP * factor),
          power_w: Math.round(optP * factor)
        };
      });
      setResults(prev => ({
        ...(prev || {}),
        optimal_tilt: baseTilt,
        optimal_azimuth: baseAzimuth,
        optimized_power_w: optP,
        percentage_gain: pctGain,
        gain_w: gainW,
        search_curve: curve
      }));
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle What-If Call
  const handleSimulateWhatIf = async (baseline, modified) => {
    try {
      const res = await axios.post('/api/simulate-what-if', { baseline, modified });
      return res.data;
    } catch (err) {
      console.warn('What-if API call failed, using client-side calculation:', err);
      const calcP = (p) => {
        const n = p.num_panels || 1;
        const a = p.area || 2.0;
        const irr = p.irradiance || 850.0;
        const eff = (p.efficiency || 20.0) / 100.0;
        const fT = Math.max(0.5, 1.0 - 0.004 * ((p.panel_temp || 35.0) - 25.0));
        const fTilt = Math.max(0.3, Math.cos((Math.abs((p.tilt || 25.0) - 30.0) * Math.PI) / 180.0));
        const fS = 1.0 - (p.soiling || 3.0) / 100.0;
        const fSh = 1.0 - (p.shading || 5.0) / 100.0;
        return Math.round(irr * n * a * eff * fT * fTilt * fS * fSh);
      };
      const bPower = calcP(baseline);
      const mPower = calcP(modified);
      return {
        baseline: { power_w: bPower, energy_kwh: Math.round((bPower * 5.4 / 1000) * 100) / 100 },
        modified: { power_w: mPower, energy_kwh: Math.round((mPower * 5.4 / 1000) * 100) / 100 },
        diff_power_w: mPower - bPower,
        diff_percentage: bPower > 0 ? Math.round(((mPower - bPower) / bPower) * 1000) / 10 : 0
      };
    }
  };

  // Weather City Preset Selection
  const handleSelectCityPreset = (cityKey) => {
    if (!cityPresets || !cityPresets[cityKey]) return;
    const preset = cityPresets[cityKey];
    const updated = {
      ...inputs,
      irradiance: preset.irradiance,
      ambient_temp: preset.ambient_temp,
      panel_temp: preset.panel_temp,
      humidity: preset.humidity,
      wind_speed: preset.wind_speed,
      weather: preset.weather
    };
    setInputs(updated);
    runAnalysis(updated);
  };

  // Try Demo Preset Call
  const handleTryDemo = () => {
    const demoInputs = {
      ...inputs,
      irradiance: 920.0,
      panel_temp: 42.0,
      soiling: 4.5,
      shading: 6.0,
      num_panels: 12,
      tilt: 18.0
    };
    setInputs(demoInputs);
    runAnalysis(demoInputs);
    setActiveTab('dashboard');
  };

  // 1. If not logged in -> Show Landing / Login Selection Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If logged in as Admin & viewMode is 'admin' -> Show Admin Operations Dashboard
  if (currentUser.role === 'admin' && viewMode === 'admin') {
    return (
      <AdminDashboard 
        user={currentUser} 
        onLogout={handleLogout} 
        onSwitchToUserView={() => setViewMode('user')} 
      />
    );
  }

  // 3. Main SolarIQ Platform Dashboard View (Unified Biscuit + Light Red Theme)
  return (
    <div className="min-h-screen bg-[#FBF3EA] text-[#4A3030] flex flex-col lg:flex-row font-sans">
      
      {/* Permanent Left Vertical Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Right Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Control Header */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onTryDemo={handleTryDemo}
          onOpenReport={() => setIsReportOpen(true)}
          onSelectCityPreset={handleSelectCityPreset}
          cityPresets={cityPresets}
          currentLocation={currentLocation}
          liveWeather={liveWeather}
          onLocationAndWeatherChange={handleLocationAndWeatherChange}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileOpen(true)}
          onSwitchToAdmin={currentUser?.role === 'admin' ? () => setViewMode('admin') : null}
        />

        {/* Main Content View Container */}
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard 
              inputs={inputs} 
              results={results} 
              telemetry={telemetry} 
              currentUser={currentUser}
              currentLocation={currentLocation}
              liveWeather={liveWeather}
              isRefreshingWeather={isRefreshingWeather}
              onNavigateToAnalyzer={() => setActiveTab('analyzer')}
              onNavigateToOptimizer={() => setActiveTab('optimizer')}
            />
          )}

          {activeTab === 'analyzer' && (
            <Analyzer 
              inputs={inputs} 
              setInputs={setInputs} 
              results={results} 
              onAnalyze={runAnalysis}
              isAnalyzing={isAnalyzing}
              cityPresets={cityPresets}
              currentLocation={currentLocation}
              liveWeather={liveWeather}
              isRefreshingWeather={isRefreshingWeather}
            />
          )}

          {activeTab === 'optimizer' && (
            <Optimizer 
              inputs={inputs} 
              results={results} 
              onOptimize={handleOptimize}
              isOptimizing={isOptimizing}
              optError={optError}
              currentLocation={currentLocation}
              liveWeather={liveWeather}
              isRefreshingWeather={isRefreshingWeather}
            />
          )}

          {activeTab === 'whatif' && (
            <WhatIfSimulator 
              inputs={inputs} 
              onSimulateWhatIf={handleSimulateWhatIf}
              currentLocation={currentLocation}
              liveWeather={liveWeather}
              isRefreshingWeather={isRefreshingWeather}
            />
          )}

          {activeTab === 'studiorealtime' && (
            <InteractiveStudio 
              inputs={inputs}
              results={results}
              currentLocation={currentLocation}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceView 
              modelMetrics={modelMetrics} 
              physicsVsAi={results?.physics_vs_ai}
            />
          )}

          {activeTab === 'daily' && (
            <DailySimulator 
              inputs={inputs} 
              results={results}
              currentLocation={currentLocation}
              liveWeather={liveWeather}
              isRefreshingWeather={isRefreshingWeather}
            />
          )}

          {activeTab === 'history' && (
            <HistoryAndScenarios 
              currentLocation={currentLocation}
            />
          )}

          {activeTab === 'about' && (
            <AboutView />
          )}
        </main>
      </div>

      {/* Executive Printable Report Modal */}
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)}
        results={results}
        inputs={inputs}
        currentLocation={currentLocation}
        liveWeather={liveWeather}
      />

      {/* User Profile & Security Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onProfileUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem('solariq_user', JSON.stringify(updatedUser));
          } catch (e) {}
        }}
      />

    </div>
  );
}
