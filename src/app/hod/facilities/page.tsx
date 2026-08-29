"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Laptop,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODFacilitiesPage() {
  const { activeDepartment, session } = useHOD();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Facility Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [facilityForm, setFacilityForm] = useState({
    name: "",
    building: "Tech Hall",
    roomNumber: "",
    capacity: "40",
    facilityType: "High-Performance Laboratory",
  });
  const [addLoading, setAddLoading] = useState(false);

  // Edit Facility Modal
  const [editingFacility, setEditingFacility] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    building: "",
    roomNumber: "",
    capacity: "",
    facilityType: "",
  });
  const [updating, setUpdating] = useState(false);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/facilities?department=${activeDepartment}`);
      const data = await res.json();
      if (data.facilities) {
        setFacilities(data.facilities);
      }
    } catch (err) {
      console.error("Failed to load facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [activeDepartment]);

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const res = await fetch("/api/hod/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...facilityForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFacilities();
        setAddModalOpen(false);
        setFacilityForm({
          name: "",
          building: "Tech Hall",
          roomNumber: "",
          capacity: "40",
          facilityType: "High-Performance Laboratory",
        });
      }
    } catch (err) {
      console.error("Add facility error:", err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/hod/facilities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: editingFacility.id,
          ...editForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFacilities();
        setEditingFacility(null);
      }
    } catch (err) {
      console.error("Update facility error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFacility = async (fac: any) => {
    if (!confirm(`Decommission facility ${fac.name}? Historical exam and lecture logs will be preserved.`)) return;

    try {
      const res = await fetch(
        `/api/hod/facilities?facilityId=${fac.id}&department=${activeDepartment}&actorName=${encodeURIComponent(
          session?.name || "HOD"
        )}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchFacilities();
      }
    } catch (err) {
      console.error("Decommission error:", err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFacilities}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Facility / Lab
          </Button>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((fac) => (
          <Card key={fac.id} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-3">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white">{fac.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    {fac.building} • Room {fac.roomNumber}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30">
                    {fac.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingFacility(fac);
                      setEditForm({
                        name: fac.name,
                        building: fac.building,
                        roomNumber: fac.roomNumber,
                        capacity: String(fac.capacity),
                        facilityType: fac.type,
                      });
                    }}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-white"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFacility(fac)}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
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

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Equipment & Infrastructure Notes</span>
                <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                  {fac.features}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ADD FACILITY MODAL                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-400" />
                Add Department Laboratory or Lecture Hall
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleAddFacility} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Facility / Lab Name *</label>
                <Input
                  required
                  placeholder="e.g. Computer Science Robotics & Edge AI Lab"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Building</label>
                  <Input
                    value={facilityForm.building}
                    onChange={(e) => setFacilityForm({ ...facilityForm, building: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Room Number *</label>
                  <Input
                    required
                    placeholder="e.g. Lab 4 / Room 204"
                    value={facilityForm.roomNumber}
                    onChange={(e) => setFacilityForm({ ...facilityForm, roomNumber: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Seating / Station Capacity</label>
                  <Input
                    type="number"
                    value={facilityForm.capacity}
                    onChange={(e) => setFacilityForm({ ...facilityForm, capacity: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Facility Type</label>
                  <select
                    value={facilityForm.facilityType}
                    onChange={(e) => setFacilityForm({ ...facilityForm, facilityType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                  >
                    <option value="High-Performance Laboratory">High-Performance Laboratory</option>
                    <option value="Lecture Hall (Tiered)">Lecture Hall (Tiered)</option>
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Seminar Room">Seminar Room</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {addLoading ? "Adding..." : "Add Facility"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT FACILITY MODAL                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingFacility && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-400" />
                Edit Facility: {editingFacility.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingFacility(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdateFacility} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Facility Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Building</label>
                  <Input
                    value={editForm.building}
                    onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Room Number</label>
                  <Input
                    value={editForm.roomNumber}
                    onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Capacity</label>
                <Input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingFacility(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {updating ? "Saving..." : "Save Facility"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
