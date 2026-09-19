const express = require('express');
const router = express.Router();
const {
  surgeons,
  operatingRooms,
  equipment,
  procedures,
  defaultCases,
} = require('../data/demoData');
const { generateSchedule } = require('../scheduler/scheduler');
const { calculateScheduleRecovery } = require('../scheduler/recovery');
const { predictSurgeryDuration } = require('../services/mlClient');

// Pure in-memory activeState for fast, resilient, zero-database operating room optimization
const activeState = {
  currentSchedule: [...defaultCases],
  operatingRooms: [...operatingRooms],
  procedures: [...procedures],
  equipment: [...equipment],
  surgeons: [...surgeons],
  lastRecoveryPlan: null,
};

/**
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'OR-ResQ Optimization & Recovery Engine',
    persistence: 'in-memory (high-performance)',
    totalScheduledCases: activeState.currentSchedule.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/demo-data
 */
router.get('/demo-data', (req, res) => {
  res.json({
    surgeons: activeState.surgeons,
    operatingRooms: activeState.operatingRooms,
    equipment: activeState.equipment,
    procedures: activeState.procedures,
    defaultCases: activeState.currentSchedule,
  });
});

/**
 * GET /api/schedule/current
 */
router.get('/schedule/current', (req, res) => {
  res.json({
    schedule: activeState.currentSchedule,
    operatingRooms: activeState.operatingRooms,
    procedureCatalog: activeState.procedures,
    totalCases: activeState.currentSchedule.length,
  });
});

/**
 * POST /api/schedule/generate
 */
router.post('/schedule/generate', (req, res) => {
  try {
    const inputCases = req.body.cases || defaultCases;
    const rooms = req.body.operatingRooms || activeState.operatingRooms;

    const generated = generateSchedule(inputCases, rooms);
    activeState.currentSchedule = generated;

    res.json({
      status: 'success',
      scheduleId: `SCHED-${Date.now()}`,
      schedule: generated,
      count: generated.length,
      date: new Date().toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('[generate error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/recovery/simulate
 */
router.post('/recovery/simulate', async (req, res) => {
  try {
    const emergencyInput = req.body || {};

    let predictedDuration = Number(emergencyInput.historicalAverage || 55);
    let durationSource = 'historical_average';

    if (emergencyInput.useML !== false) {
      const mlResult = await predictSurgeryDuration({
        procedure_type: emergencyInput.procedureType || 'Appendectomy',
        surgeon_experience: emergencyInput.surgeonExperience || 9,
        patient_complexity: emergencyInput.patientComplexity || 4,
        historical_average: emergencyInput.historicalAverage || 55,
      });
      predictedDuration = mlResult.predicted_duration;
      durationSource = mlResult.source;
    }

    const plan = calculateScheduleRecovery(
      activeState.currentSchedule,
      activeState.operatingRooms,
      {
        ...emergencyInput,
        durationMinutes: predictedDuration,
        durationSource,
      }
    );

    activeState.lastRecoveryPlan = plan;
    res.json(plan);
  } catch (err) {
    console.error('[simulate recovery error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/recovery/apply
 */
router.post('/recovery/apply', (req, res) => {
  try {
    const planToApply = req.body.plan || activeState.lastRecoveryPlan;

    if (!planToApply || !planToApply.recoveredSchedule) {
      return res.status(400).json({
        error: 'No active recovery plan found to apply. Please run /api/recovery/simulate first.',
      });
    }

    activeState.currentSchedule = planToApply.recoveredSchedule;

    res.json({
      status: 'applied',
      message: 'Recovered schedule successfully applied to operating suites.',
      schedule: activeState.currentSchedule,
      stats: planToApply.stats,
    });
  } catch (err) {
    console.error('[apply recovery error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/schedule/reset
 */
router.post('/schedule/reset', (req, res) => {
  try {
    activeState.currentSchedule = [...defaultCases];
    activeState.lastRecoveryPlan = null;

    res.json({
      status: 'reset',
      message: 'Operating room schedule reset to default benchmark.',
      schedule: activeState.currentSchedule,
    });
  } catch (err) {
    console.error('[reset error]:', err.message);
    res.status(500).json({ error: err.message, schedule: activeState.currentSchedule });
  }
});

module.exports = {
  router,
  activeState,
};
