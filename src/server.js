require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'isaac-ai-team' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`isaac-ai-team demarre sur le port ${PORT}`);
});
