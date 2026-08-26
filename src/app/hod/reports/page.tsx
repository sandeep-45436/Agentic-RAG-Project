"use client";

import React, { useState } from "react";
import {
  FileBarChart,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  FileText,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODReportsPage() {
  const { activeDepartment } = useHOD();
  const [exporting, setExporting] = useState(false);

  const reports = [
    {
      id: "rep_001",
      title: "Fall 2026 Department Operations & Health Executive Dossier",
      type: "Comprehensive Governance",
      generatedDate: "August 26, 2026",
      size: "2.4 MB",
      status: "READY",
      summary: "Full synthesis of student risk, faculty workloads, RAG document compliance, and examination allocations.",
    },
    {
      id: "rep_002",
      title: "ABET & National Academic Accreditation Compliance Audit",
      type: "Accreditation",
      generatedDate: "August 24, 2026",
      size: "1.8 MB",
      status: "READY",
      summary: "Curriculum mapping, outcome assessments, prerequisite graphs, and laboratory infrastructure verification.",
    },
    {
      id: "rep_003",
      title: "Midterm Examination 1 Anti-Malpractice Seating Report",
      type: "Examination",
      generatedDate: "August 22, 2026",
      size: "950 KB",
      status: "READY",
      summary: "Mathematical 2D zig-zag alternate seating allocations, attendance checklists, and invigilator duties.",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-blue-400" />
            Executive Department Intelligence & Accreditation Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Automated cognitive operations dossiers, ABET accreditation artifacts, and printable governance summaries for {activeDepartment}
          </p>
        </div>

        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-semibold shadow-lg shadow-blue-600/20"
        >
          <Printer className="mr-1.5 h-4 w-4" />
          Print Operations Dossier
        </Button>
      </div>

      <div className="space-y-4">
        {reports.map((rep) => (
          <Card key={rep.id} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-3">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white">{rep.title}</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Generated {rep.generatedDate} • Size: {rep.size}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30 shrink-0">
                  {rep.type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="text-xs text-slate-300">
              <p className="leading-relaxed">{rep.summary}</p>
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Cognitive Audit
              </span>
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs h-8 rounded-lg"
              >
                <Download className="h-3 w-3 mr-1" />
                Download PDF
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
