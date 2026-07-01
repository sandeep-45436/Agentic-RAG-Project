"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Copy, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function IntegrationsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then((d) => { setKeys(d.apiKeys ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create API key.");
    } else {
      setNewKeyValue(data.apiKey.key);
      setKeys((prev) => [data.apiKey, ...prev]);
      setNewKeyName("");
      setShowForm(false);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Revoke this API key? Apps using it will stop working immediately.")) return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Manage API keys to integrate the knowledge hub into your own applications.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="w-4 h-4" /> New API Key
        </Button>
      </div>

      {/* New key revealed after creation */}
      {newKeyValue && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-5 space-y-3">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            API key created — copy it now. You won't see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background rounded-lg px-3 py-2 border font-mono truncate">
              {newKeyValue}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => copyToClipboard(newKeyValue)}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNewKeyValue(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border p-6 space-y-4 bg-card">
          <h3 className="font-semibold text-base">Create API Key</h3>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Key name *</label>
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production App"
              required
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Generate Key
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed gap-4">
          <KeyRound className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No API keys yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden divide-y divide-border/50">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <KeyRound className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{k.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {k.keyPreview}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                </p>
                {k.lastUsedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last used {new Date(k.lastUsedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleDelete(k.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
