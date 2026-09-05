/**
 * ResearchNotebookProvider — provider abstraction for the NexusIQ Research Bridge.
 *
 * All external research notebook operations go through this interface.
 * NexusIQ core code only ever references this interface, never a concrete provider.
 *
 * Current implementations:
 *   MockResearchProvider      — development / no credentials
 *   GeminiNotebookProvider    — Google Notebook Enterprise (v1alpha, Pre-GA)
 *
 * IMPORTANT: Do not expose provider-specific response shapes beyond this layer.
 */

// ── Domain types returned to NexusIQ consumers ────────────────────────────────

export interface ProviderNotebook {
  /** Provider-assigned notebook ID / resource name */
  providerNotebookId: string;
  /** Human-readable URL to open the notebook in the provider's UI */
  webUrl?: string;
  /** Provider name for display: "mock" | "gemini" */
  providerName: string;
  title: string;
  createdAt: string; // ISO-8601
}

export interface ProviderSource {
  /** Provider-assigned source ID */
  providerSourceId: string;
  /** Full resource name as assigned by the provider */
  providerResourceName?: string;
  /** Stable hash of the content submitted — used for stale detection */
  contentHash?: string;
  status: "PENDING" | "ACTIVE" | "FAILED";
  errorMessage?: string;
}

export interface ProviderSyncResult {
  succeeded: ProviderSource[];
  failed: Array<{ documentId: string; errorMessage: string }>;
}

// ── Provider interface ─────────────────────────────────────────────────────────

export interface ResearchNotebookProvider {
  /**
   * Human-readable provider identifier shown in the UI.
   * Must be "mock" for MockResearchProvider or "gemini" for GeminiNotebookProvider.
   */
  readonly providerName: string;

  /**
   * Whether this provider is operating in development mode (no real external calls).
   * The UI must display a clear "Development" badge when true.
   */
  readonly isDevelopmentMode: boolean;

  /** Create a new empty notebook. Returns the provider-assigned notebook record. */
  createNotebook(params: {
    title: string;
    description?: string;
  }): Promise<ProviderNotebook>;

  /** Retrieve a notebook by its provider-assigned ID. */
  getNotebook(providerNotebookId: string): Promise<ProviderNotebook | null>;

  /**
   * Add one or more document sources to a notebook.
   * Each source is identified by a NexusIQ documentId and carries the extracted
   * text content (NexusIQ is responsible for authorization before calling this).
   */
  addSources(
    providerNotebookId: string,
    sources: Array<{
      documentId: string;
      fileName: string;
      /** Extracted plain-text content ready for ingestion */
      textContent: string;
      /** SHA-256 of textContent — used for stale detection */
      contentHash: string;
    }>
  ): Promise<ProviderSyncResult>;

  /** Remove a single source from a notebook. */
  removeSource(
    providerNotebookId: string,
    providerSourceId: string
  ): Promise<{ success: boolean; errorMessage?: string }>;

  /** Delete the entire notebook. */
  deleteNotebook(
    providerNotebookId: string
  ): Promise<{ success: boolean; errorMessage?: string }>;

  /** Optional multi-document synthesis (Study guide, FAQ, Podcast dialogue, Summary) */
  synthesizeNotebook?(params: {
    sources: Array<{ fileName: string; textContent: string }>;
    mode?: "summary" | "faq" | "podcast" | "study_guide";
    customPrompt?: string;
  }): Promise<{ markdown: string; title: string }>;
}
