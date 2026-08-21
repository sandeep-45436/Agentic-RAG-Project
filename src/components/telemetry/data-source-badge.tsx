"use client";

import React, { useState } from "react";

export interface DataSourceBadgeProps {
  sourceName?: string;
  adapterName?: string;
  schemaVersion?: string;
  datasetVersion?: string;
  qualityScore?: number;
  freshnessLabel?: string;
  tenantName?: string;
  status?: "HEALTHY" | "WARNING" | "CRITICAL";
  domains?: Record<string, { score: number; status: string }>;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  sourceName = "Demo Synthetic University",
  adapterName = "DemoDataSource",
  schemaVersion = "Canonical University Model v1",
  datasetVersion = "demo-university-v1",
  qualityScore = 99.1,
  freshnessLabel = "Dataset Snapshot",
  tenantName = "Demo Organization",
  status = "HEALTHY",
  domains = {
    students: { score: 100, status: "HEALTHY" },
    attendance: { score: 98.5, status: "HEALTHY" },
    finance: { score: 100, status: "HEALTHY" },
    examinations: { score: 100, status: "HEALTHY" },
  },
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusBg =
    status === "HEALTHY"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : status === "WARNING"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-rose-500/15 text-rose-400 border-rose-500/30";

  return (
    <div className="relative inline-block text-xs font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${statusBg}`}

      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === "HEALTHY" ? "bg-emerald-400" : status === "WARNING" ? "bg-amber-400" : "bg-rose-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === "HEALTHY" ? "bg-emerald-500" : status === "WARNING" ? "bg-amber-500" : "bg-rose-500"
            }`}
          />
        </span>
        <span className="font-semibold">{sourceName}</span>
        <span className="opacity-60">|</span>
        <span className="opacity-80">{datasetVersion}</span>
        <span className="opacity-60">|</span>
        <span className="font-bold">{qualityScore}% Quality</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-md p-4 shadow-2xl z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              🛡️ Data Source Telemetry
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Data Source:</span>
              <span className="font-semibold text-emerald-400">{sourceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Data Adapter:</span>
              <span className="font-semibold text-slate-200">{adapterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contract Schema:</span>
              <span className="font-semibold text-slate-200">{schemaVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dataset Release:</span>
              <span className="font-semibold text-slate-200">{datasetVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Freshness:</span>
              <span className="font-semibold text-slate-300">{freshnessLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Tenant:</span>
              <span className="font-semibold text-slate-300">{tenantName}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-2">
              Domain Quality Breakdown
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(domains).map(([domain, info]) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-800/50 text-[10px]"
                >
                  <span className="capitalize text-slate-300">{domain}</span>
                  <span
                    className={`font-semibold ${
                      info.status === "HEALTHY"
                        ? "text-emerald-400"
                        : info.status === "WARNING"
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {info.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 text-[9.5px] text-slate-400 text-center italic border-t border-slate-800/60">
            Integration Boundary Enforced: Cognitive Kernel is Data-Source Agnostic.
          </div>
        </div>
      )}
    </div>
  );
};
