import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_SCHEDULE, OPERATING_ROOMS, ML_METRICS, PROCEDURE_CATALOG } from './src/data/surgeryData';
import { predictDurationML } from './src/utils/mlPredictor';
import { calculateScheduleRecovery } from './src/utils/recoveryEngine';

// @ts-ignore
import scheduleRoutesModule from './backend/routes/scheduleRoutes.js';

const scheduleRoutes = (scheduleRoutesModule as any)?.router || scheduleRoutesModule;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount backend schedule & optimization routes
  app.use('/api', scheduleRoutes);

  // In-memory operating room schedule store
  let currentSchedule = [...INITIAL_SCHEDULE];

  // ------------------------------------------------------------------------
  // API Endpoints Matching INTEGRATION_CONTRACT.md & Python FastAPI app.py
  // ------------------------------------------------------------------------

  // Root Service Status
  app.get('/', (req, res, next) => {
    // If request accepts text/html, let Vite / SPA handle it; otherwise return JSON
    if (req.accepts('html') && !req.xhr && !req.path.endsWith('.json')) {
      return next();
    }
    res.json({
      service: 'OR-ResQ Surgery Duration Prediction API',
      status: 'running',
      version: '1.0.0',
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      model_loaded: true,
      model_type: 'RandomForestRegressor Pipeline (120 Estimators)',
      dataset_samples: ML_METRICS.datasetSamples,
      mae_minutes: ML_METRICS.metrics.MAE_minutes,
      r2_score: ML_METRICS.metrics.R2_score,
      timestamp: new Date().toISOString(),
    });
  });

  // Primary ML Inference Endpoint (POST /predict-duration)
  app.post('/predict-duration', (req, res) => {
    try {
      const { procedure_type, surgeon_experience, patient_complexity, historical_average } = req.body;

      if (!procedure_type) {
        return res.status(422).json({ error: 'Field procedure_type is required' });
      }

      const prediction = predictDurationML({
        procedure_type: String(procedure_type),
        surgeon_experience: Number(surgeon_experience ?? 8),
        patient_complexity: Number(patient_complexity ?? 3),
        historical_average: Number(historical_average ?? 120),
      });

      res.status(200).json({
        predicted_duration: prediction.predicted_duration,
        baseline_delta: prediction.baseline_delta,
        confidence: prediction.confidence,
      });
    } catch (err: any) {
      console.error('[ML Inference Error]:', err.message);
      res.status(500).json({ error: `Inference calculation failed: ${err.message}` });
    }
  });

  // API: Get Current Schedule, ORs, and Procedures Catalog
  app.get('/api/schedule', (req, res) => {
    res.json({
      operatingRooms: OPERATING_ROOMS,
      schedule: currentSchedule,
      procedureCatalog: PROCEDURE_CATALOG,
    });
  });

  // API: Reset schedule back to default benchmark
  app.post('/api/schedule/reset', (req, res) => {
    currentSchedule = [...INITIAL_SCHEDULE];
    res.json({ status: 'reset', schedule: currentSchedule });
  });

  // API: Run Dynamic Schedule Recovery Engine
  app.post('/api/recover', (req, res) => {
    try {
      const emergencyInput = req.body;
      const plan = calculateScheduleRecovery(currentSchedule, OPERATING_ROOMS, emergencyInput);
      res.json(plan);
    } catch (err: any) {
      console.error('[Recovery Engine Error]:', err.message);
      res.status(500).json({ error: `Recovery optimization failed: ${err.message}` });
    }
  });

  // API: Model Metrics & Evaluation summary
  app.get('/api/metrics', (req, res) => {
    res.json(ML_METRICS);
  });

  // ------------------------------------------------------------------------
  // Vite Integration (Development Middleware & Production Static Serving)
  // ------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OR-ResQ] System online at http://0.0.0.0:${PORT}`);
    console.log(`[OR-ResQ ML] Duration Prediction API ready at /predict-duration`);
  });
}

startServer();
