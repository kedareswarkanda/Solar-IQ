import React, { useState } from 'react';
import { 
  Sun, 
  Zap, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  RotateCw, 
  Leaf, 
  Radio, 
  Thermometer, 
  Wind, 
  Layers,
  MapPin,
  Mail
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function Dashboard({ 
  inputs, 
  results, 
  telemetry, 
  currentUser,
  currentLocation,
  liveWeather,
  onNavigateToAnalyzer, 
  onNavigateToOptimizer 
}) {
  const [actuationActive, setActuationActive] = useState(false);

  const numPanels = inputs?.num_panels || results?.array_specs?.num_panels || 1;
  const totalRatedKw = results?.array_specs?.total_rated_kw || 0.4;
  const aiPower = results?.ai_power_w || 380;
  const physicsPower = results?.physics_power_w || 400;
  const efficiency = results?.efficiency_percent || 19.2;
  const dailyKwh = results?.daily_energy_kwh || 3.72;
  const healthScore = results?.health_score || 94;
  const healthStatus = results?.performance_status || 'OPTIMAL';

  const carbon = results?.carbon_impact || {
    co2_avoided_kg_daily: (dailyKwh * 0.707).toFixed(2),
    trees_equivalent: (dailyKwh * 0.707 * 0.045).toFixed(1),
    car_miles_offset: (dailyKwh * 0.707 * 2.48).toFixed(1)
  };

  const optimalTilt = results?.optimal_tilt || 32;
  const currentTilt = inputs?.tilt || 25;
  const gainW = results?.gain_w || 48.5;
  const percentageGain = results?.percentage_gain || 14.2;

  // Chart profile data
  const hourlyProfile = results?.hourly_profile || [
    { time: '06:00', power_w: 25 },
    { time: '08:00', power_w: 230 },
    { time: '10:00', power_w: 420 },
    { time: '12:00', power_w: 490 },
    { time: '14:00', power_w: 430 },
    { time: '16:00', power_w: 240 },
    { time: '18:00', power_w: 30 }
  ];

  const handleSimulateActuation = () => {
    setActuationActive(true);
    setTimeout(() => setActuationActive(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. TOP SECTION: USER PROFILE + CURRENT LOCATION BANNER */}
      <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
        
        {/* Left: User Photo + Name + Email + Role */}
        <div className="flex items-center space-x-4">
          <div className="relative shrink-0">
            {currentUser?.photo ? (
              <img 
                src={currentUser.photo} 
                alt={currentUser.name || 'User Photo'} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#EED6CC] shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#8F2635] text-white flex items-center justify-center font-black text-xl shadow-xs border border-[#EED6CC]">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Active User Session"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#4A3030] leading-tight">
                {currentUser?.name || 'SolarIQ Operator'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FBE1E1] text-[#8F2635] text-[10px] font-black uppercase tracking-wider border border-[#E86A6A]/30">
                {currentUser?.role || 'USER'}
              </span>
            </div>
            <div className="text-xs text-[#8F2635] font-semibold mt-1 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-[#E86A6A]" />
              <span>{currentUser?.email || 'user@solariq.io'}</span>
            </div>
          </div>
        </div>

        {/* Right: Current Location & Live Status */}
        <div className="flex flex-col md:items-end space-y-1.5 pt-3 md:pt-0 border-t md:border-t-0 border-[#EED6CC] w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-[#4A3030]">
            <MapPin className="w-4 h-4 text-[#E86A6A] shrink-0 animate-bounce" />
            <span>
              {currentLocation?.village ? `${currentLocation.village}, ` : ''}
              {currentLocation?.mandal && currentLocation.mandal !== currentLocation.village ? `${currentLocation.mandal} Mandal, ` : ''}
              {currentLocation?.district ? `${currentLocation.district}, ` : ''}
              {currentLocation?.state || 'Andhra Pradesh'}, {currentLocation?.country || 'India'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-semibold">
            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              liveWeather?.is_live !== false ? 'bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${liveWeather?.is_live !== false ? 'bg-[#E86A6A] animate-pulse' : 'bg-amber-600'}`}></span>
              <span>{liveWeather?.is_live !== false ? '● LIVE LOCATION & WEATHER CONNECTED' : 'SELECTED LOCATION'}</span>
            </span>
            {liveWeather?.timestamp && (
              <span className="text-[#8F2635] text-[10px] font-medium">Updated {liveWeather.timestamp}</span>
            )}
          </div>
        </div>

      </div>

      {/* ROW 1: FOUR CORE KPI BOXES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Box 1 (Predicted Power) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-5.5 shadow-xs squircle-card">
          <div className="flex items-center justify-between">
            <span className="text-[#8F2635] text-xs font-extrabold uppercase tracking-wider">AI Predicted Power</span>
            <div className="p-2 rounded-xl bg-[#FBE1E1] text-[#8F2635]">
              <Zap className="w-4.5 h-4.5 text-[#E86A6A]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#4A3030] mt-2">
            {Math.round(aiPower)} W
          </div>
          <div className="flex items-center space-x-1 mt-1 text-xs font-medium text-[#4A3030]/80">
            <span>Physics Baseline:</span>
            <span className="font-bold text-[#8F2635]">{Math.round(physicsPower)} W</span>
          </div>
        </div>

        {/* Box 2 (Array Efficiency) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-5.5 shadow-xs squircle-card">
          <div className="flex items-center justify-between">
            <span className="text-[#8F2635] text-xs font-extrabold uppercase tracking-wider">Array Efficiency</span>
            <div className="p-2 rounded-xl bg-[#FBE1E1] text-[#8F2635]">
              <TrendingUp className="w-4.5 h-4.5 text-[#E86A6A]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#4A3030] mt-2">
            {efficiency}%
          </div>
          <div className="flex items-center space-x-1 mt-1 text-xs font-medium text-[#4A3030]/80">
            <span>STC Nominal Rated 20.0%</span>
          </div>
        </div>

        {/* Box 3 (Daily Energy Yield) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-5.5 shadow-xs squircle-card">
          <div className="flex items-center justify-between">
            <span className="text-[#8F2635] text-xs font-extrabold uppercase tracking-wider">Daily Energy Yield</span>
            <div className="p-2 rounded-xl bg-[#FBE1E1] text-[#8F2635]">
              <Activity className="w-4.5 h-4.5 text-[#E86A6A]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#4A3030] mt-2">
            {dailyKwh} kWh
          </div>
          <div className="flex items-center space-x-1 mt-1 text-xs font-medium text-[#4A3030]/80">
            <span>Estimated 24-hr output</span>
          </div>
        </div>

        {/* Box 4 (Solar Health Score) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-5.5 shadow-xs squircle-card">
          <div className="flex items-center justify-between">
            <span className="text-[#8F2635] text-xs font-extrabold uppercase tracking-wider">Solar Health Score</span>
            <div className="p-2 rounded-xl bg-[#FBE1E1] text-[#8F2635]">
              <ShieldCheck className="w-4.5 h-4.5 text-[#E86A6A]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#8F2635] mt-2">
            {healthScore} / 100
          </div>
          <div className="flex items-center space-x-1 mt-1 text-xs font-medium text-[#4A3030]/80">
            <span>Status: {healthStatus}</span>
          </div>
        </div>

      </div>

      {/* ROW 2: DUAL ANALYTICAL BOXES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 5 (Diurnal Generation Profile Chart) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-6 shadow-xs squircle-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#4A3030] flex items-center space-x-2">
                <Sun className="w-5 h-5 text-[#E86A6A]" />
                <span>Diurnal Generation Profile (06:00 - 18:00)</span>
              </h3>
              <p className="text-xs font-semibold text-[#8F2635] mt-0.5">XGBoost hourly power trajectory (Watts)</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#8F2635]">
              <span className="w-3 h-3 rounded-full bg-[#E86A6A] inline-block"></span>
              <span>Predicted Power (W)</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyProfile} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="coralChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E86A6A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E86A6A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBF3EA" vertical={false} />
                <XAxis dataKey="time" stroke="#8F2635" fontSize={11} tickLine={false} />
                <YAxis stroke="#8F2635" fontSize={11} tickLine={false} axisLine={false} unit="W" />
                <Tooltip contentStyle={{ backgroundColor: '#4A3030', borderRadius: '12px', color: '#FFF', fontSize: '12px' }} />
                <Area type="monotone" dataKey="power_w" stroke="#E86A6A" strokeWidth={2.5} fillOpacity={1} fill="url(#coralChart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Box 6 (IoT Sensor Telemetry) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-6 shadow-xs squircle-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EED6CC] pb-3">
            <h3 className="text-base sm:text-lg font-black text-[#4A3030] flex items-center space-x-2">
              <Radio className="w-5 h-5 text-[#E86A6A]" />
              <span>IoT Sensor Telemetry Feed</span>
            </h3>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30">
              LIVE STREAM 2.0s
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            
            {/* Pyranometer Flux */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF3EA] border border-[#EED6CC] hover:border-[#E86A6A]/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBE1E1] text-[#8F2635] flex items-center justify-center radar-pulse-node">
                  <Sun className="w-4.5 h-4.5 text-[#E86A6A]" />
                </div>
                <div>
                  <span className="font-extrabold text-[#4A3030] block">Pyranometer Flux</span>
                  <span className="text-xs font-semibold text-[#8F2635]">Solar Irradiance</span>
                </div>
              </div>
              <div className="font-black text-[#4A3030] text-base">
                {telemetry?.irradiance || inputs?.irradiance || 850} W/m²
              </div>
            </div>

            {/* PT100 Core Backsheet Thermistor */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF3EA] border border-[#EED6CC] hover:border-[#E86A6A]/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBE1E1] text-[#8F2635] flex items-center justify-center">
                  <Thermometer className="w-4.5 h-4.5 text-[#E86A6A]" />
                </div>
                <div>
                  <span className="font-extrabold text-[#4A3030] block">PT100 Core Backsheet Thermistor</span>
                  <span className="text-xs font-semibold text-[#8F2635]">Panel Temperature</span>
                </div>
              </div>
              <div className="font-black text-[#4A3030] text-base">
                {telemetry?.panel_temp || inputs?.panel_temp || 35}°C
              </div>
            </div>

            {/* Optical Soiling Detector */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF3EA] border border-[#EED6CC] hover:border-[#E86A6A]/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBE1E1] text-[#8F2635] flex items-center justify-center">
                  <Wind className="w-4.5 h-4.5 text-[#E86A6A]" />
                </div>
                <div>
                  <span className="font-extrabold text-[#4A3030] block">Optical Soiling / Dust Detector</span>
                  <span className="text-xs font-semibold text-[#8F2635]">Optical Dust Loss</span>
                </div>
              </div>
              <div className="font-black text-[#4A3030] text-base">
                {telemetry?.soiling || inputs?.soiling || 3}%
              </div>
            </div>

            {/* Shading Photodiode Array */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF3EA] border border-[#EED6CC] hover:border-[#E86A6A]/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#FBE1E1] text-[#8F2635] flex items-center justify-center">
                  <Layers className="w-4.5 h-4.5 text-[#E86A6A]" />
                </div>
                <div>
                  <span className="font-extrabold text-[#4A3030] block">Shading Photodiode Array</span>
                  <span className="text-xs font-semibold text-[#8F2635]">Obstruction Level</span>
                </div>
              </div>
              <div className="font-black text-[#4A3030] text-base">
                {inputs?.shading || 5}%
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ROW 3: DUAL ACTION & IMPACT BOXES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 7 (Automated Servo Actuator Positioning) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-6 shadow-xs squircle-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EED6CC] pb-3">
            <h3 className="text-base sm:text-lg font-black text-[#4A3030] flex items-center space-x-2">
              <RotateCw className="w-5 h-5 text-[#E86A6A]" />
              <span>Motorized Servo Actuator Alignment</span>
            </h3>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30">
              SERVO LOOP
            </span>
          </div>

          <div className="bg-[#FBF3EA] rounded-xl p-4 border border-[#EED6CC] space-y-3">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#4A3030] font-semibold">Current Rack Angle Position:</span>
              <span className="font-black text-[#4A3030]">{currentTilt}°</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#4A3030] font-semibold">Target Recommendation:</span>
              <span className="font-black text-[#8F2635]">{optimalTilt}°</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#4A3030] font-semibold">Mechanical Generation Gain:</span>
              <span className="font-black text-[#8F2635]">+{gainW.toFixed(1)} W (+{percentageGain}%)</span>
            </div>
          </div>

          <button
            onClick={handleSimulateActuation}
            disabled={actuationActive}
            className="w-full py-3.5 px-4 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] active:scale-98 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${actuationActive ? 'animate-spin' : ''}`} />
            <span>{actuationActive ? 'Actuation Active...' : 'Align Actuator Now'}</span>
          </button>
        </div>

        {/* Box 8 (Environmental Carbon Impact) */}
        <div className="rounded-2xl border border-[#EED6CC] bg-[#FFFDFC] p-6 shadow-xs squircle-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EED6CC] pb-3">
            <h3 className="text-base sm:text-lg font-black text-[#4A3030] flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <span>Environmental Carbon Offset Impact</span>
            </h3>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              EPA TRACKER
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF3EA] border border-[#EED6CC]">
              <span className="text-[#4A3030] font-semibold">CO₂ Emissions Avoided</span>
              <span className="font-black text-[#8F2635] text-base">{carbon.co2_avoided_kg_daily} kg / day</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF3EA] border border-[#EED6CC]">
              <span className="text-[#4A3030] font-semibold">Equivalent Trees Planted</span>
              <span className="font-black text-[#8F2635] text-base">{carbon.trees_equivalent} Trees</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF3EA] border border-[#EED6CC]">
              <span className="text-[#4A3030] font-semibold">Passenger Car Miles Offset</span>
              <span className="font-black text-[#8F2635] text-base">{carbon.car_miles_offset} Miles</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
