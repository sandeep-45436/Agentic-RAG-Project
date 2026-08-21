# Smart University — Faculty Portal Technical & Functional Documentation

> **Next-Generation Academic Subsystem with Dedicated Unique Password Authentication, Multimodal Document Ingestion, Timetable Orchestration, and Anti-Malpractice Exam Seating Arrangement.**

---

## 1. Executive Summary & Platform Overview

The **Faculty Portal** is a specialized subsystem within the Smart University Enterprise Cognitive Intelligence Platform designed specifically for university professors, instructors, and academic department leads. It provides a secure, streamlined workspace that bridges daily academic operations with state-of-the-art **Retrieval-Augmented Generation (RAG)** and **Enterprise Tool Runtime (ETR)** systems.

### 🌐 Access URLs & Key Entry Points
- **Faculty Login**: [`http://localhost:3000/faculty/login`](http://localhost:3000/faculty/login)
- **Faculty Dashboard**: [`http://localhost:3000/faculty/dashboard`](http://localhost:3000/faculty/dashboard)
- **Academic Documents Center**: [`http://localhost:3000/faculty/documents`](http://localhost:3000/faculty/documents)
- **Timetable Management**: [`http://localhost:3000/faculty/timetables`](http://localhost:3000/faculty/timetables)
- **Exam Seating Plans**: [`http://localhost:3000/faculty/seating`](http://localhost:3000/faculty/seating)
- **Assigned Faculty Roster**: [`http://localhost:3000/faculty/assigned-faculty`](http://localhost:3000/faculty/assigned-faculty)

---

## 2. Feature Breakdown: Purpose, Operation & Real-World Problems Solved

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FACULTY PORTAL CORE MATRIX                           │
├──────────────────────────┬──────────────────────────┬────────────────────────────┤
│ 1. AUTHENTICATION        │ 2. DOCUMENT UPLOADS      │ 3. TIMETABLE & SEATING     │
│  • Unique Assigned Pass  │  • Multi-category Tags   │  • Weekly Schedule Matrix  │
│  • Faculty ID / Email    │  • Multimodal RAG Parser │  • Room Conflict Detection │
│  • Role-Based Isolation  │  • Vector + Graph Store  │  • Zig-zag Anti-Cheat Grid │
└──────────────────────────┴──────────────────────────┴────────────────────────────┘
```

---

### Feature 1: Dedicated Faculty Authentication & Unique Password Access

#### 📌 How It Works:
- Each faculty member is assigned an official **Faculty Identifier** (e.g., `FAC-CS-001`, `FAC-MATH-002`, `FAC-EE-003`) and a **Unique Password** (e.g., `Faculty@CS2026!`).
- Faculty authenticate via a specialized gateway at `/faculty/login` that isolates faculty session tokens (`faculty_session` HTTP-only cookie) from general student and public sessions.
- Pre-assigned demo accounts allow 1-click test sign-ins for department heads.

#### 🌍 Real-World Problem Solved:
1. **Credential Confusion & Privilege Escalation**: In traditional university ERPs, students, faculty, and administrative staff often share the same login forms, leading to account mix-ups and potential unauthorized access to grading or exam data.
2. **Visiting & Adjunct Professor Onboarding**: Universities frequently employ visiting lecturers who need immediate, temporary access without going through lengthy IT provisioning cycles. Unique assigned passwords provide fast, secure, compartmentalized access.

---

### Feature 2: Academic Document Upload & Automated Multimodal RAG Ingestion

#### 📌 How It Works:
- Faculty can upload course materials in `.pdf`, `.docx`, or `.txt` formats across categorized classifications:
  - `Course Syllabus`
  - `Lecture Notes & Slides`
  - `Question Bank & Model Papers`
  - `Academic & Examination Regulation`
  - `Lab Manual & Experiment Guide`
  - `Department Circular & Notification`
- When uploaded, documents are parsed by the platform's **Multimodal PDF Engine** (table parsing, OCR, and element chunking), embedded into **Qdrant Vector Database** with **BM25 indices**, and linked to the **Neo4j Knowledge Graph**.

#### 🌍 Real-World Problem Solved:
1. **Academic Hallucinations in AI Tools**: Generic AI chatbots often answer student queries with incorrect or outdated university policies. Because documents uploaded by faculty feed directly into the hybrid RAG index, student and faculty AI queries return 100% ground-truth answers cited directly from the professor's syllabus.
2. **Scattered Information Silos**: Syllabi, exam circulars, and lab manuals are often lost across emails and messaging groups. The portal centralizes all department knowledge in a single searchable repository with live chunk status tracking.

---

### Feature 3: Weekly Class & Lab Timetable Management

#### 📌 How It Works:
- Interactive weekly schedule grid spanning **Monday through Saturday** with visual cards for course codes, titles, time intervals, and lecture halls.
- **Automated Collision Detection**: When adding a new slot, the backend checks for room conflicts:
  $$\text{Collision Check: } (\text{Room} = R) \land (\text{Day} = D) \land (\text{StartTime} = T_{\text{start}})$$
  If a conflict occurs, the system immediately rejects the double-booking with an explanatory error.
- **Bulk CSV Import & Export**: Faculty can upload an entire department semester schedule in one paste, or export the timetable to CSV/PDF with a single click.

#### 🌍 Real-World Problem Solved:
1. **Hall & Laboratory Double-Bookings**: Multiple professors inadvertently booking the same lecture hall or lab at the same time is a chronic scheduling issue in university departments. Real-time validation eliminates double-booking errors before schedules are published.
2. **Tedious Manual Schedule Updates**: Department secretaries often spend days manually editing spreadsheets whenever an instructor swaps a lecture. The portal allows instant additions, bulk updates, and exportable schedules in seconds.

---

### Feature 4: Academic Examination Seating Arrangement Hub

#### 📌 How It Works:
- Generates intelligent, anti-malpractice seating arrangements for midterm and final examinations.
- **Zig-Zag Alternate Course Interleaving Algorithm**:
  - The generator spaces students across a 2D bench matrix ($R \times C$) such that adjacent students in Left and Right seat positions belong to **different courses/departments**:
    $$\text{Seat } L = \text{Student}(\text{Course } A) \quad \longleftrightarrow \quad \text{Seat } R = \text{Student}(\text{Course } B)$$
  - This ensures that neighboring students are never answering the same examination paper.
- **Visual Bench Layout**: Renders an interactive desk grid showing Bench IDs (`B-01`, `B-02`), student roll numbers, student names, and color-coded subject tags (`CS401` cyan, `MATH301` emerald, `EE401` purple).
- **Print-Ready Export**: Generates printable hall notices for notice boards and student sign-in sheets with signature columns for invigilating faculty.

#### 🌍 Real-World Problem Solved:
1. **Examination Malpractice & Cheating**: Placing students from the same course side-by-side during exams invites copying and communication. The automated zig-zag distribution mathematically interleaves student branches to prevent cheating.
2. **Examination Day Chaos & Delays**: Manually drafting seating charts for hundreds of students across multiple halls often leads to missing roll numbers, overcrowded halls, and late exam start times. The 1-click generator creates balanced, verifiable seating charts and printable attendance sheets instantly.

---

### Feature 5: Assigned Faculty Credentials & Roster Management

#### 📌 How It Works:
- A transparent administrative view displaying all registered faculty members, department designations, assigned faculty codes, and their unique login passwords (with secure reveal toggle).
- Allows department chairs to update credentials and auto-generate secure passwords (`Faculty@...2026!`) with one click.

#### 🌍 Real-World Problem Solved:
1. **Faculty Account Lockouts & Forgotten Passwords**: Eliminates dependencies on external helpdesk tickets for faculty login resets during critical exam or semester-start periods.

---

## 3. Pre-Seeded Faculty Accounts & Credentials

| Faculty Name | Department | Faculty ID | University Email | Unique Password |
| :--- | :--- | :--- | :--- | :--- |
| **Prof. John Smith** | Computer Science & AI | `FAC-CS-001` | `prof.smith@smartuniversity.edu` | `Faculty@CS2026!` |
| **Prof. Sarah Jones** | Mathematics | `FAC-MATH-002` | `prof.jones@smartuniversity.edu` | `Faculty@MATH2026!` |
| **Prof. David Lee** | Electrical Engineering | `FAC-EE-003` | `prof.lee@smartuniversity.edu` | `Faculty@EE2026!` |

---

## 4. Technical Architecture & Database Schema

### Prisma Data Models

```prisma
model Faculty {
  id               String    @id @default(uuid())
  organizationId   String
  userId           String?   @unique
  facultyCode      String?   @unique // e.g. FAC-CS-001
  passwordHash     String?
  assignedPassword String?
  departmentId     String
  title            String    // Professor, Associate Professor, Lecturer
  designation      String?
  specialization   String?
  officeRoom       String?
  tenureStatus     String    // Tenured, Tenure-Track, Visiting
  hireDate         DateTime  @default(now())

  // Relations
  organization     Organization             @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user             User?                    @relation(fields: [userId], references: [id], onDelete: SetNull)
  department       Department               @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  sections         CourseSection[]
  timetableEntries TimetableEntry[]
  examSeatingArrangements ExamSeatingArrangement[]
}

model TimetableEntry {
  id              String    @id @default(uuid())
  organizationId  String
  facultyId       String?
  courseSectionId String?
  courseCode      String
  courseTitle     String
  dayOfWeek       String    // Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
  startTime       String    // e.g. "09:00 AM"
  endTime         String    // e.g. "10:30 AM"
  room            String    // e.g. "Tech Hall 101"
  term            String    @default("Fall 2026")
  academicYear    String    @default("2026-2027")
}

model ExamSeatingArrangement {
  id             String   @id @default(uuid())
  organizationId String
  examinationId  String
  facilityId     String?
  facultyId      String?  // Assigned Invigilator
  examDate       DateTime
  sessionSlot    String   // e.g. "Morning (09:30 AM - 12:30 PM)"
  hallNumber     String   // e.g. "Tech Hall 101"
  benchNumber    String   // e.g. "B-01"
  rowNumber      Int      @default(1)
  columnNumber   Int      @default(1)
  seatPosition   String   @default("Left") // Left, Right
  studentRollNo  String   // e.g. "CS-2026-001"
  studentName    String   // e.g. "Alice Johnson"
  courseCode     String   // e.g. "CS401"
  courseTitle    String
}
```

---

## 5. API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/faculty/auth/login` | `POST` | Authenticates faculty identifier & unique password, sets HTTP-only `faculty_session` cookie. |
| `/api/faculty/auth/session` | `GET` | Validates active session and returns full faculty profile and statistics. |
| `/api/faculty/auth/logout` | `POST` | Destroys faculty session cookie. |
| `/api/faculty/auth/assign-password` | `GET/POST`| Lists all faculty members and allows updating passwords, codes, and designations. |
| `/api/faculty/documents` | `GET/POST/DELETE` | Uploads academic documents, triggers background RAG vectorization, and lists repository files. |
| `/api/faculty/timetables` | `GET/POST/DELETE` | Queries weekly timetables, performs conflict checks for new slots, and handles bulk CSV imports. |
| `/api/faculty/seating` | `GET/POST/DELETE` | Generates intelligent zig-zag exam seating allocations and queries hall arrangements. |

---

## 6. End-to-End User Verification Workflow

1. **Sign In**: Navigate to [`http://localhost:3000/faculty/login`](http://localhost:3000/faculty/login) and click the **Prof. John Smith (CS)** chip.
2. **Review Dashboard**: Explore active courses, scheduled hours, and recent documents at [`/faculty/dashboard`](http://localhost:3000/faculty/dashboard).
3. **Upload Academic Material**: Navigate to [`/faculty/documents`](http://localhost:3000/faculty/documents), choose `Course Syllabus` or `Question Bank`, select `CS401`, and drop a document. Observe immediate indexing into the RAG pipeline.
4. **Schedule Timetable**: Open [`/faculty/timetables`](http://localhost:3000/faculty/timetables), add a class slot on `Monday 09:00 AM`, and verify conflict detection.
5. **Generate Exam Seating**: Open [`/faculty/seating`](http://localhost:3000/faculty/seating), choose `Midterm Examination 1 - Fall 2026`, set `Tech Hall 101`, and click **Generate Seating Plan**. Inspect the zig-zag bench allocation.
6. **Print Seating Sheet**: Click **Print Seating Notice** to prepare the notice board and invigilation sheet.
