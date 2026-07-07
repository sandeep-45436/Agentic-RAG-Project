import { VectorPayload } from "./vector.service";

export interface MemoryMetadata {
  previouslyCitedDocumentIds: string[];
  previouslyCitedDocumentNames: string[];
}

export class MemoryManagerService {
  /**
   * Scans previous assistant messages in the chat history to identify
   * all documents that were previously cited/retrieved during this session.
   *
   * @param chatHistory - The conversation history
   * @returns List of cited document IDs and names
   */
  static extractRetrievalMemory(
    chatHistory: Array<{ role: "user" | "assistant"; content: string; citations?: any }>
  ): MemoryMetadata {
    const documentIds = new Set<string>();
    const documentNames = new Set<string>();

    for (const msg of chatHistory) {
      if (msg.role !== "assistant" || !msg.citations) {
        continue;
      }

      try {
        const citationsList = typeof msg.citations === "string"
          ? JSON.parse(msg.citations)
          : msg.citations;

        if (Array.isArray(citationsList)) {
          for (const cit of citationsList) {
            // Support both vector payloads and raw citations format
            const docId = cit.documentId ?? cit.payload?.documentId;
            const docName = cit.documentName ?? cit.payload?.documentName;

            if (docId && docId !== "graph-knowledge") {
              documentIds.add(docId);
            }
            if (docName && docName !== "Knowledge Graph") {
              documentNames.add(docName);
            }
          }
        }
      } catch (e) {
        // Safe skip on parsing failures
        console.warn("[MemoryManagerService] Failed parsing citations for memory:", e);
      }
    }

    return {
      previouslyCitedDocumentIds: Array.from(documentIds),
      previouslyCitedDocumentNames: Array.from(documentNames),
    };
  }

  /**
   * Limits chat history length to stay within the model's context budget.
   * Keeps a maximum number of character tokens, stripping older turns first.
   *
   * @param chatHistory - Input conversation history
   * @param tokenBudget - Target tokens to allocate for history (default 3000)
   * @returns Sliced and budget-compliant chat history
   */
  static budgetChatHistory(
    chatHistory: Array<{ role: "user" | "assistant"; content: string; citations?: any }>,
    tokenBudget: number = 3000
  ): Array<{ role: "user" | "assistant"; content: string }> {
    // 1 token ≈ 4 characters of English text
    const charLimit = tokenBudget * 4;
    
    let currentLength = 0;
    const budgetedHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Traverse from newest to oldest messages to preserve recent context
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const msg = chatHistory[i];
      const contentLength = msg.content.length;

      if (currentLength + contentLength > charLimit) {
        console.log(`[MemoryManagerService] Spliced history due to token budget constraint. Preserving ${budgetedHistory.length} turns.`);
        break;
      }

      currentLength += contentLength;
      budgetedHistory.unshift({
        role: msg.role,
        content: msg.content,
      });
    }

    return budgetedHistory;
  }
}
