import React, { useState } from 'react';
import { 
  Clock, 
  Sun, 
  Play, 
  Pause, 
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
  CartesianGrid 
} from 'recharts';

export default function DailySimulator({ 
  inputs, 
  results,
  currentLocation,
  liveWeather,
  isRefreshingWeather
}) {
  const [activeHour, setActiveHour] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);

  // Hourly profile data (06:00 to 18:00)
  const hourlyData = results?.hourly_profile || [
    { time: '06:00', irradiance: 50, power_w: 25, temp: 22 },
    { time: '07:00', irradiance: 200, power_w: 110, temp: 24 },
    { time: '08:00', irradiance: 420, power_w: 230, temp: 27 },
    { time: '09:00', irradiance: 650, power_w: 340, temp: 31 },
    { time: '10:00', irradiance: 820, power_w: 420, temp: 35 },
    { time: '11:00', irradiance: 950, power_w: 470, temp: 39 },
    { time: '12:00', irradiance: 1000, power_w: 490, temp: 42 },
    { time: '13:00', irradiance: 960, power_w: 475, temp: 44 },
    { time: '14:00', irradiance: 850, power_w: 430, temp: 43 },
    { time: '15:00', irradiance: 680, power_w: 350, temp: 40 },
    { time: '16:00', irradiance: 450, power_w: 240, temp: 36 },
    { time: '17:00', irradiance: 220, power_w: 115, temp: 31 },
    { time: '18:00', irradiance: 60, power_w: 30, temp: 27 }
  ];

  const dailyKwh = results?.daily_energy_kwh || 3.72;
  const currentItem = hourlyData.find(d => parseInt(d.time) === activeHour) || hourlyData[6];

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      let hour = 6;
      const interval = setInterval(() => {
        hour++;
        if (hour > 18) {
          clearInterval(interval);
          setIsPlaying(false);
        } else {
          setActiveHour(hour);
        }
      }, 500);
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
              <Clock className="w-4 h-4 text-[#E86A6A]" />
              <span>24-Hour Solar Zenith Trajectory</span>
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

          <h1 className="text-2xl sm:text-4xl font-black text-[#4A3030] tracking-tight">Diurnal Solar Generation Profile</h1>
          <p className="text-[#8F2635] text-sm sm:text-base font-semibold leading-relaxed max-w-3xl">
            Simulates sunrise-to-sunset power generation curves based on solar elevation position, ambient temperature shifts, and array capacity.
          </p>
        </div>
      </div>

      {/* Hourly Key Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-5 shadow-xs">
          <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Total Daily Yield</span>
          <div className="text-2xl font-black text-[#4A3030] mt-1">{dailyKwh} kWh</div>
          <span className="text-xs text-[#4A3030]/80 font-medium">Cumulative energy</span>
        </div>

        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-5 shadow-xs">
          <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Peak Hour Output</span>
          <div className="text-2xl font-black text-[#4A3030] mt-1">12:00 PM</div>
          <span className="text-xs text-[#4A3030]/80 font-medium">Solar zenith peak</span>
        </div>

        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-5 shadow-xs">
          <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Active Hour Output</span>
          <div className="text-2xl font-black text-[#8F2635] mt-1">{currentItem?.power_w || 0} W</div>
          <span className="text-xs text-[#4A3030]/80 font-medium">At {currentItem?.time || '12:00'}</span>
        </div>

        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-5 shadow-xs">
          <span className="text-[#8F2635] text-[10px] font-extrabold uppercase tracking-wider block">Daily CO₂ Avoided</span>
          <div className="text-2xl font-black text-[#8F2635] mt-1">{(dailyKwh * 0.707).toFixed(2)} kg</div>
          <span className="text-xs text-[#8F2635] font-semibold">Greenhouse reduction</span>
        </div>
      </div>

      {/* Main Hourly Chart */}
      <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2">
              <Sun className="w-5 h-5 text-[#E86A6A]" />
              <span>Diurnal Power Generation Profile (06:00 - 18:00)</span>
            </h2>
            <p className="text-xs text-[#8F2635] mt-1 font-semibold">Interactive diurnal power curve</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-sm font-extrabold shadow-xs cursor-pointer transition-all duration-200"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coralDiurnal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E86A6A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#E86A6A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FBF3EA" vertical={false} />
              <XAxis dataKey="time" stroke="#8F2635" fontSize={12} tickLine={false} />
              <YAxis stroke="#8F2635" fontSize={12} tickLine={false} axisLine={false} unit="W" />
              <Tooltip contentStyle={{ backgroundColor: '#4A3030', borderRadius: '12px', color: '#FFF', fontWeight: 'bold', border: 'none' }} />
              <Area type="monotone" dataKey="power_w" stroke="#E86A6A" strokeWidth={3} fillOpacity={1} fill="url(#coralDiurnal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hour Selector Slider */}
        <div className="mt-6 pt-5 border-t border-[#EED6CC] space-y-2">
          <div className="flex justify-between text-sm font-semibold text-[#4A3030]">
            <span>Select Hour: <strong className="font-extrabold text-[#8F2635]">{activeHour}:00</strong></span>
            <span className="text-[#8F2635] font-bold">{currentItem?.irradiance} W/m² Irradiance</span>
          </div>
          <input 
            type="range" min="6" max="18" step="1" 
            value={activeHour} 
            onChange={(e) => setActiveHour(parseInt(e.target.value))}
            className="w-full accent-[#E86A6A] cursor-pointer h-2 bg-[#F5E6D3] rounded-lg appearance-none"
          />
        </div>
      </div>

    </div>
  );
}
