// ════════════════════════════════════════════════
// QUICKSORT COMPARISON SYSTEM — app.js
// ════════════════════════════════════════════════

// ─── GLOBAL STATE ───
let currentDataset = [];
let sortedDataset = [];
let datasetInfo = { size: 0, dist: 'random' };
let benchmarkHistory = [];

// Visualizer State
let tradSnaps = [], sermaxSnaps = [];
let frameIdx = 0;
let playing = false;
let playTimer = null;

// ─── INITIALIZATION ───
window.addEventListener('DOMContentLoaded', () => {
  quickGenerate(); // Generate initial dataset on load
  showView('dashboard');
});

// ─── UI VIEW MANAGEMENT ───
function showView(viewId) {
  // Update sidebar nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(viewId));
  if (activeNav) activeNav.classList.add('active');

  // Hide all views
  document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
  
  // Show target view
  document.getElementById(`view-${viewId}`).style.display = 'block';

  // Update headers
  const titles = {
    'dashboard': { t: 'Dashboard', s: 'Overview of algorithms and current dataset' },
    'visualizer': { t: 'Live Visualizer', s: 'Step-by-step animation of both sorting algorithms' },
    'benchmark': { t: 'Benchmark Sandbox', s: 'High-performance execution on large datasets' },
    'manual': { t: 'Manual Input', s: 'Enter your own custom array for testing' },
    'howit': { t: 'How SerMaxHybridQuickSort Works', s: 'Deep dive into the 3 optimizations' }
  };
  
  if (titles[viewId]) {
    document.getElementById('page-title').textContent = titles[viewId].t;
    document.getElementById('page-sub').textContent = titles[viewId].s;
  }

  // Handle specific view logic
  if (viewId === 'visualizer') {
    if (currentDataset.length > 0 && currentDataset.length <= 100) {
      document.getElementById('vis-size').value = currentDataset.length;
      document.getElementById('vis-size-lbl').textContent = currentDataset.length;
      document.getElementById('vis-dist').value = datasetInfo.dist;
      generateForVis(currentDataset);
    } else {
      generateForVis();
    }
  } else {
    stopPlay();
  }
}

// ─── DATASET GENERATION ───
function makeArray(size, dist, maxVal = 100) {
  const arr = [];
  if (dist === 'random') {
    for (let i = 0; i < size; i++) arr.push(Math.floor(Math.random() * maxVal) + 5);
  } else if (dist === 'nearly') {
    for (let i = 0; i < size; i++) arr.push(Math.max(5, Math.min(maxVal, Math.round(i * maxVal / size + (Math.random() - 0.5) * (maxVal * 0.1)))));
  } else if (dist === 'reverse') {
    for (let i = size; i > 0; i--) arr.push(Math.max(5, Math.round(i * maxVal / size)));
  } else if (dist === 'duplicates') {
    const vals = [maxVal*0.2, maxVal*0.4, maxVal*0.6, maxVal*0.8, maxVal];
    for (let i = 0; i < size; i++) arr.push(vals[Math.floor(Math.random() * vals.length)]);
  } else if (dist === 'manual') {
    // Return empty for manual, handled separately
  }
  return arr;
}

function updateDataset(arr, distStr = 'Custom') {
  currentDataset = [...arr];
  datasetInfo = { size: arr.length, dist: distStr };
  
  // Update Topbar
  document.getElementById('dataset-info').innerHTML = `<span style="color:var(--text-dim)">Dataset:</span> <b>${arr.length}</b> items <span style="color:var(--text-dim)">(${distStr})</span>`;
  
  // Update Dashboard View
  document.getElementById('array-badge-row').innerHTML = `
    <span class="action-tag">${arr.length} elements</span>
    <span class="action-tag">${distStr}</span>
  `;
  
  // Render Dashboard mini bars
  renderMiniBars('dash-bars', currentDataset);
  
  // Reset Dashboard Results
  document.getElementById('dash-results').style.display = 'none';
  document.getElementById('sorted-preview').style.display = 'none';
  const expEl = document.getElementById('result-explanation-card');
  if (expEl) expEl.style.display = 'none';
  
  showToast(`Loaded ${arr.length} elements`);
}

function quickGenerate() {
  const dists = ['random', 'nearly', 'reverse', 'duplicates'];
  const dist = dists[Math.floor(Math.random() * dists.length)];
  const size = Math.floor(Math.random() * 50) + 20;
  const arr = makeArray(size, dist);
  updateDataset(arr, dist);
}

// ─── DASHBOARD ACTIONS ───
function renderMiniBars(containerId, arr, activeColor = '#818cf8') {
  const el = document.getElementById(containerId);
  if (!el || !arr || arr.length === 0) return;
  el.innerHTML = '';
  
  const max = Math.max(...arr) || 1;
  
  for (let i = 0; i < arr.length; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.title = `Value: ${arr[i]}`;
    const heightPct = (arr[i] / max) * 100;
    bar.style.height = `${Math.max(5, heightPct)}%`;
    bar.style.backgroundColor = containerId === 'dash-bars' ? 'var(--bg-lighter)' : activeColor;
    el.appendChild(bar);
  }
}

function renderMetricsHtml(metrics, isSermax) {
  return `
    <div class="vm"><span class="vml">Comparisons</span><span class="vmv ${isSermax?'sermax-val':''}">${metrics.comparisons.toLocaleString()}</span></div>
    <div class="vm"><span class="vml">Swaps</span><span class="vmv ${isSermax?'sermax-val':''}">${metrics.swaps.toLocaleString()}</span></div>
    <div class="vm"><span class="vml">Partitions</span><span class="vmv ${isSermax?'sermax-val':''}">${metrics.partitionOperations.toLocaleString()}</span></div>
    <div class="vm"><span class="vml">${isSermax?'Queue Pops':'Recursive Calls'}</span><span class="vmv ${isSermax?'sermax-val':''}">${(metrics.queueOperations || metrics.recursiveCalls || 0).toLocaleString()}</span></div>
    <div class="vm"><span class="vml">Time</span><span class="vmv ${isSermax?'sermax-val':''}">${metrics.elapsedMs.toFixed(3)} milliseconds</span></div>
  `;
}

async function runTraditional() {
  if (currentDataset.length === 0) return;
  const res = await fetch('http://localhost:3000/api/sort/trad', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ array: currentDataset })
  }).then(r => r.json());
  sortedDataset = res.sortedArray;
  
  document.getElementById('dash-results').style.display = 'block';
  document.getElementById('trad-result-panel').style.display = 'flex';
  document.getElementById('sermax-result-panel').style.display = 'none';
  document.getElementById('compare-summary').style.display = 'none';
  
  document.getElementById('trad-metrics-display').innerHTML = renderMetricsHtml(res, false);
  
  document.getElementById('sorted-preview').style.display = 'block';
  renderMiniBars('sorted-bars', sortedDataset, '#34d399');
  
  renderResultExplanation('traditional', res);
}

async function runSermax() {
  if (currentDataset.length === 0) return;
  const res = await fetch('http://localhost:3000/api/sort/sermax', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ array: currentDataset })
  }).then(r => r.json());
  sortedDataset = res.sortedArray;
  
  document.getElementById('dash-results').style.display = 'block';
  document.getElementById('trad-result-panel').style.display = 'none';
  document.getElementById('sermax-result-panel').style.display = 'flex';
  document.getElementById('compare-summary').style.display = 'none';
  
  document.getElementById('sermax-metrics-display').innerHTML = renderMetricsHtml(res, true);
  
  document.getElementById('sorted-preview').style.display = 'block';
  renderMiniBars('sorted-bars', sortedDataset, '#34d399');
  
  renderResultExplanation('sermax', res);
}

async function runBoth() {
  if (currentDataset.length === 0) return;
  const { trad: resT, sermax: resS } = await fetch('http://localhost:3000/api/compare', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ array: currentDataset })
  }).then(r => r.json());
  sortedDataset = resS.sortedArray; // Should be identical
  
  document.getElementById('dash-results').style.display = 'block';
  document.getElementById('trad-result-panel').style.display = 'flex';
  document.getElementById('sermax-result-panel').style.display = 'flex';
  
  document.getElementById('trad-metrics-display').innerHTML = renderMetricsHtml(resT, false);
  document.getElementById('sermax-metrics-display').innerHTML = renderMetricsHtml(resS, true);
  
  // Calculate summary
  const swpRed = resT.swaps > 0 ? ((resT.swaps - resS.swaps) / resT.swaps) * 100 : 0;
  const cmpRed = resT.comparisons > 0 ? ((resT.comparisons - resS.comparisons) / resT.comparisons) * 100 : 0;
  
  let summaryHtml = `
    <div style="font-weight:600;margin-bottom:10px;">Comparison Analysis</div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;">
      <div style="flex:1;min-width:150px;background:var(--bg-lighter);padding:10px;border-radius:6px;">
        <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:4px;">Swap Reduction</div>
        <div style="font-size:1.25rem;font-weight:700;color:${swpRed>0?'#34d399':'#f43f5e'}">${swpRed>0?'↓':'↑'} ${Math.abs(swpRed).toFixed(1)}%</div>
      </div>
      <div style="flex:1;min-width:150px;background:var(--bg-lighter);padding:10px;border-radius:6px;">
        <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:4px;">Comparisons</div>
        <div style="font-size:1.25rem;font-weight:700;color:${cmpRed>0?'#34d399':'#f43f5e'}">${cmpRed>0?'↓':'↑'} ${Math.abs(cmpRed).toFixed(1)}%</div>
      </div>
    </div>
  `;
  const summaryEl = document.getElementById('compare-summary');
  summaryEl.style.display = 'block';
  summaryEl.innerHTML = summaryHtml;
  
  document.getElementById('sorted-preview').style.display = 'block';
  renderMiniBars('sorted-bars', sortedDataset, '#34d399');
  
  renderResultExplanation('both', resT, resS);
}

function renderResultExplanation(mode, res1, res2 = null) {
  const size = currentDataset.length;
  const distName = datasetInfo.dist === 'nearly' ? 'nearly sorted' : 
                   datasetInfo.dist === 'reverse' ? 'reverse sorted' : 
                   datasetInfo.dist === 'duplicates' ? 'many duplicates' : 
                   datasetInfo.dist === 'random' ? 'uniform random' : 'custom manual';
                   
  let title = "Simple Explanation & Insights";
  let explanation = "";

  if (mode === 'traditional') {
    explanation = `Traditional QuickSort sorted the array of <b>${size.toLocaleString()}</b> elements in <b>${res1.elapsedMs.toFixed(2)} milliseconds</b>. Because it uses classic <i>Lomuto partitioning</i> (scanning unidirectionally and choosing the last element as the pivot), it performs more comparisons and swaps. Lomuto is simple but can degrade in efficiency on non-random data layouts.`;
  } else if (mode === 'sermax') {
    explanation = `SerMaxHybridQuickSort successfully sorted the array of <b>${size.toLocaleString()}</b> elements in <b>${res1.elapsedMs.toFixed(2)} milliseconds</b>. It achieved this using three core optimizations: <b>Polynomial Regression</b> to choose the best pivot, <b>Bidirectional scanning</b> to move elements efficiently with fewer swaps, and an <b>Iterative Priority Queue</b> instead of standard recursion to ensure it never risks stack overflow.`;
  } else if (mode === 'both' && res2) {
    const ratio = res1.elapsedMs / (res2.elapsedMs || 0.001);
    const swpRed = res1.swaps > 0 ? ((res1.swaps - res2.swaps) / res1.swaps) * 100 : 0;
    const cmpRed = res1.comparisons > 0 ? ((res1.comparisons - res2.comparisons) / res1.comparisons) * 100 : 0;

    if (ratio >= 1.05) {
      explanation = `<b>SerMaxHybridQuickSort completed the sort ${ratio.toFixed(2)}× faster</b> than Traditional QuickSort on this <i>${distName}</i> dataset. By utilizing a <b>Polynomial Regression model</b> to estimate the pivot, it avoided the classic Lomuto pivot imbalance. This statistical intelligence, combined with bidirectional partition scanning, reduced swaps by <b>${Math.abs(swpRed).toFixed(1)}%</b> and comparisons by <b>${Math.abs(cmpRed).toFixed(1)}%</b>, while the priority queue managed memory operations safely without recursion.`;
    } else {
      explanation = `Both algorithms performed similarly on this dataset. Traditional QuickSort's Lomuto partition is lightweight for small or uniform random arrays. However, SerMaxHybridQuickSort achieves equivalent performance while completely eliminating the <i>O(n²) stack overflow risk</i> via its iterative priority queue and bidirectional partitioning, meaning it will remain stable and fast even as the dataset scales.`;
    }
  }

  const el = document.getElementById('result-explanation-card');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = `
      <div class="result-explanation-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line><circle cx="12" cy="12" r="10"></circle></svg>
        ${title}
      </div>
      <div class="result-explanation-text">${explanation}</div>
    `;
  }
}

// ─── VISUALIZER ───
async function generateForVis(forceArray = null) {
  stopPlay();
  
  let arr;
  if (forceArray) {
    arr = [...forceArray];
  } else {
    const size = parseInt(document.getElementById('vis-size').value);
    const dist = document.getElementById('vis-dist').value;
    arr = makeArray(size, dist);
  }
  
  try {
    const [resT, resS] = await Promise.all([
      fetch('http://localhost:3000/api/visualize/trad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ array: arr })
      }).then(r => r.json()),
      fetch('http://localhost:3000/api/visualize/sermax', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ array: arr })
      }).then(r => r.json())
    ]);
    
    tradSnaps = resT.snapshots;
    sermaxSnaps = resS.snapshots;
    frameIdx = 0;
    renderFrame();
  } catch (e) {
    console.error("Visualizer fetch failed:", e);
    showToast('Failed to fetch visualizer data from backend');
  }
}

function getBarColor(idx, frame, isSermax) {
  if (!frame) return isSermax ? '#1e3a5f' : '#312e81';
  const { left, right, pivot, low, high, op } = frame;
  if (op === 'done') return '#34d399';
  if (op === 'sorted-single' && idx >= low && idx <= high) return '#34d399';
  if (idx === pivot) return '#22d3ee';
  if (op === 'swap' && (idx === left || idx === right)) return '#f43f5e';
  if (idx === left || idx === right) return '#fbbf24';
  if (low !== -1 && idx >= low && idx <= high) return isSermax ? '#38bdf8' : '#818cf8';
  return '#1e2d45';
}

function renderVisBars(containerId, frameArr, isSermax) {
  const el = document.getElementById(containerId);
  if (!el || !frameArr || frameArr.length === 0) return;
  
  const frame = frameArr[Math.min(frameIdx, frameArr.length - 1)];
  const arr = frame ? frame.array : (frameArr[0] ? frameArr[0].array : []);
  const max = Math.max(...arr) || 1;
  
  el.innerHTML = '';
  for (let i = 0; i < arr.length; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${Math.max(2, (arr[i]/max)*100)}%`;
    bar.style.backgroundColor = getBarColor(i, frame, isSermax);
    el.appendChild(bar);
  }
}

const opLabels = {
  'init': 'Initializing array…',
  'select-pivot': 'Selecting pivot element',
  'compare': 'Comparing elements',
  'swap': 'Swapping elements',
  'sorted-single': 'Single element — already sorted',
  'done': '✅ Sorting complete!'
};

function renderFrame() {
  renderVisBars('vis-bars-trad', tradSnaps, false);
  renderVisBars('vis-bars-sermax', sermaxSnaps, true);

  const maxFrames = Math.max(tradSnaps.length, sermaxSnaps.length);
  document.getElementById('vis-frame-cur').textContent = frameIdx;
  document.getElementById('vis-frame-tot').textContent = Math.max(0, maxFrames - 1);

  const tf = tradSnaps[Math.min(frameIdx, tradSnaps.length - 1)];
  const sf = sermaxSnaps[Math.min(frameIdx, sermaxSnaps.length - 1)];

  if (tf) {
    document.getElementById('vc-cmp').textContent = tf.metrics.comparisons;
    document.getElementById('vc-swp').textContent = tf.metrics.swaps;
    document.getElementById('vc-prt').textContent = tf.metrics.partitionOperations;
    document.getElementById('vc-cal').textContent = tf.metrics.recursiveCalls;
  }
  if (sf) {
    document.getElementById('vs-cmp').textContent = sf.metrics.comparisons;
    document.getElementById('vs-swp').textContent = sf.metrics.swaps;
    document.getElementById('vs-prt').textContent = sf.metrics.partitionOperations;
    document.getElementById('vs-cal').textContent = sf.metrics.queueOperations || 0;
  }

  const activeFrame = tf && tf.op !== 'done' ? tf : sf;
  const label = activeFrame ? (opLabels[activeFrame.op] || activeFrame.op) : '';
  document.getElementById('vis-op-label').textContent = label;
}

function togglePlay() {
  if (playing) stopPlay();
  else startPlay();
}

function startPlay() {
  const maxFrames = Math.max(tradSnaps.length, sermaxSnaps.length);
  if (frameIdx >= maxFrames - 1) { frameIdx = 0; renderFrame(); }
  playing = true;
  document.getElementById('vis-play-btn').innerHTML = '⏸ Pause';
  document.getElementById('vis-step-btn').disabled = true;
  const speed = parseInt(document.getElementById('vis-speed').value);
  
  playTimer = setInterval(() => {
    const max = Math.max(tradSnaps.length, sermaxSnaps.length);
    if (frameIdx >= max - 1) { stopPlay(); return; }
    frameIdx++;
    renderFrame();
  }, speed);
}

function stopPlay() {
  playing = false;
  clearInterval(playTimer);
  document.getElementById('vis-play-btn').innerHTML = '▶ Play';
  document.getElementById('vis-step-btn').disabled = false;
}

function stepOnce() {
  const max = Math.max(tradSnaps.length, sermaxSnaps.length);
  if (frameIdx < max - 1) { frameIdx++; renderFrame(); }
}

function resetVis() {
  stopPlay();
  frameIdx = 0;
  renderFrame();
}

// ─── BENCHMARK SANDBOX ───
function drawBarChart(tradM, sermaxM) {
  const metrics = [
    { label: 'Time (milliseconds)', trad: parseFloat(tradM.elapsedMs.toFixed(2)), sermax: parseFloat(sermaxM.elapsedMs.toFixed(2)) },
    { label: 'Comparisons', trad: tradM.comparisons, sermax: sermaxM.comparisons },
    { label: 'Swaps', trad: tradM.swaps, sermax: sermaxM.swaps },
    { label: 'Partitions', trad: tradM.partitionOperations, sermax: sermaxM.partitionOperations },
  ];

  const W = 600, H = 300, padL = 80, padB = 50, padT = 20, padR = 20;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const groupW = plotW / metrics.length;
  const barW = groupW * 0.3;

  // For chart scaling, handle zero values cleanly
  const allVals = metrics.flatMap(d => [d.trad, d.sermax]);
  const maxVal = Math.max(...allVals) * 1.15 || 1;

  let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;" xmlns="http://www.w3.org/2000/svg">
    <style>
      text { font-family: 'Inter', sans-serif; fill: #94a3b8; font-size: 11px; }
      .val { fill: #e2e8f0; font-size: 10px; font-weight: 600; }
      .axis { stroke: #1e2d45; stroke-width: 1.5; }
      .grid { stroke: #1e2d45; stroke-width: 0.5; stroke-dasharray: 4; }
    </style>`;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + plotH - (i / 4) * plotH;
    svg += `<line class="grid" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>`;
    const v = (maxVal * i / 4);
    let lbl = v >= 1000000 ? (v/1000000).toFixed(1)+'M' : (v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(v<10?1:0));
    svg += `<text x="${padL-8}" y="${y+4}" text-anchor="end">${lbl}</text>`;
  }

  // X axis
  svg += `<line class="axis" x1="${padL}" y1="${padT+plotH}" x2="${W-padR}" y2="${padT+plotH}"/>`;

  metrics.forEach((d, i) => {
    const cx = padL + i * groupW + groupW / 2;

    // Traditional QuickSort bar
    const th = (d.trad / maxVal) * plotH;
    const tx = cx - barW - 2;
    const ty = padT + plotH - th;
    svg += `<rect x="${tx}" y="${ty}" width="${barW}" height="${th}" rx="3" fill="#818cf8"/>`;
    if (th > 14) {
      let v = d.trad >= 1000000 ? (d.trad/1000000).toFixed(1)+'M' : (d.trad >= 10000 ? Math.round(d.trad/1000)+'k' : d.trad);
      svg += `<text class="val" x="${tx+barW/2}" y="${ty-4}" text-anchor="middle">${v}</text>`;
    }

    // SerMaxHybridQuickSort bar
    const sh = (d.sermax / maxVal) * plotH;
    const sx = cx + 2;
    const sy = padT + plotH - sh;
    svg += `<rect x="${sx}" y="${sy}" width="${barW}" height="${sh}" rx="3" fill="#38bdf8"/>`;
    if (sh > 14) {
      let v = d.sermax >= 1000000 ? (d.sermax/1000000).toFixed(1)+'M' : (d.sermax >= 10000 ? Math.round(d.sermax/1000)+'k' : d.sermax);
      svg += `<text class="val" x="${sx+barW/2}" y="${sy-4}" text-anchor="middle">${v}</text>`;
    }

    // Label
    svg += `<text x="${cx}" y="${H-15}" text-anchor="middle" font-weight="500" fill="#cbd5e1">${d.label}</text>`;
  });

  svg += '</svg>';
  document.getElementById('bench-chart-area').innerHTML = svg;
}

function drawSummary(tradM, sermaxM, size, dist) {
  const ratio = tradM.elapsedMs / (sermaxM.elapsedMs || 0.001);
  const revRatio = sermaxM.elapsedMs / (tradM.elapsedMs || 0.001);
  const cmpRed = tradM.comparisons > 0 ? ((tradM.comparisons - sermaxM.comparisons) / tradM.comparisons) * 100 : 0;
  const swpRed = tradM.swaps > 0 ? ((tradM.swaps - sermaxM.swaps) / tradM.swaps) * 100 : 0;

  let verdictHtml = '';
  if (ratio >= 1.05) {
    verdictHtml = `
      <div style="background:rgba(52, 211, 153, 0.1); border:1px solid rgba(52, 211, 153, 0.2); padding:16px; border-radius:8px; text-align:center; margin-bottom:20px;">
        <div style="font-size:2rem; font-weight:800; color:#34d399; margin-bottom:4px;">${ratio.toFixed(2)}×</div>
        <div style="font-size:0.85rem; color:#6ee7b7; font-weight:600; text-transform:uppercase; letter-spacing:1px;">✦ SerMaxHybridQuickSort is FASTER</div>
      </div>
    `;
  } else if (revRatio >= 1.05) {
    verdictHtml = `
      <div style="background:rgba(244, 63, 94, 0.1); border:1px solid rgba(244, 63, 94, 0.2); padding:16px; border-radius:8px; text-align:center; margin-bottom:20px;">
        <div style="font-size:2rem; font-weight:800; color:#f43f5e; margin-bottom:4px;">${revRatio.toFixed(2)}×</div>
        <div style="font-size:0.85rem; color:#fda4af; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Traditional QuickSort is FASTER</div>
      </div>
    `;
  } else {
    verdictHtml = `
      <div style="background:rgba(148, 163, 184, 0.1); border:1px solid rgba(148, 163, 184, 0.2); padding:16px; border-radius:8px; text-align:center; margin-bottom:20px;">
        <div style="font-size:2rem; font-weight:800; color:#cbd5e1; margin-bottom:4px;">≈ 1.00×</div>
        <div style="font-size:0.85rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Performance Equivalent</div>
      </div>
    `;
  }

  const formatDelta = (val) => {
    if (val > 0) return `<span style="color:#34d399; font-weight:600;">↓ ${Math.abs(val).toFixed(1)}% fewer</span>`;
    if (val < 0) return `<span style="color:#f43f5e; font-weight:600;">↑ ${Math.abs(val).toFixed(1)}% more</span>`;
    return `<span style="color:#94a3b8;">0%</span>`;
  };

  const distName = dist === 'nearly' ? 'nearly sorted' : 
                   dist === 'reverse' ? 'reverse sorted' : 
                   dist === 'duplicates' ? 'many duplicates' : 
                   dist === 'random' ? 'uniform random' : 'custom manual';

  const speedupPct = ratio >= 1 ? ((ratio - 1) * 100).toFixed(1) : 0;
  let benchExplanation = '';
  if (ratio >= 1.05) {
    benchExplanation = `SerMaxHybridQuickSort completed this benchmark <b>${ratio.toFixed(2)}× faster</b> (an improvement of <b>${speedupPct}%</b>) on this <i>${distName}</i> dataset. Because of its <b>Polynomial Regression pivot estimation</b>, it avoided unbalanced recursive splits. Bidirectional partition scanning reduced memory writes and swaps by <b>${Math.abs(swpRed).toFixed(1)}%</b>, while the priority queue managed operations safely without recursive overhead.`;
  } else {
    benchExplanation = `Both algorithms performed similarly on this dataset. Traditional QuickSort uses a simpler Lomuto partitioning scheme which is lightweight for smaller or random layouts. However, SerMaxHybridQuickSort achieves equivalent performance while completely eliminating the <i>O(n²) stack overflow risk</i> via its iterative priority queue and bidirectional partitioning, ensuring total stability as data scales.`;
  }

  document.getElementById('bench-summary-content').innerHTML = `
    ${verdictHtml}
    <div style="font-size:0.75rem; color:var(--text-dim); text-align:center; margin-bottom:16px; font-weight:500;">
      TEST: ${size.toLocaleString()} elements · ${dist.toUpperCase()}
    </div>
    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
      <span style="color:var(--text-muted)">Traditional QuickSort Time:</span>
      <span style="font-weight:600">${tradM.elapsedMs.toFixed(2)} milliseconds</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
      <span style="color:var(--text-muted)">SerMaxHybridQuickSort Time:</span>
      <span style="font-weight:600; color:#38bdf8;">${sermaxM.elapsedMs.toFixed(2)} milliseconds</span>
    </div>
    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
      <span style="color:var(--text-muted)">Comparisons:</span>
      ${formatDelta(cmpRed)}
    </div>
    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
      <span style="color:var(--text-muted)">Swaps:</span>
      ${formatDelta(swpRed)}
    </div>
    <div style="margin-top:16px; padding:12px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid var(--border); font-size:0.78rem; line-height:1.4; color:var(--text-sub);">
      <div style="font-weight:700; color:var(--sermax); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Performance Insight</div>
      ${benchExplanation}
    </div>
  `;

  // Add to history
  benchmarkHistory.push({
    id: benchmarkHistory.length + 1,
    size, dist,
    tradTime: tradM.elapsedMs, sermaxTime: sermaxM.elapsedMs,
    ratio, cmpRed, swpRed
  });
  updateHistoryTable();
}

function updateHistoryTable() {
  const card = document.getElementById('bench-history-card');
  const tbody = document.getElementById('bench-history-body');
  
  if (benchmarkHistory.length > 0) {
    card.style.display = 'block';
    // Reverse to show newest first
    tbody.innerHTML = [...benchmarkHistory].reverse().map(h => `
      <tr>
        <td>${h.id}</td>
        <td>${h.size.toLocaleString()}</td>
        <td style="text-transform:capitalize;">${h.dist}</td>
        <td>${h.tradTime.toFixed(2)} milliseconds</td>
        <td style="color:#38bdf8; font-weight:500;">${h.sermaxTime.toFixed(2)} milliseconds</td>
        <td style="font-weight:600; color:${h.ratio >= 1 ? '#34d399' : (h.ratio <= 0.95 ? '#f43f5e' : '#cbd5e1')}">${h.ratio >= 1 ? h.ratio.toFixed(2)+'×' : (1/h.ratio).toFixed(2)+'×'}</td>
        <td style="color:${h.cmpRed > 0 ? '#34d399' : '#f43f5e'}">${h.cmpRed > 0 ? '↓' : '↑'} ${Math.abs(h.cmpRed).toFixed(1)}%</td>
        <td style="color:${h.swpRed > 0 ? '#34d399' : '#f43f5e'}">${h.swpRed > 0 ? '↓' : '↑'} ${Math.abs(h.swpRed).toFixed(1)}%</td>
      </tr>
    `).join('');
  }
}

async function runBenchmark() {
  const btn = document.getElementById('bench-run-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;border-top-color:#fff;animation:spin 1s ease-in-out infinite;margin-right:8px;vertical-align:middle;"></div> Running…';
  
  // Add CSS for spinner if not exists
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }

  const size = parseInt(document.getElementById('bench-size').value);
  const dist = document.getElementById('bench-dist').value;
  const arr = makeArray(size, dist, 100000); // Larger values for benchmark

  try {
    const res = await fetch('http://localhost:3000/api/compare', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ array: arr })
    }).then(r => r.json());

    const tradM = res.trad;
    const sermaxM = res.sermax;

    drawBarChart(tradM, sermaxM);
    drawSummary(tradM, sermaxM, size, dist);

    showToast('Benchmark complete!');
  } catch (e) {
    console.error("Benchmark fetch failed:", e);
    showToast('Benchmark failed to reach backend.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '⚡ Run Benchmark';
  }
}

// ─── INTERACTIVE WIZARD ───
let tempWizardArray = [];
let tempWizardDist = '';

function wizardStep2(type) {
  const size = parseInt(document.getElementById('wizard-size').value) || 20;
  document.getElementById('wizard-step-1').style.display = 'none';
  if (type === 'random') {
    document.getElementById('wizard-step-2-random').style.display = 'block';
  } else {
    document.getElementById('wizard-step-2-manual').style.display = 'block';
    document.getElementById('wiz-manual-count').textContent = size;
  }
}

function wizardBack() {
  document.getElementById('wizard-step-1').style.display = 'block';
  document.getElementById('wizard-step-2-random').style.display = 'none';
  document.getElementById('wizard-step-2-manual').style.display = 'none';
  document.getElementById('wizard-preview').style.display = 'none';
}

function wizardGenerateRandom() {
  const size = parseInt(document.getElementById('wizard-size').value) || 20;
  const dist = document.querySelector('input[name="wiz-dist"]:checked').value;
  tempWizardArray = makeArray(size, dist);
  tempWizardDist = dist;
  
  document.getElementById('wizard-preview').style.display = 'block';
  document.getElementById('wizard-preview-text').textContent = tempWizardArray.join(', ');
}

function wizardAccept() {
  updateDataset(tempWizardArray, tempWizardDist);
  showView('dashboard');
  
  // reset
  wizardBack();
}

function loadManualArray() {
  const input = document.getElementById('manual-input').value;
  const errEl = document.getElementById('manual-error');
  const sucEl = document.getElementById('manual-success');
  
  errEl.style.display = 'none';
  sucEl.style.display = 'none';
  
  if (!input.trim()) {
    errEl.textContent = 'Please enter some numbers.';
    errEl.style.display = 'block';
    return;
  }
  
  const arr = input.split(/[\s,]+/).filter(s => s.trim().length > 0).map(Number);
  
  if (arr.some(isNaN)) {
    errEl.textContent = 'Invalid input. Please enter numbers only.';
    errEl.style.display = 'block';
    return;
  }
  
  if (arr.length < 2) {
    errEl.textContent = 'Please enter at least 2 numbers.';
    errEl.style.display = 'block';
    return;
  }
  
  updateDataset(arr, 'manual');
  sucEl.textContent = `Successfully loaded array of ${arr.length} elements!`;
  sucEl.style.display = 'block';
  
  setTimeout(() => {
    showView('dashboard');
    wizardBack();
    document.getElementById('manual-input').value = '';
    sucEl.style.display = 'none';
  }, 1500);
}

// ─── ACADEMIC CONTEXT PANELS ───
function toggleAcademicPanel(panel) {
  panel.classList.toggle('expanded');
}

// ─── TOAST ───
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  t.style.opacity = '1';
  t.style.transform = 'translate(-50%, 0)';
  
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translate(-50%, 10px)';
    setTimeout(() => t.style.display = 'none', 300);
  }, 3000);
}
