import { db } from "../src/server/db/prisma";

// Indian & International realistic names for university students and faculty
const firstNames = [
  "Aarav", "Aditi", "Rohan", "Ananya", "Vikram", "Pooja", "Rahul", "Neha",
  "Siddharth", "Priya", "Karthik", "Sneha", "Arjun", "Kavya", "Varun", "Riya",
  "Manish", "Divya", "Abhishek", "Shreya", "Aditya", "Tanvi", "Nikhil", "Isha",
  "Gaurav", "Meera", "Pranav", "Anjali", "Akash", "Swati", "Harsh", "Deepika",
  "Sanjay", "Ritu", "Amit", "Suman", "Rajesh", "Sunita", "Deepak", "Rashmi",
  "Alex", "David", "Emma", "Michael", "Sophia", "James", "Olivia", "Daniel"
];

const lastNames = [
  "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Rao", "Gupta",
  "Joshi", "Kulkarni", "Mehta", "Deshmukh", "Choudhury", "Bose", "Das", "Menon",
  "Mishra", "Pandey", "Saxena", "Bhatia", "Malhotra", "Kapoor", "Chopra", "Singhal",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomFloat(min: number, max: number, decimals = 2): number {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedRealtimeDataset() {
  console.log("🚀 Starting Large-Scale Real University Dataset Seed (100 Students & 10 Faculty per Branch)...");

  // 1. Fetch or ensure Organization
  let org = await db.organization.findFirst();
  if (!org) {
    org = await db.organization.create({
      data: { id: "seed-org-001", name: "Smart University" },
    });
  }
  const organizationId = org.id;

  // 2. Fetch all departments across the entire university
  const departments = await db.department.findMany({
    orderBy: { code: "asc" },
  });

  console.log(`Found ${departments.length} departments to populate.`);

  for (const dept of departments) {
    const organizationId = dept.organizationId;
    console.log(`\n========================================`);
    console.log(`🏢 Populating Department: ${dept.code} - ${dept.name}`);
    console.log(`========================================`);

    // Check existing count
    const existingFacultyCount = await db.faculty.count({ where: { departmentId: dept.id } });
    const existingStudentCount = await db.student.count({ where: { departmentId: dept.id } });

    console.log(`Current state: ${existingFacultyCount} faculty, ${existingStudentCount} students.`);

    // ── A. Ensure 10 Faculty for this Department ────────────────────────────
    const targetFaculty = 10;
    const facultyNeeded = Math.max(0, targetFaculty - existingFacultyCount);
    console.log(`Seeding ${facultyNeeded} faculty members...`);

    const titles = ["Professor", "Associate Professor", "Assistant Professor", "Senior Lecturer"];
    const specializations = [
      "Artificial Intelligence & Autonomous Systems",
      "Cloud Infrastructure & Distributed Computing",
      "Cybersecurity & Applied Cryptography",
      "Robotics & Control Systems",
      "VLSI & Embedded Architectures",
      "Data Engineering & High-Throughput Pipelines",
      "Quantum Information Science",
      "Sustainable Energy & Smart Grids",
      "Structural Dynamics & Materials Engineering",
      "Computational Mathematics & Numerical Analysis"
    ];

    const seededFacultyIds: string[] = [];

    // Fetch existing faculty IDs
    const existingFaculty = await db.faculty.findMany({
      where: { departmentId: dept.id },
      select: { id: true },
    });
    seededFacultyIds.push(...existingFaculty.map(f => f.id));

    for (let f = 1; f <= facultyNeeded; f++) {
      const idx = existingFacultyCount + f;
      const fn = getRandomItem(firstNames);
      const ln = getRandomItem(lastNames);
      const fullName = `Dr. ${fn} ${ln}`;
      const email = `prof.${dept.code.toLowerCase()}.${idx}@smartuniversity.edu`;
      const facultyCode = `FAC-${dept.code}-${String(idx).padStart(3, "0")}`;

      // Upsert User
      const user = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: fullName,
        },
      });

      // Upsert Faculty
      const fac = await db.faculty.upsert({
        where: { facultyCode },
        update: {},
        create: {
          organizationId,
          userId: user.id,
          facultyCode,
          assignedPassword: `Faculty@${dept.code}2026!`,
          departmentId: dept.id,
          title: titles[idx % titles.length],
          designation: `${titles[idx % titles.length]} in ${dept.name}`,
          specialization: specializations[idx % specializations.length],
          tenureStatus: idx <= 3 ? "Tenured" : "Tenure-Track",
          officeRoom: `${dept.code}-Room-${200 + idx}`,
        },
      });

      seededFacultyIds.push(fac.id);

      // Create Research Project for senior faculty
      if (idx <= 4) {
        await db.researchProject.create({
          data: {
            organizationId,
            leadFacultyId: fac.id,
            title: `Advanced ${specializations[idx % specializations.length]} Investigation`,
            abstract: `Funded research program investigating next-generation algorithms and scalable architectures in ${dept.name}.`,
            grantAmount: getRandomFloat(250000, 1800000, 0),
            status: "Active",
          },
        }).catch(() => {});
      }
    }

    // ── B. Ensure Course & CourseSections for Timetables ───────────────────
    let course = await db.course.findFirst({ where: { departmentId: dept.id } });
    if (!course) {
      course = await db.course.create({
        data: {
          organizationId,
          departmentId: dept.id,
          code: `${dept.code}301`,
          title: `Core Principles of ${dept.name}`,
          credits: 4,
        },
      });
    }

    let section = await db.courseSection.findFirst({ where: { courseId: course.id } });
    if (!section) {
      section = await db.courseSection.create({
        data: {
          organizationId,
          courseId: course.id,
          facultyId: seededFacultyIds[0] || null,
          term: "Fall 2026",
          sectionCode: "Sec 01",
          capacity: 60,
        },
      });
    }

    // Ensure Timetable entries for faculty
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const slots = [
      { start: "09:00 AM", end: "10:30 AM" },
      { start: "11:00 AM", end: "12:30 PM" },
      { start: "02:00 PM", end: "03:30 PM" },
    ];

    for (let i = 0; i < Math.min(5, seededFacultyIds.length); i++) {
      const facId = seededFacultyIds[i];
      const existingTt = await db.timetableEntry.count({ where: { facultyId: facId } });
      if (existingTt === 0) {
        await db.timetableEntry.create({
          data: {
            organizationId,
            facultyId: facId,
            courseSectionId: section.id,
            courseCode: course.code,
            courseTitle: course.title,
            dayOfWeek: days[i % days.length],
            startTime: slots[i % slots.length].start,
            endTime: slots[i % slots.length].end,
            room: `Hall-${101 + i}`,
          },
        });
      }
    }

    // ── C. Ensure 100 Students for this Department ─────────────────────────
    const targetStudents = 100;
    const studentsNeeded = Math.max(0, targetStudents - existingStudentCount);
    console.log(`Seeding ${studentsNeeded} students with full academic & financial records...`);

    // We generate students in chunks of 20 for optimal network performance
    const chunkSize = 20;
    for (let c = 0; c < studentsNeeded; c += chunkSize) {
      const currentBatchSize = Math.min(chunkSize, studentsNeeded - c);
      const studentBatchPromises = [];

      for (let s = 1; s <= currentBatchSize; s++) {
        const studentIndex = existingStudentCount + c + s;
        const fn = getRandomItem(firstNames);
        const ln = getRandomItem(lastNames);
        const studentName = `${fn} ${ln}`;
        const email = `student.${dept.code.toLowerCase()}.${studentIndex}@smartuniversity.edu`;
        const studentNumber = `STU-${dept.code}-${String(studentIndex).padStart(3, "0")}`;

        // Realistic GPA distribution (some high achievers, majority solid, a few at risk)
        let gpa: number;
        let academicStatus: string;
        let attendancePct: number;

        if (studentIndex % 15 === 0) {
          // At-risk student (for radar diagnostics)
          gpa = getRandomFloat(2.05, 2.45);
          academicStatus = "Academic Probation";
          attendancePct = getRandomFloat(61.0, 73.5);
        } else if (studentIndex % 8 === 0) {
          // Moderate student with slight attendance dip
          gpa = getRandomFloat(2.80, 3.20);
          academicStatus = "Good Standing";
          attendancePct = getRandomFloat(74.0, 79.5);
        } else {
          // High performing regular student
          gpa = getRandomFloat(3.35, 3.98);
          academicStatus = "Good Standing";
          attendancePct = getRandomFloat(82.0, 98.5);
        }

        const attendedClasses = Math.round((attendancePct / 100) * 44);
        const balanceDue = studentIndex % 12 === 0 ? getRandomFloat(1200, 3500, 0) : 0;

        studentBatchPromises.push(
          (async () => {
            const user = await db.user.upsert({
              where: { email },
              update: {},
              create: { email, name: studentName },
            });

            const student = await db.student.upsert({
              where: { organizationId_studentNumber: { organizationId, studentNumber } },
              update: { gpa, academicStatus },
              create: {
                organizationId,
                userId: user.id,
                departmentId: dept.id,
                advisorId: seededFacultyIds[studentIndex % seededFacultyIds.length] || null,
                studentNumber,
                major: dept.name,
                gpa,
                academicStatus,
              },
            });

            // Attendance Record
            await db.attendanceRecord.create({
              data: {
                organizationId,
                studentId: student.id,
                totalClasses: 44,
                attendedClasses,
                percentage: attendancePct,
              },
            }).catch(() => {});

            // Internal Marks Record
            await db.internalMark.create({
              data: {
                organizationId,
                studentId: student.id,
                assessmentName: "Midterm Examination",
                marksObtained: Math.round((gpa / 4.0) * 100 * getRandomFloat(0.9, 1.05)),
                maxMarks: 100,
                percentage: Math.min(100, Math.round((gpa / 4.0) * 100)),
              },
            }).catch(() => {});

            // Semester Result Record
            await db.semesterResult.create({
              data: {
                organizationId,
                studentId: student.id,
                term: "Fall 2026",
                sgpa: gpa,
                cgpa: gpa,
                backlogsCount: academicStatus === "Academic Probation" ? 1 : 0,
                totalCredits: 18,
              },
            }).catch(() => {});

            // Financial Account
            await db.financialAccount.create({
              data: {
                organizationId,
                studentId: student.id,
                totalBilled: 12500,
                totalPaid: 12500 - balanceDue,
                balanceOutstanding: balanceDue,
                status: balanceDue > 0 ? "Pending" : "Paid",
              },
            }).catch(() => {});

            // Course Enrolment
            await db.enrolment.upsert({
              where: { studentId_courseSectionId: { studentId: student.id, courseSectionId: section.id } },
              update: {},
              create: {
                organizationId,
                studentId: student.id,
                courseSectionId: section.id,
                grade: gpa >= 3.7 ? "A" : gpa >= 3.0 ? "B" : "C",
                status: "Enrolled",
              },
            }).catch(() => {});
          })()
        );
      }

      await Promise.all(studentBatchPromises);
      console.log(`  ✓ Inserted batch ${c + currentBatchSize} / ${studentsNeeded} students...`);
    }

    console.log(`✅ Department ${dept.code} completed successfully!`);
  }

  console.log("\n🎉 ALL DEPARTMENTS FULLY POPULATED WITH REAL 100 STUDENTS & 10 FACULTY EACH!");
}

if (require.main === module) {
  seedRealtimeDataset()
    .then(() => {
      console.log("Seeding process finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed with error:", err);
      process.exit(1);
    });
}
