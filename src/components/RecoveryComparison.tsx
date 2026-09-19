import React, { useState } from 'react';
import { OperatingRoom, RecoveryPlan, ScheduleChange } from '../types';
import { formatTimeSpan } from '../utils/recoveryEngine';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Shuffle,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface RecoveryComparisonProps {
  plan: RecoveryPlan;
  rooms: OperatingRoom[];
  onApply: () => void;
  onDismiss: () => void;
}

export const RecoveryComparison: React.FC<RecoveryComparisonProps> = ({
  plan,
  rooms,
  onApply,
  onDismiss,
}) => {
  const [activeView, setActiveView] = useState<'table' | 'cards'>('cards');
  const [filterType, setFilterType] = useState<string>('ALL');

  const { stats, changes, emergencyCase } = plan;

  const filteredChanges = changes.filter((ch) => {
    if (filterType === 'ALL') return true;
    return ch.type === filterType;
  });

  const getChangeBadge = (type: ScheduleChange['type']) => {
    switch (type) {
      case 'EMERGENCY_INSERTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" /> Emergency Inserted
          </span>
        );
      case 'PRESERVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> 100% Preserved
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Delayed
          </span>
        );
      case 'REASSIGNED_OR':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Shuffle className="w-3 h-3" /> Reassigned OR
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Dynamic Recovery Executed */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border border-rose-500/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Emergency Interruption Recovered
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {plan.id}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              {emergencyCase.procedureType} Preemption
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Target: <span className="text-rose-400 font-semibold">{emergencyCase.orId}</span> • Inflow: <span className="font-mono text-white">{emergencyCase.startTime}</span> • ML Estimated Duration: <span className="font-mono text-cyan-400 font-bold">{stats.emergencyDurationMinutes}m</span> ({stats.durationSource === 'ml_model' ? 'ML Random Forest' : 'Historical Fallback'})
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Discard Plan
            </button>
            <button
              onClick={onApply}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Apply Recovered Schedule</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Preserved Unaffected</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {stats.preservedCount}
              </span>
              <span className="text-xs text-slate-400">/ {stats.totalProcedures} cases</span>
            </div>
            <p className="text-[10px] text-emerald-400/80 mt-1">
              {Math.round((stats.preservedCount / stats.totalProcedures) * 100)}% schedule retained
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Delayed Procedures</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {stats.delayedCount}
              </span>
              <span className="text-xs text-slate-400">cases</span>
            </div>
            <p className="text-[10px] text-amber-400/80 mt-1">
              +{stats.totalDelayMinutes}m cumulative shift
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">OR Reassignments</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-purple-400 font-mono">
                {stats.reassignedCount}
              </span>
              <span className="text-xs text-slate-400">cases moved</span>
            </div>
            <p className="text-[10px] text-purple-400/80 mt-1">
              Averted room overruns
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Disruption Philosophy</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-cyan-300">Minimum Disruption</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Non-affected suites untouched
            </p>
          </div>
        </div>
      </div>

      {/* Filter / View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1 text-[11px]">Filter Impact:</span>
          {['ALL', 'PRESERVED', 'DELAYED', 'REASSIGNED_OR', 'EMERGENCY_INSERTED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                filterType === filter
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveView('cards')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeView === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Clinical Impact Cards
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeView === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Before vs After Table
          </button>
        </div>
      </div>

      {/* View 1: Detailed Cards */}
      {activeView === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredChanges.map((change) => {
            const isEmg = change.type === 'EMERGENCY_INSERTED';
            const isPreserved = change.type === 'PRESERVED';
            const isDelayed = change.type === 'DELAYED';
            const isReassigned = change.type === 'REASSIGNED_OR';

            return (
              <div
                key={change.caseId}
                className={`p-4 rounded-xl border transition-all ${
                  isEmg
                    ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/20'
                    : isPreserved
                    ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    : isDelayed
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-purple-950/20 border-purple-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{change.caseId}</span>
                      {getChangeBadge(change.type)}
                    </div>
                    <h4 className="font-bold text-sm text-slate-100 mt-1.5">
                      {change.procedureType}
                    </h4>
                    <p className="text-xs text-slate-400">Patient: {change.patientName}</p>
                  </div>

                  {change.delayMinutes > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      +{change.delayMinutes}m
                    </span>
                  )}
                </div>

                {/* Timeline Comparison Bar */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      Before (Planned)
                    </span>
                    <div className="font-semibold text-slate-300 mt-0.5">
                      {change.originalStart === '--:--' ? (
                        <span className="text-slate-500 italic">Not in schedule</span>
                      ) : (
                        formatTimeSpan(change.originalStart, change.originalEnd)
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{change.originalOr}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/80 border border-cyan-900/50">
                    <span className="text-[10px] text-cyan-400 block uppercase font-semibold">
                      After (Recovered)
                    </span>
                    <div className="font-semibold text-white mt-0.5">
                      {formatTimeSpan(change.newStart, change.newEnd)}
                    </div>
                    <div className="text-[11px] text-cyan-400 font-mono font-medium">
                      {change.newOr}
                    </div>
                  </div>
                </div>

                {/* Clinical Explanation */}
                <p className="text-[11px] text-slate-400 mt-2.5 italic">
                  "{change.explanation}"
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: Detailed Before vs After Table */}
      {activeView === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Case ID</th>
                <th className="p-3">Procedure & Patient</th>
                <th className="p-3">Status / Action</th>
                <th className="p-3">Original Slot</th>
                <th className="p-3">Recovered Slot</th>
                <th className="p-3">Room</th>
                <th className="p-3">Disruption Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredChanges.map((change) => (
                <tr key={change.caseId} className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono text-slate-400">{change.caseId}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-200">{change.procedureType}</div>
                    <div className="text-[11px] text-slate-400">{change.patientName}</div>
                  </td>
                  <td className="p-3">{getChangeBadge(change.type)}</td>
                  <td className="p-3 font-mono text-slate-400">
                    {change.originalStart === '--:--'
                      ? '—'
                      : `${change.originalStart} – ${change.originalEnd}`}
                  </td>
                  <td className="p-3 font-mono text-cyan-300 font-semibold">
                    {change.newStart} – {change.newEnd}
                  </td>
                  <td className="p-3 font-mono">
                    {change.originalOr === change.newOr ? (
                      <span className="text-slate-300">{change.newOr}</span>
                    ) : (
                      <span className="text-purple-400 font-bold">
                        {change.originalOr} → {change.newOr}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">
                    {change.delayMinutes > 0 ? (
                      <span className="text-amber-400 font-bold">+{change.delayMinutes}m</span>
                    ) : (
                      <span className="text-emerald-400">0m</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
