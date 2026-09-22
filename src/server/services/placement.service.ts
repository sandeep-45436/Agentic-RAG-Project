import { db } from "@/server/db/prisma";

export type PlacementTier = "Super Dream" | "Dream" | "Enterprise";

export interface HiringRound {
  roundNumber: number;
  name: string;
  description: string;
  date: string;
}

export interface PlacementDrive {
  id: string;
  company: string;
  logo: string;
  role: string;
  tier: PlacementTier;
  ctc: string;
  baseSalary: string;
  stocks?: string;
  joiningBonus?: string;
  stipend?: string;
  location: string;
  driveDate: string;
  applicationDeadline: string;
  status: "OPEN" | "OA_SCHEDULED" | "INTERVIEWING" | "COMPLETED";
  minCgpa: number;
  maxBacklogs: number;
  allowedBranches: string[];
  requiredSkills: string[];
  description: string;
  hiringRounds: HiringRound[];
  isDemo: boolean;
  totalApplicantsCount: number;
}

export interface StudentCandidate {
  studentId: string;
  name: string;
  department: string;
  cgpa: number;
  activeBacklogs: number;
  skills: string[];
  email: string;
  resumeSummary?: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  matchPercentage: number;
  reason: string;
  criteriaChecks: {
    cgpaPassed: boolean;
    backlogPassed: boolean;
    branchPassed: boolean;
    matchedSkills: string[];
    missingSkills: string[];
  };
}

export type ApplicationStage =
  | "APPLIED"
  | "SHORTLISTED"
  | "OA_SCHEDULED"
  | "TECH_ROUND_1"
  | "TECH_ROUND_2"
  | "HR_ROUND"
  | "OFFER_EXTENDED"
  | "OFFER_ACCEPTED"
  | "REJECTED";

export interface ApplicationRecord {
  id: string;
  driveId: string;
  company: string;
  role: string;
  studentId: string;
  studentName: string;
  appliedAt: string;
  stage: ApplicationStage;
  stageBadgeColor: string;
  interviewDetails?: {
    date: string;
    time: string;
    meetLink: string;
    roundName: string;
    interviewer: string;
  };
  offerDetails?: {
    ctc: string;
    joiningDate: string;
    validUntil: string;
    tier: PlacementTier;
  };
}

export interface ATSAnalysisResult {
  atsScore: number;
  summary: string;
  keywordMatchRate: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  impactScore: number;
  suggestedImprovements: string[];
  enhancedBulletPoints: Array<{ original: string; enhanced: string; rationale: string }>;
}

export interface MockInterviewQuestion {
  id: string;
  company: string;
  role: string;
  topic: string;
  difficulty: "Medium" | "Hard" | "Expert";
  question: string;
  contextOrConstraint: string;
  keyEvaluationCriteria: string[];
  modelAnswerSummary: string;
}

export interface MockInterviewEvaluation {
  overallScore: number; // 0 - 100
  technicalCorrectnessScore: number; // 0 - 100
  systemScalabilityScore: number; // 0 - 100
  communicationClarityScore: number; // 0 - 100
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  modelAnswer: string;
}

export interface PlacementAnalyticsData {
  overallPlacementRate: number;
  averageCtc: string;
  highestCtc: string;
  medianCtc: string;
  totalOffers: number;
  superDreamOffers: number;
  dreamOffers: number;
  enterpriseOffers: number;
  branchPerformance: Array<{
    branch: string;
    placementRate: number;
    avgCtc: number;
    totalEligible: number;
    placedCount: number;
  }>;
  salaryTierDistribution: Array<{
    tier: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  topRecruitingPartners: Array<{
    company: string;
    offersCount: number;
    avgPackage: string;
    tier: PlacementTier;
  }>;
  provenance: {
    source: string;
    datasetId: string;
    freshness: string;
    isDemo: boolean;
    disclaimer: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY SIMULATION REPOSITORIES (Resilient fallback + demo dataset)
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_DRIVES: PlacementDrive[] = [
  {
    id: "drv_aws_cloud_arch",
    company: "Amazon Web Services (AWS)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    role: "Cloud Solutions Architect Associate",
    tier: "Super Dream",
    ctc: "₹28.50 LPA",
    baseSalary: "₹18.00 LPA",
    stocks: "₹8.00 LPA (RSUs)",
    joiningBonus: "₹2.50 LPA",
    stipend: "₹85,000 / month (Internship)",
    location: "Bengaluru / Hyderabad (Hybrid)",
    driveDate: "Oct 12, 2026",
    applicationDeadline: "Oct 05, 2026",
    status: "OPEN",
    minCgpa: 7.5,
    maxBacklogs: 0,
    allowedBranches: ["CSE", "AI&DS", "IT", "ECE"],
    requiredSkills: ["Python", "AWS", "SQL", "Distributed Systems", "Docker"],
    description:
      "Design cloud architecture blueprints, advise enterprise clients on multi-region AWS resilience, and construct serverless distributed microservices. Requires strong foundation in networking, Linux, and database scaling.",
    hiringRounds: [
      { roundNumber: 1, name: "Online Algorithmic & AWS Aptitude Assessment", description: "90 min Hackerrank test (2 DSA questions + 30 Cloud/OS MCQs)", date: "Oct 12, 2026" },
      { roundNumber: 2, name: "Technical Interview Round 1 (DSA & Architecture)", description: "Live coding on graphs/dynamic programming & system components", date: "Oct 15, 2026" },
      { roundNumber: 3, name: "Technical Interview Round 2 (Cloud & Systems)", description: "High-level architectural design of a multi-region distributed cache", date: "Oct 18, 2026" },
      { roundNumber: 4, name: "Bar Raiser & Leadership Principles", description: "Amazon 16 Leadership Principles behavioral deep dive with VP panel", date: "Oct 20, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 142,
  },
  {
    id: "drv_google_swe",
    company: "Google",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    role: "Software Engineer (SDE-1)",
    tier: "Super Dream",
    ctc: "₹44.50 LPA",
    baseSalary: "₹24.00 LPA",
    stocks: "₹16.50 LPA (GSUs)",
    joiningBonus: "₹4.00 LPA",
    stipend: "₹1,20,000 / month (Internship)",
    location: "Bengaluru / Hyderabad",
    driveDate: "Oct 18, 2026",
    applicationDeadline: "Oct 10, 2026",
    status: "OPEN",
    minCgpa: 8.0,
    maxBacklogs: 0,
    allowedBranches: ["CSE", "AI&DS", "IT"],
    requiredSkills: ["C++", "Python", "Algorithms", "Concurrency", "System Design"],
    description:
      "Develop large-scale storage, planetary compute infra, and Google core search subsystems. Expect rigorous algorithmic challenge rounds focusing on computational complexity, memory invariants, and clean code.",
    hiringRounds: [
      { roundNumber: 1, name: "Google Online Challenge (GOC)", description: "2 complex graph/geometry questions on Codeforces platform", date: "Oct 18, 2026" },
      { roundNumber: 2, name: "Technical Coding Round 1", description: "Algorithms, trees, graphs, and bitwise optimization with Google Zurich engineer", date: "Oct 22, 2026" },
      { roundNumber: 3, name: "Technical Coding Round 2", description: "Dynamic programming & concurrent data structures", date: "Oct 24, 2026" },
      { roundNumber: 4, name: "Googliness & Leadership Round", description: "Inclusive team problem solving, conflict resolution, and ethics", date: "Oct 26, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 218,
  },
  {
    id: "drv_microsoft_sde",
    company: "Microsoft",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg",
    role: "Software Engineer - Azure Core",
    tier: "Super Dream",
    ctc: "₹34.00 LPA",
    baseSalary: "₹20.00 LPA",
    stocks: "₹10.00 LPA",
    joiningBonus: "₹4.00 LPA",
    stipend: "₹1,00,000 / month",
    location: "Hyderabad / Noida",
    driveDate: "Oct 25, 2026",
    applicationDeadline: "Oct 15, 2026",
    status: "OPEN",
    minCgpa: 7.8,
    maxBacklogs: 0,
    allowedBranches: ["CSE", "AI&DS", "IT", "ECE"],
    requiredSkills: ["C#", "C++", "Azure", "Kubernetes", "OS Internals"],
    description:
      "Build foundational virtualization hypervisors and resilient distributed orchestration layers underpinning Microsoft Azure worldwide.",
    hiringRounds: [
      { roundNumber: 1, name: "Microsoft Codility Assessment", description: "3 coding questions + debugging scenario", date: "Oct 25, 2026" },
      { roundNumber: 2, name: "Data Structures & Memory Round", description: "Linked data structures, cache lines, concurrency", date: "Oct 28, 2026" },
      { roundNumber: 3, name: "Azure Distributed Systems Design", description: "Design a fault-tolerant job scheduler across edge regions", date: "Nov 02, 2026" },
      { roundNumber: 4, name: "Partner Director / AA Round", description: "Engineering vision, adaptability, and high-impact past projects", date: "Nov 05, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 189,
  },
  {
    id: "drv_goldman_quant",
    company: "Goldman Sachs",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg",
    role: "Analyst - Quantitative & Financial Engineering",
    tier: "Super Dream",
    ctc: "₹31.50 LPA",
    baseSalary: "₹22.00 LPA",
    stocks: "₹6.00 LPA",
    joiningBonus: "₹3.50 LPA",
    stipend: "₹95,000 / month",
    location: "Bengaluru",
    driveDate: "Nov 02, 2026",
    applicationDeadline: "Oct 20, 2026",
    status: "OPEN",
    minCgpa: 7.5,
    maxBacklogs: 0,
    allowedBranches: ["CSE", "AI&DS", "IT", "ECE", "MATH"],
    requiredSkills: ["Python", "C++", "Probability & Statistics", "SQL", "Stochastic Calculus"],
    description:
      "Construct ultra-low-latency market connectivity feeds, algorithmic derivatives pricing models, and risk monitoring pipelines for global trading desks.",
    hiringRounds: [
      { roundNumber: 1, name: "Aptitude, Math & Coding OA", description: "Quantitative probability + 2 advanced DSA challenges", date: "Nov 02, 2026" },
      { roundNumber: 2, name: "Technical Interview 1 (Quant Math & DSA)", description: "Bayesian probability, dynamic programming, matrix transformations", date: "Nov 06, 2026" },
      { roundNumber: 3, name: "Technical Interview 2 (Low Latency Systems)", description: "Memory layout, network socket polling, lock-free queues", date: "Nov 09, 2026" },
      { roundNumber: 4, name: "Managing Director Fitment Round", description: "Professional integrity, market awareness, pressure handling", date: "Nov 12, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 165,
  },
  {
    id: "drv_deloitte_cloud",
    company: "Deloitte Digital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg",
    role: "Consultant - Cloud & Enterprise Engineering",
    tier: "Dream",
    ctc: "₹12.80 LPA",
    baseSalary: "₹10.50 LPA",
    joiningBonus: "₹1.50 LPA",
    stocks: "₹0.80 LPA",
    stipend: "₹45,000 / month",
    location: "Hyderabad / Pune / Bengaluru",
    driveDate: "Nov 08, 2026",
    applicationDeadline: "Oct 28, 2026",
    status: "OPEN",
    minCgpa: 6.8,
    maxBacklogs: 0,
    allowedBranches: ["CSE", "AI&DS", "IT", "ECE", "MECH", "CIVIL"],
    requiredSkills: ["Cloud Computing", "Full Stack", "SQL", "Java / Python", "Agile"],
    description:
      "Modernize legacy core systems for Fortune 500 enterprises using cloud-native microservices, containerization, and modern frontend frameworks.",
    hiringRounds: [
      { roundNumber: 1, name: "Cognitive & Technical Assessment", description: "Analytical ability, pseudo-code analysis, verbal reasoning", date: "Nov 08, 2026" },
      { roundNumber: 2, name: "Technical Case Study & Coding", description: "Evaluate an enterprise retail schema and write SQL/API endpoints", date: "Nov 12, 2026" },
      { roundNumber: 3, name: "Partner Interview & Behavioral Fitment", description: "Consulting mindset, client communication, and team leadership", date: "Nov 16, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 310,
  },
  {
    id: "drv_qualcomm_embedded",
    company: "Qualcomm",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Qualcomm_logo.svg",
    role: "Modem Firmware & Embedded Systems Engineer",
    tier: "Super Dream",
    ctc: "₹24.00 LPA",
    baseSalary: "₹16.50 LPA",
    stocks: "₹5.50 LPA",
    joiningBonus: "₹2.00 LPA",
    stipend: "₹70,000 / month",
    location: "Hyderabad / Chennai",
    driveDate: "Nov 14, 2026",
    applicationDeadline: "Nov 02, 2026",
    status: "OPEN",
    minCgpa: 7.2,
    maxBacklogs: 0,
    allowedBranches: ["ECE", "CSE", "IT", "AI&DS"],
    requiredSkills: ["C", "C++", "RTOS", "Computer Architecture", "Device Drivers"],
    description:
      "Design ultra-efficient 5G/6G modem firmware, DSP scheduler algorithms, and board support packages for Qualcomm Snapdragon platforms.",
    hiringRounds: [
      { roundNumber: 1, name: "Qualcomm Technical Screening", description: "C pointers, memory layout, digital logic, and 1 coding question", date: "Nov 14, 2026" },
      { roundNumber: 2, name: "Technical Round 1 (C & Embedded Internals)", description: "Bitwise manipulations, interrupt service routines, cache coherence", date: "Nov 18, 2026" },
      { roundNumber: 3, name: "Technical Round 2 (RTOS & Architecture)", description: "Deadlock resolution, priority inversion, DMA transfers", date: "Nov 21, 2026" },
      { roundNumber: 4, name: "HR & Fitment Discussion", description: "Long-term career focus and semiconductor interest", date: "Nov 24, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 135,
  },
  {
    id: "drv_tata_elxsi_auton",
    company: "Tata Elxsi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/22/Tata_Elxsi_logo.png",
    role: "Autonomous Systems & Computer Vision Engineer",
    tier: "Dream",
    ctc: "₹10.50 LPA",
    baseSalary: "₹9.00 LPA",
    joiningBonus: "₹1.50 LPA",
    stipend: "₹35,000 / month",
    location: "Bengaluru / Thiruvananthapuram",
    driveDate: "Nov 20, 2026",
    applicationDeadline: "Nov 10, 2026",
    status: "OPEN",
    minCgpa: 6.5,
    maxBacklogs: 1,
    allowedBranches: ["CSE", "AI&DS", "ECE", "MECH"],
    requiredSkills: ["OpenCV", "Python", "C++", "Deep Learning", "ROS"],
    description:
      "Develop sensor fusion pipelines (LiDAR + Radar + Camera) and ADAS perception models for electric vehicle platforms.",
    hiringRounds: [
      { roundNumber: 1, name: "Online Aptitude & Python/C++ Test", description: "60 mins online test covering maths and programming", date: "Nov 20, 2026" },
      { roundNumber: 2, name: "Technical Interview (Vision & Geometry)", description: "Image filtering, bounding box regression, 3D coordinate frames", date: "Nov 24, 2026" },
      { roundNumber: 3, name: "Managerial & HR Interview", description: "Project deep dive and communication skills", date: "Nov 28, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 220,
  },
  {
    id: "drv_infosys_springboard",
    company: "Infosys Springboard (Specialist)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg",
    role: "Specialist Programmer (Power Programmer Tier)",
    tier: "Dream",
    ctc: "₹9.50 LPA",
    baseSalary: "₹8.50 LPA",
    joiningBonus: "₹1.00 LPA",
    stipend: "₹30,000 / month",
    location: "Mysuru / Hyderabad / Bengaluru",
    driveDate: "Dec 02, 2026",
    applicationDeadline: "Nov 20, 2026",
    status: "OPEN",
    minCgpa: 6.0,
    maxBacklogs: 0,
    allowedBranches: ["CSE", "AI&DS", "IT", "ECE", "MECH", "CIVIL"],
    requiredSkills: ["Java", "Python", "Competitive Programming", "SQL", "Spring Boot"],
    description:
      "Fast-track elite programming cohort responsible for high-complexity core engineering, modern API microservices, and AI integrations.",
    hiringRounds: [
      { roundNumber: 1, name: "HackWithInfy Coding Round", description: "3 high-difficulty competitive programming challenges", date: "Dec 02, 2026" },
      { roundNumber: 2, name: "Technical Interview", description: "Code walkthrough, complexity analysis, and database schema normalization", date: "Dec 06, 2026" },
      { roundNumber: 3, name: "HR Interview", description: "Background verification and location preference", date: "Dec 09, 2026" },
    ],
    isDemo: true,
    totalApplicantsCount: 440,
  },
];

// Initial mock applications for the logged-in student (demonstrates real Kanban state)
let IN_MEMORY_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "app_001",
    driveId: "drv_aws_cloud_arch",
    company: "Amazon Web Services (AWS)",
    role: "Cloud Solutions Architect Associate",
    studentId: "STU-CSE-001",
    studentName: "Aditya Nair",
    appliedAt: "2026-09-18",
    stage: "TECH_ROUND_1",
    stageBadgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300",
    interviewDetails: {
      date: "Oct 15, 2026",
      time: "10:30 AM IST",
      meetLink: "https://meet.google.com/aws-rec-demo",
      roundName: "Technical Interview Round 1 (DSA & Architecture)",
      interviewer: "Siddharth Rao (Principal Cloud Architect, AWS)",
    },
  },
  {
    id: "app_002",
    driveId: "drv_deloitte_cloud",
    company: "Deloitte Digital",
    role: "Consultant - Cloud & Enterprise Engineering",
    studentId: "STU-CSE-001",
    studentName: "Aditya Nair",
    appliedAt: "2026-09-12",
    stage: "OFFER_EXTENDED",
    stageBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300",
    offerDetails: {
      ctc: "₹12.80 LPA",
      joiningDate: "July 01, 2027",
      validUntil: "Oct 30, 2026",
      tier: "Dream",
    },
  },
  {
    id: "app_003",
    driveId: "drv_microsoft_sde",
    company: "Microsoft",
    role: "Software Engineer - Azure Core",
    studentId: "STU-CSE-001",
    studentName: "Aditya Nair",
    appliedAt: "2026-09-19",
    stage: "OA_SCHEDULED",
    stageBadgeColor: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300",
    interviewDetails: {
      date: "Oct 25, 2026",
      time: "02:00 PM IST",
      meetLink: "https://codility.com/demo-test-msft",
      roundName: "Microsoft Codility Assessment (3 Challenges)",
      interviewer: "Microsoft University Recruiting Panel",
    },
  },
];

const MOCK_VIVA_QUESTIONS: MockInterviewQuestion[] = [
  {
    id: "viva_01",
    company: "Amazon Web Services (AWS)",
    role: "Cloud Solutions Architect",
    topic: "Distributed Systems & Scalability",
    difficulty: "Hard",
    question: "Design a high-throughput, multi-region rate limiter that can handle 200,000 requests/second with under 5ms latency overhead while preventing noisy-neighbor DoS attacks.",
    contextOrConstraint: "Assume cross-region replication latency is ~70ms. The rate limiter cannot block on a central database for every incoming packet.",
    keyEvaluationCriteria: [
      "Token Bucket or Leaky Bucket algorithm implementation",
      "Local in-memory Redis cluster caching with asynchronous batched sync",
      "Handling clock drift across geo-distributed nodes",
      "Graceful degradation during network partitions",
    ],
    modelAnswerSummary: "Utilize a tiered sliding-window token bucket algorithm running in local memory/Envoy proxy sidecars with Redis counters per edge region. Asynchronously synchronize token delta consumption using batched Redis pipeline calls or CRDTs. On partition, fall back to conservative local thresholds to ensure system availability.",
  },
  {
    id: "viva_02",
    company: "Google",
    role: "Software Engineer",
    topic: "Algorithms & Concurrency",
    difficulty: "Expert",
    question: "How would you implement a thread-safe LRU Cache in C++ or Java without using a global mutex lock that serializes all reads?",
    contextOrConstraint: "Read operations outnumber write operations 9:1. Eviction must strictly honor least-recently-used ordering.",
    keyEvaluationCriteria: [
      "Concurrent hash map combined with striped segment locks or read-write locks",
      "Decoupling node access updates from read paths (e.g. read buffers / ring buffers)",
      "Caffeine-style Window TinyLFU or CLOCK algorithm approximation for ultra-low lock contention",
      "Atomic pointer updates and memory visibility barriers",
    ],
    modelAnswerSummary: "A strict global lock on the doubly linked list causes massive lock contention on reads because every `get()` updates node position. A production solution (like Java's Caffeine cache) uses a concurrent hash map for reads, and buffers access events into per-thread ring buffers that a background maintenance thread processes in batches to reorder eviction pointers.",
  },
  {
    id: "viva_03",
    company: "Goldman Sachs",
    role: "Quantitative Technology Analyst",
    topic: "Low-Latency & Memory Layout",
    difficulty: "Hard",
    question: "Explain false sharing in multi-threaded systems and how hardware cache line bouncing degrades execution throughput in high-frequency order processing.",
    contextOrConstraint: "Assume modern x86-64 CPUs with 64-byte L1/L2 cache lines.",
    keyEvaluationCriteria: [
      "Definition of 64-byte cache lines and MESI cache coherence protocol",
      "Explain how two threads writing to distinct variables on the same cache line invalidate each other's L1 cache",
      "Remediation using memory alignment (`alignas(64)`) or structure padding",
    ],
    modelAnswerSummary: "False sharing occurs when independent variables accessed by different CPU cores reside within the same 64-byte hardware cache line. When Core 1 writes to variable A, the MESI protocol invalidates the entire cache line in Core 2's L1 cache, forcing expensive bus transactions and memory reloading even though Core 2 was only reading variable B. Mitigate by padding variables to 64 bytes (`alignas(64)` or `@Contended`).",
  },
  {
    id: "viva_04",
    company: "Deloitte Digital",
    role: "Cloud Consultant",
    topic: "Microservices & Database Patterns",
    difficulty: "Medium",
    question: "When decomposing an enterprise monolithic SQL database into microservices, how do you handle distributed transactions across orders, inventory, and payment services without using two-phase commit (2PC)?",
    contextOrConstraint: "2PC introduces high latency, locks tables, and is impractical across microservices with separate datastores.",
    keyEvaluationCriteria: [
      "Saga Pattern (Orchestration vs Choreography)",
      "Compensating transactions for rollback logic",
      "Transactional Outbox Pattern with CDC (Debezium/Kafka)",
      "Eventual consistency handling in the UI",
    ],
    modelAnswerSummary: "Adopt the Saga Pattern. Each microservice executes its local database transaction and publishes an event (guaranteed via the Transactional Outbox Pattern to avoid dual-write bugs). If payment fails, compensating transactions are dispatched in reverse order to cancel inventory holds. The client UI reflects intermediate pending states.",
  },
];

export class PlacementService {
  /**
   * Fetch all active recruitment drives
   */
  static async getDrives(): Promise<PlacementDrive[]> {
    return DEMO_DRIVES;
  }

  /**
   * Fetch single drive by ID
   */
  static async getDriveById(id: string): Promise<PlacementDrive | null> {
    const drive = DEMO_DRIVES.find((d) => d.id === id);
    return drive || null;
  }

  /**
   * DETERMINISTIC: Evaluates candidate against drive cutoff rules
   */
  static evaluateEligibility(
    student: StudentCandidate,
    drive: PlacementDrive
  ): EligibilityResult {
    const cgpaPassed = student.cgpa >= drive.minCgpa;
    const backlogPassed = student.activeBacklogs <= drive.maxBacklogs;
    
    // Check branch with robust code & name aliasing
    const deptUpper = student.department.toUpperCase();
    const branchPassed =
      drive.allowedBranches.includes("ALL") ||
      drive.allowedBranches.some((b) => {
        const bUpper = b.toUpperCase();
        if (bUpper === "CSE" && (deptUpper.includes("COMPUTER") || deptUpper.includes("CSE"))) return true;
        if (bUpper === "IT" && (deptUpper.includes("INFORMATION") || deptUpper.includes("IT"))) return true;
        if ((bUpper === "AI&DS" || bUpper === "AI/DS" || bUpper === "AIDS") && (deptUpper.includes("AI") || deptUpper.includes("DATA SCIENCE"))) return true;
        if (bUpper === "ECE" && (deptUpper.includes("ELECTRONIC") || deptUpper.includes("ECE"))) return true;
        if (bUpper === "MECH" && (deptUpper.includes("MECHANICAL") || deptUpper.includes("MECH"))) return true;
        if (bUpper === "CIVIL" && deptUpper.includes("CIVIL")) return true;
        return deptUpper.includes(bUpper);
      });

    // Skill match
    const studentSkillsLower = student.skills.map((s) => s.toLowerCase());
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    drive.requiredSkills.forEach((skill) => {
      const isPresent = studentSkillsLower.some(
        (sk) => sk.includes(skill.toLowerCase()) || skill.toLowerCase().includes(sk)
      );
      if (isPresent) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const skillRatio =
      drive.requiredSkills.length > 0
        ? matchedSkills.length / drive.requiredSkills.length
        : 1;

    // Match percentage combines academic percentile & skill match
    const cgpaScore = Math.min(100, (student.cgpa / 10.0) * 100);
    const matchPercentage = Math.round(cgpaScore * 0.4 + skillRatio * 100 * 0.6);

    const isEligible = cgpaPassed && backlogPassed && branchPassed;

    let reason = "Candidate meets all academic criteria, cutoff thresholds, and branch eligibility.";
    if (!cgpaPassed) {
      reason = `Candidate CGPA (${student.cgpa.toFixed(2)}) is below the required cutoff of ${drive.minCgpa.toFixed(2)}.`;
    } else if (!backlogPassed) {
      reason = `Candidate has ${student.activeBacklogs} active backlogs. Drive requires at most ${drive.maxBacklogs}.`;
    } else if (!branchPassed) {
      reason = `Department '${student.department}' is not among the allowed disciplines: ${drive.allowedBranches.join(", ")}.`;
    }

    return {
      isEligible,
      matchPercentage,
      reason,
      criteriaChecks: {
        cgpaPassed,
        backlogPassed,
        branchPassed,
        matchedSkills,
        missingSkills,
      },
    };
  }

  /**
   * DETERMINISTIC: Orders candidate pool by eligibility and skill distance
   */
  static rankCandidates(
    candidates: StudentCandidate[],
    drive: PlacementDrive
  ): Array<StudentCandidate & { rank: number; matchPercentage: number; isEligible: boolean; reason: string }> {
    const scored = candidates.map((cand) => {
      const evalResult = this.evaluateEligibility(cand, drive);
      return {
        ...cand,
        matchPercentage: evalResult.matchPercentage,
        isEligible: evalResult.isEligible,
        reason: evalResult.reason,
      };
    });

    // Sort: Eligible first, then by matchPercentage desc, then by CGPA desc
    scored.sort((a, b) => {
      if (a.isEligible !== b.isEligible) {
        return a.isEligible ? -1 : 1;
      }
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return b.cgpa - a.cgpa;
    });

    return scored.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }

  /**
   * Get Student Profile for Placement
   */
  static async getStudentProfile(studentId?: string): Promise<StudentCandidate> {
    let candidate: StudentCandidate = {
      studentId: "STU-CSE-001",
      name: "Aditya Nair",
      department: "Computer Science & Engineering",
      cgpa: 8.85,
      activeBacklogs: 0,
      skills: ["Python", "AWS", "SQL", "Docker", "Next.js", "LangGraph", "Distributed Systems", "Algorithms"],
      email: "aditya.nair@alits.ac.in",
      resumeSummary: "Final-year CSE Honors student with high proficiency in distributed cloud architecture, hybrid vector RAG systems, and production full-stack engineering. 2 verified AWS/GCP certifications.",
    };

    try {
      if (studentId) {
        const student = await db.student.findUnique({
          where: { id: studentId },
          include: { user: true, department: true },
        });
        if (student) {
          candidate = {
            studentId: student.studentNumber,
            name: student.user?.name || student.studentNumber,
            department: student.department?.name || candidate.department,
            cgpa: student.gpa ? Number(student.gpa) : 8.5,
            activeBacklogs: 0,
            skills: candidate.skills,
            email: student.user?.email || candidate.email,
            resumeSummary: candidate.resumeSummary,
          };
        }
      }
    } catch {}

    return candidate;
  }

  /**
   * Get Applications for a student
   */
  static async getStudentApplications(studentId = "STU-CSE-001"): Promise<ApplicationRecord[]> {
    return IN_MEMORY_APPLICATIONS.filter((app) => app.studentId === studentId);
  }

  /**
   * Submit an application to a campus drive
   */
  static async applyToDrive(
    studentId = "STU-CSE-001",
    driveId: string
  ): Promise<{ success: boolean; application?: ApplicationRecord; error?: string }> {
    const drive = await this.getDriveById(driveId);
    if (!drive) {
      return { success: false, error: "Recruitment drive not found." };
    }

    const existing = IN_MEMORY_APPLICATIONS.find(
      (a) => a.studentId === studentId && a.driveId === driveId
    );
    if (existing) {
      return { success: false, error: "You have already applied to this drive." };
    }

    const student = await this.getStudentProfile(studentId);
    const eligibility = this.evaluateEligibility(student, drive);

    if (!eligibility.isEligible) {
      return {
        success: false,
        error: `Ineligible: ${eligibility.reason}`,
      };
    }

    const newApp: ApplicationRecord = {
      id: `app_${Date.now()}`,
      driveId,
      company: drive.company,
      role: drive.role,
      studentId,
      studentName: student.name,
      appliedAt: new Date().toISOString().split("T")[0],
      stage: "APPLIED",
      stageBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300",
    };

    IN_MEMORY_APPLICATIONS.unshift(newApp);
    drive.totalApplicantsCount += 1;

    return { success: true, application: newApp };
  }

  /**
   * Accept an extended offer (respects university policy)
   */
  static async acceptOffer(
    studentId = "STU-CSE-001",
    applicationId: string
  ): Promise<{ success: boolean; message: string }> {
    const app = IN_MEMORY_APPLICATIONS.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, message: "Application record not found." };
    }

    if (app.stage !== "OFFER_EXTENDED") {
      return { success: false, message: "No extended offer available to accept for this drive." };
    }

    app.stage = "OFFER_ACCEPTED";
    app.stageBadgeColor = "bg-emerald-600 text-white font-bold";

    return {
      success: true,
      message: `Congratulations! Offer from ${app.company} for ${app.role} (${app.offerDetails?.ctc}) has been accepted. Your placement dossier has been recorded with the Placement Directorate.`,
    };
  }

  /**
   * AI ATS Resume & Job Description Analyzer
   */
  static async analyzeResumeATS(
    resumeContent: string,
    targetDriveId?: string,
    customJd?: string
  ): Promise<ATSAnalysisResult> {
    let driveName = "Target Cloud SDE Role";
    let requiredSkills = ["Python", "AWS", "SQL", "Distributed Systems", "Docker", "CI/CD", "PostgreSQL", "Algorithms"];

    if (targetDriveId) {
      const d = await this.getDriveById(targetDriveId);
      if (d) {
        driveName = `${d.company} - ${d.role}`;
        requiredSkills = d.requiredSkills;
      }
    } else if (customJd) {
      // Basic keyword tokenization
      const candidates = ["Python", "Java", "C++", "AWS", "GCP", "Kubernetes", "Docker", "SQL", "React", "Next.js", "Redis", "Kafka", "Graph", "RAG"];
      requiredSkills = candidates.filter((c) => customJd.toLowerCase().includes(c.toLowerCase()));
      if (requiredSkills.length === 0) {
        requiredSkills = ["Python", "Algorithms", "System Architecture", "SQL"];
      }
    }

    const lowerResume = resumeContent.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    requiredSkills.forEach((skill) => {
      if (lowerResume.includes(skill.toLowerCase())) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const matchRate = Math.round((matched.length / Math.max(1, requiredSkills.length)) * 100);
    const hasNumbers = /\d+%|\d+x|\d+ms|\$\d+/g.test(resumeContent);
    const impactScore = hasNumbers ? 88 : 62;
    const atsScore = Math.min(99, Math.round(matchRate * 0.65 + impactScore * 0.35));

    return {
      atsScore,
      summary: `Resume parsed against ${driveName}. Keyword density is strong across core competencies with ${matched.length} of ${requiredSkills.length} key attributes detected.`,
      keywordMatchRate: matchRate,
      matchedKeywords: matched,
      missingKeywords: missing,
      impactScore,
      suggestedImprovements: [
        missing.length > 0 ? `Integrate concrete project examples highlighting missing proficiencies: ${missing.slice(0, 3).join(", ")}.` : "All required core tech keywords are represented.",
        "Ensure all project bullet points follow the Google 'X-Y-Z' formula (Accomplished [X] as measured by [Y], by doing [Z]).",
        "Add measurable latency and throughput figures (e.g., 'reduced P99 latency by 35%').",
      ],
      enhancedBulletPoints: [
        {
          original: "Worked on AWS cloud microservices and created database tables for the platform.",
          enhanced: "Architected 6 event-driven microservices on AWS (ECS Fargate + RDS PostgreSQL), handling 15,000 requests/sec with 99.98% uptime.",
          rationale: "Quantifies throughput, architecture choice, and SLA reliability metrics.",
        },
        {
          original: "Built a search system using vector embeddings and Python.",
          enhanced: "Constructed hybrid BM25 + dense vector semantic retrieval pipeline using LangGraph and Qdrant, reducing retrieval hallucination rate by 42%.",
          rationale: "Highlights exact advanced tools (LangGraph, Qdrant) and measurable accuracy gain.",
        },
      ],
    };
  }

  /**
   * Get Mock Interview Questions
   */
  static getMockInterviewQuestions(): MockInterviewQuestion[] {
    return MOCK_VIVA_QUESTIONS;
  }

  /**
   * Evaluate a student's answer to a mock interview question
   */
  static evaluateMockInterviewAnswer(
    questionId: string,
    studentAnswer: string
  ): MockInterviewEvaluation {
    const q = MOCK_VIVA_QUESTIONS.find((item) => item.id === questionId) || MOCK_VIVA_QUESTIONS[0];
    const answerLower = studentAnswer.toLowerCase();

    // Check presence of key criteria terms
    let hitCount = 0;
    q.keyEvaluationCriteria.forEach((crit) => {
      const words = crit.toLowerCase().split(" ").filter((w) => w.length > 4);
      const matched = words.some((w) => answerLower.includes(w));
      if (matched) hitCount += 1;
    });

    const isSubstantial = studentAnswer.length > 120;
    const baseScore = isSubstantial ? 70 : 45;
    const bonus = Math.round((hitCount / Math.max(1, q.keyEvaluationCriteria.length)) * 25);
    const overallScore = Math.min(96, baseScore + bonus);

    const technicalCorrectnessScore = Math.min(98, 65 + hitCount * 8);
    const systemScalabilityScore = answerLower.includes("cache") || answerLower.includes("partition") || answerLower.includes("cluster") ? 92 : 72;
    const communicationClarityScore = isSubstantial ? 88 : 60;

    return {
      overallScore,
      technicalCorrectnessScore,
      systemScalabilityScore,
      communicationClarityScore,
      feedback:
        overallScore >= 85
          ? "Outstanding depth! Your response addresses architectural trade-offs, concurrency hazards, and practical mitigation strategies."
          : "Good fundamental grasp. Consider detailing failover behavior, memory barriers, and quantitative latency impacts.",
      strengths: [
        "Clearly identified the primary architectural bottleneck.",
        hitCount > 0 ? `Demonstrated familiarity with ${q.keyEvaluationCriteria[0]}.` : "Structured reasoning approach.",
      ],
      areasForImprovement: [
        "Elaborate on edge cases when downstream microservices or network interfaces fail.",
        "Quantify trade-offs between consistency and availability (CAP theorem implications).",
      ],
      modelAnswer: q.modelAnswerSummary,
    };
  }

  /**
   * Institutional Placement Analytics (Explicit Demo Dataset Provenance)
   */
  static getPlacementAnalytics(): PlacementAnalyticsData {
    return {
      overallPlacementRate: 95.2,
      averageCtc: "₹8.42 LPA",
      highestCtc: "₹44.50 LPA",
      medianCtc: "₹7.20 LPA",
      totalOffers: 648,
      superDreamOffers: 84, // > ₹15 LPA
      dreamOffers: 216,      // ₹8 - 15 LPA
      enterpriseOffers: 348, // ₹4 - 8 LPA
      branchPerformance: [
        { branch: "CSE", placementRate: 96.8, avgCtc: 9.8, totalEligible: 210, placedCount: 203 },
        { branch: "AI & DS", placementRate: 97.4, avgCtc: 10.4, totalEligible: 120, placedCount: 117 },
        { branch: "IT", placementRate: 95.1, avgCtc: 8.9, totalEligible: 110, placedCount: 105 },
        { branch: "ECE", placementRate: 92.5, avgCtc: 7.8, totalEligible: 140, placedCount: 130 },
        { branch: "MECH", placementRate: 86.2, avgCtc: 6.2, totalEligible: 95, placedCount: 82 },
        { branch: "CIVIL", placementRate: 82.5, avgCtc: 5.6, totalEligible: 60, placedCount: 50 },
      ],
      salaryTierDistribution: [
        { tier: "Super Dream (> ₹15 LPA)", count: 84, percentage: 13.0, color: "#8b5cf6" },
        { tier: "Dream (₹8 - 15 LPA)", count: 216, percentage: 33.3, color: "#06b6d4" },
        { tier: "Enterprise (₹4 - 8 LPA)", count: 348, percentage: 53.7, color: "#10b981" },
      ],
      topRecruitingPartners: [
        { company: "Amazon Web Services (AWS)", offersCount: 28, avgPackage: "₹28.5 LPA", tier: "Super Dream" },
        { company: "Microsoft", offersCount: 14, avgPackage: "₹34.0 LPA", tier: "Super Dream" },
        { company: "Google", offersCount: 6, avgPackage: "₹44.5 LPA", tier: "Super Dream" },
        { company: "Goldman Sachs", offersCount: 12, avgPackage: "₹31.5 LPA", tier: "Super Dream" },
        { company: "Deloitte Digital", offersCount: 78, avgPackage: "₹12.8 LPA", tier: "Dream" },
        { company: "Qualcomm", offersCount: 16, avgPackage: "₹24.0 LPA", tier: "Super Dream" },
        { company: "Tata Elxsi", offersCount: 42, avgPackage: "₹10.5 LPA", tier: "Dream" },
        { company: "Infosys Springboard", offersCount: 115, avgPackage: "₹9.5 LPA", tier: "Dream" },
      ],
      provenance: {
        source: "Demo University Dataset",
        datasetId: "deterministic-demo-v1",
        freshness: "Static Simulation (2025-2026 Academic Cycle)",
        isDemo: true,
        disclaimer: "All metrics, company recruitment drives, and candidate figures are generated from the institutional simulation sandbox for demonstration and training purposes.",
      },
    };
  }

  /**
   * TPO Batch Candidate Evaluation
   */
  static runTpoCandidateShortlisting(criteria: {
    minCgpa: number;
    maxBacklogs: number;
    allowedBranches: string[];
    requiredSkills: string[];
  }) {
    const candidatePool: StudentCandidate[] = [
      { studentId: "22AD115", name: "Gayathri Pillai", department: "AI & Data Science", cgpa: 9.10, activeBacklogs: 0, skills: ["Python", "AWS", "Distributed Systems", "SQL", "PyTorch"], email: "gayathri@alits.ac.in" },
      { studentId: "22CS101", name: "Aditya Nair", department: "Computer Science", cgpa: 8.85, activeBacklogs: 0, skills: ["Python", "AWS", "SQL", "Docker", "LangGraph"], email: "aditya@alits.ac.in" },
      { studentId: "22CS104", name: "Bhavana Iyer", department: "Computer Science", cgpa: 7.80, activeBacklogs: 0, skills: ["Java", "Spring Boot", "SQL", "Docker"], email: "bhavana@alits.ac.in" },
      { studentId: "22EC120", name: "Kiran Reddy", department: "Electronics", cgpa: 7.95, activeBacklogs: 0, skills: ["C++", "Embedded C", "Python", "RTOS"], email: "kiran@alits.ac.in" },
      { studentId: "22IT109", name: "Dinesh Kumar", department: "Information Technology", cgpa: 7.10, activeBacklogs: 1, skills: ["Python", "AWS", "SQL"], email: "dinesh@alits.ac.in" },
      { studentId: "22CS142", name: "Pooja Hegde", department: "Computer Science", cgpa: 8.45, activeBacklogs: 0, skills: ["Python", "AWS", "Kubernetes", "Next.js"], email: "pooja@alits.ac.in" },
      { studentId: "22AD108", name: "Rohan Varma", department: "AI & Data Science", cgpa: 8.20, activeBacklogs: 0, skills: ["Python", "SQL", "TensorFlow", "FastAPI"], email: "rohan@alits.ac.in" },
      { studentId: "22ME130", name: "Suresh Babu", department: "Mechanical Engineering", cgpa: 7.40, activeBacklogs: 0, skills: ["AutoCAD", "Python", "IoT"], email: "suresh@alits.ac.in" },
    ];

    const virtualDrive: PlacementDrive = {
      id: "virtual_tpo_drive",
      company: "Custom Drive",
      logo: "",
      role: "Candidate Shortlisting",
      tier: "Super Dream",
      ctc: "N/A",
      baseSalary: "N/A",
      location: "Campus",
      driveDate: new Date().toISOString(),
      applicationDeadline: new Date().toISOString(),
      status: "OPEN",
      minCgpa: criteria.minCgpa,
      maxBacklogs: criteria.maxBacklogs,
      allowedBranches: criteria.allowedBranches,
      requiredSkills: criteria.requiredSkills,
      description: "TPO Custom Evaluation",
      hiringRounds: [],
      isDemo: true,
      totalApplicantsCount: candidatePool.length,
    };

    return this.rankCandidates(candidatePool, virtualDrive);
  }
}
