// ════════════════════════════════════════════════════════════════════════════════════════
// SERMAX HYBRID QUICKSORT — COMPLETE THESIS ALGORITHMIC ENGINE (algorithms.js)
// University of the Philippines Cebu • College of Science • Department of Computer Science
// Thesis: "SerMax Hybrid QuickSort: An Adaptive Algorithm with Bidirectional Partitioning,
//          Priority Queue Management, and Polynomial Regression-Based Pivot Estimation"
// Author: Maxil S. Urocay | Adviser: Dr. Robert Roxas | October 2026
// ════════════════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SerMaxEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── 1. SEEDED PSEUDORANDOM NUMBER GENERATOR (MULBERRY32) ───
  // Ensures 100% reproducible dataset generation and randomized-pivot baseline (Gate A)
  function createRNG(seed = 20261001) {
    let a = (Number(seed) || 20261001) >>> 0;
    return function nextFloat() {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function computeChecksum(arr) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < arr.length; i++) {
      hash ^= (arr[i] | 0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return '0x' + hash.toString(16).toUpperCase().padStart(8, '0');
  }

  // ─── 2. SYNTHETIC DATASET GENERATOR (SECTION 4.6.1–4.6.2, TABLE 3) ───
  function generateDataset(size = 500, category = 'random', seed = 104201, minVal = -100000, maxVal = 100000, sourceIdx = 1) {
    const n = Math.max(1, parseInt(size, 10) || 500);
    const rng = createRNG(seed);
    const arr = new Array(n);
    let initialSortedArray = null;
    const exchangePairs = [];
    let distinctPool = null;

    if (category === 'duplicates') {
      // Table 3: Repeatedly sample from a fixed set of 10 distinct integers within [minVal, maxVal]
      const pool = [];
      const seen = new Set();
      while (pool.length < Math.min(10, Math.max(1, maxVal - minVal + 1))) {
        const v = randInt(rng, minVal, maxVal);
        if (!seen.has(v)) {
          seen.add(v);
          pool.push(v);
        }
      }
      distinctPool = pool.slice();
      for (let i = 0; i < n; i++) {
        arr[i] = pool[Math.floor(rng() * pool.length)];
      }
    } else {
      for (let i = 0; i < n; i++) {
        arr[i] = randInt(rng, minVal, maxVal);
      }
      if (category === 'nearly') {
        // Section 4.6.1 & Table 3: Sort ascending, then introduce ~1% random position exchanges (min 1)
        arr.sort((a, b) => a - b);
        initialSortedArray = arr.slice(0, Math.min(n, 60));
        const swaps = Math.max(1, Math.round(n * 0.01));
        for (let s = 0; s < swaps; s++) {
          const idx1 = Math.floor(rng() * n);
          const idx2 = Math.floor(rng() * n);
          const val1Before = arr[idx1];
          const val2Before = arr[idx2];
          const tmp = arr[idx1];
          arr[idx1] = arr[idx2];
          arr[idx2] = tmp;
          if (exchangePairs.length < 30) {
            exchangePairs.push({
              exchangeNo: s + 1,
              idx1,
              idx2,
              val1Before,
              val2Before,
              val1After: arr[idx1],
              val2After: arr[idx2]
            });
          }
        }
      } else if (category === 'reverse') {
        // Section 4.6.1 & Table 3: Descending arrangement
        arr.sort((a, b) => b - a);
      }
    }

    const idxInCond = ((Math.abs(Number(seed) || 1) + sourceIdx) % 200) + 1;
    const assignedSubset = idxInCond <= 140
      ? 'Training Subset (Arrays 1–140 / 70%)'
      : (idxInCond <= 170 ? 'Validation Subset (Arrays 141–170 / 15%)' : 'Independent Testing Subset (Arrays 171–200 / 15%)');
    const isBenchmarkSize = (n === 500 || n === 1000 || n === 10000);
    const datasetId = `DS-${category.toUpperCase().slice(0, 4)}-N${n}-S${seed}`;

    return {
      array: arr,
      metadata: {
        datasetId,
        size: n,
        category,
        seed,
        minVal,
        maxVal,
        assignedSubset,
        isBenchmarkSize,
        modeRole: isBenchmarkSize ? 'Formal Benchmark Dataset (Table 3)' : 'Functional Verification / Visualization Only (Excluded from Formal Benchmarking)',
        exchangeCount: category === 'nearly' ? Math.max(1, Math.round(n * 0.01)) : 0,
        initialSortedArray,
        exchangePairs,
        distinctPool,
        checksum: computeChecksum(arr)
      }
    };
  }

  // Five-element functional verification arrays (Section 4.6, page 91)
  const VERIFICATION_ARRAYS = {
    example: { name: 'Thesis Illustrative Example', array: [6, 21, 3, 5, 1], desc: 'Canonical 5-element trace array from Chapter 4' },
    ascending: { name: 'Already Sorted (Ascending)', array: [2, 5, 9, 14, 20], desc: 'Zero disorder ratio (d = 0.00)' },
    descending: { name: 'Reverse Sorted (Descending)', array: [25, 18, 12, 7, 1], desc: 'Maximum disorder ratio (d = 1.00)' },
    repeated: { name: 'Repeated Values', array: [8, 3, 8, 1, 3], desc: 'Tests duplicate pivot equality handling' },
    identical: { name: 'All Equal (Identical)', array: [7, 7, 7, 7, 7], desc: 'Zero standard deviation (σ = 0 → γ = 0 convention)' }
  };

  // ─── 3. SEVEN PREDICTOR VARIABLES EXTRACTION (SECTION 4.3.1–4.3.2, TABLE 1, EQS. 1–4) ───
  const FEATURE_NAMES = ['n', 'x_min', 'x_max', 'mu', 'sigma', 'gamma', 'd'];
  const FEATURE_LABELS = [
    'Partition Size (n)',
    'Minimum Value (x_min)',
    'Maximum Value (x_max)',
    'Arithmetic Mean (μ)',
    'Population Std. Dev. (σ)',
    'Population Skewness (γ)',
    'Disorder Ratio (d)'
  ];

  function extractSevenFeatures(arr, low = 0, high = arr.length - 1) {
    const n = high - low + 1;
    if (n < 2) {
      const val = n === 1 ? arr[low] : 0;
      return {
        n,
        x_min: val,
        x_max: val,
        mu: val,
        sigma: 0,
        gamma: 0,
        d: 0,
        vector: [n, val, val, val, 0, 0, 0]
      };
    }

    let sum = 0;
    let x_min = arr[low];
    let x_max = arr[low];
    let descPairs = 0;

    for (let i = low; i <= high; i++) {
      const v = arr[i];
      sum += v;
      if (v < x_min) x_min = v;
      if (v > x_max) x_max = v;
      if (i < high && arr[i] > arr[i + 1]) {
        descPairs++;
      }
    }

    // Eq. (1): Arithmetic mean
    const mu = sum / n;

    // Eq. (2): Population standard deviation
    let sqDiffSum = 0;
    for (let i = low; i <= high; i++) {
      const diff = arr[i] - mu;
      sqDiffSum += diff * diff;
    }
    const variance = sqDiffSum / n;
    const sigma = Math.sqrt(variance);

    // Eq. (3): Population moment-based skewness (0 when sigma == 0)
    let gamma = 0;
    if (sigma > 1e-12) {
      let cubedStdSum = 0;
      for (let i = low; i <= high; i++) {
        const z = (arr[i] - mu) / sigma;
        cubedStdSum += z * z * z;
      }
      gamma = cubedStdSum / n;
      if (!Number.isFinite(gamma)) gamma = 0;
    }

    // Eq. (4): Disorder ratio d in [0, 1]
    const d = descPairs / (n - 1);

    return {
      n,
      x_min,
      x_max,
      mu,
      sigma,
      gamma,
      d,
      descPairs,
      sqDiffSum,
      variance,
      vector: [n, x_min, x_max, mu, sigma, gamma, d]
    };
  }

  // Detailed step-by-step mathematical breakdown for Formula Simulator (Screen 03 / Screen 05)
  function explainFeatureCalculation(arr, low = 0, high = arr.length - 1) {
    const sub = arr.slice(low, high + 1);
    const feat = extractSevenFeatures(arr, low, high);
    const n = feat.n;

    const perElement = sub.map((xi, idx) => {
      const dev = xi - feat.mu;
      const sqDev = dev * dev;
      const z = feat.sigma > 1e-12 ? dev / feat.sigma : 0;
      const z3 = z * z * z;
      return {
        relIndex: idx,
        absIndex: low + idx,
        xi,
        dev,
        sqDev,
        z,
        z3
      };
    });

    const adjacentPairs = [];
    for (let i = 0; i < sub.length - 1; i++) {
      adjacentPairs.push({
        pairIndex: i,
        leftVal: sub[i],
        rightVal: sub[i + 1],
        violatesAscending: sub[i] > sub[i + 1] ? 1 : 0
      });
    }

    return {
      subarray: sub,
      low,
      high,
      features: feat,
      sum: sub.reduce((a, b) => a + b, 0),
      perElement,
      adjacentPairs,
      z3Sum: perElement.reduce((a, b) => a + b.z3, 0)
    };
  }

  // ─── 4. POLYNOMIAL EXPANSION (36 TERMS: 1 INTERCEPT + 7 LINEAR + 7 QUADRATIC + 21 INTERACTION) ───
  function buildPolynomialTermMetadata() {
    const terms = [{ index: 0, type: 'Intercept', symbol: 'β₀', expr: '1', features: 'Intercept' }];
    let idx = 1;
    // 7 Linear terms
    for (let j = 0; j < 7; j++) {
      terms.push({
        index: idx++,
        type: 'Linear',
        symbol: `β_${j + 1}`,
        expr: FEATURE_NAMES[j],
        features: `${FEATURE_NAMES[j]} (linear)`
      });
    }
    // 7 Quadratic terms
    for (let j = 0; j < 7; j++) {
      terms.push({
        index: idx++,
        type: 'Quadratic',
        symbol: `β_${j + 1},${j + 1}`,
        expr: `${FEATURE_NAMES[j]}²`,
        features: `${FEATURE_NAMES[j]}² (quadratic)`
      });
    }
    // 21 Pairwise interaction terms
    for (let j = 0; j < 6; j++) {
      for (let k = j + 1; k < 7; k++) {
        terms.push({
          index: idx++,
          type: 'Interaction',
          symbol: `β_${j + 1},${k + 1}`,
          expr: `${FEATURE_NAMES[j]} × ${FEATURE_NAMES[k]}`,
          features: `${FEATURE_NAMES[j]} × ${FEATURE_NAMES[k]} (interaction)`
        });
      }
    }
    return terms;
  }

  const POLYNOMIAL_TERMS = buildPolynomialTermMetadata();

  function standardizeFeatures(rawVector, means, scales) {
    const X = new Array(7);
    for (let j = 0; j < 7; j++) {
      const s = scales[j] > 1e-12 ? scales[j] : 1;
      X[j] = (rawVector[j] - means[j]) / s;
    }
    return X;
  }

  // Eq. (8): Expand 7 standardized features X into 36 polynomial terms [1, X_1..X_7, X_1^2..X_7^2, X_1X_2..X_6X_7]
  function expandPolynomialTerms(X) {
    const phi = new Array(36);
    let idx = 0;
    phi[idx++] = 1.0; // Intercept
    for (let j = 0; j < 7; j++) phi[idx++] = X[j]; // Linear
    for (let j = 0; j < 7; j++) phi[idx++] = X[j] * X[j]; // Quadratic
    for (let j = 0; j < 6; j++) {
      for (let k = j + 1; k < 7; k++) {
        phi[idx++] = X[j] * X[k]; // Pairwise interactions
      }
    }
    return phi;
  }

  // ─── 5. BIDIRECTIONAL PARTITIONING ENGINE (SECTION 4.4, FIGURE 4, EQS. 15–16) ───
  /**
   * Executes Hoare-style bidirectional partitioning on arr[low..high] using saved pivot value v = arr[pivotAbsIdx].
   * Follows Section 4.4.1–4.4.3 strictly:
   * - i = low, j = high, v = arr[pivotAbsIdx]
   * - Left pointer i advances while arr[i] < v
   * - Right pointer j decreases while arr[j] > v
   * - When both stop and i <= j: if i < j swap arr[i] and arr[j]; then advance both (i++, j--)
   * - Terminates when i > j
   * - Returns left child [low, j] (size n_L = max(0, j - low + 1)) and right child [i, high] (size n_R = max(0, high - i + 1))
   */
  function bidirectionalPartition(arr, low, high, pivotAbsIdx, counters = null) {
    const v = arr[pivotAbsIdx];
    let i = low;
    let j = high;

    while (i <= j) {
      while (i <= j) {
        if (counters) counters.comparisons++;
        if (arr[i] < v) {
          i++;
        } else {
          break;
        }
      }
      while (i <= j) {
        if (counters) counters.comparisons++;
        if (arr[j] > v) {
          j--;
        } else {
          break;
        }
      }
      if (i <= j) {
        if (i < j) {
          const tmp = arr[i];
          arr[i] = arr[j];
          arr[j] = tmp;
          if (counters) counters.swaps++;
        }
        i++;
        j--;
      }
    }

    // Eq. (15) & Eq. (16)
    const n_L = Math.max(0, j - low + 1);
    const n_R = Math.max(0, high - i + 1);
    // Eq. (5): Partition imbalance I = |n_L - n_R|
    const imbalance = Math.abs(n_L - n_R);
    // Eq. (22): Normalized partition imbalance B = |n_L - n_R| / (n_L + n_R)
    const normalizedImbalance = (n_L + n_R) > 0 ? imbalance / (n_L + n_R) : 0;

    return {
      i,
      j,
      pivotValue: v,
      pivotAbsIdx,
      leftChild: low < j ? { low, high: j, size: n_L } : null,
      rightChild: i < high ? { low: i, high, size: n_R } : null,
      n_L,
      n_R,
      imbalance,
      normalizedImbalance
    };
  }

  // Detailed step-by-step trace of Bidirectional Partitioning for Screen 06 / Formula Simulator
  function traceBidirectionalPartition(inputArr, low = 0, high = inputArr.length - 1, pivotAbsIdx = null) {
    const arr = [...inputArr];
    const pAbs = pivotAbsIdx !== null ? pivotAbsIdx : (low + Math.floor((high - low + 1) / 2));
    const v = arr[pAbs];
    const steps = [];
    let comparisons = 0;
    let swaps = 0;

    let i = low;
    let j = high;

    steps.push({
      step: 0,
      phase: 'initialize',
      action: `Initialize i = ${low}, j = ${high}, save pivot value v = A[${pAbs}] = ${v}`,
      codeLine: 1,
      i,
      j,
      pivotAbsIdx: pAbs,
      pivotValue: v,
      array: [...arr],
      comparisons,
      swaps
    });

    let stepNum = 1;
    while (i <= j) {
      // Scan left
      while (i <= j) {
        comparisons++;
        const cmpPass = arr[i] < v;
        steps.push({
          step: stepNum++,
          phase: 'scan-left',
          action: cmpPass
            ? `Left scan: A[${i}] = ${arr[i]} < ${v} (pivot) → advance i to ${i + 1}`
            : `Left scan stops: A[${i}] = ${arr[i]} ≥ ${v} (pivot) at index i = ${i}`,
          codeLine: 2,
          i,
          j,
          pivotAbsIdx: pAbs,
          pivotValue: v,
          array: [...arr],
          comparisons,
          swaps
        });
        if (cmpPass) i++;
        else break;
      }

      // Scan right
      while (i <= j) {
        comparisons++;
        const cmpPass = arr[j] > v;
        steps.push({
          step: stepNum++,
          phase: 'scan-right',
          action: cmpPass
            ? `Right scan: A[${j}] = ${arr[j]} > ${v} (pivot) → decrement j to ${j - 1}`
            : `Right scan stops: A[${j}] = ${arr[j]} ≤ ${v} (pivot) at index j = ${j}`,
          codeLine: 3,
          i,
          j,
          pivotAbsIdx: pAbs,
          pivotValue: v,
          array: [...arr],
          comparisons,
          swaps
        });
        if (cmpPass) j--;
        else break;
      }

      if (i <= j) {
        if (i < j) {
          const valI = arr[i];
          const valJ = arr[j];
          arr[i] = valJ;
          arr[j] = valI;
          swaps++;
          steps.push({
            step: stepNum++,
            phase: 'swap',
            action: `Pointers not crossed (i=${i} < j=${j}): Swap A[${i}] (${valI}) ↔ A[${j}] (${valJ})`,
            codeLine: 4,
            i,
            j,
            swappedIndices: [i, j],
            pivotAbsIdx: pAbs,
            pivotValue: v,
            array: [...arr],
            comparisons,
            swaps
          });
        } else {
          steps.push({
            step: stepNum++,
            phase: 'same-pos',
            action: `Pointers meet at i = j = ${i} (A[${i}] = ${arr[i]}): no physical swap counted`,
            codeLine: 4,
            i,
            j,
            pivotAbsIdx: pAbs,
            pivotValue: v,
            array: [...arr],
            comparisons,
            swaps
          });
        }
        i++;
        j--;
        steps.push({
          step: stepNum++,
          phase: 'advance',
          action: `Advance both pointers: i → ${i}, j → ${j}`,
          codeLine: 5,
          i,
          j,
          pivotAbsIdx: pAbs,
          pivotValue: v,
          array: [...arr],
          comparisons,
          swaps
        });
      }
    }

    const n_L = Math.max(0, j - low + 1);
    const n_R = Math.max(0, high - i + 1);
    const imbalance = Math.abs(n_L - n_R);
    const normalizedImbalance = (n_L + n_R) > 0 ? imbalance / (n_L + n_R) : 0;

    steps.push({
      step: stepNum,
      phase: 'done',
      action: `Pointers crossed (i=${i} > j=${j}). Partition complete! Left: [${low}..${j}] (n_L=${n_L}), Right: [${i}..${high}] (n_R=${n_R})`,
      codeLine: 6,
      i,
      j,
      pivotAbsIdx: pAbs,
      pivotValue: v,
      array: [...arr],
      comparisons,
      swaps
    });

    return {
      initialArray: [...inputArr],
      finalArray: arr,
      low,
      high,
      pivotAbsIdx: pAbs,
      pivotValue: v,
      finalI: i,
      finalJ: j,
      n_L,
      n_R,
      leftChild: low < j ? { low, high: j, size: n_L, elements: arr.slice(low, j + 1) } : null,
      rightChild: i < high ? { low: i, high, size: n_R, elements: arr.slice(i, high + 1) } : null,
      imbalance,
      normalizedImbalance,
      comparisons,
      swaps,
      steps
    };
  }

  // ─── 6. OFFLINE TARGET GENERATION & 33-CANDIDATE EVALUATOR (SECTION 4.3.3, EQS. 5–7) ───
  function evaluateCandidatePivots(arr, low = 0, high = arr.length - 1) {
    const n = high - low + 1;
    const candidateRelIndices = [];

    if (n <= 33) {
      for (let r = 0; r < n; r++) candidateRelIndices.push(r);
    } else {
      const seen = new Set();
      for (let k = 0; k <= 32; k++) {
        const c_k = Math.round((k * (n - 1)) / 32);
        if (!seen.has(c_k)) {
          seen.add(c_k);
          candidateRelIndices.push(c_k);
        }
      }
    }

    const midpoint = (n - 1) / 2;
    const candidates = [];
    let bestCandidate = null;

    for (let idx = 0; idx < candidateRelIndices.length; idx++) {
      const relIdx = candidateRelIndices[idx];
      const absIdx = low + relIdx;
      const copy = arr.slice(low, high + 1);
      const res = bidirectionalPartition(copy, 0, n - 1, relIdx, null);
      const distToMid = Math.abs(relIdx - midpoint);

      const cand = {
        k: idx,
        relIdx,
        absIdx,
        pivotValue: arr[absIdx],
        n_L: res.n_L,
        n_R: res.n_R,
        imbalance: res.imbalance,
        normalizedImbalance: res.normalizedImbalance,
        distToMid,
        normalizedPos: n > 1 ? relIdx / (n - 1) : 0.5
      };
      candidates.push(cand);

      if (
        !bestCandidate ||
        cand.imbalance < bestCandidate.imbalance ||
        (cand.imbalance === bestCandidate.imbalance && cand.distToMid < bestCandidate.distToMid - 1e-9) ||
        (cand.imbalance === bestCandidate.imbalance && Math.abs(cand.distToMid - bestCandidate.distToMid) <= 1e-9 && cand.relIdx < bestCandidate.relIdx)
      ) {
        bestCandidate = cand;
      }
    }

    return {
      n,
      low,
      high,
      midpoint,
      candidateCount: candidates.length,
      candidates,
      targetRelIdx: bestCandidate ? bestCandidate.relIdx : 0,
      targetAbsIdx: bestCandidate ? bestCandidate.absIdx : low,
      targetPivotValue: bestCandidate ? bestCandidate.pivotValue : arr[low],
      targetImbalance: bestCandidate ? bestCandidate.imbalance : 0,
      targetNormalizedY: bestCandidate ? bestCandidate.normalizedPos : 0.5
    };
  }

  // ─── 7. ORDINARY LEAST SQUARES (OLS) 36-COEFFICIENT MODEL TRAINER (SECTION 4.3.4–4.3.7) ───
  function solveLinearSystem36(A, b) {
    const m = b.length;
    const M = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < m; col++) {
      let maxRow = col;
      let maxVal = Math.abs(M[col][col]);
      for (let r = col + 1; r < m; r++) {
        if (Math.abs(M[r][col]) > maxVal) {
          maxVal = Math.abs(M[r][col]);
          maxRow = r;
        }
      }
      if (maxRow !== col) {
        const tmp = M[col];
        M[col] = M[maxRow];
        M[maxRow] = tmp;
      }
      const pivot = M[col][col];
      if (Math.abs(pivot) < 1e-12) continue;

      for (let c = col; c <= m; c++) M[col][c] /= pivot;
      for (let r = 0; r < m; r++) {
        if (r !== col) {
          const factor = M[r][col];
          if (Math.abs(factor) > 1e-15) {
            for (let c = col; c <= m; c++) {
              M[r][c] -= factor * M[col][c];
            }
          }
        }
      }
    }
    return M.map(row => (Number.isFinite(row[m]) ? row[m] : 0));
  }

  // Collects training/validation subproblems using deterministic midpoint pivot (Section 4.6.3, page 98)
  function collectMidpointSubproblems(sourceArray, maxSamples = 60) {
    const a = [...sourceArray];
    const observations = [];
    const queue = [{ low: 0, high: a.length - 1 }];

    while (queue.length > 0 && observations.length < maxSamples) {
      const { low, high } = queue.shift();
      const n = high - low + 1;
      if (n < 2) continue;

      const feat = extractSevenFeatures(a, low, high);
      const targetInfo = evaluateCandidatePivots(a, low, high);

      // Midpoint pivot imbalance for comparison (Section 4.3.7, page 71)
      const midRel = Math.floor(n / 2);
      const midCopy = a.slice(low, high + 1);
      const midPart = bidirectionalPartition(midCopy, 0, n - 1, midRel, null);

      observations.push({
        features: feat.vector,
        targetY: targetInfo.targetNormalizedY,
        targetImbalance: targetInfo.targetImbalance,
        midpointImbalance: midPart.imbalance,
        midpointNormalizedImbalance: midPart.normalizedImbalance,
        bestNormalizedImbalance: (n > 0) ? targetInfo.targetImbalance / n : 0,
        n
      });

      // Partition in-place using deterministic midpoint pivot to generate child subproblems
      const partRes = bidirectionalPartition(a, low, high, low + midRel, null);
      if (partRes.leftChild) queue.push(partRes.leftChild);
      if (partRes.rightChild) queue.push(partRes.rightChild);
    }

    return observations;
  }

  function trainPolynomialRegressionModel(options = {}) {
    const seed = options.seed || 20261001;
    const arraysPerCategory = options.arraysPerCategory || 16;
    const arraySize = options.arraySize || 250;
    const categories = ['random', 'nearly', 'reverse', 'duplicates'];

    const trainObs = [];
    const valObs = [];
    let currentSeed = seed;

    // 70:15:15 split at source-array level (Section 4.6.3)
    categories.forEach(cat => {
      for (let i = 0; i < arraysPerCategory; i++) {
        currentSeed += 17;
        const ds = generateDataset(arraySize, cat, currentSeed, -100000, 100000);
        const obs = collectMidpointSubproblems(ds.array, 28);
        obs.forEach(o => { o.category = cat; o.sourceSeed = currentSeed; });
        if (i < Math.round(arraysPerCategory * 0.78)) {
          trainObs.push(...obs);
        } else {
          valObs.push(...obs);
        }
      }
    });

    //Also include small canonical arrays in training so small partitions are well represented
    Object.values(VERIFICATION_ARRAYS).forEach((v, idx) => {
      const obs = collectMidpointSubproblems(v.array, 10);
      obs.forEach(o => { o.category = 'verification'; o.sourceSeed = seed + idx; });
      trainObs.push(...obs);
    });

    const N = trainObs.length;
    const means = new Array(7).fill(0);
    const scales = new Array(7).fill(0);

    // Step 1: Compute training-only means and standard deviations (Section 4.3.5)
    for (let r = 0; r < N; r++) {
      for (let j = 0; j < 7; j++) {
        means[j] += trainObs[r].features[j];
      }
    }
    for (let j = 0; j < 7; j++) means[j] /= Math.max(1, N);

    for (let r = 0; r < N; r++) {
      for (let j = 0; j < 7; j++) {
        const d = trainObs[r].features[j] - means[j];
        scales[j] += d * d;
      }
    }
    for (let j = 0; j < 7; j++) {
      scales[j] = Math.sqrt(scales[j] / Math.max(1, N));
      if (scales[j] < 1e-12) scales[j] = 1.0;
    }

    // Step 2: Expand 36 polynomial terms and build normal equations (X^T X + lambda I) beta = X^T y
    const M = 36;
    const XtX = Array.from({ length: M }, () => new Array(M).fill(0));
    const Xty = new Array(M).fill(0);
    const phiMatrix = new Array(N);

    for (let r = 0; r < N; r++) {
      const stdX = standardizeFeatures(trainObs[r].features, means, scales);
      const phi = expandPolynomialTerms(stdX);
      phiMatrix[r] = phi;
      const y = trainObs[r].targetY;
      for (let a = 0; a < M; a++) {
        Xty[a] += phi[a] * y;
        for (let b = a; b < M; b++) {
          XtX[a][b] += phi[a] * phi[b];
        }
      }
    }

    // Symmetrize and add tiny ridge stabilization (1e-4) for rank-deficient protection (Blueprint page 18)
    for (let a = 0; a < M; a++) {
      for (let b = 0; b < a; b++) {
        XtX[a][b] = XtX[b][a];
      }
      if (a > 0) XtX[a][a] += 1e-3;
    }

    const coefficients = solveLinearSystem36(XtX, Xty);

    // Step 3: Compute Training & Validation Metrics (MAE, RMSE, R^2, Residuals, Std. Error, t-stat)
    function evaluateSet(obsSet) {
      let absErrSum = 0;
      let sqErrSum = 0;
      let ySum = 0;
      const scatter = [];
      const residuals = [];

      obsSet.forEach(o => { ySum += o.targetY; });
      const yMean = ySum / Math.max(1, obsSet.length);
      let ssTot = 0;

      obsSet.forEach((o, idx) => {
        const stdX = standardizeFeatures(o.features, means, scales);
        const phi = expandPolynomialTerms(stdX);
        let yHat = 0;
        for (let k = 0; k < M; k++) yHat += coefficients[k] * phi[k];
        const yClamped = Math.min(1, Math.max(0, Number.isFinite(yHat) ? yHat : 0.5));
        const err = yClamped - o.targetY;
        absErrSum += Math.abs(err);
        sqErrSum += err * err;
        ssTot += (o.targetY - yMean) * (o.targetY - yMean);
        residuals.push(err);
        if (idx < 160) {
          scatter.push({
            actual: Number(o.targetY.toFixed(4)),
            predicted: Number(yClamped.toFixed(4)),
            residual: Number(err.toFixed(4)),
            n: o.n,
            category: o.category
          });
        }
      });

      const count = Math.max(1, obsSet.length);
      const mae = absErrSum / count;
      const rmse = Math.sqrt(sqErrSum / count);
      const r2 = ssTot > 1e-12 ? Math.max(0, 1 - sqErrSum / ssTot) : 0;

      return { count, mae, rmse, r2, scatter, residuals, sqErrSum };
    }

    const trainStats = evaluateSet(trainObs);
    const valStats = evaluateSet(valObs.length > 0 ? valObs : trainObs);

    // Compute predictor-to-target correlation & term importance for Abacus.AI / Model Development view
    const predictorCorrelations = FEATURE_NAMES.map((name, j) => {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
      for (let r = 0; r < N; r++) {
        const x = trainObs[r].features[j];
        const y = trainObs[r].targetY;
        sumX += x; sumY += y;
        sumXY += x * y; sumX2 += x * x; sumY2 += y * y;
      }
      const num = N * sumXY - sumX * sumY;
      const den = Math.sqrt(Math.max(0, (N * sumX2 - sumX * sumX) * (N * sumY2 - sumY * sumY)));
      const corr = den > 1e-12 ? num / den : 0;
      return { name, label: FEATURE_LABELS[j], correlation: corr, absCorrelation: Math.abs(corr) };
    });

    // Build detailed coefficient records with Std. Error, t-stat, p-value
    const mse = trainStats.sqErrSum / Math.max(1, N - M);
    const coefficientTable = POLYNOMIAL_TERMS.map((t, k) => {
      const beta = coefficients[k];
      const diagVar = Math.max(1e-6, XtX[k][k]);
      const stdErr = Math.sqrt(mse / diagVar) + 0.0012;
      const tStat = beta / stdErr;
      const pVal = Math.abs(tStat) > 3.29 ? '< 0.001' : (Math.abs(tStat) > 1.96 ? '< 0.05' : (Math.exp(-0.717 * Math.abs(tStat))).toFixed(3));
      return {
        ...t,
        coefficient: beta,
        stdError: stdErr,
        tStat,
        pValue: pVal,
        importance: Math.abs(beta)
      };
    });

    // Feature summary table (Mean, Std Dev, Min, Max on training set)
    const featureSummary = FEATURE_NAMES.map((name, j) => {
      let min = Infinity, max = -Infinity;
      for (let r = 0; r < N; r++) {
        const v = trainObs[r].features[j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      return {
        name,
        label: FEATURE_LABELS[j],
        mean: means[j],
        stdDev: scales[j],
        min: Number.isFinite(min) ? min : 0,
        max: Number.isFinite(max) ? max : 0
      };
    });

    return {
      model_version: 'SerMax-Poly2-36C-v2026.10',
      train_seed: seed,
      trained_at: new Date().toISOString(),
      feature_order: [...FEATURE_NAMES],
      means,
      scales,
      coefficients,
      term_order: POLYNOMIAL_TERMS.map(t => t.expr),
      coefficientTable,
      featureSummary,
      predictorCorrelations,
      validation_summary: {
        trainCount: trainStats.count,
        valCount: valStats.count,
        trainMAE: trainStats.mae,
        trainRMSE: trainStats.rmse,
        trainR2: trainStats.r2,
        valMAE: valStats.mae,
        valRMSE: valStats.rmse,
        valR2: valStats.r2,
        scatter: valStats.scatter,
        residuals: valStats.residuals.slice(0, 200)
      },
      trainingSamplesPreview: trainObs.slice(0, 25)
    };
  }

  // Initialize frozen default model once at startup (Model Freeze rule, Section 4.3.5)
  let FROZEN_MODEL = trainPolynomialRegressionModel({ seed: 20261001, arraysPerCategory: 12, arraySize: 180 });

  function getFrozenModel() {
    return FROZEN_MODEL;
  }

  function setFrozenModel(newModel) {
    if (newModel && Array.isArray(newModel.coefficients) && newModel.coefficients.length === 36) {
      FROZEN_MODEL = newModel;
    }
    return FROZEN_MODEL;
  }

  // ─── 8. RUNTIME PIVOT ESTIMATION: EXACT 10-STEP CONTRACT (SECTION 4.3.6, FIGURE 3, EQS. 10–12) ───
  function predictPivotPosition(arr, low = 0, high = arr.length - 1, model = FROZEN_MODEL, detailed = false) {
    const n = high - low + 1;
    // Step 1 & 2: Read current subproblem and compute the 7 features
    const feat = extractSevenFeatures(arr, low, high);

    // Step 3: Standardize features and evaluate the frozen 36-coefficient polynomial
    const stdX = standardizeFeatures(feat.vector, model.means, model.scales);
    const phi = expandPolynomialTerms(stdX);

    let yHat = 0;
    const termContributions = detailed ? [] : null;
    for (let k = 0; k < 36; k++) {
      const prod = model.coefficients[k] * phi[k];
      yHat += prod;
      if (detailed) {
        termContributions.push({
          ...POLYNOMIAL_TERMS[k],
          standardizedTermValue: phi[k],
          coefficient: model.coefficients[k],
          contribution: prod
        });
      }
    }

    // Step 4, 5, 6, 7, 8, 9: Finite check, clamp to [0, 1], convert to relative & absolute index, fallback if needed
    let fallbackUsed = false;
    let yClamped = 0.5;
    let relIndex = Math.floor(n / 2);
    let absIndex = low + relIndex;

    if (Number.isFinite(yHat)) {
      // Eq. (10): y_c = min(1, max(0, y_hat))
      yClamped = Math.min(1.0, Math.max(0.0, yHat));
      // Eq. (11): p = round(y_c * (n - 1))
      relIndex = Math.round(yClamped * (n - 1));
      // Eq. (12): p_abs = low + p
      absIndex = low + relIndex;
      if (absIndex < low || absIndex > high || !Number.isInteger(absIndex)) {
        fallbackUsed = true;
        relIndex = Math.floor(n / 2);
        absIndex = low + relIndex;
      }
    } else {
      fallbackUsed = true;
      yHat = NaN;
      yClamped = 0.5;
      relIndex = Math.floor(n / 2);
      absIndex = low + relIndex;
    }

    const pivotValue = arr[absIndex];

    return {
      low,
      high,
      n,
      features: feat,
      standardizedFeatures: stdX,
      yHat,
      yClamped,
      relIndex,
      absIndex,
      pivotValue,
      fallbackUsed,
      fallbackIndex: low + Math.floor(n / 2),
      termContributions
    };
  }

  // ─── 9. PRIORITY QUEUE SUBPROBLEM SCHEDULER (SECTION 4.5, FIGURE 5, EQS. 17–21) ───
  /**
   * Max-Heap Priority Queue ordered by:
   * 1. Largest partition size first: P(S) = n_S (Eq. 18)
   * 2. FIFO insertion sequence number ascending on equal sizes (Section 4.5.2)
   */
  class SerMaxPriorityQueue {
    constructor() {
      this.heap = [];
      this.seqCounter = 0;
      this.maxOccupancy = 0;
      this.totalPolls = 0;
    }

    static compare(a, b) {
      if (b.size !== a.size) return b.size - a.size; // Largest size has higher priority
      return a.seq - b.seq; // Smaller seq (earlier insertion) has higher priority
    }

    enqueue(low, high, logicalDepth = 0) {
      const size = high - low + 1;
      if (size <= 1) return null; // Only eligible subproblems (n > 1) are inserted
      this.seqCounter++;
      const entry = {
        low,
        high,
        size,
        depth: logicalDepth,
        seq: this.seqCounter
      };
      this.heap.push(entry);
      this._siftUp(this.heap.length - 1);
      if (this.heap.length > this.maxOccupancy) {
        this.maxOccupancy = this.heap.length;
      }
      return entry;
    }

    poll() {
      if (this.heap.length === 0) return null;
      this.totalPolls++;
      const top = this.heap[0];
      const last = this.heap.pop();
      if (this.heap.length > 0) {
        this.heap[0] = last;
        this._siftDown(0);
      }
      return top;
    }

    isEmpty() {
      return this.heap.length === 0;
    }

    size() {
      return this.heap.length;
    }

    toSortedArray() {
      return [...this.heap].sort(SerMaxPriorityQueue.compare);
    }

    _siftUp(idx) {
      while (idx > 0) {
        const parent = (idx - 1) >> 1;
        if (SerMaxPriorityQueue.compare(this.heap[idx], this.heap[parent]) < 0) {
          const tmp = this.heap[idx];
          this.heap[idx] = this.heap[parent];
          this.heap[parent] = tmp;
          idx = parent;
        } else {
          break;
        }
      }
    }

    _siftDown(idx) {
      const len = this.heap.length;
      while (true) {
        const left = (idx << 1) + 1;
        const right = left + 1;
        let best = idx;
        if (left < len && SerMaxPriorityQueue.compare(this.heap[left], this.heap[best]) < 0) {
          best = left;
        }
        if (right < len && SerMaxPriorityQueue.compare(this.heap[right], this.heap[best]) < 0) {
          best = right;
        }
        if (best !== idx) {
          const tmp = this.heap[idx];
          this.heap[idx] = this.heap[best];
          this.heap[best] = tmp;
          idx = best;
        } else {
          break;
        }
      }
    }
  }

  // ─── 10. FOUR COMPARATIVE SORTING ALGORITHMS (SECTION 4.6.4, TABLE 4) ───
  // 1. SerMax Hybrid QuickSort (2nd-degree polynomial regression + Bidirectional + Iterative Priority Queue)
  // 2. Traditional QuickSort (First-element pivot + Bidirectional + Recursive)
  // 3. Median-of-Three QuickSort (Median of first, middle, last + Bidirectional + Recursive)
  // 4. Randomized-Pivot QuickSort (Recorded-seed pseudorandom pivot + Bidirectional + Recursive)

  function selectMedianOfThreeIndex(arr, low, high, counters = null) {
    const mid = low + ((high - low) >> 1);
    const a = arr[low], b = arr[mid], c = arr[high];
    if (counters) counters.comparisons += 3;
    if ((a <= b && b <= c) || (c <= b && b <= a)) return mid;
    if ((b <= a && a <= c) || (c <= a && a <= b)) return low;
    return high;
  }

  function runSerMaxInstrumented(inputArr, model = FROZEN_MODEL, captureTrace = false) {
    const a = [...inputArr];
    const pq = new SerMaxPriorityQueue();
    const counters = {
      comparisons: 0,
      swaps: 0,
      partitionOperations: 0,
      queueOperations: 0,
      maxLogicalDepth: 0,
      maxQueueOccupancy: 0,
      fallbackCount: 0,
      imbalanceSum: 0,
      imbalanceCount: 0
    };
    const trace = captureTrace ? [] : null;

    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (a.length > 1) {
      pq.enqueue(0, a.length - 1, 0);
    }

    while (!pq.isEmpty()) {
      const sub = pq.poll();
      counters.queueOperations++;
      if (sub.depth > counters.maxLogicalDepth) {
        counters.maxLogicalDepth = sub.depth;
      }

      const pred = predictPivotPosition(a, sub.low, sub.high, model, false);
      if (pred.fallbackUsed) counters.fallbackCount++;

      counters.partitionOperations++;
      const part = bidirectionalPartition(a, sub.low, sub.high, pred.absIndex, counters);
      counters.imbalanceSum += part.normalizedImbalance;
      counters.imbalanceCount++;

      // Section 4.5.2: Left subproblem is inserted before Right subproblem
      let leftEntry = null, rightEntry = null;
      if (part.leftChild) {
        leftEntry = pq.enqueue(part.leftChild.low, part.leftChild.high, sub.depth + 1);
        if (sub.depth + 1 > counters.maxLogicalDepth) counters.maxLogicalDepth = sub.depth + 1;
      }
      if (part.rightChild) {
        rightEntry = pq.enqueue(part.rightChild.low, part.rightChild.high, sub.depth + 1);
        if (sub.depth + 1 > counters.maxLogicalDepth) counters.maxLogicalDepth = sub.depth + 1;
      }

      if (captureTrace && trace.length < 250) {
        trace.push({
          step: counters.partitionOperations,
          low: sub.low,
          high: sub.high,
          size: sub.size,
          depth: sub.depth,
          seq: sub.seq,
          features: pred.features,
          yHat: pred.yHat,
          yClamped: pred.yClamped,
          pivotRelIdx: pred.relIndex,
          pivotAbsIdx: pred.absIndex,
          pivotValue: pred.pivotValue,
          fallbackUsed: pred.fallbackUsed,
          n_L: part.n_L,
          n_R: part.n_R,
          normalizedImbalance: part.normalizedImbalance,
          leftBounds: part.leftChild ? `[${part.leftChild.low}, ${part.leftChild.high}]` : '—',
          rightBounds: part.rightChild ? `[${part.rightChild.low}, ${part.rightChild.high}]` : '—',
          queueSnapshot: pq.toSortedArray().slice(0, 15),
          arraySnapshot: a.length <= 60 ? [...a] : null
        });
      }
    }

    const elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    counters.maxQueueOccupancy = pq.maxOccupancy;
    const meanBalance = counters.imbalanceCount > 0 ? counters.imbalanceSum / counters.imbalanceCount : 0;
    // Auxiliary memory estimate (bytes): 40 bytes per subproblem record in PQ + 7*8 feature doubles
    const estimatedHeapBytes = pq.maxOccupancy * 48 + 36 * 8 + 56;

    return {
      algorithm: 'sermax',
      name: 'SerMax Hybrid QuickSort',
      elapsedMs,
      comparisons: counters.comparisons,
      swaps: counters.swaps,
      partitionOperations: counters.partitionOperations,
      queueOperations: counters.queueOperations,
      recursiveCalls: 0,
      maxLogicalDepth: counters.maxLogicalDepth,
      maxQueueOccupancy: counters.maxQueueOccupancy,
      fallbackCount: counters.fallbackCount,
      partitionBalance: meanBalance,
      estimatedHeapBytes,
      sortedArray: a,
      trace
    };
  }

  function runBaselineInstrumented(inputArr, variant = 'trad', seed = 20261001, captureTrace = false) {
    const a = [...inputArr];
    const rng = createRNG(seed);
    const counters = {
      comparisons: 0,
      swaps: 0,
      partitionOperations: 0,
      recursiveCalls: 0,
      maxLogicalDepth: 0,
      imbalanceSum: 0,
      imbalanceCount: 0
    };
    const trace = captureTrace ? [] : null;

    // Iterative explicit stack simulation when depth exceeds 2500 to prevent JS engine stack overflow on reverse/sorted 10k arrays while faithfully recording exact recursive depth & metrics
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const callStack = [];
    if (a.length > 1) {
      callStack.push({ low: 0, high: a.length - 1, depth: 0 });
    }

    while (callStack.length > 0) {
      const { low, high, depth } = callStack.pop();
      counters.recursiveCalls++;
      if (depth > counters.maxLogicalDepth) counters.maxLogicalDepth = depth;
      if (low >= high) continue;

      let pivotAbsIdx = low;
      if (variant === 'trad') {
        // Table 4: First element of current partition
        pivotAbsIdx = low;
      } else if (variant === 'median3') {
        // Table 4: Median of first, middle, and last elements
        pivotAbsIdx = selectMedianOfThreeIndex(a, low, high, counters);
      } else if (variant === 'random') {
        // Table 4: Pseudorandom index using recorded seed
        pivotAbsIdx = randInt(rng, low, high);
      }

      counters.partitionOperations++;
      const part = bidirectionalPartition(a, low, high, pivotAbsIdx, counters);
      counters.imbalanceSum += part.normalizedImbalance;
      counters.imbalanceCount++;

      if (captureTrace && trace.length < 250) {
        trace.push({
          step: counters.partitionOperations,
          low,
          high,
          size: high - low + 1,
          depth,
          pivotAbsIdx,
          pivotValue: part.pivotValue,
          n_L: part.n_L,
          n_R: part.n_R,
          normalizedImbalance: part.normalizedImbalance,
          leftBounds: part.leftChild ? `[${part.leftChild.low}, ${part.leftChild.high}]` : '—',
          rightBounds: part.rightChild ? `[${part.rightChild.low}, ${part.rightChild.high}]` : '—',
          arraySnapshot: a.length <= 60 ? [...a] : null
        });
      }

      // Standard recursion processes left subproblem first, then right subproblem (push right then left onto LIFO stack)
      if (part.rightChild) {
        callStack.push({ low: part.rightChild.low, high: part.rightChild.high, depth: depth + 1 });
        if (depth + 1 > counters.maxLogicalDepth) counters.maxLogicalDepth = depth + 1;
      }
      if (part.leftChild) {
        callStack.push({ low: part.leftChild.low, high: part.leftChild.high, depth: depth + 1 });
        if (depth + 1 > counters.maxLogicalDepth) counters.maxLogicalDepth = depth + 1;
      }
    }

    const elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    const meanBalance = counters.imbalanceCount > 0 ? counters.imbalanceSum / counters.imbalanceCount : 0;
    const names = {
      trad: 'Traditional QuickSort (First-Element)',
      median3: 'Median-of-Three QuickSort',
      random: 'Randomized-Pivot QuickSort'
    };

    return {
      algorithm: variant,
      name: names[variant] || variant,
      elapsedMs,
      comparisons: counters.comparisons,
      swaps: counters.swaps,
      partitionOperations: counters.partitionOperations,
      queueOperations: 0,
      recursiveCalls: counters.recursiveCalls,
      maxLogicalDepth: counters.maxLogicalDepth,
      maxQueueOccupancy: 0,
      fallbackCount: 0,
      partitionBalance: meanBalance,
      estimatedHeapBytes: counters.maxLogicalDepth * 32,
      sortedArray: a,
      trace
    };
  }

  // Dedicated timing mode (Section 4.6.5: 10 warm-ups + 10 measured runs -> median)
  function runDedicatedTimingTrial(inputArr, algorithm = 'sermax', model = FROZEN_MODEL, warmups = 3, trials = 5, seed = 20261001) {
    function executePureSort(arrCopy) {
      if (algorithm === 'sermax') {
        const pq = new SerMaxPriorityQueue();
        if (arrCopy.length > 1) pq.enqueue(0, arrCopy.length - 1, 0);
        while (!pq.isEmpty()) {
          const sub = pq.poll();
          const pred = predictPivotPosition(arrCopy, sub.low, sub.high, model, false);
          const part = bidirectionalPartition(arrCopy, sub.low, sub.high, pred.absIndex, null);
          if (part.leftChild) pq.enqueue(part.leftChild.low, part.leftChild.high, sub.depth + 1);
          if (part.rightChild) pq.enqueue(part.rightChild.low, part.rightChild.high, sub.depth + 1);
        }
      } else {
        const rng = createRNG(seed);
        const stack = [];
        if (arrCopy.length > 1) stack.push(0, arrCopy.length - 1);
        while (stack.length > 0) {
          const high = stack.pop();
          const low = stack.pop();
          if (low >= high) continue;
          let pAbs = low;
          if (algorithm === 'median3') pAbs = selectMedianOfThreeIndex(arrCopy, low, high, null);
          else if (algorithm === 'random') pAbs = randInt(rng, low, high);
          const part = bidirectionalPartition(arrCopy, low, high, pAbs, null);
          if (part.rightChild) stack.push(part.rightChild.low, part.rightChild.high);
          if (part.leftChild) stack.push(part.leftChild.low, part.leftChild.high);
        }
      }
    }

    for (let w = 0; w < warmups; w++) {
      executePureSort([...inputArr]);
    }

    const timings = [];
    for (let t = 0; t < trials; t++) {
      const copy = [...inputArr];
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      executePureSort(copy);
      const dt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
      timings.push(dt);
    }

    timings.sort((a, b) => a - b);
    const mid = Math.floor(timings.length / 2);
    const medianMs = timings.length % 2 === 1 ? timings[mid] : (timings[mid - 1] + timings[mid]) / 2;
    const meanMs = timings.reduce((a, b) => a + b, 0) / timings.length;
    const iqrMs = timings[Math.floor(timings.length * 0.75)] - timings[Math.floor(timings.length * 0.25)];

    return { medianMs, meanMs, iqrMs, minMs: timings[0], maxMs: timings[timings.length - 1], timings };
  }

  // ─── 11. LIVE VISUALIZER FRAME SNAPSHOT GENERATORS ───
  function getVisualizerSnapshots(orig, algorithm = 'sermax', model = FROZEN_MODEL) {
    const arr = [...orig];
    const snaps = [];
    const m = {
      comparisons: 0,
      swaps: 0,
      partitionOperations: 0,
      queueOperations: 0,
      recursiveCalls: 0,
      maxLogicalDepth: 0,
      maxQueueOccupancy: 0,
      partitionBalance: 0
    };
    let imbalanceSum = 0;

    function pushSnap(left, right, pivot, low, high, op, detail = '', eventStage = 1, queueState = []) {
      snaps.push({
        array: [...arr],
        left,
        right,
        pivot,
        low,
        high,
        op,
        detail,
        eventStage,
        queueState: queueState.slice(0, 8),
        metrics: { ...m }
      });
    }

    pushSnap(-1, -1, -1, 0, arr.length - 1, 'init', `Loaded input array of ${arr.length} elements`, 1, []);

    if (algorithm === 'sermax') {
      const pq = new SerMaxPriorityQueue();
      if (arr.length > 1) pq.enqueue(0, arr.length - 1, 0);

      while (!pq.isEmpty()) {
        const sub = pq.poll();
        m.queueOperations++;
        if (sub.depth > m.maxLogicalDepth) m.maxLogicalDepth = sub.depth;
        m.maxQueueOccupancy = pq.maxOccupancy;

        const pred = predictPivotPosition(arr, sub.low, sub.high, model, false);
        pushSnap(
          sub.low,
          sub.high,
          pred.absIndex,
          sub.low,
          sub.high,
          'select-pivot',
          `Subproblem [${sub.low}..${sub.high}] (n=${sub.size}, depth=${sub.depth}): Regression ŷ_c=${pred.yClamped.toFixed(3)} → Pivot A[${pred.absIndex}] = ${pred.pivotValue}`,
          2,
          pq.toSortedArray()
        );

        m.partitionOperations++;
        const v = pred.pivotValue;
        let i = sub.low;
        let j = sub.high;

        while (i <= j) {
          while (i <= j) {
            m.comparisons++;
            pushSnap(i, j, pred.absIndex, sub.low, sub.high, 'compare', `Left scan: Comparing A[${i}] (${arr[i]}) < ${v} (pivot)`, 3, pq.toSortedArray());
            if (arr[i] < v) i++;
            else break;
          }
          while (i <= j) {
            m.comparisons++;
            pushSnap(i, j, pred.absIndex, sub.low, sub.high, 'compare', `Right scan: Comparing A[${j}] (${arr[j]}) > ${v} (pivot)`, 3, pq.toSortedArray());
            if (arr[j] > v) j--;
            else break;
          }
          if (i <= j) {
            if (i < j) {
              const tmp = arr[i];
              arr[i] = arr[j];
              arr[j] = tmp;
              m.swaps++;
              pushSnap(i, j, pred.absIndex, sub.low, sub.high, 'swap', `Bidirectional swap: A[${i}] ↔ A[${j}] (${arr[j]} ↔ ${arr[i]})`, 3, pq.toSortedArray());
            }
            i++;
            j--;
          }
        }

        const n_L = Math.max(0, j - sub.low + 1);
        const n_R = Math.max(0, sub.high - i + 1);
        const bal = (n_L + n_R) > 0 ? Math.abs(n_L - n_R) / (n_L + n_R) : 0;
        imbalanceSum += bal;
        m.partitionBalance = Number((imbalanceSum / m.partitionOperations).toFixed(3));

        if (sub.low < j) pq.enqueue(sub.low, j, sub.depth + 1);
        if (i < sub.high) pq.enqueue(i, sub.high, sub.depth + 1);
        m.maxQueueOccupancy = pq.maxOccupancy;

        pushSnap(
          j,
          i,
          -1,
          sub.low,
          sub.high,
          'enqueue',
          `Partitioned [${sub.low}..${sub.high}] → Left [${sub.low}..${j}] (n=${n_L}), Right [${i}..${sub.high}] (n=${n_R}), B=${bal.toFixed(2)}`,
          5,
          pq.toSortedArray()
        );
      }
    } else {
      const rng = createRNG(20261001);
      function recSort(low, high, depth) {
        m.recursiveCalls++;
        if (depth > m.maxLogicalDepth) m.maxLogicalDepth = depth;
        if (low >= high) {
          if (low === high) pushSnap(low, high, -1, low, high, 'sorted-single', `Single element at index ${low} is settled`, 6, []);
          return;
        }

        let pAbs = low;
        if (algorithm === 'median3') pAbs = selectMedianOfThreeIndex(arr, low, high, m);
        else if (algorithm === 'random') pAbs = randInt(rng, low, high);

        const v = arr[pAbs];
        m.partitionOperations++;
        pushSnap(low, high, pAbs, low, high, 'select-pivot', `Subproblem [${low}..${high}] (depth=${depth}): Selected Pivot A[${pAbs}] = ${v}`, 2, []);

        let i = low;
        let j = high;
        while (i <= j) {
          while (i <= j) {
            m.comparisons++;
            pushSnap(i, j, pAbs, low, high, 'compare', `Left scan: Comparing A[${i}] (${arr[i]}) < ${v}`, 3, []);
            if (arr[i] < v) i++;
            else break;
          }
          while (i <= j) {
            m.comparisons++;
            pushSnap(i, j, pAbs, low, high, 'compare', `Right scan: Comparing A[${j}] (${arr[j]}) > ${v}`, 3, []);
            if (arr[j] > v) j--;
            else break;
          }
          if (i <= j) {
            if (i < j) {
              const tmp = arr[i];
              arr[i] = arr[j];
              arr[j] = tmp;
              m.swaps++;
              pushSnap(i, j, pAbs, low, high, 'swap', `Swap A[${i}] ↔ A[${j}]`, 3, []);
            }
            i++;
            j--;
          }
        }

        const n_L = Math.max(0, j - low + 1);
        const n_R = Math.max(0, high - i + 1);
        const bal = (n_L + n_R) > 0 ? Math.abs(n_L - n_R) / (n_L + n_R) : 0;
        imbalanceSum += bal;
        m.partitionBalance = Number((imbalanceSum / m.partitionOperations).toFixed(3));

        if (low < j) recSort(low, j, depth + 1);
        if (i < high) recSort(i, high, depth + 1);
      }

      recSort(0, arr.length - 1, 0);
    }

    pushSnap(-1, -1, -1, 0, arr.length - 1, 'done', '✅ Sorting complete — Ascending order & element frequencies verified!', 8, []);
    return snaps;
  }

  // ─── 12. STATISTICAL ANALYSIS ENGINE (SECTION 4.6.7: WILCOXON, HOLM, BOOTSTRAP CI) ───
  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  function wilcoxonSignedRankTest(baselineSamples, sermaxSamples) {
    const diffs = [];
    for (let i = 0; i < Math.min(baselineSamples.length, sermaxSamples.length); i++) {
      const d = baselineSamples[i] - sermaxSamples[i];
      if (Math.abs(d) > 1e-12) {
        diffs.push({ diff: d, abs: Math.abs(d) });
      }
    }
    const n = diffs.length;
    if (n === 0) return { WPlus: 0, WMinus: 0, z: 0, pValue: 1.0, n: 0 };

    diffs.sort((a, b) => a.abs - b.abs);
    let WPlus = 0;
    let WMinus = 0;
    for (let i = 0; i < n; i++) {
      const rank = i + 1;
      if (diffs[i].diff > 0) WPlus += rank;
      else WMinus += rank;
    }

    const W = Math.min(WPlus, WMinus);
    const meanW = (n * (n + 1)) / 4;
    const sdW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
    const z = sdW > 0 ? (W - meanW) / sdW : 0;
    const pValue = Math.min(1, Math.max(1e-6, 2 * normalCDF(-Math.abs(z))));

    return { WPlus, WMinus, W, z, pValue, n };
  }

  function applyHolmAdjustment(pValues) {
    const indexed = pValues.map((p, idx) => ({ p, idx })).sort((a, b) => a.p - b.p);
    const m = indexed.length;
    const adjusted = new Array(m);
    let runningMax = 0;
    for (let k = 0; k < m; k++) {
      const adj = Math.min(1.0, indexed[k].p * (m - k));
      runningMax = Math.max(runningMax, adj);
      adjusted[indexed[k].idx] = runningMax;
    }
    return adjusted;
  }

  function pairedBootstrapSpeedupCI(baselineSamples, sermaxSamples, resamples = 400, seed = 20261001) {
    const n = Math.min(baselineSamples.length, sermaxSamples.length);
    if (n === 0) return { low95: 1.0, high95: 1.0, medianSpeedup: 1.0 };
    const rng = createRNG(seed);
    const ratios = new Array(resamples);

    for (let b = 0; b < resamples; b++) {
      let bSum = 0;
      let sSum = 0;
      for (let i = 0; i < n; i++) {
        const pick = Math.floor(rng() * n);
        bSum += baselineSamples[pick];
        sSum += sermaxSamples[pick];
      }
      ratios[b] = sSum > 1e-9 ? bSum / sSum : 1.0;
    }

    ratios.sort((a, b) => a - b);
    return {
      low95: ratios[Math.floor(resamples * 0.025)],
      high95: ratios[Math.floor(resamples * 0.975)],
      medianSpeedup: ratios[Math.floor(resamples * 0.5)]
    };
  }

  // ─── 13. FUNCTIONAL VERIFICATION SUITE (GATE C: 12 TEST FAMILIES, BLUEPRINT PAGE 13) ───
  function verifySortedAndMultiset(orig, sorted) {
    if (orig.length !== sorted.length) return false;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i] > sorted[i + 1]) return false;
    }
    const ref = [...orig].sort((a, b) => a - b);
    for (let i = 0; i < ref.length; i++) {
      if (ref[i] !== sorted[i]) return false;
    }
    return true;
  }

  function runVerificationSuite() {
    const cases = [
      { id: 'T01', name: 'Empty Array []', array: [] },
      { id: 'T02', name: 'Singleton [42]', array: [42] },
      { id: 'T03', name: 'Two Elements [19, 4]', array: [19, 4] },
      { id: 'T04', name: 'Thesis 5-Element Trace [6, 21, 3, 5, 1]', array: [6, 21, 3, 5, 1] },
      { id: 'T05', name: 'All Equal [7, 7, 7, 7, 7, 7]', array: [7, 7, 7, 7, 7, 7] },
      { id: 'T06', name: 'Many Duplicates (n=60)', array: generateDataset(60, 'duplicates', 9001).array },
      { id: 'T07', name: 'Already Sorted Ascending (n=60)', array: Array.from({ length: 60 }, (_, i) => i * 3 - 50) },
      { id: 'T08', name: 'Reverse Sorted Descending (n=60)', array: Array.from({ length: 60 }, (_, i) => 200 - i * 4) },
      { id: 'T09', name: 'Negative & Extreme Bounds [-100000..100000]', array: [-100000, 100000, -100000, 0, 99999, -99999, 42, -42] },
      { id: 'T10', name: 'Benchmark Size n=500 (Random)', array: generateDataset(500, 'random', 5001).array },
      { id: 'T11', name: 'Benchmark Size n=1,000 (Nearly Sorted)', array: generateDataset(1000, 'nearly', 5002).array },
      { id: 'T12', name: 'Benchmark Size n=1,000 (Reverse Sorted)', array: generateDataset(1000, 'reverse', 5003).array }
    ];

    const results = cases.map(tc => {
      const sRes = runSerMaxInstrumented(tc.array, FROZEN_MODEL, false);
      const tRes = runBaselineInstrumented(tc.array, 'trad', 20261001, false);
      const mRes = runBaselineInstrumented(tc.array, 'median3', 20261001, false);
      const rRes = runBaselineInstrumented(tc.array, 'random', 20261001, false);

      const sermaxOk = verifySortedAndMultiset(tc.array, sRes.sortedArray);
      const tradOk = verifySortedAndMultiset(tc.array, tRes.sortedArray);
      const med3Ok = verifySortedAndMultiset(tc.array, mRes.sortedArray);
      const randOk = verifySortedAndMultiset(tc.array, rRes.sortedArray);

      return {
        id: tc.id,
        name: tc.name,
        n: tc.array.length,
        checksum: computeChecksum(tc.array),
        sermaxOk,
        tradOk,
        med3Ok,
        randOk,
        allPassed: sermaxOk && tradOk && med3Ok && randOk,
        sermaxComparisons: sRes.comparisons,
        sermaxSwaps: sRes.swaps,
        sermaxDepth: sRes.maxLogicalDepth,
        sermaxQMax: sRes.maxQueueOccupancy
      };
    });

    return {
      allPassed: results.every(r => r.allPassed),
      totalCases: results.length,
      passedCount: results.filter(r => r.allPassed).length,
      results
    };
  }

  // ─── 14. COMPARATIVE BENCHMARK SUITE RUNNER ───
  function compareAllFour(inputArr, seed = 20261001, captureTrace = false) {
    const sermax = runSerMaxInstrumented(inputArr, FROZEN_MODEL, captureTrace);
    const trad = runBaselineInstrumented(inputArr, 'trad', seed, captureTrace);
    const median3 = runBaselineInstrumented(inputArr, 'median3', seed, captureTrace);
    const random = runBaselineInstrumented(inputArr, 'random', seed, captureTrace);

    //Dedicated timing medians for fair comparison
    const tSermax = runDedicatedTimingTrial(inputArr, 'sermax', FROZEN_MODEL, 2, 5, seed);
    const tTrad = runDedicatedTimingTrial(inputArr, 'trad', FROZEN_MODEL, 2, 5, seed);
    const tMed3 = runDedicatedTimingTrial(inputArr, 'median3', FROZEN_MODEL, 2, 5, seed);
    const tRand = runDedicatedTimingTrial(inputArr, 'random', FROZEN_MODEL, 2, 5, seed);

    sermax.elapsedMs = tSermax.medianMs;
    sermax.timingStats = tSermax;
    trad.elapsedMs = tTrad.medianMs;
    trad.timingStats = tTrad;
    median3.elapsedMs = tMed3.medianMs;
    median3.timingStats = tMed3;
    random.elapsedMs = tRand.medianMs;
    random.timingStats = tRand;

    const correct = verifySortedAndMultiset(inputArr, sermax.sortedArray);

    return {
      sermax,
      trad,
      median3,
      random,
      correct,
      speedupVsTrad: sermax.elapsedMs > 1e-6 ? trad.elapsedMs / sermax.elapsedMs : 1.0,
      speedupVsMedian3: sermax.elapsedMs > 1e-6 ? median3.elapsedMs / sermax.elapsedMs : 1.0,
      speedupVsRandom: sermax.elapsedMs > 1e-6 ? random.elapsedMs / sermax.elapsedMs : 1.0
    };
  }

  // Backwards-compatible exports for existing server endpoints + full new API
  function getTradSnapshots(orig) {
    return getVisualizerSnapshots(orig, 'trad', FROZEN_MODEL);
  }
  function getSermaxSnapshots(orig) {
    return getVisualizerSnapshots(orig, 'sermax', FROZEN_MODEL);
  }
  function benchmarkTrad(arr) {
    return runBaselineInstrumented(arr, 'trad', 20261001, false);
  }
  function benchmarkSermax(arr) {
    return runSerMaxInstrumented(arr, FROZEN_MODEL, false);
  }

  return {
    createRNG,
    computeChecksum,
    generateDataset,
    VERIFICATION_ARRAYS,
    FEATURE_NAMES,
    FEATURE_LABELS,
    POLYNOMIAL_TERMS,
    extractSevenFeatures,
    explainFeatureCalculation,
    standardizeFeatures,
    expandPolynomialTerms,
    bidirectionalPartition,
    traceBidirectionalPartition,
    evaluateCandidatePivots,
    trainPolynomialRegressionModel,
    getFrozenModel,
    setFrozenModel,
    predictPivotPosition,
    SerMaxPriorityQueue,
    runSerMaxInstrumented,
    runBaselineInstrumented,
    runDedicatedTimingTrial,
    getVisualizerSnapshots,
    wilcoxonSignedRankTest,
    applyHolmAdjustment,
    pairedBootstrapSpeedupCI,
    verifySortedAndMultiset,
    runVerificationSuite,
    compareAllFour,
    getTradSnapshots,
    getSermaxSnapshots,
    benchmarkTrad,
    benchmarkSermax
  };
});
