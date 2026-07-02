import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Use require() to load pdf-parse v1.1.1 (bypass Next.js/Turbopack bundling)
    const pdf = require("pdf-parse");
    const result = await pdf(buffer);
    let text: string = result.text ?? "";
    text = text.replace(/\n+/g, "\n").replace(/ +/g, " ").trim();
    return text;
  } catch (error) {
    console.error("[pdf-loader] Failed to parse PDF:", error);
    throw error;
  }
}

export async function chunkText(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) return [];
  return splitter.splitText(text);
}
