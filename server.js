const express = require('express');
const cors = require('cors');
const { getTradSnapshots, getSermaxSnapshots, benchmarkTrad, benchmarkSermax } = require('./algorithms.js');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/sort/trad', (req, res) => {
  const { array } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const result = benchmarkTrad(array);
  res.json(result);
});

app.post('/api/sort/sermax', (req, res) => {
  const { array } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const result = benchmarkSermax(array);
  res.json(result);
});

app.post('/api/compare', (req, res) => {
  const { array } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const trad = benchmarkTrad(array);
  const sermax = benchmarkSermax(array);
  res.json({ trad, sermax });
});

app.post('/api/visualize/trad', (req, res) => {
  const { array } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const snapshots = getTradSnapshots(array);
  res.json({ snapshots });
});

app.post('/api/visualize/sermax', (req, res) => {
  const { array } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const snapshots = getSermaxSnapshots(array);
  res.json({ snapshots });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
