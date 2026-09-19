/**
 * starter-workspaces.ts — Curated Academic Research Workspaces for NexusIQ
 *
 * Provides ready-to-synthesize institutional research collections for students:
 * 1. Autonomous Agentic RAG & Graph Fusion Architectures (CSE / AI&DS)
 * 2. Low-Power RISC-V SoC Architecture & AI Coprocessors (ECE / VLSI)
 * 3. Decentralized Drone Swarm Coordination & Mesh Networking (MECH / Robotics)
 * 4. Autonomous University Academic Regulations & Engineering Ordinance (Academic)
 */

export interface StarterSource {
  id: string;
  documentId: string;
  fileName: string;
  status: "ACTIVE";
  isStale: boolean;
  errorMessage: null;
  updatedAt: string;
  textContent: string;
  authors: string;
  year: number;
  venue: string;
  doi: string;
}

export interface StarterWorkspace {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  provider: string;
  status: string;
  totalSources: number;
  staleSources: number;
  createdAt: string;
  updatedAt: string;
  department: string;
  sources: StarterSource[];
}

export const STARTER_WORKSPACES: StarterWorkspace[] = [
  {
    id: "ws-starter-agentic-rag",
    organizationId: "org-academic-default",
    title: "Autonomous Agentic RAG & Graph Fusion Architectures",
    description: "Multi-hop vector retrieval, Neo4j knowledge graphs, and reflective self-correction agents for zero-hallucination institutional QA.",
    provider: "gemini",
    status: "ACTIVE",
    totalSources: 3,
    staleSources: 0,
    createdAt: new Date("2026-01-15T09:00:00Z").toISOString(),
    updatedAt: new Date().toISOString(),
    department: "Computer Science & Engineering",
    sources: [
      {
        id: "src-rag-01",
        documentId: "doc-rag-01",
        fileName: "ALITS_Agentic_RAG_Design_Spec.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-01T10:00:00Z").toISOString(),
        authors: "Dr. K. S. Rao, Prof. A. V. Ramanathan, S. Patel",
        year: 2025,
        venue: "IEEE Transactions on Knowledge and Data Engineering (TKDE)",
        doi: "10.1109/TKDE.2025.3489112",
        textContent: `
# Specification for Hybrid Agentic Retrieval-Augmented Generation (Agentic RAG)
Authors: Dr. K. S. Rao, Prof. A. V. Ramanathan, S. Patel (Department of Computer Science & Engineering)

1. Executive Abstract
Traditional Dense Retrieval-Augmented Generation (Dense RAG) suffers from semantic drift and catastrophic context failure when confronted with multi-hop institutional reasoning. In this paper, we specify the ALITS Agentic RAG architecture incorporating an autonomous LangGraph orchestration state machine, Neo4j knowledge graph topology traversal, and a verifiable token-grounding firewall.

2. Architecture & State Graph
The system operates as a 5-stage directed acyclic graph:
- Router Node: Dispatches queries across Dense Vector Index (Qdrant HNSW cosine metric) or Entity Relational Traversal (Neo4j Cypher engine).
- Retrieval Node: Executes top-k=5 nearest-neighbor extraction with reciprocal rank fusion (RRF) parameterized by k_rrf = 60.
- Grounding Verifier Node: Assesses entailment probability P(H | E) between candidate claims and source citations.
- Self-Correction Node: Triggers iterative query reformulation if citation density falls below 1.2 citations per 100 generated tokens.
- Synthesis Node: Emits structured markdown with explicit [Doc: fileName] grounding badges.

3. Mathematical Formulation
Let Q denote the incoming user query and D = {d_1, d_2, ..., d_N} be the authorized document corpus. The hybrid retrieval scoring function is given by:
S_{hybrid}(d_i, Q) = \\lambda \\cdot \\cos(\\mathbf{e}_Q, \\mathbf{e}_{d_i}) + (1 - \\lambda) \\cdot \\text{BM25}(Q, d_i) + \\gamma \\sum_{r \\in \\mathcal{R}} \\mathbb{I}(e_Q \\to e_{d_i})
where \\lambda = 0.65 represents the vector-lexical balancing weight and \\gamma = 0.35 scales multi-hop relational path weights across knowledge graph edges.

4. Empirical Results & Hallucination Mitigation
Empirical evaluation across 2,400 university policy queries demonstrates:
- Grounded Faithfulness Score: 98.4% (vs 74.2% for naive cosine RAG).
- Multi-hop traversal latency: Mean 182ms (P99: 340ms).
- Zero hallucination across protected academic ordinances and grading regulations.
        `.trim(),
      },
      {
        id: "src-rag-02",
        documentId: "doc-rag-02",
        fileName: "Knowledge_Graph_Retrieval_Benchmark.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-04T14:30:00Z").toISOString(),
        authors: "M. Chen, L. Thorne, Dr. P. S. Reddy",
        year: 2025,
        venue: "ACM International Conference on Information and Knowledge Management (CIKM)",
        doi: "10.1145/3627673.3679801",
        textContent: `
# Multi-Hop Evaluation Benchmark for Graph-Augmented Vector Retrieval
Authors: M. Chen, L. Thorne, Dr. P. S. Reddy (AI & Data Science Laboratory)

1. Introduction & Problem Statement
Vector similarity search alone cannot resolve relational queries such as "Which faculty members who teach Distributed Systems also advise undergraduate theses on consensus algorithms?". Such queries require graph neighborhood expansion rather than isolated chunk embedding proximity.

2. Benchmark Datasets & Metrics
We evaluate three pipeline topologies:
A. Pure Dense RAG (1536-dim text-embedding-3-small)
B. Sparse + Dense Ensemble (BM25 + Dense)
C. Knowledge Graph Vector Fusion (Neo4j GraphRAG + Qdrant)

Evaluation Metrics:
- Exact Match (EM) %
- F1 Token Grounding Score
- Average Hops Explored
- Index Construction Overhead (CPU Hours)

3. Comparative Benchmark Results
Pipeline A (Dense): EM = 58.3%, F1 = 68.7%, Failure rate on 3-hop questions = 41.2%.
Pipeline B (Ensemble): EM = 69.1%, F1 = 76.4%, Failure rate on 3-hop questions = 29.8%.
Pipeline C (Graph-Vector Fusion): EM = 84.2%, F1 = 91.6%, Failure rate on 3-hop questions = 4.3%.

4. Identified Gaps & Open Challenges
- Cold-start graph extraction requires expensive LLM triplet generation.
- Dynamic entity synchronization during real-time document modification introduces temporal staleness.
        `.trim(),
      },
      {
        id: "src-rag-03",
        documentId: "doc-rag-03",
        fileName: "Reflective_LLM_Synthesizer_Evaluation.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-10T11:15:00Z").toISOString(),
        authors: "Prof. S. R. Bharadwaj, T. A. Venkatesh",
        year: 2026,
        venue: "Association for Computational Linguistics (ACL Rolling Review)",
        doi: "10.18653/v1/2026.acl-research.49",
        textContent: `
# Reflective Synthesis and Hallucination Suppression in Campus LLMs
Authors: Prof. S. R. Bharadwaj, T. A. Venkatesh

1. Context & Motivation
Large Language Models deployed in higher education administrative portals must never provide ungrounded assumptions regarding student credits, exam eligibility, or graduation prerequisites. This study quantifies the impact of self-reflective verification loops during synthesis.

2. Verification Loss Formulation
We define the synthesis objective function as:
\mathcal{L}_{total} = \mathcal{L}_{CE}(y, \hat{y}) + \alpha \mathcal{L}_{grounding}(\hat{y}, \mathcal{D}_{auth}) + \beta \mathcal{D}_{KL}(P_{model} \parallel P_{reference})
Where \mathcal{L}_{grounding} penalizes named entities in \hat{y} that do not possess exact substring or lemmatized provenance in authorized source corpus \mathcal{D}_{auth}.

3. Key Findings
- Temperature sensitivity: At temperature T=0.2, citation fidelity reaches 99.1%. At T=0.7, creative synthesis improves podcast engagement but factual error rate rises to 6.4%.
- Two-pass reflection reduces citation attribution errors by 82.5% at an amortized latency cost of 240ms per query.
        `.trim(),
      },
    ],
  },
  {
    id: "ws-starter-riscv-vlsi",
    organizationId: "org-academic-default",
    title: "Next-Gen RISC-V SoC Architecture & AI Coprocessors",
    description: "Hardware-software co-design for energy-efficient edge inferencing, custom vector extensions, and thermal dissipation modeling.",
    provider: "gemini",
    status: "ACTIVE",
    totalSources: 3,
    staleSources: 0,
    createdAt: new Date("2026-01-18T10:00:00Z").toISOString(),
    updatedAt: new Date().toISOString(),
    department: "Electronics & Communication Engineering",
    sources: [
      {
        id: "src-vlsi-01",
        documentId: "doc-vlsi-01",
        fileName: "RISCV_Vector_Extension_ISA_Spec.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-05T08:00:00Z").toISOString(),
        authors: "Dr. N. Sundaram, E. K. Vasudevan",
        year: 2025,
        venue: "IEEE Micro / Design Automation Conference (DAC)",
        doi: "10.1109/MM.2025.3401128",
        textContent: `
# Architectural Specification of RVV 1.0 Vector Extensions for Edge Inference
Authors: Dr. N. Sundaram, E. K. Vasudevan (VLSI & Embedded Systems Laboratory)

1. Executive Abstract
The open-source RISC-V ISA (RV64GCV) provides scalable vector processing capabilities for low-power edge neural network inference. We document register configurations, chaining behaviors, and SIMD pipeline latency profiles across 256-bit vector registers (VLEN=256, SEW=32).

2. Pipeline Datapath & Vector Register Allocation
- Vector Register File (VRF): 32 vector registers (v0 - v31) with configurable grouping factor LMUL \in {1/8, 1/4, 1/2, 1, 2, 4, 8}.
- Vector Execution Units: 4 parallel FMA (Fused Multiply-Accumulate) pipelines operating at 1.2 GHz clock frequency in TSMC 16nm FinFET.
- Dynamic energy dissipation: 14.2 mW/GFLOP under INT8 matrix multiplication workloads.

3. Mathematical Formulation of Pipeline Latency
The total latency for a vector convolution layer with batch size B and kernel dimensions K \times K is modeled by:
T_{exec} = \left\lceil \frac{H_{out} \cdot W_{out} \cdot C_{out}}{VLEN / SEW} \right\rceil \cdot \left( \tau_{issue} + \frac{K^2 \cdot C_{in}}{LMUL} \cdot \tau_{fma} \right) + \tau_{stall}
where \tau_{fma} = 2 clock cycles under pipelined vector chaining.
        `.trim(),
      },
      {
        id: "src-vlsi-02",
        documentId: "doc-vlsi-02",
        fileName: "Edge_Neural_Accelerator_Thermal_Study.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-08T16:20:00Z").toISOString(),
        authors: "P. Mukherjee, Dr. R. Ananthakrishnan",
        year: 2025,
        venue: "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
        doi: "10.1109/TCAD.2025.3398712",
        textContent: `
# Thermal Dissipation and DVFS Scheduling in Sub-5W Edge Neural Accelerators
Authors: P. Mukherjee, Dr. R. Ananthakrishnan

1. Introduction
Edge processors embedded in autonomous IoT nodes face stringent thermal throttling boundaries (<75°C junction temperature). We evaluate Dynamic Voltage and Frequency Scaling (DVFS) algorithms to prevent thermal runaway while sustaining real-time inference deadlines (30 FPS).

2. Heat Transfer Model
The chip thermal profile follows the lumped RC thermal network:
C_{th} \frac{dT(t)}{dt} = P_{dynamic}(t) + P_{static}(T) - \frac{T(t) - T_{ambient}}{R_{th}}
Where static leakage power follows the exponential temperature dependency:
P_{static}(T) = V_{dd} \cdot I_{leak0} \cdot e^{\frac{q(V_{gs} - V_{th})}{n k_B T}}

3. Experimental Results
- Implementing proactive thermal throttling reduces peak junction temperature by 14.8°C with negligible (<3.2%) FPS throughput penalty.
- Sleep-state power gating achieves 98.6% leakage reduction during idle inter-frame periods.
        `.trim(),
      },
      {
        id: "src-vlsi-03",
        documentId: "doc-vlsi-03",
        fileName: "Hardware_Security_Enclave_Architecture.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-12T12:00:00Z").toISOString(),
        authors: "S. Swaminathan, Dr. K. M. Balaji",
        year: 2026,
        venue: "IEEE Symposium on Security and Privacy (S&P Workshops)",
        doi: "10.1109/SPW62444.2026.00031",
        textContent: `
# Physical Unclonable Function (PUF) Enclaves for Embedded RISC-V Systems
Authors: S. Swaminathan, Dr. K. M. Balaji

1. Abstract & Scope
To protect deep learning model weights and biometric identification keys against side-channel analysis, we implement an isolated hardware cryptographic enclave with SRAM PUF key generation and zero-overhead memory encryption.

2. Hardware Isolation Primitives
- Physical Memory Protection (PMP): 16 programmable address regions with privilege level enforcement (M-mode vs U-mode).
- AES-256-XTS cryptographic bus cipher engine operating at wire-speed with 1-cycle pipeline overhead.
- Differential Power Analysis (DPA) countermeasures utilizing randomized clock jitter and complementary dynamic logic.
        `.trim(),
      },
    ],
  },
  {
    id: "ws-starter-drone-swarm",
    organizationId: "org-academic-default",
    title: "Decentralized Drone Swarm Coordination & Ad-Hoc Mesh Protocols",
    description: "Byzantine fault-tolerant consensus, dynamic obstacle avoidance via artificial potential fields, and low-latency 802.11s mesh networking.",
    provider: "gemini",
    status: "ACTIVE",
    totalSources: 3,
    staleSources: 0,
    createdAt: new Date("2026-01-20T11:00:00Z").toISOString(),
    updatedAt: new Date().toISOString(),
    department: "Mechanical & Robotics Engineering",
    sources: [
      {
        id: "src-drone-01",
        documentId: "doc-drone-01",
        fileName: "Swarm_Collision_Avoidance_Potential_Fields.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-02T09:40:00Z").toISOString(),
        authors: "Dr. V. K. Nambiar, A. Sengupta, G. Prakash",
        year: 2025,
        venue: "IEEE Transactions on Robotics (T-RO)",
        doi: "10.1109/TRO.2025.3412980",
        textContent: `
# Distributed Artificial Potential Field Navigation for Large-Scale Aerial Swarms
Authors: Dr. V. K. Nambiar, A. Sengupta, G. Prakash (Robotics & Autonomous Systems Group)

1. Executive Overview
Autonomous multi-rotor swarms navigating cluttered 3D urban canyons require decentralized, O(1) collision avoidance algorithms that do not depend on centralized trajectory coordination. We present a Modified Artificial Potential Field (M-APF) algorithm eliminating local minima traps.

2. Mathematical Formulation
The net force acting on agent i with position \mathbf{p}_i and velocity \mathbf{v}_i is:
\mathbf{F}_{net, i} = \mathbf{F}_{att, i}(\mathbf{p}_{goal}) + \sum_{j \in \mathcal{N}_i} \mathbf{F}_{rep, ij}(\mathbf{p}_j) + \sum_{k \in \mathcal{O}} \mathbf{F}_{obs, ik}(\mathbf{p}_k)
Where repulsive force decays quadratically with separation distance d_{ij}:
\mathbf{F}_{rep, ij} = \begin{cases} k_{rep} \left( \frac{1}{d_{ij}} - \frac{1}{d_0} \right) \frac{1}{d_{ij}^2} \hat{\mathbf{r}}_{ij} & \text{if } d_{ij} \le d_0 \\ 0 & \text{otherwise} \end{cases}

3. Swarm Flocking Stability
Using Lyapunov candidate function V(\mathbf{x}) = \frac{1}{2}\sum_i m_i \|\mathbf{v}_i\|^2 + \frac{1}{2}\sum_i \sum_{j \ne i} U_{ij}(\mathbf{p}_i, \mathbf{p}_j), we prove asymptotic stability and collision-free flocking under communication radii R_c \ge 2.5 d_0.
        `.trim(),
      },
      {
        id: "src-drone-02",
        documentId: "doc-drone-02",
        fileName: "AdHoc_Mesh_Routing_Low_Latency.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-07T13:10:00Z").toISOString(),
        authors: "T. C. Mathew, Dr. H. L. Srinivas",
        year: 2025,
        venue: "IEEE/ACM Transactions on Networking (ToN)",
        doi: "10.1109/TNET.2025.3400192",
        textContent: `
# Low-Latency Ad-Hoc 802.11s Mesh Protocol for Micro-UAV Telemetry
Authors: T. C. Mathew, Dr. H. L. Srinivas

1. Abstract
Telemetry and obstacle sharing across high-mobility aerial nodes require ultra-reliable low-latency communication (URLLC). We benchmark Hybrid Wireless Mesh Protocol (HWMP) enhancements with predictive link-quality estimation based on Kalman-filtered Doppler shifts.

2. Metric Analysis
- Packet Delivery Ratio (PDR): 99.4% at swarm velocities up to 18 m/s.
- Average end-to-end hop latency: 4.8 ms across 5 mesh relay hops.
- Route re-convergence time during node drop: 28 ms.
        `.trim(),
      },
      {
        id: "src-drone-03",
        documentId: "doc-drone-03",
        fileName: "Byzantine_Swarm_Consensus_Protocol.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-14T15:00:00Z").toISOString(),
        authors: "R. D. Deshmukh, Dr. A. K. Choudhury",
        year: 2026,
        venue: "Journal of Autonomous Agents and Multi-Agent Systems (JAAMAS)",
        doi: "10.1007/s10458-026-09612-4",
        textContent: `
# Lightweight Byzantine Quorum Consensus for Autonomous Robotic Swarms
Authors: R. D. Deshmukh, Dr. A. K. Choudhury

1. Abstract & Threat Model
In adversarial or GPS-denied environments, compromised drone nodes may broadcast spoofed waypoint coordinates or malicious telemetry. We introduce SwarmPBFT, a cryptographic leader election and consensus protocol resilient against f < n/3 Byzantine faulty nodes.

2. Quorum Consensus Phases
1. Pre-Prepare: Leader broadcasts timestamped waypoint assignment signed with Ed25519 key.
2. Prepare: Nodes verify cryptographic signature and broadcast Prepare vote to neighborhood.
3. Commit: Upon receiving 2f + 1 valid Prepare votes, node transitions to trajectory execution.
        `.trim(),
      },
    ],
  },
  {
    id: "ws-starter-academic-ordinance",
    organizationId: "org-academic-default",
    title: "Autonomous University Academic Regulations & Engineering Ordinance",
    description: "Credit structure, attendance thresholds (75%/65% condonation), CIE/SEE weightage, honors degree eligibility, and research publication criteria.",
    provider: "gemini",
    status: "ACTIVE",
    totalSources: 3,
    staleSources: 0,
    createdAt: new Date("2026-01-10T08:30:00Z").toISOString(),
    updatedAt: new Date().toISOString(),
    department: "Institutional Governance & Academic Council",
    sources: [
      {
        id: "src-ord-01",
        documentId: "doc-ord-01",
        fileName: "Academic_Ordinance_R23_Full_Regulations.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-01-25T11:00:00Z").toISOString(),
        authors: "Academic Council, University Registrar & Controller of Examinations",
        year: 2025,
        venue: "Autonomous Institute Gazette & Governing Body Regulations",
        doi: "10.5281/zenodo.10892011",
        textContent: `
# Academic Regulations R23 for B.Tech Choice Based Credit System (CBCS)
Published by: Office of the Dean of Academic Affairs & Controller of Examinations

1. Degree Requirements and Credit Distribution
A candidate shall be eligible for the award of B.Tech Degree if they satisfy:
- Minimum cumulative earned credits: 160 credits over 8 semesters for Regular entry, and 120 credits for Lateral entry (ECET).
- CGPA Requirement: Cumulative Grade Point Average (CGPA) \ge 5.0 with zero active backlogs at the conclusion of the program.
- Maximum duration to complete degree: 8 academic years (16 consecutive semesters) from the date of admission.

2. Attendance Criteria & Condonation Rules (Section 4.2)
- Mandatory Attendance: A student must secure a minimum of 75% aggregate attendance in all registered subjects for the semester.
- Medical Condonation: Condonation of shortage of attendance between 65% and 74.99% may be recommended by the Department Academic Committee on genuine medical grounds accompanied by registered hospital certificate.
- Condonation Fee: Prescribed condonation fee must be paid before issuance of Semester End Examination (SEE) hall tickets.
- Detainment: Students securing less than 65% aggregate attendance shall NOT be eligible to appear for SEE and shall be detained.

3. Evaluation Scheme & Weightage (Section 6.1)
- Continuous Internal Evaluation (CIE): 40% weightage (Mid-term tests: 30 marks, Continuous assignments/quizzes: 10 marks).
- Semester End Examination (SEE): 60% weightage (Comprehensive 3-hour examination covering all 5 syllabus modules).
- Passing Standard: Minimum 35% marks in SEE and minimum 40% aggregate (CIE + SEE) to earn course credits.
        `.trim(),
      },
      {
        id: "src-ord-02",
        documentId: "doc-ord-02",
        fileName: "Undergraduate_Research_Thesis_Guidelines.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-01T15:45:00Z").toISOString(),
        authors: "Research Advisory Board & Dean R&D",
        year: 2025,
        venue: "ALITS Academic Research & Capstone Manual",
        doi: "10.5281/zenodo.10892012",
        textContent: `
# Guidelines for Undergraduate Research Thesis & Capstone Project Evaluation
Dean of Research & Development (R&D)

1. Thesis Scope & Originality
- All B.Tech final year students must complete an original research capstone (8 credits) in their respective department specialization.
- Plagiarism Ceiling: The similarity index checked via Turnitin / DrillBit must strictly not exceed 10% (excluding bibliography and mathematical formulae).
- IEEE Format Compliance: The final manuscript must adhere to the 2-column IEEE Conference template with verified DOI citations.

2. Oral Defense & Viva Voce Procedure
- The defense committee consists of: (1) Department HOD or Nominee (Chair), (2) External Academic Examiner, (3) Faculty Supervisor.
- Grading Rubric: Problem formulation & literature matrix (20%), Algorithmic implementation & experimentation (30%), Grounded analysis & results (30%), Viva voce oral defense (20%).
        `.trim(),
      },
      {
        id: "src-ord-03",
        documentId: "doc-ord-03",
        fileName: "Industrial_Internship_Credit_Policy.pdf",
        status: "ACTIVE",
        isStale: false,
        errorMessage: null,
        updatedAt: new Date("2026-02-03T10:20:00Z").toISOString(),
        authors: "Training & Placement Cell & Industry Relations Board",
        year: 2025,
        venue: "Career Center Industry Internship Manual",
        doi: "10.5281/zenodo.10892013",
        textContent: `
# Fast-Track Semester Internship & Industry Credit Transfer Policy
Training & Placement Cell (Placement Center) & Academic Council

1. Eligibility for Full-Semester Fast-Track Internship
- Students in the 8th semester with CGPA \ge 7.5 and no active standing backlogs are eligible for a 6-month industry internship.
- Company Accreditation: The sponsoring enterprise must be Tier-1 MNC, product startup with seed funding >$2M, or recognized research institution (ISRO, DRDO, CSIR).
- Credit Equivalent: The 6-month full-time internship substitutes for two professional electives and one open elective (total 10 credits).

2. Evaluation Milestones & Continuous Mentorship
- Bi-weekly progress reports submitted to designated departmental faculty mentor.
- Mid-term progress review conducted virtually with industry mentor.
- Final corporate evaluation rubric: Technical execution (40%), Industry domain impact (30%), Final capstone presentation (30%).
        `.trim(),
      },
    ],
  },
];

export function getStarterWorkspaces(): StarterWorkspace[] {
  return STARTER_WORKSPACES;
}

export function getStarterWorkspaceById(id: string): StarterWorkspace | undefined {
  return STARTER_WORKSPACES.find((w) => w.id === id);
}
