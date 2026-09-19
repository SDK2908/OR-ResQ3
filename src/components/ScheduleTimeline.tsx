import React, { useState } from 'react';
import { OperatingRoom, SurgeryCase } from '../types';
import { timeToMinutes, formatTimeSpan } from '../utils/recoveryEngine';
import { Clock, User, ShieldAlert, CheckCircle2, ChevronRight, AlertTriangle, Layers } from 'lucide-react';

interface ScheduleTimelineProps {
  rooms: OperatingRoom[];
  schedule: SurgeryCase[];
  onTriggerEmergency: (orId: string) => void;
}

const TIMELINE_START = 8 * 60; // 08:00 (480 mins)
const TIMELINE_END = 17 * 60; // 17:00 (1020 mins)
const TOTAL_DURATION = TIMELINE_END - TIMELINE_START; // 540 mins

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  rooms,
  schedule,
  onTriggerEmergency,
}) => {
  const [selectedCase, setSelectedCase] = useState<SurgeryCase | null>(null);

  // Helper to calculate left % and width % on timeline
  const getBlockStyle = (startTime: string, endTime: string) => {
    const startMin = Math.max(TIMELINE_START, timeToMinutes(startTime));
    const endMin = Math.min(TIMELINE_END, timeToMinutes(endTime));
    const leftPercent = ((startMin - TIMELINE_START) / TOTAL_DURATION) * 100;
    const widthPercent = Math.max(4, ((endMin - startMin) / TOTAL_DURATION) * 100);

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(100 - leftPercent, widthPercent)}%`,
    };
  };

  const getPriorityBadgeClass = (priority: SurgeryCase['priority'], isEmergency?: boolean) => {
    if (isEmergency || priority === 'EMERGENCY_CRITICAL') {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
    if (priority === 'URGENT') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const getCardStyleClass = (c: SurgeryCase) => {
    if (c.isEmergency || c.priority === 'EMERGENCY_CRITICAL') {
      return 'bg-rose-950/80 border-rose-500/60 text-rose-100 hover:bg-rose-900/90 shadow-rose-950/50 shadow-md ring-1 ring-rose-500/40';
    }
    if (c.status === 'COMPLETED') {
      return 'bg-slate-900/70 border-slate-700/50 text-slate-400 hover:bg-slate-800/80';
    }
    if (c.priority === 'URGENT') {
      return 'bg-amber-950/40 border-amber-500/40 text-amber-100 hover:bg-amber-900/50';
    }
    return 'bg-cyan-950/40 border-cyan-700/40 text-cyan-100 hover:bg-cyan-900/50';
  };

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  return (
    <div className="space-y-6">
      {/* Schedule Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Active Operating Room Timetable
          </h2>
          <p className="text-xs text-slate-400">
            Real-time schedule across all 4 surgical suites. Click any surgery for detailed clinical duration factors.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> Completed
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/60 border border-cyan-700/50 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Scheduled Elective
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Urgent
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/60 border border-rose-700/50 text-rose-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Emergency Critical
          </span>
        </div>
      </div>

      {/* Visual Timeline Grid */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Timeline Header (Hours) */}
        <div className="grid grid-cols-[180px_1fr] border-b border-slate-800 bg-slate-900/90 text-xs font-mono text-slate-400">
          <div className="p-3 font-sans font-semibold text-slate-300 border-r border-slate-800">
            Suite / Room
          </div>
          <div className="relative h-10 flex items-center">
            {hours.map((hour, idx) => (
              <div
                key={hour}
                className="absolute flex flex-col items-center -translate-x-1/2"
                style={{ left: `${(idx / (hours.length - 1)) * 100}%` }}
              >
                <span className="text-[11px] font-medium text-slate-400">{String(hour).padStart(2, '0')}:00</span>
                <div className="w-px h-2 bg-slate-700 mt-1"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Room Rows */}
        <div className="divide-y divide-slate-800/60">
          {rooms.map((room) => {
            const roomCases = schedule.filter((c) => c.orId === room.id);

            return (
              <div key={room.id} className="grid grid-cols-[180px_1fr] min-h-[90px] group hover:bg-slate-800/20 transition-colors">
                {/* Room Info Cell */}
                <div className="p-3 border-r border-slate-800 bg-slate-900/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200">{room.id}</span>
                      <button
                        onClick={() => onTriggerEmergency(room.id)}
                        title={`Simulate emergency incoming into ${room.id}`}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 opacity-80 hover:opacity-100 transition-opacity"
                      >
                        + Emergency
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{room.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.specialties.slice(0, 2).map((sp) => (
                      <span key={sp} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Timeline Gantt Track */}
                <div className="relative p-2 overflow-x-auto">
                  {/* Vertical Hour Grid Lines */}
                  {hours.map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 w-px bg-slate-800/50 pointer-events-none"
                      style={{ left: `${(idx / (hours.length - 1)) * 100}%` }}
                    />
                  ))}

                  {/* Surgery Cards */}
                  <div className="relative h-16 w-full">
                    {roomCases.map((c) => {
                      const style = getBlockStyle(c.startTime, c.endTime);

                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCase(c)}
                          style={style}
                          className={`absolute top-1 bottom-1 rounded-lg border p-1.5 cursor-pointer transition-all hover:scale-[1.01] hover:z-20 flex flex-col justify-between overflow-hidden select-none ${getCardStyleClass(c)}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[11px] truncate flex items-center gap-1">
                              {c.isEmergency && (
                                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0 animate-bounce" />
                              )}
                              {c.procedureType}
                            </span>
                            <span className="text-[9px] font-mono shrink-0 px-1 py-0.2 rounded bg-black/40">
                              {c.startTime}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] opacity-85">
                            <span className="truncate">{c.patientName}</span>
                            <span className="font-mono text-[9px]">{c.durationMinutes}m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Surgery Detail Drawer/Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(selectedCase.priority, selectedCase.isEmergency)}`}>
                    {selectedCase.priority}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedCase.patientId}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedCase.procedureType}</h3>
                <p className="text-sm text-slate-400">Patient: {selectedCase.patientName}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">Time & Room</span>
                <p className="text-sm font-semibold text-slate-200">
                  {formatTimeSpan(selectedCase.startTime, selectedCase.endTime)}
                </p>
                <p className="text-cyan-400 font-medium">{selectedCase.orId}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">Allocated Duration</span>
                <p className="text-sm font-semibold text-slate-200 font-mono">
                  {selectedCase.durationMinutes} min
                </p>
                <p className="text-slate-400 text-[11px]">
                  Historical avg: {selectedCase.historicalAverage} min
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">Attending Surgeon</span>
                <p className="text-slate-200 font-semibold">{selectedCase.surgeon}</p>
                <p className="text-slate-400 text-[11px]">{selectedCase.surgeonExperience} years experience</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">Patient Risk Complexity</span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-4 h-2 rounded-sm ${
                        lvl <= selectedCase.patientComplexity
                          ? lvl > 3
                            ? 'bg-rose-500'
                            : 'bg-cyan-500'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-mono text-slate-300 ml-1">
                    Level {selectedCase.patientComplexity}/5
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Dynamic Scheduling Context:</span>
                <p className="mt-0.5">
                  {selectedCase.isEmergency
                    ? 'Emergency procedure inserted dynamically. Schedule recovery engine optimized surrounding cases.'
                    : 'Surgeon experience and patient comorbidities are used by the ML model to predict true procedure duration, averting schedule cascade.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
