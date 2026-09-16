require('dotenv').config();
const express = require('express');
const pool = require('./config/db');
const app = express();

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'isaac-ai-team', database: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`isaac-ai-team demarre sur le port ${PORT}`);
});
