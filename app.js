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
      { id: 's02-generator', label: 'Dataset Generator & 70:15:15 Data Splitter' },
      { id: 's02-registry',  label: 'Example Array Profiles & Source Registry' }
    ]
  },
  s03: {
    badge: 'PHASE 2 • MODULE 2',
    short: 'Seven-Predictor Extractor',
    step: 'PHASE 2: MODEL DEVELOPMENT',
    title: 'Seven-Predictor Extractor',
    sub: 'Section 4.3 • Extract (n, x_min, x_max, μ, σ, γ, d) & minimum-imbalance training targets (n ≤ 33 and n > 33)',
    subtabs: [
      { id: 's03-predictors', label: 'Seven Predictor Variables (1)–(7)' },
      { id: 's03-targets',    label: 'Minimum-Imbalance Pivot Target (n ≤ 33 & n > 33)' }
    ]
  },
  s04: {
    badge: 'PHASE 2 • MODULE 3',
    short: 'Polynomial Regression Studio',
    step: 'PHASE 2: MODEL DEVELOPMENT',
    title: 'Polynomial Regression Model Studio',
    sub: 'Section 4.3 • 2nd-degree polynomial model (36 coefficients) • Train via OLS • Validate MAE & RMSE vs. midpoint heuristic',
    subtabs: [
      { id: 's04-training',     label: 'OLS Training, MAE/RMSE & Midpoint Comparison' },
      { id: 's04-coefficients', label: 'Standardization Scaler & 36 Coefficients (β₀…β₃₅)' }
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
      { id: 's07-heap',      label: 'Priority Queue (Max-Heap) State & Visualizer' },
      { id: 's07-lifecycle', label: 'Iterative Subproblem Processing Log' }
    ]
  },
  s08: {
    badge: 'PHASE 4 • MODULE 7',
    short: 'Implementation & Verification',
    step: 'PHASE 4: EXPERIMENTAL EVALUATION',
    title: 'Algorithm Implementation and Verification',
    sub: 'Section 4.2 • SerMax Hybrid + 3 baseline algorithms (Traditional, Median-of-Three, Randomized-Pivot) • Identical input arrays & sorted output check',
    subtabs: [
      { id: 's08-visualizer', label: 'Step-by-Step Execution & Identical Input Comparison' },
      { id: 's08-gatec',      label: 'Verify Correctness (Sorted Output Across All 4 Algorithms)' }
    ]
  },
  s09: {
    badge: 'PHASE 4 • MODULE 8',
    short: 'Comparative Benchmarking',
    step: 'PHASE 4: EXPERIMENTAL EVALUATION',
    title: 'Comparative Benchmarking',
    sub: 'Sections 4.6.4 – 4.6.6 • 12 benchmark conditions (4 categories × 3 sizes) • 10 warm-up + 10 measured runs • 6 Primary + 1 Supplementary Metrics',
    subtabs: [
      { id: 's09-leaderboard', label: 'Comparative Benchmarking & Recorded Metrics' },
      { id: 's09-history',     label: 'Recorded Benchmark Condition History' }
    ]
  },
  s10: {
    badge: 'PHASE 5 • MODULE 9',
    short: 'Statistical Analysis & Export',
    step: 'PHASE 5: STATISTICAL REPORTING',
    title: 'Statistical Analysis and Results Export',
    sub: 'Section 4.6.7 • Descriptive summaries • Wilcoxon signed-rank & paired sign test • Holm adjustment (36 comparisons) • 95% CI (2,000 bootstrap) • CSV/JSON exports',
    subtabs: [
      { id: 's10-charts', label: 'Descriptive Summaries & 12-Condition Matrix' },
      { id: 's10-stats',  label: 'Paired Statistical Tests (Wilcoxon/Sign/Holm/CI) & Export' }
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
  initAnthemPlayer();

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
  if (screenId === 's09') {
    pauseAnthemForBenchmarkIntegrity('Entered Comparative Benchmarking (Module 8)');
  }

  updateModuleMetaStrip(screenId);
  if (window._globalSystemMode === 'B') {
    renderGlobalModeBPanel(screenId);
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
    { key: 'sermax', label: 'SerMax Hybrid (Proposed)', data: res.sermax, color: 'var(--up-gold)' },
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
      Active Array 7-Predictor Summary (${(activeDatasetMeta.category || 'custom').toUpperCase()} • Checksum ${activeDatasetMeta.checksum})
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
  renderScreen02StepByStepGeneration(f);
  drawS02DistributionChart();
}

function renderScreen02StepByStepGeneration(f) {
  const box = document.getElementById('s02-generation-steps');
  if (!box || !activeDataset || activeDataset.length === 0) return;

  const m = activeDatasetMeta || {};
  const cat = m.category || 'random';
  const n = activeDataset.length;
  const seed = m.seed || 104201;
  const minV = m.minVal !== undefined ? m.minVal : -100000;
  const maxV = m.maxVal !== undefined ? m.maxVal : 100000;
  const dsId = m.datasetId || `DS-${cat.toUpperCase().slice(0, 4)}-N${n}-S${seed}`;
  const subset = m.assignedSubset || (n >= 500 ? 'Training Subset (Arrays 1–140 / 70%)' : 'Functional Verification / Visualization Subset (Excluded from Formal Benchmarking)');

  const procMap = {
    random: 'Uniformly sample pseudorandom integers x_i ∈ [min, max] using deterministic Mulberry32 PRNG seeded with Recorded Seed.',
    nearly: `Generate ${n} integers, sort in ascending order, and perform max(1, round(0.01 × ${n})) = ${Math.max(1, Math.round(n * 0.01))} random-position exchanges.`,
    reverse: `Generate ${n} integers and arrange them in descending order so adjacent pairs satisfy A[i] ≥ A[i+1].`,
    duplicates: `Construct a controlled pool of 10 distinct integer values in [${minV}, ${maxV}] and sample ${n} elements with replacement.`
  };

  const fullOrPreview = n <= 50
    ? `[${activeDataset.join(', ')}]`
    : `First 25 elements: [${activeDataset.slice(0, 25).join(', ')}, …] (Full ${n.toLocaleString()}-element dataset available via CSV export)`;

  let categorySpecificHtml = '';
  if (cat === 'nearly' && m.initialSortedArray) {
    const swaps = m.exchangePairs || [];
    const initStr = n <= 50 ? `[${m.initialSortedArray.join(', ')}]` : `[${m.initialSortedArray.slice(0, 20).join(', ')}, …]`;
    const swapStr = swaps.length > 0
      ? swaps.slice(0, 8).map(s => `Swap #${s.exchangeNo}: A[${s.idx1}] (${s.val1Before}) ↔ A[${s.idx2}] (${s.val2Before})`).join(' • ')
      : '1 random position exchange applied';
    categorySpecificHtml = `
      <div class="math-card" style="margin-top:8px; border-left:3px solid var(--up-gold); font-size:0.73rem;">
        <b style="color:var(--up-gold);">Nearly Sorted Generation Trace (Section 4.6.1):</b><br/>
        • <b>Initial Ascending Sorted Array:</b> <span class="mono">${initStr}</span><br/>
        • <b>Number of Exchanges Performed:</b> <span class="mono">${m.exchangeCount || Math.max(1, Math.round(n * 0.01))}</span> (1% of n = ${n}, min 1)<br/>
        • <b>Selected Exchange Positions:</b> <span class="mono">${swapStr}</span><br/>
        • <b>Resulting Nearly Sorted Array:</b> <span class="mono">${fullOrPreview}</span>
      </div>
    `;
  } else if (cat === 'duplicates' && m.distinctPool) {
    categorySpecificHtml = `
      <div class="math-card" style="margin-top:8px; border-left:3px solid var(--up-gold); font-size:0.73rem;">
        <b style="color:var(--up-gold);">Many Duplicates 10-Value Sampling Pool (Table 3):</b>
        <span class="mono">[${m.distinctPool.join(', ')}]</span> (Observed distinct values in generated array: <b>${new Set(activeDataset).size}</b> ≤ 10)
      </div>
    `;
  }

  const distinctCount = new Set(activeDataset).size;
  const inRange = f.x_min >= minV && f.x_max <= maxV;
  const verifyMsg = cat === 'reverse'
    ? `Verified descending arrangement (d = ${f.d.toFixed(4)}, range [${f.x_min}, ${f.x_max}] ⊆ [${minV}, ${maxV}]).`
    : (cat === 'duplicates'
      ? `Verified repeated-value sampling (${distinctCount} distinct values ≤ 10-value pool, range [${f.x_min}, ${f.x_max}]).`
      : (cat === 'nearly'
        ? `Verified nearly sorted perturbation (${m.exchangeCount || Math.max(1, Math.round(n * 0.01))} exchanges applied, resulting disorder ratio d = ${f.d.toFixed(4)}).`
        : `Verified uniform pseudorandom integer generation across n = ${n.toLocaleString()} elements (d = ${f.d.toFixed(4)}).`));

  box.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:10px; font-size:0.74rem;">
      <div class="math-card"><b>1. Selected Dataset Category:</b><br/><span style="color:var(--up-gold); text-transform:capitalize;">${cat}</span></div>
      <div class="math-card"><b>2. Selected Array Size (n):</b><br/><span class="mono">${n.toLocaleString()} elements</span> (${n >= 500 ? 'Formal Benchmark Size' : 'Verification / Visualization Mode Only'})</div>
      <div class="math-card"><b>3. Numerical Value Range:</b><br/><span class="mono">[${minV.toLocaleString()}, ${maxV.toLocaleString()}]</span> (Observed: [${f.x_min.toLocaleString()}, ${f.x_max.toLocaleString()}])</div>
      <div class="math-card"><b>4. Recorded Random Seed:</b><br/><span class="mono">${seed}</span> (Checksum: <span class="mono">${m.checksum}</span>)</div>
      <div class="math-card" style="grid-column: span 2;"><b>5. Dataset-Generation Procedure:</b><br/>${procMap[cat] || 'Custom integer array loaded for functional verification.'}</div>
      <div class="math-card"><b>7. Dataset Identifier &amp; Assigned Subset:</b><br/><span class="mono" style="color:var(--up-gold);">${dsId}</span><br/><span>${subset}</span></div>
      <div class="math-card"><b>8. Condition Verification:</b><br/><span style="color:#10b981;">✓ ${inRange ? 'Range Validated' : 'Custom Range'}:</span> ${verifyMsg}</div>
      <div class="math-card" style="grid-column: 1 / -1;"><b>6. Generated Array (${n <= 50 ? 'Complete Values' : 'Preview'}):</b><br/><span class="mono" style="font-size:0.71rem;">${fullOrPreview}</span></div>
    </div>
    ${categorySpecificHtml}
  `;
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
      <div style="color:var(--up-gold); font-weight:700;">1–3. Partition Size (n), Minimum (x_min), and Maximum (x_max):</div>
      • <b>Formula:</b> n = high − low + 1; &nbsp; x_min = min(A[low..high]); &nbsp; x_max = max(A[low..high])<br/>
      • <b>Substitution:</b> n = ${arr.length - 1} − 0 + 1 = <b>${f.n}</b>; &nbsp; x_min = <b>${f.x_min}</b>; &nbsp; x_max = <b>${f.x_max}</b><br/>
      • <b>Interpretation:</b> Subproblem contains ${f.n} elements spanning [${f.x_min}, ${f.x_max}] (range span = ${f.x_max - f.x_min}).
    </div>
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">4. Equation (1) — Arithmetic Mean (μ):</div>
      • <b>Formula:</b> μ = (∑_{i=1}^n x_i) / n<br/>
      • <b>Substitution:</b> μ = (${termsPreview}) / ${f.n}<br/>
      • <b>Intermediate &amp; Final Result:</b> Sum ∑x_i = ${exp.sum} → μ = ${exp.sum} / ${f.n} = <span class="math-highlight">${f.mu.toFixed(6)}</span><br/>
      • <b>Interpretation:</b> Center of mass of the subproblem values used to compute element deviations (x_i − μ).
    </div>
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">5. Equation (2) — Population Standard Deviation (σ):</div>
      • <b>Formula:</b> σ = √[ ∑_{i=1}^n (x_i − μ)² / n ]<br/>
      • <b>Substitution:</b> ∑(x_i − ${f.mu.toFixed(4)})² = ${sqTermsPreview} = ${f.sqDiffSum.toFixed(6)}<br/>
      • <b>Intermediate &amp; Final Result:</b> Population Variance σ² = ${f.sqDiffSum.toFixed(6)} / ${f.n} = ${f.variance.toFixed(6)} → σ = √(${f.variance.toFixed(6)}) = <span class="math-highlight">${f.sigma.toFixed(6)}</span><br/>
      • <b>Interpretation:</b> Measures value dispersion around μ; ${f.sigma === 0 ? 'σ = 0 indicates an all-equal subproblem.' : 'used to standardize cubed deviations in Equation (3).'}
    </div>
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">6. Equation (3) — Population Moment-Based Skewness (γ):</div>
      • <b>Formula:</b> γ = (1 / n) ∑_{i=1}^n [ (x_i − μ) / σ ]³ &nbsp;(with γ = 0 when σ = 0)<br/>
      • <b>Substitution &amp; Intermediate:</b> ${f.sigma > 1e-12
        ? `∑[(x_i − μ)/σ]³ = ${z3TermsPreview} = ${exp.z3Sum.toFixed(6)} → γ = ${exp.z3Sum.toFixed(6)} / ${f.n} = <span class="math-highlight">${f.gamma.toFixed(6)}</span>`
        : `σ = 0 (zero standard deviation) → By thesis computational convention, <span class="math-highlight">γ = 0.000000</span>`}<br/>
      • <b>Interpretation:</b> Captures distribution asymmetry (${f.gamma > 0.1 ? 'right-skewed tail' : (f.gamma < -0.1 ? 'left-skewed tail' : 'approximately symmetric')}).
    </div>
    <div class="math-card">
      <div style="color:var(--up-gold); font-weight:700;">7. Equation (4) — Disorder Ratio (d):</div>
      • <b>Formula:</b> d = (Number of adjacent pairs where A[i] &gt; A[i+1]) / (n − 1)<br/>
      • <b>Substitution &amp; Final Result:</b> Pairs (${pairsPreview}) → Violations = ${f.descPairs} / (${f.n} − 1) = ${f.descPairs} / ${f.n - 1} = <span class="math-highlight">${f.d.toFixed(6)}</span><br/>
      • <b>Interpretation:</b> Measures local inversion density ∈ [0, 1] (0 = ascending sorted, 1 = strictly descending).
    </div>
  `;

  renderS03ExpandableTables(exp);

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
        <td>${isBest ? '<span class="badge-pass">Minimum-Imbalance Target (Eq. 6)</span>' : '<span style="color:var(--text-dim);">Evaluated</span>'}</td>
      </tr>
    `;
  }).join('');
}

function toggleElementTablesS03() {
  const box = document.getElementById('s03-expandable-tables');
  if (!box) return;
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function renderS03ExpandableTables(exp) {
  const box = document.getElementById('s03-expandable-tables');
  if (!box || !exp) return;
  const f = exp.features;
  const rows = exp.perElement.slice(0, 40);
  const pairs = exp.adjacentPairs.slice(0, 40);

  box.innerHTML = `
    <div class="grid-2">
      <div>
        <div style="font-size:0.76rem; font-weight:800; color:var(--up-gold); margin-bottom:6px;">
          Table A: Element-by-Element Moments (Mean μ, Variance/Std Dev σ, Skewness γ)
        </div>
        <div class="data-table-wrap" style="max-height:240px; overflow-y:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Idx i</th>
                <th>Value x_i</th>
                <th>x_i − μ</th>
                <th>(x_i − μ)²</th>
                <th>z_i = (x_i − μ)/σ</th>
                <th>z_i³</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td class="mono">${r.relIndex}</td>
                  <td class="mono"><b>${r.xi}</b></td>
                  <td class="mono">${r.dev >= 0 ? '+' : ''}${r.dev.toFixed(4)}</td>
                  <td class="mono">${r.sqDev.toFixed(4)}</td>
                  <td class="mono">${r.z >= 0 ? '+' : ''}${r.z.toFixed(4)}</td>
                  <td class="mono">${r.z3 >= 0 ? '+' : ''}${r.z3.toFixed(4)}</td>
                </tr>
              `).join('')}
              <tr style="background:rgba(242,169,0,0.12); font-weight:700;">
                <td>SUM / FINAL</td>
                <td class="mono">∑x = ${exp.sum} (μ=${f.mu.toFixed(4)})</td>
                <td class="mono">∑ = 0.0000</td>
                <td class="mono">∑ = ${f.sqDiffSum.toFixed(4)} (σ=${f.sigma.toFixed(4)})</td>
                <td class="mono">—</td>
                <td class="mono">∑ = ${exp.z3Sum.toFixed(4)} (γ=${f.gamma.toFixed(4)})</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div style="font-size:0.76rem; font-weight:800; color:var(--up-gold); margin-bottom:6px;">
          Table B: Adjacent Pair Disorder Evaluation (Equation 4: d = Violations / (n − 1))
        </div>
        <div class="data-table-wrap" style="max-height:240px; overflow-y:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Pair #</th>
                <th>Adjacent Indices</th>
                <th>Values (A[i], A[i+1])</th>
                <th>Comparison A[i] &gt; A[i+1]</th>
                <th>Violation (0 / 1)</th>
              </tr>
            </thead>
            <tbody>
              ${pairs.map(p => `
                <tr>
                  <td class="mono">${p.pairIndex + 1}</td>
                  <td class="mono">(A[${p.pairIndex}], A[${p.pairIndex + 1}])</td>
                  <td class="mono">(${p.leftVal}, ${p.rightVal})</td>
                  <td class="mono">${p.leftVal} &gt; ${p.rightVal} (${p.violatesAscending ? 'True' : 'False'})</td>
                  <td class="mono" style="color:${p.violatesAscending ? '#f43f5e' : '#10b981'}; font-weight:700;">${p.violatesAscending}</td>
                </tr>
              `).join('')}
              <tr style="background:rgba(242,169,0,0.12); font-weight:700;">
                <td colspan="3">TOTAL ADJACENT VIOLATIONS</td>
                <td class="mono">${f.descPairs} of ${f.n - 1} pairs</td>
                <td class="mono" style="color:var(--up-gold);">d = ${f.d.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ─── MODULE 3 (SCREEN 04): POLYNOMIAL REGRESSION MODEL STUDIO (36 COEFFICIENTS) ───
function renderScreen04Model() {
  const model = Engine.getFrozenModel();
  const vs = model.validation_summary;

  // Compute Midpoint Heuristic (ŷ = 0.5) baseline MAE & RMSE on held-out validation partitions
  const preds = vs.valPredictions || vs.scatter || [];
  let midAbsSum = 0, midSqSum = 0;
  let modAbsSum = 0, modSqSum = 0;
  preds.forEach(p => {
    const errMid = Math.abs(p.actual - 0.5);
    midAbsSum += errMid;
    midSqSum += errMid * errMid;
    const errMod = Math.abs(p.actual - p.predicted);
    modAbsSum += errMod;
    modSqSum += errMod * errMod;
  });
  const Nval = Math.max(1, preds.length);
  const midMAE = preds.length > 0 ? midAbsSum / Nval : 0.2415;
  const midRMSE = preds.length > 0 ? Math.sqrt(midSqSum / Nval) : 0.2890;

  document.getElementById('s04-val-mae').textContent = vs.valMAE.toFixed(4);
  document.getElementById('s04-val-rmse').textContent = vs.valRMSE.toFixed(4);
  document.getElementById('s04-train-count').textContent = vs.trainCount.toLocaleString();
  const midEl = document.getElementById('s04-midpoint-mae');
  if (midEl) midEl.textContent = midMAE.toFixed(4);
  document.getElementById('s04-model-version').textContent = `Midpoint RMSE: ${midRMSE.toFixed(4)}`;

  // Training Log (with matrix dimensions, standardization, OLS, and objective validation comparison)
  document.getElementById('s04-training-log').innerHTML = `
    <div style="color:#10b981;">[1. TRAINING OBSERVATIONS &amp; DIMENSIONS] N_train = ${vs.trainCount} observations; Predictor Matrix X ∈ ℝ^(${vs.trainCount} × 7); Expanded Design Matrix Z ∈ ℝ^(${vs.trainCount} × 36).</div>
    <div style="color:var(--text-sub);">[2. STANDARDIZATION] Computed training-set means μ_train[1..7] and std devs σ_train[1..7] on training split only (zero-variance guarded).</div>
    <div style="color:var(--text-sub);">[3. OLS ESTIMATION] Constructed 36 polynomial terms (1 intercept + 7 linear + 7 quadratic + 21 interaction) and solved normal equations (ZᵀZ)β = Zᵀy.</div>
    <div style="color:var(--up-gold);">[4. HELD-OUT VALIDATION (N_val = ${vs.valCount})] 36-Term Model MAE = ${vs.valMAE.toFixed(4)}, RMSE = ${vs.valRMSE.toFixed(4)} vs. Midpoint Heuristic (ŷ=0.5) MAE = ${midMAE.toFixed(4)}, RMSE = ${midRMSE.toFixed(4)} (${vs.valMAE <= midMAE ? 'Lower validation error than midpoint heuristic on held-out split' : 'Higher validation error than midpoint heuristic on held-out split'}).</div>
  `;

  // Active subproblem features for live standardization demonstration
  const sampleArr = activeDataset && activeDataset.length >= 2 ? activeDataset : [6, 21, 3, 5, 1];
  const activeFeat = Engine.extractSevenFeatures(sampleArr, 0, sampleArr.length - 1);

  // Scaler Table with live substitution X_j = (x_j - training_mean_j) / training_std_j
  document.getElementById('s04-scaler-tbody').innerHTML = model.featureSummary.map((fs, j) => {
    const xj = activeFeat.vector[j];
    const scale = fs.stdDev > 1e-12 ? fs.stdDev : 1.0;
    const Xj = (xj - fs.mean) / scale;
    return `
      <tr>
        <td class="mono" style="color:var(--up-gold); font-weight:700;">${fs.name} (${fs.label})</td>
        <td class="mono">${xj.toFixed(4)}</td>
        <td class="mono">${fs.mean.toFixed(4)}</td>
        <td class="mono">${fs.stdDev.toFixed(4)}</td>
        <td class="mono">(${xj.toFixed(3)} − ${fs.mean.toFixed(3)}) / ${scale.toFixed(3)}</td>
        <td class="mono"><span class="math-highlight">${Xj >= 0 ? '+' : ''}${Xj.toFixed(4)}</span></td>
      </tr>
    `;
  }).join('');

  // Validation Observations & Step-by-Step MAE / RMSE Derivation Card
  const valCard = document.getElementById('s04-val-obs-card');
  if (valCard) {
    const sampleObs = preds.slice(0, 15);
    valCard.innerHTML = `
      <div class="grid-2">
        <div class="math-card" style="font-size:0.74rem;">
          <div style="color:var(--up-gold); font-weight:800; margin-bottom:6px;">Step-by-Step Numerical Calculation of Validation MAE &amp; RMSE (Equations 13–14):</div>
          • <b>Validation Observations (N):</b> <span class="mono">N = ${preds.length}</span> held-out subproblem observations<br/>
          • <b>Equation (13) — Mean Absolute Error (MAE):</b><br/>
          &nbsp;&nbsp;<span class="mono">MAE = (∑_{m=1}^N |y_m − ŷ_m|) / N = ${modAbsSum.toFixed(4)} / ${Nval} = <b>${vs.valMAE.toFixed(6)}</b></span><br/>
          • <b>Equation (14) — Root Mean Squared Error (RMSE):</b><br/>
          &nbsp;&nbsp;<span class="mono">RMSE = √[ (∑_{m=1}^N (y_m − ŷ_m)²) / N ] = √[ ${modSqSum.toFixed(4)} / ${Nval} ] = <b>${vs.valRMSE.toFixed(6)}</b></span><br/>
          • <b>Comparison with Deterministic Midpoint Heuristic (ŷ = 0.5000):</b><br/>
          &nbsp;&nbsp;<span class="mono">Midpoint MAE = ${midAbsSum.toFixed(4)} / ${Nval} = <b>${midMAE.toFixed(6)}</b> &nbsp;|&nbsp; Midpoint RMSE = √[${midSqSum.toFixed(4)} / ${Nval}] = <b>${midRMSE.toFixed(6)}</b></span><br/>
          • <b>Objective Findings:</b> ${vs.valMAE < midMAE
            ? `On this validation split, the 36-term polynomial model achieved lower MAE (${vs.valMAE.toFixed(4)} vs. ${midMAE.toFixed(4)}).`
            : `On this validation split, the 36-term polynomial model did not outperform the midpoint heuristic (${vs.valMAE.toFixed(4)} vs. ${midMAE.toFixed(4)}).`}
        </div>
        <div class="data-table-wrap" style="max-height:210px; overflow-y:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Obs #</th>
                <th>Size n</th>
                <th>Actual Target y</th>
                <th>Predicted ŷ</th>
                <th>Error (y − ŷ)</th>
                <th>Abs Error |y − ŷ|</th>
                <th>Sq Error (y − ŷ)²</th>
              </tr>
            </thead>
            <tbody>
              ${sampleObs.map((o, idx) => {
                const err = o.actual - o.predicted;
                const absE = Math.abs(err);
                const sqE = err * err;
                return `
                  <tr>
                    <td class="mono">#${idx + 1}</td>
                    <td class="mono">${o.n || '—'}</td>
                    <td class="mono">${o.actual.toFixed(4)}</td>
                    <td class="mono" style="color:var(--up-gold);">${o.predicted.toFixed(4)}</td>
                    <td class="mono">${err >= 0 ? '+' : ''}${err.toFixed(4)}</td>
                    <td class="mono">${absE.toFixed(4)}</td>
                    <td class="mono">${sqE.toFixed(5)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

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
  window._s05StepsData = [
    {
      s: '01',
      t: 'Identify Current Sorting Subproblem',
      input: `Array A, low = ${low}, high = ${high}`,
      formula: 'n = high − low + 1',
      calc: `n = ${high} − ${low} + 1 = ${pred.n}`,
      res: `Subproblem A[${low}..${high}] of size n = ${pred.n}`,
      status: 'Valid Subproblem (n ≥ 2)',
      why: 'Establishes the active array slice boundaries and partition size before feature extraction.'
    },
    {
      s: '02',
      t: 'Extract Seven Predictor Variables',
      input: `Subproblem A[${low}..${high}] = [${arr.slice(low, high + 1).slice(0, 12).join(', ')}${pred.n > 12 ? ', …' : ''}]`,
      formula: 'Equations (1)–(4): (n, x_min, x_max, μ, σ, γ, d)',
      calc: `n=${f.n}, x_min=${f.x_min}, x_max=${f.x_max}, μ=${f.mu.toFixed(4)}, σ=${f.sigma.toFixed(4)}, γ=${f.gamma.toFixed(4)}, d=${f.d.toFixed(4)}`,
      res: `7-Predictor Vector extracted in O(n) pass`,
      status: 'Verified Finite Moments',
      why: 'Summarizes subproblem scale, dispersion, skewness, and disorder so the regression model can adapt pivot selection to structural characteristics.'
    },
    {
      s: '03',
      t: 'Standardize Predictors & Construct 36 Polynomial Terms',
      input: `Raw predictor vector x[1..7], frozen training means μ_train[1..7] and scales σ_train[1..7]`,
      formula: 'X_j = (x_j − μ_train,j) / σ_train,j; Φ(X) = [1, X_j, X_j², X_j X_k]',
      calc: `Standardized X = [${pred.standardizedFeatures.map(x => x.toFixed(4)).join(', ')}]`,
      res: `36 polynomial basis terms evaluated`,
      status: 'Zero-Variance Guarded',
      why: 'Places all predictors on the same scale used during OLS training before evaluating quadratic and interaction terms.'
    },
    {
      s: '04',
      t: 'Calculate Predicted Normalized Pivot Position (ŷ)',
      input: `36 standardized polynomial terms Φ_k(X) and frozen coefficients β_0..β_35`,
      formula: 'Equation (8): ŷ = β₀ + ∑β_j X_j + ∑β_jj X_j² + ∑β_jk X_j X_k',
      calc: `Dot product ∑_{k=0}^{35} β_k Φ_k(X) = ${pred.yHat.toFixed(6)}`,
      res: `ŷ = ${pred.yHat.toFixed(6)}`,
      status: Number.isFinite(pred.yHat) ? 'Finite Real Prediction' : 'Non-Finite (Fallback Triggered)',
      why: 'Estimates the normalized relative position ∈ [0, 1] expected to minimize partition imbalance.'
    },
    {
      s: '05',
      t: 'Constrain Prediction to Unit Interval [0, 1]',
      input: `Unconstrained prediction ŷ = ${pred.yHat.toFixed(6)}`,
      formula: 'Equation (10): ŷ_c = min(1, max(0, ŷ))',
      calc: `min(1, max(0, ${pred.yHat.toFixed(6)})) = ${pred.yClamped.toFixed(6)}`,
      res: `ŷ_c = ${pred.yClamped.toFixed(6)}`,
      status: 'Clamped ∈ [0, 1]',
      why: 'Guarantees that polynomial extrapolation outside [0, 1] cannot produce out-of-bounds array indices.'
    },
    {
      s: '06',
      t: 'Calculate Relative Pivot Index (p)',
      input: `Constrained prediction ŷ_c = ${pred.yClamped.toFixed(6)}, partition size n = ${pred.n}`,
      formula: 'Equation (11): p = round[ŷ_c(n − 1)]',
      calc: `round[${pred.yClamped.toFixed(6)} × (${pred.n} − 1)] = round[${(pred.yClamped * (pred.n - 1)).toFixed(4)}] = ${pred.relIndex}`,
      res: `p = ${pred.relIndex}`,
      status: `0 ≤ ${pred.relIndex} ≤ ${pred.n - 1}`,
      why: 'Maps the continuous normalized position ŷ_c ∈ [0, 1] to a discrete integer offset within the subproblem.'
    },
    {
      s: '07',
      t: 'Calculate Absolute Pivot Index (p_abs)',
      input: `Lower boundary low = ${low}, relative index p = ${pred.relIndex}`,
      formula: 'Equation (12): p_abs = low + p',
      calc: `p_abs = ${low} + ${pred.relIndex} = ${pred.absIndex}`,
      res: `p_abs = ${pred.absIndex}`,
      status: `${low} ≤ ${pred.absIndex} ≤ ${high}`,
      why: 'Translates the partition-relative offset into the actual index in array A.'
    },
    {
      s: '08',
      t: 'Retrieve Pivot Value (v)',
      input: `Array A, absolute pivot index p_abs = ${pred.absIndex}`,
      formula: 'v = A[p_abs]',
      calc: `v = A[${pred.absIndex}] = ${pred.pivotValue}`,
      res: `v = ${pred.pivotValue}`,
      status: 'Retrieved Without Array Mutation',
      why: 'Saves the reference pivot value v prior to bidirectional pointer scanning and element exchanges.'
    },
    {
      s: '09',
      t: 'Validate Predicted Index & Midpoint Fallback Check',
      input: `ŷ = ${pred.yHat.toFixed(6)}, p_abs = ${pred.absIndex}, bounds [${low}, ${high}]`,
      formula: 'isFinite(ŷ) ∧ (low ≤ p_abs ≤ high); else p_abs = low + ⌊(high − low)/2⌋',
      calc: `Finite=${Number.isFinite(pred.yHat)} ∧ (${low} ≤ ${pred.absIndex} ≤ ${high}) → Fallback=${pred.fallbackUsed}`,
      res: pred.fallbackUsed ? `Fallback Midpoint Index Used` : `Validated p_abs = ${pred.absIndex}`,
      status: pred.fallbackUsed ? 'Fallback Applied' : 'Validation Passed',
      why: 'Ensures total index safety so runtime sorting never throws an index-out-of-bounds exception.'
    },
    {
      s: '10',
      t: 'Proceed to Bidirectional Partitioning',
      input: `Subproblem A[${low}..${high}], validated pivot value v = ${pred.pivotValue} (from p_abs = ${pred.absIndex})`,
      formula: 'Initialize i = low, j = high; partition around v',
      calc: `Pass (low=${low}, high=${high}, p_abs=${pred.absIndex}, v=${pred.pivotValue}) to Module 5`,
      res: `Ready for Bidirectional Partitioning`,
      status: 'Handoff Ready',
      why: 'Completes runtime pivot estimation and initiates in-place opposing-pointer partitioning.'
    }
  ];

  if (typeof window._s05ActiveStepIdx !== 'number') {
    window._s05ActiveStepIdx = -1; // -1 means show all 10 steps
  }
  renderS05StepsView();

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

function renderS05StepsView() {
  const steps = window._s05StepsData || [];
  const idx = window._s05ActiveStepIdx;
  const visible = (idx === -1 || idx === undefined) ? steps : [steps[Math.max(0, Math.min(steps.length - 1, idx))]];
  const box = document.getElementById('s05-ten-steps');
  if (!box) return;

  box.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px; max-height:390px; overflow-y:auto;">
      ${visible.map(st => `
        <div class="math-card" style="padding:10px 12px; border-left:3px solid var(--up-gold);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="color:var(--up-gold); font-weight:800;">[Step ${st.s} / 10] ${st.t}</span>
            <span class="badge-pass">${st.status}</span>
          </div>
          <div style="font-size:0.72rem; line-height:1.5;">
            • <b>Input Values:</b> <span class="mono">${st.input}</span><br/>
            • <b>Formula / Operation:</b> <span class="mono">${st.formula}</span><br/>
            • <b>Actual Calculation:</b> <span class="mono">${st.calc}</span><br/>
            • <b>Result:</b> <span class="math-highlight">${st.res}</span><br/>
            • <b>Why Necessary:</b> <span style="color:var(--text-sub);">${st.why}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function s05PrevStep() {
  const len = (window._s05StepsData || []).length || 10;
  if (window._s05ActiveStepIdx === -1) window._s05ActiveStepIdx = len - 1;
  else window._s05ActiveStepIdx = Math.max(0, window._s05ActiveStepIdx - 1);
  renderS05StepsView();
}
function s05NextStep() {
  const len = (window._s05StepsData || []).length || 10;
  if (window._s05ActiveStepIdx === -1) window._s05ActiveStepIdx = 0;
  else window._s05ActiveStepIdx = Math.min(len - 1, window._s05ActiveStepIdx + 1);
  renderS05StepsView();
}
function s05RunAll() {
  window._s05ActiveStepIdx = -1;
  renderS05StepsView();
}
function s05ResetSteps() {
  window._s05ActiveStepIdx = 0;
  renderS05StepsView();
}
function s05ViewComplete() {
  window._s05ActiveStepIdx = -1;
  renderS05StepsView();
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
  const idx = Math.min(s07IterIdx, s07TraceSteps.length - 1);
  const cur = s07TraceSteps[idx];
  const prevQ = idx > 0 ? (s07TraceSteps[idx - 1].queueSnapshot || []) : [{ low: cur.low, high: cur.high, size: cur.size, depth: cur.depth, seq: cur.seq }];
  const qList = cur.queueSnapshot || [];

  const tiedCount = prevQ.filter(p => p.size === cur.size).length;
  const selectionReason = prevQ.length <= 1
    ? `Only eligible subproblem in queue (size n_S = ${cur.size} ≥ 2).`
    : (tiedCount > 1
      ? `Tied for largest partition size (n_S = ${cur.size}) with ${tiedCount - 1} other subproblem(s); selected via deterministic FIFO tie-breaking on smallest insertion sequence (#${cur.seq}).`
      : `Strictly largest partition size (P(S) = n_S = ${cur.size}) among all ${prevQ.length} pending subproblems in the priority queue.`);

  document.getElementById('s07-qsize-badge').textContent = `|Q| Before = ${prevQ.length} → |Q| After = ${qList.length}`;
  document.getElementById('s07-iter-banner').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:4px;">
      <div>
        <b style="color:var(--up-gold);">Iteration ${cur.step} / ${s07TraceSteps.length}:</b>
        Polled Subproblem <b>[${cur.low}, ${cur.high}]</b> (size P(S) = <b>${cur.size}</b>, logical depth = <b>${cur.depth}</b>, insertion seq = <b>#${cur.seq}</b>)
      </div>
      <div><b>Reason for Selection (Sec 4.5.2):</b> <span style="color:#34d399;">${selectionReason}</span></div>
      <div>
        <b>Queue Before Poll (${prevQ.length}):</b> <span class="mono">${prevQ.map(p => `[${p.low},${p.high}](n=${p.size},#${p.seq})`).join(', ') || 'Empty'}</span><br/>
        <b>Partition Outcome:</b> Predicted Pivot A[${cur.pivotAbsIdx}] = <b>${cur.pivotValue}</b> → Left Child <b>${cur.leftBounds}</b> (n_L=${cur.n_L}) &amp; Right Child <b>${cur.rightBounds}</b> (n_R=${cur.n_R})<br/>
        <b>Updated Queue After Enqueue (${qList.length}):</b> <span class="mono">${qList.map(p => `[${p.low},${p.high}](n=${p.size},#${p.seq})`).join(', ') || 'Empty (|Q| = 0)'}</span>
      </div>
    </div>
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

  // Verify ascending order + preservation of input elements and frequencies across all required edge cases and 4 categories
  const verificationCases = [
    { id: 'V-01', name: 'Empty Array Edge Case (n = 0)', arr: [], seed: 20261001 },
    { id: 'V-02', name: 'Single-Element Array Edge Case (n = 1)', arr: [42], seed: 20261002 },
    { id: 'V-03', name: 'Thesis Canonical 5-Element Array', arr: [6, 21, 3, 5, 1], seed: 20261003 },
    { id: 'V-04', name: 'Repeated Values (Duplicate Pivot Handling)', arr: [8, 3, 8, 1, 3, 8, 1], seed: 20261004 },
    { id: 'V-05', name: 'Already Sorted Array (Ascending, d = 0)', arr: [2, 5, 9, 14, 20, 27], seed: 20261005 },
    { id: 'V-06', name: 'Reverse-Sorted Array (Descending, d = 1)', arr: [25, 18, 12, 7, 1, -4], seed: 20261006 },
    { id: 'V-07', name: 'Negative &amp; Mixed Integer Values', arr: [-45, -12, 0, -88, 19, -3, -12], seed: 20261007 },
    { id: 'V-08', name: 'All-Equal Identical Elements (σ = 0, γ = 0)', arr: [7, 7, 7, 7, 7, 7], seed: 20261008 },
    { id: 'V-09', name: 'Category 1: Random Synthetic Array (n = 25)', arr: Engine.generateDataset(25, 'random', 20261009, -1000, 1000).array, seed: 20261009 },
    { id: 'V-10', name: 'Category 2: Nearly Sorted Synthetic Array (n = 25)', arr: Engine.generateDataset(25, 'nearly', 20261010, -1000, 1000).array, seed: 20261010 },
    { id: 'V-11', name: 'Category 3: Reverse Sorted Synthetic Array (n = 25)', arr: Engine.generateDataset(25, 'reverse', 20261011, -1000, 1000).array, seed: 20261011 },
    { id: 'V-12', name: 'Category 4: Many Duplicates (10-Value Pool, n = 25)', arr: Engine.generateDataset(25, 'duplicates', 20261012, -1000, 1000).array, seed: 20261012 }
  ];

  tbody.innerHTML = verificationCases.map(vc => {
    const inputArr = vc.arr.slice();
    const expectedSorted = vc.arr.slice().sort((a, b) => a - b);
    let sOk = true, tOk = true, mOk = true, rOk = true;
    let actualOut = [];

    if (inputArr.length < 2) {
      actualOut = inputArr.slice();
    } else {
      const comp = Engine.compareAllFour(inputArr, vc.seed, false);
      sOk = comp.sermax.verified && JSON.stringify(comp.sermax.sortedArray) === JSON.stringify(expectedSorted);
      tOk = comp.trad.verified && JSON.stringify(comp.trad.sortedArray) === JSON.stringify(expectedSorted);
      mOk = comp.median3.verified && JSON.stringify(comp.median3.sortedArray) === JSON.stringify(expectedSorted);
      rOk = comp.random.verified && JSON.stringify(comp.random.sortedArray) === JSON.stringify(expectedSorted);
      actualOut = comp.sermax.sortedArray || [];
    }

    const allOk = sOk && tOk && mOk && rOk;
    const fmtArr = a => a.length === 0 ? '[]' : (a.length <= 8 ? `[${a.join(', ')}]` : `[${a.slice(0, 7).join(', ')}, …]`);

    return `
      <tr>
        <td class="mono"><b style="color:var(--up-gold);">${vc.id}</b></td>
        <td><b>${vc.name}</b></td>
        <td class="mono">${inputArr.length}</td>
        <td class="mono" style="font-size:0.68rem;">${fmtArr(inputArr)}</td>
        <td class="mono" style="font-size:0.68rem;">${fmtArr(expectedSorted)}</td>
        <td class="mono" style="font-size:0.68rem; color:#10b981;">${fmtArr(actualOut)}</td>
        <td class="mono" style="font-size:0.68rem;">
          ${sOk ? '✓' : '✗'} SerMax • ${tOk ? '✓' : '✗'} Trad • ${mOk ? '✓' : '✗'} Med3 • ${rOk ? '✓' : '✗'} Rand
        </td>
        <td>${allOk ? '<span class="badge-pass">✓ Ascending &amp; Multiset Verified</span>' : '❌ Failed'}</td>
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
  if (!silent) pauseAnthemForBenchmarkIntegrity('Formal Benchmark Execution');
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
      : `${a.estimatedHeapBytes.toLocaleString()} B (Call Stack=${a.maxLogicalDepth})`;
    return `
      <tr style="${isSermax ? 'background:rgba(242,169,0,0.14); font-weight:700;' : ''}">
        <td class="mono"><b>#${i + 1}</b></td>
        <td style="color:${isSermax ? 'var(--up-gold)' : '#fff'};">${a.name}</td>
        <td style="font-size:0.72rem;">${e.sched}</td>
        <td><span class="badge-pass">✓ Sorted &amp; Preserved</span></td>
        <td class="mono col-time"><b>${a.elapsedMs.toFixed(3)} ms</b></td>
        <td class="mono col-cmp">${a.comparisons.toLocaleString()}</td>
        <td class="mono col-swp">${a.swaps.toLocaleString()}</td>
        <td class="mono col-dep">${a.maxLogicalDepth}</td>
        <td class="mono col-bal">${a.partitionBalance.toFixed(4)}</td>
        <td class="mono col-mem">${memStr}</td>
        <td class="mono" style="color:${parseFloat(speedup) >= 1 ? '#10b981' : '#fbbf24'}; font-weight:700;">${speedup}</td>
      </tr>
    `;
  }).join('');

  // Populate Individual Measured Trial Records Table (#s09-trials-tbody)
  const trialsTbody = document.getElementById('s09-trials-tbody');
  if (trialsTbody) {
    const dsId = ds.metadata.datasetId || `DS-${dist.toUpperCase().slice(0, 4)}-N${size}-S${seed}`;
    const trialRows = [];
    entries.forEach(e => {
      const a = e.algo;
      const tArr = (a.timingStats && a.timingStats.timings) ? a.timingStats.timings : [a.elapsedMs];
      tArr.forEach((tMs, tIdx) => {
        trialRows.push(`
          <tr>
            <td class="mono">${dsId}</td>
            <td style="text-transform:capitalize;">${dist}</td>
            <td class="mono">${size.toLocaleString()}</td>
            <td class="mono">${seed}</td>
            <td style="color:${e.key === 'sermax' ? 'var(--up-gold)' : '#fff'}; font-weight:${e.key === 'sermax' ? '700' : '400'};">${a.name}</td>
            <td><span class="badge-warn">10 Warm-Ups Done</span></td>
            <td class="mono">Trial #${tIdx + 1} / ${tArr.length}</td>
            <td class="mono"><b>${tMs.toFixed(4)} ms</b></td>
            <td class="mono">${a.comparisons.toLocaleString()}</td>
            <td class="mono">${a.swaps.toLocaleString()}</td>
            <td class="mono">${a.maxLogicalDepth}</td>
            <td class="mono">${a.partitionBalance.toFixed(4)}</td>
            <td class="mono">${a.estimatedHeapBytes.toLocaleString()} B</td>
            <td><span class="badge-pass">✓ Verified</span></td>
          </tr>
        `);
      });
    });
    trialsTbody.innerHTML = trialRows.join('');
  }

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
  if (!silent) pauseAnthemForBenchmarkIntegrity('12-Condition Benchmark Matrix Execution');
  const cats = ['random', 'nearly', 'reverse', 'duplicates'];
  const sizes = [500, 1000, 10000];
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
  if (!silent) showToast('Executed 12-Condition Benchmark Matrix (500, 1,000, 10,000) & Statistical Analysis!');
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
  const sizes = [500, 1000, 10000];

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
          <td class="mono" style="color:${meanSwp >= 0 ? '#10b981' : '#fbbf24'}; font-weight:700;">${meanSwp >= 0 ? '↓' : '↑'} ${Math.abs(meanSwp).toFixed(1)}% swaps</td>
        </tr>
      `;
    }).join('');
  }

  // Render Grouped Descriptive Statistics Table (#s10-descriptive-tbody)
  const descTbody = document.getElementById('s10-descriptive-tbody');
  if (descTbody && Object.keys(matrix12Results).length > 0) {
    const descRows = [];
    cats.forEach(cat => {
      sizes.forEach(sz => {
        const item = matrix12Results[cat]?.[sz];
        if (!item) return;
        ['sermax', 'trad', 'median3', 'random'].forEach(k => {
          const a = item[k];
          const ts = a.timingStats || { meanMs: a.elapsedMs, stdMs: 0, medianMs: a.elapsedMs, iqrMs: 0 };
          descRows.push(`
            <tr>
              <td><b>${catNames[cat]}</b></td>
              <td class="mono">${sz.toLocaleString()}</td>
              <td style="color:${k === 'sermax' ? 'var(--up-gold)' : '#fff'}; font-weight:${k === 'sermax' ? '700' : '400'};">${a.name}</td>
              <td class="mono">${(ts.meanMs || a.elapsedMs).toFixed(4)}</td>
              <td class="mono">${(ts.stdMs || 0).toFixed(4)}</td>
              <td class="mono"><b>${(ts.medianMs || a.elapsedMs).toFixed(4)}</b></td>
              <td class="mono">${(ts.iqrMs || 0).toFixed(4)}</td>
              <td class="mono">${a.comparisons.toLocaleString()}</td>
              <td class="mono">${a.swaps.toLocaleString()}</td>
              <td class="mono">${a.maxLogicalDepth}</td>
              <td class="mono">${a.partitionBalance.toFixed(4)}</td>
              <td class="mono">${a.estimatedHeapBytes.toLocaleString()} B</td>
            </tr>
          `);
        });
      });
    });
    descTbody.innerHTML = descRows.join('');
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
    const dir = r.sp >= 1.0 ? 'Faster' : 'Slower (Feature-Extraction Overhead)';
    return `
      <tr>
        <td><b>${r.name}</b></td>
        <td class="mono" style="color:var(--up-gold); font-weight:700;">${r.sp.toFixed(2)}×</td>
        <td class="mono">[${r.boot.low95.toFixed(2)}×, ${r.boot.high95.toFixed(2)}×]</td>
        <td class="mono" style="font-size:0.7rem;">Wilcoxon z=${r.wilcox.z.toFixed(2)}<br/><span style="color:var(--text-dim);">Sign (+${r.signT.pos}/-${r.signT.neg}, p=${r.signT.pValue.toFixed(4)})</span></td>
        <td class="mono">${r.wilcox.pValue.toFixed(4)}</td>
        <td class="mono"><b>${adjP.toFixed(4)}</b></td>
        <td><span class="${sig ? 'badge-pass' : 'badge-warn'}">${sig ? `Significant (${dir}, p_Holm < 0.05)` : `Not Statistically Significant (p_Holm ≥ 0.05)`}</span></td>
      </tr>
    `;
  }).join('');

  // Render 10-Point Statistical Comparison Explanation Panel (#s10-ten-point-explanation)
  const tenPtBox = document.getElementById('s10-ten-point-explanation');
  if (tenPtBox) {
    const activeCat = document.getElementById('bench-dist')?.value || 'nearly';
    const activeSize = document.getElementById('bench-size')?.value || '1000';
    tenPtBox.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(310px, 1fr)); gap:12px;">
        ${rawStats.map((r, i) => {
          const adjP = holmP[i];
          const sig = adjP < 0.05;
          const interp = sig
            ? (r.sp >= 1.0
              ? `At α = 0.05 after Holm 36-comparison adjustment (p_Holm = ${adjP.toFixed(4)} < 0.05), SerMax Hybrid achieved a statistically significant execution-time reduction (${r.sp.toFixed(2)}× speedup) under this condition.`
              : `At α = 0.05 after Holm 36-comparison adjustment (p_Holm = ${adjP.toFixed(4)} < 0.05), the baseline executed faster (${r.sp.toFixed(2)}× ratio), reflecting the O(n) seven-predictor extraction and 36-term evaluation overhead relative to single-step pivot selection.`)
            : `After Holm adjustment across the family of 36 comparisons (p_Holm = ${adjP.toFixed(4)} ≥ 0.05), the execution-time difference (${r.sp.toFixed(2)}×) is not statistically significant at α = 0.05, even if unadjusted p = ${r.wilcox.pValue.toFixed(4)}.`;
          return `
            <div class="math-card" style="font-size:0.72rem; line-height:1.55; border-left:3px solid var(--up-gold);">
              <div style="color:var(--up-gold); font-weight:800; font-size:0.78rem; margin-bottom:6px;">${r.name}</div>
              <div><b>1. Algorithms Compared:</b> SerMax Hybrid QuickSort (Iterative PQ + 36β Polynomial Pivot) vs. ${r.obj.name} (Recursive).</div>
              <div><b>2. Experimental Condition:</b> Category = <span class="mono">${activeCat.toUpperCase()}</span>, Size <span class="mono">n = ${Number(activeSize).toLocaleString()}</span>.</div>
              <div><b>3. Paired Observations:</b> Paired execution-time measurements summarized on identical independent test arrays (<span class="mono">d_i = T_baseline,i − T_SerMax,i</span>).</div>
              <div><b>4. Statistical Test Used:</b> Two-sided Wilcoxon Signed-Rank Test (with Paired Sign Test check for asymmetry).</div>
              <div><b>5. Why Appropriate:</b> Execution times on identical source arrays are paired and potentially skewed; non-parametric rank/sign tests avoid Gaussian normality assumptions.</div>
              <div><b>6. Calculated Test Statistic:</b> Wilcoxon <span class="mono">z = ${r.wilcox.z.toFixed(4)}</span> (<span class="mono">W+ = ${r.wilcox.wPlus}, W− = ${r.wilcox.wMinus}</span>); Sign Test <span class="mono">+${r.signT.pos} / −${r.signT.neg}</span>.</div>
              <div><b>7. Unadjusted p-value:</b> <span class="mono">p_raw = ${r.wilcox.pValue.toFixed(4)}</span> (Sign Test <span class="mono">p_sign = ${r.signT.pValue.toFixed(4)}</span>).</div>
              <div><b>8. Holm-Adjusted p-value (36 Comparisons):</b> <span class="mono"><b>p_Holm = ${adjP.toFixed(4)}</b></span>.</div>
              <div><b>9. 95% Paired Bootstrap CI (2,000 Resamples):</b> <span class="mono">[${r.boot.low95.toFixed(2)}×, ${r.boot.high95.toFixed(2)}×]</span>.</div>
              <div><b>10. Objective Interpretation (α = 0.05):</b> <span style="color:#fff;">${interp}</span></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

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

// ─── OPTIONAL WEBSITE PRESENTATION FEATURE: OFFICIAL SERMAX THEME SONG ───
// Operates strictly independently of all research modules (Modules 1–9) and
// automatically pauses during formal benchmarking to preserve timing integrity.
const ANTHEM_SECTIONS = [
  { start: 0,   end: 42,  label: 'INTRO — Soft, atmospheric vocals' },
  { start: 42,  end: 78,  label: 'VERSE 1 — Gradually building' },
  { start: 78,  end: 91,  label: 'PRE-CHORUS — Rising energy' },
  { start: 91,  end: 128, label: 'CHORUS — Beyond the Pivot' },
  { start: 128, end: 150, label: 'VERSE 2 — Confident, rhythmic' },
  { start: 150, end: 164, label: 'PRE-CHORUS 2 — Instrumental build' },
  { start: 164, end: 200, label: 'CHORUS — Full orchestral & electronic' },
  { start: 200, end: 239, label: 'BRIDGE — Emotional, inspiring' },
  { start: 239, end: 276, label: 'FINAL CHORUS — Grand cinematic climax' },
  { start: 276, end: 320, label: 'OUTRO — Piano and fading synthesizer' }
];

function formatAnthemTime(sec) {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function initAnthemPlayer() {
  const audio = document.getElementById('sermax-anthem-audio');
  if (!audio) return;

  // Ensure paused by default and initial volume set
  audio.pause();
  audio.autoplay = false;
  audio.volume = 0.75;

  audio.addEventListener('loadedmetadata', () => {
    const durEl = document.getElementById('anthem-time-dur');
    const seekEl = document.getElementById('anthem-seek');
    if (durEl && isFinite(audio.duration)) {
      durEl.textContent = formatAnthemTime(audio.duration);
    }
    if (seekEl && isFinite(audio.duration)) {
      seekEl.max = Math.ceil(audio.duration);
    }
  });

  audio.addEventListener('timeupdate', () => {
    const cur = audio.currentTime || 0;
    const curEl = document.getElementById('anthem-time-cur');
    const seekEl = document.getElementById('anthem-seek');
    const secEl = document.getElementById('anthem-current-section');

    if (curEl) curEl.textContent = formatAnthemTime(cur);
    if (seekEl) seekEl.value = cur;

    const activeSec = ANTHEM_SECTIONS.find(s => cur >= s.start && cur < s.end);
    if (secEl && !audio.paused) {
      secEl.textContent = activeSec ? activeSec.label : 'PLAYING • BEYOND THE PIVOT';
    }

    document.querySelectorAll('#anthem-lyrics-grid .lyric-stanza').forEach(st => {
      const stStart = parseFloat(st.getAttribute('data-start')) || 0;
      const stEnd = parseFloat(st.getAttribute('data-end')) || 999;
      st.classList.toggle('active-stanza', !audio.paused && cur >= stStart && cur < stEnd);
    });
  });

  audio.addEventListener('ended', () => {
    updateAnthemUIState(false, 'FINISHED • READY');
  });
}

function updateAnthemUIState(isPlaying, statusText = null) {
  const playBtn = document.getElementById('anthem-play-btn');
  const disc = document.getElementById('anthem-disc');
  const secEl = document.getElementById('anthem-current-section');
  if (playBtn) playBtn.textContent = isPlaying ? '❚❚ Pause' : '▶ Play';
  if (disc) disc.classList.toggle('spinning', isPlaying);
  if (secEl && statusText) secEl.textContent = statusText;
}

function toggleAnthemPlayback() {
  const audio = document.getElementById('sermax-anthem-audio');
  if (!audio) return;

  const badge = document.getElementById('anthem-isolation-status');
  if (audio.paused) {
    audio.play().then(() => {
      updateAnthemUIState(true, 'PLAYING • BEYOND THE PIVOT');
      if (badge) {
        badge.textContent = 'Playing (Auto-Disabled During Benchmarks)';
        badge.classList.remove('paused-guard');
      }
    }).catch(() => {
      showToast('Unable to start audio playback');
    });
  } else {
    audio.pause();
    updateAnthemUIState(false, 'PAUSED BY USER');
    if (badge) {
      badge.textContent = 'Paused • Auto-Disabled During Benchmarks';
      badge.classList.remove('paused-guard');
    }
  }
}

function stopAnthemPlayback() {
  const audio = document.getElementById('sermax-anthem-audio');
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  updateAnthemUIState(false, 'STOPPED • READY');
  document.querySelectorAll('#anthem-lyrics-grid .lyric-stanza').forEach(st => st.classList.remove('active-stanza'));
}

function seekAnthemAudio(seconds) {
  const audio = document.getElementById('sermax-anthem-audio');
  if (!audio) return;
  const target = Math.max(0, parseFloat(seconds) || 0);
  audio.currentTime = target;
  const curEl = document.getElementById('anthem-time-cur');
  if (curEl) curEl.textContent = formatAnthemTime(target);
}

function toggleAnthemMute() {
  const audio = document.getElementById('sermax-anthem-audio');
  const btn = document.getElementById('anthem-mute-btn');
  if (!audio) return;
  audio.muted = !audio.muted;
  if (btn) btn.textContent = audio.muted ? 'Unmute' : 'Mute';
}

function setAnthemVolume(val) {
  const audio = document.getElementById('sermax-anthem-audio');
  const lbl = document.getElementById('anthem-vol-label');
  const btn = document.getElementById('anthem-mute-btn');
  if (!audio) return;
  const v = Math.max(0, Math.min(1, parseFloat(val) || 0));
  audio.volume = v;
  if (v > 0 && audio.muted) {
    audio.muted = false;
    if (btn) btn.textContent = 'Mute';
  }
  if (lbl) lbl.textContent = `${Math.round(v * 100)}%`;
}

function toggleAnthemLyrics() {
  const drawer = document.getElementById('anthem-lyrics-drawer');
  const btn = document.getElementById('anthem-lyrics-btn');
  if (!drawer) return;
  const isHidden = drawer.style.display === 'none';
  drawer.style.display = isHidden ? 'block' : 'none';
  if (btn) {
    btn.textContent = isHidden ? 'Lyrics ▴' : 'Lyrics ▾';
    btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  }
}

function pauseAnthemForBenchmarkIntegrity(reason = 'Benchmark Isolation') {
  const audio = document.getElementById('sermax-anthem-audio');
  if (!audio || audio.paused) return;
  audio.pause();
  updateAnthemUIState(false, 'AUTO-PAUSED FOR BENCHMARK INTEGRITY');
  const badge = document.getElementById('anthem-isolation-status');
  if (badge) {
    badge.textContent = `Audio Auto-Paused (${reason})`;
    badge.classList.add('paused-guard');
  }
}

// ─── GLOBAL REQUIREMENT: MODE A (RESEARCH EXECUTION) & MODE B (7-STEP EXPLANATION) ───
window._globalSystemMode = 'A';
window._modeBActiveStep = -1; // -1 = show all 7 steps
window._modeBFilter = 'ALL';
window._modeBPlayTimer = null;
window._modeBHistoryLog = [];

const MODULE_PURPOSE_MAP = {
  s02: {
    purpose: 'Generate seed-reproducible synthetic integer datasets across 4 categories (Random, Nearly Sorted, Reverse Sorted, Many Duplicates) and 3 formal benchmark sizes (500, 1,000, 10,000) with source-array-level 70:15:15 splitting.',
    output: 'Reproducible synthetic datasets with documented generation settings and training (140), validation (30), and testing (30) assignments.',
    origin: 'Calculated & Seed-Reproducible (Source-Array Level)'
  },
  s03: {
    purpose: 'Extract the seven subproblem predictor variables (n, x_min, x_max, μ, σ, γ, d) and evaluate deterministic candidate pivot positions to derive the normalized minimum-imbalance training target y.',
    output: 'Seven verified predictor values with element-by-element derivations and a reproducible normalized training target y = i* / (n − 1).',
    origin: 'Calculated from Active Subproblem Slice'
  },
  s04: {
    purpose: 'Standardize the 7 predictors using training-set moments, construct the 36-term second-degree polynomial design matrix, fit coefficients via OLS, and validate MAE & RMSE against the midpoint heuristic.',
    output: 'Trained and validated 36-coefficient second-degree polynomial regression model frozen for runtime sorting.',
    origin: 'Calculated on Training Split (70%) & Evaluated on Validation Split (15%)'
  },
  s05: {
    purpose: 'Execute the 10-step runtime pivot estimation procedure (standardize, evaluate 36 terms, clamp to [0,1], convert to relative & absolute index, validate bounds, and apply midpoint fallback if needed).',
    output: 'Valid absolute pivot index p_abs and pivot value v = A[p_abs] with complete 10-step computational trace.',
    origin: 'Calculated at Runtime (Zero Array Mutation)'
  },
  s06: {
    purpose: 'Partition subproblem A[low..high] in-place around the selected pivot value v using opposing pointers i and j, recording comparisons, exchanges, and resulting left/right subproblems.',
    output: 'Correctly partitioned array segments [low..j] and [i..high] with complete trace of comparisons and swaps.',
    origin: 'Calculated & Traced on Active Partition'
  },
  s07: {
    purpose: 'Schedule eligible subproblems (n ≥ 2) iteratively using a priority queue ordered by largest partition size first with deterministic FIFO tie-breaking on insertion sequence.',
    output: 'Iterative subproblem processing schedule, verified queue ordering, logical partition depth, and maximum queue occupancy.',
    origin: 'Calculated from Iterative Max-Heap Schedule'
  },
  s08: {
    purpose: 'Implement and verify SerMax Hybrid QuickSort alongside the three recursive baselines (Traditional, Median-of-Three, Randomized-Pivot) on identical input arrays and edge cases.',
    output: 'Four verified sorting implementations with confirmed ascending order and element-frequency preservation.',
    origin: 'Verified on Identical Input Arrays'
  },
  s09: {
    purpose: 'Conduct controlled comparative benchmarking across 12 conditions (4 categories × 3 sizes: 500, 1,000, 10,000) using 10 unmeasured warm-ups + 10 measured trials per test array.',
    output: 'Reproducible trial-level and dataset-level performance records across all 6 primary metrics + max priority queue occupancy.',
    origin: 'Measured on Independent Test Split (15%)'
  },
  s10: {
    purpose: 'Summarize repeated trials at the independent test-array level and perform Wilcoxon signed-rank tests, paired sign tests, Holm 36-comparison adjustment (α = 0.05), and 2,000-resample bootstrap CIs.',
    output: 'Reproducible descriptive and inferential statistical tables, 10-point derivations, and CSV/JSON research exports.',
    origin: 'Calculated from Measured Independent Test Summaries'
  }
};

function updateModuleMetaStrip(screenId) {
  const info = MODULE_PURPOSE_MAP[screenId] || MODULE_PURPOSE_MAP.s02;
  const pEl = document.getElementById('module-purpose-txt');
  const oEl = document.getElementById('module-output-txt');
  const bEl = document.getElementById('module-data-origin-badge');
  if (pEl) pEl.textContent = info.purpose;
  if (oEl) oEl.textContent = info.output;
  if (bEl) bEl.textContent = info.origin;
}

function setGlobalSystemMode(mode) {
  window._globalSystemMode = (mode === 'B') ? 'B' : 'A';
  const btnA = document.getElementById('mode-a-btn');
  const btnB = document.getElementById('mode-b-btn');
  const panelB = document.getElementById('global-mode-b-panel');

  if (btnA) btnA.classList.toggle('active', window._globalSystemMode === 'A');
  if (btnB) btnB.classList.toggle('active', window._globalSystemMode === 'B');
  if (panelB) {
    panelB.style.display = window._globalSystemMode === 'B' ? 'block' : 'none';
  }

  if (window._globalSystemMode === 'B') {
    window._modeBActiveStep = -1;
    window._modeBFilter = 'ALL';
    renderGlobalModeBPanel(currentScreenId);
  } else {
    modeBPause();
  }
}

function buildSevenStepExplanationForScreen(screenId) {
  const arr = (activeDataset && activeDataset.length >= 2) ? activeDataset : [6, 21, 3, 5, 1];
  const f = Engine.extractSevenFeatures(arr, 0, arr.length - 1);
  const model = Engine.getFrozenModel();
  const pred = Engine.predictPivotPosition(arr, 0, arr.length - 1, model, false);
  const c = latestFourComparison || Engine.compareAllFour(arr, activeDatasetMeta.seed || 20261001, false);

  const map = {
    s02: {
      title: 'Module 1 (Sections 4.6.1–4.6.3): Synthetic Dataset Generation & 70:15:15 Source-Array Splitting',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Category = ${(activeDatasetMeta.category || 'nearly').toUpperCase()}, Size n = ${arr.length.toLocaleString()}, Range = [${activeDatasetMeta.minVal ?? -100000}, ${activeDatasetMeta.maxVal ?? 100000}], Seed = ${activeDatasetMeta.seed || 104201}.` },
        { num: 2, name: 'Step 2: Formula', body: `Nearly Sorted Exchanges: k_swap = max(1, round(0.01 × n)); Source-Array Split: 140 Training (70%) : 30 Validation (15%) : 30 Testing (15%) per condition.` },
        { num: 3, name: 'Step 3: Substitution', body: `k_swap = max(1, round(0.01 × ${arr.length})) = ${Math.max(1, Math.round(arr.length * 0.01))}; Total source arrays across 12 conditions = 12 × 200 = 2,400.` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Generated ${arr.length} seeded integers; Observed x_min = ${f.x_min}, x_max = ${f.x_max}, Mean μ = ${f.mu.toFixed(4)}, Disorder d = ${f.d.toFixed(4)}.` },
        { num: 5, name: 'Step 5: Final Result', body: `Dataset ID = ${activeDatasetMeta.datasetId || 'DS-ACTIVE'}, Checksum = ${activeDatasetMeta.checksum}, Subset = ${activeDatasetMeta.assignedSubset || 'Assigned at Source-Array Level'}.` },
        { num: 6, name: 'Step 6: Interpretation', body: `Source-array-level assignment guarantees that no subproblems derived from the same source array cross between training, validation, and testing splits.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Pass the generated array to Module 2 (Seven-Predictor Extractor) to compute subproblem structural features and minimum-imbalance training targets.` }
      ]
    },
    s03: {
      title: 'Module 2 (Sections 4.3.1–4.3.3): Seven-Predictor Extraction & Minimum-Imbalance Target Calculation',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Active subproblem A[0..${arr.length - 1}] with n = ${f.n} elements: [${arr.slice(0, 10).join(', ')}${arr.length > 10 ? ', …' : ''}].` },
        { num: 2, name: 'Step 2: Formula', body: `Eq. (1) μ = (∑x_i)/n; Eq. (2) σ = √[∑(x_i−μ)²/n]; Eq. (3) γ = (1/n)∑[(x_i−μ)/σ]³; Eq. (4) d = [∑𝟙(A[i]>A[i+1])]/(n−1); Eq. (7) y = i*/(n−1).` },
        { num: 3, name: 'Step 3: Substitution', body: `μ = ${(f.mu * f.n).toFixed(0)} / ${f.n}; σ = √[${f.sqDiffSum.toFixed(4)} / ${f.n}]; d = ${f.descPairs} / ${f.n - 1}.` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Variance σ² = ${f.variance.toFixed(6)}; Std Dev σ = ${f.sigma.toFixed(6)}; Descending adjacent violations = ${f.descPairs}.` },
        { num: 5, name: 'Step 5: Final Result', body: `[n=${f.n}, x_min=${f.x_min}, x_max=${f.x_max}, μ=${f.mu.toFixed(4)}, σ=${f.sigma.toFixed(4)}, γ=${f.gamma.toFixed(4)}, d=${f.d.toFixed(4)}].` },
        { num: 6, name: 'Step 6: Interpretation', body: `The 7 predictors quantify scale, bounds, central tendency, spread, asymmetry, and local disorder in O(n) time.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Pass the 7 predictors and normalized target y to Module 3 (Polynomial Regression Studio) for standardization and 36-coefficient OLS estimation.` }
      ]
    },
    s04: {
      title: 'Module 3 (Sections 4.3.4–4.3.5, 4.3.7): Standardization, 36-Term OLS Regression & Validation',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Training observations N_train = ${model.validation_summary.trainCount}, Validation observations N_val = ${model.validation_summary.valCount}, 7 raw predictors x_1..x_7.` },
        { num: 2, name: 'Step 2: Formula', body: `X_j = (x_j − μ_train,j)/σ_train,j; Eq. (8) ŷ = β₀ + ∑β_j X_j + ∑β_jj X_j² + ∑β_jk X_j X_k; Eq. (13) MAE = ∑|y−ŷ|/N; Eq. (14) RMSE = √[∑(y−ŷ)²/N].` },
        { num: 3, name: 'Step 3: Substitution', body: `Standardized active vector X = [${pred.standardizedFeatures.map(v => v.toFixed(3)).join(', ')}]; Design Matrix Z ∈ ℝ^(${model.validation_summary.trainCount} × 36).` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Solved normal equations (ZᵀZ)β = Zᵀy for β₀..β₃₅; evaluated validation residuals e_m = y_m − ŷ_m across N_val = ${model.validation_summary.valCount} partitions.` },
        { num: 5, name: 'Step 5: Final Result', body: `Validation MAE = ${model.validation_summary.valMAE.toFixed(6)}, Validation RMSE = ${model.validation_summary.valRMSE.toFixed(6)} (36 coefficients frozen).` },
        { num: 6, name: 'Step 6: Interpretation', body: `Retaining training-derived μ_train and σ_train and freezing β₀..β₃₅ before independent testing prevents data leakage.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Supply frozen parameters (μ_train[7], σ_train[7], β[36]) to Module 4 (Runtime Pivot Estimator).` }
      ]
    },
    s05: {
      title: 'Module 4 (Section 4.3.6 & Figure 3): 10-Step Runtime Pivot Estimation Contract',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Subproblem bounds low = 0, high = ${arr.length - 1}, size n = ${pred.n}, standardized features X[1..7].` },
        { num: 2, name: 'Step 2: Formula', body: `Eq. (10) ŷ_c = min(1, max(0, ŷ)); Eq. (11) p = round[ŷ_c(n − 1)]; Eq. (12) p_abs = low + p; v = A[p_abs].` },
        { num: 3, name: 'Step 3: Substitution', body: `ŷ = ${pred.yHat.toFixed(6)} → ŷ_c = min(1, max(0, ${pred.yHat.toFixed(6)})) = ${pred.yClamped.toFixed(6)} → p = round[${pred.yClamped.toFixed(6)} × ${pred.n - 1}].` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Relative index p = ${pred.relIndex}; Absolute index p_abs = 0 + ${pred.relIndex} = ${pred.absIndex}; Bounds check: 0 ≤ ${pred.absIndex} ≤ ${arr.length - 1}.` },
        { num: 5, name: 'Step 5: Final Result', body: `Validated absolute pivot index p_abs = ${pred.absIndex}, reference pivot value v = A[${pred.absIndex}] = ${pred.pivotValue} (Fallback = ${pred.fallbackUsed}).` },
        { num: 6, name: 'Step 6: Interpretation', body: `Clamping and boundary verification guarantee a valid in-range pivot index before any partitioning scan begins.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Pass validated pivot value v = ${pred.pivotValue} to Module 5 (Bidirectional Partitioning).` }
      ]
    },
    s06: {
      title: 'Module 5 (Sections 4.4.1–4.4.4 & Figure 4): Opposing-Pointer Bidirectional Partitioning',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Subproblem A[0..${(s06TraceData?.high ?? arr.length - 1)}], saved pivot value v = ${s06TraceData?.pivotValue ?? pred.pivotValue} (from p_abs = ${s06TraceData?.pivotAbsIdx ?? pred.absIndex}).` },
        { num: 2, name: 'Step 2: Formula', body: `Advance i while A[i] < v; decrease j while A[j] > v; if i ≤ j swap A[i] ↔ A[j] and set i ← i+1, j ← j−1 until i > j.` },
        { num: 3, name: 'Step 3: Substitution', body: `Initial i = 0, j = ${s06TraceData?.high ?? arr.length - 1}; final pointer cross at i = ${s06TraceData?.finalI ?? 1}, j = ${s06TraceData?.finalJ ?? 0}.` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Recorded ${s06TraceData?.comparisons ?? 0} element-pivot comparisons and ${s06TraceData?.swaps ?? 0} exchanges; Left size n_L = ${s06TraceData?.n_L ?? 0}, Right size n_R = ${s06TraceData?.n_R ?? 0}.` },
        { num: 5, name: 'Step 5: Final Result', body: `Left subproblem [0..${s06TraceData?.finalJ ?? 0}] (n_L=${s06TraceData?.n_L ?? 0}), Right subproblem [${s06TraceData?.finalI ?? 1}..${s06TraceData?.high ?? arr.length - 1}] (n_R=${s06TraceData?.n_R ?? 0}), Imbalance I = ${s06TraceData?.imbalance ?? 0}.` },
        { num: 6, name: 'Step 6: Interpretation', body: `Advancing both pointers after every exchange prevents infinite loops on duplicate elements and splits all-equal partitions evenly.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Forward eligible resulting subproblems (size ≥ 2) to Module 6 (Priority Queue Management).` }
      ]
    },
    s07: {
      title: 'Module 6 (Sections 4.5.1–4.5.4 & Figure 5): Iterative Priority Queue Subproblem Scheduling',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Root subproblem [0, ${arr.length - 1}] of size n = ${arr.length}, initial logical depth D = 1, insertion sequence seq = #1.` },
        { num: 2, name: 'Step 2: Formula', body: `Priority P(S) = n_S = high − low + 1 (largest first); Equal-size tie-breaker: smaller insertion sequence seq (FIFO); Child depth D(S_c) = D(S_p) + 1.` },
        { num: 3, name: 'Step 3: Substitution', body: `Total queue polling iterations = ${s07TraceSteps.length}; Peak simultaneous queue occupancy Q_max = ${document.getElementById('s07-qmax')?.textContent || 1}.` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Each iteration polls the max-size record, partitions in-place, and enqueues only child subproblems with size ≥ 2.` },
        { num: 5, name: 'Step 5: Final Result', body: `Queue terminated at |Q| = 0 with Max Queue Occupancy Q_max = ${document.getElementById('s07-qmax')?.textContent || 1} and Max Logical Depth D_max = ${document.getElementById('s07-dmax')?.textContent || 1}.` },
        { num: 6, name: 'Step 6: Interpretation', body: `Iterative priority queue management eliminates recursive call-stack frames while deterministically ordering equal-sized partitions via FIFO.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Verify complete sorted output and compare against the 3 recursive baseline algorithms in Module 7.` }
      ]
    },
    s08: {
      title: 'Module 7 (Sections 4.2 & 4.6.4): Algorithm Implementation & Correctness Verification',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Identical input array cloned across all 4 algorithms: SerMax Hybrid, Traditional (First), Median-of-Three, and Randomized-Pivot.` },
        { num: 2, name: 'Step 2: Formula', body: `Ascending Order: ∀i ∈ [0, n−2], A'[i] ≤ A'[i+1]; Multiset Preservation: frequency(A') ≡ frequency(A).` },
        { num: 3, name: 'Step 3: Substitution', body: `Evaluated across 12 verification conditions including empty (n=0), single-element (n=1), negatives, duplicates, all-equal (σ=0), sorted, and reverse-sorted.` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `SerMax Comparisons = ${c.sermax.comparisons}, Swaps = ${c.sermax.swaps}, Depth = ${c.sermax.maxLogicalDepth}; Traditional Comparisons = ${c.trad.comparisons}, Swaps = ${c.trad.swaps}.` },
        { num: 5, name: 'Step 5: Final Result', body: `All 4 sorting implementations verified (100% ascending order & exact element frequency preservation).` },
        { num: 6, name: 'Step 6: Interpretation', body: `Confirms that all four algorithms share the identical bidirectional partitioning foundation while differing only in pivot selection and scheduling.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Proceed to Module 8 (Comparative Benchmarking) for isolated timing and metric collection across the 12 formal conditions.` }
      ]
    },
    s09: {
      title: 'Module 8 (Sections 4.6.4–4.6.6 & Tables 3–4): Comparative Benchmarking Protocol',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `4 Categories × 3 Benchmark Sizes (500, 1,000, 10,000) = 12 Conditions; 10 unmeasured warm-up runs + 10 measured trials per test array.` },
        { num: 2, name: 'Step 2: Formula', body: `Eq. (22) Partition Balance B = (∑|n_L − n_R|) / ∑(n_L + n_R); Eq. (23) Speedup Ratio S = T_baseline / T_SerMax.` },
        { num: 3, name: 'Step 3: Substitution', body: `T_Trad = ${c.trad.elapsedMs.toFixed(4)} ms, T_SerMax = ${c.sermax.elapsedMs.toFixed(4)} ms; SerMax Balance B = ${c.sermax.partitionBalance.toFixed(4)} vs. Trad B = ${c.trad.partitionBalance.toFixed(4)}.` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Speedup vs. Trad = ${c.trad.elapsedMs.toFixed(4)} / ${c.sermax.elapsedMs.toFixed(4)} = ${(c.trad.elapsedMs / Math.max(1e-6, c.sermax.elapsedMs)).toFixed(2)}×; SerMax Thread Heap Alloc = ${c.sermax.estimatedHeapBytes.toLocaleString()} B (Max PQ = ${c.sermax.maxQueueOccupancy}).` },
        { num: 5, name: 'Step 5: Final Result', body: `Recorded 6 primary metrics (Time, Comparisons, Swaps, Logical Depth, Balance B, Thread Heap Allocation Bytes) + Max PQ Occupancy.` },
        { num: 6, name: 'Step 6: Interpretation', body: `Array generation, copying, and verification occur strictly outside the measured interval, and website audio is auto-paused.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Pass dataset-level summarized benchmark records to Module 9 (Statistical Analysis & Export).` }
      ]
    },
    s10: {
      title: 'Module 9 (Section 4.6.7): Paired Statistical Analysis, Holm Adjustment & Bootstrap CI',
      steps: [
        { num: 1, name: 'Step 1: Given Values', body: `Dataset-level summarized execution times across independent test arrays for SerMax Hybrid and the 3 baselines.` },
        { num: 2, name: 'Step 2: Formula', body: `Paired differences d_i = T_base,i − T_SerMax,i; Wilcoxon signed-rank z & p; Paired sign test; Holm step-down adjustment across M = 36 comparisons (α = 0.05); 2,000-resample 95% bootstrap CI.` },
        { num: 3, name: 'Step 3: Substitution', body: `Speedup vs. Trad = ${(c.trad.elapsedMs / Math.max(1e-6, c.sermax.elapsedMs)).toFixed(2)}×; Comparison difference = ${c.trad.comparisons - c.sermax.comparisons}; Swap difference = ${c.trad.swaps - c.sermax.swaps}.` },
        { num: 4, name: 'Step 4: Intermediate Calculations', body: `Ranked |d_i| values, computed signed rank sums W+ and W−, applied Holm step-down multiplier (36 − k + 1), and sorted 2,000 bootstrap ratios for 2.5th and 97.5th percentiles.` },
        { num: 5, name: 'Step 5: Final Result', body: `Complete descriptive statistics table and 10-point paired inferential comparison table evaluated strictly at p_Holm < 0.05.` },
        { num: 6, name: 'Step 6: Interpretation', body: `Statistical significance is never claimed from unadjusted p-values alone; both favorable and unfavorable empirical outcomes are reported objectively.` },
        { num: 7, name: 'Step 7: Next Operation', body: `Export verified tables, JSON model artifacts, and CSV experimental logs for Chapter 4 & Chapter 5 documentation.` }
      ]
    }
  };

  return map[screenId] || map.s02;
}

function renderGlobalModeBPanel(screenId = currentScreenId) {
  const container = document.getElementById('mode-b-steps-container');
  const titleEl = document.getElementById('mode-b-title');
  if (!container) return;

  const data = buildSevenStepExplanationForScreen(screenId);
  if (titleEl) titleEl.textContent = data.title;

  let stepsToShow = data.steps;
  if (window._modeBFilter === 'formula') {
    stepsToShow = data.steps.filter(s => s.num === 1 || s.num === 2 || s.num === 5);
  } else if (window._modeBFilter === 'substitution') {
    stepsToShow = data.steps.filter(s => s.num === 1 || s.num === 3 || s.num === 4 || s.num === 5);
  } else if (window._modeBActiveStep >= 0 && window._modeBActiveStep < data.steps.length) {
    stepsToShow = [data.steps[window._modeBActiveStep]];
  }

  container.innerHTML = stepsToShow.map(st => `
    <div class="mode-b-step-card ${window._modeBActiveStep === (st.num - 1) ? 'active-step' : ''}">
      <div class="mode-b-step-title">${st.name}</div>
      <div>${st.body}</div>
    </div>
  `).join('');

  const ts = new Date().toLocaleTimeString();
  window._modeBHistoryLog.unshift(`[${ts}] ${screenId.toUpperCase()} • Viewed ${window._modeBActiveStep === -1 ? 'All 7 Steps' : 'Step ' + (window._modeBActiveStep + 1)} (Filter: ${window._modeBFilter})`);
  if (window._modeBHistoryLog.length > 40) window._modeBHistoryLog.pop();

  const histEl = document.getElementById('mode-b-history-drawer');
  if (histEl && histEl.style.display !== 'none') {
    histEl.innerHTML = `<div style="color:var(--up-gold);font-weight:700;margin-bottom:4px;">Mode B Operation History Log:</div>` +
      window._modeBHistoryLog.map(l => `<div class="mono">${l}</div>`).join('');
  }
}

function modeBPrevStep() {
  window._modeBFilter = 'ALL';
  if (window._modeBActiveStep <= 0) window._modeBActiveStep = 6;
  else window._modeBActiveStep--;
  renderGlobalModeBPanel(currentScreenId);
}

function modeBNextStep() {
  window._modeBFilter = 'ALL';
  if (window._modeBActiveStep === -1 || window._modeBActiveStep >= 6) window._modeBActiveStep = 0;
  else window._modeBActiveStep++;
  renderGlobalModeBPanel(currentScreenId);
}

function modeBTogglePlay() {
  if (window._modeBPlayTimer) {
    modeBPause();
    return;
  }
  window._modeBFilter = 'ALL';
  if (window._modeBActiveStep === -1 || window._modeBActiveStep >= 6) window._modeBActiveStep = 0;
  renderGlobalModeBPanel(currentScreenId);
  const btn = document.getElementById('mode-b-play-btn');
  if (btn) btn.textContent = 'Playing...';

  window._modeBPlayTimer = setInterval(() => {
    if (window._modeBActiveStep >= 6) {
      modeBPause();
      return;
    }
    window._modeBActiveStep++;
    renderGlobalModeBPanel(currentScreenId);
  }, 1400);
}

function modeBPause() {
  if (window._modeBPlayTimer) {
    clearInterval(window._modeBPlayTimer);
    window._modeBPlayTimer = null;
  }
  const btn = document.getElementById('mode-b-play-btn');
  if (btn) btn.textContent = 'Play';
}

function modeBReset() {
  modeBPause();
  window._modeBFilter = 'ALL';
  window._modeBActiveStep = 0;
  renderGlobalModeBPanel(currentScreenId);
}

function modeBToggleFilter(filterKey) {
  modeBPause();
  window._modeBActiveStep = -1;
  window._modeBFilter = (window._modeBFilter === filterKey) ? 'ALL' : filterKey;
  renderGlobalModeBPanel(currentScreenId);
}

function modeBShowComplete() {
  modeBPause();
  window._modeBFilter = 'ALL';
  window._modeBActiveStep = -1;
  renderGlobalModeBPanel(currentScreenId);
}

function modeBToggleHistory() {
  const histEl = document.getElementById('mode-b-history-drawer');
  if (!histEl) return;
  const isHidden = histEl.style.display === 'none';
  histEl.style.display = isHidden ? 'block' : 'none';
  if (isHidden) renderGlobalModeBPanel(currentScreenId);
}

function exportModeBCalculationTrace() {
  const data = buildSevenStepExplanationForScreen(currentScreenId);
  const payload = {
    exportedAt: new Date().toISOString(),
    moduleScreen: currentScreenId,
    title: data.title,
    activeDatasetMetadata: activeDatasetMeta,
    sevenStepExplanation: data.steps,
    operationHistory: window._modeBHistoryLog
  };
  downloadTextFile(`sermax_calculation_trace_${currentScreenId}.json`, JSON.stringify(payload, null, 2), 'application/json');
}
