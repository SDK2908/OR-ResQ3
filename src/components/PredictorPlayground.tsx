import React, { useState } from 'react';
import { PROCEDURE_CATALOG } from '../data/surgeryData';
import { predictDurationML } from '../utils/mlPredictor';
import { Sparkles, Play, Code2, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export const PredictorPlayground: React.FC = () => {
  const [procedureType, setProcedureType] = useState('Knee Replacement');
  const [surgeonExperience, setSurgeonExperience] = useState(8);
  const [patientComplexity, setPatientComplexity] = useState(3);
  const [historicalAverage, setHistoricalAverage] = useState(120);
  const [apiLog, setApiLog] = useState<{ request: any; response: any; timestamp: string } | null>(null);

  const handleProcedureSelect = (name: string) => {
    setProcedureType(name);
    const proc = PROCEDURE_CATALOG.find((p) => p.name === name);
    if (proc) {
      setHistoricalAverage(proc.baseAvg);
    }
  };

  const handleRunInference = () => {
    const payload = {
      procedure_type: procedureType,
      surgeon_experience: Number(surgeonExperience),
      patient_complexity: Number(patientComplexity),
      historical_average: Number(historicalAverage),
    };

    const res = predictDurationML(payload);

    setApiLog({
      request: payload,
      response: {
        predicted_duration: res.predicted_duration,
        baseline_delta: res.baseline_delta,
        confidence: res.confidence,
      },
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const livePrediction = predictDurationML({
    procedure_type: procedureType,
    surgeon_experience: Number(surgeonExperience),
    patient_complexity: Number(patientComplexity),
    historical_average: Number(historicalAverage),
  });

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Machine Learning Inference</span>
        </div>
        <h2 className="text-xl font-black text-white mt-1">
          Procedure Duration Prediction Playground
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Directly simulates the <code className="text-cyan-400 font-mono">POST /predict-duration</code> REST endpoint defined in <code className="text-slate-200 font-mono">INTEGRATION_CONTRACT.md</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Controls */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
          <h3 className="font-bold text-sm text-slate-200">Inference Input Features</h3>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              1. Procedure Type
            </label>
            <select
              value={procedureType}
              onChange={(e) => handleProcedureSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {PROCEDURE_CATALOG.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} (Base avg: {p.baseAvg}m)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                2. Surgeon Experience (Years Post-Residency)
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {surgeonExperience} years
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={35}
              value={surgeonExperience}
              onChange={(e) => setSurgeonExperience(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Junior Surgeon (1y)</span>
              <span>Baseline Avg (8y)</span>
              <span>Chief / Senior (35y)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                3. Patient Complexity Score (1 – 5)
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">
                Level {patientComplexity}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPatientComplexity(lvl)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    patientComplexity === lvl
                      ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              4. Departmental Historical Average (Minutes)
            </label>
            <input
              type="number"
              value={historicalAverage}
              onChange={(e) => setHistoricalAverage(Number(e.target.value))}
              min={10}
              max={600}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleRunInference}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition-all hover:scale-[1.01]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Execute REST API Call (/predict-duration)</span>
          </button>
        </div>

        {/* Prediction Results & REST Inspector */}
        <div className="space-y-4">
          {/* Result Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-800/40 space-y-4">
            <span className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider block">
              Live Prediction Output
            </span>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white font-mono">
                {livePrediction.predicted_duration}
              </span>
              <span className="text-xl font-bold text-slate-400">minutes</span>
              {livePrediction.baseline_delta !== undefined && (
                <span
                  className={`text-sm font-mono font-bold px-2 py-1 rounded-md ${
                    livePrediction.baseline_delta > 0
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {livePrediction.baseline_delta > 0 ? '+' : ''}
                  {livePrediction.baseline_delta}m vs baseline
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Model Confidence</span>
                <span className="font-mono text-cyan-300">{livePrediction.confidence}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Algorithm</span>
                <span className="text-slate-200">Random Forest Regressor (120 Trees)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Node.js Integration</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Performance O(1)
                </span>
              </div>
            </div>
          </div>

          {/* JSON Payload Inspector */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-400" />
                POST /predict-duration Contract
              </span>
              {apiLog && <span className="text-[11px] text-emerald-400">200 OK • {apiLog.timestamp}</span>}
            </div>

            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{apiLog
  ? `// Request Payload:
${JSON.stringify(apiLog.request, null, 2)}

// Response JSON (200 OK):
${JSON.stringify(apiLog.response, null, 2)}`
  : `// Ready to send request payload:
${JSON.stringify(
    {
      procedure_type: procedureType,
      surgeon_experience: surgeonExperience,
      patient_complexity: patientComplexity,
      historical_average: historicalAverage,
    },
    null,
    2
  )}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
