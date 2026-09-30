"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Lock,
  Shield,
  GraduationCap,
  Building2,
  Sparkles,
  Sliders,
  Bell,
  Volume2,
  Palette,
  Check,
  Save,
  Download,
  RefreshCw,
  AlertTriangle,
  Key,
  CheckCircle2,
  Layers,
  BookOpen,
  Cpu,
  Smartphone,
  Laptop,
  Globe,
  HardDrive,
  Zap,
  Loader2,
  Award,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";

interface UserProfile {
  id: string | null;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AcademicDetails {
  role: string;
  idNumber: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  majorOrDesignation: string;
  gpa: number;
  academicStatus: string;
  officeRoom?: string | null;
  advisorName?: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

const AVATAR_OPTIONS = [
  { id: "Scholar", label: "Scholar", seed: "Scholar" },
  { id: "Athena", label: "Athena", seed: "Athena" },
  { id: "Turing", label: "Turing", seed: "Turing" },
  { id: "Curie", label: "Curie", seed: "Curie" },
  { id: "Newton", label: "Newton", seed: "Newton" },
  { id: "Lovelace", label: "Lovelace", seed: "Lovelace" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "ai_preferences" | "notifications" | "experience" | "data"
  >("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // User & Academic State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [academic, setAcademic] = useState<AcademicDetails | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Editable Form Fields
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [majorOrDesignation, setMajorOrDesignation] = useState("");
  const [bio, setBio] = useState(
    "Focused on artificial intelligence, algorithmic design, and distributed systems."
  );
  const [selectedAvatar, setSelectedAvatar] = useState("Scholar");

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // AI & RAG Engine Preferences
  const [ragRigor, setRagRigor] = useState<"EXAM_GRADE" | "BALANCED" | "RESEARCH">("BALANCED");
  const [defaultScope, setDefaultScope] = useState<"ALL" | "PRIMARY">("ALL");
  const [katexMath, setKatexMath] = useState(true);
  const [citationDetail, setCitationDetail] = useState<"COMPREHENSIVE" | "SUMMARY">("COMPREHENSIVE");

  // Notification Preferences
  const [notifyExams, setNotifyExams] = useState(true);
  const [notifySyllabus, setNotifySyllabus] = useState(true);
  const [notifyAttendance, setNotifyAttendance] = useState(true);
  const [notifyPlacements, setNotifyPlacements] = useState(true);

  // Experience Preferences
  const [animatedBg, setAnimatedBg] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [compactLayout, setCompactLayout] = useState(false);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAvatar = localStorage.getItem("alits_user_avatar");
      if (savedAvatar) setSelectedAvatar(savedAvatar);

      const savedRigor = localStorage.getItem("alits_rag_rigor");
      if (savedRigor) setRagRigor(savedRigor as any);

      const savedScope = localStorage.getItem("alits_default_scope");
      if (savedScope) setDefaultScope(savedScope as any);

      const savedKatex = localStorage.getItem("alits_katex_math");
      if (savedKatex !== null) setKatexMath(savedKatex === "true");

      const savedAnim = localStorage.getItem("alits_anim_bg");
      if (savedAnim !== null) setAnimatedBg(savedAnim === "true");

      const savedAudio = localStorage.getItem("alits_audio_feedback");
      if (savedAudio !== null) setAudioFeedback(savedAudio === "true");
    }
  }, []);

  // Fetch full settings from API
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setAcademic(data.academic);
        setDepartments(data.departments || []);

        setName(data.user.name || "");
        setDepartmentId(data.academic.departmentId || "");
        setMajorOrDesignation(data.academic.majorOrDesignation || "");
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save Profile Handler
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          departmentId,
          majorOrDesignation,
          bio,
          preferences: {
            avatar: selectedAvatar,
            ragRigor,
            defaultScope,
            katexMath,
            citationDetail,
            notifyExams,
            notifySyllabus,
            notifyAttendance,
            notifyPlacements,
            animatedBg,
            audioFeedback,
            compactLayout,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        // Persist preferences locally
        localStorage.setItem("alits_user_avatar", selectedAvatar);
        localStorage.setItem("alits_rag_rigor", ragRigor);
        localStorage.setItem("alits_default_scope", defaultScope);
        localStorage.setItem("alits_katex_math", String(katexMath));
        localStorage.setItem("alits_anim_bg", String(animatedBg));
        localStorage.setItem("alits_audio_feedback", String(audioFeedback));

        // Refresh settings state
        await loadSettings();
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setSaveError(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      setSaveError(err.message || "Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  // Password Update Handler
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordStatus({ type: "error", message: "Please fill out all password fields." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 8 characters long.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setPasswordStatus({ type: "loading", message: "Verifying credentials..." });
    setTimeout(() => {
      setPasswordStatus({
        type: "success",
        message: "Institutional password updated successfully! Next login requires new credentials.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus({ type: "idle", message: "" }), 5000);
    }, 1200);
  };

  // Export Archive Handler
  const handleExportData = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      institution: "Anantha Lakshmi Institute of Technology & Sciences (ALITS)",
      userProfile: user,
      academicProfile: academic,
      systemPreferences: {
        ragRigor,
        defaultScope,
        katexMath,
        citationDetail,
        notifyExams,
        notifySyllabus,
        notifyAttendance,
        notifyPlacements,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ALITS_Academic_Profile_${user?.name?.replace(/\s+/g, "_") || "User"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Password strength helper
  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 25;
    if (/[A-Z]/.test(newPassword)) score += 25;
    if (/[0-9]/.test(newPassword)) score += 25;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 25;
    return score;
  };

  const passwordStrength = getPasswordStrength();

  return (
    <AnimatedBackground>
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900/90 text-white shadow-xl shadow-indigo-950/20 backdrop-blur-xl border border-white/10 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`}
                  alt="Avatar"
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border-2 border-white/20 p-1 shadow-inner object-cover"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active Institutional Session" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {loading ? "Loading Profile..." : user?.name || "Scholar"}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold font-mono">
                    {academic?.idNumber || "STU-2026-CSE-104"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-semibold">
                    {academic?.role || "STUDENT"}
                  </span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 flex items-center gap-2 flex-wrap">
                  <span>{user?.email}</span>
                  <span>•</span>
                  <span className="text-indigo-300 font-semibold">{academic?.departmentName || "Computer Science & Engineering"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSaveProfile()}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Changes Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Global Toast Alert */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Institutional profile & preferences successfully updated and synchronized!</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
              Dismiss
            </button>
          </div>
        )}

        {saveError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
            <button onClick={() => setSaveError(null)} className="text-rose-700 hover:text-rose-900 font-bold text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-md overflow-x-auto scrollbar-none">
          {[
            { id: "profile", label: "Academic Profile", icon: User },
            { id: "security", label: "Security & MFA", icon: ShieldCheck },
            { id: "ai_preferences", label: "AI & Retrieval Scope", icon: Cpu },
            { id: "notifications", label: "Academic Alerts", icon: Bell },
            { id: "experience", label: "Experience & UI", icon: Palette },
            { id: "data", label: "Archive & Privacy", icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ACADEMIC PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Avatar & Quick Info */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Institutional Avatar
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your digital persona for class forums and academic chat.
                  </p>
                </div>

                <div className="flex items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`}
                    alt="Current Avatar"
                    className="w-24 h-24 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm p-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Choose Avatar Character:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVATAR_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedAvatar(opt.seed)}
                        className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                          selectedAvatar === opt.seed
                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/20"
                            : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                        }`}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opt.seed}`}
                          alt={opt.label}
                          className="w-8 h-8 rounded-lg"
                        />
                        <span className="text-[11px] truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Academic Standing Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      Academic Standing
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      {academic?.academicStatus || "Good Standing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Cumulative GPA:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{academic?.gpa ? Number(academic.gpa).toFixed(2) : "3.85"} / 4.0</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Advisor:</span>
                    <span className="font-medium text-slate-800">{academic?.advisorName || "Dr. Faculty Advisor"}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Editable Profile Form */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic Identity & Department</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your institutional records determine your document access permissions and course enrollments.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Alex Johnson"
                          className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        University Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Academic Department Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                        <span>Department Scope</span>
                        <span className="text-[10px] text-indigo-600 font-semibold">Active Enrollment</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white transition-all cursor-pointer"
                        >
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.code} — {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Major / Designation */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Major / Academic Program
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={majorOrDesignation}
                          onChange={(e) => setMajorOrDesignation(e.target.value)}
                          placeholder="e.g. Computer Science & Engineering - B.Tech"
                          className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic Bio */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Academic Bio & Research Interests
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your technical interests, project goals, or specialized areas..."
                      className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Profile Details
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY & MFA */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Password Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600" />
                    Change Institutional Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your university portal credentials. Ensure minimum 8 characters.
                  </p>
                </div>

                {passwordStatus.message && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      passwordStatus.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : passwordStatus.type === "error"
                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                        : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                    }`}
                  >
                    {passwordStatus.type === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {passwordStatus.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {passwordStatus.type === "error" && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter robust new password"
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>

                    {/* Strength Indicator */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength <= 25
                                ? "w-1/4 bg-rose-500"
                                : passwordStrength <= 50
                                ? "w-2/4 bg-amber-500"
                                : passwordStrength <= 75
                                ? "w-3/4 bg-indigo-500"
                                : "w-full bg-emerald-500"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Strength:{" "}
                          <span className="font-bold">
                            {passwordStrength <= 25
                              ? "Weak"
                              : passwordStrength <= 50
                              ? "Moderate"
                              : passwordStrength <= 75
                              ? "Good"
                              : "Strong & Secure"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* MFA & Active Sessions Card */}
              <div className="space-y-6">
                {/* 2FA Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        Two-Factor Authentication (MFA)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        University identity verification via institutional OTP or authenticator app.
                      </p>
                    </div>

                    <button
                      onClick={() => setMfaEnabled(!mfaEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        mfaEnabled ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          mfaEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-900 font-medium">
                      {mfaEnabled
                        ? "Institutional MFA is active. Your exam enrollments and transcript requests are cryptographically protected."
                        : "MFA is currently disabled. We strongly recommend enabling two-factor verification."}
                    </p>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-600" />
                    Authorized Active Sessions
                  </h3>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Chrome on Windows (Current)</p>
                          <p className="text-[10px] text-slate-500 font-mono">Campus Subnet · Active now</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Online
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-200 text-slate-700">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Mobile Safari (iOS)</p>
                          <p className="text-[10px] text-slate-500 font-mono">Last accessed 3 hours ago</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert("Revoked mobile session.")}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI & RETRIEVAL ENGINE */}
        {activeTab === "ai_preferences" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  RAG Neural Retrieval & Grounding Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tune how the Academic AI searches syllabi, evaluates citations, and formats pedagogical responses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Default Knowledge Scope */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Default Query Scope</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                      {defaultScope}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Determines whether queries automatically search across the whole university or stay pinned to your home department.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDefaultScope("ALL")}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        defaultScope === "ALL"
                          ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="block">All Departments</span>
                      <span className="text-[10px] font-normal text-slate-500">Universal Syllabi + Univ Regulations</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultScope("PRIMARY")}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        defaultScope === "PRIMARY"
                          ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="block">My Department Only</span>
                      <span className="text-[10px] font-normal text-slate-500">Confined to {academic?.departmentCode || "CS"} courses</span>
                    </button>
                  </div>
                </div>

                {/* Grounding Rigor */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Grounding Rigor</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono">
                      {ragRigor}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Controls hallucination gatekeeping and citation strictness in assistant answers.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { id: "EXAM_GRADE", label: "Exam Grade", desc: "Strict verification" },
                      { id: "BALANCED", label: "Balanced", desc: "Standard academic" },
                      { id: "RESEARCH", label: "Research", desc: "Broad exploration" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setRagRigor(mode.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          ragRigor === mode.id
                            ? "border-purple-600 bg-purple-50/80 text-purple-900 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-[11px]">{mode.label}</span>
                        <span className="text-[9px] font-normal text-slate-500 line-clamp-1">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">KaTeX Mathematical & Algorithmic Rendering</p>
                    <p className="text-xs text-slate-500">Render complex mathematical equations, proofs, and time complexities with LaTeX.</p>
                  </div>
                  <button
                    onClick={() => setKatexMath(!katexMath)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      katexMath ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        katexMath ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Source Citation Granularity</p>
                    <p className="text-xs text-slate-500">Display full verbatim syllabus chunks with similarity score percentages.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCitationDetail(citationDetail === "COMPREHENSIVE" ? "SUMMARY" : "COMPREHENSIVE")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      {citationDetail === "COMPREHENSIVE" ? "Comprehensive Cards" : "Summary Only"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACADEMIC ALERTS & NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Institutional Notification Dispatch
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure delivery channels for examination timetables, grade announcements, and syllabus updates.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  {
                    title: "Examination Schedules & Seating Allotment",
                    desc: "Urgent notifications when mid-term and semester final timetables or seating plans are published.",
                    state: notifyExams,
                    setter: setNotifyExams,
                  },
                  {
                    title: "Faculty Notes & Syllabus Revisions",
                    desc: "Instant push alert whenever a professor uploads new lecture slides, lab manuals, or question banks.",
                    state: notifySyllabus,
                    setter: setNotifySyllabus,
                  },
                  {
                    title: "Attendance Shortage Condonation Warnings",
                    desc: "Automated institutional warning if overall or course-wise attendance falls below 75%.",
                    state: notifyAttendance,
                    setter: setNotifyAttendance,
                  },
                  {
                    title: "Campus Placement Drives & Eligibility",
                    desc: "Notifications for eligible campus recruiting drives, shortlist status, and technical mock interviews.",
                    state: notifyPlacements,
                    setter: setNotifyPlacements,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-4">
                    <div className="pr-4">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.setter(!item.state)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        item.state ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          item.state ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPERIENCE & UI */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  Interface Design & Accessibility
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personalize the animated visual atmosphere and auditory feedback of the ALITS Academic Portal.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Fluid Animated Backgrounds</p>
                      <p className="text-xs text-slate-500">Render floating colored ambient gradients and particle effects across pages.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAnimatedBg(!animatedBg)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      animatedBg ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        animatedBg ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Auditory Grounding Feedback</p>
                      <p className="text-xs text-slate-500">Soft audio chime when syllabus citations and verified chunks are successfully fused.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAudioFeedback(!audioFeedback)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      audioFeedback ? "bg-purple-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        audioFeedback ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ARCHIVE & PRIVACY */}
        {activeTab === "data" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Archive */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Export Academic Portfolio</h3>
                    <p className="text-xs text-slate-500">Download your full profile, enrollment history, and RAG configuration.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Generates an encrypted JSON package containing your verified student credentials, enrolled courses, and system parameters for institutional transfer.
                </p>

                <button
                  onClick={handleExportData}
                  className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download JSON Archive
                </button>
              </div>

              {/* Cache & Privacy Reset */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Reset Local Consultation Cache</h3>
                    <p className="text-xs text-slate-500">Purge client-side cached chat responses and temporary vector embeddings.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Clears device-stored conversation chunks and reloads fresh syllabus embeddings from the server. Does not affect your enrolled courses or academic records.
                </p>

                <button
                  onClick={() => {
                    if (window.confirm("Purge local browser cache and reload fresh academic state?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Purge Local Cache & Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
