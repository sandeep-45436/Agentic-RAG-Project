"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

interface EvalRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  totalQuestions: number;
  recall5: number | null;
  mrr: number | null;
  ndcg5: number | null;
  precision5: number | null;
  avgFaithfulness: number | null;
  avgHallucination: number | null;
  avgLatencyMs: number | null;
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
    difficulty: string;
    relevantCategories: string[];
  };
}

function ScoreBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <div className="text-gray-500 text-sm">—</div>;
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{pct}%</span>
      <span className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/15 text-blue-400">
          <Loader2 className="w-3 h-3 animate-spin" /> Running
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/15 text-red-400">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-500/15 text-gray-400">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
}

export default function EvaluationPage() {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvalRun | null>(null);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/eval/runs");
      const data = await res.json();
      if (data.runs) setRuns(data.runs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
    // Poll every 5s while a run is RUNNING
    const iv = setInterval(() => {
      fetchRuns();
    }, 5000);
    return () => clearInterval(iv);
  }, [fetchRuns]);

  async function loadRunDetails(run: EvalRun) {
    setSelectedRun(run);
    setResults([]);
    try {
      const res = await fetch(`/api/eval/runs/${run.id}`);
      const data = await res.json();
      if (data.results) setResults(data.results);
    } catch {
      // silent
    }
  }

  async function triggerRun() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch("/api/eval/runs", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to trigger evaluation run");
      } else {
        await fetchRuns();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTriggering(false);
    }
  }

  const latestRun = runs.find((r) => r.status === "COMPLETED");

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            RAG Evaluation
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Recall@5 · MRR · NDCG@5 · Faithfulness · Hallucination Rate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRuns}
            className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-indigo-500/40 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={triggerRun}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            {triggering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Evaluation
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Latest metrics */}
      {latestRun && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Latest Run</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {latestRun.totalQuestions} questions ·{" "}
                {latestRun.avgLatencyMs ? `${Math.round(latestRun.avgLatencyMs)}ms avg` : ""}
              </span>
              <StatusPill status={latestRun.status} />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
            <ScoreBadge value={latestRun.recall5} label="Recall@5" />
            <ScoreBadge value={latestRun.mrr} label="MRR" />
            <ScoreBadge value={latestRun.ndcg5} label="NDCG@5" />
            <ScoreBadge value={latestRun.precision5} label="Precision@5" />
            <ScoreBadge value={latestRun.avgFaithfulness} label="Faithfulness" />
            <ScoreBadge
              value={latestRun.avgHallucination !== null ? 1 - latestRun.avgHallucination : null}
              label="Grounded"
            />
          </div>
        </div>
      )}

      {/* Runs history */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-white mb-3">Evaluation Runs</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No evaluation runs yet. Click &ldquo;Run Evaluation&rdquo; to start.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-500 uppercase tracking-wide border-b border-white/5">
                  <th className="text-left pb-2 pr-4">Started</th>
                  <th className="text-right pb-2 pr-4">Questions</th>
                  <th className="text-right pb-2 pr-4">Recall@5</th>
                  <th className="text-right pb-2 pr-4">MRR</th>
                  <th className="text-right pb-2 pr-4">NDCG@5</th>
                  <th className="text-right pb-2 pr-4">Faithfulness</th>
                  <th className="text-right pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => loadRunDetails(run)}
                    className={`border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                      selectedRun?.id === run.id ? "bg-indigo-500/10" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 text-gray-300">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-300">{run.totalQuestions}</td>
                    <td className="py-2 pr-4 text-right">
                      {run.recall5 !== null ? (
                        <span
                          className={
                            run.recall5 >= 0.8
                              ? "text-emerald-400"
                              : run.recall5 >= 0.6
                              ? "text-yellow-400"
                              : "text-red-400"
                          }
                        >
                          {(run.recall5 * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-300">
                      {run.mrr !== null ? run.mrr.toFixed(3) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-300">
                      {run.ndcg5 !== null ? run.ndcg5.toFixed(3) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-300">
                      {run.avgFaithfulness !== null
                        ? `${(run.avgFaithfulness * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <StatusPill status={run.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-question breakdown */}
      {selectedRun && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-white mb-3">
            Question Breakdown — {new Date(selectedRun.startedAt).toLocaleString()}
          </h2>
          {results.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r) => {
                const expanded = expandedRows.has(r.id);
                return (
                  <div key={r.id} className="rounded-xl border border-white/5 bg-white/3">
                    <button
                      onClick={() =>
                        setExpandedRows((prev) => {
                          const next = new Set(prev);
                          next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                          return next;
                        })
                      }
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {r.recall5Hit ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span className="text-sm text-gray-200 truncate">
                          {r.evalQuestion.question}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4 text-xs text-gray-400">
                        <span>RR={r.reciprocalRank.toFixed(2)}</span>
                        <span>NDCG={r.dcg5.toFixed(2)}</span>
                        <span>{r.latencyMs}ms</span>
                        {expanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-3 pt-0 border-t border-white/5 grid grid-cols-2 gap-3 text-xs text-gray-400">
                        <div>
                          <span className="text-gray-500">Expected categories:</span>{" "}
                          {r.evalQuestion.relevantCategories.join(", ")}
                        </div>
                        <div>
                          <span className="text-gray-500">Difficulty:</span>{" "}
                          {r.evalQuestion.difficulty}
                        </div>
                        <div>
                          <span className="text-gray-500">Precision@5:</span>{" "}
                          {(r.precision5 * 100).toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-gray-500">Faithfulness:</span>{" "}
                          {r.faithfulnessScore !== null
                            ? `${(r.faithfulnessScore * 100).toFixed(1)}%`
                            : "Not scored"}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
