"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  BarChart3,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Search,
  StopCircle,
  Download,
  Trash2,
  Sparkles,
  TrendingUp,
  Gauge,
  Layers,
  ArrowUpDown,
} from "lucide-react";

interface EvalRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  totalQuestions: number;
  completedQuestions?: number;
  recall5: number | null;
  mrr: number | null;
  ndcg5: number | null;
  precision5: number | null;
  avgFaithfulness: number | null;
  avgHallucination: number | null;
  avgLatencyMs: number | null;
  errorMessage?: string | null;
}

interface EvalResult {
  id: string;
  recall5Hit: boolean;
  reciprocalRank: number;
  dcg5: number;
  precision5: number;
  faithfulnessScore: number | null;
  hallucinationScore: number | null;
  latencyMs: number;
  evalQuestion: {
    question: string;
    expectedAnswer?: string;
    difficulty: string;
    relevantCategories: string[];
  };
}

type PresetType = "quick" | "standard" | "full";

function ScoreBadge({
  value,
  label,
  target,
  unit = "%",
}: {
  value: number | null;
  label: string;
  target?: string;
  unit?: string;
}) {
  if (value === null || value === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
        <span className="text-gray-500 text-lg font-bold">—</span>
        <span className="text-[11px] text-gray-400 uppercase tracking-wide mt-1">{label}</span>
      </div>
    );
  }

  const isPct = unit === "%";
  const displayVal = isPct ? Math.round(value * 100) : value.toFixed(3);
  const color =
    value >= 0.8
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : value >= 0.6
      ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
      : "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${color}`}>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-bold tabular-nums tracking-tight">{displayVal}</span>
        {isPct && <span className="text-xs font-semibold opacity-75">%</span>}
      </div>
      <span className="text-[11px] font-medium uppercase tracking-wide opacity-90 mt-0.5">{label}</span>
      {target && <span className="text-[10px] text-gray-400 mt-1 font-mono">{target}</span>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </span>
      );
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> In Progress
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5" /> Stopped
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/20">
          <Clock className="w-3.5 h-3.5" /> Pending
        </span>
      );
  }
}

export default function EvaluationPage() {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvalRun | null>(null);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Interactive Runner States
  const [preset, setPreset] = useState<PresetType>("quick");
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [progressCount, setProgressCount] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [runningMetrics, setRunningMetrics] = useState<{
    recall5: number;
    mrr: number;
    precision5: number;
    avgLatencyMs: number;
  }>({ recall5: 0, mrr: 0, precision5: 0, avgLatencyMs: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHit, setFilterHit] = useState<"all" | "hits" | "misses">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Elapsed timer
  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning]);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/eval/runs");
      const data = await res.json();
      if (data.runs) {
        setRuns(data.runs);
        // Auto-select latest completed run if none selected
        setSelectedRun((prev) => {
          if (prev) {
            const updated = data.runs.find((r: EvalRun) => r.id === prev.id);
            return updated || prev;
          }
          const latestCompleted = data.runs.find((r: EvalRun) => r.status === "COMPLETED");
          return latestCompleted || data.runs[0] || null;
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Load results whenever selectedRun changes
  const loadRunDetails = useCallback(async (run: EvalRun) => {
    setSelectedRun(run);
    try {
      const res = await fetch(`/api/eval/runs/${run.id}`);
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (selectedRun && !isRunning) {
      loadRunDetails(selectedRun);
    }
  }, [selectedRun?.id, isRunning, loadRunDetails]);

  // Start Interactive Multi-Batch Evaluation Run
  async function startInteractiveRun() {
    setIsRunning(true);
    setError(null);
    setProgressCount(0);
    setElapsedSeconds(0);
    setResults([]);
    abortControllerRef.current = new AbortController();

    try {
      // 1. Create run
      const initRes = await fetch("/api/eval/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
        signal: abortControllerRef.current.signal,
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error || "Failed to initialize run");
      }

      const { evalRunId, totalQuestions, questionIds } = await initRes.json();
      setActiveRunId(evalRunId);
      setProgressTotal(totalQuestions);

      // Create a temporary run for live display
      const tempRun: EvalRun = {
        id: evalRunId,
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "RUNNING",
        totalQuestions,
        completedQuestions: 0,
        recall5: 0,
        mrr: 0,
        ndcg5: 0,
        precision5: 0,
        avgFaithfulness: null,
        avgHallucination: null,
        avgLatencyMs: 0,
      };
      setSelectedRun(tempRun);

      // 2. Process questions in small batches of 2 to preserve DB connection limits
      const BATCH_SIZE = 2;
      const chunks: string[][] = [];
      for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
        chunks.push(questionIds.slice(i, i + BATCH_SIZE));
      }

      const accumulatedResults: EvalResult[] = [];

      for (let i = 0; i < chunks.length; i++) {
        if (abortControllerRef.current.signal.aborted) break;

        const currentChunk = chunks[i];
        setCurrentQuestionText(
          `Processing batch ${i + 1} of ${chunks.length} (${currentChunk.length} questions in parallel)...`
        );

        const batchRes = await fetch(`/api/eval/runs/${evalRunId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionIds: currentChunk, batchSize: BATCH_SIZE }),
          signal: abortControllerRef.current.signal,
        });

        if (!batchRes.ok) {
          const err = await batchRes.json();
          throw new Error(err.error || "Batch execution failed");
        }

        const batchData = await batchRes.json();
        setProgressCount(batchData.completedCount);

        if (batchData.runningMetrics) {
          setRunningMetrics(batchData.runningMetrics);
        }

        // Fetch refreshed question results
        const detailsRes = await fetch(`/api/eval/runs/${evalRunId}`);
        const detailsData = await detailsRes.json();
        if (detailsData.results) {
          setResults(detailsData.results);
          accumulatedResults.splice(0, accumulatedResults.length, ...detailsData.results);
        }

        if (batchData.isCompleted) break;
      }

      setCurrentQuestionText("Evaluation complete!");
      await fetchRuns();
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message || "An error occurred during evaluation");
      }
    } finally {
      setIsRunning(false);
      setActiveRunId(null);
      await fetchRuns();
    }
  }

  // Cancel / Abort active run
  async function cancelRun() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (activeRunId) {
      try {
        await fetch(`/api/eval/runs/${activeRunId}`, { method: "DELETE" });
      } catch {
        // silent
      }
    }
    setIsRunning(false);
    setActiveRunId(null);
    setCurrentQuestionText("Evaluation stopped.");
    await fetchRuns();
  }

  // Clean stale runs
  async function cleanStaleRuns() {
    try {
      await fetch("/api/eval/runs", { method: "DELETE" });
      await fetchRuns();
    } catch {
      // silent
    }
  }

  // Export results to JSON or CSV
  function exportReport(format: "json" | "csv") {
    if (!results || results.length === 0) return;

    if (format === "json") {
      const blob = new Blob([JSON.stringify({ run: selectedRun, results }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rag-evaluation-report-${selectedRun?.id || "run"}.json`;
      a.click();
    } else {
      const headers = ["Question", "Expected Answer", "Difficulty", "Categories", "Recall@5 Hit", "RR", "NDCG@5", "Precision@5", "Latency (ms)"];
      const rows = results.map((r) => [
        `"${r.evalQuestion.question.replace(/"/g, '""')}"`,
        `"${(r.evalQuestion.expectedAnswer || "").replace(/"/g, '""')}"`,
        r.evalQuestion.difficulty,
        `"${r.evalQuestion.relevantCategories.join(", ")}"`,
        r.recall5Hit ? "PASS" : "FAIL",
        r.reciprocalRank.toFixed(3),
        r.dcg5.toFixed(3),
        r.precision5.toFixed(3),
        r.latencyMs,
      ]);
      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rag-evaluation-report-${selectedRun?.id || "run"}.csv`;
      a.click();
    }
  }

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ = r.evalQuestion.question.toLowerCase().includes(q);
        const matchesAns = (r.evalQuestion.expectedAnswer || "").toLowerCase().includes(q);
        if (!matchesQ && !matchesAns) return false;
      }
      // Hit/Miss
      if (filterHit === "hits" && !r.recall5Hit) return false;
      if (filterHit === "misses" && r.recall5Hit) return false;
      // Difficulty
      if (filterDifficulty !== "all" && r.evalQuestion.difficulty !== filterDifficulty) return false;
      // Category
      if (
        filterCategory !== "all" &&
        !r.evalQuestion.relevantCategories.map((c) => c.toLowerCase()).includes(filterCategory.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [results, searchQuery, filterHit, filterDifficulty, filterCategory]);

  const latestCompleted = runs.find((r) => r.status === "COMPLETED") || runs[0];
  const displayRun = isRunning ? selectedRun : selectedRun || latestCompleted;

  const hitCount = results.filter((r) => r.recall5Hit).length;
  const missCount = results.length - hitCount;
  const progressPercent =
    progressTotal > 0 ? Math.min(100, Math.round((progressCount / progressTotal) * 100)) : 0;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header with Presets & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">RAG Evaluation Studio</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Benchmark retrieval quality across Recall@5, MRR, NDCG@5, and Multi-Document synthesis.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setPreset("quick")}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                preset === "quick"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Quick (5)
            </button>
            <button
              onClick={() => setPreset("standard")}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                preset === "standard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Standard (15)
            </button>
            <button
              onClick={() => setPreset("full")}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                preset === "full"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Full Suite (44)
            </button>
          </div>

          <button
            onClick={fetchRuns}
            disabled={isRunning}
            className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-indigo-500/40 transition-colors disabled:opacity-40"
            title="Refresh runs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isRunning ? (
            <button
              onClick={cancelRun}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-all"
            >
              <StopCircle className="w-4 h-4" />
              Stop Run
            </button>
          ) : (
            <button
              onClick={startInteractiveRun}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              Run Evaluation
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Interactive Runner Hero Console */}
      {isRunning && (
        <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                <div className="w-3 h-3 rounded-full bg-emerald-400 relative" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  Interactive Evaluation in Progress
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {preset.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/70 mt-0.5 font-mono">{currentQuestionText}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-300">
              <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Elapsed: {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
              </span>
              <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                Completed: {progressCount} / {progressTotal}
              </span>
            </div>
          </div>

          {/* Animated Striped Progress Bar */}
          <div className="w-full bg-black/40 rounded-full h-3.5 p-0.5 border border-indigo-500/30 overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 relative"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] opacity-50" />
            </div>
          </div>

          {/* Running Live Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="text-xs text-gray-400">Live Recall@5</div>
              <div className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
                {(runningMetrics.recall5 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="text-xs text-gray-400">Live MRR</div>
              <div className="text-xl font-bold text-yellow-400 tabular-nums mt-0.5">
                {runningMetrics.mrr.toFixed(3)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="text-xs text-gray-400">Live Precision@5</div>
              <div className="text-xl font-bold text-indigo-400 tabular-nums mt-0.5">
                {(runningMetrics.precision5 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="text-xs text-gray-400">Avg Latency</div>
              <div className="text-xl font-bold text-gray-200 tabular-nums mt-0.5">
                {Math.round(runningMetrics.avgLatencyMs)} ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Dashboard for Selected/Latest Run */}
      {displayRun && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Evaluation Scorecard</h2>
                <StatusPill status={displayRun.status} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Started {new Date(displayRun.startedAt).toLocaleString()} ·{" "}
                <span className="text-gray-300 font-medium">{displayRun.totalQuestions} questions benchmarked</span>
                {displayRun.avgLatencyMs ? ` · ${Math.round(displayRun.avgLatencyMs)}ms average latency` : ""}
              </p>
            </div>

            {/* Export & Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportReport("csv")}
                disabled={results.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-colors"
                title="Download CSV report"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => exportReport("json")}
                disabled={results.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-colors"
                title="Download JSON report"
              >
                <Download className="w-3.5 h-3.5" /> JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <ScoreBadge value={displayRun.recall5} label="Recall@5" target="Target ≥ 80%" />
            <ScoreBadge value={displayRun.mrr} label="MRR" unit="" target="Target ≥ 0.70" />
            <ScoreBadge value={displayRun.ndcg5} label="NDCG@5" unit="" target="Target ≥ 0.75" />
            <ScoreBadge value={displayRun.precision5} label="Precision@5" target="Target ≥ 50%" />
            <ScoreBadge value={displayRun.avgFaithfulness} label="Faithfulness" target="LLM Judge" />
            <ScoreBadge
              value={displayRun.avgHallucination !== null && displayRun.avgHallucination !== undefined ? 1 - displayRun.avgHallucination : null}
              label="Groundedness"
              target="Target ≥ 85%"
            />
          </div>
        </div>
      )}

      {/* Interactive Per-Question Breakdown & Filtering */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Question Breakdown
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-normal">
                {filteredResults.length} / {results.length} questions
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Inspect individual questions, relevance rankings, category alignments, and latencies.
            </p>
          </div>

          {/* Hit / Miss Tabs */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterHit("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterHit === "all" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setFilterHit("hits")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                filterHit === "hits" ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-emerald-400"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Hits ({hitCount})
            </button>
            <button
              onClick={() => setFilterHit("misses")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                filterHit === "misses" ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-red-400"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> Misses ({missCount})
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Search, Difficulty, Category */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by question text or expected answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Difficulty filter */}
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all" className="bg-gray-900">All Difficulties</option>
            <option value="EASY" className="bg-gray-900">Easy</option>
            <option value="MEDIUM" className="bg-gray-900">Medium</option>
            <option value="HARD" className="bg-gray-900">Hard</option>
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all" className="bg-gray-900">All Categories</option>
            <option value="policy" className="bg-gray-900">Policy</option>
            <option value="academic" className="bg-gray-900">Academic</option>
            <option value="financial" className="bg-gray-900">Financial</option>
            <option value="faculty" className="bg-gray-900">Faculty</option>
          </select>
        </div>

        {/* Questions Table / List */}
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-8 h-8 text-indigo-400 mb-2 opacity-60" />
            <p className="text-sm font-medium text-gray-300">No evaluation questions loaded for this run</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Click &ldquo;Run Evaluation&rdquo; above to execute a live test run against your knowledge base.
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No questions match your current search and filters.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredResults.map((r, idx) => {
              const expanded = expandedRows.has(r.id);
              const rankColor =
                r.reciprocalRank === 1
                  ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                  : r.reciprocalRank > 0
                  ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                  : "text-gray-500 bg-gray-500/10 border-gray-500/20";

              return (
                <div
                  key={r.id}
                  className={`rounded-xl border transition-all ${
                    r.recall5Hit
                      ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      : "border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/[0.04]"
                  }`}
                >
                  <button
                    onClick={() =>
                      setExpandedRows((prev) => {
                        const next = new Set(prev);
                        next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {r.recall5Hit ? (
                        <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-200 truncate flex items-center gap-2">
                          <span>{r.evalQuestion.question}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                            {r.evalQuestion.difficulty}
                          </span>
                          {r.evalQuestion.relevantCategories.map((c) => (
                            <span
                              key={c}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium ${rankColor}`}>
                        {r.reciprocalRank > 0 ? `Rank #${Math.round(1 / r.reciprocalRank)}` : "Miss"}
                      </span>

                      <span className="font-mono text-gray-400 text-xs hidden sm:inline">
                        NDCG: {r.dcg5.toFixed(2)}
                      </span>

                      <span
                        className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                          r.latencyMs < 1500
                            ? "text-emerald-400 bg-emerald-500/10"
                            : r.latencyMs < 3500
                            ? "text-yellow-400 bg-yellow-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {r.latencyMs}ms
                      </span>

                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-5 pb-4 pt-2 border-t border-white/5 space-y-3 bg-black/20 text-xs">
                      {r.evalQuestion.expectedAnswer && (
                        <div>
                          <span className="text-gray-400 font-medium">Expected Ground Truth:</span>
                          <p className="text-gray-200 mt-0.5 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                            {r.evalQuestion.expectedAnswer}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-gray-400">
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-gray-500 block text-[10px] uppercase">Reciprocal Rank</span>
                          <span className="text-sm font-semibold text-white font-mono">
                            {r.reciprocalRank.toFixed(3)}
                          </span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-gray-500 block text-[10px] uppercase">NDCG@5 Score</span>
                          <span className="text-sm font-semibold text-white font-mono">{r.dcg5.toFixed(3)}</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-gray-500 block text-[10px] uppercase">Precision@5</span>
                          <span className="text-sm font-semibold text-white font-mono">
                            {(r.precision5 * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-gray-500 block text-[10px] uppercase">Faithfulness</span>
                          <span className="text-sm font-semibold text-white font-mono">
                            {r.faithfulnessScore !== null ? `${(r.faithfulnessScore * 100).toFixed(1)}%` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Evaluation Runs */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold text-white">Evaluation History</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Compare historical retrieval benchmarks and track regression over time.
            </p>
          </div>

          <button
            onClick={cleanStaleRuns}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
            title="Clean up stale runs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clean Stale Runs
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No evaluation runs recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b border-white/5">
                  <th className="text-left pb-2.5 pr-4">Started</th>
                  <th className="text-right pb-2.5 pr-4">Questions</th>
                  <th className="text-right pb-2.5 pr-4">Recall@5</th>
                  <th className="text-right pb-2.5 pr-4">MRR</th>
                  <th className="text-right pb-2.5 pr-4">NDCG@5</th>
                  <th className="text-right pb-2.5 pr-4">Precision@5</th>
                  <th className="text-right pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => loadRunDetails(run)}
                    className={`cursor-pointer hover:bg-white/5 transition-colors ${
                      selectedRun?.id === run.id ? "bg-indigo-500/10" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 text-gray-300 font-sans">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-300">
                      {run.completedQuestions ?? run.totalQuestions} / {run.totalQuestions}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {run.recall5 !== null ? (
                        <span
                          className={`font-semibold ${
                            run.recall5 >= 0.8
                              ? "text-emerald-400"
                              : run.recall5 >= 0.6
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {(run.recall5 * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-300">
                      {run.mrr !== null ? run.mrr.toFixed(3) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-300">
                      {run.ndcg5 !== null ? run.ndcg5.toFixed(3) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-300">
                      {run.precision5 !== null ? `${(run.precision5 * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <StatusPill status={run.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
