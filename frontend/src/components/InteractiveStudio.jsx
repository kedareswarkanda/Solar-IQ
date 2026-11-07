import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  DollarSign, 
  Play, 
  Pause, 
  Flame, 
  ShieldCheck, 
  Sliders, 
  TrendingUp, 
  Sparkles, 
  Droplets, 
  Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Cell 
} from 'recharts';

export default function InteractiveStudio({ inputs, results }) {
  const [activeSubTab, setActiveSubTab] = useState('raytracing'); // 'raytracing' | 'heatmap' | 'roi'

  // --- Sub-Module 1: Photon & Ray-Tracing Controls ---
  const [sunHour, setSunHour] = useState(12.0); // 6.0 to 18.0
  const [panelTilt, setPanelTilt] = useState(inputs?.tilt || 25);
  const [treeObstruction, setTreeObstruction] = useState(10); // 0 to 100%
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Computed Solar Vector Geometry
  const sunAngleRad = ((sunHour - 6) / 12) * Math.PI; // 0 to PI
  const sunElevationDeg = Math.sin(sunAngleRad) * 75; // 0 to 75 deg
  const incidenceAngleDeg = Math.abs(sunElevationDeg - (90 - panelTilt));
  const cosIncidence = Math.max(0, Math.cos((incidenceAngleDeg * Math.PI) / 180));
  const shadowLength = Math.max(0, (100 - sunElevationDeg) * (treeObstruction / 100) * 1.5);
  
  // Real-time Photon Power Calculation
  const baseIrradiance = Math.sin(sunAngleRad) * (inputs?.irradiance || 900);
  const effectiveIrradiance = Math.max(0, baseIrradiance * cosIncidence * (1 - shadowLength / 200));
  const photonPowerW = Math.round(effectiveIrradiance * (inputs?.num_panels || 1) * (inputs?.area || 2.0) * ((inputs?.efficiency || 20) / 100));

  // Orbit Timer Loop
  useEffect(() => {
    let interval = null;
    if (isOrbiting) {
      interval = setInterval(() => {
        setSunHour(prev => {
          if (prev >= 18.0) return 6.0;
          return parseFloat((prev + 0.2).toFixed(1));
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isOrbiting]);

  // --- Sub-Module 2: 16-Cell Thermal Anomaly Heatmap State ---
  const [cellGrid, setCellGrid] = useState([
    { id: 1, temp: 34, status: 'normal' }, { id: 2, temp: 35, status: 'normal' },
    { id: 3, temp: 36, status: 'normal' }, { id: 4, temp: 34, status: 'normal' },
    { id: 5, temp: 35, status: 'normal' }, { id: 6, temp: 78, status: 'hotspot' },
    { id: 7, temp: 37, status: 'normal' }, { id: 8, temp: 34, status: 'normal' },
    { id: 9, temp: 36, status: 'normal' }, { id: 10, temp: 35, status: 'normal' },
    { id: 11, temp: 36, status: 'normal' }, { id: 12, temp: 82, status: 'hotspot' },
    { id: 13, temp: 34, status: 'normal' }, { id: 14, temp: 35, status: 'normal' },
    { id: 15, temp: 36, status: 'normal' }, { id: 16, temp: 34, status: 'normal' }
  ]);
  const [isCoolingJetActive, setIsCoolingJetActive] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const injectRandomFault = () => {
    const randomCell = Math.floor(Math.random() * 16);
    setCellGrid(prev => prev.map((cell, idx) => {
      if (idx === randomCell) {
        return { ...cell, temp: Math.floor(75 + Math.random() * 15), status: 'hotspot' };
      }
      return cell;
    }));
    setScanMessage(`Thermal anomaly detected at Cell #${randomCell + 1}!`);
  };

  const deployCoolingJet = () => {
    setIsCoolingJetActive(true);
    setScanMessage('Automated cooling water jet deployed...');
    setTimeout(() => {
      setCellGrid(prev => prev.map(cell => ({
        ...cell,
        temp: Math.floor(32 + Math.random() * 4),
        status: 'normal'
      })));
      setIsCoolingJetActive(false);
      setScanMessage('All thermal hot-spots remediated. 100% cell yield restored.');
    }, 1200);
  };

  // --- Sub-Module 3: Financial ROI & Storage Calculator State ---
  const [electricityTariff, setElectricityTariff] = useState(0.18);
  const [costPerWatt, setCostPerWatt] = useState(1.10);
  const [batteryKwh, setBatteryKwh] = useState(10);
  const numPanels = inputs?.num_panels || 12;
  const systemKw = (numPanels * (inputs?.rated_power || 400)) / 1000;
  
  const initialCost = Math.round(systemKw * 1000 * costPerWatt + batteryKwh * 350);
  const annualKwhGenerated = (results?.daily_energy_kwh || (systemKw * 4.8)) * 365;
  const annualSavings = Math.round(annualKwhGenerated * electricityTariff + batteryKwh * 80);
  const paybackYears = parseFloat((initialCost / Math.max(1, annualSavings)).toFixed(1));
  const roi25YearsPct = Math.round(((annualSavings * 25 - initialCost) / initialCost) * 100);

  // 25-Year Cash Flow Data
  const financialData = Array.from({ length: 26 }, (_, year) => {
    const cumulativeSavings = annualSavings * year - (year === 0 ? initialCost : initialCost);
    return {
      year: `Yr ${year}`,
      cashFlow: Math.round(cumulativeSavings)
    };
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#F5E6D3] via-[#FBF3EA] to-[#FFFDFC] text-[#4A3030] rounded-3xl p-6 sm:p-8 border border-[#EED6CC] shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="relative z-10 max-w-5xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#FBE1E1] text-[#8F2635] text-xs font-bold border border-[#E86A6A]/30">
            <Sparkles className="w-4 h-4 text-[#E86A6A]" />
            <span>Signature Real-Time Feature Suite</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#4A3030] tracking-tight">Interactive Solar AR Studio & Financial Engine</h1>
          <p className="text-[#8F2635] text-sm sm:text-base font-semibold leading-relaxed max-w-3xl">
            Experience real-time photon ray tracing, dynamic panel tilt geometry, 16-cell thermal anomaly scanning, and 25-year financial payback modeling.
          </p>
        </div>
      </div>

      {/* Sub-Module Navigation Switcher */}
      <div className="flex flex-wrap gap-2.5 bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-2.5 shadow-xs">
        {[
          { id: 'raytracing', label: '1. Live Photon Ray-Tracing & Shadow AR', icon: Eye, desc: 'Sun arc & electron flow' },
          { id: 'heatmap', label: '2. 16-Cell Thermal Anomaly Scanner', icon: Flame, desc: 'Hot-spot detection & jet cooling' },
          { id: 'roi', label: '3. Financial ROI & Battery Payback', icon: DollarSign, desc: '25-year cash flow calculator' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 min-w-[240px] text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-[#FBE1E1] border-[#E86A6A] text-[#8F2635] shadow-xs font-extrabold border-l-4 border-l-[#E86A6A]'
                  : 'bg-[#FFFDFC] text-[#4A3030] border-[#EED6CC] hover:bg-[#FBF3EA]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#E86A6A]' : 'text-[#8F2635]'}`} />
                <div>
                  <div className={`text-sm ${isActive ? 'font-extrabold text-[#8F2635]' : 'font-bold text-[#4A3030]'}`}>
                    {tab.label}
                  </div>
                  <div className={`text-xs ${isActive ? 'text-[#8F2635]/80 font-medium' : 'text-[#4A3030]/70 font-normal'}`}>
                    {tab.desc}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* SUB-MODULE 1: LIVE PHOTON RAY-TRACING & SHADOW AR VISUALIZER */}
      {activeSubTab === 'raytracing' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Interactive Controls */}
            <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-5 lg:col-span-1">
              <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#E86A6A]" />
                <span>Ray-Tracing Controls</span>
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-[#4A3030]">
                  <span>Solar Zenith Time</span>
                  <span className="font-extrabold text-[#8F2635]">{Math.floor(sunHour)}:{Math.round((sunHour % 1) * 60).toString().padStart(2, '0')} {sunHour < 12 ? 'AM' : 'PM'}</span>
                </div>
                <input 
                  type="range" min="6.0" max="18.0" step="0.1"
                  value={sunHour}
                  onChange={(e) => setSunHour(parseFloat(e.target.value))}
                  className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-[#EED6CC]">
                <div className="flex justify-between text-sm font-semibold text-[#4A3030]">
                  <span>Panel Tilt Angle</span>
                  <span className="font-extrabold text-[#8F2635]">{panelTilt}°</span>
                </div>
                <input 
                  type="range" min="0" max="80" step="1"
                  value={panelTilt}
                  onChange={(e) => setPanelTilt(parseInt(e.target.value))}
                  className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-[#EED6CC]">
                <div className="flex justify-between text-sm font-semibold text-[#4A3030]">
                  <span>Tree Shading Obstruction</span>
                  <span className="font-black text-[#8F2635]">{treeObstruction}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5"
                  value={treeObstruction}
                  onChange={(e) => setTreeObstruction(parseInt(e.target.value))}
                  className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                />
              </div>

              <div className="pt-4 border-t border-[#EED6CC]">
                <button
                  onClick={() => setIsOrbiting(!isOrbiting)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-extrabold text-sm shadow-xs transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isOrbiting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isOrbiting ? 'Pause Sun Trajectory' : 'Start Auto Sun Orbit'}</span>
                </button>
              </div>

            </div>

            {/* Right Column: Interactive Canvas Visualizer */}
            <div className="bg-gradient-to-b from-[#4A3030] via-[#8F2635] to-[#4A3030] border border-[#EED6CC] rounded-2xl p-6 text-white shadow-md lg:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
              
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Live Ray-Tracing Simulation</span>
                  <h2 className="text-xl font-black text-white mt-0.5">Photovoltaic Beam & Electron Flow</h2>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-right">
                  <div className="text-xs text-amber-100 font-medium">Real-Time Power</div>
                  <div className="text-xl font-black text-white">{photonPowerW} W</div>
                </div>
              </div>

              <div className="relative w-full h-64 my-4 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 600 240">
                  <defs>
                    <linearGradient id="sunGlowCoral" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FDE047" />
                      <stop offset="100%" stopColor="#E86A6A" />
                    </linearGradient>
                    <linearGradient id="rayBeamCoral" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#E86A6A" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="panelGlassCoral" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#E86A6A" />
                      <stop offset="100%" stopColor="#8F2635" />
                    </linearGradient>
                  </defs>

                  <path d="M 60 200 A 240 160 0 0 1 540 200" fill="none" stroke="#FBE1E1" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />

                  {(() => {
                    const cx = 300 - Math.cos(sunAngleRad) * 240;
                    const cy = 200 - Math.sin(sunAngleRad) * 160;
                    return (
                      <g>
                        <line x1={cx} y1={cy} x2="300" y2="170" stroke="url(#rayBeamCoral)" strokeWidth="12" />
                        <circle cx={cx} cy={cy} r="22" fill="url(#sunGlowCoral)" className="animate-pulse" />
                      </g>
                    );
                  })()}

                  <line x1="20" y1="200" x2="580" y2="200" stroke="#FBE1E1" strokeWidth="3" opacity="0.6" />

                  <g transform={`translate(300, 180) rotate(${-panelTilt})`}>
                    <rect x="-6" y="0" width="12" height="20" fill="#FFFDFC" />
                    <rect x="-80" y="-8" width="160" height="16" fill="url(#panelGlassCoral)" rx="3" stroke="#FBE1E1" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-xs font-semibold z-10">
                <div>
                  <span className="text-amber-100 block text-[10px]">Sun Elevation</span>
                  <div className="font-black text-white text-sm">{sunElevationDeg.toFixed(1)}°</div>
                </div>
                <div>
                  <span className="text-amber-100 block text-[10px]">Incidence Angle</span>
                  <div className="font-black text-white text-sm">{incidenceAngleDeg.toFixed(1)}°</div>
                </div>
                <div>
                  <span className="text-amber-100 block text-[10px]">Cosine Efficiency</span>
                  <div className="font-black text-white text-sm">{(cosIncidence * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-amber-100 block text-[10px]">Optical Shadow Loss</span>
                  <div className="font-black text-white text-sm">-{Math.round(shadowLength / 2)} W</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SUB-MODULE 2: 16-CELL THERMAL ANOMALY HEATMAP SCANNER */}
      {activeSubTab === 'heatmap' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EED6CC]">
              <div>
                <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-[#E86A6A]" />
                  <span>16-Cell Photovoltaic Thermal Telemetry Heatmap</span>
                </h2>
                <p className="text-xs text-[#8F2635] font-semibold mt-0.5">
                  Monitors individual solar panel silicon cell junction temperatures in real time to detect thermal hot-spots.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={injectRandomFault}
                  className="px-4 py-2 rounded-xl bg-[#FBF3EA] hover:bg-[#F5E6D3] text-[#8F2635] border border-[#EED6CC] text-xs font-bold transition-all cursor-pointer"
                >
                  Inject Random Hot-Spot
                </button>
                <button
                  onClick={deployCoolingJet}
                  disabled={isCoolingJetActive}
                  className="px-4 py-2 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Droplets className={`w-4 h-4 ${isCoolingJetActive ? 'animate-bounce' : ''}`} />
                  <span>Deploy Jet Cooling</span>
                </button>
              </div>
            </div>

            {scanMessage && (
              <div className="p-3.5 rounded-xl bg-[#FBE1E1] border border-[#E86A6A]/30 text-[#8F2635] text-xs font-bold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#E86A6A] shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3.5 max-w-2xl mx-auto">
              {cellGrid.map((cell) => {
                const isHot = cell.status === 'hotspot';
                return (
                  <div
                    key={cell.id}
                    className={`p-4 rounded-2xl border text-center transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden ${
                      isHot 
                        ? 'bg-[#8F2635] text-white border-[#8F2635] shadow-md ring-4 ring-[#E86A6A]/30 animate-pulse' 
                        : 'bg-[#FBF3EA] border-[#EED6CC] text-[#4A3030] hover:bg-[#F5E6D3]'
                    }`}
                  >
                    {isCoolingJetActive && isHot && (
                      <div className="absolute inset-0 bg-[#E86A6A]/60 backdrop-blur-xs flex items-center justify-center animate-fade-in">
                        <Droplets className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">Cell #{cell.id}</div>
                    <div className="text-xl sm:text-2xl font-black mt-1">{cell.temp}°C</div>
                    <div className={`text-[10px] font-bold mt-1 ${isHot ? 'text-white' : 'text-[#8F2635]'}`}>
                      {isHot ? 'Fault: Overheating' : 'Optimal'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 3: FINANCIAL ROI & BATTERY PAYBACK CALCULATOR */}
      {activeSubTab === 'roi' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-5 lg:col-span-1">
              <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-[#E86A6A]" />
                <span>Financial Parameters</span>
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-[#4A3030]">
                  <span>Electricity Tariff Rate ($/kWh)</span>
                  <span className="font-extrabold text-[#8F2635]">${electricityTariff.toFixed(2)} / kWh</span>
                </div>
                <input 
                  type="range" min="0.05" max="0.50" step="0.01"
                  value={electricityTariff}
                  onChange={(e) => setElectricityTariff(parseFloat(e.target.value))}
                  className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-[#EED6CC]">
                <div className="flex justify-between text-sm font-semibold text-[#4A3030]">
                  <span>Turnkey System Cost ($/W)</span>
                  <span className="font-extrabold text-[#8F2635]">${costPerWatt.toFixed(2)} / Watt</span>
                </div>
                <input 
                  type="range" min="0.60" max="2.50" step="0.05"
                  value={costPerWatt}
                  onChange={(e) => setCostPerWatt(parseFloat(e.target.value))}
                  className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-[#EED6CC]">
                <div className="flex justify-between text-sm font-semibold text-[#4A3030]">
                  <span>Battery Storage Capacity (kWh)</span>
                  <span className="font-extrabold text-[#8F2635]">{batteryKwh} kWh</span>
                </div>
                <input 
                  type="range" min="0" max="30" step="2"
                  value={batteryKwh}
                  onChange={(e) => setBatteryKwh(parseInt(e.target.value))}
                  className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
                />
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
                  <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Est Initial Investment</span>
                  <div className="text-xl sm:text-2xl font-black text-[#4A3030] mt-1">${initialCost.toLocaleString()}</div>
                </div>

                <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
                  <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Annual Bill Savings</span>
                  <div className="text-xl sm:text-2xl font-black text-[#8F2635] mt-1">${annualSavings.toLocaleString()}</div>
                </div>

                <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
                  <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Payback Period</span>
                  <div className="text-xl sm:text-2xl font-black text-[#8F2635] mt-1">{paybackYears} Yrs</div>
                </div>

                <div className="bg-[#FBF3EA] border border-[#EED6CC] rounded-2xl p-4 shadow-xs">
                  <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">25-Year Net ROI</span>
                  <div className="text-xl sm:text-2xl font-black text-[#4A3030] mt-1">+{roi25YearsPct}%</div>
                </div>
              </div>

              <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs">
                <h2 className="text-base font-black text-[#4A3030] flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[#E86A6A]" />
                  <span>25-Year Cumulative Cash Flow Projection ($)</span>
                </h2>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FBF3EA" vertical={false} />
                      <XAxis dataKey="year" stroke="#8F2635" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8F2635" fontSize={11} tickLine={false} axisLine={false} unit="$" />
                      <Tooltip contentStyle={{ backgroundColor: '#4A3030', borderRadius: '12px', color: '#FFF', fontSize: '12px', fontWeight: 'bold', border: 'none' }} />
                      <ReferenceLine y={0} stroke="#8F2635" strokeDasharray="3 3" />
                      <Bar dataKey="cashFlow">
                        {financialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cashFlow >= 0 ? '#E86A6A' : '#8F2635'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
