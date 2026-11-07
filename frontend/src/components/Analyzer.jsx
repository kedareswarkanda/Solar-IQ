import React, { useState } from 'react';
import { 
  Sliders, 
  Sun, 
  Thermometer, 
  Wind, 
  Layers, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  PlayCircle,
  HelpCircle,
  Zap,
  TrendingDown,
  MapPin,
  Loader2
} from 'lucide-react';

export default function Analyzer({ 
  inputs, 
  setInputs, 
  results, 
  onAnalyze, 
  isAnalyzing, 
  cityPresets, 
  currentLocation,
  liveWeather,
  isRefreshingWeather
}) {
  const [simulationPreset, setSimulationPreset] = useState(null);

  const handleChange = (field, val) => {
    const numVal = parseFloat(val);
    setInputs(prev => ({
      ...prev,
      [field]: isNaN(numVal) ? val : numVal
    }));
  };

  const handlePresetSelect = (cityKey) => {
    if (!cityPresets || !cityPresets[cityKey]) return;
    const preset = cityPresets[cityKey];
    setSimulationPreset(cityKey);
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
    onAnalyze(updated);
  };

  const handleReturnToLive = () => {
    setSimulationPreset(null);
    if (liveWeather) {
      const updated = {
        ...inputs,
        irradiance: liveWeather.irradiance ?? inputs.irradiance,
        ambient_temp: liveWeather.ambient_temp ?? inputs.ambient_temp,
        panel_temp: liveWeather.panel_temp ?? inputs.panel_temp,
        humidity: liveWeather.humidity ?? inputs.humidity,
        wind_speed: liveWeather.wind_speed ?? inputs.wind_speed,
        weather: liveWeather.weather || inputs.weather
      };
      setInputs(updated);
      onAnalyze(updated);
    }
  };

  const handleReset = () => {
    setSimulationPreset(null);
    const defaultInputs = {
      irradiance: liveWeather?.irradiance ?? 850.0,
      ambient_temp: liveWeather?.ambient_temp ?? 25.0,
      panel_temp: liveWeather?.panel_temp ?? 35.0,
      humidity: liveWeather?.humidity ?? 50.0,
      wind_speed: liveWeather?.wind_speed ?? 3.0,
      weather: liveWeather?.weather || 'Sunny',
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
    };
    setInputs(defaultInputs);
    onAnalyze(defaultInputs);
  };

  const lossBreakdown = results?.loss_breakdown || {
    thermal_loss_w: 16.0,
    soiling_loss_w: 12.0,
    shading_loss_w: 20.0,
    age_loss_w: 8.0,
    orientation_loss_w: 10.0,
    total_loss_w: 66.0
  };

  const locationDisplayString = currentLocation ? 
    `${currentLocation.village || currentLocation.mandal || currentLocation.district || 'Selected Site'}, ${currentLocation.state || ''}, ${currentLocation.country || ''}` : 
    'Anantapur, Andhra Pradesh, India';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#F5E6D3] via-[#FBF3EA] to-[#FFFDFC] text-[#4A3030] rounded-3xl p-6 sm:p-8 border border-[#EED6CC] shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="relative z-10 max-w-5xl space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBE1E1] text-[#8F2635] text-xs font-bold border border-[#E86A6A]/30">
              <Sliders className="w-4 h-4 text-[#E86A6A]" />
              <span>Interactive Telemetry & Physical Array Configurator</span>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFFDFC] text-[#4A3030] text-xs font-semibold border border-[#EED6CC]">
              <MapPin className="w-3.5 h-3.5 text-[#E86A6A] shrink-0" />
              <span>📍 Active Location: <strong className="font-extrabold text-[#8F2635]">{locationDisplayString}</strong></span>
            </div>

            {isRefreshingWeather && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                <span>Updating Weather...</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#4A3030] tracking-tight">Solar Array Condition Analyzer</h1>
          <p className="text-[#8F2635] text-sm sm:text-base font-semibold leading-relaxed max-w-3xl">
            Configure ambient weather conditions, solar array sizing (1 to 200 panels), tilt geometry, and optical soiling loss levels.
          </p>
        </div>
      </div>

      {/* Simulation Mode Notification Banner */}
      {simulationPreset && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs sm:text-sm text-amber-900">
            <Zap className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold">⚡ SIMULATION MODE: {simulationPreset} Scenario Preset</span>
              <p className="text-amber-800 text-xs font-medium">
                Temporary simulation scenario inputs applied. Your global confirmed location remains <strong className="font-bold">{locationDisplayString}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={handleReturnToLive}
            className="px-3.5 py-1.5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Return to Live Location
          </button>
        </div>
      )}

      {/* Main Grid: Form Inputs & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Input Controls */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Quick Weather Presets Bar */}
          {cityPresets && typeof cityPresets === 'object' && !Array.isArray(cityPresets) && (
            <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#8F2635] uppercase tracking-wider flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-[#E86A6A]" />
                  <span>Climate City Presets</span>
                </span>
                <span className="text-xs text-[#4A3030]/70 font-semibold">Simulation scenario presets</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {Object.keys(cityPresets).map((cityKey) => (
                  <button
                    key={cityKey}
                    onClick={() => handlePresetSelect(cityKey)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                      simulationPreset === cityKey 
                        ? 'bg-[#E86A6A] text-white border-[#E86A6A] shadow-xs' 
                        : 'bg-[#FBF3EA] hover:bg-[#FBE1E1] text-[#4A3030] border-[#EED6CC]'
                    }`}
                  >
                    {cityKey}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Environmental & Hardware Parameter Form */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EED6CC]">
              <h2 className="text-lg font-black text-[#4A3030]">Solar Array Parameters</h2>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 text-xs text-[#8F2635] hover:text-[#E86A6A] font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#E86A6A]" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Sizing & Capacity Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-[#8F2635] uppercase tracking-wider">1. Array Capacity & Multi-Panel Sizing</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                    <span>Number of Solar Panels (1 - 200)</span>
                    <span className="font-extrabold text-[#8F2635]">{inputs.num_panels || 1} Panels</span>
                  </div>
                  <input 
                    type="range" min="1" max="200" step="1"
                    value={inputs.num_panels || 1}
                    onChange={(e) => handleChange('num_panels', e.target.value)}
                    className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Rated Power per Panel (W)</label>
                  <input 
                    type="number" min="100" max="1000" step="10"
                    value={inputs.rated_power}
                    onChange={(e) => handleChange('rated_power', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Environmental Conditions Section */}
            <div className="space-y-4 pt-5 border-t border-[#EED6CC]">
              <h3 className="text-xs font-extrabold text-[#8F2635] uppercase tracking-wider">2. Ambient Environment & Solar Flux</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                    <span>Solar Irradiance (W/m²)</span>
                    <span className="font-black text-[#8F2635]">{inputs.irradiance} W/m²</span>
                  </div>
                  <input 
                    type="range" min="0" max="1300" step="10"
                    value={inputs.irradiance}
                    onChange={(e) => handleChange('irradiance', e.target.value)}
                    className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                    <span>Panel Temperature (°C)</span>
                    <span className="font-black text-[#8F2635]">{inputs.panel_temp}°C</span>
                  </div>
                  <input 
                    type="range" min="-10" max="85" step="1"
                    value={inputs.panel_temp}
                    onChange={(e) => handleChange('panel_temp', e.target.value)}
                    className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Dust / Soiling (%)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={inputs.soiling}
                    onChange={(e) => handleChange('soiling', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Shading (%)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={inputs.shading}
                    onChange={(e) => handleChange('shading', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Tilt Angle (°)</label>
                  <input 
                    type="number" min="0" max="90"
                    value={inputs.tilt}
                    onChange={(e) => handleChange('tilt', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Run Analysis CTA Button */}
            <div className="pt-5 border-t border-[#EED6CC]">
              <button
                onClick={() => onAnalyze(inputs)}
                disabled={isAnalyzing}
                className="w-full py-4 px-5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] active:scale-[0.99] text-white font-extrabold text-base shadow-xs transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Evaluating XGBoost Model...' : 'Analyze Array Performance'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right 1 Column: Diagnostics & Energy Loss Breakdown */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Energy Loss Breakdown */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-[#E86A6A]" />
              <span>Energy Loss Breakdown</span>
            </h2>

            <div className="space-y-4 text-sm font-medium">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#4A3030]">
                  <span>Thermal Overheating Derating</span>
                  <span className="text-[#8F2635] font-extrabold">-{lossBreakdown.thermal_loss_w} W</span>
                </div>
                <div className="w-full bg-[#F5E6D3] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#E86A6A] h-full rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[#4A3030]">
                  <span>Dust & Optical Soiling</span>
                  <span className="text-[#8F2635] font-extrabold">-{lossBreakdown.soiling_loss_w} W</span>
                </div>
                <div className="w-full bg-[#F5E6D3] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#8F2635] h-full rounded-full transition-all duration-500" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[#4A3030]">
                  <span>Partial Shading Obstruction</span>
                  <span className="text-[#8F2635] font-extrabold">-{lossBreakdown.shading_loss_w} W</span>
                </div>
                <div className="w-full bg-[#F5E6D3] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#4A3030] h-full rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Insights Card */}
          <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-2.5">
            <h2 className="text-base font-extrabold text-[#4A3030]">AI Diagnostic Insight</h2>
            <p className="text-xs text-[#8F2635] leading-relaxed font-semibold">
              Operating temperature derating contributes the highest proportion of non-optical generation loss. Consider automated cooling or angle optimization to recover yield.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
