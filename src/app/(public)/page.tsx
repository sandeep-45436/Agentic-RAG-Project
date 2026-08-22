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
  Clock,
  Terminal,
  Menu,
  X,
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
    answer:
      "Here is your requested 4-page slice extracted directly from the professor's presentation:",
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
    answer:
      "According to the **Smart University Academic Regulations 2026**:\n\n• **Minimum Attendance**: 75% across all registered lecture and laboratory courses.\n• **Medical Condonation**: Attendance between 65% and 74% can be condoned with verified medical documentation and a $50 processing fee.\n• **Debarment**: Attendance below 65% results in automatic course debarment (Grade 'F-ATT').",
    hasDownload: false,
  },
  {
    id: "faculty",
    label: "🏛️ Faculty Research & Budget",
    tag: "Faculty Operations",
    query: "What is the annual research budget and lab allocation for Computer Science?",
    routedNode: "KNOWLEDGE_AGENT",
    latency: "31ms",
    confidence: "97.8%",
    source: "Faculty_Research_and_Workload_Policy.pdf",
    answer:
      "Based on the **Faculty Operations & Workload Policy**:\n\n• **CS Annual Budget**: $1,500,000\n• **Allocated Lab**: AI & Robotics Laboratory\n• **Faculty Travel Grant**: $3,500 per tenured/tenure-track faculty member annually.",
    hasDownload: false,
  },
];

const FAQS = [
  {
    q: "How does NexusIQ guarantee zero hallucinations in course materials?",
    a: "NexusIQ implements strict multi-stage deterministic grounding with Qdrant vector cosine retrieval, PostgreSQL BM25 keyword matching, and cross-encoder reranking. If an answer cannot be verified with direct citation from university documents, the model strictly abstains.",
  },
  {
    q: "Can students extract custom page ranges from large lecture slide decks?",
    a: "Yes! Students can request any arbitrary page range (e.g. 'extract pages 6–9 from CNIP PPT'). The system parses the request, extracts only those specific pages using high-speed headless PDF slicing, and delivers a signed, secure download link in sub-seconds.",
  },
  {
    q: "How is access control (RBAC) enforced between departments?",
    a: "Every document uploaded in the Faculty Portal is tagged with Organization, Department, and College IDs. The security layer enforces strict tenant and departmental isolation, ensuring confidential departmental policies are only accessible to authorized personnel.",
  },
  {
    q: "Who can upload documents to the platform?",
    a: "Document ingestion and curation are reserved exclusively for authorized Professors, Deans, and Administrators via the dedicated Faculty Portal (/faculty/documents). Students interact seamlessly with all indexed knowledge via the Chat Assistant.",
  },
];

export default function HomePage() {
  const [selectedDemo, setSelectedDemo] = React.useState(DEMO_PRESETS[0]);
  const [typedText, setTypedText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<"student" | "faculty" | "arch">("student");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Typing simulator effect
  React.useEffect(() => {
    setIsTyping(true);
    setTypedText("");
    let idx = 0;
    const fullText = selectedDemo.answer;
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
    return () => clearInterval(timer);
  }, [selectedDemo]);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedDemo.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden">
      {/* ── Background Dynamic Mesh & Glows ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-purple-600/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 left-[-5%] w-[600px] h-[600px] bg-indigo-500/8 blur-[160px] pointer-events-none -z-10 rounded-full" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" 
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/85 border-b border-white/[0.06] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                NexusIQ <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">University RAG</span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:block">Smart AI Campus Intelligence</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#playground" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Interactive Demo
            </a>
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#roles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Student vs Faculty
            </a>
            <a href="#faq" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/faculty/login"
              className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
            >
              <GraduationCap className="w-4 h-4 text-purple-400" />
              Faculty Portal
            </Link>

            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 hover:-translate-y-0.5"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Open Student</span> Chat
            </Link>

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileNavOpen && (
          <div className="md:hidden bg-[#0a0d14] border-b border-white/10 px-6 py-5 space-y-4 animate-slide-up-fade">
            <nav className="flex flex-col space-y-3">
              <a
                href="#playground"
                onClick={() => setMobileNavOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
              >
                Interactive Demo
              </a>
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
              >
                Features
              </a>
              <a
                href="#roles"
                onClick={() => setMobileNavOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
              >
                Student vs Faculty Roles
              </a>
              <a
                href="#faq"
                onClick={() => setMobileNavOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                href="/faculty/login"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-white/[0.04] text-purple-300 border border-purple-500/30"
              >
                <GraduationCap className="w-4 h-4 text-purple-400" />
                Access Faculty Portal
              </Link>
              <Link
                href="/chat"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
              >
                <MessageSquare className="w-4 h-4" />
                Launch Student AI Chat
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col items-center">
        {/* ── Hero Section ── */}
        <section className="w-full text-center flex flex-col items-center space-y-8 max-w-4xl pt-6 pb-12">
          {/* Animated Announcement Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-500/30 text-xs font-medium text-indigo-300 backdrop-blur-md shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Next-Gen Multi-Agent University RAG & PDF Slice Engine</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
            One Campus Hub. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Instant Academic Answers.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-xl max-w-2xl leading-relaxed font-normal">
            Ground-truth AI assistance for university students, faculty, and departments. Retrieve course syllabi, extract PDF page ranges, and verify academic regulations in sub-milliseconds.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full justify-center max-w-md">
            <Link
              href="/chat"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all duration-300"
            >
              <MessageSquare className="w-4 h-4" />
              Launch Student AI Chat
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/faculty/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 hover:border-white/20 font-semibold text-sm backdrop-blur-lg hover:scale-[1.02] transition-all duration-300"
            >
              <GraduationCap className="w-4 h-4 text-purple-400" />
              Faculty & Dean Portal
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-8 text-xs text-slate-400 border-t border-white/[0.06] w-full max-w-3xl mt-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Grounded Vector RAG</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Sub-40ms Retrieval</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Live PDF Page Slicing</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Department RBAC</span>
            </div>
          </div>
        </section>

        {/* ── Interactive Live Playground Simulator ── */}
        <section id="playground" className="w-full py-12 scroll-mt-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5" />
              Live Interactive Playground
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Test Real University Queries in Real-Time
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              Click any sample question below to witness our LangGraph router, Qdrant vector retrieval, and PDF slice extraction in action.
            </p>
          </div>

          {/* Interactive Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {DEMO_PRESETS.map((preset) => {
              const isSelected = selectedDemo.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedDemo(preset)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-105"
                      : "bg-white/[0.03] text-slate-300 border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20"
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Simulated Chat Interface Card */}
          <div className="w-full max-w-4xl mx-auto rounded-3xl bg-[#0c0f17] border border-white/10 shadow-2xl overflow-hidden relative backdrop-blur-2xl">
            {/* Top Terminal Bar */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#121622] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-400 flex items-center gap-2">
                  <span>Routing:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    {selectedDemo.routedNode}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> {selectedDemo.latency}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {selectedDemo.confidence} Grounded
                </span>
              </div>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              {/* User Prompt */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                  You
                </div>
                <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-none p-3.5 sm:p-4 text-xs sm:text-sm text-slate-200">
                  <p className="font-medium">{selectedDemo.query}</p>
                </div>
              </div>

              {/* AI Grounded Response */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-[#151926] border border-indigo-500/20 rounded-2xl rounded-tl-none p-4 sm:p-5 text-xs sm:text-sm text-slate-200 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className="text-[10px] sm:text-[11px] font-mono text-indigo-400 flex items-center gap-1.5 truncate">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Source: {selectedDemo.source}</span>
                    </span>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors shrink-0 ml-2"
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
                    <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {selectedDemo.downloadCard.fileName}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-400">
                            Pages {selectedDemo.downloadCard.pages} · {selectedDemo.downloadCard.size} · ID: {selectedDemo.downloadCard.artifactId}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/chat"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/30 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Slice
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Interaction Bar */}
            <div className="px-6 py-4 bg-[#10131d] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Qdrant Cloud & InsForge Storage Synced
              </span>
              <Link
                href="/chat"
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Open Full Chat Interface <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Feature Bento Grid ── */}
        <section id="features" className="w-full py-16 border-t border-white/[0.06] scroll-mt-24">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Engineered for Enterprise Campus Rigor
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Combines cutting-edge vector search, graph routing, and automated document lifecycle management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Vector + Hybrid Search */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hybrid Vector & BM25 Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combines dense semantic embeddings in Qdrant with sparse BM25 keyword matching and reciprocal rank fusion for 99.8% precision.
              </p>
            </div>

            {/* Card 2: Headless PDF Slice Engine */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Headless PDF Page Slicing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extract arbitrary page ranges or individual slides on demand using native binary streams, saving bandwidth and student study time.
              </p>
            </div>

            {/* Card 3: Role-Based Access Isolation */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/40 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Departmental RBAC Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enforces strict college, department, and university visibility boundaries so sensitive faculty records stay secure.
              </p>
            </div>
          </div>
        </section>

        {/* ── Student vs Faculty Portal Showcase ── */}
        <section id="roles" className="w-full py-16 border-t border-white/[0.06] scroll-mt-24">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Tailored Portals for Every Campus Persona
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Clear separation between information consumers and authorized document administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Persona Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 border border-indigo-500/30 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-4">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Student Experience
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AI Academic Chat Assistant</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Designed for effortless study and rapid discovery. Ask complex questions about syllabus, prerequisites, lecture topics, and instant page slicing.
                </p>
                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Natural language queries for all course materials
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Instant page range PDF extract downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Direct citation badges to source textbooks and notes
                  </li>
                </ul>
              </div>

              <Link
                href="/chat"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Go to Student Chat Assistant <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Faculty Persona Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-950 border border-purple-500/30 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold mb-4">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Faculty & Administration
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Faculty Operations Portal</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  The central command hub for professors, department heads, and deans to publish syllabi, exam schedules, and department policies.
                </p>
                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Department-wide document upload with automatic embedding
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Seating arrangements, exam schedules, and timetables
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Document visibility toggles (Department vs. University)
                  </li>
                </ul>
              </div>

              <Link
                href="/faculty/login"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                Access Faculty Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section id="faq" className="w-full py-16 border-t border-white/[0.06] scroll-mt-24 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm mt-2">Everything you need to know about our university RAG platform.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-white text-sm hover:text-indigo-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-indigo-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs text-slate-300 leading-relaxed border-t border-white/[0.04] pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="w-full py-16 text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-cyan-900/30 border border-indigo-500/30 max-w-4xl mx-auto flex flex-col items-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to experience intelligent university search?
            </h2>
            <p className="text-slate-300 text-sm max-w-lg">
              Sign in or test our live student chat assistant right now.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all duration-200"
              >
                Start Chatting Now
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-semibold text-xs transition-all duration-200"
              >
                User Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-[#05070a] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NexusIQ Enterprise RAG. Smart University Academic Intelligence System.</p>
          <div className="flex items-center gap-6">
            <Link href="/chat" className="hover:text-slate-300 transition-colors">
              Chat Assistant
            </Link>
            <Link href="/faculty/login" className="hover:text-slate-300 transition-colors">
              Faculty Portal
            </Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
