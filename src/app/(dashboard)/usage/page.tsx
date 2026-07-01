"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface UsageData {
  chat: { used: number; limit: number };
  embeddings: { used: number; limit: number };
  documents: { used: number; limit: number };
  storage: { usedBytes: number; limitBytes: number };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct > 90 ? "bg-destructive" : pct > 70 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); } else { setData(d); }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load usage data."); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
        <p className="text-muted-foreground">Monitor your platform usage and limits.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-4 max-w-3xl">
          <div className="rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">AI Generations (this month)</h3>
              <span className="text-sm text-muted-foreground">
                {data.chat.used.toLocaleString()} / {data.chat.limit.toLocaleString()}
              </span>
            </div>
            <UsageBar used={data.chat.used} limit={data.chat.limit} />
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Embedding Tokens (this month)</h3>
              <span className="text-sm text-muted-foreground">
                {data.embeddings.used.toLocaleString()} / {data.embeddings.limit.toLocaleString()}
              </span>
            </div>
            <UsageBar used={data.embeddings.used} limit={data.embeddings.limit} />
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Documents Indexed</h3>
              <span className="text-sm text-muted-foreground">
                {data.documents.used} / {data.documents.limit}
              </span>
            </div>
            <UsageBar used={data.documents.used} limit={data.documents.limit} />
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Knowledge Base Storage</h3>
              <span className="text-sm text-muted-foreground">
                {formatBytes(data.storage.usedBytes)} / {formatBytes(data.storage.limitBytes)}
              </span>
            </div>
            <UsageBar used={data.storage.usedBytes} limit={data.storage.limitBytes} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
