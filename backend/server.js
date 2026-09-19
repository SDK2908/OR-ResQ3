const express = require('express');
const { router: scheduleRoutes } = require('./routes/scheduleRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Standard CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Mount core API endpoints
app.use('/api', scheduleRoutes);

// Root health check / status
app.get('/', (req, res) => {
  res.json({
    name: 'OR-ResQ Backend & Optimization Engine',
    status: 'online',
    persistence: 'in-memory (high-performance)',
    endpoints: [
      'GET  /api/health',
      'GET  /api/demo-data',
      'POST /api/schedule/generate',
      'GET  /api/schedule/current',
      'POST /api/recovery/simulate',
      'POST /api/recovery/apply',
      'POST /api/schedule/reset',
    ],
  });
});

function start() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OR-ResQ Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[OR-ResQ Server] Persistence: In-Memory Active State`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
