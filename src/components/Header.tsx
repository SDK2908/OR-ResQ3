import React from 'react';
import { Activity, ShieldAlert, Cpu, RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenEmergency: () => void;
  onOpenPlayground: () => void;
  onOpenMetrics: () => void;
  onResetSchedule: () => void;
  activeTab: 'schedule' | 'comparison' | 'playground' | 'metrics';
  setActiveTab: (tab: 'schedule' | 'comparison' | 'playground' | 'metrics') => void;
  hasActiveRecovery: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEmergency,
  onResetSchedule,
  activeTab,
  setActiveTab,
  hasActiveRecovery,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-950">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">OR-ResQ</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.0 ML Engine
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                R² = 0.963
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dynamic Operating Room Optimization & Emergency Schedule Recovery Engine
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-medium self-start md:self-auto">
          <button
            id="tab-schedule-btn"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'schedule'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Surgical Schedule
          </button>
          {hasActiveRecovery && (
            <button
              id="tab-comparison-btn"
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              Recovery Diff
            </button>
          )}
          <button
            id="tab-playground-btn"
            onClick={() => setActiveTab('playground')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'playground'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            ML Predictor
          </button>
          <button
            id="tab-metrics-btn"
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'metrics'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Model Stats
          </button>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          <button
            id="reset-schedule-btn"
            onClick={onResetSchedule}
            title="Reset to default benchmark schedule"
            className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="trigger-emergency-btn"
            onClick={onOpenEmergency}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-rose-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Simulate Emergency</span>
          </button>
        </div>
      </div>
    </header>
  );
};
