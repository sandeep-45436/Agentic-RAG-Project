import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// pdf-parse v1.1.1 — simple default export that takes a Buffer
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});

// ── Raw text fallback when pdf-parse encounters format errors (e.g. bad XRef) ──
function extractRawTextFallback(buffer: Buffer): string {
  try {
    const content = buffer.toString("latin1");
    // Extract text in BT...ET blocks with Tj operators
    const textMatches = content.match(/\((?:\\\(|\\\)|[^)])*\)\s*Tj/g);
    if (textMatches && textMatches.length > 0) {
      const pieces = textMatches.map((tm) => {
        return tm
          .replace(/^\(/, "")
          .replace(/\)\s*Tj$/, "")
          .replace(/\\([()\\])/g, "$1");
      });
      const res = pieces.join(" ").replace(/\s+/g, " ").trim();
      if (res.length > 20) return res;
    }
    // Fallback: extract readable strings
    const matches = content.match(/[\x20-\x7E]{4,}/g);
    if (matches) {
      const filtered = matches.filter(
        (m) =>
          !m.startsWith("/Type") &&
          !m.startsWith("/Font") &&
          !m.includes("endobj") &&
          !m.includes("stream") &&
          !m.includes("xref")
      );
      return filtered.join(" ").replace(/\s+/g, " ").trim();
    }
  } catch (e) {
    console.warn("[pdf-loader] Raw text fallback failed:", e);
  }
  return "";
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    let text: string = data.text ?? "";
    text = text.replace(/\n+/g, "\n").replace(/ +/g, " ").trim();
    if (text.length > 0) return text;
  } catch (error) {
    console.warn("[pdf-loader] Standard pdf-parse failed, using resilient text extractor:", error);
  }
  const fallback = extractRawTextFallback(buffer);
  if (fallback.length > 0) return fallback;
  throw new Error("Unable to extract text from PDF.");
}

// ── Page-aware extraction ─────────────────────────────────────────────────────

export async function extractTextWithPages(buffer: Buffer): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  fullText: string;
  numPages: number;
}> {
  try {
    const pages: Array<{ pageNumber: number; text: string }> = [];
    let fullText = "";

    const data = await pdfParse(buffer, {
      pagerender: (pageData: any) => {
        return pageData.getTextContent().then((textContent: any) => {
          return textContent.items.map((item: any) => item.str).join(" ");
        });
      },
    });

    const numPages: number = data.numpages ?? 1;
    fullText = (data.text ?? "").replace(/\n+/g, "\n").replace(/ +/g, " ").trim();

    const charsPerPage = Math.ceil(fullText.length / numPages);
    for (let i = 0; i < numPages; i++) {
      const start = i * charsPerPage;
      const end = Math.min((i + 1) * charsPerPage, fullText.length);
      const pageText = fullText.slice(start, end).trim();
      if (pageText.length > 0) {
        pages.push({ pageNumber: i + 1, text: pageText });
      }
    }

    if (pages.length > 0 && fullText.length > 0) {
      return { pages, fullText, numPages };
    }
  } catch (error) {
    console.warn("[pdf-loader] Standard page-aware pdf-parse failed, using fallback:", error);
  }

  const rawText = extractRawTextFallback(buffer);
  return {
    pages: [{ pageNumber: 1, text: rawText || "Document Content" }],
    fullText: rawText || "Document Content",
    numPages: 1,
  };
}

// ── Basic chunking ────────────────────────────────────────────────────────────

export async function chunkText(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) return [];
  return splitter.splitText(text);
}

// ── Chunking with page metadata ───────────────────────────────────────────────

export async function chunkTextWithMetadata(
  text: string,
  pages?: Array<{ pageNumber: number; text: string }>
): Promise<Array<{ text: string; pageNumber: number | null; chunkIndex: number }>> {
  if (!text || text.trim().length === 0) return [];

  const rawChunks = await splitter.splitText(text);

  return rawChunks.map((chunkContent, idx) => {
    // Try to find which page this chunk belongs to
    let pageNumber: number | null = null;
    if (pages && pages.length > 0) {
      for (const page of pages) {
        if (page.text.includes(chunkContent.substring(0, 50))) {
          pageNumber = page.pageNumber;
          break;
        }
      }
      // Fallback: distribute evenly
      if (pageNumber === null) {
        const pageIdx = Math.floor((idx / rawChunks.length) * pages.length);
        pageNumber = pages[pageIdx]?.pageNumber ?? 1;
      }
    }
    return { text: chunkContent, pageNumber, chunkIndex: idx };
  });
}
