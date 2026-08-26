# Smart University — HOD Operations & Cognitive Intelligence Platform Documentation

> **Department Governance, Academic Risk Orchestration, Faculty Workload Optimization, Policy-Grounded Decision Intelligence, and Multi-Scope Knowledge Retrieval for All University Departments.**

---

## 1. Executive Summary & Architecture Overview

The **HOD (Head of Department) Portal** is an executive-level cognitive operations platform designed for university department chairs, academic deans, and division heads. It bridges daily academic governance with state-of-the-art **Retrieval-Augmented Generation (RAG)**, **Cognitive Decision Intelligence**, and the canonical **UniversityDataSource** abstraction.

### 🌐 Access URLs & Key Entry Points
- **HOD Governance Login**: [`http://localhost:3000/hod/login`](http://localhost:3000/hod/login)
- **HOD Operations Dashboard**: [`http://localhost:3000/hod/dashboard`](http://localhost:3000/hod/dashboard)
- **Faculty & Workload Allocation**: [`http://localhost:3000/hod/faculty`](http://localhost:3000/hod/faculty)
- **Student Academic Risk Radar**: [`http://localhost:3000/hod/students`](http://localhost:3000/hod/students)
- **Curriculum & Section Management**: [`http://localhost:3000/hod/courses`](http://localhost:3000/hod/courses)
- **Department Master Timetable**: [`http://localhost:3000/hod/timetable`](http://localhost:3000/hod/timetable)
- **Examination & Invigilation Oversight**: [`http://localhost:3000/hod/examinations`](http://localhost:3000/hod/examinations)
- **Department Knowledge & Syllabus Diff**: [`http://localhost:3000/hod/documents`](http://localhost:3000/hod/documents)
- **Research Projects & Sponsored Grants**: [`http://localhost:3000/hod/research`](http://localhost:3000/hod/research)
- **Facilities, Labs & Hall Utilization**: [`http://localhost:3000/hod/facilities`](http://localhost:3000/hod/facilities)
- **Executive Operations Dossier & Reports**: [`http://localhost:3000/hod/reports`](http://localhost:3000/hod/reports)

---

## 2. Pre-Seeded HOD & Dean Accounts

| Account Name | Scope / Role | Identifier | University Email | Password | Scope Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Prof. John Smith** | HOD — Computer Science & AI | `HOD-CS-001` | `hod.cs@smartuniversity.edu` | `HOD@CS2026!` | 🔒 Locked to CS Department |
| **Prof. Sarah Jones** | HOD — Mathematics | `HOD-MATH-002` | `hod.math@smartuniversity.edu` | `HOD@MATH2026!` | 🔒 Locked to MATH Department |
| **Prof. David Lee** | HOD — Electrical Engineering | `HOD-EE-003` | `hod.ee@smartuniversity.edu` | `HOD@EE2026!` | 🔒 Locked to EE Department |
| **Dr. Arthur Vance** | Dean of Academic Affairs | `HOD-ALL-000` | `dean@smartuniversity.edu` | `HOD@Admin2026!` | 🌐 Full Multi-Department Switcher |

---

## 3. Core System Matrix & Differentiators

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             HOD COGNITIVE PLATFORM MATRIX                        │
├──────────────────────────┬──────────────────────────┬────────────────────────────┤
│ 1. DEPARTMENT HEALTH     │ 2. "WHAT CHANGED?" DELTA │ 3. AI COMMAND CENTER       │
│  • 7-Dimension Score     │  • Weekly Shift Alerts   │  • Natural Language Query  │
│  • Deterministic Proof   │  • GPA Drops / Overloads │  • Causes & Interventions  │
│  • Provenance Drilldown  │  • Targeted Prescriptions│  • Policy Grounded RAG     │
├──────────────────────────┼──────────────────────────┼────────────────────────────┤
│ 4. HUMAN DECISION ENGINE │ 5. SYLLABUS DIFF ENGINE  │ 6. WORKLOAD ORCHESTRATION  │
│  • Proposal Confidence   │  • 2025 vs 2026 Diffs    │  • 15 Hr Teaching Cap Radar│
│  • Multitier Authority   │  • Module Adds / Removes │  • Room Collision Filter   │
│  • Audit Trail Receipts  │  • Page-Level Citations  │  • Section Redistribution  │
└──────────────────────────┴──────────────────────────┴────────────────────────────┘
```

---

## 4. Key Modules & Operational Intelligence

### Feature 1: Department Health Engine & 7-Dimensional Scoring
- Aggregates **Academic Performance (25%)**, **Attendance (20%)**, **Faculty Workload (15%)**, **Examinations (15%)**, **Research (10%)**, **Documents (10%)**, and **Data Quality (5%)**.
- Provides instant provenance drill-down modals detailing canonical database facts and policy references.

### Feature 2: "What Changed?" Temporal Operations Radar
- Automatically analyzes shift vectors between the previous week and current cycle:
  - $\Delta \text{Course GPA} = -0.40$ (triggers remedial lab proposal)
  - $\Delta \text{Department Attendance} = -4.2\%$ (triggers automated parent/advisor alerts)
  - $\Delta \text{At-Risk Students} = +6$ (assigns peer tutoring hours)
  - $\Delta \text{Faculty Overload} = +1$ (reallocates course sections to junior faculty)

### Feature 3: HOD AI Command Center (Autonomous Diagnostics)
- Natural language query pipeline across Student DB, Course Data, Faculty Workload Engine, and Policy RAG Handbook.
- Returns structured diagnosis, root causes, policy grounding, and actionable intervention plans.

### Feature 4: Multi-Tiered Decision Engine & Action Proposals
- High-impact operations (e.g. Hall Ticket Condonation, Attendance Waivers, Section Redistribution, Exam Policy Exceptions) flow through:
  $$\text{HOD Request} \longrightarrow \text{Decision Engine} \longrightarrow \text{Policy Verification (Citations)} \longrightarrow \text{Action Proposal} \longrightarrow \text{Human Confirmation}$$
- Clear division of authority (HOD approval vs Dean / CoE / Finance escalation).

### Feature 5: Multi-Scope Knowledge Repository & Interactive Syllabus Comparison
- Hierarchical document scopes: `PRIVATE`, `FACULTY`, `DEPARTMENT`, `COLLEGE`, `UNIVERSITY`.
- Side-by-side syllabus comparison (2025 vs 2026) rendering added modules, removed legacy courses, and credit adjustments with exact page citations.
