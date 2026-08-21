# Agentic RAG Powered Smart University Operations

---

## Abstract

Modern universities generate and manage vast volumes of heterogeneous institutional documents — academic regulations, examination circulars, administrative policies, syllabi, timetables, and research publications — spread across disparate departments and legacy systems. Retrieving accurate, contextually relevant information from this corpus in response to natural-language queries remains a critical operational challenge. Conventional keyword-based search systems suffer from vocabulary mismatch, lack semantic understanding, and are unable to reason across interrelated documents, leading to information silos and operational inefficiencies.

This project presents **"Agentic RAG Powered Smart University Operations"**, an enterprise-grade, next-generation document intelligence platform that unifies **Retrieval-Augmented Generation (RAG)** with **autonomous multi-agent orchestration** to deliver zero-hallucination, citation-grounded answers to complex university queries. The system is designed to serve as a centralized AI-powered knowledge hub for students, faculty, and administrative staff, transforming how universities access, interpret, and act upon institutional knowledge.

### Hybrid Multi-Channel Retrieval Architecture

At its core, the platform implements a novel **hybrid multi-channel retrieval** pipeline that simultaneously queries three complementary search backends:

1. **Qdrant Vector Search** — performs cosine-similarity semantic search over high-dimensional document embeddings, capturing deep conceptual meaning beyond surface-level keywords.
2. **PostgreSQL BM25 Full-Text Search** — executes classical term-frequency inverse-document-frequency (TF-IDF) keyword ranking using `ts_rank_cd`, ensuring precise lexical matches for domain-specific terminology (e.g., regulation numbers, course codes).
3. **Neo4j Knowledge Graph Traversal** — runs Cypher graph queries to navigate entity–relationship structures (e.g., *Course → Department → Faculty → Regulation*), enabling multi-hop relational reasoning that neither vector nor keyword search can achieve alone.

Candidates from all three channels are mathematically fused using **Reciprocal Rank Fusion (RRF)**, producing a unified, bias-corrected ranking. A local **BGE Cross-Encoder Reranker** (`Xenova/bge-reranker-base`) then applies pairwise attention-based relevance scoring to eliminate false positives and surface the most contextually faithful passages.

### LangGraph-Based Agentic Workflow

Unlike monolithic RAG pipelines, this platform employs a **LangGraph multi-agent state graph** where specialised autonomous agents collaborate in a directed workflow:

- **Analysis Agent** — decomposes the user's natural-language query into structured intent, entities, and temporal constraints.
- **Router Agent** — dynamically selects the optimal retrieval strategy (vector, keyword, graph, or hybrid) based on query classification.
- **Retrieval Agent** — orchestrates parallel search across all backends and applies RRF fusion.
- **Citation Agent** — maps each claim in the generated response to specific source passages, ensuring full traceability.
- **Response Agent** — synthesises a grounded, streaming answer with inline citations and confidence scores.

Additional planning-layer agents — including an **Intent Classifier**, **Goal Recognition Engine**, **Task Decomposer**, **Plan Optimizer**, and **Verification Agent** — enable the system to handle complex multi-step queries (e.g., *"Compare the re-evaluation policy across all departments for autonomous and non-autonomous programs"*) that require decomposition, parallel retrieval, and cross-document synthesis.

### Multimodal Document Ingestion

The ingestion pipeline leverages **Gemini 2.5 Flash vision** for multimodal PDF layout understanding — parsing tables into structured Markdown, converting charts and figures into semantic text summaries, and performing OCR on scanned legacy documents — ensuring that even non-digital university records are fully searchable.

### Real-Time Analytics & Evaluation

A **live analytics dashboard** provides administrators with real-time operational metrics — query volumes, retrieval latencies, source utilisation, and user engagement — computed directly from database events with dynamic date-range filtering and CSV export capabilities. An integrated **LLM-as-a-Judge evaluation engine** continuously scores system performance on recall, faithfulness, and hallucination rates via non-blocking background workers.

### Technology Stack

The platform is built on a modern, production-ready stack: **Next.js 15** (App Router) with **React 19** and **TypeScript** on the frontend; **Python 3** with **FastAPI** and **Uvicorn** powering the Enterprise Tool Runtime (ETR) microservice for agent planning, tool discovery, execution, health monitoring, and audit logging; **PostgreSQL** (Prisma ORM) for relational data; **Qdrant** for vector storage; **Neo4j** for graph-based knowledge representation; **Upstash Redis** for caching; **LangGraph** and **LangChain** (both TypeScript and Python) for agent orchestration; and the **OpenRouter AI Gateway** for multi-model LLM access (GPT-4o-mini, Claude 3.5 Sonnet, Gemini 2.5 Flash) with automatic failover routing.

### Key Contributions

1. A **hybrid retrieval architecture** combining vector, keyword, and graph search with RRF fusion and cross-encoder reranking for superior retrieval accuracy.
2. A **multi-agent agentic workflow** using LangGraph that decomposes, plans, retrieves, verifies, and cites — going beyond single-pass RAG to deliver human-quality, trustworthy answers.
3. A **multimodal ingestion pipeline** capable of understanding PDFs with complex layouts including tables, charts, and scanned images.
4. A **real-time evaluation framework** with LLM-as-a-Judge scoring for continuous quality assurance.
5. **Enterprise-grade design** with multi-tenant isolation, RBAC, audit logging, SSO readiness, and production hardening for institutional deployment.

### Conclusion

The proposed system demonstrates that combining agentic AI orchestration with hybrid multi-modal retrieval can fundamentally transform university operations — reducing information retrieval time from hours to seconds, eliminating hallucinated responses through citation grounding, and providing a single intelligent interface for the entire institutional knowledge base. The platform is designed to be scalable, extensible, and production-ready for deployment across diverse higher-education institutions.

---

**Keywords:** Retrieval-Augmented Generation (RAG), Multi-Agent Systems, LangGraph, Knowledge Graph, Hybrid Search, Reciprocal Rank Fusion, Cross-Encoder Reranking, Smart University, Document Intelligence, LLM Orchestration

---

*Project developed for Engineers Day 2026*
