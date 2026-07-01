import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Use require() with exact CJS path to bypass Next.js/Turbopack bundling.
    // pdf-parse v2.x requires a class instantiation pattern.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require("pdf-parse/dist/pdf-parse/cjs/index.cjs");
    const PDFParse = pdfModule.PDFParse;

    const parser = new PDFParse({
      data: buffer,
      verbosity: 0,
      // Remove the "-- N of M --" page separator injected by default
      pageJoiner: "\n",
    });

    const result = await parser.getText();
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
