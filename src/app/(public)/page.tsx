import Link from "next/link";
import { 
  ArrowRight, 
  BrainCircuit, 
  ChevronDown, 
  FileText, 
  MessageSquare, 
  Moon, 
  Network, 
  Play, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  TrendingUp, 
  Users 
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 font-sans overflow-x-hidden">
      
      {/* Navbar */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-white/5 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-10">
          <Link className="flex items-center space-x-2 group" href="#">
            <div className="text-indigo-500">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">AI Knowledge Hub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-medium text-slate-300 hover:text-white transition-colors" href="#features">Features</Link>
            <Link className="text-sm font-medium text-slate-300 hover:text-white transition-colors" href="/pricing">Pricing</Link>
            <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              Solutions <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
            <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              Resources <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
            <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              Company <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-slate-400">
            <Sun className="w-4 h-4" />
          </button>
          <Link className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block" href="/login">
            Log in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "rounded-lg px-5 bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 border-0")}>
            Sign up free
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Hero Section */}
        <section className="w-full py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left Content */}
          <div className="flex-1 flex flex-col items-start text-left space-y-8 max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-indigo-500/30 px-3 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-300">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Your AI-Powered Knowledge Assistant
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
              All Your Knowledge.<br />
              One <span className="text-indigo-400">Intelligent</span> Hub.
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl">
              Store, organize, and discover knowledge across documents, conversations, and your team. Get AI-powered insights and find answers in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-0 text-base shadow-lg shadow-indigo-600/20")}>
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="#" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-14 px-8 font-medium rounded-xl border-slate-700 hover:bg-slate-800 text-white transition-colors text-base")}>
                <Play className="mr-2 h-5 w-5" /> Watch Demo
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-400 pt-4">
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-slate-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-slate-500" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-slate-500" /> Cancel anytime</span>
            </div>
          </div>

          {/* Right Visual (Abstract Layout) */}
          <div className="flex-1 w-full max-w-lg lg:max-w-xl relative aspect-square flex items-center justify-center">
             {/* Center Brain */}
             <div className="relative z-10 w-32 h-32 bg-indigo-900/40 rounded-2xl border border-indigo-500/50 flex items-center justify-center rotate-12 shadow-2xl shadow-indigo-500/20 backdrop-blur-sm">
                <BrainCircuit className="w-16 h-16 text-indigo-400 -rotate-12" />
             </div>
             
             {/* Orbiting Nodes */}
             <div className="absolute top-10 left-10 w-16 h-16 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-slate-300" />
             </div>
             <div className="absolute top-8 right-12 w-16 h-16 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shadow-lg">
                <Search className="w-6 h-6 text-slate-300" />
             </div>
             <div className="absolute bottom-32 left-4 w-16 h-16 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shadow-lg">
                <Network className="w-6 h-6 text-slate-300" />
             </div>
             <div className="absolute bottom-12 right-20 w-16 h-16 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-slate-300" />
             </div>
             <div className="absolute top-1/2 -right-4 w-16 h-16 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-slate-300" />
             </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 flex flex-col items-center border-t border-white/5">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16 text-center">
            Everything you need to work smarter
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {/* Cards */}
            {[
              { icon: Search, title: "AI-Powered Search", desc: "Find anything across your knowledge base instantly with natural language." },
              { icon: Network, title: "Knowledge Graph", desc: "Visualize connections between concepts and discover hidden insights." },
              { icon: MessageSquare, title: "AI Chat Assistant", desc: "Ask questions and get accurate answers with source references." },
              { icon: Users, title: "Team Collaboration", desc: "Share knowledge, work together, and stay aligned with your team." },
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Your data is protected with end-to-end encryption and advanced security." },
              { icon: TrendingUp, title: "Powerful Insights", desc: "Get AI-driven insights and analytics to make better decisions faster." },
            ].map((feature, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col space-y-4 hover:border-indigo-500/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full py-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 lg:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl"><Users className="w-6 h-6 text-indigo-400" /></div>
              <div>
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-slate-400 mt-1">Happy Users</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl"><FileText className="w-6 h-6 text-indigo-400" /></div>
              <div>
                <div className="text-3xl font-bold text-white">2M+</div>
                <div className="text-sm text-slate-400 mt-1">Documents Indexed</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl"><MessageSquare className="w-6 h-6 text-indigo-400" /></div>
              <div>
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-sm text-slate-400 mt-1">Queries per Day</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl"><ShieldCheck className="w-6 h-6 text-indigo-400" /></div>
              <div>
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-sm text-slate-400 mt-1">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Cloud */}
        <section className="w-full py-16 flex flex-col items-center">
          <p className="text-sm text-slate-400 mb-8 font-medium">Trusted by teams at innovative companies worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-70">
            <div className="text-xl font-bold text-white flex items-center gap-2">Microsoft</div>
            <div className="text-xl font-bold text-white tracking-tighter">Google</div>
            <div className="text-xl font-bold text-white">airbnb</div>
            <div className="text-xl font-bold text-white">Spotify</div>
            <div className="text-xl font-bold text-white">Notion</div>
            <div className="text-xl font-bold text-white">Dropbox</div>
          </div>
        </section>
      </main>
    </div>
  );
}
