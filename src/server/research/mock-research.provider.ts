/**
 * MockResearchProvider — used when RESEARCH_PROVIDER=mock (or unset).
 *
 * Makes NO external calls. Every operation returns simulated success responses.
 * The UI explicitly shows "Provider: Mock  Status: Development" so there is
 * no ambiguity about whether this is a real Google connection.
 *
 * Use this for:
 *   - local development
 *   - CI pipelines without Google credentials
 *   - demo deployments
 */

import { v4 as uuidv4 } from "uuid";
import type {
  ResearchNotebookProvider,
  ProviderNotebook,
  ProviderSource,
  ProviderSyncResult,
} from "./provider.interface";

export class MockResearchProvider implements ResearchNotebookProvider {
  readonly providerName = "mock";
  readonly isDevelopmentMode = true;

  async createNotebook(params: { title: string; description?: string }): Promise<ProviderNotebook> {
    const id = `mock-notebook-${uuidv4()}`;
    console.log(`[MockResearchProvider] createNotebook: "${params.title}" → ${id}`);
    return {
      providerNotebookId: id,
      webUrl: `https://mock-research.dev/notebooks/${id}`,
      providerName: this.providerName,
      title: params.title,
      createdAt: new Date().toISOString(),
    };
  }

  async getNotebook(providerNotebookId: string): Promise<ProviderNotebook | null> {
    console.log(`[MockResearchProvider] getNotebook: ${providerNotebookId}`);
    return {
      providerNotebookId,
      webUrl: `https://mock-research.dev/notebooks/${providerNotebookId}`,
      providerName: this.providerName,
      title: "Mock Notebook",
      createdAt: new Date().toISOString(),
    };
  }

  async addSources(
    providerNotebookId: string,
    sources: Array<{
      documentId: string;
      fileName: string;
      textContent: string;
      contentHash: string;
    }>
  ): Promise<ProviderSyncResult> {
    console.log(
      `[MockResearchProvider] addSources to ${providerNotebookId}: ${sources.map((s) => s.fileName).join(", ")}`
    );

    const succeeded: ProviderSource[] = sources.map((src) => ({
      providerSourceId: `mock-src-${uuidv4()}`,
      providerResourceName: `projects/mock/locations/us/notebooks/${providerNotebookId}/sources/mock-src-${uuidv4()}`,
      contentHash: src.contentHash,
      status: "ACTIVE" as const,
    }));

    return { succeeded, failed: [] };
  }

  async removeSource(
    providerNotebookId: string,
    providerSourceId: string
  ): Promise<{ success: boolean; errorMessage?: string }> {
    console.log(`[MockResearchProvider] removeSource ${providerSourceId} from ${providerNotebookId}`);
    return { success: true };
  }

  async deleteNotebook(
    providerNotebookId: string
  ): Promise<{ success: boolean; errorMessage?: string }> {
    console.log(`[MockResearchProvider] deleteNotebook: ${providerNotebookId}`);
    return { success: true };
  }
}
