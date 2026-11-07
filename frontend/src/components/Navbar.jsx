import React, { useState } from 'react';
import { 
  Sun, 
  PlayCircle, 
  FileText,
  BarChart3,
  Sliders,
  Zap,
  Activity,
  Clock,
  History,
  Info,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

import WeatherLocationSelector from './WeatherLocationSelector';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onTryDemo, 
  onOpenReport, 
  onSelectCityPreset,
  cityPresets,
  currentLocation,
  liveWeather,
  onLocationAndWeatherChange,
  currentUser,
  onLogout,
  onSwitchToAdmin,
  onOpenProfile
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Real-time telemetry & 4 core KPIs', icon: BarChart3 },
    { id: 'analyzer', label: 'Analyzer', desc: 'Array sizing & condition loss', icon: Sliders },
    { id: 'optimizer', label: 'Optimizer', desc: 'Tilt sweep & servo actuator', icon: Zap },
    { id: 'whatif', label: 'What-If Simulator', desc: 'Dual-scenario comparison', icon: Activity },
    { id: 'studiorealtime', label: 'Live AR & ROI Studio', desc: 'PV ray-tracing & thermal heatmap', icon: Sparkles, isUnique: true },
    { id: 'performance', label: 'Model AI / Metrics', desc: 'XGBoost metrics & physics', icon: Sun },
    { id: 'daily', label: 'Daily Yield Simulation', desc: 'Diurnal generation profile', icon: Clock },
    { id: 'history', label: 'History & Logs', desc: 'MongoDB analysis logs', icon: History },
    { id: 'about', label: 'About SolarIQ', desc: '3-tier architecture overview', icon: Info },
  ];

  const activeItem = navItems.find(i => i.id === activeTab) || navItems[0];

  const handleMobileNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-[#FFFDFC] border-b border-[#EED6CC] sticky top-0 z-40 px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-xs font-sans">
        
        {/* Left Side: Brand Logo + Mobile Hamburger Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-[#FBF3EA] hover:bg-[#F5E6D3] text-[#8F2635] border border-[#EED6CC] lg:hidden cursor-pointer active:scale-95 shrink-0"
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-[#E86A6A] text-white flex items-center justify-center font-black shadow-xs">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#4A3030]">Solar<span className="text-[#8F2635]">IQ</span></span>
          </div>
        </div>


        {/* Right Side: Location Selector + Action CTAs */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          
          {/* Hierarchical Weather & Location Selector */}
          <WeatherLocationSelector
            currentLocation={currentLocation}
            liveWeather={liveWeather}
            onLocationAndWeatherChange={onLocationAndWeatherChange}
            cityPresets={cityPresets}
            onSelectCityPreset={onSelectCityPreset}
          />

          {/* Try Demo CTA */}
          <button
            onClick={onTryDemo}
            className="flex items-center space-x-1 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#FBF3EA] text-[#4A3030] border border-[#EED6CC] hover:bg-[#F5E6D3] transition-all duration-200 text-xs font-bold cursor-pointer active:scale-95 shadow-xs"
            title="Try Demo Settings"
          >
            <PlayCircle className="w-4 h-4 text-[#8F2635] shrink-0" />
            <span className="hidden sm:inline">Try Demo</span>
          </button>

          {/* PDF Report CTA */}
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1 px-2.5 sm:px-4 py-2 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] active:scale-95 text-white shadow-xs transition-all duration-200 text-xs font-extrabold cursor-pointer"
            title="Open Executive PDF Report"
          >
            <FileText className="w-4 h-4 text-white shrink-0" />
            <span className="hidden sm:inline">PDF Report</span>
          </button>

          {/* Admin Switcher Button (If user is Admin) */}
          {currentUser?.role === 'admin' && onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#FBE1E1] hover:bg-[#E86A6A] text-[#8F2635] hover:text-white border border-[#E86A6A]/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Switch to Admin Operations Dashboard"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Admin Panel</span>
            </button>
          )}

          {/* User Profile Avatar & Logout */}
          {currentUser && (
            <div className="flex items-center space-x-1.5 pl-1.5 border-l border-[#EED6CC]">
              <button
                onClick={onOpenProfile}
                className="flex items-center space-x-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                title="User Profile Settings"
              >
                {currentUser.photo ? (
                  <img
                    src={currentUser.photo}
                    alt={currentUser.name || 'User Avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-[#EED6CC] shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#8F2635] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                    {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:flex flex-col items-start leading-tight text-left">
                  <span className="text-xs font-extrabold text-[#4A3030] max-w-[100px] truncate">{currentUser.name || 'SolarIQ User'}</span>
                  <span className="text-[10px] text-[#8F2635] uppercase tracking-wider font-bold">{currentUser.role}</span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 rounded-xl bg-[#FBE1E1] hover:bg-[#E86A6A] text-[#8F2635] hover:text-white border border-[#E86A6A]/30 transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </header>

      {/* Mobile Navigation Drawer Backdrop & Modal Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#4A3030]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Slide-out Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-[#F5E6D3] h-full shadow-2xl flex flex-col justify-between p-5 border-r border-[#EED6CC] z-10 animate-slide-left font-sans">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EED6CC] mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#E86A6A] text-white flex items-center justify-center shadow-xs font-black">
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-xl text-[#4A3030]">Solar<span className="text-[#8F2635]">IQ</span></div>
                    <div className="text-[10px] text-[#8F2635] font-bold uppercase tracking-wider">AI + Physics Core</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-[#8F2635] hover:bg-[#FBE1E1] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile & Security Drawer CTA */}
              {onOpenProfile && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full bg-[#FFFDFC] hover:bg-[#FBE1E1] border border-[#EED6CC] text-[#4A3030] rounded-2xl py-3 px-4 flex items-center justify-between text-xs font-extrabold cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30 flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-[#E86A6A]" />
                      </div>
                      <div className="text-left">
                        <div className="text-[13px] font-black text-[#4A3030]">Profile & Security</div>
                        <div className="text-[10px] text-[#8F2635] font-semibold">Account & Password</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8F2635]" />
                  </button>
                </div>
              )}

              <div className="text-xs font-extrabold text-[#8F2635] uppercase tracking-wider mb-3 px-1 flex items-center justify-between">
                <span>Select Feature Module</span>
                <span className="text-[10px] bg-[#FBE1E1] text-[#8F2635] font-black px-2 py-0.5 rounded-full border border-[#E86A6A]/30">9 Apps</span>
              </div>

              {/* Module Items List */}
              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNavClick(item.id)}
                      className={`w-full text-left rounded-2xl px-3.5 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer border ${
                        isActive
                          ? 'bg-[#FBE1E1] border-[#E86A6A] text-[#8F2635] shadow-xs border-l-4 border-l-[#E86A6A]'
                          : 'bg-[#FBF3EA] border-[#EED6CC] text-[#4A3030]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-[#E86A6A] text-white' : item.isUnique ? 'bg-[#8F2635] text-white' : 'bg-[#F5E6D3] text-[#8F2635]'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm leading-tight truncate ${isActive ? 'font-black text-[#8F2635]' : 'font-bold text-[#4A3030]'}`}>
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#4A3030]/70 truncate mt-0.5 font-medium">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8F2635]' : 'text-[#8F2635]/50'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
