import { VectorPayload } from '@/server/services/vector.service';
import { PageRangeResult } from '@/ai/documents/document-delivery.types';

export class PageRangeResolver {
  public static resolvePages(input: {
    documentId: string;
    matchedChunks: VectorPayload[];
    query: string;
    totalDocPages?: number;
  }): PageRangeResult {
    const { documentId, matchedChunks, totalDocPages } = input;

    const docChunks = matchedChunks.filter(
      (c) => c.documentId === documentId && typeof c.pageNumber === 'number'
    );

    if (docChunks.length === 0) {
      return { pages: [], confidence: 0, reason: 'No matching pages found.' };
    }

    const rawPages = Array.from(new Set(docChunks.map((c) => c.pageNumber as number))).sort(
      (a, b) => a - b
    );

    const sectionRanges: { min: number; max: number }[] = [];
    const sectionGroups = new Map<string, number[]>();

    for (const chunk of docChunks) {
      if (chunk.sectionHeader) {
        const pages = sectionGroups.get(chunk.sectionHeader) || [];
        pages.push(chunk.pageNumber as number);
        sectionGroups.set(chunk.sectionHeader, pages);
      }
    }

    for (const pages of sectionGroups.values()) {
      if (pages.length > 1) {
        sectionRanges.push({ min: Math.min(...pages), max: Math.max(...pages) });
      }
    }

    const finalPages = new Set<number>();

    for (const page of rawPages) {
      finalPages.add(page);
    }

    for (const range of sectionRanges) {
      for (let i = range.min; i <= range.max; i++) {
        finalPages.add(i);
      }
    }

    const sortedSoFar = Array.from(finalPages).sort((a, b) => a - b);
    for (let i = 0; i < sortedSoFar.length - 1; i++) {
      const current = sortedSoFar[i];
      const next = sortedSoFar[i + 1];
      if (next - current <= 2) {
        for (let j = current + 1; j < next; j++) {
          finalPages.add(j);
        }
      }
    }

    let resolvedPages = Array.from(finalPages).sort((a, b) => a - b);
    resolvedPages = resolvedPages.filter(
      (p) => p > 0 && (!totalDocPages || p <= totalDocPages)
    );

    if (resolvedPages.length === 0) {
      return { pages: [], confidence: 0, reason: 'No pages remained after bounds checking.' };
    }

    let confidence = 0.5 + Math.min(docChunks.length * 0.05, 0.3);

    if (sectionRanges.length > 0) {
      confidence += 0.15;
    }

    let gaps = 0;
    for (let i = 0; i < rawPages.length - 1; i++) {
      if (rawPages[i + 1] - rawPages[i] > 2) {
        gaps++;
      }
    }
    confidence -= gaps * 0.05;

    confidence = Math.max(0.0, Math.min(1.0, confidence));
    confidence = Math.round(confidence * 100) / 100;

    const reason = `Resolved ${resolvedPages.length} pages from ${docChunks.length} chunks. Gap filling and section expansion applied.`;

    return {
      pages: resolvedPages,
      confidence,
      reason,
    };
  }

  public static resolveFullDocument(totalPages: number): PageRangeResult {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return {
      pages,
      confidence: 1.0,
      reason: 'Returned full document.',
    };
  }
}
