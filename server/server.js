const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { query } = require('./db/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Enable CORS for Next.js frontend
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Built-in middleware to parse incoming JSON and urlencoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Study Group & Tutoring Finder API',
    version: '1.0.0',
  });
});

// Health check endpoint - verifies backend status and Neon PostgreSQL connection
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query('SELECT NOW() AS current_time');
    res.status(200).json({
      status: 'ok',
      message: 'Backend server is running and database connection is healthy.',
      database: 'connected',
      timestamp: dbResult.rows[0].current_time,
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Backend server is running, but database connection failed.',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Mount application API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Wildcard 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Database URL configured: ${Boolean(process.env.DATABASE_URL)}`);
});

module.exports = app;
