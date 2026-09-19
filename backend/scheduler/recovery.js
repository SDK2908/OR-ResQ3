/**
 * OR-ResQ Core Dynamic Recovery Engine
 * Implements schedule preemption, minimum disruption preservation,
 * and Before-vs-After change tracking.
 */
const { timeToMinutes, minutesToTime, formatTimeSpan } = require('./scheduler');

function calculateScheduleRecovery(currentSchedule, operatingRooms, emergencyInput) {
  const recoveryId = `REC-${Date.now().toString().slice(-6)}`;
  const emergencyArrivalMin = timeToMinutes(emergencyInput.arrivalTime || '10:00');

  // Choose optimal OR if target is ANY or not provided
  let targetOr = emergencyInput.targetOrId || 'OR-1';
  if (targetOr === 'ANY' || !operatingRooms.some((r) => r.id === targetOr)) {
    // Pick the room with fewest cases after arrival time to minimize disruption
    const roomImpacts = operatingRooms.map((room) => {
      const casesAfter = currentSchedule.filter(
        (c) => c.orId === room.id && timeToMinutes(c.endTime) > emergencyArrivalMin
      );
      return { orId: room.id, count: casesAfter.length };
    });
    roomImpacts.sort((a, b) => a.count - b.count);
    targetOr = roomImpacts[0].orId;
  }

  const durationMin = Number(emergencyInput.durationMinutes) || 60;
  const emergencyEndMin = emergencyArrivalMin + durationMin;

  const emergencyCase = {
    id: `EMG-${Date.now().toString().slice(-4)}`,
    patientId: emergencyInput.patientId || `PT-EMG-${Date.now().toString().slice(-3)}`,
    patientName: emergencyInput.patientName || 'Emergency Trauma Patient',
    procedureType: emergencyInput.procedureType || 'Appendectomy',
    surgeon: emergencyInput.surgeon || 'Dr. Sarah Jenkins',
    surgeonExperience: Number(emergencyInput.surgeonExperience || 9),
    patientComplexity: Number(emergencyInput.patientComplexity || 4),
    historicalAverage: Number(emergencyInput.historicalAverage || 55),
    orId: targetOr,
    startTime: emergencyInput.arrivalTime || '10:00',
    endTime: minutesToTime(emergencyEndMin),
    durationMinutes: durationMin,
    priority: 'EMERGENCY_CRITICAL',
    status: 'IN_PROGRESS',
    isEmergency: true,
  };

  const recoveredSchedule = [];
  const changes = [];

  let delayedCount = 0;
  let reassignedCount = 0;
  let preservedCount = 0;
  let totalDelayMinutes = 0;

  // Insert the emergency case into changes
  changes.push({
    caseId: emergencyCase.id,
    patientName: emergencyCase.patientName,
    procedureType: emergencyCase.procedureType,
    type: 'EMERGENCY_INSERTED',
    originalStart: '--:--',
    originalEnd: '--:--',
    originalOr: '--',
    newStart: emergencyCase.startTime,
    newEnd: emergencyCase.endTime,
    newOr: emergencyCase.orId,
    delayMinutes: 0,
    explanation: `Emergency insertion into ${targetOr}. Required immediate timetable preemption.`,
  });

  // Track room available pointers
  const roomAvailableAt = {};
  operatingRooms.forEach((r) => {
    roomAvailableAt[r.id] = 8 * 60;
  });

  // Set target OR available after the emergency procedure + 15m turnover
  roomAvailableAt[targetOr] = emergencyEndMin + 15;

  // Evaluate existing scheduled procedures
  currentSchedule.forEach((c) => {
    const origStart = timeToMinutes(c.startTime);
    const origEnd = timeToMinutes(c.endTime);

    // Case in a completely different room
    if (c.orId !== targetOr) {
      preservedCount++;
      changes.push({
        caseId: c.id,
        patientName: c.patientName,
        procedureType: c.procedureType,
        type: 'PRESERVED',
        originalStart: c.startTime,
        originalEnd: c.endTime,
        originalOr: c.orId,
        newStart: c.startTime,
        newEnd: c.endTime,
        newOr: c.orId,
        delayMinutes: 0,
        explanation: `Unaffected by emergency in ${targetOr}. Schedule preserved 100%.`,
      });
      recoveredSchedule.push(c);
      return;
    }

    // Case completed before emergency arrives
    if (origEnd <= emergencyArrivalMin) {
      preservedCount++;
      changes.push({
        caseId: c.id,
        patientName: c.patientName,
        procedureType: c.procedureType,
        type: 'PRESERVED',
        originalStart: c.startTime,
        originalEnd: c.endTime,
        originalOr: c.orId,
        newStart: c.startTime,
        newEnd: c.endTime,
        newOr: c.orId,
        delayMinutes: 0,
        explanation: 'Completed prior to emergency arrival. Preserved in planned slot.',
      });
      recoveredSchedule.push(c);
      return;
    }

    // Case collides or is scheduled after the emergency in the same room
    const requiredSlotStart = Math.max(origStart, roomAvailableAt[targetOr]);
    const shiftedEnd = requiredSlotStart + c.durationMinutes;

    // Check if delaying beyond 17:00 (5 PM), consider reassignment if another OR has room
    let finalOr = targetOr;
    let finalStart = requiredSlotStart;
    let finalEnd = shiftedEnd;
    let isReassigned = false;

    if (shiftedEnd > 17 * 60) {
      // Find candidate room
      const alternate = operatingRooms.find((r) => r.id !== targetOr && r.status === 'OPERATIONAL');
      if (alternate) {
        finalOr = alternate.id;
        finalStart = Math.max(origStart, roomAvailableAt[alternate.id] || 12 * 60);
        finalEnd = finalStart + c.durationMinutes;
        roomAvailableAt[alternate.id] = finalEnd + 15;
        isReassigned = true;
        reassignedCount++;
      }
    }

    if (!isReassigned) {
      roomAvailableAt[targetOr] = finalEnd + 15;
    }

    const delay = Math.max(0, finalStart - origStart);
    if (delay > 0) {
      delayedCount++;
      totalDelayMinutes += delay;
    }

    const updatedCase = {
      ...c,
      orId: finalOr,
      startTime: minutesToTime(finalStart),
      endTime: minutesToTime(finalEnd),
      status: isReassigned ? 'RESCHEDULED' : 'DELAYED',
    };
    recoveredSchedule.push(updatedCase);

    changes.push({
      caseId: c.id,
      patientName: c.patientName,
      procedureType: c.procedureType,
      type: isReassigned ? 'REASSIGNED_OR' : delay > 0 ? 'DELAYED' : 'PRESERVED',
      originalStart: c.startTime,
      originalEnd: c.endTime,
      originalOr: c.orId,
      newStart: updatedCase.startTime,
      newEnd: updatedCase.endTime,
      newOr: finalOr,
      delayMinutes: delay,
      explanation: isReassigned
        ? `Reassigned from ${c.orId} to ${finalOr} to prevent exceeding operational hours.`
        : delay > 0
        ? `Shifted by +${delay}m to accommodate emergency case in ${targetOr}.`
        : 'Slot maintained without delay.',
    });
  });

  // Put the emergency case into the recovered schedule
  recoveredSchedule.push(emergencyCase);

  // Sort schedule by room and start time
  recoveredSchedule.sort((a, b) => {
    if (a.orId !== b.orId) return a.orId.localeCompare(b.orId);
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  const stats = {
    totalProcedures: currentSchedule.length + 1,
    preservedCount,
    delayedCount,
    reassignedCount,
    totalDelayMinutes,
    emergencyDurationMinutes: durationMin,
    durationSource: emergencyInput.durationSource || 'ml_model',
  };

  return {
    id: recoveryId,
    timestamp: new Date().toISOString(),
    emergencyCase,
    recoveredSchedule,
    changes,
    stats,
  };
}

module.exports = {
  calculateScheduleRecovery,
};
