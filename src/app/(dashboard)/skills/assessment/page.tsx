"use client";
import { AnimatedBackground } from "@/components/animated-background";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Code2,
  Sparkles,
  Trophy,
  Send,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SkillAssessmentArenaPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [codeAnswer, setCodeAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);

  useEffect(() => {
    fetch("/api/skills/assessment")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.questions?.length > 0) {
          setQuestions(d.questions);
          setTimeLeft(d.questions[0].timeLimitSeconds || 90);
          if (d.questions[0].codeStarter) {
            setCodeAnswer(d.questions[0].codeStarter);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (result || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const currentQ = questions[currentIndex];

  const handleSubmit = async () => {
    if (!currentQ || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/skills/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedOptionIndex: selectedOption !== null ? selectedOption : undefined,
          codeAnswer: currentQ.type === "code" ? codeAnswer : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        if (data.result.correct) {
          setScore((prev) => prev + data.result.pointsEarned);
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setResult(null);
      setTimeLeft(questions[nextIdx].timeLimitSeconds || 90);
      setCodeAnswer(questions[nextIdx].codeStarter || "");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-xs text-slate-500">Loading Assessment Arena Engine...</p>
      </div>
    );
  }

  return (
    <AnimatedBackground>
      <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Top Breadcrumb & Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/skills"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Skill Center
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 text-xs text-slate-700">
            <Clock className={`h-4 w-4 ${timeLeft < 20 ? "text-rose-400 animate-pulse" : "text-cyan-400"}`} />
            <span className="font-mono font-bold">{timeLeft}s remaining</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300">
            <Trophy className="h-4 w-4" />
            <span className="font-mono font-bold">Session Score: {score} pts</span>
          </div>
        </div>
      </div>

      {/* Main Assessment Card */}
      {currentQ ? (
        <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200 p-6 lg:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Question Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-xs">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">
                {currentQ.difficulty} Difficulty
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                Worth {currentQ.points} Points
              </span>
            </div>

            <span className="text-xs font-semibold text-indigo-400">
              {currentQ.type === "code" ? "Coding Challenge" : "Multiple Choice Architecture"}
            </span>
          </div>

          {/* Title and Prompt */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {currentQ.title}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed font-sans">
              {currentQ.prompt}
            </p>
          </div>

          {/* Options (if multiple choice) */}
          {currentQ.type === "multiple_choice" && currentQ.options && (
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => !result && setSelectedOption(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all text-xs flex items-start gap-3.5 ${
                    selectedOption === idx
                      ? "bg-cyan-500/10 border-cyan-500/50 text-white shadow-lg ring-1 ring-cyan-500/30"
                      : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-white/20"
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      selectedOption === idx
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed mt-0.5">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {/* Code Editor (if code type) */}
          {currentQ.type === "code" && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1.5 font-mono">
                  <Code2 className="h-4 w-4 text-cyan-400" /> TypeScript Solution Buffer
                </span>
                <span className="text-[10px] text-slate-500">Auto-tokenized</span>
              </div>
              <textarea
                value={codeAnswer}
                onChange={(e) => setCodeAnswer(e.target.value)}
                disabled={Boolean(result)}
                rows={8}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50 leading-relaxed shadow-inner"
              />
            </div>
          )}

          {/* Submission Result Feedback Box */}
          {result && (
            <div
              className={`p-4 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                result.correct
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/20 border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {result.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                )}
                <span className="font-bold text-sm">
                  {result.correct ? "Verification Passed! (+ " + result.pointsEarned + " pts)" : "Incorrect Solution"}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed pl-7">{result.feedback}</p>
              {result.radarImpact && (
                <p className="text-[11px] font-mono text-cyan-400 pl-7">
                  Skill Radar Impact: {result.radarImpact.dimension} ({result.radarImpact.delta > 0 ? "+" : ""}{result.radarImpact.delta} pts)
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
            <span className="text-xs text-slate-500">
              Instant evaluation with deterministic verification engine
            </span>

            <div className="flex items-center gap-3">
              {!result ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (currentQ.type === "multiple_choice" && selectedOption === null)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl px-5 py-2.5 shadow-lg shadow-cyan-500/20"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                  Submit Solution
                </Button>
              ) : (
                currentIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl px-5 py-2.5"
                  >
                    Next Question →
                  </Button>
                ) : (
                  <Link href="/skills">
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl px-5 py-2.5">
                      Finish Assessment Arena
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No questions available in this track.</div>
      )}
    </div>
    </AnimatedBackground>
  );
}
