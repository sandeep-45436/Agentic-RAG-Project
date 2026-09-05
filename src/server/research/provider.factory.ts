/**
 * Provider factory — returns the active ResearchNotebookProvider based on
 * the RESEARCH_PROVIDER environment variable.
 *
 *   RESEARCH_PROVIDER=mock    → MockResearchProvider   (default)
 *   RESEARCH_PROVIDER=gemini  → GeminiNotebookProvider
 *
 * Adding a new provider later requires only:
 *   1. Implementing ResearchNotebookProvider
 *   2. Adding a case here
 * No other NexusIQ code needs to change.
 */

import type { ResearchNotebookProvider } from "./provider.interface";

let cachedProvider: ResearchNotebookProvider | null = null;

export function getResearchProvider(): ResearchNotebookProvider {
  if (cachedProvider) return cachedProvider;

  const defaultMode = process.env.GEMINI_API_KEY ? "gemini" : "mock";
  const mode = (process.env.RESEARCH_PROVIDER ?? defaultMode).toLowerCase();

  if (mode === "gemini") {
    const { GeminiResearchProvider } = require("./gemini-notebook.provider");
    cachedProvider = new GeminiResearchProvider();
    console.log("[NexusIQ Research Workspace] Provider: gemini (Gemini 2.5 Flash / Free-tier Authorized RAG Synthesis)");
  } else {
    const { MockResearchProvider } = require("./mock-research.provider");
    cachedProvider = new MockResearchProvider();
    console.log("[ResearchBridge] Provider: mock (Development mode — no real external calls)");
  }

  return cachedProvider!;
}

/** Returns the provider name and development mode status for UI display. */
export function getProviderMeta(): { providerName: string; isDevelopmentMode: boolean } {
  const p = getResearchProvider();
  return { providerName: p.providerName, isDevelopmentMode: p.isDevelopmentMode };
}
