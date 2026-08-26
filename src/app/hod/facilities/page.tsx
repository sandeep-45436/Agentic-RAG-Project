"use client";

import React from "react";
import {
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Laptop,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODFacilitiesPage() {
  const { activeDepartment } = useHOD();

  const facilities = [
    {
      name: "Tech Hall 101",
      building: "Tech Hall",
      roomNumber: "101",
      type: "Lecture Hall (Tiered)",
      capacity: 40,
      utilization: "85%",
      status: "ACTIVE",
      features: "4K Laser Projector, Mic System, RAG Camera Feed",
    },
    {
      name: "Computer Science Advanced AI Lab",
      building: "Tech Hall",
      roomNumber: "Lab 3",
      type: "High-Performance Laboratory",
      capacity: 35,
      utilization: "92%",
      status: "ACTIVE",
      features: "35x NVIDIA RTX Workstations, High-Speed Fiber",
    },
    {
      name: "Science Block 201",
      building: "Science Block",
      roomNumber: "201",
      type: "Lecture Hall",
      capacity: 35,
      utilization: "70%",
      status: "ACTIVE",
      features: "Smart Interactive Whiteboard",
    },
    {
      name: "Main Auditorium A",
      building: "Central Block",
      roomNumber: "Aud-A",
      type: "Auditorium",
      capacity: 120,
      utilization: "45%",
      status: "AVAILABLE",
      features: "Full Stage, Surround Audio, Exam Seating Capacity",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-400" />
            Department Facilities, Labs & Lecture Halls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Physical infrastructure utilization, computer laboratories, and lecture hall capacity for {activeDepartment}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((fac, i) => (
          <Card key={i} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-3">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white">{fac.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-400">{fac.building} • Room {fac.roomNumber}</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30">
                  {fac.type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Capacity</span>
                  <span className="font-bold text-white">{fac.capacity} Students</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Utilization</span>
                  <span className="font-bold text-emerald-400">{fac.utilization} Peak Load</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300 block mb-0.5">Lab & Room Features</span>
                <span>{fac.features}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
