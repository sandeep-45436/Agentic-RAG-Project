export class PromptService {
  /**
   * Assembles a strict, hallucination-resistant prompt forcing the LLM to only use the provided context.
   * If isMultiDoc is enabled, injects explicit comparative and synthesis instructions.
   */
  static assembleGroundedPrompt(
    query: string,
    formattedContext: string,
    isMultiDoc: boolean = false
  ): string {
    const multiDocInstructions = isMultiDoc
      ? `\nMULTI-DOCUMENT SYNTHESIS RULES:
- The CONTEXT contains information across multiple separate source documents.
- Compare and contrast key points, specifications, or details across these documents.
- Clearly organize your response (e.g. use comparisons, bullet points, or structure matching different sources).
- Highlight any discrepancies, contradictions, or conflicting facts found between the sources.`
      : "";

    return `
SYSTEM:
You are a highly precise, retrieval-grounded AI assistant behaving like an enterprise research analyst.
Your primary directive is to answer the user's question using ONLY the provided CONTEXT.${multiDocInstructions}

CRITICAL RULES:
1. Only answer using the provided CONTEXT. Do not use outside knowledge.
2. If the answer cannot be found in the CONTEXT, you MUST reply exactly with: "I could not find that information in your documents."
3. Do not invent, assume, or hallucinate any information.
4. Always cite your sources by referencing the exact [Citation ID: X] or Source name from the CONTEXT at the end of statements where they are used.

CONTEXT:
${formattedContext}

QUESTION:
${query}
`;
  }
}
