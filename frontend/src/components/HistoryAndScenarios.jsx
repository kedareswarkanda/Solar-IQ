import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Database, 
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const DEFAULT_HISTORY = [
  {
    _id: "demo-h1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    num_panels: 1,
    irradiance: 850,
    ai_power_w: 382,
    efficiency_percent: 19.4,
    daily_energy_kwh: 3.75,
    co2_avoided_kg: 2.65,
    optimal_tilt: 31
  },
  {
    _id: "demo-h2",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    num_panels: 2,
    irradiance: 920,
    ai_power_w: 815,
    efficiency_percent: 19.8,
    daily_energy_kwh: 7.92,
    co2_avoided_kg: 5.60,
    optimal_tilt: 30
  },
  {
    _id: "demo-h3",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    num_panels: 10,
    irradiance: 950,
    ai_power_w: 4120,
    efficiency_percent: 20.1,
    daily_energy_kwh: 42.10,
    co2_avoided_kg: 29.76,
    optimal_tilt: 32
  }
];

export default function HistoryAndScenarios() {
  const [history, setHistory] = useState(DEFAULT_HISTORY);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/history');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setHistory(res.data);
      }
    } catch (err) {
      console.warn('Using default history:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteItem = async (id) => {
    try {
      await axios.delete(`/api/history/${id}`);
      setHistory(prev => prev.filter(item => item._id !== id && item.id !== id));
      setStatusMsg('Record deleted from database.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error('Failed deleting history item:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all history logs?')) return;
    try {
      await axios.delete('/api/history');
      setHistory([]);
      setStatusMsg('All history logs cleared.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error('Failed clearing history:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#F5E6D3] via-[#FBF3EA] to-[#FFFDFC] text-[#4A3030] rounded-3xl p-6 sm:p-8 border border-[#EED6CC] shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="relative z-10 max-w-5xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBE1E1] text-[#8F2635] text-xs font-bold border border-[#E86A6A]/30">
            <Database className="w-4 h-4 text-[#E86A6A]" />
            <span>MongoDB Zero-Downtime Persistence</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#4A3030] tracking-tight">Analysis Log & Scenario History</h1>
          <p className="text-[#8F2635] text-sm sm:text-base font-semibold leading-relaxed max-w-3xl">
            Maintains permanent telemetry logs of solar predictions, tilt optimizations, array sizes, and environmental impact metrics.
          </p>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-base font-black text-[#4A3030]">Logged Runs: {history.length}</span>
          {statusMsg && (
            <span className="text-xs font-bold text-[#8F2635] bg-[#FBE1E1] border border-[#E86A6A]/30 px-3 py-1 rounded-lg">
              {statusMsg}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchHistory}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#FFFDFC] border border-[#EED6CC] text-[#4A3030] hover:bg-[#FBF3EA] text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-[#8F2635] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#FBE1E1] border border-[#E86A6A]/30 text-[#8F2635] hover:bg-[#E86A6A] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-2xl shadow-xs overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center text-[#8F2635] space-y-3">
            <History className="w-12 h-12 mx-auto text-[#E86A6A]" />
            <h2 className="text-base font-black text-[#4A3030]">No analysis history recorded yet.</h2>
            <p className="text-xs text-[#8F2635] font-semibold">Run an analysis in the Analyzer tab to log results automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5E6D3] text-[#8F2635] text-xs uppercase tracking-wider font-extrabold border-b border-[#EED6CC]">
                  <th className="py-4 px-4">Timestamp</th>
                  <th className="py-4 px-4">Panels</th>
                  <th className="py-4 px-4">Irradiance</th>
                  <th className="py-4 px-4">AI Power</th>
                  <th className="py-4 px-4">Efficiency</th>
                  <th className="py-4 px-4">Daily Yield</th>
                  <th className="py-4 px-4">CO₂ Avoided</th>
                  <th className="py-4 px-4">Optimal Tilt</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EED6CC] text-xs font-medium text-[#4A3030]">
                {(Array.isArray(history) ? history : DEFAULT_HISTORY).map((item, idx) => (
                  <tr key={item._id || item.id || idx} className="hover:bg-[#FBE1E1]/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#8F2635] whitespace-nowrap">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just Now'}</td>
                    <td className="py-3.5 px-4 font-bold text-[#4A3030]">{item.num_panels || 1}</td>
                    <td className="py-3.5 px-4 font-normal">{item.irradiance} W/m²</td>
                    <td className="py-3.5 px-4 font-black text-[#8F2635]">{Math.round(item.ai_power_w || 0)} W</td>
                    <td className="py-3.5 px-4 font-normal">{item.efficiency_percent}%</td>
                    <td className="py-3.5 px-4 font-normal">{item.daily_energy_kwh} kWh</td>
                    <td className="py-3.5 px-4 text-[#8F2635] font-semibold">{item.co2_avoided_kg} kg</td>
                    <td className="py-3.5 px-4 font-black text-[#4A3030]">{item.optimal_tilt}°</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(item._id || item.id)}
                        className="p-2 rounded-lg text-[#8F2635] hover:bg-[#FBE1E1] transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4 text-[#E86A6A]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
