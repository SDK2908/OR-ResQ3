import { EmergencyCaseInput, OperatingRoom, RecoveryPlan, ScheduleChange, SurgeryCase } from '../types';
import { predictDurationML, getHistoricalBaseline } from './mlPredictor';

/**
 * Parses "HH:MM" into total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Formats total minutes from midnight into "HH:MM".
 */
export function minutesToTime(minutes: number): string {
  const total = Math.max(0, minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeSpan(start: string, end: string): string {
  return `${start} – ${end}`;
}

const TURNOVER_BUFFER_MINUTES = 15;

/**
 * OR-ResQ Dynamic Schedule Recovery Engine.
 * Evaluates schedule interruption caused by an incoming emergency procedure,
 * predicts realistic procedure duration via ML, identifies affected slots,
 * and recovers the schedule with minimum disruption to planned surgeries.
 */
export function calculateScheduleRecovery(
  originalSchedule: SurgeryCase[],
  rooms: OperatingRoom[],
  input: EmergencyCaseInput
): RecoveryPlan {
  // 1. Predict emergency duration using ML service (or fallback baseline)
  const prediction = input.useML
    ? predictDurationML({
        procedure_type: input.procedureType,
        surgeon_experience: input.surgeonExperience,
        patient_complexity: input.patientComplexity,
        historical_average: input.historicalAverage,
      })
    : getHistoricalBaseline({
        procedure_type: input.procedureType,
        surgeon_experience: input.surgeonExperience,
        patient_complexity: input.patientComplexity,
        historical_average: input.historicalAverage,
      });

  const emergencyDuration = prediction.predicted_duration;
  const emergencyStartMin = timeToMinutes(input.arrivalTime);
  const emergencyEndMin = emergencyStartMin + emergencyDuration;

  // 2. Select target OR (respecting input or selecting optimal minimum-disruption room)
  let targetOrId = input.targetOrId;
  if (targetOrId === 'ANY' || !rooms.some(r => r.id === targetOrId)) {
    // Find room with fewest affected routine cases or earliest gap
    targetOrId = rooms[0].id;
    let minDisruptionScore = Infinity;

    for (const room of rooms) {
      const casesInRoom = originalSchedule.filter(c => c.orId === room.id);
      const overlappingCases = casesInRoom.filter(c => {
        const start = timeToMinutes(c.startTime);
        const end = timeToMinutes(c.endTime);
        return !(end <= emergencyStartMin || start >= emergencyEndMin);
      });
      const score = overlappingCases.length * 100 + casesInRoom.length;
      if (score < minDisruptionScore) {
        minDisruptionScore = score;
        targetOrId = room.id;
      }
    }
  }

  // 3. Create the Emergency Surgery Case object
  const emergencyCase: SurgeryCase = {
    id: `EMERGENCY-${Date.now().toString().slice(-4)}`,
    patientName: input.patientName || 'Emergency Trauma Patient',
    patientId: `EMG-${Math.floor(1000 + Math.random() * 9000)}`,
    procedureType: input.procedureType,
    surgeon: input.surgeon || 'Dr. Sarah Jenkins (On-Call Trauma)',
    surgeonExperience: input.surgeonExperience,
    patientComplexity: input.patientComplexity,
    historicalAverage: input.historicalAverage,
    durationMinutes: emergencyDuration,
    durationSource: input.useML ? 'ml_model' : 'historical_average',
    orId: targetOrId,
    startTime: input.arrivalTime,
    endTime: minutesToTime(emergencyEndMin),
    priority: 'EMERGENCY_CRITICAL',
    status: 'IN_PROGRESS',
    isEmergency: true,
  };

  const recoveredSchedule: SurgeryCase[] = [];
  const changes: ScheduleChange[] = [];

  // Add the emergency procedure first
  recoveredSchedule.push(emergencyCase);
  changes.push({
    caseId: emergencyCase.id,
    patientName: emergencyCase.patientName,
    procedureType: emergencyCase.procedureType,
    type: 'EMERGENCY_INSERTED',
    originalOr: 'None',
    newOr: targetOrId,
    originalStart: '--:--',
    newStart: emergencyCase.startTime,
    originalEnd: '--:--',
    newEnd: emergencyCase.endTime,
    delayMinutes: 0,
    explanation: `Emergency insertion into ${targetOrId} (${emergencyDuration}m via ${input.useML ? 'ML duration prediction' : 'historical average fallback'}). Priority: CRITICAL.`,
  });

  // Track room free times initialized to end of day or after each surgery
  // In the target room, the room is occupied by emergency until emergencyEndMin + turnover
  let targetRoomCurrentTime = emergencyEndMin + TURNOVER_BUFFER_MINUTES;

  // Let's process each OR
  for (const room of rooms) {
    const isTargetRoom = room.id === targetOrId;
    const roomCases = originalSchedule
      .filter(c => c.orId === room.id)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (!isTargetRoom) {
      // In unaffected rooms, verify if we can reassign a displaced routine case if beneficial,
      // otherwise all original cases remain 100% PRESERVED!
      for (const c of roomCases) {
        recoveredSchedule.push({ ...c });
        changes.push({
          caseId: c.id,
          patientName: c.patientName,
          procedureType: c.procedureType,
          type: 'PRESERVED',
          originalOr: c.orId,
          newOr: c.orId,
          originalStart: c.startTime,
          newStart: c.startTime,
          originalEnd: c.endTime,
          newEnd: c.endTime,
          delayMinutes: 0,
          explanation: `Unaffected room (${room.id}). Operates on original planned timetable with zero disruption.`,
        });
      }
    } else {
      // In the target room where the emergency occurred:
      for (const c of roomCases) {
        const origStartMin = timeToMinutes(c.startTime);
        const origEndMin = timeToMinutes(c.endTime);

        // Case A: Surgery finished before emergency arrived -> PRESERVED
        if (origEndMin <= emergencyStartMin) {
          recoveredSchedule.push({ ...c });
          changes.push({
            caseId: c.id,
            patientName: c.patientName,
            procedureType: c.procedureType,
            type: 'PRESERVED',
            originalOr: c.orId,
            newOr: c.orId,
            originalStart: c.startTime,
            newStart: c.startTime,
            originalEnd: c.endTime,
            newEnd: c.endTime,
            delayMinutes: 0,
            explanation: `Completed prior to emergency arrival at ${input.arrivalTime}. Fully preserved.`,
          });
          continue;
        }

        // Case B: Surgery was scheduled during or after emergency
        // Can this procedure be moved to an alternate room with open availability?
        // E.g., if procedure is a short general surgery like Appendectomy / Hernia / Cholecystectomy
        // and OR 2 or OR 4 has space at end of schedule.
        const canReassign =
          c.priority !== 'URGENT' &&
          (c.procedureType.includes('Appendectomy') ||
            c.procedureType.includes('Hernia') ||
            c.procedureType.includes('Cholecystectomy'));

        // Let's check candidate room OR 2 or OR 4
        let candidateRoom: OperatingRoom | null = null;
        if (canReassign) {
          const altRooms = rooms.filter(r => r.id !== targetOrId);
          for (const alt of altRooms) {
            const altCases = recoveredSchedule.filter(rc => rc.orId === alt.id);
            const latestEndMin = altCases.reduce(
              (max, cur) => Math.max(max, timeToMinutes(cur.endTime)),
              0
            );
            // If alternate room is free around original start time or has early gap
            if (latestEndMin <= origStartMin + 30) {
              candidateRoom = alt;
              break;
            }
          }
        }

        if (candidateRoom) {
          // Reassign to candidate room with minimal delay
          const altCases = recoveredSchedule.filter(rc => rc.orId === candidateRoom.id);
          const latestEndMin = altCases.reduce(
            (max, cur) => Math.max(max, timeToMinutes(cur.endTime)),
            0
          );
          const newStartMin = Math.max(origStartMin, latestEndMin + TURNOVER_BUFFER_MINUTES);
          const newEndMin = newStartMin + c.durationMinutes;
          const delayMin = Math.max(0, newStartMin - origStartMin);

          const reassignedCase: SurgeryCase = {
            ...c,
            orId: candidateRoom.id,
            startTime: minutesToTime(newStartMin),
            endTime: minutesToTime(newEndMin),
          };

          recoveredSchedule.push(reassignedCase);
          changes.push({
            caseId: c.id,
            patientName: c.patientName,
            procedureType: c.procedureType,
            type: 'REASSIGNED_OR',
            originalOr: c.orId,
            newOr: candidateRoom.id,
            originalStart: c.startTime,
            newStart: reassignedCase.startTime,
            originalEnd: c.endTime,
            newEnd: reassignedCase.endTime,
            delayMinutes: delayMin,
            explanation: `Dynamically transferred from ${c.orId} to ${candidateRoom.id} to avert a ${emergencyDuration}m cascading delay.`,
          });
        } else {
          // Keep in target room, delayed after emergency and preceding shifted cases
          const newStartMin = Math.max(origStartMin, targetRoomCurrentTime);
          const newEndMin = newStartMin + c.durationMinutes;
          const delayMin = newStartMin - origStartMin;

          const delayedCase: SurgeryCase = {
            ...c,
            startTime: minutesToTime(newStartMin),
            endTime: minutesToTime(newEndMin),
          };

          recoveredSchedule.push(delayedCase);
          targetRoomCurrentTime = newEndMin + TURNOVER_BUFFER_MINUTES;

          if (delayMin > 0) {
            changes.push({
              caseId: c.id,
              patientName: c.patientName,
              procedureType: c.procedureType,
              type: 'DELAYED',
              originalOr: c.orId,
              newOr: c.orId,
              originalStart: c.startTime,
              newStart: delayedCase.startTime,
              originalEnd: c.endTime,
              newEnd: delayedCase.endTime,
              delayMinutes: delayMin,
              explanation: `Shifted back +${delayMin}m in ${c.orId} to accommodate critical emergency procedure and sanitization turnover.`,
            });
          } else {
            changes.push({
              caseId: c.id,
              patientName: c.patientName,
              procedureType: c.procedureType,
              type: 'PRESERVED',
              originalOr: c.orId,
              newOr: c.orId,
              originalStart: c.startTime,
              newStart: delayedCase.startTime,
              originalEnd: c.endTime,
              newEnd: delayedCase.endTime,
              delayMinutes: 0,
              explanation: `Time slot unaffected by emergency. Operates on schedule.`,
            });
          }
        }
      }
    }
  }

  // Calculate statistics
  const preservedCount = changes.filter(ch => ch.type === 'PRESERVED').length;
  const delayedCount = changes.filter(ch => ch.type === 'DELAYED').length;
  const reassignedCount = changes.filter(ch => ch.type === 'REASSIGNED_OR').length;
  const totalDelayMinutes = changes.reduce((acc, cur) => acc + cur.delayMinutes, 0);

  return {
    id: `REC-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toLocaleTimeString(),
    emergencyCase,
    originalSchedule,
    recoveredSchedule,
    stats: {
      totalProcedures: originalSchedule.length,
      preservedCount,
      delayedCount,
      reassignedCount,
      totalDelayMinutes,
      emergencyDurationMinutes: emergencyDuration,
      durationSource: input.useML ? 'ml_model' : 'historical_average',
    },
    changes,
  };
}
