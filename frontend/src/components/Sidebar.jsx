import React from 'react';
import { 
  Sun, 
  Zap, 
  Sliders, 
  BarChart3, 
  Clock, 
  History, 
  Info, 
  Activity,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  User
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenProfile }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Real-time telemetry & 4 core KPIs', icon: BarChart3 },
    { id: 'analyzer', label: 'Analyzer', desc: 'Array sizing & condition loss', icon: Sliders },
    { id: 'optimizer', label: 'Optimizer', desc: 'Tilt sweep & servo actuator', icon: Zap },
    { id: 'whatif', label: 'What-If Simulator', desc: 'Dual-scenario comparison', icon: Activity },
    { id: 'studiorealtime', label: 'Live AR & ROI Studio', desc: 'PV ray-tracing, thermal heatmap & ROI', icon: Sparkles, isUnique: true },
    { id: 'performance', label: 'Model AI / Metrics', desc: 'XGBoost metrics & physics', icon: Sun },
    { id: 'daily', label: 'Daily Yield Simulation', desc: 'Diurnal generation profile', icon: Clock },
    { id: 'history', label: 'History & Logs', desc: 'MongoDB analysis logs', icon: History },
    { id: 'about', label: 'About SolarIQ', desc: '3-tier architecture overview', icon: Info },
  ];

  return (
    <aside className="hidden lg:flex w-72 xl:w-80 bg-[#F5E6D3] border-r border-[#EED6CC] shrink-0 lg:min-h-screen lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto p-4 sm:p-5 flex-col justify-between shadow-xs font-sans">
      <div>
        {/* Brand Title Block */}
        <div className="flex items-center space-x-3 pb-4 border-b border-[#EED6CC] mb-4 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-11 h-11 rounded-2xl bg-[#E86A6A] text-white flex items-center justify-center shadow-md font-black shrink-0 hover:scale-105 transition-transform">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-black text-2xl tracking-tight text-[#4A3030] leading-tight">
              Solar<span className="text-[#8F2635]">IQ</span>
            </div>
            <div className="inline-block px-3 py-0.5 rounded-full bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30 text-[11px] font-bold tracking-wider uppercase mt-0.5">
              AI + Physics Core
            </div>
          </div>
        </div>

        {/* TOP SECTION: Profile & Security Button */}
        {onOpenProfile && (
          <div className="mb-4">
            <button
              onClick={onOpenProfile}
              className="w-full bg-[#FFFDFC] hover:bg-[#FBE1E1] border border-[#EED6CC] text-[#4A3030] rounded-2xl py-3 px-4 flex items-center justify-between text-xs font-extrabold transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30 flex items-center justify-center shrink-0 group-hover:bg-[#E86A6A] group-hover:text-white transition-colors">
                  <User className="w-4.5 h-4.5 text-[#E86A6A] group-hover:text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-black text-[#4A3030]">Profile & Security</div>
                  <div className="text-[10px] text-[#8F2635] font-semibold">Account & Password</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8F2635] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Navigation Section Title */}
        <div className="text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-3.5 px-2 flex items-center justify-between">
          <span>Feature Modules</span>
          <span className="text-[10px] bg-[#FBE1E1] text-[#8F2635] font-black px-2.5 py-0.5 rounded-full border border-[#E86A6A]/30">9 Apps</span>
        </div>

        {/* Vertical Rectangular / Pill Navigation List */}
        <div className="space-y-2 flex-1 overflow-x-auto lg:overflow-x-hidden flex lg:flex-col gap-2 pb-2 lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left rounded-2xl px-4 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer shrink-0 relative overflow-hidden group border ${
                  isActive
                    ? 'bg-[#FBE1E1] border-[#E86A6A] text-[#8F2635] shadow-xs border-l-4 border-l-[#E86A6A]'
                    : 'bg-[#FBF3EA] border-[#EED6CC] text-[#4A3030] hover:bg-[#FFFDFC] hover:border-[#E86A6A]/50'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 pr-1">
                  {/* Icon Container */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform shrink-0 group-hover:scale-105 ${
                    isActive 
                      ? 'bg-[#E86A6A] text-white shadow-xs' 
                      : item.isUnique 
                      ? 'bg-[#8F2635] text-white shadow-xs'
                      : 'bg-[#F5E6D3] text-[#8F2635]'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  
                  {/* Typography */}
                  <div className="min-w-0">
                    <div className={`text-[14px] leading-tight truncate flex items-center space-x-1.5 ${isActive ? 'font-black text-[#8F2635]' : 'font-bold text-[#4A3030]'}`}>
                      <span className="truncate">{item.label}</span>
                      {item.isUnique && !isActive && (
                        <span className="bg-[#8F2635] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">STUDIO</span>
                      )}
                    </div>
                    <div className={`text-[11px] font-medium truncate mt-0.5 ${isActive ? 'text-[#8F2635]/80' : 'text-[#4A3030]/65'}`}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-[#8F2635] font-bold' : 'text-[#8F2635]/50'}`} />
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
