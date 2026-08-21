import { Role } from "@/ai/tools/tool-registry";

// Operations the Document Delivery Agent supports
export type DocumentOperation =
  | "GET_FULL_DOCUMENT"
  | "GET_PAGES"
  | "GET_SECTION"
  | "SEARCH_AND_EXTRACT"
  | "COMBINE_DOCUMENTS";

// Request from LLM tool call
export interface DocumentDeliveryRequest {
  operation: DocumentOperation;
  documentId?: string;
  courseCode?: string;
  pages?: number[];
  section?: string;
  query?: string;
  organizationId: string;
  userId: string;
  userRole: Role;
}

// Result returned to the graph state
export interface DocumentDeliveryResult {
  artifactId: string;
  operation: DocumentOperation;
  documentId: string;
  documentName: string;
  pages: number[];
  totalPages: number;
  downloadUrl: string;
  signedUrlExpiresAt: string;
  provenance: DocumentProvenance;
  confidence: number;
}

// Provenance metadata
export interface DocumentProvenance {
  artifactId: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  documentVersion: number;
  docHash: string;
  originalPages: number[];
  chunkIds: string[];
  organizationId: string;
  generatedAt: string;
  accessLevel: "PUBLIC" | "ENROLLED_COURSE" | "RESTRICTED";
}

// Page range resolver output
export interface PageRangeResult {
  pages: number[];
  confidence: number;
  reason: string;
  sectionBoundaries?: { start: number; end: number; header: string }[];
}

// Access control check result
export interface DocumentAccessCheckResult {
  allowed: boolean;
  reason: string;
  accessLevel: "PUBLIC" | "ENROLLED_COURSE" | "RESTRICTED";
}
