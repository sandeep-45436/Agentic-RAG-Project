"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Filter, Plus, MoreHorizontal, RefreshCw, Loader2,
  FileText, Lightbulb, Building2, Tag, Layers,
  X, ExternalLink, ZoomIn, ZoomOut, Maximize2, Settings,
} from "lucide-react";

// Dynamically import the heavy force-graph (no SSR)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: "Document" | "Topic" | "Entity" | "Insight" | "Organization";
  documentId?: string;
  createdAt?: string;
  connections: number;
  avgStrength: number;
  // injected by force-graph
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  strength: number;
}

interface GraphStats {
  totalNodes: number;
  totalConnections: number;
  strongConnections: number;
  strongPct: number;
  lastUpdated: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<GraphNode["type"], string> = {
  Document:     "#6366f1",
  Topic:        "#3b82f6",
  Entity:       "#22c55e",
  Insight:      "#f59e0b",
  Organization: "#a855f7",
};

const TYPE_LABELS: GraphNode["type"][] = ["Document", "Topic", "Entity", "Insight"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NodeIcon({ type, size = 14 }: { type: GraphNode["type"]; size?: number }) {
  const cls = `w-${Math.round(size / 4)} h-${Math.round(size / 4)}`;
  switch (type) {
    case "Document":     return <FileText className={cls} />;
    case "Topic":        return <Tag className={cls} />;
    case "Entity":       return <Layers className={cls} />;
    case "Insight":      return <Lightbulb className={cls} />;
    case "Organization": return <Building2 className={cls} />;
  }
}

// ── Legend dot ────────────────────────────────────────────────────────────────

function LegendDot({ type }: { type: GraphNode["type"] }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: NODE_COLORS[type] }} />
      <span className="text-xs text-gray-300">{type}</span>
    </div>
  );
}

// ── Node Details Panel ────────────────────────────────────────────────────────

function NodePanel({
  node,
  allNodes,
  edges,
  onClose,
}: {
  node: GraphNode;
  allNodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
}) {
  // Find connected nodes sorted by edge strength
  const connected = edges
    .filter((e) => {
      const srcId = typeof e.source === "object" ? e.source.id : e.source;
      const tgtId = typeof e.target === "object" ? e.target.id : e.target;
      return srcId === node.id || tgtId === node.id;
    })
    .map((e) => {
      const srcId = typeof e.source === "object" ? e.source.id : e.source;
      const tgtId = typeof e.target === "object" ? e.target.id : e.target;
      const otherId = srcId === node.id ? tgtId : srcId;
      const other = allNodes.find((n) => n.id === otherId);
      return { node: other, strength: e.strength };
    })
    .filter((c) => c.node)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5) as { node: GraphNode; strength: number }[];

  return (
    <aside className="w-64 shrink-0 bg-[#141720] border-l border-white/5 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Node Details</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Node identity */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: NODE_COLORS[node.type] + "25" }}>
            <div style={{ color: NODE_COLORS[node.type] }}>
              <NodeIcon type={node.type} size={16} />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{node.label}</p>
            <p className="text-xs mt-0.5" style={{ color: NODE_COLORS[node.type] }}>{node.type}</p>
          </div>
        </div>

        {/* Details table */}
        <div className="space-y-2.5">
          {node.createdAt && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Added on</span>
              <span className="text-xs text-white">
                {new Date(node.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Type</span>
            <span className="text-xs text-white">{node.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Connections</span>
            <span className="text-xs text-white">{node.connections}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Avg. Strength</span>
            <span className="text-xs text-white">{node.avgStrength.toFixed(2)}</span>
          </div>
        </div>

        {/* View document CTA */}
        {node.type === "Document" && (
          <a
            href="/documents"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Document
          </a>
        )}

        {/* Top connected */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white">Top Connected Nodes</p>
            <button className="text-[10px] text-indigo-400 hover:text-indigo-300">View all</button>
          </div>
          <div className="space-y-2">
            {connected.length === 0 ? (
              <p className="text-xs text-gray-500">No connections found.</p>
            ) : (
              connected.map(({ node: cn, strength }) => (
                <div key={cn.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: NODE_COLORS[cn.type] + "25", color: NODE_COLORS[cn.type] }}>
                    <NodeIcon type={cn.type} size={10} />
                  </div>
                  <span className="text-xs text-gray-300 flex-1 truncate">{cn.label}</span>
                  <span className="text-xs text-gray-500 shrink-0">{strength.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showStrength, setShowStrength] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<GraphNode["type"]>>(new Set(TYPE_LABELS));
  const graphRef = useRef<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d) => {
        setNodes(d.nodes ?? []);
        setEdges(d.edges ?? []);
        setStats(d.stats ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    await fetch("/api/graph", { method: "POST" });
    await load();
    setRecalculating(false);
  };

  const toggleFilter = (type: GraphNode["type"]) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) { next.delete(type); } else { next.add(type); }
      return next;
    });
  };

  // Apply type filters
  const visibleNodes = nodes.filter((n) => activeFilters.has(n.type) || n.type === "Organization");
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter((e) => {
    const srcId = typeof e.source === "object" ? (e.source as GraphNode).id : e.source;
    const tgtId = typeof e.target === "object" ? (e.target as GraphNode).id : e.target;
    return visibleNodeIds.has(srcId) && visibleNodeIds.has(tgtId);
  });

  const graphData = { nodes: visibleNodes, links: visibleEdges };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#0f1117] text-white overflow-hidden -m-6 md:-m-10">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">Knowledge Graph</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Visualize relationships between your documents, topics, and key concepts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
            >
              {recalculating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {recalculating ? "Recalculating..." : "Add Source"}
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Toolbar (legend + controls) ── */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0 bg-[#141720]">
          <div className="flex items-center gap-4">
            {TYPE_LABELS.map((t) => (
              <button
                key={t}
                onClick={() => toggleFilter(t)}
                className={`flex items-center gap-1.5 text-xs transition-opacity ${activeFilters.has(t) ? "opacity-100" : "opacity-30"}`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: NODE_COLORS[t] }} />
                <span className="text-gray-300">{t}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              Show Strength
              <button
                onClick={() => setShowStrength((v) => !v)}
                className={`relative w-8 h-4 rounded-full transition-colors ${showStrength ? "bg-indigo-600" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showStrength ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
            <button onClick={() => graphRef.current?.zoomIn()} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => graphRef.current?.zoomOut()} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => graphRef.current?.zoomToFit(400)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={load} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Graph canvas ── */}
        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                <p className="text-sm text-gray-400">Building knowledge graph...</p>
              </div>
            </div>
          ) : visibleNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Layers className="w-12 h-12 text-indigo-400/30" />
              <div className="text-center">
                <p className="text-white font-medium">No graph data yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload and process documents to populate the knowledge graph.</p>
              </div>
              <a href="/documents" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                Go to Documents
              </a>
            </div>
          ) : (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={undefined}
              height={undefined}
              backgroundColor="#0f1117"
              nodeLabel={(n: any) => n.label}
              nodeColor={(n: any) => NODE_COLORS[(n as GraphNode).type] ?? "#6366f1"}
              nodeRelSize={6}
              nodeVal={(n: any) => Math.max(1, (n as GraphNode).connections * 0.8 + 1)}
              linkColor={(l: any) => {
                const str = (l as GraphEdge).strength ?? 0.5;
                const opacity = Math.round(str * 180).toString(16).padStart(2, "0");
                return `#6366f1${opacity}`;
              }}
              linkWidth={(l: any) => Math.max(0.5, ((l as GraphEdge).strength ?? 0.5) * 2.5)}
              linkLabel={(l: any) =>
                showStrength ? `${(l as GraphEdge).type} · ${(l as GraphEdge).strength?.toFixed(2)}` : (l as GraphEdge).type
              }
              linkDirectionalParticles={(l: any) => ((l as GraphEdge).strength ?? 0) > 0.8 ? 2 : 0}
              linkDirectionalParticleSpeed={0.004}
              onNodeClick={(n: any) => setSelectedNode(n as GraphNode)}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const n = node as GraphNode & { x: number; y: number };
                const color = NODE_COLORS[n.type] ?? "#6366f1";
                const isSelected = selectedNode?.id === n.id;
                const r = Math.max(4, (n.connections * 0.5 + 4));

                // Glow for selected
                if (isSelected) {
                  ctx.shadowColor = color;
                  ctx.shadowBlur = 12;
                }

                // Node circle
                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
                ctx.fillStyle = color + (isSelected ? "ff" : "cc");
                ctx.fill();

                // Border
                ctx.strokeStyle = isSelected ? "#ffffff" : color;
                ctx.lineWidth = isSelected ? 1.5 : 0.5;
                ctx.stroke();

                ctx.shadowBlur = 0;

                // Label (only when zoomed in enough or for org/selected)
                if (globalScale > 1.2 || n.type === "Organization" || isSelected) {
                  const label = n.label.length > 18 ? n.label.substring(0, 18) + "…" : n.label;
                  const fontSize = Math.max(8, 10 / globalScale);
                  ctx.font = `${isSelected ? "bold " : ""}${fontSize}px Inter, sans-serif`;
                  ctx.fillStyle = "#ffffff";
                  ctx.textAlign = "center";
                  ctx.fillText(label, n.x, n.y + r + fontSize + 1);
                }

                // Strength label on edges (canvas handles links separately)
              }}
              cooldownTicks={120}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
            />
          )}
        </div>

        {/* ── Bottom stats ── */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 px-6 py-4 border-t border-white/5 shrink-0 bg-[#141720]">
            <div className="bg-[#1a1f2e] rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-400 mb-1">Relationship Strength</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">0</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5">
                  <div className="h-full rounded-full" style={{ background: "linear-gradient(to right, #ef4444, #f59e0b, #22c55e)", width: "100%" }} />
                </div>
                <span className="text-[10px] text-gray-500">1.00</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-500">Weak</span>
                <span className="text-[10px] text-gray-500">Strong</span>
              </div>
            </div>
            <div className="bg-[#1a1f2e] rounded-xl p-3 border border-white/5 flex items-start gap-3">
              <div className="text-indigo-400 mt-0.5 shrink-0">ⓘ</div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Documents, topics, entities, and insights are connected. Stronger connections mean higher relevance.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: node details OR graph insights ── */}
      {selectedNode ? (
        <NodePanel
          node={selectedNode}
          allNodes={nodes}
          edges={edges}
          onClose={() => setSelectedNode(null)}
        />
      ) : (
        <aside className="w-64 shrink-0 bg-[#141720] border-l border-white/5 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Node Details</h3>
            <p className="text-xs text-gray-500 mt-1">Click a node to see its details.</p>
          </div>

          {stats && (
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Graph Insights</h4>
                <div className="space-y-2.5">
                  {[
                    { label: "Total Nodes", value: stats.totalNodes },
                    { label: "Total Connections", value: stats.totalConnections },
                    { label: `Strong Connections (≥ 0.7)`, value: `${stats.strongConnections} (${stats.strongPct}%)` },
                    { label: "Last Updated", value: stats.lastUpdated ? timeAgo(stats.lastUpdated) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Node Types</h4>
                {TYPE_LABELS.map((t) => {
                  const count = nodes.filter((n) => n.type === t).length;
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: NODE_COLORS[t] }} />
                      <span className="text-xs text-gray-300 flex-1">{t}</span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
                Recalculate Graph
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
