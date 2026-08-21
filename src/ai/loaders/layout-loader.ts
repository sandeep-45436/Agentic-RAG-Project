import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogle } from "@ai-sdk/google";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ModelConfig } from "@/ai/llm/model-config";
import { extractTextWithPages } from "./pdf-loader";

// Lazily initialize OpenRouter client to prevent static import initialization timing issues
let openrouterInstance: ReturnType<typeof createOpenAI> | null = null;

function getOpenRouter() {
  if (!openrouterInstance) {
    openrouterInstance = createOpenAI({
      baseURL: ModelConfig.baseUrl,
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "",
    });
  }
  return openrouterInstance;
}

// Lazily initialize Google Gemini client
let googleInstance: ReturnType<typeof createGoogle> | null = null;

function getGoogleProvider() {
  if (!googleInstance) {
    googleInstance = createGoogle({
      apiKey: process.env.GEMINI_API_KEY || "",
    });
  }
  return googleInstance;
}

export interface ParsedElement {
  type: "text" | "table" | "chart" | "image";
  content: string; // Plain text, Markdown table, or chart summary text
  pageNumber: number;
  metadata: {
    title?: string;
    headers?: string[];
    confidence?: number;
    visualContext?: string; // For charts: description of trends, axis labels, legends
    summary?: string; // Short 1-2 sentence semantic summary of this element for vector search indexing
  };
}

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});

/**
 * Parses a PDF natively using Gemini 2.5 Flash via OpenRouter with automatic fallback.
 * Pass the PDF file buffer directly as a multimodal attachment.
 */
export async function parsePdfNativeMultimodal(
  pdfBuffer: Buffer,
  fileName: string
): Promise<ParsedElement[]> {
  try {
    const base64Pdf = pdfBuffer.toString("base64");
    
    const prompt = `
You are a layout-aware PDF document parser. Analyze the uploaded PDF document named "${fileName}".
Understand its layout, separating standard text paragraphs from tables, charts, scanned pages, and images.

Process the document and extract elements:
1. **Text**: Extract paragraphs. Keep headings attached.
2. **Tables**: Render all tables as structured Markdown tables, preserving row and column alignments.
3. **Charts & Graphs**: Write a detailed textual summary of the chart, including axis legends, labels, visual trends, data points, and the overall conclusion.
4. **Scanned Images / Pages**: Perform OCR to extract text structures.

Output the result as a single, valid JSON array containing objects matching this format:
\`\`\`json
[
  {
    "type": "text" | "table" | "chart" | "image",
    "content": "the extracted text or markdown table or visual summary",
    "pageNumber": 1,
    "metadata": {
      "title": "optional title or header of the element",
      "headers": ["col1", "col2"], // ONLY for table elements
      "visualContext": "axes, trends, and data point summaries", // ONLY for chart elements
      "summary": "a short 1-2 sentence semantic summary of this element for vector search indexing" // REQUIRED for table/chart/image
    }
  }
]
\`\`\`
Return ONLY the raw JSON array. Do not include markdown formatting wraps, fences (like \`\`\`json), or any introductory text.
`;

    // Try OpenRouter first or Direct Gemini
    const model = process.env.OPENROUTER_API_KEY
      ? getOpenRouter().chat(ModelConfig.multimodal)
      : getGoogleProvider()(ModelConfig.multimodalDirect);

    const response = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "file",
              data: base64Pdf,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const textOutput = response.text || "[]";
    
    // Clean potential markdown wrappers if the model didn't follow formatting strictly
    const cleanJson = textOutput
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const elements: ParsedElement[] = JSON.parse(cleanJson);
    if (Array.isArray(elements) && elements.length > 0) {
      return elements;
    }
    throw new Error("Empty elements returned from multimodal parsing");
  } catch (error) {
    console.warn(`[LayoutLoader] Multimodal PDF parsing failed for ${fileName}, falling back to local text extraction:`, error instanceof Error ? error.message : error);
    
    // Resilient fallback: extract text with pages locally
    const { pages, fullText } = await extractTextWithPages(pdfBuffer);
    if (pages && pages.length > 0) {
      return pages.map((p) => ({
        type: "text" as const,
        content: p.text,
        pageNumber: p.pageNumber,
        metadata: {
          title: fileName,
          summary: p.text.slice(0, 200),
        },
      }));
    }

    return [
      {
        type: "text" as const,
        content: fullText || "No extractable text found.",
        pageNumber: 1,
        metadata: {
          title: fileName,
          summary: fullText.slice(0, 200),
        },
      },
    ];
  }
}

/**
 * Splits extracted layout elements into chunks optimized for embeddings.
 * Retains table structures and chart summaries intact, chunking only large text segments.
 */
export async function chunkParsedElements(
  elements: ParsedElement[]
): Promise<Array<{ text: string; pageNumber: number; metadata: any }>> {
  const chunks: Array<{ text: string; pageNumber: number; metadata: any }> = [];

  for (const element of elements) {
    // Keep tables and charts whole to avoid splitting relational structures
    if (element.type === "table" || element.type === "chart" || element.type === "image") {
      chunks.push({
        text: element.content,
        pageNumber: element.pageNumber,
        metadata: {
          chunkType: element.type,
          title: element.metadata?.title || null,
          tableHeaders: element.metadata?.headers || [],
          visualContext: element.metadata?.visualContext || null,
          summary: element.metadata?.summary || null,
        },
      });
    } else {
      // Split large text paragraphs semantically
      const splitTexts = await textSplitter.splitText(element.content);
      splitTexts.forEach((text) => {
        chunks.push({
          text,
          pageNumber: element.pageNumber,
          metadata: {
            chunkType: "text",
            title: element.metadata?.title || null,
          },
        });
      });
    }
  }

  return chunks;
}
