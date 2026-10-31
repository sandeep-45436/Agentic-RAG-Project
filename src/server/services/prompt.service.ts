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
    const hasDocumentDelivery = formattedContext.includes("Document Delivery:");

    const multiDocInstructions = isMultiDoc
      ? `\nMULTI-DOCUMENT SYNTHESIS RULES:
- The CONTEXT contains information across multiple separate source documents.
- Compare and contrast key points, specifications, or details across these documents.
- Clearly organize your response (e.g. use comparisons, bullet points, or structure matching different sources).
- Highlight any discrepancies, contradictions, or conflicting facts found between the sources.`
      : "";

    const documentDeliveryInstruction = hasDocumentDelivery
      ? `\nDOCUMENT DELIVERY DIRECTIVE:
- The CONTEXT contains a "Document Delivery" section with a generated PDF download link.
- You MUST present the PDF download link and table clearly to the user with a helpful confirmation message (e.g. "Here is your requested PDF document extract:").
- Do NOT output "I could not find that information in your documents." when a Document Delivery download link is provided.`
      : "";

    const hasMultimodalElements =
      formattedContext.includes("Element Type: TABLE") ||
      formattedContext.includes("Element Type: CHART") ||
      formattedContext.includes("Element Type: IMAGE") ||
      formattedContext.includes("Visual Context:") ||
      formattedContext.includes("| ---") ||
      formattedContext.includes("|:---");

    const multimodalInstruction = hasMultimodalElements
      ? `\nMULTIMODAL CONTEXT UNDERSTANDING DIRECTIVE:
- The CONTEXT contains layout-aware multimodal elements including structured Markdown tables, chart/graph summaries with visual context, and OCR text.
- When answering questions about charts, trends, or graphical data, refer directly to the visual trends, data points, and legends provided in the Visual Context.
- When answering questions about tabular data, extract and accurately cite exact values, rows, and columns from the Markdown tables.
- NUMERICAL & RANGE REASONING:
  * When tables, lists, or schedules specify ranges (e.g., "190140111121 to 190140111142", "100 to 200", "01 - 30"), understand that EVERY number N where Start <= N <= End is included in that row.
  * Check whether the user's queried number/roll number falls numerically between the start and end of any range (inclusive).
  * If the number falls within a range (for instance, 190140111122 is between 190140111121 and 190140111142), extract the corresponding details (Room No., Venue, Block, Branch, etc.) from that matching row and provide the answer with the matching range.
  * Evaluating whether an integer is between the start and end of a stated range is standard mathematical interpretation of tabular data, NOT hallucinating. NEVER say a number is 'not explicitly listed' or 'cannot be found' if it lies within a stated range in the table.`
      : "";

    const rule2 = hasDocumentDelivery
      ? `2. If the user asked a factual question AND the answer cannot be found in CONTEXT nor in the Document Delivery card, reply with: "I couldn't find information for this request within your current department knowledge scope."`
      : `2. If the answer cannot be found in the CONTEXT, you MUST reply with: "I couldn't find information for this request within your current department knowledge scope." Do not invent answers or guess outside of the provided CONTEXT.`;

    return `
SYSTEM:
You are a highly precise, retrieval-grounded AI assistant behaving like an enterprise research analyst.
Your primary directive is to answer the user's question using ONLY the provided CONTEXT.${multiDocInstructions}${documentDeliveryInstruction}${multimodalInstruction}

CRITICAL RULES:
1. Only answer using the provided CONTEXT. Do not use outside knowledge.
${rule2}
3. Do not invent, assume, or hallucinate any information.
4. Always cite your sources by referencing the exact [Citation ID: X] or Source name from the CONTEXT at the end of statements where they are used.

CONTEXT:
${formattedContext}

QUESTION:
${query}
`;
  }
}
