import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
});

export async function extractTextFromPdf(
  buffer: Buffer
): Promise<{ text: string; numPages: number }> {
  try {
    // Use require() to load pdf-parse v1.1.1 (bypass Next.js/Turbopack bundling)
    const pdf = require("pdf-parse");
    const result = await pdf(buffer);
    let text: string = result.text ?? "";
    text = text.replace(/\n+/g, "\n").replace(/ +/g, " ").trim();
    const numPages: number = result.numpages ?? 1;
    return { text, numPages };
  } catch (error) {
    console.error("[pdf-loader] Failed to parse PDF:", error);
    throw error;
  }
}

/**
 * Extracts text from a PDF buffer with per-page information.
 * Uses pdf-parse's page-level data if available, otherwise estimates
 * page numbers from character positions.
 */
export async function extractTextWithPages(buffer: Buffer): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  fullText: string;
  numPages: number;
}> {
  try {
    // Use require() to load pdf-parse v1.1.1 (bypass Next.js/Turbopack bundling)
    const pdf = require("pdf-parse");

    const pages: Array<{ pageNumber: number; text: string }> = [];
    let currentPage = 0;

    // pdf-parse supports a pagerender callback to capture per-page text
    const options = {
      pagerender: (pageData: any) => {
        return pageData.getTextContent().then((textContent: any) => {
          currentPage++;
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          const cleanedPageText = pageText
            .replace(/\n+/g, "\n")
            .replace(/ +/g, " ")
            .trim();
          pages.push({ pageNumber: currentPage, text: cleanedPageText });
          return cleanedPageText;
        });
      },
    };

    const result = await pdf(buffer, options);
    const numPages: number = result.numpages ?? 1;
    let fullText: string = result.text ?? "";
    fullText = fullText.replace(/\n+/g, "\n").replace(/ +/g, " ").trim();

    // If pagerender didn't capture pages, estimate from character positions
    if (pages.length === 0 && fullText.length > 0) {
      const charsPerPage = Math.ceil(fullText.length / numPages);
      for (let i = 0; i < numPages; i++) {
        const start = i * charsPerPage;
        const end = Math.min((i + 1) * charsPerPage, fullText.length);
        const pageText = fullText.slice(start, end).trim();
        if (pageText.length > 0) {
          pages.push({ pageNumber: i + 1, text: pageText });
        }
      }
    }

    return { pages, fullText, numPages };
  } catch (error) {
    console.error("[pdf-loader] Failed to parse PDF with pages:", error);
    throw error;
  }
}

/**
 * Chunks text and attaches page metadata to each chunk.
 * If pages info is provided, determines which page each chunk belongs to
 * based on character position mapping.
 */
export async function chunkTextWithMetadata(
  text: string,
  pages?: Array<{ pageNumber: number; text: string }>
): Promise<Array<{ text: string; pageNumber: number | null; chunkIndex: number }>> {
  if (!text || text.trim().length === 0) return [];

  const rawChunks = await splitter.splitText(text);

  if (!pages || pages.length === 0) {
    // No page info available — return chunks without page numbers
    return rawChunks.map((chunk, index) => ({
      text: chunk,
      pageNumber: null,
      chunkIndex: index,
    }));
  }

  // Build a cumulative character offset map for each page
  const pageOffsets: Array<{ pageNumber: number; start: number; end: number }> = [];
  let offset = 0;
  for (const page of pages) {
    const start = text.indexOf(page.text, offset);
    if (start !== -1) {
      pageOffsets.push({
        pageNumber: page.pageNumber,
        start,
        end: start + page.text.length,
      });
      offset = start + page.text.length;
    } else {
      // Fallback: use sequential offset estimation
      pageOffsets.push({
        pageNumber: page.pageNumber,
        start: offset,
        end: offset + page.text.length,
      });
      offset += page.text.length;
    }
  }

  return rawChunks.map((chunk, index) => {
    // Find which page this chunk starts in
    const chunkStart = text.indexOf(chunk);
    let pageNumber: number | null = null;

    if (chunkStart !== -1) {
      for (const po of pageOffsets) {
        if (chunkStart >= po.start && chunkStart < po.end) {
          pageNumber = po.pageNumber;
          break;
        }
      }
      // If chunk starts after all known page offsets, assign to last page
      if (pageNumber === null && pageOffsets.length > 0) {
        pageNumber = pageOffsets[pageOffsets.length - 1].pageNumber;
      }
    }

    return { text: chunk, pageNumber, chunkIndex: index };
  });
}

/**
 * Simple chunking without metadata — kept for backward compatibility.
 */
export async function chunkText(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) return [];
  return splitter.splitText(text);
}
