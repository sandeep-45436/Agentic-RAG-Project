/** Approximate characters per page for plain text estimation */
const CHARS_PER_PAGE = 3000;

/**
 * Strips a UTF-8 BOM (byte order mark) from the beginning of a string if present.
 */
function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Extracts text from a plain text buffer.
 * Handles UTF-8 encoding, BOM markers, and different line endings.
 * Returns the cleaned text and an estimated page count.
 */
export async function extractTextFromTxt(
  buffer: Buffer
): Promise<{ text: string; numPages: number }> {
  try {
    let text = buffer.toString("utf-8");
    text = stripBom(text);

    // Normalize line endings: \r\n → \n, lone \r → \n
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // Collapse multiple blank lines and trim whitespace
    text = text.replace(/\n{3,}/g, "\n\n").replace(/ +/g, " ").trim();

    if (!text || text.length === 0) {
      console.log("[txt-loader] File is empty or contains no text.");
      return { text: "", numPages: 0 };
    }

    const numPages = Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE));
    return { text, numPages };
  } catch (error) {
    console.error("[txt-loader] Failed to parse TXT:", error);
    throw error;
  }
}

/**
 * Extracts text from a plain text buffer with estimated per-page information.
 * Pages are estimated based on character count (~3000 chars per page).
 */
export async function extractTextWithPagesTxt(buffer: Buffer): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  fullText: string;
  numPages: number;
}> {
  try {
    const { text, numPages } = await extractTextFromTxt(buffer);

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
    console.error("[txt-loader] Failed to parse TXT with pages:", error);
    throw error;
  }
}

/**
 * Chunks plain text with page metadata.
 * Re-uses the shared splitter and page-mapping logic from pdf-loader.
 */
export async function chunkTxtTextWithMetadata(
  text: string,
  pages?: Array<{ pageNumber: number; text: string }>
): Promise<Array<{ text: string; pageNumber: number | null; chunkIndex: number }>> {
  // Delegate to the shared chunkTextWithMetadata from pdf-loader
  const { chunkTextWithMetadata } = await import("./pdf-loader");
  return chunkTextWithMetadata(text, pages);
}
