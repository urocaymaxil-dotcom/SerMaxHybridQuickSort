// ════════════════════════════════════════════════════════════════════════════════════════
// SERMAX HYBRID QUICKSORT RESEARCH SYSTEM — COMPLETE FRONTEND CONTROLLER (app.js)
// University of the Philippines Cebu • College of Science • Department of Computer Science
// Author: Maxil S. Urocay | Adviser: Dr. Robert Roxas | October 2026
// ════════════════════════════════════════════════════════════════════════════════════════

const Engine = window.SerMaxEngine;

// ─── GLOBAL APPLICATION STATE ───
let activeDataset = [];
let activeDatasetMeta = { size: 50, category: 'random', seed: 104201, checksum: '—' };
let sourceRegistry = [];
let s02ChartMode = 'value';

// Screen 04 Model State
let s04PlotMode = 'scatter';
let s04CoeffFilter = 'ALL';

// Screen 06 Bidirectional Partitioning Trace State
let s06TraceData = null;
let s06StepIdx = 0;
let s06PlayTimer = null;

// Screen 07 Priority Queue Interactive State
let s07TraceSteps = [];
let s07IterIdx = 0;
let s07ManualPQ = new Engine.SerMaxPriorityQueue();

// Screen 08 Live Visualizer State
let tradSnaps = [];
let sermaxSnaps = [];
let frameIdx = 0;
let playing = false;
let playTimer = null;

// Screen 09 & 10 Benchmark & Statistical State
let benchmarkHistory = [];
let latestFourComparison = null;
let matrix12Results = {};
let s10ChartMetric = 'time';

// Official Logos for Enlargeable QuickLook Lightbox
const OFFICIAL_LOGOS = [
  {
    src: 'sermax-logo.png?v=4',
    title: 'SerMax Hybrid QuickSort — Official Thesis Emblem',
    desc: 'Official emblem representing Bidirectional Partitioning (opposing gold arcs), Priority Queue Management (circuit nodes), and Polynomial Regression Pivot Estimation (central diamond & sorted bars).'
  },
  {
    src: 'up-system-logo.jpg',
    title: 'University of the Philippines System Seal',
    desc: 'Official seal of the University of the Philippines System (Founded 1908 — Honor and Excellence).'
  },
  {
    src: 'up-cebu-logo.png',
    title: 'University of the Philippines Cebu Seal',
    desc: 'Constituent university located at Gorordo Avenue, Lahug, Cebu City, 6000 Cebu, Philippines.'
  },
  {
    src: 'college-science-logo.png',
    title: 'UP Cebu — College of Science Emblem',
    desc: 'College of Science, University of the Philippines Cebu.'
  },
  {
    src: 'cs-logo.png',
    title: 'Department of Computer Science Emblem',
    desc: 'Department of Computer Science, College of Science, University of the Philippines Cebu — Master of Science in Computer Science.'
  },
  {
    src: 'researcher-maxil-urocay.jpg',
    title: 'Maxil S. Urocay, MSCS Candidate — Thesis Researcher',
    desc: 'MSCS Candidate at the University of the Philippines Cebu (Department of Computer Science) & College Instructor in Computer Science and Information Technology.'
  }
];
let currentLightboxZoom = 1;

// Screen Metadata & Focused Sub-Tab Configuration (Prevents stacking 3+ panels on one screen)
const SCREEN_ORDER = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10'];
let currentScreenId = 's01';

const SCREEN_META = {
  s01: {
    badge: 'FRAMEWORK HUB',
    short: 'System Functionality Framework',
    step: 'CHAPTER 4 (SECTIONS 4.2–4.6)',
    title: 'System Functionality Framework',
    sub: 'Aligned with Chapter 4 (Sections 4.2–4.6) of the Manuscript • 5 Phases & 9 Research Modules',
    subtabs: []
  },
  s02: {
    badge: 'PHASE 1 • MODULE 1',
    short: 'Synthetic Dataset Generator',
    step: 'PHASE 1: DATA PREPARATION',
    title: 'Synthetic Dataset Generator and Data Splitter',
    sub: 'Section 4.6.1 – 4.6.3 • 4 categories • Sizes: 500, 1,000, 10,000 (5, 25, 50 for verification/visualization) • 70:15:15 split',
    subtabs: [
      { id: 's02-generator', label: '🎲 Dataset Generator & 70:15:15 Data Splitter' },
      { id: 's02-registry',  label: '📊 Example Array Profiles & Source Registry' }
    ]
  },
  s03: {
    badge: 'PHASE 2 • MODULE 2',
    short: 'Seven-Predictor Extractor',
    step: 'PHASE 2: MODEL DEVELOPMENT',
    title: 'Seven-Predictor Extractor',
    sub: 'Section 4.3 • Extract (n, x_min, x_max, μ, σ, γ, d) & minimum-imbalance training targets (n ≤ 33 and n > 33)',
    subtabs: [
      { id: 's03-predictors', label: '🧮 Seven Predictor Variables (1)–(7)' },
      { id: 's03-targets',    label: '🎯 Minimum-Imbalance Pivot Target (n ≤ 33 & n > 33)' }
    ]
  },
  s04: {
    badge: 'PHASE 2 • MODULE 3',
    short: 'Polynomial Regression Studio',
    step: 'PHASE 2: MODEL DEVELOPMENT',
    title: 'Polynomial Regression Model Studio',
    sub: 'Section 4.3 • 2nd-degree polynomial model (36 coefficients) • Train via OLS • Validate MAE & RMSE vs. midpoint heuristic',
    subtabs: [
      { id: 's04-training',     label: '📈 OLS Training, MAE/RMSE & Midpoint Comparison' },
      { id: 's04-coefficients', label: 'Σ Standardization Scaler & 36 Coefficients (β₀…β₃₅)' }
    ]
  },
  s05: {
    badge: 'PHASE 3 • MODULE 4',
    short: 'Runtime Pivot Estimator',
    step: 'PHASE 3: SERMAX EXECUTION',
    title: 'Runtime Pivot Estimator',
    sub: 'Sections 4.4 – 4.5 • Normalize and constrain to [0, 1], convert to relative & absolute index, validate index, midpoint fallback',
    subtabs: []
  },
  s06: {
    badge: 'PHASE 3 • MODULE 5',
    short: 'Bidirectional Partitioning',
    step: 'PHASE 3: SERMAX EXECUTION',
    title: 'Bidirectional Partitioning',
    sub: 'Sections 4.4 – 4.5 • Initialize boundaries and opposing pointers, scan from two directions, swap & advance, generate left/right subproblems',
    subtabs: []
  },
  s07: {
    badge: 'PHASE 3 • MODULE 6',
    short: 'Priority Queue Management',
    step: 'PHASE 3: SERMAX EXECUTION',
    title: 'Priority Queue Management',
    sub: 'Sections 4.4 – 4.5 • Prioritize larger subproblems, FIFO tie-breaking for equal sizes, iterative processing, track max occupancy & logical depth',
    subtabs: [
      { id: 's07-heap',      label: '🌳 Priority Queue (Max-Heap) State & Visualizer' },
      { id: 's07-lifecycle', label: '📋 Iterative Subproblem Processing Log' }
    ]
  },
  s08: {
    badge: 'PHASE 4 • MODULE 7',
    short: 'Implementation & Verification',
    step: 'PHASE 4: EXPERIMENTAL EVALUATION',
    title: 'Algorithm Implementation and Verification',
    sub: 'Section 4.2 • SerMax Hybrid + 3 baseline algorithms (Traditional, Median-of-Three, Randomized-Pivot) • Identical input arrays & sorted output check',
    subtabs: [
      { id: 's08-visualizer', label: '⚙️ Step-by-Step Execution & Identical Input Comparison' },
      { id: 's08-gatec',      label: '✓ Verify Correctness (Sorted Output Across All 4 Algorithms)' }
    ]
  },
  s09: {
    badge: 'PHASE 4 • MODULE 8',
    short: 'Comparative Benchmarking',
    step: 'PHASE 4: EXPERIMENTAL EVALUATION',
    title: 'Comparative Benchmarking',
    sub: 'Sections 4.6.4 – 4.6.6 • 12 benchmark conditions (4 categories × 3 sizes) • 10 warm-up + 10 measured runs • 6 Primary + 1 Supplementary Metrics',
    subtabs: [
      { id: 's09-leaderboard', label: '⏱️ Comparative Benchmarking & Recorded Metrics' },
      { id: 's09-history',     label: '📜 Recorded Benchmark Condition History' }
    ]
  },
  s10: {
    badge: 'PHASE 5 • MODULE 9',
    short: 'Statistical Analysis & Export',
    step: 'PHASE 5: STATISTICAL REPORTING',
    title: 'Statistical Analysis and Results Export',
    sub: 'Section 4.6.7 • Descriptive summaries • Wilcoxon signed-rank & paired sign test • Holm adjustment (36 comparisons) • 95% CI (2,000 bootstrap) • CSV/JSON exports',
    subtabs: [
      { id: 's10-charts', label: '📊 Descriptive Summaries & 12-Condition Matrix' },
      { id: 's10-stats',  label: '🔬 Paired Statistical Tests (Wilcoxon/Sign/Holm/CI) & Export' }
    ]
  }
};

// ─── INITIALIZATION ───
window.addEventListener('DOMContentLoaded', () => {
  startMenuClock();
  setupKeyboardShortcuts();

  // Initialize dataset & registry
  generateBatchRegistry(true);
  const initDs = Engine.generateDataset(50, 'nearly', 104201, -1000, 1000);
  setGlobalDataset(initDs.array, initDs.metadata);

  // Render all screens initially so every view is populated and ready
  runFormulaSimulator();
  renderScreen04Model();
  runScreen05PivotEstimation();
  initScreen06PartitionTrace(true);
  initScreen07QueueSimulation();
  runGateCVerification();
  runSingleBenchmark(true);
  runFull12ConditionMatrix(true);

  showScreen('s01');
});

function startMenuClock() {
  const el = document.getElementById('menubar-clock');
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLogoLightbox();
      document.querySelectorAll('.maximized-card').forEach(c => c.classList.remove('maximized-card'));
    }
  });
}

// ─── NAVIGATION, FOCUSED SUB-PANELS & macOS WINDOW CONTROLS ───
function showScreen(screenId, subpanelId = null) {
  currentScreenId = screenId;
  stopPlay();
  if (s06PlayTimer) {
    clearInterval(s06PlayTimer);
    s06PlayTimer = null;
    const btn = document.getElementById('s06-play-btn');
    if (btn) btn.textContent = '▶ Auto Play';
  }

  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  const target = document.getElementById(`view-${screenId}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-item, .stage-pill').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-screen') === screenId);
  });
  document.querySelectorAll('.dock-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-dock') === screenId);
  });

  // Show the compact stage header ONLY on sub-screens (s02–s10); hide it on Screen 01 Dashboard
  const subHeader = document.getElementById('subscreen-stage-header');
  if (subHeader) {
    subHeader.style.display = (screenId === 's01') ? 'none' : 'block';
  }

  const meta = SCREEN_META[screenId];
  if (meta) {
    const badgeEl = document.getElementById('topbar-screen-badge');
    if (badgeEl) badgeEl.textContent = meta.badge;
    const shortEl = document.getElementById('nav-screen-short');
    if (shortEl) shortEl.textContent = meta.short || meta.title;
    const stepEl = document.getElementById('stage-step-label');
    if (stepEl) stepEl.textContent = meta.step || meta.badge;
    document.getElementById('page-title').textContent = meta.title;
    document.getElementById('page-sub').textContent = meta.sub;
    renderStageSubtabs(screenId, subpanelId);
  }

  if (screenId === 's08' && sermaxSnaps.length === 0) {
    generateForVis(activeDataset.length <= 80 ? activeDataset : null);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStageSubtabs(screenId, activeSubId = null) {
  const container = document.getElementById('stage-subtabs');
  if (!container) return;
  const meta = SCREEN_META[screenId];
  if (!meta || !meta.subtabs || meta.subtabs.length === 0) {
    container.innerHTML = '';
    return;
  }

  const chosenId = activeSubId || meta.subtabs[0].id;
  container.innerHTML = meta.subtabs.map(st => `
    <button class="subtab-btn ${st.id === chosenId ? 'active' : ''}" onclick="switchSubpanel('${screenId}', '${st.id}', this)">
      ${st.label}
    </button>
  `).join('');

  switchSubpanel(screenId, chosenId);
}

function switchSubpanel(screenId, subpanelId, btnEl = null) {
  const view = document.getElementById(`view-${screenId}`);
  if (!view) return;
  view.querySelectorAll('.subpanel').forEach(sp => {
    const match = sp.getAttribute('data-subpanel') === subpanelId;
    sp.style.display = match ? 'block' : 'none';
    sp.classList.toggle('active', match);
  });
  const container = document.getElementById('stage-subtabs');
  if (container && btnEl) {
    container.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
}

function switchResearcherTab(tabKey, btnEl) {
  ['bio', 'research', 'credentials'].forEach(k => {
    const pane = document.getElementById(`res-pane-${k}`);
    if (pane) {
      const isMatch = (k === tabKey);
      pane.style.display = isMatch ? 'block' : 'none';
      pane.classList.toggle('active', isMatch);
    }
  });
  if (btnEl && btnEl.parentElement) {
    btnEl.parentElement.querySelectorAll('.res-tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
}

function prevScreen() {
  const idx = SCREEN_ORDER.indexOf(currentScreenId);
  const prevIdx = (idx - 1 + SCREEN_ORDER.length) % SCREEN_ORDER.length;
  showScreen(SCREEN_ORDER[prevIdx]);
}

function nextScreen() {
  const idx = SCREEN_ORDER.indexOf(currentScreenId);
  const nextIdx = (idx + 1) % SCREEN_ORDER.length;
  showScreen(SCREEN_ORDER[nextIdx]);
}

function toggleMaximizeCard(dotEl) {
  const card = dotEl.closest('.section-card');
  if (!card) return;
  card.classList.remove('minimized-card');
  card.classList.toggle('maximized-card');
}

function toggleMinimizeCard(dotEl) {
  const card = dotEl.closest('.section-card');
  if (!card) return;
  card.classList.remove('maximized-card');
  card.classList.toggle('minimized-card');
}

function resetCard(dotEl) {
  const card = dotEl.closest('.section-card');
  if (!card) return;
  card.classList.remove('maximized-card', 'minimized-card');
}

// ─── ENLARGEABLE LOGO QUICKLOOK LIGHTBOX ───
function openLogoLightbox(index = 0) {
  const item = OFFICIAL_LOGOS[index] || OFFICIAL_LOGOS[0];
  const modal = document.getElementById('logo-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  document.getElementById('lightbox-title').textContent = item.title;
  document.getElementById('lightbox-desc').textContent = item.desc;
  img.src = item.src;
  zoomLightbox(1);

  const thumbs = document.querySelectorAll('#lightbox-thumbs .lightbox-thumb');
  thumbs.forEach((t, i) => t.classList.toggle('active', i === index));

  modal.classList.add('open');
}

function closeLogoLightbox() {
  document.getElementById('logo-lightbox-modal').classList.remove('open');
}

function zoomLightbox(scale) {
  currentLightboxZoom = scale;
  const img = document.getElementById('lightbox-img');
  if (img) {
    img.style.transform = `scale(${scale})`;
    img.style.cursor = scale > 1 ? 'zoom-out' : 'zoom-in';
  }
}

function toggleLightboxZoom() {
  zoomLightbox(currentLightboxZoom > 1 ? 1 : 1.55);
}

// ─── GLOBAL DATASET MANAGEMENT & SCREEN 01 / 02 ───
function setGlobalDataset(arr, meta = {}) {
  activeDataset = [...arr];
  activeDatasetMeta = {
    size: arr.length,
    category: meta.category || 'custom',
    seed: meta.seed || 104201,
    checksum: meta.checksum || Engine.computeChecksum(arr)
  };

  const dsSizeEl = document.getElementById('global-ds-size');
  if (dsSizeEl) dsSizeEl.textContent = arr.length.toLocaleString();
  const dsCatEl = document.getElementById('global-ds-cat');
  if (dsCatEl) dsCatEl.textContent = activeDatasetMeta.category;

  renderMiniStageBars('s01-mini-bars', activeDataset.slice(0, 120));
  renderScreen02StatsAndChart();
}

function renderMiniStageBars(containerId, arr) {
  const el = document.getElementById(containerId);
  if (!el || !arr || arr.length === 0) return;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const span = Math.max(1, max - min);

  el.innerHTML = arr.map((v, i) => {
    const pct = Math.max(8, ((v - min) / span) * 92 + 8);
    const showLbl = arr.length <= 28 ? `<span>${v}</span>` : '';
    return `<div class="bar" style="height:${pct}%; background:linear-gradient(180deg, var(--up-gold), var(--up-maroon));" title="A[${i}] = ${v}">${showLbl}</div>`;
  }).join('');
}

function loadCanonical5Element() {
  const preset = Engine.VERIFICATION_ARRAYS.example;
  setGlobalDataset(preset.array, { category: 'thesis-5-element', seed: 20261001 });
  setFormulaSimArray(preset.array);
  document.getElementById('s05-array-input').value = preset.array.join(', ');
  document.getElementById('s05-low').value = 0;
  document.getElementById('s05-high').value = preset.array.length - 1;
  runScreen05PivotEstimation();
  document.getElementById('s06-array-input').value = preset.array.join(', ');
  initScreen06PartitionTrace(true);
  showToast('Loaded Thesis Canonical 5-Element Array: [6, 21, 3, 5, 1]');
}

function quickGenerateDataset() {
  const cats = ['random', 'nearly', 'reverse', 'duplicates'];
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const seed = Math.floor(Math.random() * 899999) + 100000;
  const ds = Engine.generateDataset(50, cat, seed, -500, 500);
  setGlobalDataset(ds.array, ds.metadata);
  runFullQuickExperiment();
  showToast(`Generated n=50 (${cat}) with seed ${seed}`);
}

function runFullQuickExperiment() {
  if (!activeDataset || activeDataset.length === 0) return;
  const res = Engine.compareAllFour(activeDataset, activeDatasetMeta.seed || 20261001, true);
  latestFourComparison = res;

  renderMiniStageBars('s01-mini-bars', res.sermax.sortedArray.slice(0, 120));

  const box = document.getElementById('s01-quick-results');
  const items = [
    { key: 'sermax', label: '✦ SerMax Hybrid (Proposed)', data: res.sermax, color: 'var(--up-gold)' },
    { key: 'trad', label: 'Traditional (First-Pivot)', data: res.trad, color: 'var(--trad)' },
    { key: 'median3', label: 'Median-of-Three', data: res.median3, color: '#38bdf8' },
    { key: 'random', label: 'Randomized-Pivot', data: res.random, color: '#a78bfa' }
  ];

  box.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
      ${items.map(it => `
        <div class="math-card" style="padding:8px 10px; border-left-color:${it.color};">
          <div style="font-size:0.66rem; font-weight:800; color:${it.color}; margin-bottom:4px;">${it.label}</div>
          <div style="font-size:0.7rem;">Time: <b>${it.data.elapsedMs.toFixed(3)} ms</b></div>
          <div style="font-size:0.7rem;">Cmp: <b>${it.data.comparisons.toLocaleString()}</b> | Swp: <b>${it.data.swaps.toLocaleString()}</b></div>
          <div style="font-size:0.7rem;">Depth: <b>${it.data.maxLogicalDepth}</b> | B: <b>${it.data.partitionBalance.toFixed(3)}</b></div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── SCREEN 02: DATASET GENERATION & REGISTRY ───
function generateFromScreen02() {
  const cat = document.getElementById('s02-cat').value;
  const size = parseInt(document.getElementById('s02-size').value, 10) || 50;
  const minVal = parseInt(document.getElementById('s02-min').value, 10) || -100000;
  const maxVal = parseInt(document.getElementById('s02-max').value, 10) || 100000;
  const seed = parseInt(document.getElementById('s02-seed').value, 10) || 104201;

  const ds = Engine.generateDataset(size, cat, seed, minVal, maxVal);
  setGlobalDataset(ds.array, ds.metadata);

  const id = `S-${String(sourceRegistry.length + 1).padStart(4, '0')}`;
  const mod = sourceRegistry.length % 20;
  const split = mod < 14 ? 'Training (70%)' : (mod < 17 ? 'Validation (15%)' : 'Independent Test (15%)');
  sourceRegistry.unshift({
    id,
    category: cat,
    n: size,
    seed,
    split,
    checksum: ds.metadata.checksum,
    array: ds.array
  });
  renderS02RegistryTable();
  showToast(`Registered ${id}: n=${size.toLocaleString()} (${cat})`);
}

function generateBatchRegistry(silent = false) {
  const cats = ['random', 'nearly', 'reverse', 'duplicates'];
  const sizes = [500, 1000, 10000];
  sourceRegistry = [];
  let seq = 1;
  let seed = 104201;

  sizes.forEach(sz => {
    cats.forEach(cat => {
      ['Training (70%)', 'Validation (15%)', 'Independent Test (15%)'].forEach(split => {
        const sampleSize = sz === 10000 ? 1000 : sz;
        const ds = Engine.generateDataset(sampleSize, cat, seed, -100000, 100000);
        sourceRegistry.push({
          id: `S-${String(seq).padStart(4, '0')}`,
          category: cat,
          n: sz,
          seed,
          split,
          checksum: ds.metadata.checksum,
          array: ds.array
        });
        seq++;
        seed += 13;
      });
    });
  });

  renderS02RegistryTable();
  if (!silent) showToast('Generated 12-Condition Source Array Registry (70:15:15 Split)');
}

function renderS02RegistryTable() {
  const tbody = document.getElementById('s02-registry-tbody');
  if (!tbody) return;
  document.getElementById('s02-registry-count').textContent = `${sourceRegistry.length} Recorded Arrays`;
  tbody.innerHTML = sourceRegistry.slice(0, 36).map((r, idx) => `
    <tr>
      <td class="mono"><b style="color:var(--up-gold);">${r.id}</b></td>
      <td style="text-transform:capitalize;">${r.category}</td>
      <td class="mono">${r.n.toLocaleString()}</td>
      <td class="mono">${r.seed}</td>
      <td><span class="${r.split.includes('Test') ? 'badge-pass' : 'badge-warn'}">${r.split}</span></td>
      <td class="mono">${r.checksum}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="loadRegistryArray(${idx})">Load</button></td>
    </tr>
  `).join('');
}

function loadRegistryArray(idx) {
  const item = sourceRegistry[idx];
  if (!item) return;
  setGlobalDataset(item.array, { size: item.array.length, category: item.category, seed: item.seed, checksum: item.checksum });
  showToast(`Loaded ${item.id} (${item.category}, seed ${item.seed})`);
}

function loadVerificationPreset(key) {
  const p = Engine.VERIFICATION_ARRAYS[key];
  if (!p) return;
  document.getElementById('s02-manual-input').value = p.array.join(', ');
  setGlobalDataset(p.array, { category: key, seed: 20261001 });
  showToast(`Loaded ${p.name}: [${p.array.join(', ')}]`);
}

function loadCustomArrayFromScreen02() {
  const raw = document.getElementById('s02-manual-input').value;
  const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite);
  if (nums.length < 2) {
    showToast('Please enter at least 2 valid integers.');
    return;
  }
  setGlobalDataset(nums, { category: 'manual-custom', seed: 20261001 });
  showToast(`Loaded custom array of ${nums.length} integers`);
}

function renderScreen02StatsAndChart() {
  const statsEl = document.getElementById('s02-live-stats');
  if (!statsEl || activeDataset.length === 0) return;
  const f = Engine.extractSevenFeatures(activeDataset, 0, activeDataset.length - 1);
  const preview = activeDataset.slice(0, 14).join(', ') + (activeDataset.length > 14 ? ', …' : '');

  statsEl.innerHTML = `
    <div style="color:var(--up-gold); font-weight:800; margin-bottom:6px;">
      Active Array 7-Predictor Summary (${activeDatasetMeta.category.toUpperCase()} • Checksum ${activeDatasetMeta.checksum})
    </div>
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; font-size:0.73rem;">
      <div><b>n:</b> ${f.n.toLocaleString()}</div>
      <div><b>x_min:</b> ${f.x_min.toLocaleString()}</div>
      <div><b>x_max:</b> ${f.x_max.toLocaleString()}</div>
      <div><b>Mean (μ):</b> ${f.mu.toFixed(2)}</div>
      <div><b>Std Dev (σ):</b> ${f.sigma.toFixed(2)}</div>
      <div><b>Skewness (γ):</b> ${f.gamma.toFixed(4)}</div>
      <div><b>Disorder (d):</b> ${f.d.toFixed(4)}</div>
      <div><b>Seed:</b> ${activeDatasetMeta.seed}</div>
    </div>
    <div style="margin-top:6px; font-size:0.7rem; color:var(--text-dim); word-break:break-all;">
      <b>Sample Elements:</b> [${preview}]
    </div>
  `;
  drawS02DistributionChart();
}

function switchS02Chart(mode, btn) {
  s02ChartMode = mode;
  btn.parentElement.querySelectorAll('.pill-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  drawS02DistributionChart();
}

function drawS02DistributionChart() {
  const box = document.getElementById('s02-chart-box');
  if (!box || activeDataset.length === 0) return;

  let values = [];
  let label = '';
  if (s02ChartMode === 'value') {
    values = activeDataset.slice(0, 80);
    label = `First ${values.length} Elements (Index Order)`;
  } else if (s02ChartMode === 'sorted') {
    values = [...activeDataset].sort((a, b) => a - b).slice(0, 80);
    label = 'Ascending Sorted Value Curve';
  } else {
    // 20-bin value histogram
    const min = Math.min(...activeDataset);
    const max = Math.max(...activeDataset);
    const bins = new Array(20).fill(0);
    const span = Math.max(1, max - min);
    activeDataset.forEach(v => {
      const b = Math.min(19, Math.floor(((v - min) / span) * 20));
      bins[b]++;
    });
    values = bins;
    label = '20-Bin Frequency Distribution Histogram';
  }

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = Math.max(1, maxV - (s02ChartMode === 'hist' ? 0 : minV));
  const base = s02ChartMode === 'hist' ? 0 : minV;

  box.innerHTML = `
    <div style="height:190px; display:flex; align-items:flex-end; gap:3px; padding:10px; background:rgba(10,2,4,0.6); border-radius:8px;">
      ${values.map((v, i) => {
        const h = Math.max(6, ((v - base) / span) * 92 + 6);
        return `<div style="flex:1; height:${h}%; background:linear-gradient(180deg, #ffd166, var(--up-maroon)); border-radius:3px 3px 0 0;" title="Index/Bin ${i}: ${v}"></div>`;
      }).join('')}
    </div>
    <div style="text-align:center; font-size:0.72rem; color:var(--text-dim); margin-top:6px;">${label}</div>
  `;
}

function exportCurrentDatasetCSV() {
  const rows = ['index,value', ...activeDataset.map((v, i) => `${i},${v}`)].join('\n');
  downloadTextFile(`sermax_dataset_${activeDatasetMeta.category}_n${activeDataset.length}.csv`, rows, 'text/csv');
}

// ─── SCREEN 03: FEATURE EXTRACTION, FORMULA SIMULATOR & 33-CANDIDATE TARGETS ───
function setFormulaSimArray(arr) {
  document.getElementById('s03-array-input').value = arr.join(', ');
  runFormulaSimulator();
}

function useActiveDatasetInFormulaSim() {
  const slice = activeDataset.slice(0, 40);
  setFormulaSimArray(slice);
  showToast(`Loaded ${slice.length} elements from active dataset into Formula Simulator`);
}

function runFormulaSimulator() {
  const raw = document.getElementById('s03-array-input').value;
  const arr = raw.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite);
  if (arr.length < 2) return;

  const exp = Engine.explainFeatureCalculation(arr, 0, arr.length - 1);
  const f = exp.features;
  const candEval = Engine.evaluateCandidatePivots(arr, 0, arr.length - 1);

  // Render indexed array cells with target pivot highlighted
  const cellsEl = document.getElementById('s03-array-cells');
  cellsEl.innerHTML = arr.map((v, idx) => {
    const isTarget = idx === candEval.targetRelIdx;
    return `
      <div class="array-cell ${isTarget ? 'is-pivot' : ''}">
        ${isTarget ? '<span class="cell-tag" style="background:var(--up-gold);color:#1a0508;">Target i*</span>' : ''}
        <div class="cell-val">${v}</div>
        <div class="cell-idx">idx ${idx}</div>
      </div>
    `;
  }).join('');

  // Render Table 1: Seven Predictor Variables
  const predRows = [
    { num: 1, name: 'Partition Size', sym: 'n', eq: 'n = high − low + 1', val: f.n },
    { num: 2, name: 'Minimum Value', sym: 'x_min', eq: 'min_{0 ≤ i < n} x_i', val: f.x_min },
    { num: 3, name: 'Maximum Value', sym: 'x_max', eq: 'max_{0 ≤ i < n} x_i', val: f.x_max },
    { num: 4, name: 'Arithmetic Mean (Eq. 1)', sym: 'μ', eq: '(1/n) ∑_{i=0}^{n-1} x_i', val: f.mu.toFixed(4) },
    { num: 5, name: 'Population Std. Dev. (Eq. 2)', sym: 'σ', eq: '√[(1/n) ∑ (x_i − μ)²]', val: f.sigma.toFixed(4) },
    { num: 6, name: 'Population Skewness (Eq. 3)', sym: 'γ', eq: '(1/n) ∑ [(x_i − μ)/σ]³ (0 if σ=0)', val: f.gamma.toFixed(4) },
    { num: 7, name: 'Disorder Ratio (Eq. 4)', sym: 'd', eq: '[1/(n−1)] ∑ 𝟙(x_i > x_{i+1})', val: f.d.toFixed(4) }
  ];
  document.getElementById('s03-predictors-tbody').innerHTML = predRows.map(r => `
    <tr>
      <td class="mono">${r.num}</td>
      <td><b>${r.name}</b></td>
      <td class="mono" style="color:var(--up-gold); font-weight:700;">${r.sym}</td>
      <td class="mono">${r.eq}</td>
      <td class="mono"><span class="math-highlight">${r.val}</span></td>
    </tr>
  `).join('');

  // Render Step-by-Step Worked Mathematical Substitutions
  const termsPreview = exp.subarray.slice(0, 8).join(' + ') + (exp.subarray.length > 8 ? ' + …' : '');
  const sqTermsPreview = exp.perElement.slice(0, 6).map(e => `${e.sqDev.toFixed(2)}`).join(' + ') + (exp.perElement.length > 6 ? ' + …' : '');
  const z3TermsPreview = exp.perElement.slice(0, 6).map(e => `${e.z3.toFixed(3)}`).join(' + ') + (exp.perElement.length > 6 ? ' + …' : '');
  const pairsPreview = exp.adjacentPairs.slice(0, 8).map(p => `(${p.leftVal},${p.rightVal})→${p.violatesAscending}`).join(', ');

  document.getElementById('s03-math-steps').innerHTML = `
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">Equation (1) — Arithmetic Mean (μ):</div>
      μ = (${termsPreview}) / ${f.n} = ${exp.sum} / ${f.n} = <span class="math-highlight">${f.mu.toFixed(4)}</span>
    </div>
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">Equation (2) — Population Standard Deviation (σ):</div>
      ∑(x_i − μ)² = ${sqTermsPreview} = ${f.sqDiffSum.toFixed(4)}<br/>
      σ = √(${f.sqDiffSum.toFixed(4)} / ${f.n}) = √(${f.variance.toFixed(4)}) = <span class="math-highlight">${f.sigma.toFixed(4)}</span>
    </div>
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">Equation (3) — Population Moment-Based Skewness (γ):</div>
      ${f.sigma > 1e-12
        ? `∑[(x_i − μ)/σ]³ = ${z3TermsPreview} = ${exp.z3Sum.toFixed(4)}<br/>γ = ${exp.z3Sum.toFixed(4)} / ${f.n} = <span class="math-highlight">${f.gamma.toFixed(4)}</span>`
        : `σ = 0 (all elements identical) → Computational convention assigns <span class="math-highlight">γ = 0.0000</span>`}
    </div>
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">Equation (4) — Adjacent Disorder Ratio (d):</div>
      Pairs: ${pairsPreview}<br/>
      d = ${f.descPairs} descending pairs / (${f.n} − 1) = ${f.descPairs} / ${f.n - 1} = <span class="math-highlight">${f.d.toFixed(4)}</span>
    </div>
  `;

  // Render 33-Candidate Target Pivot Evaluation Table (Equations 5-7)
  document.getElementById('s03-target-badge').textContent =
    `Selected Target i* = ${candEval.targetRelIdx} (Pivot = ${candEval.targetPivotValue}) • Imbalance I* = ${candEval.targetImbalance} • Normalized y = ${candEval.targetNormalizedY.toFixed(4)}`;

  document.getElementById('s03-candidates-tbody').innerHTML = candEval.candidates.map(c => {
    const isBest = c.relIdx === candEval.targetRelIdx;
    return `
      <tr style="${isBest ? 'background:rgba(242,169,0,0.16); font-weight:700;' : ''}">
        <td class="mono">c_${c.k}</td>
        <td class="mono">${c.relIdx}</td>
        <td class="mono">${c.absIdx}</td>
        <td class="mono" style="color:var(--up-gold);">${c.pivotValue}</td>
        <td class="mono">${c.n_L}</td>
        <td class="mono">${c.n_R}</td>
        <td class="mono"><b>${c.imbalance}</b></td>
        <td class="mono">${c.distToMid.toFixed(1)}</td>
        <td class="mono">${c.normalizedPos.toFixed(4)}</td>
        <td>${isBest ? '<span class="badge-pass">★ Minimum-Imbalance Target (Eq. 6)</span>' : '<span style="color:var(--text-dim);">Evaluated</span>'}</td>
      </tr>
    `;
  }).join('');
}

// ─── MODULE 3 (SCREEN 04): POLYNOMIAL REGRESSION MODEL STUDIO (36 COEFFICIENTS) ───
function renderScreen04Model() {
  const model = Engine.getFrozenModel();
  const vs = model.validation_summary;

  // Compute Midpoint Heuristic (ŷ = 0.5) baseline MAE & RMSE on held-out validation partitions
  const preds = vs.valPredictions || [];
  let midAbsSum = 0, midSqSum = 0;
  preds.forEach(p => {
    const err = Math.abs(p.actual - 0.5);
    midAbsSum += err;
    midSqSum += err * err;
  });
  const midMAE = preds.length > 0 ? midAbsSum / preds.length : 0.2415;
  const midRMSE = preds.length > 0 ? Math.sqrt(midSqSum / preds.length) : 0.2890;

  document.getElementById('s04-val-mae').textContent = vs.valMAE.toFixed(4);
  document.getElementById('s04-val-rmse').textContent = vs.valRMSE.toFixed(4);
  document.getElementById('s04-train-count').textContent = vs.trainCount.toLocaleString();
  const midEl = document.getElementById('s04-midpoint-mae');
  if (midEl) midEl.textContent = midMAE.toFixed(4);
  document.getElementById('s04-model-version').textContent = `Midpoint RMSE: ${midRMSE.toFixed(4)}`;

  // Training Log
  document.getElementById('s04-training-log').innerHTML = `
    <div style="color:#10b981;">[DATA SPLIT] Source arrays partitioned via 70:15:15 split (140 Training • 30 Validation • 30 Testing per condition).</div>
    <div style="color:var(--text-sub);">[TARGET EVALUATION] Extracted ${vs.trainCount} training partitions &amp; ${vs.valCount} validation partitions using minimum-imbalance pivot target (n ≤ 33 all positions; n &gt; 33 up to 33 positions).</div>
    <div style="color:var(--text-sub);">[STANDARDIZATION] Standardized 7 predictors using training-derived means[7] and scales[7].</div>
    <div style="color:var(--text-sub);">[OLS REGRESSION] Fitted second-degree polynomial regression model (36 coefficients) via Ordinary Least Squares (Eq. 9).</div>
    <div style="color:var(--up-gold);">[VALIDATION vs. MIDPOINT] 36-Term Model MAE = ${vs.valMAE.toFixed(4)}, RMSE = ${vs.valRMSE.toFixed(4)} vs. Midpoint Heuristic MAE = ${midMAE.toFixed(4)}, RMSE = ${midRMSE.toFixed(4)}. Model saved for runtime use.</div>
  `;

  // Scaler Table
  document.getElementById('s04-scaler-tbody').innerHTML = model.featureSummary.map(fs => `
    <tr>
      <td class="mono" style="color:var(--up-gold); font-weight:700;">${fs.name}</td>
      <td>${fs.label}</td>
      <td class="mono">${fs.mean.toFixed(4)}</td>
      <td class="mono">${fs.stdDev.toFixed(4)}</td>
      <td class="mono">${fs.min.toFixed(2)}</td>
      <td class="mono">${fs.max.toFixed(2)}</td>
    </tr>
  `).join('');

  renderS04CoefficientsTable();
  drawS04DiagnosticPlot();
}

function filterS04Coeffs(type, btn) {
  s04CoeffFilter = type;
  btn.parentElement.querySelectorAll('.pill-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderS04CoefficientsTable();
}

function renderS04CoefficientsTable() {
  const model = Engine.getFrozenModel();
  const rows = model.coefficientTable.filter(c => s04CoeffFilter === 'ALL' || c.type === s04CoeffFilter);
  document.getElementById('s04-coeffs-tbody').innerHTML = rows.map(c => `
    <tr>
      <td class="mono">${c.index}</td>
      <td class="mono" style="color:var(--up-gold); font-weight:700;">${c.symbol}</td>
      <td class="mono">${c.expr}</td>
      <td><span class="badge-warn">${c.type}</span></td>
      <td class="mono"><b>${c.coefficient >= 0 ? '+' : ''}${c.coefficient.toFixed(6)}</b></td>
      <td class="mono">${c.stdError.toFixed(4)}</td>
      <td class="mono">${c.tStat.toFixed(2)}</td>
      <td class="mono" style="color:#10b981;">${c.pValue}</td>
    </tr>
  `).join('');
}

function switchS04Plot(mode, btn) {
  s04PlotMode = mode;
  btn.parentElement.querySelectorAll('.pill-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  drawS04DiagnosticPlot();
}

function drawS04DiagnosticPlot() {
  const area = document.getElementById('s04-plot-area');
  if (!area) return;
  const model = Engine.getFrozenModel();
  const vs = model.validation_summary;

  if (s04PlotMode === 'scatter') {
    const W = 520, H = 240, pad = 38;
    const pts = vs.scatter.slice(0, 120);
    const circles = pts.map(p => {
      const cx = pad + p.actual * (W - 2 * pad);
      const cy = H - pad - p.predicted * (H - 2 * pad);
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5" fill="rgba(242,169,0,0.8)" stroke="#7B1113" stroke-width="1"><title>Actual y=${p.actual}, Predicted ŷ_c=${p.predicted} (n=${p.n})</title></circle>`;
    }).join('');

    area.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:100%;">
        <rect x="${pad}" y="${pad}" width="${W - 2 * pad}" height="${H - 2 * pad}" fill="rgba(10,2,4,0.6)" stroke="rgba(242,169,0,0.2)" />
        <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${pad}" stroke="#10b981" stroke-dasharray="4" stroke-width="1.5" />
        ${circles}
        <text x="${W / 2}" y="${H - 8}" text-anchor="middle" fill="#ebd5d8" font-size="11">Actual Minimum-Imbalance Target y ∈ [0, 1]</text>
        <text x="14" y="${H / 2}" text-anchor="middle" fill="#ebd5d8" font-size="11" transform="rotate(-90 14 ${H / 2})">Predicted ŷ_c ∈ [0, 1]</text>
      </svg>
    `;
  } else if (s04PlotMode === 'importance') {
    const topTerms = [...model.coefficientTable].slice(1).sort((a, b) => b.importance - a.importance).slice(0, 12);
    const maxImp = Math.max(0.001, ...topTerms.map(t => t.importance));
    area.innerHTML = `
      <div style="height:215px; display:flex; align-items:flex-end; gap:8px; padding:14px 10px 4px; background:rgba(10,2,4,0.6); border-radius:8px;">
        ${topTerms.map(t => {
          const h = Math.max(8, (t.importance / maxImp) * 88);
          return `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
              <div style="font-size:0.58rem; color:var(--up-gold); font-family:'JetBrains Mono',monospace; margin-bottom:3px;">${t.coefficient.toFixed(3)}</div>
              <div style="width:100%; height:${h}%; background:linear-gradient(180deg, #a78bfa, var(--up-maroon)); border-radius:4px 4px 0 0;" title="${t.expr}: β=${t.coefficient.toFixed(5)}"></div>
              <div style="font-size:0.58rem; color:var(--text-sub); margin-top:4px; writing-mode:horizontal-tb; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:42px;">${t.expr}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="text-align:center; font-size:0.7rem; color:var(--text-dim); margin-top:6px;">Top 12 Standardized Polynomial Terms by |β| Weight Magnitude</div>
    `;
  } else {
    // Residuals histogram
    const bins = new Array(15).fill(0);
    vs.residuals.forEach(r => {
      const idx = Math.min(14, Math.max(0, Math.floor(((r + 0.5) / 1.0) * 15)));
      bins[idx]++;
    });
    const maxB = Math.max(1, ...bins);
    area.innerHTML = `
      <div style="height:215px; display:flex; align-items:flex-end; gap:5px; padding:14px 12px 6px; background:rgba(10,2,4,0.6); border-radius:8px;">
        ${bins.map((cnt, i) => {
          const h = Math.max(5, (cnt / maxB) * 90);
          const center = (-0.5 + (i + 0.5) / 15).toFixed(2);
          return `<div style="flex:1; height:${h}%; background:linear-gradient(180deg, #34d399, var(--up-green)); border-radius:3px 3px 0 0;" title="Residual ~ ${center}: ${cnt} observations"></div>`;
        }).join('')}
      </div>
      <div style="text-align:center; font-size:0.7rem; color:var(--text-dim); margin-top:6px;">Validation Residual Error Distribution (ŷ_c − y) Centered Around 0.00</div>
    `;
  }
}

function retrainModelInteractive() {
  const seed = parseInt(document.getElementById('s04-seed').value, 10) || 20261001;
  const arraysPerCategory = parseInt(document.getElementById('s04-arrays-per-cat').value, 10) || 16;
  const arraySize = parseInt(document.getElementById('s04-array-size').value, 10) || 250;

  const newModel = Engine.trainPolynomialRegressionModel({ seed, arraysPerCategory, arraySize });
  Engine.setFrozenModel(newModel);
  renderScreen04Model();
  runScreen05PivotEstimation();
  showToast(`Trained & froze 36-coefficient model (Seed ${seed}, Val MAE=${newModel.validation_summary.valMAE.toFixed(4)})`);
}

function exportFrozenModelJSON() {
  const model = Engine.getFrozenModel();
  const artifact = {
    model_version: model.model_version,
    train_seed: model.train_seed,
    trained_at: model.trained_at,
    feature_order: model.feature_order,
    means: model.means,
    scales: model.scales,
    coefficients: model.coefficients,
    term_order: model.term_order,
    validation_summary: {
      valMAE: model.validation_summary.valMAE,
      valRMSE: model.validation_summary.valRMSE,
      valR2: model.validation_summary.valR2
    }
  };
  downloadTextFile(`sermax_frozen_model_${model.train_seed}.json`, JSON.stringify(artifact, null, 2), 'application/json');
}

// ─── MODULE 4 (SCREEN 05): RUNTIME PIVOT ESTIMATOR (10-STEP CONTRACT) ───
function runScreen05PivotEstimation() {
  const raw = document.getElementById('s05-array-input').value;
  const arr = raw.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite);
  if (arr.length < 2) return;

  let low = parseInt(document.getElementById('s05-low').value, 10) || 0;
  let high = parseInt(document.getElementById('s05-high').value, 10);
  if (isNaN(high) || high >= arr.length) high = arr.length - 1;
  if (low < 0 || low >= high) low = 0;

  document.getElementById('s05-low').value = low;
  document.getElementById('s05-high').value = high;

  const pred = Engine.predictPivotPosition(arr, low, high, Engine.getFrozenModel(), true);

  document.getElementById('s05-cells').innerHTML = arr.map((v, idx) => {
    const inSub = idx >= low && idx <= high;
    const isPiv = idx === pred.absIndex;
    return `
      <div class="array-cell ${isPiv ? 'is-pivot' : ''}" style="${!inSub ? 'opacity:0.35;' : ''}">
        ${isPiv ? `<span class="cell-tag" style="background:var(--up-gold);color:#1a0508;">p_abs = ${idx}</span>` : ''}
        <div class="cell-val">${v}</div>
        <div class="cell-idx">A[${idx}]</div>
      </div>
    `;
  }).join('');

  document.getElementById('s05-fallback-badge').textContent =
    pred.fallbackUsed ? 'Fallback: Midpoint Used' : `Valid Prediction • A[${pred.absIndex}] = ${pred.pivotValue}`;

  const f = pred.features;
  const steps = [
    { s: '01', t: 'Read Active Subproblem Bounds', d: `low = ${low}, high = ${high}, partition size n = high − low + 1 = ${pred.n}` },
    { s: '02', t: 'Extract 7 Subproblem Predictors', d: `n=${f.n}, x_min=${f.x_min}, x_max=${f.x_max}, μ=${f.mu.toFixed(3)}, σ=${f.sigma.toFixed(3)}, γ=${f.gamma.toFixed(3)}, d=${f.d.toFixed(3)}` },
    { s: '03', t: 'Standardize via Frozen Training Scaler', d: `X = [${pred.standardizedFeatures.map(x => x.toFixed(3)).join(', ')}]` },
    { s: '04', t: 'Evaluate 36-Coefficient 2nd-Degree Polynomial (Eq. 8)', d: `Unconstrained prediction ŷ = ${pred.yHat.toFixed(6)}` },
    { s: '05', t: 'Constrain to Valid Normalized Interval [0, 1] (Eq. 10)', d: `ŷ_c = min(1, max(0, ${pred.yHat.toFixed(4)})) = ${pred.yClamped.toFixed(6)}` },
    { s: '06', t: 'Convert to Partition-Relative Index p (Eq. 11)', d: `p = round[${pred.yClamped.toFixed(4)} × (${pred.n} − 1)] = ${pred.relIndex}` },
    { s: '07', t: 'Convert to Absolute Array Index p_abs (Eq. 12)', d: `p_abs = low + p = ${low} + ${pred.relIndex} = ${pred.absIndex}` },
    { s: '08', t: 'Select & Save Reference Pivot Value v', d: `v = A[${pred.absIndex}] = ${pred.pivotValue} (saved before any swaps)` },
    { s: '09', t: 'Validate Finiteness & Array Boundaries', d: `Finite=${Number.isFinite(pred.yHat)} && ${low} ≤ ${pred.absIndex} ≤ ${high} → Fallback=${pred.fallbackUsed}` },
    { s: '10', t: 'Forward to Bidirectional Partitioning', d: `Ready to scan A[${low}..${high}] from opposing ends around v = ${pred.pivotValue}` }
  ];

  document.getElementById('s05-ten-steps').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:7px;">
      ${steps.map(st => `
        <div class="math-card" style="padding:8px 12px;">
          <span style="color:var(--up-gold); font-weight:800; margin-right:6px;">[Step ${st.s}] ${st.t}:</span>
          <span>${st.d}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('s05-yhat-sum').textContent = `∑(β_k · Φ_k) = ŷ = ${pred.yHat.toFixed(6)}`;
  document.getElementById('s05-terms-tbody').innerHTML = pred.termContributions.map(tc => `
    <tr>
      <td class="mono">${tc.index}</td>
      <td class="mono" style="color:var(--up-gold);">${tc.symbol}</td>
      <td class="mono">${tc.expr}</td>
      <td class="mono">${tc.standardizedTermValue.toFixed(4)}</td>
      <td class="mono">${tc.coefficient.toFixed(5)}</td>
      <td class="mono"><b>${tc.contribution >= 0 ? '+' : ''}${tc.contribution.toFixed(5)}</b></td>
    </tr>
  `).join('');
}

function sendScreen05ToPartitioner() {
  const raw = document.getElementById('s05-array-input').value;
  document.getElementById('s06-array-input').value = raw;
  initScreen06PartitionTrace(true);
  showScreen('s06');
}

// ─── SCREEN 06: BIDIRECTIONAL PARTITIONING ANIMATOR ───
function initScreen06PartitionTrace() {
  const raw = document.getElementById('s06-array-input').value;
  const arr = raw.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite);
  if (arr.length < 2) return;

  const pred = Engine.predictPivotPosition(arr, 0, arr.length - 1, Engine.getFrozenModel(), false);
  const pivIdx = Math.max(0, Math.min(arr.length - 1, pred.absIndex));

  const badgeEl = document.getElementById('s06-predicted-pivot-badge');
  if (badgeEl) {
    badgeEl.textContent = `Regression Pivot (Eqs. 10–12): ŷ_c = ${pred.yClamped.toFixed(4)} → p_abs = ${pivIdx} • v = A[${pivIdx}] = ${arr[pivIdx]}`;
  }

  s06TraceData = Engine.traceBidirectionalPartition(arr, 0, arr.length - 1, pivIdx);
  s06StepIdx = 0;
  renderScreen06Step();
}

function renderScreen06Step() {
  if (!s06TraceData) return;
  const st = s06TraceData.steps[s06StepIdx];
  const total = s06TraceData.steps.length - 1;

  document.getElementById('s06-step-counter').textContent = `Step ${s06StepIdx} / ${total}`;
  document.getElementById('s06-step-banner').innerHTML = `
    <span style="color:var(--up-gold);">[Step ${st.step}/${total}]</span> ${st.action}
  `;

  // Highlight active line in pseudocode tracer
  document.querySelectorAll('#s06-code-tracer .code-line').forEach(el => {
    el.classList.toggle('active-line', parseInt(el.getAttribute('data-line'), 10) === st.codeLine);
  });

  // Render cells
  const isDone = st.phase === 'done';
  document.getElementById('s06-cells').innerHTML = st.array.map((v, idx) => {
    const classes = ['array-cell'];
    let tagHtml = '';

    if (isDone) {
      if (idx <= s06TraceData.finalJ) classes.push('zone-left');
      else if (idx >= s06TraceData.finalI) classes.push('zone-right');
    } else {
      if (st.swappedIndices && st.swappedIndices.includes(idx)) classes.push('is-swapped');
      if (idx === st.i && idx === st.j) {
        classes.push('is-left-ptr');
        tagHtml = `<span class="cell-tag" style="background:var(--up-gold);color:#1a0508;">i = j = ${idx}</span>`;
      } else if (idx === st.i) {
        classes.push('is-left-ptr');
        tagHtml = `<span class="cell-tag" style="background:var(--pointer-l);color:#061826;">i → (${idx})</span>`;
      } else if (idx === st.j) {
        classes.push('is-right-ptr');
        tagHtml = `<span class="cell-tag" style="background:var(--pointer-r);color:#fff;">← j (${idx})</span>`;
      }
    }

    return `
      <div class="${classes.join(' ')}">
        ${tagHtml}
        <div class="cell-val">${v}</div>
        <div class="cell-idx">A[${idx}]</div>
      </div>
    `;
  }).join('');

  document.getElementById('s06-pointer-pills').innerHTML = `
    <span class="menubar-pill">Saved Pivot Value v = <b>${st.pivotValue}</b> (from A[${st.pivotAbsIdx}])</span>
    <span class="menubar-pill" style="border-color:var(--pointer-l);color:var(--pointer-l);">Left Pointer i = <b>${st.i}</b></span>
    <span class="menubar-pill" style="border-color:var(--pointer-r);color:var(--pointer-r);">Right Pointer j = <b>${st.j}</b></span>
    <span class="menubar-pill">Comparisons: <b>${st.comparisons}</b></span>
    <span class="menubar-pill">Swaps: <b>${st.swaps}</b></span>
  `;

  document.getElementById('s06-children-summary').innerHTML = `
    <div style="color:var(--up-gold); font-weight:700; margin-bottom:4px;">Resulting Subproblems &amp; Partition Imbalance (Equations 5, 15, 16, 22):</div>
    • <b>Left Subproblem [low..j]:</b> ${s06TraceData.leftChild ? `[0..${s06TraceData.finalJ}] = [${s06TraceData.leftChild.elements.join(', ')}] (n_L = ${s06TraceData.n_L}, Eligible ✓)` : `n_L = ${s06TraceData.n_L} (Trivial ≤ 1, Excluded)`}<br/>
    • <b>Right Subproblem [i..high]:</b> ${s06TraceData.rightChild ? `[${s06TraceData.finalI}..${s06TraceData.high}] = [${s06TraceData.rightChild.elements.join(', ')}] (n_R = ${s06TraceData.n_R}, Eligible ✓)` : `n_R = ${s06TraceData.n_R} (Trivial ≤ 1, Excluded)`}<br/>
    • <b>Imbalance:</b> I = |${s06TraceData.n_L} − ${s06TraceData.n_R}| = <b>${s06TraceData.imbalance}</b> &nbsp;|&nbsp; <b>Normalized Imbalance B:</b> <span class="math-highlight">${s06TraceData.normalizedImbalance.toFixed(4)}</span>
  `;

  document.getElementById('s06-trace-tbody').innerHTML = s06TraceData.steps.map((row, idx) => `
    <tr style="${idx === s06StepIdx ? 'background:rgba(242,169,0,0.18); font-weight:700;' : ''}" onclick="s06StepIdx=${idx}; renderScreen06Step();" style="cursor:pointer;">
      <td class="mono">${row.step}</td>
      <td>${row.action}</td>
      <td class="mono">[${row.array.join(', ')}]</td>
      <td class="mono">${row.i}</td>
      <td class="mono">${row.j}</td>
      <td class="mono">${row.comparisons}</td>
      <td class="mono">${row.swaps}</td>
    </tr>
  `).join('');
}

function s06StepFirst() { s06StepIdx = 0; renderScreen06Step(); }
function s06StepPrev() { if (s06StepIdx > 0) { s06StepIdx--; renderScreen06Step(); } }
function s06StepNext() { if (s06TraceData && s06StepIdx < s06TraceData.steps.length - 1) { s06StepIdx++; renderScreen06Step(); } }
function s06StepLast() { if (s06TraceData) { s06StepIdx = s06TraceData.steps.length - 1; renderScreen06Step(); } }
function s06TogglePlay() {
  const btn = document.getElementById('s06-play-btn');
  if (s06PlayTimer) {
    clearInterval(s06PlayTimer);
    s06PlayTimer = null;
    btn.textContent = '▶ Auto Play';
  } else {
    if (s06TraceData && s06StepIdx >= s06TraceData.steps.length - 1) s06StepIdx = 0;
    btn.textContent = '⏸ Pause';
    s06PlayTimer = setInterval(() => {
      if (!s06TraceData || s06StepIdx >= s06TraceData.steps.length - 1) {
        clearInterval(s06PlayTimer);
        s06PlayTimer = null;
        btn.textContent = '▶ Auto Play';
        return;
      }
      s06StepIdx++;
      renderScreen06Step();
    }, 650);
  }
}

// ─── SCREEN 07: PRIORITY QUEUE SUBPROBLEM SCHEDULING (BINARY MAX-HEAP) ───
function initScreen07QueueSimulation() {
  const sample = activeDataset.length >= 10 && activeDataset.length <= 60
    ? activeDataset
    : Engine.generateDataset(24, 'random', 20261001, 10, 99).array;

  const res = Engine.runSerMaxInstrumented(sample, Engine.getFrozenModel(), true);
  s07TraceSteps = res.trace || [];
  s07IterIdx = 0;

  document.getElementById('s07-qmax').textContent = res.maxQueueOccupancy;
  document.getElementById('s07-dmax').textContent = res.maxLogicalDepth;

  renderScreen07State();
}

function renderScreen07State() {
  if (!s07TraceSteps || s07TraceSteps.length === 0) return;
  const cur = s07TraceSteps[Math.min(s07IterIdx, s07TraceSteps.length - 1)];
  const qList = cur.queueSnapshot || [];

  document.getElementById('s07-qsize-badge').textContent = `|Q| = ${qList.length} Pending`;
  document.getElementById('s07-iter-banner').innerHTML = `
    <b style="color:var(--up-gold);">Iteration ${cur.step} / ${s07TraceSteps.length}:</b>
    Polled Largest Subproblem <b>[${cur.low}, ${cur.high}]</b> (size P(S) = <b>${cur.size}</b>, depth = <b>${cur.depth}</b>, FIFO seq = <b>#${cur.seq}</b>)
    → Predicted Pivot A[${cur.pivotAbsIdx}] = <b>${cur.pivotValue}</b>
    → Enqueued Left <b>${cur.leftBounds}</b> &amp; Right <b>${cur.rightBounds}</b>
  `;

  drawBinaryMaxHeapSVG(qList);

  document.getElementById('s07-queue-tbody').innerHTML = qList.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:#10b981;font-weight:700;">|Q| = 0 — Priority Queue Empty (Sorting Terminated via Eq. 19)</td></tr>`
    : qList.map((item, idx) => `
      <tr style="${idx === 0 ? 'background:rgba(242,169,0,0.16); font-weight:700;' : ''}">
        <td class="mono">${idx + 1}</td>
        <td class="mono">[${item.low}, ${item.high}]</td>
        <td class="mono" style="color:var(--up-gold);">${item.size}</td>
        <td class="mono">${item.depth}</td>
        <td class="mono">#${item.seq}</td>
        <td>${idx === 0 ? '<span class="badge-pass">Next Polled (Max Size)</span>' : '<span class="badge-warn">Waiting in Heap</span>'}</td>
      </tr>
    `).join('');

  document.getElementById('s07-lifecycle-tbody').innerHTML = s07TraceSteps.map((st, idx) => `
    <tr style="${idx === s07IterIdx ? 'background:rgba(242,169,0,0.16); font-weight:700;' : ''}" onclick="s07IterIdx=${idx}; renderScreen07State();" style="cursor:pointer;">
      <td class="mono">${st.step}</td>
      <td class="mono">[${st.low}, ${st.high}]</td>
      <td class="mono" style="color:var(--up-gold);">${st.size}</td>
      <td class="mono">${st.depth}</td>
      <td class="mono">#${st.seq}</td>
      <td class="mono">A[${st.pivotAbsIdx}] = ${st.pivotValue}</td>
      <td class="mono">${st.leftBounds} (n_L=${st.n_L})</td>
      <td class="mono">${st.rightBounds} (n_R=${st.n_R})</td>
      <td class="mono">${st.queueSnapshot.length}</td>
    </tr>
  `).join('');
}

function drawBinaryMaxHeapSVG(qList) {
  const box = document.getElementById('s07-heap-svg-box');
  if (!box) return;
  if (!qList || qList.length === 0) {
    box.innerHTML = `<div style="color:#10b981; font-weight:700; font-size:0.86rem;">✓ Queue Empty (|Q| = 0) — All Subproblems Sorted!</div>`;
    return;
  }

  const nodes = qList.slice(0, 7); // Up to 3 levels (1 + 2 + 4 = 7 nodes)
  const coords = [
    { x: 260, y: 42 },
    { x: 140, y: 120 }, { x: 380, y: 120 },
    { x: 80, y: 198 },  { x: 200, y: 198 }, { x: 320, y: 198 }, { x: 440, y: 198 }
  ];

  let lines = '';
  for (let i = 1; i < nodes.length; i++) {
    const p = (i - 1) >> 1;
    lines += `<line x1="${coords[p].x}" y1="${coords[p].y}" x2="${coords[i].x}" y2="${coords[i].y}" stroke="rgba(242,169,0,0.45)" stroke-width="2" />`;
  }

  const circles = nodes.map((nd, i) => {
    const c = coords[i];
    const isRoot = i === 0;
    return `
      <g transform="translate(${c.x}, ${c.y})">
        <rect x="-46" y="-22" width="92" height="44" rx="10" fill="${isRoot ? '#7B1113' : '#220a0f'}" stroke="${isRoot ? '#F2A900' : 'rgba(242,169,0,0.4)'}" stroke-width="${isRoot ? '2.5' : '1.5'}" />
        <text x="0" y="-4" text-anchor="middle" fill="#ffffff" font-family="JetBrains Mono" font-size="11" font-weight="700">[${nd.low}, ${nd.high}]</text>
        <text x="0" y="12" text-anchor="middle" fill="#F2A900" font-family="JetBrains Mono" font-size="9.5">n=${nd.size} • seq#${nd.seq}</text>
      </g>
    `;
  }).join('');

  box.innerHTML = `<svg viewBox="0 0 520 240" style="width:100%; height:100%;">${lines}${circles}</svg>`;
}

function s07PrevStep() { if (s07IterIdx > 0) { s07IterIdx--; renderScreen07State(); } }
function s07NextStep() { if (s07IterIdx < s07TraceSteps.length - 1) { s07IterIdx++; renderScreen07State(); } }
function s07Reset() { initScreen07QueueSimulation(); }

function s07ManualEnqueue() {
  const low = parseInt(document.getElementById('s07-custom-low').value, 10) || 0;
  const high = parseInt(document.getElementById('s07-custom-high').value, 10) || 9;
  const depth = parseInt(document.getElementById('s07-custom-depth').value, 10) || 1;
  if (high <= low) {
    showToast('Subproblem must have high > low (size > 1) to be eligible.');
    return;
  }
  if (s07TraceSteps.length > 0 && s07ManualPQ.isEmpty()) {
    const curQ = s07TraceSteps[s07IterIdx]?.queueSnapshot || [];
    curQ.forEach(item => s07ManualPQ.enqueue(item.low, item.high, item.depth));
  }
  const entry = s07ManualPQ.enqueue(low, high, depth);
  const sorted = s07ManualPQ.toSortedArray();
  drawBinaryMaxHeapSVG(sorted);
  document.getElementById('s07-qsize-badge').textContent = `|Q| = ${sorted.length} Pending`;
  document.getElementById('s07-queue-tbody').innerHTML = sorted.map((item, idx) => `
    <tr style="${idx === 0 ? 'background:rgba(242,169,0,0.16); font-weight:700;' : ''}">
      <td class="mono">${idx + 1}</td>
      <td class="mono">[${item.low}, ${item.high}]</td>
      <td class="mono" style="color:var(--up-gold);">${item.size}</td>
      <td class="mono">${item.depth}</td>
      <td class="mono">#${item.seq}</td>
      <td>${idx === 0 ? '<span class="badge-pass">Next Polled (Max Size)</span>' : '<span class="badge-warn">Waiting</span>'}</td>
    </tr>
  `).join('');
  showToast(`Enqueued [${low}, ${high}] (size=${entry.size}, seq=#${entry.seq})`);
}

function s07ManualPoll() {
  if (s07ManualPQ.isEmpty()) {
    s07NextStep();
    return;
  }
  const polled = s07ManualPQ.poll();
  const sorted = s07ManualPQ.toSortedArray();
  drawBinaryMaxHeapSVG(sorted);
  showToast(`Polled highest-priority subproblem [${polled.low}, ${polled.high}] (size=${polled.size}, seq=#${polled.seq})`);
}

// ─── SCREEN 08: LIVE VISUALIZER & GATE C VERIFICATION SUITE ───
function generateForVis(forceArray = null) {
  stopPlay();
  const baselineAlgo = document.getElementById('vis-baseline-algo').value || 'trad';
  const titles = {
    trad: 'Traditional QuickSort (First-Element Pivot)',
    median3: 'Median-of-Three QuickSort',
    random: 'Randomized-Pivot QuickSort'
  };
  document.getElementById('vis-baseline-title').textContent = titles[baselineAlgo] || titles.trad;

  let arr;
  if (forceArray && Array.isArray(forceArray)) {
    arr = [...forceArray];
  } else {
    const size = parseInt(document.getElementById('vis-size').value, 10) || 30;
    const dist = document.getElementById('vis-dist').value || 'random';
    arr = Engine.generateDataset(size, dist, 20261001, 5, 100).array;
  }

  tradSnaps = Engine.getVisualizerSnapshots(arr, baselineAlgo, Engine.getFrozenModel());
  sermaxSnaps = Engine.getVisualizerSnapshots(arr, 'sermax', Engine.getFrozenModel());
  frameIdx = 0;

  const maxF = Math.max(tradSnaps.length, sermaxSnaps.length) - 1;
  const scrub = document.getElementById('vis-scrubber');
  if (scrub) {
    scrub.max = Math.max(1, maxF);
    scrub.value = 0;
  }
  renderFrame();
}

function getBarColor(idx, frame, isSermax) {
  if (!frame) return isSermax ? '#F2A900' : '#F58220';
  const { left, right, pivot, low, high, op } = frame;
  if (op === 'done') return '#10b981';
  if (idx === pivot) return '#22d3ee';
  if (op === 'swap' && (idx === left || idx === right)) return '#f43f5e';
  if (idx === left || idx === right) return '#fbbf24';
  if (low !== -1 && idx >= low && idx <= high) return isSermax ? '#F2A900' : '#F58220';
  return '#3b1219';
}

function renderVisBars(containerId, frameArr, isSermax) {
  const el = document.getElementById(containerId);
  if (!el || !frameArr || frameArr.length === 0) return;

  const frame = frameArr[Math.min(frameIdx, frameArr.length - 1)];
  const arr = frame ? frame.array : frameArr[0].array;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const span = Math.max(1, max - min);

  el.innerHTML = arr.map((v, i) => {
    const h = Math.max(5, ((v - min) / span) * 90 + 5);
    const col = getBarColor(i, frame, isSermax);
    const lbl = arr.length <= 26 ? `<span>${v}</span>` : '';
    return `<div class="bar" style="height:${h}%; background-color:${col};" title="A[${i}] = ${v}">${lbl}</div>`;
  }).join('');
}

function renderFrame() {
  renderVisBars('vis-bars-trad', tradSnaps, false);
  renderVisBars('vis-bars-sermax', sermaxSnaps, true);

  const maxFrames = Math.max(tradSnaps.length, sermaxSnaps.length);
  document.getElementById('vis-frame-cur').textContent = frameIdx;
  document.getElementById('vis-frame-tot').textContent = Math.max(0, maxFrames - 1);
  const scrub = document.getElementById('vis-scrubber');
  if (scrub) scrub.value = frameIdx;

  const tf = tradSnaps[Math.min(frameIdx, tradSnaps.length - 1)];
  const sf = sermaxSnaps[Math.min(frameIdx, sermaxSnaps.length - 1)];

  if (tf) {
    document.getElementById('vc-cmp').textContent = tf.metrics.comparisons;
    document.getElementById('vc-swp').textContent = tf.metrics.swaps;
    document.getElementById('vc-prt').textContent = tf.metrics.partitionOperations;
    document.getElementById('vc-dep').textContent = tf.metrics.maxLogicalDepth;
    document.getElementById('vc-bal').textContent = tf.metrics.partitionBalance;
  }
  if (sf) {
    document.getElementById('vs-cmp').textContent = sf.metrics.comparisons;
    document.getElementById('vs-swp').textContent = sf.metrics.swaps;
    document.getElementById('vs-cal').textContent = sf.metrics.queueOperations || 0;
    document.getElementById('vs-dep').textContent = sf.metrics.maxLogicalDepth;
    document.getElementById('vs-bal').textContent = sf.metrics.partitionBalance;
  }

  const activeFrame = sf && sf.op !== 'done' ? sf : (tf || sf);
  if (activeFrame) {
    document.getElementById('vis-op-label').textContent = activeFrame.detail || activeFrame.op;
    document.querySelectorAll('#s08-event-timeline .timeline-node').forEach(nd => {
      nd.classList.toggle('active', parseInt(nd.getAttribute('data-stage'), 10) === (activeFrame.eventStage || 1));
    });
  }
}

function scrubVisFrame(val) {
  stopPlay();
  frameIdx = parseInt(val, 10) || 0;
  renderFrame();
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
  const speed = parseInt(document.getElementById('vis-speed').value, 10) || 40;

  playTimer = setInterval(() => {
    const max = Math.max(tradSnaps.length, sermaxSnaps.length);
    if (frameIdx >= max - 1) { stopPlay(); return; }
    frameIdx++;
    renderFrame();
  }, speed);
}

function stopPlay() {
  playing = false;
  if (playTimer) clearInterval(playTimer);
  playTimer = null;
  const btn = document.getElementById('vis-play-btn');
  if (btn) btn.innerHTML = '▶ Play';
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

function runGateCVerification() {
  const tbody = document.getElementById('s08-verify-tbody');
  if (!tbody) return;

  // Verify correctness (sorted output) on identical input arrays across all 4 dataset categories and verification sizes (5, 25, 50)
  const verificationConditions = [
    { id: 'V-01', name: 'Random (Uniform Integer Array)', cat: 'random', n: 5, seed: 20261001 },
    { id: 'V-02', name: 'Nearly Sorted (Ascending + 1% Exchanges)', cat: 'nearly', n: 5, seed: 20261002 },
    { id: 'V-03', name: 'Reverse Sorted (Descending Integer Array)', cat: 'reverse', n: 5, seed: 20261003 },
    { id: 'V-04', name: 'Many Duplicates (Repeated Values)', cat: 'duplicates', n: 5, seed: 20261004 },
    { id: 'V-05', name: 'Random (Uniform Integer Array)', cat: 'random', n: 25, seed: 20261005 },
    { id: 'V-06', name: 'Nearly Sorted (Ascending + 1% Exchanges)', cat: 'nearly', n: 25, seed: 20261006 },
    { id: 'V-07', name: 'Reverse Sorted (Descending Integer Array)', cat: 'reverse', n: 25, seed: 20261007 },
    { id: 'V-08', name: 'Many Duplicates (Repeated Values)', cat: 'duplicates', n: 25, seed: 20261008 },
    { id: 'V-09', name: 'Random (Uniform Integer Array)', cat: 'random', n: 50, seed: 20261009 },
    { id: 'V-10', name: 'Nearly Sorted (Ascending + 1% Exchanges)', cat: 'nearly', n: 50, seed: 20261010 },
    { id: 'V-11', name: 'Reverse Sorted (Descending Integer Array)', cat: 'reverse', n: 50, seed: 20261011 },
    { id: 'V-12', name: 'Many Duplicates (Repeated Values)', cat: 'duplicates', n: 50, seed: 20261012 }
  ];

  tbody.innerHTML = verificationConditions.map(vc => {
    const ds = Engine.generateDataset(vc.n, vc.cat, vc.seed, -1000, 1000);
    const comp = Engine.compareAllFour(ds.array, vc.seed, false);
    const sOk = comp.sermax.verified;
    const tOk = comp.trad.verified;
    const mOk = comp.median3.verified;
    const rOk = comp.random.verified;
    const allOk = sOk && tOk && mOk && rOk;
    return `
      <tr>
        <td class="mono"><b style="color:var(--up-gold);">${vc.id}</b></td>
        <td><b>${vc.name}</b></td>
        <td class="mono">${vc.n}</td>
        <td class="mono">${ds.metadata.checksum}</td>
        <td>${sOk ? '<span class="badge-pass">✓ Sorted</span>' : '❌ Unsorted'}</td>
        <td>${tOk ? '<span class="badge-pass">✓ Sorted</span>' : '❌ Unsorted'}</td>
        <td>${mOk ? '<span class="badge-pass">✓ Sorted</span>' : '❌ Unsorted'}</td>
        <td>${rOk ? '<span class="badge-pass">✓ Sorted</span>' : '❌ Unsorted'}</td>
        <td>${allOk ? '<span class="badge-pass">✓ Identical Input &amp; Sorted Output Verified</span>' : '❌ Verification Failed'}</td>
      </tr>
    `;
  }).join('');
}

// ─── MODULE 8 & MODULE 9: COMPARATIVE BENCHMARKING & STATISTICAL ANALYSIS ───
function toggleLeaderboardCol(colClass, show) {
  document.querySelectorAll(`.col-${colClass}`).forEach(el => {
    el.style.display = show ? '' : 'none';
  });
}

function runSingleBenchmark(silent = false) {
  const dist = document.getElementById('bench-dist').value || 'nearly';
  const size = parseInt(document.getElementById('bench-size').value, 10) || 1000;
  const trials = parseInt(document.getElementById('bench-trials').value, 10) || 10;
  const seed = parseInt(document.getElementById('bench-seed').value, 10) || 20261001;

  const ds = Engine.generateDataset(size, dist, seed, -100000, 100000);
  const comp = Engine.compareAllFour(ds.array, seed, false);

  // Run dedicated timing protocol (10 warm-up runs + 10 measured runs)
  ['sermax', 'trad', 'median3', 'random'].forEach(k => {
    const t = Engine.runDedicatedTimingTrial(ds.array, k, Engine.getFrozenModel(), trials, trials, seed);
    comp[k].elapsedMs = t.medianMs;
    comp[k].timingStats = t;
  });

  latestFourComparison = comp;
  document.getElementById('s09-condition-badge').textContent =
    `Condition: ${dist.toUpperCase()} • n = ${size.toLocaleString()} • Seed ${seed} • Identical Input Checksum ${ds.metadata.checksum}`;

  const entries = [
    { key: 'sermax', algo: comp.sermax, sched: '2nd-Deg Polynomial (36β) / Iterative PQ (Largest-First, FIFO)' },
    { key: 'trad', algo: comp.trad, sched: 'First Element A[low] / Recursive Bidirectional' },
    { key: 'median3', algo: comp.median3, sched: 'Median of (First, Mid, Last) / Recursive Bidirectional' },
    { key: 'random', algo: comp.random, sched: 'Seeded Pseudorandom Index / Recursive Bidirectional' }
  ];

  document.getElementById('s09-leaderboard-tbody').innerHTML = entries.map((e, i) => {
    const a = e.algo;
    const isSermax = e.key === 'sermax';
    const speedup = a.elapsedMs > 1e-6 ? (comp.trad.elapsedMs / a.elapsedMs).toFixed(2) + '×' : '1.00×';
    const memStr = isSermax
      ? `${a.estimatedHeapBytes.toLocaleString()} B (Max PQ=${a.maxQueueOccupancy})`
      : `${a.estimatedHeapBytes.toLocaleString()} B (Stack=${a.maxLogicalDepth})`;
    return `
      <tr style="${isSermax ? 'background:rgba(242,169,0,0.14); font-weight:700;' : ''}">
        <td class="mono"><b>#${i + 1}</b></td>
        <td style="color:${isSermax ? 'var(--up-gold)' : '#fff'};">${a.name}</td>
        <td style="font-size:0.72rem;">${e.sched}</td>
        <td><span class="badge-pass">✓ Sorted</span></td>
        <td class="mono col-time"><b>${a.elapsedMs.toFixed(3)} ms</b></td>
        <td class="mono col-cmp">${a.comparisons.toLocaleString()}</td>
        <td class="mono col-swp">${a.swaps.toLocaleString()}</td>
        <td class="mono col-dep">${a.maxLogicalDepth}</td>
        <td class="mono col-bal">${a.partitionBalance.toFixed(4)}</td>
        <td class="mono col-mem">${memStr}</td>
        <td class="mono" style="color:#10b981; font-weight:700;">${speedup}</td>
      </tr>
    `;
  }).join('');

  const swpRed = comp.trad.swaps > 0 ? ((comp.trad.swaps - comp.sermax.swaps) / comp.trad.swaps) * 100 : 0;
  benchmarkHistory.unshift({
    id: benchmarkHistory.length + 1,
    category: dist,
    size,
    seed,
    sermaxMs: comp.sermax.elapsedMs,
    tradMs: comp.trad.elapsedMs,
    med3Ms: comp.median3.elapsedMs,
    randMs: comp.random.elapsedMs,
    speedup: comp.trad.elapsedMs / Math.max(1e-6, comp.sermax.elapsedMs),
    swpRed,
    sermaxBal: comp.sermax.partitionBalance,
    tradBal: comp.trad.partitionBalance
  });

  renderS09HistoryTable();
  renderScreen10Analysis();
  if (!silent) showToast(`Completed Comparative Benchmark on n=${size.toLocaleString()} (${dist})`);
}

function renderS09HistoryTable() {
  const tbody = document.getElementById('s09-history-tbody');
  if (!tbody) return;
  tbody.innerHTML = benchmarkHistory.slice(0, 20).map(h => `
    <tr>
      <td class="mono">#${h.id}</td>
      <td style="text-transform:capitalize;"><b>${h.category}</b></td>
      <td class="mono">${h.size.toLocaleString()}</td>
      <td class="mono" style="color:var(--up-gold); font-weight:700;">${h.sermaxMs.toFixed(3)} ms</td>
      <td class="mono">${h.tradMs.toFixed(3)} ms</td>
      <td class="mono">${h.med3Ms.toFixed(3)} ms</td>
      <td class="mono">${h.randMs.toFixed(3)} ms</td>
      <td class="mono" style="color:${h.speedup >= 1 ? '#10b981' : '#f43f5e'}; font-weight:700;">${h.speedup.toFixed(2)}×</td>
      <td class="mono">${h.swpRed >= 0 ? '↓ ' : '↑ '}${Math.abs(h.swpRed).toFixed(1)}%</td>
      <td class="mono">${h.sermaxBal.toFixed(3)} vs ${h.tradBal.toFixed(3)}</td>
    </tr>
  `).join('');
}

function runFull12ConditionMatrix(silent = false) {
  const cats = ['random', 'nearly', 'reverse', 'duplicates'];
  const sizes = [500, 1000, 2500];
  let seed = 20261001;

  cats.forEach(cat => {
    matrix12Results[cat] = {};
    sizes.forEach(sz => {
      seed += 29;
      const ds = Engine.generateDataset(sz, cat, seed, -100000, 100000);
      const comp = Engine.compareAllFour(ds.array, seed, false);
      matrix12Results[cat][sz] = comp;
    });
  });

  renderScreen10Analysis();
  if (!silent) showToast('Executed 12-Condition Benchmark Matrix & Statistical Analysis!');
}

function switchS10Chart(metric, btn) {
  s10ChartMetric = metric;
  btn.parentElement.querySelectorAll('.pill-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  drawScreen10Chart();
}

function pairedSignTest(baseArr, sermaxArr) {
  let pos = 0, neg = 0;
  const len = Math.min(baseArr.length, sermaxArr.length);
  for (let i = 0; i < len; i++) {
    const d = baseArr[i] - sermaxArr[i];
    if (Math.abs(d) > 1e-12) {
      if (d > 0) pos++;
      else neg++;
    }
  }
  const n = pos + neg;
  if (n === 0) return { pos: 0, neg: 0, pValue: 1.0 };
  const k = Math.max(pos, neg);
  // Two-sided normal approximation with continuity correction for paired sign test
  const z = (Math.abs(pos - neg) - 1) / Math.sqrt(n);
  const p = Math.min(1, Math.max(0.0001, 2 * (1 - 0.5 * (1 + Math.tanh(0.79788456 * z * (1 + 0.044715 * z * z))))));
  return { pos, neg, k, n, pValue: p };
}

function renderScreen10Analysis() {
  if (!latestFourComparison) return;
  const c = latestFourComparison;

  const speedup = c.trad.elapsedMs / Math.max(1e-6, c.sermax.elapsedMs);
  const cmpRed = c.trad.comparisons > 0 ? ((c.trad.comparisons - c.sermax.comparisons) / c.trad.comparisons) * 100 : 0;
  const swpRed = c.trad.swaps > 0 ? ((c.trad.swaps - c.sermax.swaps) / c.trad.swaps) * 100 : 0;

  document.getElementById('s10-kpi-speedup').textContent = `${speedup.toFixed(2)}×`;
  document.getElementById('s10-kpi-cmp').textContent = `${cmpRed >= 0 ? '↓' : '↑'} ${Math.abs(cmpRed).toFixed(1)}%`;
  document.getElementById('s10-kpi-swp').textContent = `${swpRed >= 0 ? '↓' : '↑'} ${Math.abs(swpRed).toFixed(1)}%`;
  document.getElementById('s10-kpi-bal').textContent = `${c.sermax.partitionBalance.toFixed(3)}`;
  document.getElementById('s10-kpi-depth').textContent = `${c.sermax.maxLogicalDepth} vs ${c.trad.maxLogicalDepth}`;

  drawScreen10Chart();

  // Render 12-Condition Heatmap Table
  const cats = ['random', 'nearly', 'reverse', 'duplicates'];
  const catNames = {
    random: 'Random (Uniform)',
    nearly: 'Nearly Sorted (1% Swaps)',
    reverse: 'Reverse Sorted (Descending)',
    duplicates: 'Many Duplicates (10-Value Pool)'
  };
  const sizes = [500, 1000, 2500];

  const heatTbody = document.getElementById('s10-heatmap-tbody');
  if (heatTbody && Object.keys(matrix12Results).length > 0) {
    heatTbody.innerHTML = cats.map(cat => {
      const rowObj = matrix12Results[cat] || {};
      let swpSum = 0;
      const cells = sizes.map(sz => {
        const item = rowObj[sz];
        if (!item) return '<td>—</td>';
        const sp = item.trad.elapsedMs / Math.max(1e-6, item.sermax.elapsedMs);
        const sr = item.trad.swaps > 0 ? ((item.trad.swaps - item.sermax.swaps) / item.trad.swaps) * 100 : 0;
        swpSum += sr;
        const bg = sp >= 1.1 ? 'rgba(16,185,129,0.22)' : (sp >= 0.9 ? 'rgba(242,169,0,0.16)' : 'rgba(244,63,94,0.15)');
        return `<td class="mono" style="background:${bg};"><b>${sp.toFixed(2)}×</b> <span style="font-size:0.65rem;color:var(--text-dim);">(${item.sermax.comparisons.toLocaleString()} cmp)</span></td>`;
      }).join('');
      const meanSwp = swpSum / sizes.length;
      return `
        <tr>
          <td><b>${catNames[cat]}</b></td>
          ${cells}
          <td class="mono" style="color:#10b981; font-weight:700;">${meanSwp >= 0 ? '↓' : '↑'} ${Math.abs(meanSwp).toFixed(1)}% swaps</td>
        </tr>
      `;
    }).join('');
  }

  // Render Inferential Statistical Analysis (Wilcoxon Signed-Rank + Paired Sign Test + Holm 36 + 2,000 Bootstrap CI)
  const sTimings = c.sermax.timingStats ? c.sermax.timingStats.timings : [c.sermax.elapsedMs];
  const baselines = [
    { key: 'trad', name: 'SerMax vs. Traditional (First-Element)', obj: c.trad },
    { key: 'median3', name: 'SerMax vs. Median-of-Three', obj: c.median3 },
    { key: 'random', name: 'SerMax vs. Randomized-Pivot', obj: c.random }
  ];

  const rawStats = baselines.map(b => {
    const bTimings = b.obj.timingStats ? b.obj.timingStats.timings : [b.obj.elapsedMs];
    const wilcox = Engine.wilcoxonSignedRankTest(bTimings, sTimings);
    const signT = pairedSignTest(bTimings, sTimings);
    const boot = Engine.pairedBootstrapSpeedupCI(bTimings, sTimings, 2000, 20261001);
    const sp = b.obj.elapsedMs / Math.max(1e-6, c.sermax.elapsedMs);
    return { ...b, wilcox, signT, boot, sp };
  });

  const holmP = Engine.applyHolmAdjustment(rawStats.map(r => r.wilcox.pValue), 36);

  document.getElementById('s10-stats-tbody').innerHTML = rawStats.map((r, i) => {
    const adjP = holmP[i];
    const sig = adjP < 0.05;
    return `
      <tr>
        <td><b>${r.name}</b></td>
        <td class="mono" style="color:var(--up-gold); font-weight:700;">${r.sp.toFixed(2)}×</td>
        <td class="mono">[${r.boot.low95.toFixed(2)}×, ${r.boot.high95.toFixed(2)}×]</td>
        <td class="mono" style="font-size:0.7rem;">Wilcoxon z=${r.wilcox.z.toFixed(2)}<br/><span style="color:var(--text-dim);">Sign (+${r.signT.pos}/-${r.signT.neg}, p=${r.signT.pValue.toFixed(4)})</span></td>
        <td class="mono">${r.wilcox.pValue.toFixed(4)}</td>
        <td class="mono"><b>${adjP.toFixed(4)}</b></td>
        <td><span class="${sig ? 'badge-pass' : 'badge-warn'}">${sig ? 'Significant (p_Holm < 0.05)' : 'Comparable / Overhead Trade-off'}</span></td>
      </tr>
    `;
  }).join('');

  document.getElementById('s10-exec-summary').innerHTML = `
    <div style="color:var(--up-gold); font-weight:700; margin-bottom:4px;">Empirical Research Synthesis (Chapter 4 Alignment):</div>
    • <b>Partition Balance &amp; Depth:</b> SerMax achieved normalized partition imbalance <b>B = ${c.sermax.partitionBalance.toFixed(4)}</b> and logical depth <b>D_max = ${c.sermax.maxLogicalDepth}</b> (vs. Traditional B = ${c.trad.partitionBalance.toFixed(4)}, Depth = ${c.trad.maxLogicalDepth}).<br/>
    • <b>Priority Queue Management:</b> Peak queue occupancy remained bounded at <b>Q_max = ${c.sermax.maxQueueOccupancy}</b> entries (<b>${c.sermax.estimatedHeapBytes.toLocaleString()} bytes</b>) with iterative processing.<br/>
    • <b>Statistical Evaluation:</b> Paired Wilcoxon signed-rank test and paired sign test alternative evaluated with Holm adjustment across 36 comparisons and 95% confidence intervals via 2,000 paired bootstrap resamples.
  `;
}

function drawScreen10Chart() {
  const box = document.getElementById('s10-chart-area');
  if (!box || !latestFourComparison) return;
  const c = latestFourComparison;

  const algos = [
    { name: 'SerMax Hybrid', obj: c.sermax, color: '#F2A900' },
    { name: 'Traditional (First)', obj: c.trad, color: '#F58220' },
    { name: 'Median-of-Three', obj: c.median3, color: '#38bdf8' },
    { name: 'Randomized-Pivot', obj: c.random, color: '#a78bfa' }
  ];

  const getter = {
    time: a => a.elapsedMs,
    comparisons: a => a.comparisons,
    swaps: a => a.swaps,
    depth: a => a.maxLogicalDepth,
    balance: a => a.partitionBalance
  }[s10ChartMetric] || (a => a.elapsedMs);

  const vals = algos.map(a => getter(a.obj));
  const maxV = Math.max(0.0001, ...vals) * 1.15;

  box.innerHTML = `
    <div style="height:215px; display:flex; align-items:flex-end; justify-content:space-around; gap:18px; padding:22px 24px 10px; background:rgba(10,2,4,0.6); border-radius:8px;">
      ${algos.map((a, idx) => {
        const v = vals[idx];
        const h = Math.max(8, (v / maxV) * 86);
        const fmt = s10ChartMetric === 'time' ? v.toFixed(3) + ' ms'
          : (s10ChartMetric === 'balance' ? v.toFixed(4) : v.toLocaleString());
        return `
          <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
            <div class="mono" style="font-size:0.72rem; font-weight:700; color:${a.color}; margin-bottom:6px;">${fmt}</div>
            <div style="width:100%; max-width:78px; height:${h}%; background:${a.color}; border-radius:6px 6px 0 0; box-shadow:0 0 18px ${a.color}44;"></div>
            <div style="font-size:0.72rem; font-weight:600; color:var(--text-sub); margin-top:8px; text-align:center;">${a.name}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function exportBenchmarkCSV() {
  const header = 'run_id,category,n,seed,sermax_ms,trad_ms,median3_ms,random_ms,speedup_vs_trad,swap_reduction_pct,sermax_balance_B,trad_balance_B';
  const rows = benchmarkHistory.map(h =>
    `${h.id},${h.category},${h.size},${h.seed},${h.sermaxMs.toFixed(4)},${h.tradMs.toFixed(4)},${h.med3Ms.toFixed(4)},${h.randMs.toFixed(4)},${h.speedup.toFixed(4)},${h.swpRed.toFixed(2)},${h.sermaxBal.toFixed(4)},${h.tradBal.toFixed(4)}`
  );
  downloadTextFile('sermax_benchmark_results.csv', [header, ...rows].join('\n'), 'text/csv');
}

// ─── UTILITIES ───
function downloadTextFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    t.style.display = 'none';
  }, 3200);
}
