export type IntentCategory =
  | "GREETING_CONVERSATIONAL"
  | "INFORMATION_RETRIEVAL"
  | "STRUCTURED_DATA_QUERY"
  | "WORKFLOW_ACTION_TRIGGER"
  | "MULTI_STEP_COGNITIVE_GOAL"
  | "DOCUMENT_DELIVERY";

export interface ExtractedEntities {
  departmentCode?: string;
  courseCode?: string;
  gpaThreshold?: number;
  term?: string;
  studentNumber?: string;
  actionType?: string;
  documentType?: string;
}

export interface IntentAnalysisResult {
  category: IntentCategory;
  isFastPath: boolean;
  entities: ExtractedEntities;
  confidence: number;
}

export class IntentClassifier {
  public static classify(queryText: string): IntentAnalysisResult {
    const text = queryText.trim().toLowerCase();
    const entities: ExtractedEntities = {};

    // 1. Entity Extraction Regex Rules
    const deptMatch = text.match(/\b(cs|computer science|math|ee|electrical|physics|bio|chemistry)\b/i);
    if (deptMatch) {
      entities.departmentCode = deptMatch[1].toUpperCase();
    }

    const courseMatch = text.match(/\b([a-z]{2,4}\s*\d{3})\b/i);
    if (courseMatch) {
      entities.courseCode = courseMatch[1].toUpperCase().replace(/\s+/, "");
    }

    const gpaMatch = text.match(/\b(gpa|grade point)\s*(below|<|under|=|>)?\s*(\d\.\d)\b/i);
    if (gpaMatch) {
      entities.gpaThreshold = parseFloat(gpaMatch[3]);
    }

    const termMatch = text.match(/\b(fall|spring|summer)\s*(\d{4})?\b/i);
    if (termMatch) {
      entities.term = termMatch[0].toUpperCase();
    }

    // 2. Intent Classification Rules
    const isGreeting = /^(hi|hello|hey|greetings|thanks|thank you|good morning|good afternoon)\b/i.test(text);
    if (isGreeting && text.split(/\s+/).length <= 4) {
      return {
        category: "GREETING_CONVERSATIONAL",
        isFastPath: true,
        entities,
        confidence: 0.98,
      };
    }

    // 2.1. Document Delivery Detection
    const hasDocumentRequest = /\b(give me|download|send me|get me|retrieve|fetch|provide|extract)\b.*\b(pdf|document|course material|material|pages|handout|ppt|powerpoint|presentation|slides|deck|file)\b/i.test(text)
      || /\b(extract\s+(\d+[\s,\-to]+\d+|pages?)|get pages|get section|download pdf|course pdf|cnip)\b/i.test(text)
      || /\b(\d+[\s,\-to]+\d+\s*pages?)\b/i.test(text)
      || /\b(pages?\s+(\d+[\s,\-to]+\d+|containing|about|on|from|for))\b/i.test(text);
    const hasExplanationRequest = /\b(explain|describe|what is|how does|tell me about|summarize)\b/i.test(text);

    // Extract document type entity
    const docTypeMatch = text.match(/\b(pdf|ppt|powerpoint|presentation|slides|deck|syllabus|course material|material|handbook|handout|notes|textbook)\b/i);
    if (docTypeMatch) {
      entities.documentType = docTypeMatch[1].toUpperCase();
    }

    // Dual request: explain + give PDF → MULTI_STEP_COGNITIVE_GOAL
    if (hasDocumentRequest && hasExplanationRequest) {
      return {
        category: "MULTI_STEP_COGNITIVE_GOAL",
        isFastPath: false,
        entities,
        confidence: 0.95,
      };
    }

    // Pure document delivery request
    if (hasDocumentRequest) {
      return {
        category: "DOCUMENT_DELIVERY",
        isFastPath: false,
        entities,
        confidence: 0.93,
      };
    }

    const hasWorkflow = /\b(email|alert|notify|send|generate pdf|transcript|export)\b/i.test(text);
    const hasDataQuery = /\b(gpa|probation|tuition|balance|unpaid|faculty|professor|courses|student|roster|at\.risk|eligible|ineligible|backlog|risk|failing)\b/i.test(text);
    const hasKnowledge = /\b(policy|policies|rules|handbook|syllabus|regulation|regulations|drop date|deadline|credits|rule|requirement|threshold|minimum|criteria|guideline|fee|fees|condonation|procedure|document|pdf|attendance)\b/i.test(text);

    if (hasWorkflow && (hasDataQuery || hasKnowledge)) {
      return {
        category: "MULTI_STEP_COGNITIVE_GOAL",
        isFastPath: false,
        entities,
        confidence: 0.95,
      };
    }

    if (hasWorkflow) {
      return {
        category: "WORKFLOW_ACTION_TRIGGER",
        isFastPath: false,
        entities,
        confidence: 0.90,
      };
    }

    if (hasKnowledge) {
      return {
        category: "INFORMATION_RETRIEVAL",
        isFastPath: false,
        entities,
        confidence: 0.95,
      };
    }

    if (hasDataQuery) {
      return {
        category: "STRUCTURED_DATA_QUERY",
        isFastPath: false,
        entities,
        confidence: 0.92,
      };
    }

    return {
      category: "MULTI_STEP_COGNITIVE_GOAL",
      isFastPath: false,
      entities,
      confidence: 0.85,
    };
  }
}
