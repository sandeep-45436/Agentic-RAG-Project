# Enterprise Hybrid Agentic RAG Platform

> Next-generation, zero-hallucination enterprise document intelligence platform combining Vector Search, Full-Text BM25, Knowledge Graph RAG, Reciprocal Rank Fusion (RRF), Cross-Encoder Reranking, and LangGraph Agent Orchestration.

---

## Key Features

- **Hybrid Multi-Channel Retrieval**: Combines Qdrant vector semantic search, PostgreSQL BM25 keyword search, and Neo4j graph path traversal in parallel.
- **Reciprocal Rank Fusion (RRF)**: Merges candidates mathematically across search channels.
- **Local Cross-Encoder Reranking**: Uses HuggingFace BGE cross-encoder (`Xenova/bge-reranker-base`) for exact attention relevance scoring.
- **Multimodal PDF Layout Ingestion**: Gemini 2.5 Flash vision parses PDF tables into Markdown, converts charts into semantic summaries, and performs OCR on scanned pages.
- **LangGraph Agentic Workflow**: Multi-agent state graph (`analysisAgent` → `routerAgent` → `retrievalAgent` → `citationAgent` → `responseAgent`).
- **Retrieval Debug Inspector**: Real-time trace debugging of vector scores, BM25 scores, fusion scores, confidence levels, and latency.
- **100% Real Database Analytics**: Live dashboard metrics calculated directly from Prisma DB events with dynamic date-range filtering (7d, 30d, 90d) and CSV exports.
- **LLM-as-a-Judge Evaluation Engine**: Non-blocking background worker scoring recall, faithfulness, and hallucination rates.

---

## Architecture Flow

```
User Query ──> LangGraph (Analysis & Router Agents)
                   │
                   ├──> Hybrid Retrieval Service
                   │     ├── Qdrant Vector Search (Cosine)
                   │     ├── Postgres BM25 Search (ts_rank_cd)
                   │     └── Neo4j Knowledge Graph (Cypher)
                   │
                   ├──> Reciprocal Rank Fusion (RRF)
                   ├──> BGE Cross-Encoder Reranker
                   └──> Jaccard Context Compression
                                │
                                ▼
                 Streaming Grounded Response + Debug Headers
```

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS v4
- **Databases**: PostgreSQL (Prisma ORM), Qdrant (Vector DB), Neo4j (Knowledge Graph), Upstash Redis (Caching)
- **AI Models & Gateway**: OpenRouter API (`openai/gpt-4o-mini`, `anthropic/claude-3-5-sonnet`, `google/gemini-2.5-flash`), `@xenova/transformers`
- **Agent Framework**: LangGraph (`@langchain/langgraph`), LangChain Core
- **BaaS & Auth**: InsForge SDK (`@insforge/sdk`)

---

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

3. **Set up Environment Variables**:
   Copy `.env.example` to `.env.local` and populate required keys:
   - `OPENROUTER_API_KEY`
   - `QDRANT_URL` & `QDRANT_API_KEY`
   - `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_INSFORGE_URL` & `NEXT_PUBLIC_INSFORGE_ANON_KEY`

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Typecheck**:
   ```bash
   npx tsc --noEmit
   ```

---

## Complete Technical Documentation

For detailed architecture diagrams, API endpoint specifications, service breakdowns, and database schema documentation, see [project_documentation.md](./DOCUMENTATION.md).
