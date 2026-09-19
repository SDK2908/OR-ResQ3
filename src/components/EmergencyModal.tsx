import React, { useState, useEffect } from 'react';
import { EmergencyCaseInput, OperatingRoom } from '../types';
import { PROCEDURE_CATALOG, SURGEONS } from '../data/surgeryData';
import { predictDurationML } from '../utils/mlPredictor';
import { ShieldAlert, Sparkles, Brain, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: EmergencyCaseInput) => void;
  rooms: OperatingRoom[];
  initialOrId?: string;
}

const EMERGENCY_PRESETS = [
  {
    name: 'Emergency Trauma: Perforated Appendicitis',
    procedureType: 'Appendectomy',
    surgeon: 'Dr. Sarah Jenkins',
    surgeonExperience: 9,
    patientComplexity: 4,
    historicalAverage: 55,
    targetOrId: 'OR 1',
    arrivalTime: '10:00',
    desc: 'High complexity acute patient arriving in ER needing immediate room preemption.',
  },
  {
    name: 'Acute Cholecystitis (Biliary Sepsis)',
    procedureType: 'Cholecystectomy',
    surgeon: 'Dr. Elena Rostova',
    surgeonExperience: 11,
    patientComplexity: 4,
    historicalAverage: 80,
    targetOrId: 'OR 2',
    arrivalTime: '10:15',
    desc: 'Severe inflammation, requires urgent laparoscopic access in OR 2.',
  },
  {
    name: 'Severe Spinal Trauma Stabilization',
    procedureType: 'Spinal Fusion',
    surgeon: 'Dr. David Kim',
    surgeonExperience: 14,
    patientComplexity: 5,
    historicalAverage: 195,
    targetOrId: 'OR 3',
    arrivalTime: '11:00',
    desc: 'Complex multi-level spine stabilization following motor accident.',
  },
  {
    name: 'Orthopedic Compound Fracture Fixation',
    procedureType: 'Knee Replacement',
    surgeon: 'Dr. Marcus Vance',
    surgeonExperience: 16,
    patientComplexity: 4,
    historicalAverage: 120,
    targetOrId: 'OR 1',
    arrivalTime: '10:30',
    desc: 'Joint trauma requiring specialized orthopedic instrumentation.',
  },
];

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rooms,
  initialOrId = 'OR 1',
}) => {
  const [patientName, setPatientName] = useState('John Doe (Trauma Inflow)');
  const [procedureType, setProcedureType] = useState('Appendectomy');
  const [surgeon, setSurgeon] = useState('Dr. Sarah Jenkins');
  const [surgeonExperience, setSurgeonExperience] = useState(9);
  const [patientComplexity, setPatientComplexity] = useState(4);
  const [historicalAverage, setHistoricalAverage] = useState(55);
  const [targetOrId, setTargetOrId] = useState(initialOrId);
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [useML, setUseML] = useState(true);

  // Sync initialOrId if passed
  useEffect(() => {
    if (initialOrId) setTargetOrId(initialOrId);
  }, [initialOrId]);

  // Update baseline historical average when procedure changes
  const handleProcedureChange = (procName: string) => {
    setProcedureType(procName);
    const proc = PROCEDURE_CATALOG.find((p) => p.name === procName);
    if (proc) {
      setHistoricalAverage(proc.baseAvg);
    }
  };

  const handleSurgeonChange = (surgeonName: string) => {
    setSurgeon(surgeonName);
    const s = SURGEONS.find((item) => item.name === surgeonName);
    if (s) {
      setSurgeonExperience(s.experience);
    }
  };

  const applyPreset = (preset: typeof EMERGENCY_PRESETS[0]) => {
    setProcedureType(preset.procedureType);
    setSurgeon(preset.surgeon);
    setSurgeonExperience(preset.surgeonExperience);
    setPatientComplexity(preset.patientComplexity);
    setHistoricalAverage(preset.historicalAverage);
    setTargetOrId(preset.targetOrId);
    setArrivalTime(preset.arrivalTime);
    setPatientName(`Trauma Patient (${preset.procedureType})`);
  };

  // Live ML prediction calculation
  const mlPrediction = predictDurationML({
    procedure_type: procedureType,
    surgeon_experience: surgeonExperience,
    patient_complexity: patientComplexity,
    historical_average: historicalAverage,
  });

  const finalEstimatedDuration = useML ? mlPrediction.predicted_duration : historicalAverage;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientName,
      procedureType,
      surgeon,
      surgeonExperience,
      patientComplexity,
      historicalAverage,
      targetOrId,
      arrivalTime,
      useML,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Simulate Emergency Case Interruption
              </h2>
              <p className="text-xs text-slate-400">
                The core OR-ResQ workflow: An urgent surgery arrives, requiring dynamic timetable recovery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Quick Emergency Case Scenarios:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EMERGENCY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="font-semibold text-slate-200 truncate">{preset.name}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="text-cyan-400 font-mono">{preset.targetOrId}</span>
                  <span>•</span>
                  <span>{preset.arrivalTime}</span>
                  <span>•</span>
                  <span className="text-rose-400">Level {preset.patientComplexity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Name */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Patient Identifier / Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Procedure Type */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Emergency Procedure
              </label>
              <select
                value={procedureType}
                onChange={(e) => handleProcedureChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {PROCEDURE_CATALOG.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} (Base avg: {p.baseAvg}m)
                  </option>
                ))}
              </select>
            </div>

            {/* Surgeon */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Assigned Trauma Surgeon
              </label>
              <select
                value={surgeon}
                onChange={(e) => handleSurgeonChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {SURGEONS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.specialty}, {s.experience}y exp)
                  </option>
                ))}
              </select>
            </div>

            {/* Target OR */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Interrupted Operating Room
              </label>
              <select
                value={targetOrId}
                onChange={(e) => setTargetOrId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ANY">Optimal Selection (Minimize Total Disruption)</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrival Time */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Emergency Arrival Time (24h)
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Surgeon Experience Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Surgeon Experience
                </label>
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  {surgeonExperience} years
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={surgeonExperience}
                onChange={(e) => setSurgeonExperience(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Patient Complexity Rating (1-5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Patient Risk / Comorbidity Complexity (1-5)
              </label>
              <span className="text-xs text-slate-400">
                {patientComplexity === 1 && 'Level 1: Routine / Healthy'}
                {patientComplexity === 2 && 'Level 2: Mild Comorbidity'}
                {patientComplexity === 3 && 'Level 3: Moderate Risk'}
                {patientComplexity === 4 && 'Level 4: High Risk Comorbidities'}
                {patientComplexity === 5 && 'Level 5: Critical Multiorgan Risk'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setPatientComplexity(lvl)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    patientComplexity === lvl
                      ? lvl >= 4
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950'
                        : 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Level {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Resilient ML Toggle */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Brain className={`w-5 h-5 ${useML ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Enable ML Procedure Duration Estimation
                </div>
                <div className="text-[11px] text-slate-400">
                  Predicts duration based on surgeon experience & patient risk. If disabled, demonstrates fallback to departmental historical average ({historicalAverage}m).
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseML(!useML)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                useML ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  useML ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-900 border border-cyan-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-cyan-300 font-semibold uppercase tracking-wider block">
                  {useML ? 'ML Duration Prediction' : 'Historical Average Baseline'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {finalEstimatedDuration} min
                  </span>
                  {useML && (
                    <span
                      className={`text-xs font-mono font-semibold ${
                        mlPrediction.baseline_delta && mlPrediction.baseline_delta > 0
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {mlPrediction.baseline_delta && mlPrediction.baseline_delta > 0 ? '+' : ''}
                      {mlPrediction.baseline_delta}m vs dept baseline
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {useML
                    ? 'Context-aware allocation prevents post-emergency schedule overruns.'
                    : 'Uncalibrated baseline used; higher risk of secondary cascading delays.'}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                <span className="text-[10px] text-slate-500 block">Model Confidence</span>
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  {mlPrediction.confidence}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Validated Pipeline
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-rose-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Run Recovery Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
