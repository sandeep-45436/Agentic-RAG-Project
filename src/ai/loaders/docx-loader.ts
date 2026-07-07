import { splitter } from "./pdf-loader";

/** Approximate characters per page for DOCX estimation */
const CHARS_PER_PAGE = 3000;

/**
 * Extracts plain text from a DOCX buffer using mammoth.
 * Returns the cleaned text and an estimated page count.
 */
export async function extractTextFromDocx(
  buffer: Buffer
): Promise<{ text: string; numPages: number }> {
  try {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    let text: string = result.value ?? "";
    text = text.replace(/\r\n/g, "\n").replace(/\n+/g, "\n").replace(/ +/g, " ").trim();

    if (result.messages && result.messages.length > 0) {
      console.log(
        "[docx-loader] mammoth messages:",
        result.messages.map((m: any) => m.message).join("; ")
      );
    }

    const numPages = Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE));
    return { text, numPages };
  } catch (error) {
    console.error("[docx-loader] Failed to parse DOCX:", error);
    throw error;
  }
}

/**
 * Extracts text from a DOCX buffer with estimated per-page information.
 * Since DOCX does not have reliable hard page breaks, pages are estimated
 * based on character count (~3000 chars per page).
 */
export async function extractTextWithPagesDocx(buffer: Buffer): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  fullText: string;
  numPages: number;
}> {
  try {
    const { text, numPages } = await extractTextFromDocx(buffer);

    if (!text || text.length === 0) {
      return { pages: [], fullText: "", numPages: 0 };
    }

    // Estimate pages by splitting text into ~CHARS_PER_PAGE sized chunks
    const pages: Array<{ pageNumber: number; text: string }> = [];
    for (let i = 0; i < numPages; i++) {
      const start = i * CHARS_PER_PAGE;
      const end = Math.min((i + 1) * CHARS_PER_PAGE, text.length);
      const pageText = text.slice(start, end).trim();
      if (pageText.length > 0) {
        pages.push({ pageNumber: i + 1, text: pageText });
      }
    }

    return { pages, fullText: text, numPages };
  } catch (error) {
    console.error("[docx-loader] Failed to parse DOCX with pages:", error);
    throw error;
  }
}

/**
 * Chunks DOCX text with page metadata.
 * Re-uses the shared splitter and page-mapping logic from pdf-loader.
 */
export async function chunkDocxTextWithMetadata(
  text: string,
  pages?: Array<{ pageNumber: number; text: string }>
): Promise<Array<{ text: string; pageNumber: number | null; chunkIndex: number }>> {
  // Delegate to the shared chunkTextWithMetadata from pdf-loader
  const { chunkTextWithMetadata } = await import("./pdf-loader");
  return chunkTextWithMetadata(text, pages);
}
