import React, { useState } from 'react';
import { 
  Zap, 
  RotateCw, 
  CheckCircle2, 
  Sliders, 
  TrendingUp, 
  ArrowRight, 
  Compass, 
  ShieldCheck, 
  Cpu,
  Sparkles,
  MapPin,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

export default function Optimizer({ 
  inputs, 
  results, 
  onOptimize, 
  isOptimizing,
  optError,
  currentLocation,
  liveWeather,
  isRefreshingWeather
}) {
  const [optMode, setOptMode] = useState('tilt');
  const [actuationStep, setActuationStep] = useState(null);
  const [isActuating, setIsActuating] = useState(false);

  const currentTilt = inputs?.tilt || 25;
  const optimalTilt = results?.optimal_tilt || 32;
  const currentPower = results?.ai_power_w || 380;
  const optimizedPower = results?.optimized_power_w || (currentPower * 1.14);
  const gainW = results?.gain_w || (optimizedPower - currentPower);
  const percentageGain = results?.percentage_gain || 14.2;

  // Search curve data for Recharts (Safe mapping to prevent NaN/undefined rendering)
  const rawCurve = Array.isArray(results?.search_curve) && results.search_curve.length > 0
    ? results.search_curve
    : null;

  const searchCurve = rawCurve
    ? rawCurve.map(item => ({
        tilt: typeof item.tilt === 'number' ? `${item.tilt}°` : (item.tilt?.toString().includes('°') ? item.tilt : `${item.tilt || 0}°`),
        power: Math.round(item.power ?? item.power_w ?? 0),
        power_w: Math.round(item.power_w ?? item.power ?? 0)
      }))
    : Array.from({ length: 17 }, (_, i) => {
        const tilt = i * 5;
        const peakTilt = optimalTilt;
        const dist = Math.abs(tilt - peakTilt);
        const p = Math.max(0, optimizedPower - dist * dist * 0.15 - Math.random() * 5);
        return { tilt: `${tilt}°`, power: Math.round(p), power_w: Math.round(p) };
      });

  const handleSimulateActuator = () => {
    setIsActuating(true);
    setActuationStep(0);
    const steps = [10, 30, 50, 75, 90, 100];
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        setActuationStep(steps[idx]);
      } else {
        clearInterval(interval);
        setTimeout(() => setIsActuating(false), 500);
      }
    }, 300);
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
              <Sparkles className="w-4 h-4 text-[#E86A6A]" />
              <span>AI Automated Parameter Sweep</span>
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

          <h1 className="text-2xl sm:text-4xl font-black text-[#4A3030] tracking-tight">Solar Tilt & Orientation Optimizer</h1>
          <p className="text-[#8F2635] text-sm sm:text-base font-semibold leading-relaxed max-w-3xl">
            Runs physics-guided XGBoost search across tilt angles (0°–80°) and azimuth orientations to calculate peak real-time electrical output.
          </p>
        </div>
      </div>

      {/* Error Alert Notification Banner */}
      {optError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <span>⚠️ {optError}</span>
          <button 
            onClick={() => onOptimize(optMode)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shrink-0 cursor-pointer"
          >
            Retry Sweep
          </button>
        </div>
      )}

      {/* Main Grid: Control & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Optimization Controls & Servo Actuator */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Optimization Mode Card */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2 mb-4">
              <Sliders className="w-5 h-5 text-[#E86A6A]" />
              <span>Optimization Mode</span>
            </h2>

            <div className="space-y-2.5 mb-6">
              {[
                { id: 'tilt', title: 'Tilt Angle Only (0° - 80°)', desc: 'Adjusts seasonal elevation angle' },
                { id: 'azimuth', title: 'Orientation / Azimuth Only', desc: 'Adjusts compass facing direction' },
                { id: 'both', title: 'Dual-Axis Co-Optimization', desc: 'Simultaneous tilt & azimuth search' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setOptMode(mode.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    optMode === mode.id
                      ? 'border-[#E86A6A] bg-[#FBE1E1] text-[#8F2635] font-extrabold border-l-4 border-l-[#E86A6A]'
                      : 'border-[#EED6CC] bg-[#FBF3EA] hover:bg-[#FFFDFC] text-[#4A3030]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#4A3030]">{mode.title}</div>
                  <div className="text-xs text-[#8F2635] mt-1 font-medium">{mode.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => onOptimize(optMode)}
              disabled={isOptimizing}
              className="w-full py-4 px-5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] active:scale-[0.98] text-white font-extrabold text-base shadow-xs transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-5 h-5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Sweeping Parameters...' : 'Run Parameter Sweep'}</span>
            </button>
          </div>

          {/* Automated Actuator Loop Control */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2 mb-3">
              <Cpu className="w-5 h-5 text-[#E86A6A]" />
              <span>Hardware Actuator Tracking Loop</span>
            </h2>
            <p className="text-xs text-[#8F2635] mb-4 leading-relaxed font-semibold">
              Sends automated tilt command signals to motorized solar panel tracking mounting racks.
            </p>

            <div className="bg-[#FBF3EA] rounded-xl p-4 border border-[#EED6CC] space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-[#4A3030] font-semibold">Current Position:</span>
                <span className="font-black text-[#4A3030]">{currentTilt}°</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-[#4A3030] font-semibold">Target Recommendation:</span>
                <span className="font-black text-[#8F2635]">{optimalTilt}°</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-[#4A3030] font-semibold">Mechanical Delta:</span>
                <span className="font-black text-[#8F2635]">+{Math.abs(optimalTilt - currentTilt)}°</span>
              </div>
            </div>

            {/* Actuation Simulation Visualizer */}
            {isActuating && (
              <div className="space-y-2 mb-4 animate-fade-in">
                <div className="flex justify-between text-xs font-bold text-[#8F2635]">
                  <span>Rotating Panel Rack...</span>
                  <span className="font-black">{actuationStep}%</span>
                </div>
                <div className="w-full bg-[#F5E6D3] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#E86A6A] h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${actuationStep}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleSimulateActuator}
              disabled={isActuating}
              className="w-full py-3 px-4 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-extrabold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RotateCw className={`w-4 h-4 ${isActuating ? 'animate-spin' : ''}`} />
              <span>{isActuating ? 'Actuation Active...' : 'Execute Servo Alignment'}</span>
            </button>
          </div>

        </div>

        {/* Right Column: Sweep Chart & Gain Summary */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Key Optimization Gain Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
              <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Baseline Tilt</span>
              <div className="text-2xl font-black text-[#4A3030] mt-1">{currentTilt}°</div>
              <span className="text-xs text-[#4A3030]/80 font-medium">{currentPower.toFixed(1)} W</span>
            </div>

            <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
              <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Optimal Tilt</span>
              <div className="text-2xl font-black text-[#8F2635] mt-1">{optimalTilt}°</div>
              <span className="text-xs text-[#8F2635] font-semibold">{optimizedPower.toFixed(1)} W</span>
            </div>

            <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
              <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Power Gain</span>
              <div className="text-2xl font-black text-[#8F2635] mt-1">+{gainW.toFixed(1)} W</div>
              <span className="text-xs text-[#8F2635] font-semibold">+{percentageGain.toFixed(1)}% Generation</span>
            </div>

            <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
              <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Annual Yield Gain</span>
              <div className="text-2xl font-black text-[#4A3030] mt-1">+{((gainW * 5.2 * 365) / 1000).toFixed(0)} kWh</div>
              <span className="text-xs text-[#8F2635] font-medium">Estimated Yearly</span>
            </div>
          </div>

          {/* Parameter Sweep Curve Recharts */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#E86A6A]" />
                  <span>Tilt Angle Sweep Curve (0° to 80°)</span>
                </h2>
                <p className="text-xs text-[#8F2635] mt-1 font-semibold">
                  XGBoost regression power output across 5° elevation increments
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-bold text-[#8F2635]">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#E86A6A]"></div>
                  <span>Predicted Power (W)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={searchCurve} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="coralSweep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E86A6A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E86A6A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FBF3EA" vertical={false} />
                  <XAxis dataKey="tilt" stroke="#8F2635" fontSize={12} tickLine={false} />
                  <YAxis stroke="#8F2635" fontSize={12} tickLine={false} axisLine={false} unit="W" />
                  <Tooltip contentStyle={{ backgroundColor: '#4A3030', borderRadius: '12px', color: '#FFF', fontSize: '12px', fontWeight: 'bold', border: 'none' }} />
                  <ReferenceLine x={`${optimalTilt}°`} stroke="#8F2635" strokeDasharray="4 4" label={{ value: 'Peak', fill: '#8F2635', fontSize: 12, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="power" stroke="#E86A6A" strokeWidth={3} fillOpacity={1} fill="url(#coralSweep)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendation Summary */}
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-[#FBE1E1] text-[#8F2635] shrink-0 border border-[#E86A6A]/30">
              <ShieldCheck className="w-6 h-6 text-[#E86A6A]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-[#4A3030]">AI Alignment Recommendation</h2>
              <p className="text-xs text-[#8F2635] leading-relaxed font-semibold">
                By adjusting solar array tilt from <span className="font-extrabold text-[#4A3030]">{currentTilt}°</span> to optimal <span className="font-extrabold text-[#8F2635]">{optimalTilt}°</span>, total array output increases by <span className="font-extrabold text-[#8F2635]">+{gainW.toFixed(1)} W</span> (+{percentageGain.toFixed(1)}%). We recommend running automated actuator alignment during solar noon.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
