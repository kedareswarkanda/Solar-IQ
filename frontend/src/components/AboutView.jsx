import React from 'react';
import { 
  Sun, 
  Layers
} from 'lucide-react';

export default function AboutView() {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#F5E6D3] via-[#FBF3EA] to-[#FFFDFC] text-[#4A3030] rounded-3xl p-6 sm:p-8 border border-[#EED6CC] shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="relative z-10 max-w-5xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBE1E1] text-[#8F2635] text-xs font-bold border border-[#E86A6A]/30">
            <Sun className="w-4 h-4 text-[#E86A6A]" />
            <span>SolarIQ Architecture & Vision</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#4A3030] tracking-tight">System Architecture & Core Philosophy</h1>
          <p className="text-[#8F2635] text-sm sm:text-base font-semibold leading-relaxed max-w-3xl">
            Combining solar photovoltaic physics models, real-time IoT sensor telemetry streams, and XGBoost machine learning to maximize clean energy generation.
          </p>
        </div>
      </div>

      {/* Core Mantra Card */}
      <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl p-8 shadow-xs text-center space-y-4">
        <span className="text-xs font-extrabold text-[#8F2635] uppercase tracking-widest bg-[#FBE1E1] border border-[#E86A6A]/30 px-3.5 py-1 rounded-full inline-block">
          Core Operating Principle
        </span>
        <blockquote className="text-xl sm:text-2xl font-semibold text-[#4A3030] max-w-3xl mx-auto leading-snug italic">
          "Physics tells us what should happen. AI learns what happens in the data. Optimization helps us explore how performance can be improved."
        </blockquote>
      </div>

      {/* 3-Tier Intelligence Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E86A6A] text-white flex items-center justify-center font-black text-base shadow-xs">
            1
          </div>
          <h2 className="text-lg font-black text-[#4A3030]">Physics Baseline Engine</h2>
          <p className="text-xs text-[#8F2635] leading-relaxed font-semibold">
            Calculates deterministic STC solar flux (P = G · A · η), temperature derating coefficients (-0.4%/°C), and geometric solar zenith angles.
          </p>
        </div>

        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E86A6A] text-white flex items-center justify-center font-black text-base shadow-xs">
            2
          </div>
          <h2 className="text-lg font-black text-[#4A3030]">XGBoost ML Regressor</h2>
          <p className="text-xs text-[#8F2635] leading-relaxed font-semibold">
            Learns complex non-linear relationships, dust deposition rates, thermal degradation, and partial micro-shading losses (R² = 0.9880).
          </p>
        </div>

        <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E86A6A] text-white flex items-center justify-center font-black text-base shadow-xs">
            3
          </div>
          <h2 className="text-lg font-black text-[#4A3030]">Parameter Sweep Optimizer</h2>
          <p className="text-xs text-[#8F2635] leading-relaxed font-semibold">
            Sweeps panel tilt angles (0°–80°) and azimuth orientations to identify peak electrical generation and trigger hardware servo actuators.
          </p>
        </div>

      </div>

      {/* Tech Stack Tech Specs */}
      <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-[#4A3030] flex items-center space-x-2">
          <Layers className="w-5 h-5 text-[#E86A6A]" />
          <span>Complete Full-Stack Tech Stack</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
          <div className="p-4 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl space-y-1">
            <span className="text-[#8F2635] font-extrabold block uppercase text-[10px]">Frontend</span>
            <p className="text-[#4A3030] font-black">React + Vite + Tailwind CSS</p>
          </div>
          <div className="p-4 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl space-y-1">
            <span className="text-[#8F2635] font-extrabold block uppercase text-[10px]">Backend API</span>
            <p className="text-[#4A3030] font-black">Python + FastAPI + Uvicorn</p>
          </div>
          <div className="p-4 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl space-y-1">
            <span className="text-[#8F2635] font-extrabold block uppercase text-[10px]">Machine Learning</span>
            <p className="text-[#4A3030] font-black">XGBoost + Scikit-Learn</p>
          </div>
          <div className="p-4 bg-[#FBF3EA] border border-[#EED6CC] rounded-xl space-y-1">
            <span className="text-[#8F2635] font-extrabold block uppercase text-[10px]">Database</span>
            <p className="text-[#4A3030] font-black">MongoDB + JSON Fallback</p>
          </div>
        </div>
      </div>

    </div>
  );
}
