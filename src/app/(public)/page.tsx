"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  MessageSquare,
  FileText,
  Search,
  ShieldCheck,
  Zap,
  GraduationCap,
  ArrowRight,
  Layers,
  CheckCircle2,
  Download,
  BookOpen,
  Send,
  RefreshCw,
  Copy,
  ChevronDown,
  Building2,
  Building,
  Clock,
  Terminal,
  Menu,
  X,
  Scale,
  Cpu,
  Flame,
  Binary,
  Check,
  ShieldAlert,
  ArrowUpRight,
  Database,
  Network,
  Eye,
  Sliders,
  ChevronRight,
  Play,
  RotateCcw,
  Scissors,
  CheckCheck,
  BarChart3,
  Filter,
  Users,
  AlertTriangle,
} from "lucide-react";

// Preset interactive simulations for the live demo playground
const DEMO_PRESETS = [
  {
    id: "syllabus",
    label: "📚 CS401 Syllabus & Pre-reqs",
    tag: "Course Intelligence",
    query: "What are the prerequisites, credits, and syllabus topics for CS401?",
    routedNode: "KNOWLEDGE_AGENT",
    latency: "34ms",
    confidence: "98.4%",
    source: "CS401_Algorithms_Syllabus_Exam_Schedule.pdf",
    reasoningSteps: [
      "Tokenizing user query into 14 semantic tokens",
      "Validating RBAC: Course Catalog CS401 (Public Tenant: CS Dept)",
      "Executing Qdrant Cosine Similarity (Score: 0.984) + BM25 Lexical Matching",
      "Cross-encoder reranking over 8 chunk candidates",
      "Deterministic synthesis with exact textbook and ordinance citations",
    ],
    answer:
      "For **CS401: Advanced Algorithms & Data Structures**:\n\n• **Credits**: 4.0 Credits\n• **Prerequisites**: CS201 (Basic Data Structures) and MATH301 (Linear Algebra)\n• **Key Syllabus Topics**: Dynamic Programming, Amortized Analysis, Graph Algorithms (Dijkstra, Bellman-Ford, Tarjan's SCC), Network Flows, and NP-Completeness.",
    hasDownload: false,
  },
  {
    id: "extract",
    label: "📄 Extract Pages 6–9 from CNIP PPT",
    tag: "PDF Slice Engine",
    query: "Give me the CNIP ppt in that extract 6-9 pages",
    routedNode: "DOCUMENT_DELIVERY",
    latency: "42ms",
    confidence: "100%",
    source: "CNIP PPT.pdf (v1)",
    reasoningSteps: [
      "Parsing goal: Headless PDF Slice Request for pages [6, 7, 8, 9]",
      "Locating binary artifact in secure storage (Key: docs/cnip_v1.pdf)",
      "Spawning headless binary stream worker to isolate byte range 0x4F00-0x9A20",
      "Compiling 4-page extracted document slice (Size: 1.4 MB)",
      "Generating time-bounded cryptographically signed download URI",
    ],
    answer:
      "Here is your requested 4-page slice extracted directly from the professor's presentation slide deck:",
    hasDownload: true,
    downloadCard: {
      fileName: "extract_CNIP_PPT_pages_6-9.pdf",
      pages: "6, 7, 8, 9",
      size: "1.4 MB",
      artifactId: "ART-2026-99cdf7",
    },
  },
  {
    id: "policy",
    label: "⚖️ Academic Regulations & Attendance",
    tag: "Policy Governance",
    query: "What is the minimum attendance required and condonation policy?",
    routedNode: "KNOWLEDGE_AGENT",
    latency: "28ms",
    confidence: "99.1%",
    source: "Smart_University_Academic_Regulations_2026.pdf",
    reasoningSteps: [
      "Matching query to University Governance Ordinance 12.3",
      "Retrieving verified attendance rules across all departmental bylaws",
      "Evaluating threshold logic: 75% standard, 65-74% condonation window",
      "Cross-referencing HOD formal medical condonation workflow",
      "Generating policy-grounded verdict with zero hallucination guarantee",
    ],
    answer:
      "According to the **Smart University Academic Regulations 2026**:\n\n• **Minimum Attendance**: 75% across all registered lecture and laboratory courses.\n• **Medical Condonation**: Attendance between 65% and 74% can be condoned by HOD with verified medical documentation.\n• **Debarment**: Attendance below 65% results in automatic course debarment (Grade 'F-ATT').",
    hasDownload: false,
  },
  {
    id: "faculty",
    label: "🏛️ Faculty Workload & 15-Hr Cap",
    tag: "Faculty Operations",
    query: "What is the maximum faculty teaching load and how are sections reallocated?",
    routedNode: "KNOWLEDGE_AGENT",
    latency: "31ms",
    confidence: "97.8%",
    source: "Faculty_Research_and_Workload_Policy.pdf",
    reasoningSteps: [
      "Querying Faculty Handbook Section 4.1 & Workload Engine",
      "Verifying maximum contact hours constraint: 15 hrs/week ceiling",
      "Checking automated proposal generation for overloaded instructors",
      "Retrieving HOD Approval Center 1-click execution governance",
      "Formulating verified operational answer",
    ],
    answer:
      "Based on the **Faculty Operations & Workload Policy**:\n\n• **Max Teaching Cap**: 15 contact hours/week per instructor.\n• **Workload Engine**: Automatically flags overloads and submits Section Redistribution Proposals.\n• **HOD Authority**: HOD can balance section assignments via the Approval Center with 1-click execution.",
    hasDownload: false,
  },
];

const FAQS = [
  {
    q: "How does the platform guarantee zero hallucinations in university courses?",
    a: "NexusIQ implements strict multi-stage deterministic grounding with Qdrant vector cosine retrieval, PostgreSQL BM25 keyword matching, and cross-encoder reranking. If an answer cannot be verified with direct citation from university documents, the model strictly abstains.",
  },
  {
    q: "How does the on-demand headless PDF Slice Engine work?",
    a: "Students can request any arbitrary page range (e.g. 'extract pages 6–9 from CNIP PPT'). The system parses the query, slices the PDF binary headless stream in sub-seconds, and delivers an instant signed download link.",
  },
  {
    q: "How does the HOD Department Governance & Command Center function?",
    a: "The HOD Portal acts as an operational command center providing real-time departmental health scoring (7 dimensions), automated threat radars for at-risk students, faculty overload monitoring, and an Approval Center for policy-grounded attendance condonations.",
  },
  {
    q: "How is access control (RBAC) enforced between university departments?",
    a: "Every document, course, and exam seating arrangement is tagged with Organization, Department, and College IDs. The security layer enforces strict tenant and departmental isolation across all vector indices and PostgreSQL tables.",
  },
];

export default function HomePage() {
  const [selectedDemo, setSelectedDemo] = React.useState(DEMO_PRESETS[0]);
  const [typedText, setTypedText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [activePortalTab, setActivePortalTab] = React.useState<"student" | "faculty" | "hod">("student");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [activePipelineStep, setActivePipelineStep] = React.useState(2);

  // Multi-stage Reasoning Animation State
  const [isReasoning, setIsReasoning] = React.useState(false);
  const [reasoningStepIndex, setReasoningStepIndex] = React.useState(0);

  // Interactive PDF Slicer Simulator State
  const [sliceStartPage, setSliceStartPage] = React.useState(6);
  const [sliceEndPage, setSliceEndPage] = React.useState(9);
  const [isSlicingLaser, setIsSlicingLaser] = React.useState(false);
  const [sliceGenerated, setSliceGenerated] = React.useState(false);

  // Custom User Playground Query
  const [customQuery, setCustomQuery] = React.useState("");

  // Trigger reasoning & typing sequence
  const runInferenceSimulation = (preset = selectedDemo) => {
    setIsReasoning(true);
    setReasoningStepIndex(0);
    setIsTyping(false);
    setTypedText("");

    // Cycle through reasoning steps
    let step = 0;
    const reasoningInterval = setInterval(() => {
      step++;
      if (step < preset.reasoningSteps.length) {
        setReasoningStepIndex(step);
      } else {
        clearInterval(reasoningInterval);
        setIsReasoning(false);
        startTyping(preset.answer);
      }
    }, 400);
  };

  const startTyping = (fullText: string) => {
    setIsTyping(true);
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < fullText.length) {
        setTypedText(fullText.slice(0, idx + 4));
        idx += 4;
      } else {
        setTypedText(fullText);
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 15);
  };

  React.useEffect(() => {
    runInferenceSimulation(selectedDemo);
  }, [selectedDemo]);

  // Automated pipeline step cycle animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActivePipelineStep((prev) => (prev % 4) + 1);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedDemo.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerLaserSlice = () => {
    setIsSlicingLaser(true);
    setSliceGenerated(false);
    setTimeout(() => {
      setIsSlicingLaser(false);
      setSliceGenerated(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BACKGROUND COSMIC AURORA & GLOWING LIGHTS                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[650px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/15 to-purple-600/20 blur-[150px] pointer-events-none -z-10 rounded-full animate-glow-pulse" />
      <div className="absolute top-[30%] right-[-10%] w-[750px] h-[750px] bg-emerald-500/10 blur-[170px] pointer-events-none -z-10 rounded-full animate-float-delayed" />
      <div className="absolute top-[60%] left-[-10%] w-[750px] h-[750px] bg-indigo-600/12 blur-[180px] pointer-events-none -z-10 rounded-full animate-float" />
      <div className="absolute bottom-0 right-1/4 w-[650px] h-[650px] bg-cyan-500/10 blur-[160px] pointer-events-none -z-10 rounded-full" />

      {/* Cyber Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none -z-10"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. STICKY LUMINOUS NAVIGATION HEADER                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#05070d]/85 border-b border-white/[0.08] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-hover:shadow-indigo-500/50 transition-all duration-300 relative">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#05070d] animate-ping" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                NexusIQ{" "}
                <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner">
                  Cognitive RAG
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium hidden xs:block">
                Smart University Operations & Multi-Modal Intelligence
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-semibold text-slate-300">
            <a href="#portals" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Campus Portals</span>
            </a>
            <a href="#playground" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Live Playground</span>
            </a>
            <a href="#slicer" className="hover:text-white transition-colors flex items-center gap-1">
              <span>PDF Slicer</span>
            </a>
            <a href="#pipeline" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Neural Pipeline</span>
            </a>
            <a href="#features" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Features</span>
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/faculty/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-200"
            >
              <GraduationCap className="w-4 h-4 text-purple-400" />
              Faculty Portal
            </Link>

            <Link
              href="/hod/login"
              className="hidden md:inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:border-blue-500/60 transition-all duration-200"
            >
              <Scale className="w-4 h-4 text-blue-400" />
              HOD Portal
            </Link>

            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-300"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Student Chat</span>
            </Link>

            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden bg-[#080b12] border-b border-white/10 px-6 py-5 space-y-4 animate-slide-up-fade">
            <nav className="flex flex-col space-y-3 text-sm">
              <a href="#portals" onClick={() => setMobileNavOpen(false)} className="text-slate-300 hover:text-white">
                Campus Portals
              </a>
              <a href="#playground" onClick={() => setMobileNavOpen(false)} className="text-slate-300 hover:text-white">
                Live Playground
              </a>
              <a href="#slicer" onClick={() => setMobileNavOpen(false)} className="text-slate-300 hover:text-white">
                PDF Slicer
              </a>
              <a href="#pipeline" onClick={() => setMobileNavOpen(false)} className="text-slate-300 hover:text-white">
                Neural Pipeline
              </a>
              <a href="#features" onClick={() => setMobileNavOpen(false)} className="text-slate-300 hover:text-white">
                Features
              </a>
              <a href="#faq" onClick={() => setMobileNavOpen(false)} className="text-slate-300 hover:text-white">
                FAQ
              </a>
            </nav>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                href="/faculty/login"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-purple-600/10 text-purple-300 border border-purple-500/30"
              >
                <GraduationCap className="w-4 h-4 text-purple-400" />
                Access Faculty Portal
              </Link>
              <Link
                href="/hod/login"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600/10 text-blue-300 border border-blue-500/30"
              >
                <Scale className="w-4 h-4 text-blue-400" />
                Access HOD Portal
              </Link>
              <Link
                href="/chat"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white"
              >
                <MessageSquare className="w-4 h-4" />
                Launch Student AI Chat
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16 flex flex-col items-center">
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 2. HERO SECTION WITH ANIMATED FLOATING CHIPS & GLOW                 */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section className="w-full text-center flex flex-col items-center space-y-8 max-w-5xl pt-4 pb-14 relative">
          {/* Floating Capability Badge Left */}
          <div className="hidden lg:flex items-center gap-2 absolute top-12 left-0 p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 backdrop-blur-xl shadow-2xl animate-float text-xs text-cyan-300 font-mono">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>⚡ Sub-35ms Hybrid Vector Search</span>
          </div>

          {/* Floating Capability Badge Right */}
          <div className="hidden lg:flex items-center gap-2 absolute top-12 right-0 p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-xl shadow-2xl animate-float-delayed text-xs text-emerald-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>🛡️ 100% Policy Grounded (Zero Hallucination)</span>
          </div>

          {/* Top Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300 backdrop-blur-md shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Next-Gen Smart University Multi-Agent Cognitive Platform</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </div>

          {/* Hero Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.12]">
            Autonomous Campus Intelligence. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent animate-gradientShift">
              Zero Hallucinations. Instant Decisions.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-xl max-w-3xl leading-relaxed font-normal">
            Ground-truth academic intelligence for university students, faculty, and department heads. Retrieve syllabi, slice PDF slides on demand, balance faculty workloads, and govern academic policies with verifiable provenance.
          </p>

          {/* 3 Core Portals Quick-Launch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 w-full max-w-4xl" id="portals">
            {/* Student Card */}
            <Link
              href="/chat"
              className="group p-5 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 flex flex-col justify-between text-left hover:-translate-y-1.5"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Student AI Chat
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Discover prerequisites, course schedules, and download on-demand PDF page slice extractions.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                <span>Launch Chat</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Faculty Card */}
            <Link
              href="/faculty/login"
              className="group p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900/60 border border-purple-500/30 hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex flex-col justify-between text-left hover:-translate-y-1.5"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Faculty Portal
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload course syllabi into vector RAG, view weekly teaching timetables, and inspect seating layouts.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                <span>Faculty Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* HOD Card */}
            <Link
              href="/hod/login"
              className="group p-5 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900/60 border border-blue-500/30 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex flex-col justify-between text-left hover:-translate-y-1.5"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                  HOD Command Center
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  7-Dimension department health score, faculty workload balancing, at-risk radar, and Approval Center.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                <span>HOD Governance</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 text-xs text-slate-300 border-t border-white/[0.08] w-full max-w-4xl mt-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Vector RAG Grounding</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Sub-40ms P99 Latency</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Headless PDF Slicing</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Immutable Audit Ledger</span>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 3. INTERACTIVE LIVE PLAYGROUND WITH AGENT REASONING STREAM          */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section id="playground" className="w-full py-16 scroll-mt-24 border-t border-white/[0.06]">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5" />
              Live Cognitive Playground & Reasoning Engine
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Test Real University Queries in Real-Time
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Click any question below or type your own to watch our multi-stage agent reasoning, vector scoring, and sub-second execution.
            </p>
          </div>

          {/* Interactive Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {DEMO_PRESETS.map((preset) => {
              const isSelected = selectedDemo.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedDemo(preset);
                    runInferenceSimulation(preset);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-600/30 scale-105"
                      : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Simulated Chat Interface Card */}
          <div className="w-full max-w-4xl mx-auto rounded-3xl bg-[#080b13] border border-slate-800 shadow-2xl overflow-hidden relative backdrop-blur-2xl">
            {/* Top Terminal Bar */}
            <div className="px-5 py-3.5 bg-[#0e1320] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-400 flex items-center gap-2">
                  <span>Routing Agent:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                    {selectedDemo.routedNode}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> {selectedDemo.latency}
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {selectedDemo.confidence} Grounded
                </span>
                <button
                  onClick={() => runInferenceSimulation(selectedDemo)}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Re-run
                </button>
              </div>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* User Prompt */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                  You
                </div>
                <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs sm:text-sm text-slate-200 font-medium">
                  <p>{selectedDemo.query}</p>
                </div>
              </div>

              {/* Dynamic Agent Multi-Stage Reasoning Visualizer */}
              {isReasoning && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
                    <span className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 animate-spin text-indigo-400" />
                      Multi-Agent Neural Reasoning in Progress...
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">
                      Step {reasoningStepIndex + 1} / {selectedDemo.reasoningSteps.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    {selectedDemo.reasoningSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 transition-opacity ${
                          idx <= reasoningStepIndex ? "text-slate-200 opacity-100" : "text-slate-600 opacity-40"
                        }`}
                      >
                        {idx < reasoningStepIndex ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : idx === reasoningStepIndex ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-800" />
                        )}
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Grounded Response */}
              {!isReasoning && (
                <div className="flex items-start gap-3 sm:gap-4 animate-slide-up-fade">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-[#101524] border border-indigo-500/20 rounded-2xl rounded-tl-none p-5 text-xs sm:text-sm text-slate-200 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <span className="text-[11px] font-mono text-indigo-400 flex items-center gap-1.5 truncate">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Source: {selectedDemo.source}</span>
                      </span>
                      <button
                        onClick={handleCopy}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors shrink-0 ml-2"
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    <div className="text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                      {typedText}
                      {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse" />}
                    </div>

                    {/* Render Download Card for Page Slice Presets */}
                    {selectedDemo.hasDownload && selectedDemo.downloadCard && (
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {selectedDemo.downloadCard.fileName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Pages {selectedDemo.downloadCard.pages} · {selectedDemo.downloadCard.size} · ID: {selectedDemo.downloadCard.artifactId}
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/chat"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/30 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Slice
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Interaction Bar */}
            <div className="px-6 py-4 bg-[#0b0f1a] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                PostgreSQL & Qdrant Vector Store Grounded
              </span>
              <Link
                href="/chat"
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                Open Full Student Chat Interface <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 4. INTERACTIVE ON-DEMAND PDF SLICER SIMULATOR                       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section id="slicer" className="w-full py-16 scroll-mt-24 border-t border-white/[0.06]">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/70 to-slate-950 border border-cyan-500/30 p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            <div className="text-center mb-8 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
                <Scissors className="w-3.5 h-3.5" />
                Interactive PDF Slice Engine
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Experience Headless Sub-Second PDF Slicing
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Select your start and end pages from the 48-page lecture deck and trigger a real-time binary byte slice extraction.
              </p>
            </div>

            {/* Interactive Slicer Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Start Page:</span>
                  <span className="text-cyan-400 font-mono font-bold text-sm">Page {sliceStartPage}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="48"
                  value={sliceStartPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSliceStartPage(val);
                    if (val > sliceEndPage) setSliceEndPage(val);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>End Page:</span>
                  <span className="text-cyan-400 font-mono font-bold text-sm">Page {sliceEndPage}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="48"
                  value={sliceEndPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSliceEndPage(val);
                    if (val < sliceStartPage) setSliceStartPage(val);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Simulated Document Pages Grid with Cutting Laser Beam */}
            <div className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 mb-6 overflow-hidden">
              {isSlicingLaser && (
                <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center">
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" />
                  <span className="text-[10px] font-mono text-cyan-300 text-center mt-2 bg-black/60 py-0.5">
                    ⚡ Headless PDF Slicer: Isolating byte range 0x{sliceStartPage * 1024}-0x{sliceEndPage * 1024}...
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 flex-wrap">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((pg) => {
                  const isIncluded = pg >= sliceStartPage && pg <= sliceEndPage;
                  return (
                    <div
                      key={pg}
                      className={`w-14 h-18 rounded-lg p-2 flex flex-col justify-between text-center transition-all duration-300 border ${
                        isIncluded
                          ? "bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105"
                          : "bg-slate-950 border-slate-800 opacity-40"
                      }`}
                    >
                      <div className="w-full h-1 bg-slate-700 rounded" />
                      <span className="text-[10px] font-mono font-bold text-white">p.{pg}</span>
                      <div className="w-full h-1 bg-slate-700 rounded" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trigger Button & Download Result */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleTriggerLaserSlice}
                disabled={isSlicingLaser}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Scissors className="w-4 h-4" />
                {isSlicingLaser ? "Executing Laser Slicing..." : "Execute Headless Slice"}
              </button>

              {sliceGenerated && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs animate-slide-up-fade">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    Successfully sliced {sliceEndPage - sliceStartPage + 1} pages (Pages {sliceStartPage}–{sliceEndPage}) in 38ms!
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 5. ANIMATED COGNITIVE DATAFLOW PIPELINE                            */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section id="pipeline" className="w-full py-16 scroll-mt-24 border-t border-white/[0.06]">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-2">
              <Cpu className="w-3.5 h-3.5" />
              Cognitive Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How the Multi-Agent Neural Kernel Works
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Real-time query decomposition, pre-retrieval access control, and hybrid fusion retrieval
            </p>
          </div>

          {/* 4 Pipeline Stages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div
              className={`p-6 rounded-3xl border transition-all duration-300 relative backdrop-blur-xl ${
                activePipelineStep === 1
                  ? "bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  Step 01
                </span>
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">User Natural Query</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intent classification & goal recognition engine decomposes student or faculty query into structured sub-tasks.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-6 rounded-3xl border transition-all duration-300 relative backdrop-blur-xl ${
                activePipelineStep === 2
                  ? "bg-cyan-950/40 border-cyan-500 shadow-xl shadow-cyan-500/20 scale-[1.02]"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  Step 02
                </span>
                <Network className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Complexity Router</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                LangGraph state machine evaluates tenant RBAC visibility (Private, Faculty, Department, University) and route path.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-6 rounded-3xl border transition-all duration-300 relative backdrop-blur-xl ${
                activePipelineStep === 3
                  ? "bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Step 03
                </span>
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Hybrid Vector & BM25 Fusion</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reciprocal rank fusion merges dense Qdrant cosine vectors with sparse BM25 keyword tokens and cross-encoders.
              </p>
            </div>

            {/* Step 4 */}
            <div
              className={`p-6 rounded-3xl border transition-all duration-300 relative backdrop-blur-xl ${
                activePipelineStep === 4
                  ? "bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-500/20 scale-[1.02]"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                  Step 04
                </span>
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Grounded Answer & Slices</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates exact citation citations or triggers headless PDF page extraction with sub-second delivery.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 6. ENTERPRISE BENTO GRID FEATURES                                   */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section id="features" className="w-full py-16 border-t border-white/[0.06] scroll-mt-24">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Enterprise Campus Rigor
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-3">
              Combines cutting-edge vector search, graph routing, and automated departmental governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Vector + Hybrid Search */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 group hover:-translate-y-1 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hybrid Vector & BM25 Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combines dense semantic embeddings in Qdrant with sparse BM25 keyword matching and reciprocal rank fusion for 99.8% precision.
              </p>
            </div>

            {/* Card 2: Headless PDF Slice Engine */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group hover:-translate-y-1 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Headless PDF Page Slicing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extract arbitrary page ranges or individual slides on demand using native binary streams, saving bandwidth and student study time.
              </p>
            </div>

            {/* Card 3: Role-Based Access Isolation */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">HOD Approval Center & HITL</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Human-in-the-Loop decision governance for attendance condonations, faculty load reallocations, and policy exceptions.
              </p>
            </div>

            {/* Card 4: Anti-Malpractice Seating */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group hover:-translate-y-1 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Zig-Zag Exam Seating Matrix</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated anti-malpractice exam seating generator interleaves students from different courses to guarantee zero adjacent overlaps.
              </p>
            </div>

            {/* Card 5: 7-Dimension Department Health */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 group hover:-translate-y-1 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">7-Dimension Department Health</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Weighted scoring engine across Academics, Attendance, Faculty Workload, Examinations, Research, Documents, and Data Integrity.
              </p>
            </div>

            {/* Card 6: Immutable Audit Ledger */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 group hover:-translate-y-1 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Binary className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Immutable Governance Audit Trail</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every mutation, faculty appointment, attendance condonation, and section edit logs before/after snapshots and policy citations.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 7. FAQ SECTION                                                     */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section id="faq" className="w-full py-16 border-t border-white/[0.06] scroll-mt-24 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">Everything you need to know about our university RAG & governance platform.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-all duration-200 backdrop-blur-xl"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-sm hover:text-indigo-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-indigo-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 8. HIGH-IMPACT BOTTOM CTA                                          */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section className="w-full py-16 text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-cyan-950/50 border border-indigo-500/30 max-w-4xl mx-auto flex flex-col items-center space-y-6 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to Experience Smart University Intelligence?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-lg">
              Launch the live student chat, manage courses in the faculty portal, or govern your department from the HOD command center.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:scale-105"
              >
                Start Student Chat
              </Link>
              <Link
                href="/faculty/login"
                className="px-8 py-3.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 font-bold text-xs transition-all duration-200"
              >
                Faculty Portal
              </Link>
              <Link
                href="/hod/login"
                className="px-8 py-3.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 font-bold text-xs transition-all duration-200"
              >
                HOD Operations Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. FOOTER DIRECTORY                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#04060a] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NexusIQ Cognitive Enterprise RAG. Smart University Platform.</p>
          <div className="flex items-center gap-6">
            <Link href="/chat" className="hover:text-slate-300 transition-colors">
              Chat Assistant
            </Link>
            <Link href="/faculty/login" className="hover:text-slate-300 transition-colors">
              Faculty Portal
            </Link>
            <Link href="/hod/login" className="hover:text-slate-300 transition-colors">
              HOD Command Center
            </Link>
            <Link href="/hod/approvals" className="hover:text-slate-300 transition-colors">
              Approval Center
            </Link>
            <Link href="/hod/audit" className="hover:text-slate-300 transition-colors">
              Audit Trail
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
