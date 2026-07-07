"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Clock,
  Zap,
  Database,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RetrievalChunkDetail {
  documentName: string;
  chunkIndex: number;
  vectorScore: number | null;
  bm25Score: number | null;
  fusionScore: number | null;
}

interface RetrievalLog {
  id: string;
  query: string;
  type: "hybrid" | "vector" | "bm25";
  chunksFound: number;
  latencyMs: number;
  timestamp: string;
  confidence: "high" | "medium" | "low";
  chunks: RetrievalChunkDetail[];
}

interface RetrievalStats {
  totalQueries: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  hybridRatio: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, maxLen: number) {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function confidenceColor(level: "high" | "medium" | "low") {
  switch (level) {
    case "high":
      return "confidence-high";
    case "medium":
      return "confidence-medium";
    case "low":
      return "confidence-low";
  }
}

function confidenceBgColor(level: "high" | "medium" | "low") {
  switch (level) {
    case "high":
      return "confidence-high-bg";
    case "medium":
      return "confidence-medium-bg";
    case "low":
      return "confidence-low-bg";
  }
}

function typeBadgeVariant(type: "hybrid" | "vector" | "bm25") {
  switch (type) {
    case "hybrid":
      return "default" as const;
    case "vector":
      return "secondary" as const;
    case "bm25":
      return "outline" as const;
  }
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delay,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <Card
      className="glass border-border/50 shadow-soft overflow-hidden relative group hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ── Confidence Bar ────────────────────────────────────────────────────────────

function ConfidenceBar({
  score,
  label,
}: {
  score: number | null;
  label: string;
}) {
  if (score === null) return null;
  const pct = Math.round(score * 100);
  const level: "high" | "medium" | "low" =
    pct >= 70 ? "high" : pct >= 40 ? "medium" : "low";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${confidenceColor(level)}`}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            level === "high"
              ? "bg-emerald-500"
              : level === "medium"
              ? "bg-amber-500"
              : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Expanded Row Details ──────────────────────────────────────────────────────

function ExpandedDetails({ log }: { log: any }) {
  const hasIntelligence = log.rewrittenQuery || (log.expansions && log.expansions.length > 0);

  return (
    <div className="px-6 py-5 bg-muted/30 border-t border-border/50 space-y-4 animate-scale-in">
      {/* Query intelligence display */}
      {hasIntelligence && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Query Intelligence Trace
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.rewrittenQuery && log.rewrittenQuery.toLowerCase() !== log.query.toLowerCase() && (
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">Contextual Query Rewrite</span>
                <p className="text-xs text-foreground bg-muted/50 p-2.5 rounded-lg border border-border/50 font-medium">
                  {log.rewrittenQuery}
                </p>
              </div>
            )}
            {log.expansions && log.expansions.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">Multi-Query Search Expansion</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {log.expansions.map((exp: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary font-semibold">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chunks grid */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Reranked Context Chunks
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {log.chunks.map((chunk: any, i: number) => (
            <div
              key={i}
              className="glass-subtle rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate max-w-[180px]">
                  {chunk.documentName}
                </span>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  Chunk {chunk.chunkIndex + 1}
                </Badge>
              </div>
              <div className="space-y-2">
                <ConfidenceBar score={chunk.vectorScore} label="Vector Score" />
                <ConfidenceBar score={chunk.bm25Score} label="BM25 Score" />
                <ConfidenceBar score={chunk.fusionScore} label="Fusion Score" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {log.chunks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No chunk detail data available for this query.
        </p>
      )}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table skeleton */}
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-primary/10 mb-4 animate-pulse-glow">
        <Database className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No retrieval logs yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Start chatting with your knowledge base to see retrieval debug
        information appear here.
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RetrievalDebugPage() {
  const [logs, setLogs] = useState<RetrievalLog[]>([]);
  const [stats, setStats] = useState<RetrievalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "hybrid" | "vector" | "bm25">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"latencyMs" | "timestamp" | "chunksFound">("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/debug/retrieval");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      console.error("Failed to load retrieval debug data:", err);
      // Fallback: show empty state
      setLogs([]);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Filter & sort logs
  const filteredLogs = logs
    .filter((log) => {
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
      if (
        searchQuery &&
        !log.query.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "timestamp") {
        return (
          dir *
          (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        );
      }
      return dir * (a[sortField] - b[sortField]);
    });

  if (loading) {
    return (
      <div className="space-y-8 animate-slide-up-fade">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Retrieval Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and debug hybrid retrieval quality
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up-fade">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Retrieval Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and debug hybrid retrieval quality
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Queries"
            value={stats.totalQueries.toLocaleString()}
            subtitle="Retrieval requests processed"
            icon={Database}
            delay={0}
          />
          <StatCard
            title="Avg Latency"
            value={`${stats.avgLatencyMs}ms`}
            subtitle="Mean retrieval response time"
            icon={Clock}
            delay={100}
          />
          <StatCard
            title="Cache Hit Rate"
            value={`${stats.cacheHitRate}%`}
            subtitle="Queries served from cache"
            icon={Zap}
            delay={200}
          />
          <StatCard
            title="Hybrid vs Vector"
            value={`${stats.hybridRatio}%`}
            subtitle="Hybrid retrieval utilization"
            icon={ArrowUpDown}
            delay={300}
          />
        </div>
      )}

      {/* Search & filter bar */}
      <Card className="glass border-border/50 shadow-soft">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              {(["all", "hybrid", "vector", "bm25"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    typeFilter === type
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retrieval logs table */}
      <Card className="glass border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Recent Retrieval Logs</CardTitle>
          <CardDescription>
            {filteredLogs.length} retrieval{filteredLogs.length !== 1 ? "s" : ""}{" "}
            {searchQuery || typeFilter !== "all" ? "(filtered)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40%]">Query</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("chunksFound")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Chunks
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("latencyMs")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Latency
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("timestamp")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Time
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow
                      onClick={() =>
                        setExpandedId(expandedId === log.id ? null : log.id)
                      }
                      className="cursor-pointer group hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium max-w-[300px]">
                        <span className="truncate block" title={log.query}>
                          {truncate(log.query, 60)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeBadgeVariant(log.type)} className="text-[11px]">
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {log.chunksFound}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span
                          className={
                            log.latencyMs > 500
                              ? "confidence-low"
                              : log.latencyMs > 200
                              ? "confidence-medium"
                              : "confidence-high"
                          }
                        >
                          {log.latencyMs}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${confidenceColor(
                            log.confidence
                          )} ${confidenceBgColor(log.confidence)}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.confidence === "high"
                                ? "bg-emerald-500"
                                : log.confidence === "medium"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                          />
                          {log.confidence}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatTime(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {expandedId === log.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0">
                          <ExpandedDetails log={log} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
