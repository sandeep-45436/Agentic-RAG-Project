import { GraphState } from "../graph/state";
import { PromptService } from "@/server/services/prompt.service";
import { CitationService } from "@/server/services/citation.service";
import { StageTimer } from "@/ai/instrumentation/stage-timer";
import { latencyBudgets } from "@/ai/config/latency-budgets";
import { getMessageText } from "@/lib/utils";

/**
 * Formats a document delivery result into a download card for the response.
 */
function formatDocumentDeliveryCard(delivery: NonNullable<typeof GraphState.State["documentDelivery"]>): string {
  const { documentName, pages, downloadUrl, provenance, confidence } = delivery;

  const pageRange = pages.length <= 5
    ? pages.join(", ")
    : `${pages[0]}–${pages[pages.length - 1]} (${pages.length} pages)`;

  const groundedBadge = confidence >= 0.7 ? "✓" : "~";

  return [
    "",
    "---",
    "",
    `📄 **[Download: ${documentName}](${downloadUrl})**`,
    "",
    `| Detail | Value |`,
    `|--------|-------|`,
    `| **Pages** | ${pageRange} |`,
    `| **Source** | ${provenance.sourceDocumentName} v${provenance.documentVersion} |`,
    `| **Grounded** | ${groundedBadge} |`,
    `| **Access** | ${provenance.accessLevel.replace(/_/g, " ")} |`,
    `| **Artifact** | ${provenance.artifactId} |`,
    "",
  ].join("\n");
}

/**
 * Response Agent Node: Assembles the final grounded system prompt combining all subsystem contexts
 * (Knowledge RAG chunks, Database analytics records, Workflow tool outputs, Document Delivery, and Memory).
 */
export async function responseAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("responseNode");
  let cacheHit = false;
  let errorOccurred = false;

  try {
    const { messages, knowledgeContext, databaseContext, toolOutputs, formattedCitations, documentDelivery } = state;
    const latestMessage = messages[messages.length - 1];

    if (!latestMessage) {
      const { durationMs } = StageTimer.end("responseNode", stageStart, {
        organizationId: state.organizationId,
        userId: state.userId,
        cacheHit,
      });
      return { finalPrompt: "No query provided.", timings: { responseNode: durationMs } };
    }

    const query = getMessageText(latestMessage);
    const chunks = knowledgeContext?.chunks || [];

    // Format citations if available
    let contextText = formattedCitations || CitationService.formatCitations(chunks);

    // Append structured database records if present
    if (databaseContext && databaseContext.length > 0) {
      const dbText = databaseContext
        .map((d) => `[Database Tool: ${d.toolName}]\nData: ${JSON.stringify(d.records, null, 2)}`)
        .join("\n\n");
      contextText = `${contextText}\n\nStructured Database Analytics:\n${dbText}`;
    }

    // Append workflow tool outputs if present
    if (toolOutputs && toolOutputs.length > 0) {
      const toolText = toolOutputs
        .map((t) => `[Workflow Tool: ${t.toolName}]\nResult: ${JSON.stringify(t.result, null, 2)}`)
        .join("\n\n");
      contextText = `${contextText}\n\nTool Executions:\n${toolText}`;
    }

    // Append document delivery context if present
    if (documentDelivery) {
      const deliveryCard = formatDocumentDeliveryCard(documentDelivery);
      contextText = `${contextText}\n\nDocument Delivery:\n${deliveryCard}`;
      contextText = `${contextText}\n\n[INSTRUCTION: Include the document download card above in your response. The student requested a PDF document. Present the download link prominently.]`;
    }

    const citedDocNames = [
      ...new Set(chunks.map((p) => p.documentName).filter((name) => name && name !== "Knowledge Graph")),
    ];
    const isMultiDoc = citedDocNames.length > 1;

    const finalPrompt = PromptService.assembleGroundedPrompt(query, contextText, isMultiDoc);

    const { durationMs } = StageTimer.end("responseNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });

    // Emit PIPELINE_COMPLETE and optionally SLA_BREACH
    const pipelineEntry = (state.timings as any)?.__pipelineEntry ?? 0;
    const totalDurationMs = pipelineEntry ? Date.now() - pipelineEntry : 0;
    const allTimings = { ...(state.timings ?? {}), responseNode: durationMs };
    console.log(JSON.stringify({ event: "PIPELINE_COMPLETE", timings: allTimings, totalDurationMs, organizationId: state.organizationId, userId: state.userId }));
    if (totalDurationMs > 0 && totalDurationMs > latencyBudgets.pipeline_total) {
      console.log(JSON.stringify({ event: "SLA_BREACH", timings: allTimings, totalDurationMs, budgetMs: latencyBudgets.pipeline_total, organizationId: state.organizationId, userId: state.userId }));
    }

    return { finalPrompt, timings: { responseNode: durationMs } };
  } catch (err) {
    errorOccurred = true;
    const { durationMs } = StageTimer.end("responseNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    }, true);
    return { finalPrompt: "No query provided.", timings: { responseNode: durationMs } };
  }
}
