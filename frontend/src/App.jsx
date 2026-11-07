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
  const [modelMetrics, setModelMetrics] = useState(null);
  const [cityPresets, setCityPresets] = useState(null);
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
      .then(res => setModelMetrics(res.data))
      .catch(err => console.error('Failed fetching model metrics:', err));

    // 2. Fetch City Weather Presets
    axios.get('/api/weather-presets')
      .then(res => setCityPresets(res.data))
      .catch(err => console.error('Failed fetching weather presets:', err));

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
      console.error('Analysis API call failed:', err);
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
      console.error('Optimization API call failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Unable to run parameter sweep. Please check backend service and try again.';
      setOptError(msg);
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
      console.error('What-if API call failed:', err);
      throw err;
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
