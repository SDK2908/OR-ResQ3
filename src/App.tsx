import React, { useState } from 'react';
import { Header } from './components/Header';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { EmergencyModal } from './components/EmergencyModal';
import { RecoveryComparison } from './components/RecoveryComparison';
import { MLMetricsCard } from './components/MLMetricsCard';
import { PredictorPlayground } from './components/PredictorPlayground';
import { INITIAL_SCHEDULE, OPERATING_ROOMS } from './data/surgeryData';
import { EmergencyCaseInput, RecoveryPlan, SurgeryCase } from './types';
import { calculateScheduleRecovery } from './utils/recoveryEngine';
import { ShieldAlert, CheckCircle2, Sparkles, Activity } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'comparison' | 'playground' | 'metrics'>('schedule');
  const [schedule, setSchedule] = useState<SurgeryCase[]>(INITIAL_SCHEDULE);
  const [rooms] = useState(OPERATING_ROOMS);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyTargetOr, setEmergencyTargetOr] = useState('OR 1');
  const [activeRecoveryPlan, setActiveRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEmergency = (orId: string = 'OR 1') => {
    setEmergencyTargetOr(orId);
    setIsEmergencyModalOpen(true);
  };

  const handleRunRecovery = (input: EmergencyCaseInput) => {
    const plan = calculateScheduleRecovery(schedule, rooms, input);
    setActiveRecoveryPlan(plan);
    setIsEmergencyModalOpen(false);
    setActiveTab('comparison');
    showToast(`Emergency evaluated: Recovery plan generated with ${plan.stats.preservedCount} cases preserved!`);
  };

  const handleApplyRecovery = () => {
    if (activeRecoveryPlan) {
      setSchedule(activeRecoveryPlan.recoveredSchedule);
      setActiveRecoveryPlan(null);
      setActiveTab('schedule');
      showToast('Recovered schedule successfully applied to operating suites!');
    }
  };

  const handleDismissRecovery = () => {
    setActiveRecoveryPlan(null);
    setActiveTab('schedule');
  };

  const handleResetSchedule = () => {
    setSchedule([...INITIAL_SCHEDULE]);
    setActiveRecoveryPlan(null);
    setActiveTab('schedule');
    showToast('Operating room schedule reset to benchmark baseline.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenEmergency={() => handleOpenEmergency('OR 1')}
        onOpenPlayground={() => setActiveTab('playground')}
        onOpenMetrics={() => setActiveTab('metrics')}
        onResetSchedule={handleResetSchedule}
        hasActiveRecovery={activeRecoveryPlan !== null}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'schedule' && (
          <ScheduleTimeline
            rooms={rooms}
            schedule={schedule}
            onTriggerEmergency={handleOpenEmergency}
          />
        )}

        {activeTab === 'comparison' && activeRecoveryPlan && (
          <RecoveryComparison
            plan={activeRecoveryPlan}
            rooms={rooms}
            onApply={handleApplyRecovery}
            onDismiss={handleDismissRecovery}
          />
        )}

        {activeTab === 'playground' && <PredictorPlayground />}

        {activeTab === 'metrics' && <MLMetricsCard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OR-ResQ: Dynamic Operating Room Optimization & Recovery Engine</span>
          <span className="font-mono text-[11px] text-slate-400">
            Node.js + React Full-Stack • ML Scikit-Learn Random Forest Pipeline
          </span>
        </div>
      </footer>

      {/* Emergency Simulation Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSubmit={handleRunRecovery}
        rooms={rooms}
        initialOrId={emergencyTargetOr}
      />
    </div>
  );
}

export default App;
