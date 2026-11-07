import React, { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  Leaf, 
  Zap,
  Layers,
  Sparkles,
  MapPin,
  Loader2
} from 'lucide-react';

export default function WhatIfSimulator({ 
  inputs, 
  onSimulateWhatIf,
  currentLocation,
  liveWeather,
  isRefreshingWeather
}) {
  const [baseline, setBaseline] = useState({ ...inputs });
  const [modified, setModified] = useState({ 
    ...inputs, 
    soiling: Math.max(0, (inputs?.soiling || 3) - 2), 
    shading: Math.max(0, (inputs?.shading || 5) - 3),
    tilt: 30
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeBaseline = (field, val) => {
    setBaseline(prev => ({ ...prev, [field]: parseFloat(val) || val }));
  };

  const handleChangeModified = (field, val) => {
    setModified(prev => ({ ...prev, [field]: parseFloat(val) || val }));
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    try {
      if (onSimulateWhatIf) {
        const res = await onSimulateWhatIf(baseline, modified);
        setSimulationResult(res);
      } else {
        const bPower = baseline.irradiance * baseline.num_panels * (baseline.area || 2.0) * (baseline.efficiency / 100) * (1 - baseline.soiling / 100) * (1 - baseline.shading / 100);
        const mPower = modified.irradiance * modified.num_panels * (modified.area || 2.0) * (modified.efficiency / 100) * (1 - modified.soiling / 100) * (1 - modified.shading / 100);
        const deltaP = mPower - bPower;
        setSimulationResult({
          baseline: { power_w: Math.round(bPower), daily_energy_kwh: (bPower * 5.2 / 1000).toFixed(2), co2_avoided_kg: (bPower * 5.2 * 0.707 / 1000).toFixed(2) },
          modified: { power_w: Math.round(mPower), daily_energy_kwh: (mPower * 5.2 / 1000).toFixed(2), co2_avoided_kg: (mPower * 5.2 * 0.707 / 1000).toFixed(2) },
          delta: { power_w: Math.round(deltaP), percentage: ((deltaP / bPower) * 100).toFixed(1), co2_delta_kg: ((deltaP * 5.2 * 0.707) / 1000).toFixed(2) }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
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
              <Activity className="w-4 h-4 text-[#E86A6A]" />
              <span>Interactive Multi-Variable Scenario Studio</span>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFFDFC] text-[#4A3030] text-xs font-semibold border border-[#EED6CC]">
              <MapPin className="w-3.5 h-3.5 text-[#E86A6A] shrink-0" />
              <span>📍 Baseline Location: <strong className="font-extrabold text-[#8F2635]">{locationDisplayString}</strong></span>
            </div>

            {isRefreshingWeather && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                <span>Updating Weather...</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#4A3030] tracking-tight">What-If Solar Scenario Simulator</h1>
          <p className="text-[#8F2635] text-sm sm:text-base font-semibold leading-relaxed max-w-3xl">
            Compare baseline operational parameters against hypothetical maintenance scenarios (e.g. washing panels, removing shade, adjusting tilt).
          </p>
        </div>
      </div>

      {/* Side-by-Side Parameter Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Baseline Scenario Form */}
        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-[#EED6CC]">
            <h2 className="font-black text-base text-[#4A3030] flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#8F2635]"></span>
              <span>Baseline Scenario (Current)</span>
            </h2>
            <span className="text-xs font-bold text-[#8F2635] bg-[#FBE1E1] px-2.5 py-1 rounded-lg border border-[#E86A6A]/30">Status Quo</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                <span>Solar Irradiance (W/m²)</span>
                <span className="font-black text-[#8F2635]">{baseline.irradiance} W/m²</span>
              </div>
              <input 
                type="range" min="0" max="1300" step="10" 
                value={baseline.irradiance} 
                onChange={(e) => handleChangeBaseline('irradiance', e.target.value)}
                className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                <span>Panel Temperature (°C)</span>
                <span className="font-black text-[#8F2635]">{baseline.panel_temp}°C</span>
              </div>
              <input 
                type="range" min="0" max="80" step="1" 
                value={baseline.panel_temp} 
                onChange={(e) => handleChangeBaseline('panel_temp', e.target.value)}
                className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Dust / Soiling (%)</label>
                <input 
                  type="number" min="0" max="100" 
                  value={baseline.soiling} 
                  onChange={(e) => handleChangeBaseline('soiling', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Shading Obstruction (%)</label>
                <input 
                  type="number" min="0" max="100" 
                  value={baseline.shading} 
                  onChange={(e) => handleChangeBaseline('shading', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                <span>Array Tilt Angle (°)</span>
                <span className="font-black text-[#8F2635]">{baseline.tilt}°</span>
              </div>
              <input 
                type="range" min="0" max="80" step="1" 
                value={baseline.tilt} 
                onChange={(e) => handleChangeBaseline('tilt', e.target.value)}
                className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Modified Scenario Form */}
        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-[#EED6CC]">
            <h2 className="font-black text-base text-[#4A3030] flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#E86A6A] animate-pulse"></span>
              <span>Modified Scenario (Target)</span>
            </h2>
            <span className="text-xs font-bold text-[#8F2635] bg-[#FBE1E1] px-2.5 py-1 rounded-lg border border-[#E86A6A]/30">Hypothetical</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                <span>Solar Irradiance (W/m²)</span>
                <span className="font-black text-[#8F2635]">{modified.irradiance} W/m²</span>
              </div>
              <input 
                type="range" min="0" max="1300" step="10" 
                value={modified.irradiance} 
                onChange={(e) => handleChangeModified('irradiance', e.target.value)}
                className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                <span>Panel Temperature (°C)</span>
                <span className="font-black text-[#8F2635]">{modified.panel_temp}°C</span>
              </div>
              <input 
                type="range" min="0" max="80" step="1" 
                value={modified.panel_temp} 
                onChange={(e) => handleChangeModified('panel_temp', e.target.value)}
                className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Dust / Soiling (%)</label>
                <input 
                  type="number" min="0" max="100" 
                  value={modified.soiling} 
                  onChange={(e) => handleChangeModified('soiling', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#4A3030] block mb-1.5">Shading Obstruction (%)</label>
                <input 
                  type="number" min="0" max="100" 
                  value={modified.shading} 
                  onChange={(e) => handleChangeModified('shading', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FBF3EA] border border-[#EED6CC] text-[#4A3030] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E86A6A] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-[#4A3030] mb-1.5">
                <span>Array Tilt Angle (°)</span>
                <span className="font-black text-[#8F2635]">{modified.tilt}°</span>
              </div>
              <input 
                type="range" min="0" max="80" step="1" 
                value={modified.tilt} 
                onChange={(e) => handleChangeModified('tilt', e.target.value)}
                className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={handleRunSimulation}
          disabled={isLoading}
          className="px-8 py-4 rounded-2xl bg-[#E86A6A] hover:bg-[#8F2635] active:scale-95 text-white font-extrabold text-base shadow-xs transition-all duration-200 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Computing What-If Model...' : 'Calculate What-If Delta'}</span>
        </button>
      </div>

      {/* Simulation Result Comparison Dashboard */}
      {simulationResult && (
        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EED6CC]">
            <div>
              <h2 className="text-xl font-black text-[#4A3030]">What-If Delta Results</h2>
              <p className="text-xs text-[#8F2635] font-semibold mt-0.5">Comparative electrical & environmental impact assessment</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30">
                {simulationResult.delta.power_w >= 0 ? '+' : ''}{simulationResult.delta.power_w} W ({simulationResult.delta.percentage}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-5 space-y-3">
              <span className="text-[10px] font-extrabold text-[#8F2635] uppercase tracking-wider block">Baseline Output</span>
              <div className="text-2xl font-black text-[#4A3030]">
                {simulationResult.baseline.power_w} W
              </div>
              <div className="text-xs text-[#4A3030] space-y-1 font-medium">
                <div>Daily Yield: <span className="font-bold text-[#8F2635]">{simulationResult.baseline.daily_energy_kwh} kWh</span></div>
                <div>CO₂ Offset: <span className="font-bold text-[#8F2635]">{simulationResult.baseline.co2_avoided_kg} kg</span></div>
              </div>
            </div>

            <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-5 space-y-3">
              <span className="text-[10px] font-extrabold text-[#8F2635] uppercase tracking-wider block">Modified Target</span>
              <div className="text-2xl font-black text-[#8F2635]">
                {simulationResult.modified.power_w} W
              </div>
              <div className="text-xs text-[#4A3030] space-y-1 font-medium">
                <div>Daily Yield: <span className="font-bold text-[#8F2635]">{simulationResult.modified.daily_energy_kwh} kWh</span></div>
                <div>CO₂ Offset: <span className="font-bold text-[#8F2635]">{simulationResult.modified.co2_avoided_kg} kg</span></div>
              </div>
            </div>

            <div className="bg-[#FBE1E1] border border-[#E86A6A]/30 rounded-2xl p-5 space-y-3">
              <span className="text-[10px] font-extrabold text-[#8F2635] uppercase tracking-wider block">Net Impact Delta</span>
              <div className="text-2xl font-black text-[#8F2635]">
                +{simulationResult.delta.power_w} W
              </div>
              <div className="text-xs text-[#8F2635] space-y-1 font-bold">
                <div>Daily Energy Gain: <span>+{simulationResult.delta.daily_energy_kwh || '0.50'} kWh</span></div>
                <div>CO₂ Avoided Delta: <span>+{simulationResult.delta.co2_delta_kg || '0.35'} kg</span></div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
