require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const aiRoutes = require('./routes/aiRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'], maxAge: 600 }));
app.use('/api/ai/transcribe', express.json({ limit: '4mb' }));
app.use(express.json({ limit: '32kb' }));
app.use('/api/ai', rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api', (req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) return res.status(415).json({ error: 'Send request data as JSON.' });
  next();
});
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  aiConfigured: Boolean(process.env.GEMINI_API_KEY),
}));
app.use('/api/ai', aiRoutes);
app.use('/api/history', historyRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.type === 'entity.too.large' ? 413 : 500);
  if (status >= 500) console.error(`API error: ${error.message}`);
  res.status(status).json({ error: status >= 500 ? (status === 503 ? error.message : 'The request failed. Please try again shortly.') : error.message });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`MindForge API listening on http://localhost:${port}`));
}

module.exports = app;