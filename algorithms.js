// ════════════════════════════════════════════════════════════════════════════════════════
// SERMAX HYBRID QUICKSORT ALGORITHMS LIBRARY — algorithms.js
// University of the Philippines, Cebu — College of Science — Department of Computer Science
// ════════════════════════════════════════════════════════════════════════════════════════

// ─── PART I: SERMAXHYBRIDQUICKSORT CORE PIECES — POLYNOMIAL REGRESSION PIVOT ESTIMATOR ───

/**
 * Fallback Pivot Selector for SerMaxHybridQuickSort
 * Algorithm: Median-of-Three Partitioning
 * Purpose: Determines the median of the low, middle, and high elements to act as a pivot.
 * Used when the subarray size falls below ten elements, preventing regression overhead.
 */
function medianOfThree(arr, low, high) {
  const mid = low + Math.floor((high - low) / 2);
  if (arr[low] > arr[mid]) {
    if (arr[mid] > arr[high]) return mid;
    else if (arr[low] > arr[high]) return high;
    else return low;
  } else {
    if (arr[low] > arr[high]) return low;
    else if (arr[mid] > arr[high]) return high;
    else return mid;
  }
}

/**
 * Statistical Analysis Module for SerMaxHybridQuickSort
 * Purpose: Analyzes the current subarray state, calculating first, second, and third statistical moments.
 * Returns: Mean (central tendency), Variance (dispersion), Skewness (asymmetry), Min, and Max bounds.
 */
function analyzeSubarray(arr, low, high) {
  const n = high - low + 1;
  let sum = 0, min = arr[low], max = arr[low];
  for (let i = low; i <= high; i++) {
    sum += arr[i];
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
  }
  const mean = sum / n;
  let vs = 0, sk = 0;
  for (let i = low; i <= high; i++) {
    const d = arr[i] - mean;
    vs += d * d; sk += d * d * d;
  }
  const variance = vs / n;
  const std = Math.sqrt(variance);
  const skewness = std > 0 ? (sk / n) / (std * std * std) : 0;
  return { mean, variance, skewness, min, max };
}

/**
 * Polynomial Regression Pivot Predictor Model for SerMaxHybridQuickSort
 * Purpose: Evaluates subarray statistical moments via a fitted polynomial regression model to predict the optimal pivot position.
 * Parameters: Statistical metrics mapping to mean, variance, and skewness variables.
 * Returns: A normalized pivot position offset between zero and one.
 */
function polynomialModel(chars) {
  const range = chars.max - chars.min;
  if (range === 0) return 0.5;
  const nm = (chars.mean - chars.min) / range;
  const nv = Math.min(chars.variance / (range * range), 1.0);
  const ns = Math.tanh(chars.skewness / 2.0);
  // Learned coefficients for optimal balance
  const pos = 0.5 + 0.3*nm - 0.1*nv - 0.15*ns + 0.05*nm*nm - 0.05*nv*nv;
  return Math.max(0.0, Math.min(1.0, pos));
}

/**
 * High-Level Pivot Selection Coordinator for SerMaxHybridQuickSort
 * Purpose: Determines whether to trigger statistical modeling or fall back to Median-of-Three pivot selection.
 * Returns: The calculated absolute index of the estimated pivot element.
 */
function estimatePivot(arr, low, high) {
  if (high - low < 10) return medianOfThree(arr, low, high);
  const chars = analyzeSubarray(arr, low, high);
  const pos = polynomialModel(chars);
  let idx = low + Math.floor(pos * (high - low));
  return Math.max(low, Math.min(high, idx));
}

// ─── PART II: LIVE VISUALIZER STATE SNAPSHOT GENERATORS ───

/**
 * Visualizer Snapshot Generator for Traditional QuickSort
 * Algorithm: Traditional QuickSort with Lomuto Partitioning and Standard Recursion
 * Purpose: Traverses the array state frame-by-frame, capturing pointer movements and operations for browser animation.
 */
function getTradSnapshots(orig) {
  const arr = [...orig];
  const snaps = [];
  const m = { comparisons: 0, swaps: 0, recursiveCalls: 0, partitionOperations: 0 };

  function snap(left, right, pivot, low, high, op) {
    snaps.push({ array: [...arr], left, right, pivot, low, high, op, metrics: { ...m } });
  }

  function swp(i, j) {
    if (i !== j) {
      m.swaps++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      snap(i, j, -1, -1, -1, 'swap');
    }
  }

  function partition(lo, hi) {
    m.partitionOperations++;
    snap(-1, -1, hi, lo, hi, 'select-pivot');
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      m.comparisons++;
      snap(i, j, hi, lo, hi, 'compare');
      if (arr[j] <= arr[hi]) { i++; swp(i, j); }
    }
    swp(i + 1, hi);
    return i + 1;
  }

  function qs(lo, hi) {
    m.recursiveCalls++;
    if (lo < hi) {
      const p = partition(lo, hi);
      qs(lo, p - 1); 
      qs(p + 1, hi);
    } else if (lo === hi) {
      snap(-1, -1, -1, lo, hi, 'sorted-single');
    }
  }

  snap(-1, -1, -1, -1, -1, 'init');
  qs(0, arr.length - 1);
  snap(-1, -1, -1, -1, -1, 'done');
  return snaps;
}

/**
 * Visualizer Snapshot Generator for SerMaxHybridQuickSort
 * Algorithm: SerMaxHybridQuickSort with Polynomial Regression Pivot, Bidirectional Scanning, and Iterative Priority Queue
 * Purpose: Generates sequence states showing twin-pointer partitioning and explicit stack sorting structures for browser animation.
 */
function getSermaxSnapshots(orig) {
  const arr = [...orig];
  const snaps = [];
  const m = { comparisons: 0, swaps: 0, queueOperations: 0, partitionOperations: 0 };

  function snap(left, right, pivot, low, high, op) {
    snaps.push({ array: [...arr], left, right, pivot, low, high, op, metrics: { ...m } });
  }

  function swp(i, j) {
    if (i !== j) {
      m.swaps++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      snap(i, j, -1, -1, -1, 'swap');
    }
  }

  function bidir(lo, hi, pivIdx) {
    swp(pivIdx, hi);
    const piv = arr[hi];
    snap(-1, -1, hi, lo, hi, 'select-pivot');
    let left = lo, right = hi - 1;
    while (left <= right) {
      while (left <= right && arr[left] < piv) {
        m.comparisons++;
        snap(left, right, hi, lo, hi, 'compare');
        left++;
      }
      while (left <= right && arr[right] > piv) {
        m.comparisons++;
        snap(left, right, hi, lo, hi, 'compare');
        right--;
      }
      if (left <= right) {
        m.comparisons++;
        swp(left, right);
        left++; right--;
      }
    }
    swp(left, hi);
    return left;
  }

  snap(-1, -1, -1, -1, -1, 'init');
  const queue = [{ lo: 0, hi: arr.length - 1 }];

  while (queue.length > 0) {
    // Priority queue simulation: sort so smaller subarrays are at the end (popped first)
    queue.sort((a, b) => (b.hi - b.lo) - (a.hi - a.lo));
    const { lo, hi } = queue.pop();
    m.queueOperations++;

    if (lo < hi) {
      m.partitionOperations++;
      m.comparisons++; // initial pivot bound check overhead
      const pivIdx = estimatePivot(arr, lo, hi);
      const fp = bidir(lo, hi, pivIdx);
      if (fp - lo > 0) queue.push({ lo, hi: fp - 1 });
      if (hi - fp > 0) queue.push({ lo: fp + 1, hi });
    } else if (lo === hi) {
      snap(-1, -1, -1, lo, hi, 'sorted-single');
    }
  }

  snap(-1, -1, -1, -1, -1, 'done');
  return snaps;
}

// ─── PART III: REAL-TIME BENCHMARK EXECUTORS (HIGH SPEED, NO SNAPSHOTS) ───

/**
 * Real-Time Performance Benchmarker for Traditional QuickSort
 * Algorithm: Traditional QuickSort with Lomuto Single-Direction Partitioning and Standard CPU Stack Recursion
 * Purpose: Runs the baseline sort at full processor speeds to capture precise execution times and write metrics.
 */
function benchmarkTrad(arr) {
  const a = [...arr];
  const m = { comparisons: 0, swaps: 0, recursiveCalls: 0, partitionOperations: 0 };
  function swp(i, j) { if (i !== j) { m.swaps++; [a[i], a[j]] = [a[j], a[i]]; } }
  
  function part(lo, hi) {
    m.partitionOperations++;
    const piv = a[hi]; 
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      m.comparisons++;
      if (a[j] <= piv) { i++; swp(i, j); }
    }
    swp(i + 1, hi); 
    return i + 1;
  }
  
  function qs(lo, hi) {
    m.recursiveCalls++;
    if (lo < hi) { 
      const p = part(lo, hi); 
      qs(lo, p - 1); 
      qs(p + 1, hi); 
    }
  }
  
  const t0 = performance.now();
  qs(0, a.length - 1);
  return { ...m, elapsedMs: performance.now() - t0, sortedArray: a };
}

/**
 * Real-Time Performance Benchmarker for SerMaxHybridQuickSort
 * Algorithm: SerMaxHybridQuickSort with Polynomial Regression Pivot, Bidirectional Hoare-style Partitioning, and Explicit Iterative Priority Queue
 * Purpose: Runs the optimized hybrid sort at full processor speeds to capture precise execution times and write metrics.
 */
function benchmarkSermax(arr) {
  const a = [...arr];
  const m = { comparisons: 0, swaps: 0, queueOperations: 0, partitionOperations: 0 };
  function swp(i, j) { if (i !== j) { m.swaps++; [a[i], a[j]] = [a[j], a[i]]; } }
  
  function bidir(lo, hi, pivIdx) {
    swp(pivIdx, hi); 
    const piv = a[hi];
    let left = lo, right = hi - 1;
    while (left <= right) {
      while (left <= right && a[left] < piv) { m.comparisons++; left++; }
      while (left <= right && a[right] > piv) { m.comparisons++; right--; }
      if (left <= right) { m.comparisons++; swp(left, right); left++; right--; }
    }
    swp(left, hi); 
    return left;
  }
  
  const t0 = performance.now();
  const queue = [{ lo: 0, hi: a.length - 1 }];
  
  while (queue.length > 0) {
    queue.sort((x, y) => (y.hi - y.lo) - (x.hi - x.lo));
    const { lo, hi } = queue.pop();
    m.queueOperations++;
    
    if (lo < hi) {
      m.partitionOperations++; 
      m.comparisons++;
      const pivIdx = estimatePivot(a, lo, hi);
      const fp = bidir(lo, hi, pivIdx);
      if (fp - lo > 0) queue.push({ lo, hi: fp - 1 });
      if (hi - fp > 0) queue.push({ lo: fp + 1, hi });
    }
  }
  return { ...m, elapsedMs: performance.now() - t0, sortedArray: a };
}
module.exports = { getTradSnapshots, getSermaxSnapshots, benchmarkTrad, benchmarkSermax }; 
