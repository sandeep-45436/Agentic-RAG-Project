/**
 * Academic Search, Acronym & Concept Expansion Engine
 * Provides case-insensitive normalization, academic acronym mapping,
 * typo tolerance, and synonym expansion for university document retrieval.
 */

// Common university acronyms to full subject names and synonyms
export const ACADEMIC_CONCEPT_MAP: Record<string, string[]> = {
  dbms: [
    "database management systems",
    "database management system",
    "database management",
    "database",
    "rdbms",
    "sql",
    "relational database",
  ],
  cnip: [
    "computer networks and ip",
    "computer networks",
    "computer network",
    "networking",
    "tcp",
    "tcp ip",
    "protocols",
    "cnip ppt",
    "cnip lab",
  ],
  cn: [
    "computer networks",
    "computer network",
    "networking",
    "cnip",
    "network protocols",
  ],
  os: [
    "operating systems",
    "operating system",
    "linux",
    "unix",
    "process scheduling",
    "virtual memory",
    "kernel",
  ],
  ai: [
    "artificial intelligence",
    "intelligent systems",
    "machine intelligence",
    "neural networks",
    "expert systems",
    "ai units",
  ],
  ml: [
    "machine learning",
    "supervised learning",
    "unsupervised learning",
    "data science",
  ],
  dsa: [
    "data structures and algorithms",
    "data structures",
    "algorithms",
    "ds",
    "stacks",
    "trees",
    "graphs",
  ],
  ds: [
    "data structures",
    "data structures and algorithms",
    "dsa",
    "arrays",
    "linked list",
  ],
  daa: [
    "design and analysis of algorithms",
    "analysis of algorithms",
    "algorithms",
    "cs401",
    "dynamic programming",
    "greedy algorithms",
  ],
  cs401: [
    "advanced algorithms",
    "algorithms",
    "daa",
    "syllabus exam schedule",
  ],
  wt: [
    "web technologies",
    "web technology",
    "html",
    "css",
    "javascript",
    "fullstack",
  ],
  cd: [
    "compiler design",
    "compilers",
    "lexical analysis",
    "syntax analysis",
    "parsing",
  ],
  coa: [
    "computer organization and architecture",
    "computer organization",
    "computer architecture",
  ],
  flat: [
    "formal languages and automata theory",
    "theory of computation",
    "toc",
    "automata",
    "turing machine",
  ],
  toc: [
    "theory of computation",
    "formal languages and automata theory",
    "flat",
    "automata",
  ],
  oops: [
    "object oriented programming",
    "oop",
    "java",
    "c++",
    "classes and objects",
  ],
  se: [
    "software engineering",
    "software design",
    "sdlc",
    "agile",
  ],
  cns: [
    "cryptography and network security",
    "network security",
    "cryptography",
    "cyber security",
  ],
  iot: [
    "internet of things",
    "embedded systems",
    "sensors",
    "microcontrollers",
  ],
  cloud: [
    "cloud computing",
    "aws",
    "azure",
    "distributed systems",
  ],
  handbook: [
    "academic handbook",
    "regulations",
    "rules",
    "student handbook",
  ],
  regulations: [
    "academic regulations",
    "rules",
    "handbook",
    "ordinance",
    "curriculum",
  ],
};

// Common student spelling typos and misspellings to correct
const TYPO_CORRECTIONS: Record<string, string> = {
  maanagement: "management",
  mangement: "management",
  managment: "management",
  managemnt: "management",
  databaes: "database",
  datbase: "database",
  databse: "database",
  databaase: "database",
  algoritm: "algorithm",
  algotithm: "algorithm",
  algoritham: "algorithm",
  algorithems: "algorithms",
  syllubas: "syllabus",
  sylabus: "syllabus",
  syllabous: "syllabus",
  syllabs: "syllabus",
  netwrok: "network",
  netwrk: "network",
  netwroks: "networks",
  operatng: "operating",
  oprating: "operating",
  artifical: "artificial",
  inteligence: "intelligence",
  intelegence: "intelligence",
  strucutre: "structure",
  strucutres: "structures",
  structres: "structures",
  complier: "compiler",
  regulatons: "regulations",
  regulaions: "regulations",
  manuall: "manual",
  manul: "manual",
  scheudle: "schedule",
  skedule: "schedule",
};

/**
 * Normalizes a raw search string:
 * 1. Lowercases completely (case-insensitive)
 * 2. Corrects common typos
 * 3. Strips document extension noise (e.g., .pdf, pdf, docx, document)
 */
export function normalizeSearchTerm(raw: string): string {
  if (!raw) return "";

  // Lowercase and trim
  let text = raw.toLowerCase().trim();

  // Strip file extensions
  text = text.replace(/\.(pdf|docx?|pptx?|txt)$/i, "");

  // Normalize separators (underscores, hyphens, periods) into spaces
  text = text.replace(/[_\-.]+/g, " ");

  // Tokenize and correct typos
  const tokens = text.split(/\s+/).map((tok) => {
    return TYPO_CORRECTIONS[tok] || tok;
  });

  return tokens.join(" ").trim();
}

export interface SearchExpansionResult {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  expansions: string[];
  matchedConcept: string | null;
}

/**
 * Expands a query into all related search terms and synonyms
 * regardless of original casing or minor typos.
 *
 * Example:
 *  Input: "database maanagement pdf"
 *  Result: {
 *    normalizedQuery: "database management",
 *    expansions: ["database management", "dbms", "database management systems", "database", "rdbms", "sql"],
 *    matchedConcept: "DBMS (Database Management Systems)"
 *  }
 */
export function getSearchExpansions(rawQuery: string): SearchExpansionResult {
  const normalized = normalizeSearchTerm(rawQuery);
  if (!normalized) {
    return {
      rawQuery,
      normalizedQuery: "",
      tokens: [],
      expansions: [],
      matchedConcept: null,
    };
  }

  // Remove common filler words like "pdf", "file", "download", "notes", "material"
  const cleanSearch = normalized
    .replace(/\b(pdf|file|download|notes|material|doc|document)\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");

  const queryToMatch = cleanSearch || normalized;
  const tokens = queryToMatch.split(" ").filter((t) => t.length > 0);

  const expansionSet = new Set<string>();
  expansionSet.add(normalized);
  if (queryToMatch !== normalized) {
    expansionSet.add(queryToMatch);
  }

  // Add individual tokens (length >= 2)
  tokens.forEach((t) => {
    if (t.length >= 2) expansionSet.add(t);
  });

  let matchedConcept: string | null = null;

  // 1. Direct acronym match (e.g. "dbms", "cnip", "os", "ai")
  if (ACADEMIC_CONCEPT_MAP[queryToMatch]) {
    matchedConcept = `${queryToMatch.toUpperCase()} (${ACADEMIC_CONCEPT_MAP[queryToMatch][0]})`;
    ACADEMIC_CONCEPT_MAP[queryToMatch].forEach((term) => expansionSet.add(term));
  } else {
    // 2. Phrase or sub-token match in concept map
    for (const [acronym, synonyms] of Object.entries(ACADEMIC_CONCEPT_MAP)) {
      // Check if query matches acronym
      if (tokens.includes(acronym)) {
        matchedConcept = `${acronym.toUpperCase()} (${synonyms[0]})`;
        expansionSet.add(acronym);
        synonyms.forEach((s) => expansionSet.add(s));
      }

      // Check if query matches a full synonym phrase
      for (const syn of synonyms) {
        if (
          queryToMatch === syn ||
          (queryToMatch.length >= 4 && (queryToMatch.includes(syn) || syn.includes(queryToMatch)))
        ) {
          matchedConcept = `${acronym.toUpperCase()} (${synonyms[0]})`;
          expansionSet.add(acronym);
          synonyms.forEach((s) => expansionSet.add(s));
          break;
        }
      }
    }
  }

  return {
    rawQuery,
    normalizedQuery: queryToMatch,
    tokens,
    expansions: Array.from(expansionSet),
    matchedConcept,
  };
}

/**
 * Checks whether a search term matches within text safely.
 * For long terms (4+ chars), substring match is used.
 * For short terms (<= 3 chars, e.g. "ai", "os", "se", "cn"), whole-word boundary
 * is enforced to avoid matching inside unrelated words like "domain", "database", "email".
 */
export function matchesWord(text: string, term: string): boolean {
  if (!text || !term) return false;
  const cleanTerm = term.toLowerCase().trim();
  const cleanText = text.toLowerCase().trim();
  if (!cleanTerm || !cleanText) return false;

  if (cleanTerm.length >= 4) {
    return cleanText.includes(cleanTerm);
  }

  // Word boundary match for short terms
  const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return regex.test(cleanText);
}

/**
 * Client-side document score calculator for instant, zero-latency filtering
 */
export function scoreDocumentMatch(
  doc: {
    fileName: string;
    departmentCode?: string | null;
    courseCode?: string | null;
  },
  searchExpansions: SearchExpansionResult
): { score: number; isMatch: boolean; highlightReason: string | null } {
  if (!searchExpansions.normalizedQuery) {
    return { score: 100, isMatch: true, highlightReason: null };
  }

  const normFileName = normalizeSearchTerm(doc.fileName);
  const normDept = (doc.departmentCode || "").toLowerCase().trim();
  const normCourse = (doc.courseCode || "").toLowerCase().trim();

  let highestScore = 0;
  let reason: string | null = null;

  // Check each expanded term
  for (const term of searchExpansions.expansions) {
    if (!term || term.length < 2) continue;

    // Check with word boundary protection
    if (matchesWord(normFileName, term)) {
      const isExactAcronym =
        searchExpansions.matchedConcept &&
        matchesWord(normFileName, term.toLowerCase());
      const score = term === searchExpansions.normalizedQuery ? 100 : 85;
      if (score > highestScore) {
        highestScore = score;
        reason = isExactAcronym
          ? `Matched concept: ${term.toUpperCase()}`
          : `Matched: "${term}"`;
      }
    }

    // Match in course code
    if (normCourse && (normCourse === term || matchesWord(normCourse, term))) {
      const score = 90;
      if (score > highestScore) {
        highestScore = score;
        reason = `Course match: ${doc.courseCode}`;
      }
    }

    // Match in department code only if user explicitly typed that department
    if (normDept && term === normDept && searchExpansions.tokens.includes(term)) {
      const score = 70;
      if (score > highestScore) {
        highestScore = score;
        reason = `Department: ${doc.departmentCode}`;
      }
    }
  }

  // Multi-token match across filename
  if (searchExpansions.tokens.length > 1) {
    const allTokensMatch = searchExpansions.tokens.every((tok) =>
      matchesWord(normFileName, tok)
    );
    if (allTokensMatch && highestScore < 80) {
      highestScore = 80;
      reason = `All search terms matched`;
    }
  }

  return {
    score: highestScore,
    isMatch: highestScore > 0,
    highlightReason: reason,
  };
}
