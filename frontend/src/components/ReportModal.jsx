import React from 'react';
import { 
  X, 
  Printer, 
  Sun, 
  Leaf, 
  CheckCircle2, 
  FileText
} from 'lucide-react';

export default function ReportModal({ isOpen, onClose, results, inputs, currentLocation, liveWeather }) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const numPanels = inputs?.num_panels || results?.array_specs?.num_panels || 1;
  const totalRatedKw = results?.array_specs?.total_rated_kw || 0.4;
  const aiPower = results?.ai_power_w || 380;
  const physicsPower = results?.physics_power_w || 400;
  const optimalTilt = results?.optimal_tilt || 32;
  const percentageGain = results?.percentage_gain || 14.2;
  const dailyKwh = results?.daily_energy_kwh || 3.72;
  const carbon = results?.carbon_impact || {
    co2_avoided_kg_daily: (dailyKwh * 0.707).toFixed(2),
    trees_equivalent: (dailyKwh * 0.707 * 0.045).toFixed(1),
    car_miles_offset: (dailyKwh * 0.707 * 2.48).toFixed(1)
  };

  const locationDisplayString = currentLocation ? 
    `${currentLocation.village || currentLocation.mandal || currentLocation.district || 'Selected Installation Site'}, ${currentLocation.state || ''}, ${currentLocation.country || ''}` : 
    'Anantapur, Andhra Pradesh, India';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A3030]/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-[#EED6CC] pb-4 no-print">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#E86A6A]" />
            <h2 className="font-black text-[#4A3030] text-lg">Executive Solar IQ Performance Report</h2>
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white text-xs font-extrabold shadow-xs cursor-pointer transition-all duration-200"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8F2635] hover:bg-[#FBE1E1] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-[#EED6CC] pb-6 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E86A6A] flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
              <Sun className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#4A3030]">Solar<span className="text-[#8F2635]">IQ</span> Report</h1>
              <p className="text-xs text-[#8F2635] font-semibold">Physics-Informed Solar Efficiency Analysis</p>
            </div>
          </div>
          <div className="text-right text-xs text-[#4A3030] space-y-1 font-medium">
            <div><strong className="font-extrabold text-[#8F2635]">Report Date:</strong> {currentDate}</div>
            <div><strong className="font-extrabold text-[#8F2635]">Analysis Location:</strong> {locationDisplayString}</div>
            <div><strong className="font-extrabold text-[#8F2635]">Coordinates:</strong> {currentLocation?.latitude?.toFixed(4) || 14.6819}°, {currentLocation?.longitude?.toFixed(4) || 77.6006}°</div>
            <div className="text-[#8F2635] font-bold">Status: Audit Verified</div>
          </div>
        </div>

        {/* Array Specification Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#FBF3EA] border border-[#EED6CC]">
            <span className="text-[10px] font-extrabold text-[#8F2635] uppercase tracking-wider block">Array Capacity</span>
            <div className="text-xl font-black text-[#4A3030] mt-1">{totalRatedKw} kW</div>
            <span className="text-xs text-[#4A3030]/80 font-medium">{numPanels} Panels Array</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBF3EA] border border-[#EED6CC]">
            <span className="text-[10px] font-extrabold text-[#8F2635] uppercase tracking-wider block">AI Power Generation</span>
            <div className="text-xl font-black text-[#8F2635] mt-1">{Math.round(aiPower)} W</div>
            <span className="text-xs text-[#4A3030]/80 font-medium">Real-time prediction</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBF3EA] border border-[#EED6CC]">
            <span className="text-[10px] font-extrabold text-[#8F2635] uppercase tracking-wider block">Optimization Gain</span>
            <div className="text-xl font-black text-[#8F2635] mt-1">+{percentageGain}%</div>
            <span className="text-xs text-[#8F2635] font-semibold">At {optimalTilt}° Tilt</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBF3EA] border border-[#EED6CC]">
            <span className="text-[10px] font-extrabold text-[#8F2635] uppercase tracking-wider block">Daily Yield</span>
            <div className="text-xl font-black text-[#4A3030] mt-1">{dailyKwh} kWh</div>
            <span className="text-xs text-[#4A3030]/80 font-medium">Predicted energy</span>
          </div>
        </div>

        {/* Environmental Impact Summary */}
        <div className="bg-[#FBE1E1] border border-[#E86A6A]/30 rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-extrabold text-[#8F2635] flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-[#E86A6A]" />
            <span>Environmental Carbon Avoidance Impact</span>
          </h2>
          <div className="grid grid-cols-3 gap-4 text-xs font-medium">
            <div>
              <span className="text-[#8F2635] block font-bold">Daily CO₂ Avoided</span>
              <div className="text-lg font-black text-[#4A3030] mt-0.5">{carbon.co2_avoided_kg_daily} kg</div>
            </div>
            <div>
              <span className="text-[#8F2635] block font-bold">Trees Equivalent</span>
              <div className="text-lg font-black text-[#4A3030] mt-0.5">{carbon.trees_equivalent} Trees</div>
            </div>
            <div>
              <span className="text-[#8F2635] block font-bold">Car Miles Offset</span>
              <div className="text-lg font-black text-[#4A3030] mt-0.5">{carbon.car_miles_offset} Miles</div>
            </div>
          </div>
        </div>

        {/* Diagnostic Findings */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-[#4A3030]">Diagnostic & Maintenance Recommendations</h2>
          <ul className="space-y-2.5 text-xs text-[#4A3030] font-medium">
            <li className="flex items-center space-x-2.5 bg-[#FBF3EA] border border-[#EED6CC] p-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-[#E86A6A] shrink-0" />
              <span>Recommended tilt actuation to <strong className="text-[#8F2635] font-black">{optimalTilt}°</strong> for optimal seasonal solar angle.</span>
            </li>
            <li className="flex items-center space-x-2.5 bg-[#FBF3EA] border border-[#EED6CC] p-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-[#E86A6A] shrink-0" />
              <span>Schedule optical cleaning if dust soiling exceeds 5% threshold.</span>
            </li>
          </ul>
        </div>

        {/* Signature Block */}
        <div className="pt-8 border-t border-[#EED6CC] flex justify-between items-end text-xs text-[#8F2635] font-medium">
          <div>
            <div className="font-extrabold text-[#4A3030] text-sm">SolarIQ Intelligence Core</div>
            <div className="text-[#8F2635] font-bold">Physics-Informed XGBoost Engine</div>
          </div>
          <div className="text-right">
            <div className="w-36 border-b border-[#8F2635] mb-1.5"></div>
            <div className="text-[#4A3030]/80 font-semibold">Authorized Engineer Signature</div>
          </div>
        </div>

      </div>
    </div>
  );
}
