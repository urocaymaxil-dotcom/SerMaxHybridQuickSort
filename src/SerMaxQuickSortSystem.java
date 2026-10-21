package sermax;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;
import java.util.Random;

/**
 * SerMax Hybrid QuickSort: An Adaptive Algorithm with Bidirectional Partitioning,
 * Priority Queue Management, and Polynomial Regression-Based Pivot Estimation.
 *
 * Authoritative Java Computational Implementation aligned with Chapter 4 (Sections 4.2-4.6)
 * of the MS Computer Science Thesis Manuscript by Maxil S. Urocay (UP Cebu).
 */
public class SerMaxQuickSortSystem {

    // =========================================================================
    // PHASE 1 - MODULE 1: SYNTHETIC DATASET GENERATOR & 70:15:15 DATA SPLITTER
    // (Sections 4.6.1 - 4.6.3, Table 3)
    // =========================================================================

    public enum DatasetCategory {
        RANDOM, NEARLY_SORTED, REVERSE_SORTED, MANY_DUPLICATES
    }

    public static final int[] FORMAL_BENCHMARK_SIZES = { 500, 1000, 10000 };
    public static final int MIN_VALUE = -100000;
    public static final int MAX_VALUE = 100000;

    public static final class GeneratedDataset {
        public final String datasetId;
        public final DatasetCategory category;
        public final int size;
        public final int minVal;
        public final int maxVal;
        public final long seed;
        public final String assignedSubset; // TRAINING (1-140), VALIDATION (141-170), TESTING (171-200)
        public final int[] values;
        public final int exchangeCount;

        public GeneratedDataset(
                String datasetId,
                DatasetCategory category,
                int size,
                int minVal,
                int maxVal,
                long seed,
                String assignedSubset,
                int[] values,
                int exchangeCount) {
            this.datasetId = datasetId;
            this.category = category;
            this.size = size;
            this.minVal = minVal;
            this.maxVal = maxVal;
            this.seed = seed;
            this.assignedSubset = assignedSubset;
            this.values = values;
            this.exchangeCount = exchangeCount;
        }
    }

    public static String assignSubsetBySourceIndex(int indexOneBased) {
        if (indexOneBased <= 140) return "TRAINING";
        if (indexOneBased <= 170) return "VALIDATION";
        return "INDEPENDENT_TESTING";
    }

    public static GeneratedDataset generateDataset(
            String datasetId,
            DatasetCategory category,
            int n,
            int minVal,
            int maxVal,
            long seed,
            int sourceIndexOneBased) {
        Random rng = new Random(seed);
        int[] arr = new int[n];
        int span = Math.max(1, maxVal - minVal + 1);
        int exchanges = 0;

        switch (category) {
            case RANDOM:
                for (int i = 0; i < n; i++) {
                    arr[i] = minVal + rng.nextInt(span);
                }
                break;

            case NEARLY_SORTED:
                for (int i = 0; i < n; i++) {
                    arr[i] = minVal + rng.nextInt(span);
                }
                Arrays.sort(arr);
                exchanges = Math.max(1, (int) Math.round(n * 0.01));
                for (int k = 0; k < exchanges && n >= 2; k++) {
                    int idxA = rng.nextInt(n);
                    int idxB = rng.nextInt(n);
                    int tmp = arr[idxA];
                    arr[idxA] = arr[idxB];
                    arr[idxB] = tmp;
                }
                break;

            case REVERSE_SORTED:
                for (int i = 0; i < n; i++) {
                    arr[i] = minVal + rng.nextInt(span);
                }
                Arrays.sort(arr);
                for (int i = 0, j = n - 1; i < j; i++, j--) {
                    int tmp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = tmp;
                }
                break;

            case MANY_DUPLICATES:
                int[] pool = new int[10];
                for (int p = 0; p < 10; p++) {
                    pool[p] = minVal + rng.nextInt(span);
                }
                for (int i = 0; i < n; i++) {
                    arr[i] = pool[rng.nextInt(10)];
                }
                break;
        }

        return new GeneratedDataset(
                datasetId,
                category,
                n,
                minVal,
                maxVal,
                seed,
                assignSubsetBySourceIndex(sourceIndexOneBased),
                arr,
                exchanges);
    }

    // =========================================================================
    // PHASE 2 - MODULE 2: SEVEN-PREDICTOR EXTRACTOR & CANDIDATE TARGET GENERATOR
    // (Sections 4.3.1 - 4.3.3, Table 1, Equations 1-7)
    // =========================================================================

    public static final class SevenPredictors {
        public final double n;
        public final double xMin;
        public final double xMax;
        public final double mean;
        public final double stdDev;
        public final double skewness;
        public final double disorderRatio;

        public SevenPredictors(
                double n,
                double xMin,
                double xMax,
                double mean,
                double stdDev,
                double skewness,
                double disorderRatio) {
            this.n = n;
            this.xMin = xMin;
            this.xMax = xMax;
            this.mean = mean;
            this.stdDev = stdDev;
            this.skewness = skewness;
            this.disorderRatio = disorderRatio;
        }

        public double[] toArray() {
            return new double[] { n, xMin, xMax, mean, stdDev, skewness, disorderRatio };
        }
    }

    public static SevenPredictors extractSevenPredictors(int[] a, int low, int high) {
        int n = high - low + 1;
        if (n <= 0) {
            return new SevenPredictors(0, 0, 0, 0, 0, 0, 0);
        }

        int minVal = a[low];
        int maxVal = a[low];
        double sum = 0.0;

        for (int i = low; i <= high; i++) {
            int v = a[i];
            if (v < minVal) minVal = v;
            if (v > maxVal) maxVal = v;
            sum += v;
        }

        // Equation (1): Arithmetic mean
        double mean = sum / n;

        double m2 = 0.0;
        double m3 = 0.0;
        int disorderViolations = 0;

        for (int i = low; i <= high; i++) {
            double dev = a[i] - mean;
            double dev2 = dev * dev;
            m2 += dev2;
            m3 += dev2 * dev;
            if (i < high && a[i] > a[i + 1]) {
                disorderViolations++;
            }
        }

        // Equation (2): Population standard deviation
        double variance = m2 / n;
        double stdDev = Math.sqrt(variance);

        // Equation (3): Population moment-based skewness (zero convention when stdDev == 0)
        double skewness = (stdDev > 1e-12) ? ((m3 / n) / (stdDev * stdDev * stdDev)) : 0.0;

        // Equation (4): Disorder ratio (zero convention when n < 2)
        double disorderRatio = (n >= 2) ? ((double) disorderViolations / (n - 1)) : 0.0;

        return new SevenPredictors(n, minVal, maxVal, mean, stdDev, skewness, disorderRatio);
    }

    /**
     * Section 4.3.3: Deterministic Candidate-Pivot Target Generation (Equations 5-7).
     * Evaluates all relative indices when n <= 33, or 33 candidates c_k = round[k(n-1)/32] when n > 33.
     */
    public static double computeMinimumImbalanceTarget(int[] a, int low, int high) {
        int n = high - low + 1;
        if (n < 2) return 0.5;

        int[] candidateRelIndices;
        if (n <= 33) {
            candidateRelIndices = new int[n];
            for (int i = 0; i < n; i++) candidateRelIndices[i] = i;
        } else {
            candidateRelIndices = new int[33];
            for (int k = 0; k <= 32; k++) {
                candidateRelIndices[k] = (int) Math.round((k * (n - 1)) / 32.0);
            }
        }

        double midpoint = (n - 1) / 2.0;
        int bestRelIdx = candidateRelIndices[0];
        int minImbalance = Integer.MAX_VALUE;
        double bestMidDist = Double.MAX_VALUE;

        for (int relIdx : candidateRelIndices) {
            int[] copy = Arrays.copyOfRange(a, low, high + 1);
            int pivotVal = copy[relIdx];
            PartitionBounds bounds = partitionWithPivotValue(copy, 0, n - 1, pivotVal, null);
            int leftSize = Math.max(0, bounds.leftHigh - bounds.low + 1);
            int rightSize = Math.max(0, bounds.high - bounds.rightLow + 1);
            int imbalance = Math.abs(leftSize - rightSize); // Equation (5)
            double midDist = Math.abs(relIdx - midpoint);

            // Equation (6): Minimum imbalance with midpoint-distance and lower-index tie-breaking
            if (imbalance < minImbalance
                    || (imbalance == minImbalance && midDist < bestMidDist - 1e-12)
                    || (imbalance == minImbalance && Math.abs(midDist - bestMidDist) <= 1e-12 && relIdx < bestRelIdx)) {
                minImbalance = imbalance;
                bestMidDist = midDist;
                bestRelIdx = relIdx;
            }
        }

        // Equation (7): Normalized target pivot position y = i* / (n - 1)
        return (double) bestRelIdx / (n - 1);
    }

    // =========================================================================
    // PHASE 2 - MODULE 3 & PHASE 3 - MODULE 4:
    // 36-COEFFICIENT POLYNOMIAL REGRESSION & 10-STEP RUNTIME PIVOT ESTIMATION
    // (Sections 4.3.4 - 4.3.7, Equations 8-14, Figure 3)
    // =========================================================================

    public static final class PolynomialRegressionModel {
        public final double[] trainMeans;  // length 7
        public final double[] trainScales; // length 7
        public final double[] betas;       // length 36 (1 intercept + 7 linear + 7 quad + 21 interaction)

        public PolynomialRegressionModel(double[] trainMeans, double[] trainScales, double[] betas) {
            this.trainMeans = trainMeans;
            this.trainScales = trainScales;
            this.betas = betas;
        }

        /**
         * Section 4.3.6 & Figure 3: 10-Step Runtime Pivot Estimation Procedure.
         */
        public int estimatePivotIndex(int[] a, int low, int high) {
            // Step 1: Identify current sorting subproblem
            int n = high - low + 1;
            if (n <= 1) return low;

            try {
                // Step 2: Extract the seven predictor variables
                SevenPredictors p = extractSevenPredictors(a, low, high);
                double[] raw = p.toArray();

                // Step 3: Standardize predictors using training-derived parameters
                double[] x = new double[7];
                for (int j = 0; j < 7; j++) {
                    double scale = (trainScales[j] > 1e-12) ? trainScales[j] : 1.0;
                    x[j] = (raw[j] - trainMeans[j]) / scale;
                }

                // Step 4: Calculate predicted normalized pivot position yHat (Equation 8)
                double yHat = betas[0];
                int idx = 1;
                // 7 Linear terms
                for (int j = 0; j < 7; j++) {
                    yHat += betas[idx++] * x[j];
                }
                // 7 Quadratic terms
                for (int j = 0; j < 7; j++) {
                    yHat += betas[idx++] * (x[j] * x[j]);
                }
                // 21 Pairwise interaction terms
                for (int j = 0; j < 6; j++) {
                    for (int k = j + 1; k < 7; k++) {
                        yHat += betas[idx++] * (x[j] * x[k]);
                    }
                }

                // Step 9 (Finiteness check before clamping)
                if (!Double.isFinite(yHat)) {
                    return low + (high - low) / 2;
                }

                // Step 5: Constrain prediction to [0, 1] (Equation 10)
                double yClamped = Math.min(1.0, Math.max(0.0, yHat));

                // Step 6: Calculate relative pivot index (Equation 11)
                int relPivot = (int) Math.round(yClamped * (n - 1));

                // Step 7: Calculate absolute pivot index (Equation 12)
                int absPivot = low + relPivot;

                // Step 9: Validate low <= p_abs <= high; fallback to midpoint if invalid
                if (absPivot < low || absPivot > high) {
                    return low + (high - low) / 2;
                }

                return absPivot;
            } catch (Exception ex) {
                // Step 10 Fallback: Deterministic midpoint index
                return low + (high - low) / 2;
            }
        }
    }

    // =========================================================================
    // PHASE 3 - MODULE 5: BIDIRECTIONAL PARTITIONING
    // (Sections 4.4.1 - 4.4.4, Figure 4, Equations 15-18)
    // =========================================================================

    public static final class PartitionBounds {
        public final int low;
        public final int leftHigh;  // j
        public final int rightLow;  // i
        public final int high;

        public PartitionBounds(int low, int leftHigh, int rightLow, int high) {
            this.low = low;
            this.leftHigh = leftHigh;
            this.rightLow = rightLow;
            this.high = high;
        }
    }

    public static final class SortInstrumentation {
        public long comparisons = 0;
        public long swaps = 0;
        public int maxLogicalDepth = 0;
        public int maxQueueOccupancy = 0;
        public long totalImbalanceNumerator = 0;
        public long totalSubproblemDenominator = 0;
        public long threadAllocatedBytes = 0;

        public double getPartitionBalance() {
            return totalSubproblemDenominator > 0
                    ? (double) totalImbalanceNumerator / totalSubproblemDenominator
                    : 0.0;
        }
    }

    /**
     * Bidirectional Partitioning using opposing pointers i = low and j = high.
     */
    public static PartitionBounds partitionWithPivotValue(
            int[] a,
            int low,
            int high,
            int pivotValue,
            SortInstrumentation metrics) {
        int i = low;
        int j = high;

        while (i <= j) {
            while (true) {
                if (metrics != null) metrics.comparisons++;
                if (a[i] < pivotValue) {
                    i++;
                } else {
                    break;
                }
            }
            while (true) {
                if (metrics != null) metrics.comparisons++;
                if (a[j] > pivotValue) {
                    j--;
                } else {
                    break;
                }
            }
            if (i <= j) {
                int tmp = a[i];
                a[i] = a[j];
                a[j] = tmp;
                if (metrics != null) metrics.swaps++;
                i++;
                j--;
            }
        }

        if (metrics != null) {
            int nL = Math.max(0, j - low + 1);
            int nR = Math.max(0, high - i + 1);
            if (nL + nR > 0) {
                metrics.totalImbalanceNumerator += Math.abs(nL - nR);
                metrics.totalSubproblemDenominator += (nL + nR);
            }
        }

        return new PartitionBounds(low, j, i, high);
    }

    // =========================================================================
    // PHASE 3 - MODULE 6: PRIORITY QUEUE MANAGEMENT & SERMAX HYBRID QUICKSORT
    // (Sections 4.5.1 - 4.5.4, Figure 5, Equations 19-20)
    // =========================================================================

    public static final class SubproblemRecord implements Comparable<SubproblemRecord> {
        public final int low;
        public final int high;
        public final int size;
        public final int logicalDepth;
        public final long insertionSequence;

        public SubproblemRecord(int low, int high, int logicalDepth, long insertionSequence) {
            this.low = low;
            this.high = high;
            this.size = high - low + 1;
            this.logicalDepth = logicalDepth;
            this.insertionSequence = insertionSequence;
        }

        @Override
        public int compareTo(SubproblemRecord other) {
            // Largest-subproblem-first priority rule
            if (this.size != other.size) {
                return Integer.compare(other.size, this.size);
            }
            // Deterministic FIFO tie-breaking for equal-sized subproblems
            return Long.compare(this.insertionSequence, other.insertionSequence);
        }
    }

    /**
     * 1. SerMax Hybrid QuickSort (Iterative Priority Queue + 36-Coefficient Polynomial Pivot Estimation).
     */
    public static void serMaxHybridQuickSort(
            int[] a,
            PolynomialRegressionModel model,
            SortInstrumentation metrics) {
        if (a == null || a.length < 2) return;

        PriorityQueue<SubproblemRecord> pq = new PriorityQueue<>();
        long seqCounter = 1L;

        pq.offer(new SubproblemRecord(0, a.length - 1, 1, seqCounter++));
        if (metrics != null) {
            metrics.maxQueueOccupancy = 1;
            metrics.maxLogicalDepth = 1;
        }

        while (!pq.isEmpty()) {
            SubproblemRecord current = pq.poll();
            int low = current.low;
            int high = current.high;
            int depth = current.logicalDepth;

            if (metrics != null && depth > metrics.maxLogicalDepth) {
                metrics.maxLogicalDepth = depth;
            }

            int pAbs = model.estimatePivotIndex(a, low, high);
            int pivotValue = a[pAbs];

            PartitionBounds bounds = partitionWithPivotValue(a, low, high, pivotValue, metrics);

            // Enqueue eligible left subproblem (size >= 2)
            if (bounds.leftHigh - bounds.low + 1 >= 2) {
                pq.offer(new SubproblemRecord(bounds.low, bounds.leftHigh, depth + 1, seqCounter++));
            }
            // Enqueue eligible right subproblem (size >= 2)
            if (bounds.high - bounds.rightLow + 1 >= 2) {
                pq.offer(new SubproblemRecord(bounds.rightLow, bounds.high, depth + 1, seqCounter++));
            }

            if (metrics != null && pq.size() > metrics.maxQueueOccupancy) {
                metrics.maxQueueOccupancy = pq.size();
            }
        }
    }

    // =========================================================================
    // PHASE 4 - MODULE 7: THREE RECURSIVE BASELINE ALGORITHMS
    // (Section 4.2.2)
    // =========================================================================

    /**
     * 2. Traditional QuickSort (First-Element Pivot A[low], Recursive Subproblem Processing).
     */
    public static void traditionalQuickSort(int[] a, int low, int high, int depth, SortInstrumentation metrics) {
        if (a == null || high - low + 1 < 2) return;
        if (metrics != null && depth > metrics.maxLogicalDepth) {
            metrics.maxLogicalDepth = depth;
        }

        int pivotValue = a[low];
        PartitionBounds bounds = partitionWithPivotValue(a, low, high, pivotValue, metrics);

        if (bounds.leftHigh - bounds.low + 1 >= 2) {
            traditionalQuickSort(a, bounds.low, bounds.leftHigh, depth + 1, metrics);
        }
        if (bounds.high - bounds.rightLow + 1 >= 2) {
            traditionalQuickSort(a, bounds.rightLow, bounds.high, depth + 1, metrics);
        }
    }

    /**
     * 3. Median-of-Three QuickSort (Median of low, mid, high, Recursive Subproblem Processing).
     */
    public static void medianOfThreeQuickSort(int[] a, int low, int high, int depth, SortInstrumentation metrics) {
        if (a == null || high - low + 1 < 2) return;
        if (metrics != null && depth > metrics.maxLogicalDepth) {
            metrics.maxLogicalDepth = depth;
        }

        int mid = low + (high - low) / 2;
        int vLow = a[low], vMid = a[mid], vHigh = a[high];
        int pivotIndex;
        if ((vLow <= vMid && vMid <= vHigh) || (vHigh <= vMid && vMid <= vLow)) {
            pivotIndex = mid;
        } else if ((vMid <= vLow && vLow <= vHigh) || (vHigh <= vLow && vLow <= vMid)) {
            pivotIndex = low;
        } else {
            pivotIndex = high;
        }

        int pivotValue = a[pivotIndex];
        PartitionBounds bounds = partitionWithPivotValue(a, low, high, pivotValue, metrics);

        if (bounds.leftHigh - bounds.low + 1 >= 2) {
            medianOfThreeQuickSort(a, bounds.low, bounds.leftHigh, depth + 1, metrics);
        }
        if (bounds.high - bounds.rightLow + 1 >= 2) {
            medianOfThreeQuickSort(a, bounds.rightLow, bounds.high, depth + 1, metrics);
        }
    }

    /**
     * 4. Randomized-Pivot QuickSort (Pseudorandom Index in [low, high], Recursive Subproblem Processing).
     */
    public static void randomizedPivotQuickSort(
            int[] a,
            int low,
            int high,
            int depth,
            Random rng,
            SortInstrumentation metrics) {
        if (a == null || high - low + 1 < 2) return;
        if (metrics != null && depth > metrics.maxLogicalDepth) {
            metrics.maxLogicalDepth = depth;
        }

        int pivotIndex = low + rng.nextInt(high - low + 1);
        int pivotValue = a[pivotIndex];
        PartitionBounds bounds = partitionWithPivotValue(a, low, high, pivotValue, metrics);

        if (bounds.leftHigh - bounds.low + 1 >= 2) {
            randomizedPivotQuickSort(a, bounds.low, bounds.leftHigh, depth + 1, rng, metrics);
        }
        if (bounds.high - bounds.rightLow + 1 >= 2) {
            randomizedPivotQuickSort(a, bounds.rightLow, bounds.high, depth + 1, rng, metrics);
        }
    }

    /**
     * Correctness verification: checks ascending order and multiset element preservation.
     */
    public static boolean verifySortedAndPreserved(int[] original, int[] sortedCandidate) {
        if (original == null || sortedCandidate == null || original.length != sortedCandidate.length) {
            return false;
        }
        for (int i = 0; i < sortedCandidate.length - 1; i++) {
            if (sortedCandidate[i] > sortedCandidate[i + 1]) return false;
        }
        int[] expected = Arrays.copyOf(original, original.length);
        Arrays.sort(expected);
        return Arrays.equals(expected, sortedCandidate);
    }

    // =========================================================================
    // PHASE 4 - MODULE 8: COMPARATIVE BENCHMARKING WITH SYSTEM.NANOTIME()
    // AND SORTING-THREAD HEAP ALLOCATION INSTRUMENTATION (Sections 4.6.4 - 4.6.6)
    // =========================================================================

    public static long measureThreadAllocatedBytes(Runnable sortingTask) {
        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        if (bean instanceof com.sun.management.ThreadMXBean) {
            com.sun.management.ThreadMXBean sunBean = (com.sun.management.ThreadMXBean) bean;
            if (sunBean.isThreadAllocatedMemorySupported() && sunBean.isThreadAllocatedMemoryEnabled()) {
                long tid = Thread.currentThread().getId();
                long before = sunBean.getThreadAllocatedBytes(tid);
                sortingTask.run();
                long after = sunBean.getThreadAllocatedBytes(tid);
                return Math.max(0L, after - before);
            }
        }
        sortingTask.run();
        return 0L;
    }

    public static double[] runBenchmarkTrialsNanoTime(
            int[] sourceArray,
            String algorithmKey,
            PolynomialRegressionModel model,
            int warmupRuns,
            int measuredRuns,
            long baseSeed) {
        // 10 unmeasured warm-up executions outside measured timing records
        for (int w = 0; w < warmupRuns; w++) {
            int[] copy = Arrays.copyOf(sourceArray, sourceArray.length);
            executeUninstrumentedSort(copy, algorithmKey, model, baseSeed + w);
        }

        // 10 measured executions using System.nanoTime() with array cloning outside interval
        double[] elapsedMs = new double[measuredRuns];
        for (int t = 0; t < measuredRuns; t++) {
            int[] copy = Arrays.copyOf(sourceArray, sourceArray.length);
            long trialSeed = baseSeed + 1000L + t;
            long startNs = System.nanoTime();
            executeUninstrumentedSort(copy, algorithmKey, model, trialSeed);
            long endNs = System.nanoTime();
            elapsedMs[t] = (endNs - startNs) / 1_000_000.0;
        }
        return elapsedMs;
    }

    private static void executeUninstrumentedSort(
            int[] arr,
            String algorithmKey,
            PolynomialRegressionModel model,
            long seed) {
        switch (algorithmKey) {
            case "sermax":
                serMaxHybridQuickSort(arr, model, null);
                break;
            case "trad":
                traditionalQuickSort(arr, 0, arr.length - 1, 1, null);
                break;
            case "median3":
                medianOfThreeQuickSort(arr, 0, arr.length - 1, 1, null);
                break;
            case "random":
                randomizedPivotQuickSort(arr, 0, arr.length - 1, 1, new Random(seed), null);
                break;
            default:
                throw new IllegalArgumentException("Unknown algorithm: " + algorithmKey);
        }
    }
}
