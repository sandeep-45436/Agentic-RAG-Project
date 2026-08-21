/**
 * Centralized Model Configuration — Single Source of Truth
 *
 * All model identifiers are environment-driven with sensible defaults.
 * LLMs are interchangeable infrastructure underneath the Cognitive Kernel,
 * not part of the application architecture.
 *
 * Naming: "Meta Llama / Multi-Provider LLM Integration"
 * Llama 3.3 models are Meta Llama models, NOT "Muse" models.
 *
 * Default reasoning model: openai/gpt-4o-mini (benchmark Llama against it
 * before switching). Default lightweight: meta-llama/llama-3.3-8b-instruct.
 */

export const ModelConfig = {
  // ── Reasoning Models (planning, complex synthesis, final response) ──
  // Keep openai/gpt-4o-mini as baseline; benchmark Llama 70B before switching
  reasoning: process.env.MODEL_REASONING || "openai/gpt-4o-mini",

  // ── Lightweight Models (intent classification, routing, query rewrite) ──
  // 8B model for fast, cheap classification — NOT the same 70B as reasoning
  lightweight: process.env.MODEL_LIGHTWEIGHT || "meta-llama/llama-3.3-8b-instruct",

  // ── Evaluation Model (LLM-as-a-judge, async background) ──
  evaluation: process.env.MODEL_EVALUATION || "google/gemini-2.5-flash",

  // ── Multimodal Model (PDF layout parsing, OCR, charts) ──
  multimodal: process.env.MODEL_MULTIMODAL || "google/gemini-2.5-flash",

  // ── Multimodal Model (direct Google provider, non-OpenRouter variant) ──
  multimodalDirect: process.env.MODEL_MULTIMODAL_DIRECT || "gemini-2.5-flash",

  // ── Embedding Model ──
  embedding: process.env.MODEL_EMBEDDING || "openai/text-embedding-3-small",

  // ── Streaming/Response Model (final user-facing response) ──
  streaming: process.env.MODEL_STREAMING || "openai/gpt-4o-mini",

  // ── Failover Chain (tried in order on primary failure) ──
  failoverChain: (
    process.env.MODEL_FAILOVER_CHAIN ||
    "openai/gpt-4o-mini,meta-llama/llama-3.3-70b-instruct,anthropic/claude-3-5-sonnet,google/gemini-2.5-flash"
  )
    .split(",")
    .map((s) => s.trim()),

  // ── Embedding Failover Chain ──
  embeddingFailoverChain: (
    process.env.MODEL_EMBEDDING_FAILOVER_CHAIN ||
    "openai/text-embedding-3-small,openai/text-embedding-ada-002"
  )
    .split(",")
    .map((s) => s.trim()),

  // ── Provider Base URL ──
  baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
} as const;
