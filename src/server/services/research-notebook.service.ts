/**
 * ResearchNotebookService — domain service for the NexusIQ Research Bridge.
 *
 * Orchestration flow:
 *   1. Authenticate + resolve access context via existing DocumentAccessPolicy
 *   2. Authorize every document through existing DocumentAccessPolicy
 *   3. Extract plain text from authorized documents
 *   4. Delegate to the active ResearchNotebookProvider (mock or gemini)
 *   5. Track sync state in ResearchNotebook / ResearchNotebookSource / ResearchSyncJob
 *   6. Emit audit events via existing AuditService
 *
 * What this service NEVER does:
 *   - Accept organizationId / departmentId from external callers
 *   - Sync student operational data (marks, attendance, financial records)
 *   - Hard-code provider logic
 *   - Create duplicate auth or tool runtime infrastructure
 */

import crypto from "crypto";
import { db } from "@/server/db/prisma";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import { AuditService } from "@/server/services/audit";
import { getResearchProvider, getProviderMeta } from "@/server/research/provider.factory";

// ── Forbidden document categories — never synced externally ───────────────────
const FORBIDDEN_CONTENT_PATTERNS = [
  /student.*mark/i,
  /attendance.*record/i,
  /financial.*record/i,
  /tuition.*balance/i,
  /disciplinary/i,
  /academic.*probation/i,
];

const FORBIDDEN_VISIBILITY_FOR_EXTERNAL_SYNC: string[] = [
  // PRIVATE docs are never externally synced — only the owner benefits from them
  // being in their own workspace, not an org-level shared notebook
];

// ── Utility types ─────────────────────────────────────────────────────────────

export interface ResolvedUserContext {
  userId: string;
  organizationId: string;
  departmentId: string | null;
  collegeId: string | null;
  userRole: string;
}

export interface NotebookSummary {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  provider: string;
  isDevelopmentMode: boolean;
  status: string;
  providerWebUrl: string | null;
  totalSources: number;
  staleSources: number;
  createdAt: string;
  updatedAt: string;
}

export interface SourceSummary {
  id: string;
  documentId: string;
  fileName: string;
  status: string;
  isStale: boolean;
  currentDocumentVersion: bigint;
  syncedDocumentVersion: bigint;
  errorMessage: string | null;
  updatedAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ResearchNotebookService {
  /**
   * Create a new research notebook and synchronize the specified documents.
   *
   * @param ctx        Server-resolved user context (NEVER from request body)
   * @param title      Notebook title
   * @param documentIds NexusIQ document IDs the user wants to include
   */
  static async createResearchNotebook(
    ctx: ResolvedUserContext,
    title: string,
    description: string | undefined,
    documentIds: string[]
  ): Promise<NotebookSummary> {
    const provider = getResearchProvider();
    const providerMeta = getProviderMeta();

    // 1. Authorize each document
    const authorizedDocs = await ResearchNotebookService.authorizeDocuments(ctx, documentIds);

    // 2. Create notebook record in DB (CREATING status)
    const notebook = await db.researchNotebook.create({
      data: {
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
        title,
        description: description ?? null,
        provider: provider.providerName,
        status: "CREATING",
      },
    });

    // Grant the creator OWNER access
    await db.researchNotebookAccess.create({
      data: {
        organizationId: ctx.organizationId,
        notebookId: notebook.id,
        userId: ctx.userId,
        accessLevel: "OWNER",
      },
    });

    // 3. Audit: notebook created
    await AuditService.logEvent({
      orgId: ctx.organizationId,
      userId: ctx.userId,
      action: "RESEARCH_NOTEBOOK_CREATED",
      metadata: {
        notebookId: notebook.id,
        title,
        provider: provider.providerName,
        documentCount: authorizedDocs.length,
      },
    });

    // 4. Sync sources asynchronously (non-blocking)
    ResearchNotebookService.syncSources(ctx, notebook.id, authorizedDocs).catch((err) => {
      console.error(`[ResearchNotebookService] Background sync failed for notebook ${notebook.id}:`, err);
    });

    return ResearchNotebookService.toNotebookSummary(notebook, providerMeta, 0, 0);
  }

  /**
   * Add additional documents to an existing notebook.
   */
  static async addDocumentsToNotebook(
    ctx: ResolvedUserContext,
    notebookId: string,
    documentIds: string[]
  ): Promise<{ queued: number; denied: number }> {
    await ResearchNotebookService.assertNotebookAccess(ctx, notebookId, "EDITOR");

    const authorizedDocs = await ResearchNotebookService.authorizeDocuments(ctx, documentIds);
    const denied = documentIds.length - authorizedDocs.length;

    ResearchNotebookService.syncSources(ctx, notebookId, authorizedDocs).catch(() => {});

    await AuditService.logEvent({
      orgId: ctx.organizationId,
      userId: ctx.userId,
      action: "RESEARCH_SOURCE_ADDED",
      metadata: { notebookId, queued: authorizedDocs.length, denied },
    });

    return { queued: authorizedDocs.length, denied };
  }

  /**
   * Remove a document source from a notebook.
   */
  static async removeDocumentFromNotebook(
    ctx: ResolvedUserContext,
    notebookId: string,
    documentId: string
  ): Promise<void> {
    await ResearchNotebookService.assertNotebookAccess(ctx, notebookId, "EDITOR");

    const source = await db.researchNotebookSource.findFirst({
      where: { notebookId, documentId, organizationId: ctx.organizationId, removedAt: null },
    });
    if (!source) return;

    const provider = getResearchProvider();
    if (source.providerSourceId) {
      const notebook = await db.researchNotebook.findUnique({ where: { id: notebookId } });
      if (notebook?.providerNotebookId) {
        const result = await provider.removeSource(notebook.providerNotebookId, source.providerSourceId);
        if (!result.success) {
          console.warn(`[ResearchNotebookService] Provider removeSource failed: ${result.errorMessage}`);
        }
      }
    }

    await db.researchNotebookSource.update({
      where: { id: source.id },
      data: { status: "REMOVED", removedAt: new Date() },
    });

    await AuditService.logEvent({
      orgId: ctx.organizationId,
      userId: ctx.userId,
      action: "RESEARCH_SOURCE_REMOVED",
      metadata: { notebookId, documentId },
    });
  }

  /**
   * Re-sync all stale or failed sources in a notebook.
   */
  static async syncNotebook(ctx: ResolvedUserContext, notebookId: string): Promise<void> {
    await ResearchNotebookService.assertNotebookAccess(ctx, notebookId, "EDITOR");

    const staleSources = await db.researchNotebookSource.findMany({
      where: {
        notebookId,
        organizationId: ctx.organizationId,
        removedAt: null,
        status: { in: ["STALE", "FAILED"] },
      },
    });

    const docIds = staleSources.map((s) => s.documentId);
    if (docIds.length === 0) return;

    const authorizedDocs = await ResearchNotebookService.authorizeDocuments(ctx, docIds);
    await ResearchNotebookService.syncSources(ctx, notebookId, authorizedDocs);

    await AuditService.logEvent({
      orgId: ctx.organizationId,
      userId: ctx.userId,
      action: "RESEARCH_NOTEBOOK_SYNCED",
      metadata: { notebookId, staleSourcesToSync: docIds.length },
    });
  }

  /**
   * Get notebook with full source status and stale detection.
   */
  static async getNotebookStatus(
    ctx: ResolvedUserContext,
    notebookId: string
  ): Promise<{ notebook: NotebookSummary; sources: SourceSummary[] }> {
    const notebook = await db.researchNotebook.findFirst({
      where: { id: notebookId, organizationId: ctx.organizationId, deletedAt: null },
    });
    if (!notebook) throw new Error("NOTEBOOK_NOT_FOUND");

    const sources = await db.researchNotebookSource.findMany({
      where: { notebookId, organizationId: ctx.organizationId, removedAt: null },
      include: { notebook: false },
    });

    // Detect stale sources: fetch current document versions
    const docIds = sources.map((s) => s.documentId);
    const currentDocs = await db.document.findMany({
      where: { id: { in: docIds }, organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, updatedAt: true, fileName: true },
    });
    const docMap = new Map(currentDocs.map((d) => [d.id, d]));

    // Mark stale sources
    const staleIds: string[] = [];
    for (const src of sources) {
      const doc = docMap.get(src.documentId);
      if (!doc) continue;
      const currentVersion = BigInt(doc.updatedAt.getTime());
      if (src.status === "ACTIVE" && currentVersion > src.documentVersion) {
        staleIds.push(src.id);
      }
    }
    if (staleIds.length > 0) {
      await db.researchNotebookSource.updateMany({
        where: { id: { in: staleIds } },
        data: { status: "STALE" },
      });
    }

    // Refresh sources after stale update
    const refreshed = await db.researchNotebookSource.findMany({
      where: { notebookId, organizationId: ctx.organizationId, removedAt: null },
    });

    const totalSources = refreshed.length;
    const staleSources = refreshed.filter((s) => s.status === "STALE").length;
    const providerMeta = getProviderMeta();

    const sourceSummaries: SourceSummary[] = refreshed.map((s) => {
      const doc = docMap.get(s.documentId);
      const currentVersion = doc ? BigInt(doc.updatedAt.getTime()) : BigInt(0);
      return {
        id: s.id,
        documentId: s.documentId,
        fileName: doc?.fileName ?? "Unknown",
        status: s.status,
        isStale: s.status === "STALE",
        currentDocumentVersion: currentVersion,
        syncedDocumentVersion: s.documentVersion,
        errorMessage: s.errorMessage,
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    return {
      notebook: ResearchNotebookService.toNotebookSummary(notebook, providerMeta, totalSources, staleSources),
      sources: sourceSummaries,
    };
  }

  /**
   * Synthesizes cross-document research insights (Study guide, FAQ, Podcast dialogue, Executive Summary).
   */
  static async synthesizeNotebook(
    ctx: ResolvedUserContext,
    notebookId: string,
    mode?: "summary" | "faq" | "podcast" | "study_guide",
    customPrompt?: string
  ): Promise<{ title: string; markdown: string }> {
    await ResearchNotebookService.assertNotebookAccess(ctx, notebookId, "VIEWER");

    const sources = await db.researchNotebookSource.findMany({
      where: { notebookId, organizationId: ctx.organizationId, status: "ACTIVE", removedAt: null },
    });

    if (sources.length === 0) {
      throw new Error("No active sources found in this research notebook. Sync sources first.");
    }

    const docs = await db.document.findMany({
      where: { id: { in: sources.map((s) => s.documentId) }, organizationId: ctx.organizationId },
      select: { id: true, fileName: true, content: true },
    });

    const provider = getResearchProvider();
    if (!provider.synthesizeNotebook) {
      throw new Error("Active research provider does not support multi-document synthesis.");
    }

    const payload = docs
      .filter((d): d is typeof d & { content: string } => typeof d.content === "string" && d.content.length > 0)
      .map((d) => ({
        fileName: d.fileName,
        textContent: d.content,
      }));

    const result = await provider.synthesizeNotebook({
      sources: payload,
      mode,
      customPrompt,
    });

    await AuditService.logEvent({
      orgId: ctx.organizationId,
      userId: ctx.userId,
      action: "RESEARCH_NOTEBOOK_SYNTHESIZED" as any,
      metadata: { notebookId, mode: mode ?? "summary", documentCount: payload.length },
    });

    return result;
  }

  /**
   * List all notebooks the user is authorized to view.
   */
  static async getAuthorizedNotebooks(ctx: ResolvedUserContext): Promise<NotebookSummary[]> {
    const accessEntries = await db.researchNotebookAccess.findMany({
      where: { organizationId: ctx.organizationId, userId: ctx.userId },
      select: { notebookId: true },
    });
    const notebookIds = accessEntries.map((a) => a.notebookId);

    const notebooks = await db.researchNotebook.findMany({
      where: { id: { in: notebookIds }, organizationId: ctx.organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const providerMeta = getProviderMeta();
    return notebooks.map((nb) => ResearchNotebookService.toNotebookSummary(nb, providerMeta, 0, 0));
  }

  /**
   * Get the provider web URL for opening the notebook in the external workspace.
   */
  static async getNotebookWebUrl(
    ctx: ResolvedUserContext,
    notebookId: string
  ): Promise<string | null> {
    const notebook = await db.researchNotebook.findFirst({
      where: { id: notebookId, organizationId: ctx.organizationId, deletedAt: null },
    });
    if (!notebook) throw new Error("NOTEBOOK_NOT_FOUND");
    await ResearchNotebookService.assertNotebookAccess(ctx, notebookId, "VIEWER");
    return notebook.providerWebUrl ?? null;
  }

  /**
   * Soft-delete a notebook and remove all sources from the provider.
   */
  static async deleteNotebook(ctx: ResolvedUserContext, notebookId: string): Promise<void> {
    await ResearchNotebookService.assertNotebookAccess(ctx, notebookId, "OWNER");

    const notebook = await db.researchNotebook.findFirst({
      where: { id: notebookId, organizationId: ctx.organizationId },
    });
    if (!notebook) return;

    if (notebook.providerNotebookId) {
      const provider = getResearchProvider();
      await provider.deleteNotebook(notebook.providerNotebookId);
    }

    await db.researchNotebook.update({
      where: { id: notebookId },
      data: { status: "DELETED", deletedAt: new Date() },
    });

    await AuditService.logEvent({
      orgId: ctx.organizationId,
      userId: ctx.userId,
      action: "RESEARCH_NOTEBOOK_DELETED",
      metadata: { notebookId },
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Authorize documents: run DocumentAccessPolicy + exclude forbidden content types.
   * Returns only documents the user may legally sync externally.
   */
  private static async authorizeDocuments(
    ctx: ResolvedUserContext,
    documentIds: string[]
  ): Promise<Array<{ id: string; fileName: string; content: string; fileType: string; updatedAt: Date }>> {
    if (documentIds.length === 0) return [];

    const docs = await db.document.findMany({
      where: {
        id: { in: documentIds },
        organizationId: ctx.organizationId, // tenant isolation
        deletedAt: null,
        processingStatus: "COMPLETED",
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        content: true,
        visibility: true,
        departmentId: true,
        collegeId: true,
        uploadedBy: true,
        updatedAt: true,
        organizationId: true,
      },
    });

    const accessCtx = {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      userRole: ctx.userRole as any,
      departmentId: ctx.departmentId,
      collegeId: ctx.collegeId,
    };

    const authorized = [];
    for (const doc of docs) {
      // Policy check
      const allowed = DocumentAccessPolicy.canAccessDocument(accessCtx, doc);
      if (!allowed) {
        await AuditService.logEvent({
          orgId: ctx.organizationId,
          userId: ctx.userId,
          action: "RESEARCH_ACCESS_DENIED",
          metadata: { documentId: doc.id, reason: "DocumentAccessPolicy denied" },
        });
        continue;
      }

      // Forbidden content check (student operational data)
      const isForbidden = FORBIDDEN_CONTENT_PATTERNS.some((re) => re.test(doc.fileName));
      if (isForbidden) {
        await AuditService.logEvent({
          orgId: ctx.organizationId,
          userId: ctx.userId,
          action: "RESEARCH_ACCESS_DENIED",
          metadata: { documentId: doc.id, reason: "Forbidden content type (student operational data)" },
        });
        continue;
      }

      // PRIVATE documents: only sync to notebooks owned by the same user
      if (doc.visibility === "PRIVATE" && doc.uploadedBy !== ctx.userId) {
        continue;
      }

      const content = doc.content ?? "";
      authorized.push({
        id: doc.id,
        fileName: doc.fileName,
        content,
        fileType: doc.fileType,
        updatedAt: doc.updatedAt,
      });
    }

    return authorized;
  }

  /**
   * Core sync: creates/updates the provider notebook and syncs sources.
   * Handles partial failure — records each source result individually.
   */
  private static async syncSources(
    ctx: ResolvedUserContext,
    notebookId: string,
    docs: Array<{ id: string; fileName: string; content: string; updatedAt: Date }>
  ): Promise<void> {
    const provider = getResearchProvider();

    const notebook = await db.researchNotebook.findUnique({ where: { id: notebookId } });
    if (!notebook) return;

    // Create sync job record
    const syncJob = await db.researchSyncJob.create({
      data: {
        organizationId: ctx.organizationId,
        notebookId,
        operation: "ADD_SOURCES",
        status: "RUNNING",
        totalSources: docs.length,
        startedAt: new Date(),
      },
    });

    let providerNotebookId = notebook.providerNotebookId;

    // Create provider notebook if not yet created
    if (!providerNotebookId) {
      try {
        const pNotebook = await provider.createNotebook({
          title: notebook.title,
          description: notebook.description ?? undefined,
        });
        providerNotebookId = pNotebook.providerNotebookId;
        await db.researchNotebook.update({
          where: { id: notebookId },
          data: {
            providerNotebookId,
            providerWebUrl: pNotebook.webUrl ?? null,
            status: "CREATING",
          },
        });
      } catch (err: any) {
        await db.researchNotebook.update({
          where: { id: notebookId },
          data: { status: "FAILED" },
        });
        await db.researchSyncJob.update({
          where: { id: syncJob.id },
          data: { status: "FAILED", errorMessage: err.message, completedAt: new Date() },
        });
        await AuditService.logEvent({
          orgId: ctx.organizationId,
          userId: ctx.userId,
          action: "RESEARCH_SYNC_FAILED",
          metadata: { notebookId, error: err.message },
        });
        return;
      }
    }

    // Build source payloads
    const sourceBatch = docs.map((doc) => ({
      documentId: doc.id,
      fileName: doc.fileName,
      textContent: doc.content.slice(0, 500_000),
      contentHash: crypto.createHash("sha256").update(doc.content).digest("hex"),
    }));

    // Upsert source records as SYNCING
    for (const doc of docs) {
      await db.researchNotebookSource.upsert({
        where: { notebookId_documentId: { notebookId, documentId: doc.id } },
        create: {
          organizationId: ctx.organizationId,
          notebookId,
          documentId: doc.id,
          status: "SYNCING",
        },
        update: { status: "SYNCING", errorMessage: null },
      });
    }

    // Call provider
    let completedSources = 0;
    let failedSources = 0;

    try {
      const syncResult = await provider.addSources(providerNotebookId, sourceBatch);

      // Record successes
      for (const src of syncResult.succeeded) {
        const doc = docs.find((d) =>
          sourceBatch.find((s) => s.documentId === d.id && s.contentHash === src.contentHash)
        ) ?? docs[completedSources]; // fallback by position

        await db.researchNotebookSource.update({
          where: { notebookId_documentId: { notebookId, documentId: doc?.id ?? "" } },
          data: {
            status: "ACTIVE",
            providerSourceId: src.providerSourceId,
            providerResourceName: src.providerResourceName ?? null,
            sourceHash: src.contentHash ?? null,
            documentVersion: doc ? BigInt(doc.updatedAt.getTime()) : BigInt(0),
            errorMessage: null,
          },
        });
        completedSources++;
      }

      // Record failures
      for (const failure of syncResult.failed) {
        await db.researchNotebookSource.update({
          where: { notebookId_documentId: { notebookId, documentId: failure.documentId } },
          data: { status: "FAILED", errorMessage: failure.errorMessage },
        });
        failedSources++;
      }
    } catch (err: any) {
      // Total provider failure
      for (const doc of docs) {
        await db.researchNotebookSource.update({
          where: { notebookId_documentId: { notebookId, documentId: doc.id } },
          data: { status: "FAILED", errorMessage: err.message },
        });
      }
      failedSources = docs.length;
    }

    // Update sync job
    const finalJobStatus = failedSources === 0 ? "COMPLETED" : failedSources === docs.length ? "FAILED" : "PARTIAL";
    await db.researchSyncJob.update({
      where: { id: syncJob.id },
      data: { status: finalJobStatus, completedSources, failedSources, completedAt: new Date() },
    });

    // Update notebook status
    const notebookStatus = failedSources === 0 ? "ACTIVE" : failedSources === docs.length ? "FAILED" : "PARTIAL";
    await db.researchNotebook.update({
      where: { id: notebookId },
      data: { status: notebookStatus },
    });

    if (finalJobStatus !== "COMPLETED") {
      await AuditService.logEvent({
        orgId: ctx.organizationId,
        userId: ctx.userId,
        action: "RESEARCH_SYNC_FAILED",
        metadata: { notebookId, completedSources, failedSources },
      });
    }
  }

  /** Assert the user has at least the required access level for the notebook. */
  private static async assertNotebookAccess(
    ctx: ResolvedUserContext,
    notebookId: string,
    required: "VIEWER" | "EDITOR" | "OWNER"
  ): Promise<void> {
    const levels = ["VIEWER", "EDITOR", "OWNER"];
    const requiredIdx = levels.indexOf(required);

    const access = await db.researchNotebookAccess.findFirst({
      where: { notebookId, organizationId: ctx.organizationId, userId: ctx.userId },
    });

    if (!access || levels.indexOf(access.accessLevel) < requiredIdx) {
      await AuditService.logEvent({
        orgId: ctx.organizationId,
        userId: ctx.userId,
        action: "RESEARCH_ACCESS_DENIED",
        metadata: { notebookId, required, actual: access?.accessLevel ?? "none" },
      });
      throw new Error("RESEARCH_ACCESS_DENIED");
    }
  }

  private static toNotebookSummary(
    nb: any,
    providerMeta: { providerName: string; isDevelopmentMode: boolean },
    totalSources: number,
    staleSources: number
  ): NotebookSummary {
    return {
      id: nb.id,
      organizationId: nb.organizationId,
      title: nb.title,
      description: nb.description ?? null,
      provider: nb.provider,
      isDevelopmentMode: providerMeta.isDevelopmentMode,
      status: nb.status,
      providerWebUrl: nb.providerWebUrl ?? null,
      totalSources,
      staleSources,
      createdAt: nb.createdAt.toISOString(),
      updatedAt: nb.updatedAt.toISOString(),
    };
  }
}
