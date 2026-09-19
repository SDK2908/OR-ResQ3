import React from 'react';
import { ML_METRICS, PROCEDURE_CATALOG } from '../data/surgeryData';
import { Cpu, CheckCircle2, Award, Zap, Database, BarChart3, Info } from 'lucide-react';

export const MLMetricsCard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> Scikit-Learn Model Pipeline
              </span>
              <span className="text-xs text-slate-400 font-mono">120 Estimators</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Surgery Duration Prediction Microservice
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Evaluated on 1,200 surgical procedure records. Eliminates rigid departmental time averages by factoring in surgeon experience, patient comorbidities, and baseline institutional variances.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 self-start sm:self-auto">
            <Award className="w-8 h-8 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Model Goodness of Fit
              </span>
              <span className="text-xl font-black text-white font-mono">
                R² = {ML_METRICS.metrics.R2_score}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Core Regression Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Mean Absolute Error (MAE)</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
              ±{ML_METRICS.metrics.MAE_minutes} <span className="text-sm font-sans font-normal text-slate-400">min</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              On average, predictions fall within 5.48 minutes of the actual surgery completion.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Root Mean Squared Error (RMSE)</span>
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-blue-400 font-mono mt-1">
              {ML_METRICS.metrics.RMSE_minutes} <span className="text-sm font-sans font-normal text-slate-400">min</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Penalizes timing outliers to prevent severe cascading timetable bottlenecks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Variance Explained (R²)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
              {(ML_METRICS.metrics.R2_score * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              96.3% of the surgical duration variability is accurately accounted for by features.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Engineering & Clinical Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3>Feature Engineering Pipeline</h3>
          </div>
          <p className="text-xs text-slate-400">
            The Scikit-Learn pipeline combines a <code className="text-cyan-300">ColumnTransformer</code> with categorical one-hot encoding and a 120-tree <code className="text-cyan-300">RandomForestRegressor</code>:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="font-semibold text-slate-200">1. Categorical Feature: procedure_type</div>
              <div className="text-slate-400 text-[11px]">
                One-hot encoded with <code className="text-slate-300">handle_unknown='ignore'</code> to prevent crashes on novel procedure codes.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="font-semibold text-slate-200">2. Surgeon Experience (0 – 60 years)</div>
              <div className="text-slate-400 text-[11px]">
                Senior surgeons finish up to 15% faster with lower complication recovery times compared to residents.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="font-semibold text-slate-200">3. Patient Complexity Rating (1 – 5)</div>
              <div className="text-slate-400 text-[11px]">
                Pre-operative risk index based on comorbidities; each level increases procedure duration by ~7%.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="font-semibold text-slate-200">4. Historical Average Baseline</div>
              <div className="text-slate-400 text-[11px]">
                Institutional hospital baseline in minutes, providing reliable department anchoring.
              </div>
            </div>
          </div>
        </div>

        {/* Dataset Breakdown & Disclaimer */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Info className="w-4 h-4 text-amber-400" />
            <h3>Academic Prototype Scope & Safeguards</h3>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <span>⚠️</span> Explicit Non-Clinical Disclaimer
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              OR-ResQ uses synthetic data generated for schedule recovery demonstration and hackathon research.
              It does <strong>NOT</strong> diagnose medical conditions, prioritize patient medical necessity, or override surgeon clinical judgment.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Total Dataset Size</span>
              <span className="font-mono text-slate-200 font-bold">{ML_METRICS.datasetSamples} synthetic procedures</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Training Split (80%)</span>
              <span className="font-mono text-slate-200 font-bold">{ML_METRICS.trainSamples} cases</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Holdout Evaluation (20%)</span>
              <span className="font-mono text-slate-200 font-bold">{ML_METRICS.testSamples} cases</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Random Seed</span>
              <span className="font-mono text-slate-200 font-bold">{ML_METRICS.randomState} (100% reproducible)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Procedure Catalog Benchmarks Table */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">
            Supported Procedure Catalog & Historical Baselines
          </h3>
          <span className="text-xs text-slate-400">{PROCEDURE_CATALOG.length} Procedures Configured</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Procedure Name</th>
                <th className="p-3">Department Specialty</th>
                <th className="p-3">Standard Base Avg</th>
                <th className="p-3">Institutional Range</th>
                <th className="p-3">Emergency Allowed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {PROCEDURE_CATALOG.map((p) => (
                <tr key={p.name} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-slate-200">{p.name}</td>
                  <td className="p-3 text-slate-400">{p.category}</td>
                  <td className="p-3 font-mono text-cyan-400 font-bold">{p.baseAvg} min</td>
                  <td className="p-3 font-mono text-slate-400">
                    {p.minHist} – {p.maxHist} min
                  </td>
                  <td className="p-3">
                    {p.urgencyAllowed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        Elective
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
