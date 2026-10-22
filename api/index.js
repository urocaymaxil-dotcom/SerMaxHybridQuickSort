// API entry point for Vercel serverless deployment
const express = require('express');
const cors = require('cors');
const path = require('path');
const Engine = require('../algorithms.js');

const app = express();
const PORT = process.env.PORT || 3000; // fallback for local dev

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/sort/trad', (req, res) => {
  const { array, seed } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const result = Engine.runBaselineInstrumented(array, 'trad', seed || 20261001, true);
  res.json(result);
});

app.post('/api/sort/sermax', (req, res) => {
  const { array } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const result = Engine.runSerMaxInstrumented(array, Engine.getFrozenModel(), true);
  res.json(result);
});

app.post('/api/compare', (req, res) => {
  const { array, seed, captureTrace } = req.body;
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const comparison = Engine.compareAllFour(array, seed || 20261001, Boolean(captureTrace));
  res.json(comparison);
});

app.post('/api/visualize/:algo', (req, res) => {
  const { array } = req.body;
  const algo = req.params.algo || 'sermax';
  if (!array || !Array.isArray(array)) return res.status(400).json({ error: 'Invalid array' });
  const snapshots = Engine.getVisualizerSnapshots(array, algo, Engine.getFrozenModel());
  res.json({ snapshots });
});

app.get('/api/model', (req, res) => {
  res.json(Engine.getFrozenModel());
});

app.post('/api/model/train', (req, res) => {
  const { seed, arraysPerCategory, arraySize } = req.body || {};
  const model = Engine.trainPolynomialRegressionModel({
    seed: Number(seed) || 20261001,
    arraysPerCategory: Number(arraysPerCategory) || 14,
    arraySize: Number(arraySize) || 200
  });
  Engine.setFrozenModel(model);
  res.json(model);
});

app.get('/api/verify', (req, res) => {
  res.json(Engine.runVerificationSuite());
});

module.exports = app;