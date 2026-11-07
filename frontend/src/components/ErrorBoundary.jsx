import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SolarIQ Uncaught Error Boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF3EA] text-[#4A3030] flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-[#FFFDFC] border border-[#EED6CC] rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#FBE1E1] text-[#8F2635] border border-[#E86A6A]/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-[#E86A6A]" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#4A3030]">Something went wrong</h2>
              <p className="text-xs text-[#8F2635] font-semibold mt-1">
                An unexpected interface error occurred. SolarIQ recovered safely.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-left text-[11px] font-mono overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-[#E86A6A] hover:bg-[#8F2635] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>

              <button
                onClick={() => {
                  this.handleReset();
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FBF3EA] hover:bg-[#F5E6D3] text-[#4A3030] border border-[#EED6CC] font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-[#8F2635]" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
