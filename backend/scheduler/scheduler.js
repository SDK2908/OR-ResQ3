/**
 * OR-ResQ Core Scheduling Utilities
 */

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatTimeSpan(start, end) {
  return `${start} – ${end}`;
}

/**
 * Generate a valid non-overlapping schedule from unassigned cases and rooms.
 */
function generateSchedule(cases, operatingRooms) {
  const schedule = [];
  const roomNextAvailable = {};

  operatingRooms.forEach((r) => {
    roomNextAvailable[r.id] = 8 * 60; // 08:00
  });

  // Sort by priority first, then patient complexity
  const priorityWeight = {
    EMERGENCY_CRITICAL: 3,
    URGENT: 2,
    ROUTINE: 1,
  };

  const sortedCases = [...cases].sort((a, b) => {
    const pwA = priorityWeight[a.priority] || 1;
    const pwB = priorityWeight[b.priority] || 1;
    if (pwB !== pwA) return pwB - pwA;
    return (b.patientComplexity || 0) - (a.patientComplexity || 0);
  });

  for (const c of sortedCases) {
    let assignedRoom = c.orId;
    if (!assignedRoom || assignedRoom === 'ANY' || !roomNextAvailable[assignedRoom]) {
      // Find room with earliest available slot
      const roomsSorted = Object.entries(roomNextAvailable).sort((a, b) => a[1] - b[1]);
      assignedRoom = roomsSorted[0][0];
    }

    const startMin = roomNextAvailable[assignedRoom];
    const duration = c.durationMinutes || c.historicalAverage || 60;
    const endMin = startMin + duration;

    // Buffer 15 min turnover time between cases
    roomNextAvailable[assignedRoom] = endMin + 15;

    schedule.push({
      ...c,
      orId: assignedRoom,
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
      durationMinutes: duration,
      status: 'SCHEDULED',
    });
  }

  return schedule;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  formatTimeSpan,
  generateSchedule,
};
