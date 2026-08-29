# Smart University Cognitive Data Platform
## Technical Architecture & Real Code Implementation Specification

> **System Classification**: Multi-Agent Cognitive Platform, Tri-Modal Hybrid RAG & Deterministic Operations Engine  
> **Source Base**: Directly extracted and verified from concrete production code (`/src`, `/prisma`, `/services/python-agent-service`).

---

## 1. Executive System Architecture & Topology

The Smart University Cognitive Data Platform is an enterprise-grade AI system designed for higher education institutions. It bridges unstructured academic documentation (curricula, institutional guidelines, examination regulations) with transactional operational databases (student transcripts, fee registries, attendance records, course schedules, and exam seatings).

```
                      ┌─────────────────────────────────────────────────────────────┐
                      │              Institutional Frontend Portals                 │
                      │  • HOD / Dean Command Center (/hod)                         │
                      │  • Faculty Workspace (/faculty)                             │
                      │  • Enterprise AI Studio (/dashboard)                        │
                      └──────────────────────────────┬──────────────────────────────┘
                                                     │ Next.js 15 App Router / REST / SSE
                                                     ▼
                      ┌─────────────────────────────────────────────────────────────┐
                      │          Authoritative Access & API Gateway Layer           │
                      │  • Pre-Retrieval RBAC & Scoping Filter (DocumentAccessPolicy)│
                      │  • /api/chat (Streaming LangGraph Pipeline)                 │
                      │  • /api/hod/* (Department Analytics & Proposals)            │
                      │  • /api/faculty/* (Timetables, Seating & Documents)         │
                      └──────────────────────────────┬──────────────────────────────┘
                                                     │
                                                     ▼
                      ┌─────────────────────────────────────────────────────────────┐
                      │         Cognitive LangGraph Orchestrator (workflow.ts)      │
                      │  • Query Complexity Router (SIMPLE vs COMPLEX)              │
                      │  • Fast Memory Path (< 30ms) with Automated Fallback        │
                      │  • Unified Planner Node (Single-Pass Goal & Task Planner)   │
                      │  • Dynamic Subsystem Routing & Parallel Merging             │
                      │  • 1800ms SLA Verification Budget Router & Terminal Events  │
                      └──────────┬──────────────────────────────┬───────────────────┘
                                 │                              │
                ┌────────────────┴───────────────┐   ┌──────────┴──────────────────┐
                ▼                                ▼   ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│ Tri-Modal Hybrid RAG Pipeline │ │ Deterministic Decision Engine │ │ Python Enterprise Tool Runtime│
│ • Qdrant Vector Search (Dense)│ │ • Hall Ticket & Exam Engine   │ │   (ETR v3.0.0 FastAPI Micro)  │
│ • PostgreSQL tsvector (BM25)  │ │ • Faculty Workload & Conflict │ │ • Dynamic Tool Discovery      │
│ • Neo4j Graph DB (Knowledge)  │ │ • Student Risk Predictor      │ │ • Execution Context Scoping   │
│ • Reciprocal Rank Fusion (RRF)│ │ • Cognitive Kernel & Policies │ │ • Timeout & Circuit Breakers  │
│ • Local WASM BGE Reranker     │ │ • Timetable Collision Resolver│ │ • Prometheus Metrics & Audits │
│ • Jaccard Context Compression │ │ (Strict Zero-LLM Decisions)   │ └───────────────────────────────┘
└───────────────┬───────────────┘ └──────────────┬────────────────┘
                │                                │
                └────────────────┬───────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           Persistence & Multi-Tenant Data Layer                           │
│  • Multi-Tenant PostgreSQL Database (Prisma ORM with Cascade Isolation)                  │
│  • UniversityDataSourceFactory (PostgreSQL Driver | REST ERP API | Demo Sandbox)          │
│  • Redis / In-Memory Deterministic Session Cache Layer                                    │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cognitive LangGraph Multi-Agent Orchestration

The reasoning runtime is implemented using `@langchain/langgraph` in [`src/ai/graph/workflow.ts`](./src/ai/graph/workflow.ts). It runs under a strict **sub-2000ms latency budget**.

```
[START]
   │
   ▼
[queryComplexityRouterNode] ────────(SIMPLE)────────► [memoryNode] ──(empty prompt)──┐
   │                                                         │                       │ (re-enter)
(COMPLEX)                                                (content)                   │
   │                                                         │                       │
   ▼                                                         ▼                       │
[unifiedPlannerNode] ◄───────────────────────────────────────────────────────────────┘
   │
   ├──────► [knowledgeNode] ──────► [citationNode] ──┐
   │             │                                   │
   │      (path == COMBINED)                         │
   │             │                                   │
   │             ▼                                   │
   │       [databaseNode] ──► [combinedMergeNode] ───┤
   │                                                 │
   ├──────► [databaseNode] ──────────────────────────┤
   ├──────► [workflowNode] ──────────────────────────┤
   └──────► [documentDeliveryNode] ──────────────────┤
                                                     │
                                                     ▼
                                          [verificationBudgetRouter]
                                                     │
                                          ┌──────────┴──────────┐
                                     (< 1800ms)            (>= 1800ms)
                                          │                     │
                                          ▼                     │
                                 [verificationNode]             │
                                          │                     │
                                          └──────────┬──────────┘
                                                     │
                                                     ▼
                                              [responseNode]
                                                     │
                                                     ▼
                                                   [END]
```

### Graph Execution Nodes:
1. **Query Complexity Router (`queryComplexityRouterNode`)**:
   - Classifies queries into `SIMPLE` vs `COMPLEX`.
   - `SIMPLE` queries (greetings, identity, direct conversational memory) route straight to `memoryNode` (latency < 30ms).
   - If `memoryNode` returns empty content, `memoryFallbackRouter` catches the event, emits `SIMPLE_PATH_FALLBACK`, and seamlessly re-enters `unifiedPlannerNode`.
2. **Unified Planner Node (`unifiedPlannerNode`)**:
   - Single-pass goal recognition, intent classification, policy evaluation, and subtask generation.
   - Replaces multi-turn sequential planning latency with deterministic subtask emission.
3. **Subsystem Execution Nodes**:
   - `knowledgeNode`: Executes tri-modal hybrid RAG (Qdrant + BM25 + Neo4j).
   - `databaseNode`: Executes structured Prisma queries against the university relational database.
   - `workflowNode`: Executes deterministic operational domain engines (exam seating, workloads, risk calculations).
   - `documentDeliveryNode`: Delivers direct verified file downloads and syllabus links.
   - `combinedMergeNode`: Synthesizes quantitative SQL results with qualitative policy citations.
4. **Verification Budget Router (`verificationBudgetRouter`)**:
   - Checks cumulative elapsed execution time against the `1800ms` SLA threshold.
   - If elapsed time $\ge 1800\text{ms}$, it dynamically skips `verificationNode` directly to `responseNode` to prevent SLA breaches.
5. **Agentic Multi-Turn Replanning (`AgenticOrchestrator`)**:
   - Handles multi-step dependencies via topological batching (`buildExecutionBatches`).
   - On subtask failure, `generateRecoveryPlan()` creates dynamic recovery routes without aborting user sessions.

---

## 3. Tri-Modal Hybrid Retrieval Engine (12-Stage RAG)

Implemented in [`src/server/services/retrieval.service.ts`](./src/server/services/retrieval.service.ts), the retrieval engine executes 12 coordinated stages:

| Stage # | Pipeline Step | Implementation Service | Technical Action |
| :---: | :--- | :--- | :--- |
| **1** | **Deterministic Cache** | `CacheService` | SHA-256 hash lookup keyed by `organizationId`, `departmentId`, `userRole`, and normalized query. |
| **2** | **Pre-Retrieval RBAC** | `DocumentAccessPolicy` | Strict SQL/vector visibility scoping (`UNIVERSITY`, `COLLEGE`, `DEPARTMENT`, `PRIVATE`). |
| **3** | **Query Rewriting** | `QueryIntelligenceService` | Conversational context injection + generation of 3 expansion variants. |
| **4** | **Dense Vector Search** | `VectorService` (Qdrant) | 1536-dim cosine similarity search across chunk collections. |
| **5** | **Sparse BM25 Search** | `BM25Service` (PostgreSQL) | Native `to_tsvector('english', content)` full-text search with rank weighting. |
| **6** | **Knowledge Graph** | `GraphRetrievalService` (Neo4j)| Traverses prerequisite chains, departmental hierarchies, and course connections. |
| **7** | **Reciprocal Rank Fusion** | `FusionService` | Merges scores mathematically: $\text{RRF}(d) = \sum \frac{w_m}{60 + \text{rank}_m(d)}$. |
| **8** | **Cross-Encoder Rerank** | `RerankService` (WASM BGE) | In-process WebAssembly cross-encoder attention scoring (`Xenova/bge-reranker-base`). |
| **9** | **Context Compression** | `CompressionService` | Jaccard similarity deduplication (prunes chunks with similarity $> 0.75$). |
| **10** | **Synthesis Prompter** | `PromptService` | Assembles multi-document context with inline regulatory IDs and page markers. |
| **11** | **Triad Evaluation** | `EvaluationService` | Asynchronously measures Context Recall, Faithfulness, and Hallucination scores. |
| **12** | **Trace Audit Logging** | `RetrievalLogService` | Persists exact latency profiles, query variants, and candidate metadata. |

---

## 4. Deterministic Institutional Operations & Decision Engines

> **Architectural Rule**: LLMs are never permitted to calculate grades, alter standing, clear fees, or determine exam eligibility. All operational decisions are computed by deterministic TypeScript engines.

### 4.1 Examination & Hall Ticket Decision Engine
- **Files**: [`src/ai/examination/hall-ticket-engine.ts`](./src/ai/examination/hall-ticket-engine.ts), [`src/ai/decision/exam-eligibility-engine.ts`](./src/ai/decision/exam-eligibility-engine.ts)
- **Rules Evaluated**:
  1. *Attendance Threshold*: $\text{Attendance} \ge 75.0\%$. If lower, calculates exact classes required to attain eligibility.
  2. *Fee Clearance*: $\text{Outstanding Balance} \le 0.00$. Attaches `FEE_HOLD` if unpaid dues exist.
  3. *Continuous Assessment*: Validates internal mark completion status.
  4. *Disciplinary Standing*: Verifies student is not under administrative suspension.
- **Output**: Typed `HallTicketDecision` (`ELIGIBLE`, `BLOCKED`, `CONDITIONAL`, or `REQUIRES_APPROVAL`) with policy citations.

### 4.2 Faculty Workload & 3D Timetable Conflict Engine
- **Files**: [`src/ai/faculty/workload-engine.ts`](./src/ai/faculty/workload-engine.ts), [`src/ai/faculty/faculty-conflict-engine.ts`](./src/ai/faculty/faculty-conflict-engine.ts)
- **Capabilities**:
  - Validates teaching hours against statutory caps (Professor: 12h, Associate: 14h, Assistant: 16h).
  - Validates 3D timetable collision freedom across **Rooms $\times$ Faculty $\times$ Sections** across 6-day schedules.
  - Generates balanced invigilation rosters matching exam hall capacities.

### 4.3 Student Academic Risk Predictor
- **File**: [`src/ai/decision/student-risk-predictor.ts`](./src/ai/decision/student-risk-predictor.ts)
- **Risk Metrics**: Evaluates multi-semester SGPA trends ($\Delta\text{SGPA}$), cumulative backlogs, and attendance decline rates to calculate a risk score $[0.0 - 1.0]$ and flag early interventions.

### 4.4 Cognitive Kernel & Policy Engine
- **File**: [`src/ai/kernel/policy-engine.ts`](./src/ai/kernel/policy-engine.ts)
- **Policy Enforcement**:
  - `POL-001`: Minimum 75% attendance for examination access.
  - `POL-002`: Bulk communications ($> 500$ recipients) require Dean/HOD sign-off.
  - `POL-003`: Grade adjustments restricted strictly to authorized Registrar roles.

---

## 5. Multi-Tenant Database Architecture (Prisma ORM)

The relational schema in [`prisma/schema.prisma`](./prisma/schema.prisma) establishes strict tenant isolation across 25+ models:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Multi-Tenant Database Models                              │
├──────────────────────────┬──────────────────────────┬─────────────────────────────────────┤
│ Domain                   │ Primary Models           │ Key Relations & Constraints         │
├──────────────────────────┼──────────────────────────┼─────────────────────────────────────┤
│ 1. Tenancy & Auth        │ Organization, User,      │ Cascade deletes on organizationId;  │
│                          │ Membership, ApiKey,      │ Unique compound [userId, orgId]     │
│                          │ AuditLog                 │                                     │
├──────────────────────────┼──────────────────────────┼─────────────────────────────────────┤
│ 2. Academic Hierarchy    │ College, Department,     │ Organization-scoped unique codes;   │
│                          │ Faculty, Course,         │ Faculty advising relations;         │
│                          │ CourseSection, Student,  │ Section capacities & enrollments    │
│                          │ Enrolment, Facility      │                                     │
├──────────────────────────┼──────────────────────────┼─────────────────────────────────────┤
│ 3. Student Operations    │ AttendanceRecord,        │ Student foreign keys;               │
│                          │ InternalMark,            │ Historical SGPA/CGPA tracking;      │
│                          │ SemesterResult,          │ Hostel & Scholarship profiles       │
│                          │ FinancialAccount         │                                     │
├──────────────────────────┼──────────────────────────┼─────────────────────────────────────┤
│ 4. Examination Ops       │ Examination,             │ Seating coordinates (Hall, Bench,   │
│                          │ ExaminationSchedule,     │ Row, Column, Position);             │
│                          │ ExaminationEligibility,  │ Invigilation workload scores        │
│                          │ InvigilationAssignment,  │                                     │
│                          │ TimetableEntry,          │                                     │
│                          │ ExamSeatingArrangement   │                                     │
├──────────────────────────┼──────────────────────────┼─────────────────────────────────────┤
│ 5. AI Telemetry & RAG    │ KnowledgeBase, Document, │ tsvector full-text search indexes;  │
│                          │ Chunk, RetrievalLog,     │ Triad evaluation score tracking;    │
│                          │ QueryVariant,            │ Token quotas & usage aggregations   │
│                          │ Evaluation, AgentRun,    │                                     │
│                          │ UsageEvent, PlanLimits   │                                     │
└──────────────────────────┴──────────────────────────┴─────────────────────────────────────┘
```

---

## 6. University Data Source Abstraction Layer

Implemented via the Factory Pattern in [`src/server/data-source/data-source-factory.ts`](./src/server/data-source/data-source-factory.ts):

- **`PostgresDataSource`**: Direct Prisma ORM access to production PostgreSQL.
- **`ApiDataSource`**: Secure REST client for third-party university ERPs (Banner, Ellucian, PeopleSoft).
- **`DemoDataSource`**: Preloaded sandbox dataset for offline evaluations, automated unit tests, and demo environments.

---

## 7. Python Enterprise Tool Runtime (ETR v3.0.0 Microservice)

Located in [`services/python-agent-service/`](./services/python-agent-service/):
- **Framework**: FastAPI microservice running on port 8000.
- **Key Modules**:
  - `runtime/registry`: Dynamic tool discovery scoped by user role and department.
  - `runtime/execution`: Tool execution wrapped in exponential-backoff retries, timeouts, and circuit-breakers.
  - `runtime/policy`: Strict RBAC & ABAC authorization policies.
  - `runtime/metrics`: Prometheus-compatible latency and execution counters.
  - `runtime/audit`: Security audit logger tracking parameter hashes and caller IDs.

---

## 8. Institutional Frontend Portals

Built with **Next.js 15 (App Router)**, **React 19**, and **Tailwind CSS**:

1. **HOD & Dean Command Center (`/hod/*`)**:
   - Real-time Department Health Scorecard (Academic, Attendance, Research).
   - "What Changed?" semester-over-semester delta tracking.
   - Action Proposal Review (attendance condonations, fee holds, exam waivers).
   - Automated Syllabus Comparison (AST & semantic diffing).
2. **Faculty Workspace (`/faculty/*`)**:
   - Weekly teaching schedules and room allocations.
   - Invigilation rosters with hall seating maps.
   - Course material distribution with RBAC enforcement.
3. **Enterprise AI Studio (`/dashboard/*`)**:
   - Real-time streaming conversational assistant with execution trace inspection.
   - Retrieval Debugger displaying vector, BM25, RRF, and reranker scores.
   - Knowledge Base document ingestion (PDF, DOCX, TXT) with layout parsing.
   - Token usage and cost aggregation analytics.

---

## 9. Getting Started & Development Setup

### 9.1 Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL instance with `pgvector` enabled
- Qdrant Vector Database
- Neo4j Graph Database (Optional for Knowledge Graph features)

### 9.2 Environment Configuration
Create `.env.local` in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smart_university"

# AI Gateway & LLMs
OPENROUTER_API_KEY="your_openrouter_api_key"

# Vector Database (Qdrant)
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""

# Knowledge Graph (Neo4j)
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your_password"

# Backend & BaaS
NEXT_PUBLIC_INSFORGE_URL="https://your-app.region.insforge.app"
NEXT_PUBLIC_INSFORGE_ANON_KEY="your_anon_key"

# University Data Source Mode (postgres | api | demo)
UNIVERSITY_DATA_SOURCE="postgres"
```

### 9.3 Installation & Execution

```bash
# 1. Install Node.js dependencies
npm install

# 2. Generate Prisma ORM client & sync schema
npx prisma generate
npx prisma db push

# 3. Start Python Enterprise Tool Runtime (in a separate terminal)
cd services/python-agent-service
pip install -r requirements.txt
python main.py

# 4. Start Next.js Development Server
cd ../..
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 10. Automated Architectural PDF Documentation

A pre-rendered PDF document is available directly in the repository:
- **Root PDF**: [`Smart_University_Platform_Architecture_and_Implementation.pdf`](./Smart_University_Platform_Architecture_and_Implementation.pdf)
- **Public Web PDF**: [`public/Smart_University_Platform_Architecture_and_Implementation.pdf`](./public/Smart_University_Platform_Architecture_and_Implementation.pdf)

To regenerate the PDF at any time:
```bash
python .gemini/antigravity/brain/7baeb7c2-3a3e-4911-bde8-741a30cfcb7a/scratch/generate_architecture_pdf.py
```
