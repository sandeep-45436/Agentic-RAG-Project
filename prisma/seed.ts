import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting university seed...');

  // ── 1. Organization ───────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-001' },
    update: {},
    create: { id: 'seed-org-001', name: 'Smart University' },
  });
  console.log(`✅ Org: ${org.name}`);

  // ── 2. Admin User ─────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartuniversity.edu' },
    update: {},
    create: { email: 'admin@smartuniversity.edu', name: 'Admin User' },
  });
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: adminUser.id, organizationId: org.id } },
    update: {},
    create: { userId: adminUser.id, organizationId: org.id, role: 'ADMIN' },
  });
  console.log(`✅ Admin: ${adminUser.email}`);

  // ── 3. Departments ────────────────────────────────────────────────────────
  const depts = await Promise.all([
    prisma.department.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'CS' } },
      update: {},
      create: { organizationId: org.id, code: 'CS', name: 'Computer Science', building: 'Tech Hall', annualBudget: 1500000 },
    }),
    prisma.department.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'MATH' } },
      update: {},
      create: { organizationId: org.id, code: 'MATH', name: 'Mathematics', building: 'Science Block', annualBudget: 900000 },
    }),
    prisma.department.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'EE' } },
      update: {},
      create: { organizationId: org.id, code: 'EE', name: 'Electrical Engineering', building: 'Engineering Wing', annualBudget: 1200000 },
    }),
  ]);
  console.log(`✅ Departments: ${depts.map(d => d.code).join(', ')}`);

  // ── 4. Faculty ────────────────────────────────────────────────────────────
  const profUsers = await Promise.all([
    prisma.user.upsert({ where: { email: 'prof.smith@smartuniversity.edu' }, update: {}, create: { email: 'prof.smith@smartuniversity.edu', name: 'Prof. John Smith' } }),
    prisma.user.upsert({ where: { email: 'prof.jones@smartuniversity.edu' }, update: {}, create: { email: 'prof.jones@smartuniversity.edu', name: 'Prof. Sarah Jones' } }),
    prisma.user.upsert({ where: { email: 'prof.lee@smartuniversity.edu' }, update: {}, create: { email: 'prof.lee@smartuniversity.edu', name: 'Prof. David Lee' } }),
  ]);

  const facultyData = [
    { code: 'FAC-CS-001', pass: 'Faculty@CS2026!', title: 'Professor', desig: 'Head of Computer Science & AI', spec: 'Distributed Systems & Agentic RAG' },
    { code: 'FAC-MATH-002', pass: 'Faculty@MATH2026!', title: 'Associate Professor', desig: 'Senior Faculty - Mathematics', spec: 'Linear Algebra & Numerical Optimization' },
    { code: 'FAC-EE-003', pass: 'Faculty@EE2026!', title: 'Lecturer', desig: 'Lead Instructor - Electrical Eng', spec: 'Digital Signal Processing & Microelectronics' },
  ];

  const faculty = await Promise.all(profUsers.map((u, i) =>
    prisma.faculty.upsert({
      where: { userId: u.id },
      update: {
        facultyCode: facultyData[i].code,
        assignedPassword: facultyData[i].pass,
        designation: facultyData[i].desig,
        specialization: facultyData[i].spec,
      },
      create: {
        organizationId: org.id,
        userId: u.id,
        facultyCode: facultyData[i].code,
        assignedPassword: facultyData[i].pass,
        departmentId: depts[i % depts.length].id,
        title: facultyData[i].title,
        designation: facultyData[i].desig,
        specialization: facultyData[i].spec,
        tenureStatus: i === 0 ? 'Tenured' : 'Tenure-Track',
        officeRoom: `Room ${101 + i}`,
      },
    })
  ));
  console.log(`✅ Faculty: ${faculty.length} members with unique passwords & codes`);

  // ── 5. Courses ────────────────────────────────────────────────────────────
  const courses = await Promise.all([
    prisma.course.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'CS401' } }, update: {}, create: { organizationId: org.id, departmentId: depts[0].id, code: 'CS401', title: 'Algorithms & Data Structures', credits: 3 } }),
    prisma.course.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'CS501' } }, update: {}, create: { organizationId: org.id, departmentId: depts[0].id, code: 'CS501', title: 'Machine Learning', credits: 4 } }),
    prisma.course.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'MATH301' } }, update: {}, create: { organizationId: org.id, departmentId: depts[1].id, code: 'MATH301', title: 'Linear Algebra', credits: 3 } }),
    prisma.course.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'EE401' } }, update: {}, create: { organizationId: org.id, departmentId: depts[2].id, code: 'EE401', title: 'Digital Signal Processing', credits: 3 } }),
  ]);
  console.log(`✅ Courses: ${courses.map(c => c.code).join(', ')}`);

  // ── 6. Course Sections ────────────────────────────────────────────────────
  const sections = await Promise.all(courses.map((c, i) =>
    prisma.courseSection.create({
      data: {
        organizationId: org.id,
        courseId: c.id,
        facultyId: faculty[i % faculty.length].id,
        term: 'Fall 2026',
        sectionCode: `Sec-0${i + 1}`,
        room: `Hall ${200 + i}`,
        scheduleText: `Mon/Wed ${9 + i}:00 AM`,
        capacity: 30 + i * 5,
      },
    })
  ));
  console.log(`✅ Sections: ${sections.length}`);

  // ── 7. Students ───────────────────────────────────────────────────────────
  const studentData = [
    { name: 'Alice Johnson', email: 'alice@students.smartuniversity.edu', gpa: 1.6, status: 'Academic Probation', major: 'Computer Science' },
    { name: 'Bob Williams', email: 'bob@students.smartuniversity.edu', gpa: 1.8, status: 'Academic Probation', major: 'Mathematics' },
    { name: 'Carol Davis', email: 'carol@students.smartuniversity.edu', gpa: 3.8, status: 'Good Standing', major: 'Computer Science' },
    { name: 'Dan Miller', email: 'dan@students.smartuniversity.edu', gpa: 2.5, status: 'Good Standing', major: 'Electrical Engineering' },
    { name: 'Eva Wilson', email: 'eva@students.smartuniversity.edu', gpa: 3.5, status: 'Good Standing', major: 'Computer Science' },
    { name: 'Frank Brown', email: 'frank@students.smartuniversity.edu', gpa: 1.4, status: 'Academic Probation', major: 'Mathematics' },
  ];

  const studentUsers = await Promise.all(studentData.map(s =>
    prisma.user.upsert({ where: { email: s.email }, update: {}, create: { email: s.email, name: s.name } })
  ));

  const students = await Promise.all(studentUsers.map((u, i) =>
    prisma.student.upsert({
      where: { userId: u.id },
      update: { gpa: studentData[i].gpa, academicStatus: studentData[i].status },
      create: {
        organizationId: org.id,
        userId: u.id,
        departmentId: depts[i % depts.length].id,
        advisorId: faculty[i % faculty.length].id,
        studentNumber: `STU${String(i + 1).padStart(4, '0')}`,
        major: studentData[i].major,
        gpa: studentData[i].gpa,
        academicStatus: studentData[i].status,
      },
    })
  ));
  console.log(`✅ Students: ${students.length} (${students.filter(s => s.academicStatus === 'Academic Probation').length} on probation)`);

  // ── 8. Enrolments ─────────────────────────────────────────────────────────
  await Promise.all(students.slice(0, 3).map((s, i) =>
    prisma.enrolment.upsert({
      where: { studentId_courseSectionId: { studentId: s.id, courseSectionId: sections[i].id } },
      update: {},
      create: { organizationId: org.id, studentId: s.id, courseSectionId: sections[i].id, status: 'Enrolled' },
    })
  ));
  console.log(`✅ Enrolments created`);

  // ── 9. Financial Accounts ─────────────────────────────────────────────────
  await Promise.all(students.map((s, i) =>
    prisma.financialAccount.create({
      data: {
        organizationId: org.id,
        studentId: s.id,
        totalBilled: 15000 + i * 500,
        totalPaid: i % 2 === 0 ? 15000 + i * 500 : (15000 + i * 500) * 0.5,
        balanceOutstanding: i % 2 === 0 ? 0 : (15000 + i * 500) * 0.5,
        status: i % 2 === 0 ? 'Paid' : 'Overdue',
      },
    })
  ));
  console.log(`✅ Financial accounts created`);

  // ── 9B. Phase 5 Student Operations Records ──────────────────────────────
  await Promise.all(students.map(async (s, i) => {
    // Attendance: Alice (65% - risk), Bob (60% - risk), Carol (92%), Dan (85%), Eva (95%), Frank (58% - risk)
    const attPct = i === 0 ? 65.0 : i === 1 ? 60.0 : i === 2 ? 92.0 : i === 3 ? 85.0 : i === 4 ? 95.0 : 58.0;
    const attended = Math.round((attPct / 100) * 40);
    await prisma.attendanceRecord.create({
      data: {
        organizationId: org.id,
        studentId: s.id,
        courseSectionId: sections[i % sections.length].id,
        totalClasses: 40,
        attendedClasses: attended,
        percentage: attPct,
      },
    });

    // Internal Marks
    const marks = i === 0 ? 45.0 : i === 1 ? 52.0 : i === 2 ? 94.0 : i === 3 ? 72.0 : i === 4 ? 88.0 : 40.0;
    await prisma.internalMark.create({
      data: {
        organizationId: org.id,
        studentId: s.id,
        courseSectionId: sections[i % sections.length].id,
        assessmentName: 'Midterm Exam 1',
        marksObtained: marks,
        maxMarks: 100.0,
        percentage: marks,
      },
    });

    // Semester Results
    await prisma.semesterResult.create({
      data: {
        organizationId: org.id,
        studentId: s.id,
        term: 'Spring 2026',
        sgpa: studentData[i].gpa,
        cgpa: studentData[i].gpa,
        backlogsCount: studentData[i].gpa < 2.0 ? 2 : 0,
        totalCredits: 18,
      },
    });

    // Hostel Record
    await prisma.hostelRecord.upsert({
      where: { studentId: s.id },
      update: {},
      create: {
        organizationId: org.id,
        studentId: s.id,
        hostelName: i % 2 === 0 ? 'Einstein Hall' : 'Curie Block',
        roomNumber: `Room-${201 + i}`,
        feeStatus: i % 2 === 0 ? 'Paid' : 'Pending',
      },
    });

    // Scholarship Record
    await prisma.scholarshipRecord.upsert({
      where: { studentId: s.id },
      update: {},
      create: {
        organizationId: org.id,
        studentId: s.id,
        scholarshipName: i === 2 || i === 4 ? 'Dean\'s Merit Excellence' : 'State Academic Grant',
        amount: i === 2 || i === 4 ? 5000.0 : 2000.0,
        status: studentData[i].gpa < 2.0 ? 'Suspended' : 'Active',
        renewalEligible: studentData[i].gpa >= 2.0,
      },
    });

    // Parent Info
    await prisma.parentInfo.upsert({
      where: { studentId: s.id },
      update: {},
      create: {
        organizationId: org.id,
        studentId: s.id,
        parentName: `Parent of ${s.studentNumber}`,
        relationship: i % 2 === 0 ? 'Father' : 'Mother',
        email: `parent.${s.studentNumber.toLowerCase()}@example.com`,
        phone: `+1-555-019-${i + 1}0`,
        address: '123 University Avenue, Tech City',
      },
    });
  }));
  console.log(`✅ Phase 5 Student Operations records (Attendance, Marks, Results, Hostel, Scholarship, Parent) created`);

  // ── 10. Knowledge Base + Document ────────────────────────────────────────
  const kb = await prisma.knowledgeBase.upsert({
    where: { id: 'seed-kb-001' },
    update: {},
    create: { id: 'seed-kb-001', organizationId: org.id, name: 'Academic Handbook', description: 'University policies, regulations and syllabi' },
  });
  await prisma.document.upsert({
    where: { id: 'seed-doc-001' },
    update: {},
    create: {
      id: 'seed-doc-001',
      organizationId: org.id,
      knowledgeBaseId: kb.id,
      fileName: 'Academic_Handbook_2026.pdf',
      fileType: 'application/pdf',
      fileSize: 2097152,
      storagePath: `${org.id}/academic-handbook.pdf`,
      processingStatus: 'COMPLETED',
      uploadedBy: adminUser.id,
      content: 'Students with GPA below 2.0 are placed on academic probation. Attendance below 75% triggers mandatory advisor meeting. Drop deadline is Week 8 of each semester.',
    },
  });
  console.log(`✅ Knowledge Base & Document seeded`);

  // ── 11. Facilities & Examinations ─────────────────────────────────────────
  const facilities = await Promise.all([
    prisma.facility.upsert({
      where: { id: 'facility-th-101' },
      update: {},
      create: { id: 'facility-th-101', organizationId: org.id, name: 'Tech Hall 101', building: 'Tech Hall', roomNumber: '101', capacity: 40, facilityType: 'Lecture Hall' },
    }),
    prisma.facility.upsert({
      where: { id: 'facility-sb-201' },
      update: {},
      create: { id: 'facility-sb-201', organizationId: org.id, name: 'Science Block 201', building: 'Science Block', roomNumber: '201', capacity: 35, facilityType: 'Lecture Hall' },
    }),
    prisma.facility.upsert({
      where: { id: 'facility-aud-a' },
      update: {},
      create: { id: 'facility-aud-a', organizationId: org.id, name: 'Main Auditorium A', building: 'Central Block', roomNumber: 'Aud-A', capacity: 120, facilityType: 'Auditorium' },
    }),
  ]);

  const exam = await prisma.examination.upsert({
    where: { id: 'exam-fall-2026-mid' },
    update: {},
    create: {
      id: 'exam-fall-2026-mid',
      organizationId: org.id,
      name: 'Midterm Examination 1 - Fall 2026',
      term: 'Fall 2026',
      academicYear: '2026-2027',
      startDate: new Date('2026-09-15T09:30:00.000Z'),
      endDate: new Date('2026-09-22T17:00:00.000Z'),
      status: 'SCHEDULED',
    },
  });

  // ── 12. Weekly Timetable Entries ──────────────────────────────────────────
  await prisma.timetableEntry.deleteMany({ where: { organizationId: org.id } });
  await prisma.timetableEntry.createMany({
    data: [
      { organizationId: org.id, facultyId: faculty[0].id, courseCode: 'CS401', courseTitle: 'Algorithms & Data Structures', dayOfWeek: 'Monday', startTime: '09:00 AM', endTime: '10:30 AM', room: 'Tech Hall 101', term: 'Fall 2026', academicYear: '2026-2027' },
      { organizationId: org.id, facultyId: faculty[0].id, courseCode: 'CS501', courseTitle: 'Machine Learning', dayOfWeek: 'Monday', startTime: '11:00 AM', endTime: '12:30 PM', room: 'Tech Hall 102', term: 'Fall 2026', academicYear: '2026-2027' },
      { organizationId: org.id, facultyId: faculty[1].id, courseCode: 'MATH301', courseTitle: 'Linear Algebra', dayOfWeek: 'Tuesday', startTime: '09:30 AM', endTime: '11:00 AM', room: 'Science Block 201', term: 'Fall 2026', academicYear: '2026-2027' },
      { organizationId: org.id, facultyId: faculty[2].id, courseCode: 'EE401', courseTitle: 'Digital Signal Processing', dayOfWeek: 'Wednesday', startTime: '10:00 AM', endTime: '11:30 AM', room: 'Engineering Wing 301', term: 'Fall 2026', academicYear: '2026-2027' },
      { organizationId: org.id, facultyId: faculty[0].id, courseCode: 'CS401', courseTitle: 'Algorithms Lab', dayOfWeek: 'Thursday', startTime: '02:00 PM', endTime: '04:00 PM', room: 'Computer Lab 3', term: 'Fall 2026', academicYear: '2026-2027' },
      { organizationId: org.id, facultyId: faculty[1].id, courseCode: 'MATH301', courseTitle: 'Optimization Seminar', dayOfWeek: 'Friday', startTime: '01:30 PM', endTime: '03:00 PM', room: 'Science Block 202', term: 'Fall 2026', academicYear: '2026-2027' },
    ],
  });
  console.log(`✅ Weekly Timetables seeded`);

  // ── 13. Exam Seating Arrangements ─────────────────────────────────────────
  await prisma.examSeatingArrangement.deleteMany({ where: { organizationId: org.id } });
  const sampleArrangements = [
    { bench: 'B-01', row: 1, col: 1, pos: 'Left', roll: 'CS-2026-001', name: 'Alice Johnson', code: 'CS401', title: 'Algorithms & Data Structures' },
    { bench: 'B-01', row: 1, col: 1, pos: 'Right', roll: 'MATH-2026-002', name: 'Bob Williams', code: 'MATH301', title: 'Linear Algebra' },
    { bench: 'B-02', row: 1, col: 2, pos: 'Left', roll: 'CS-2026-003', name: 'Carol Davis', code: 'CS401', title: 'Algorithms & Data Structures' },
    { bench: 'B-02', row: 1, col: 2, pos: 'Right', roll: 'EE-2026-004', name: 'Dan Miller', code: 'EE401', title: 'Digital Signal Processing' },
    { bench: 'B-03', row: 2, col: 1, pos: 'Left', roll: 'CS-2026-005', name: 'Eva Wilson', code: 'CS401', title: 'Algorithms & Data Structures' },
    { bench: 'B-03', row: 2, col: 1, pos: 'Right', roll: 'MATH-2026-006', name: 'Frank Taylor', code: 'MATH301', title: 'Linear Algebra' },
  ];

  await prisma.examSeatingArrangement.createMany({
    data: sampleArrangements.map(a => ({
      organizationId: org.id,
      examinationId: exam.id,
      facilityId: facilities[0].id,
      facultyId: faculty[0].id, // Invigilator: Prof. John Smith
      examDate: new Date('2026-09-15T09:30:00.000Z'),
      sessionSlot: 'Morning (09:30 AM - 12:30 PM)',
      hallNumber: 'Tech Hall 101',
      benchNumber: a.bench,
      rowNumber: a.row,
      columnNumber: a.col,
      seatPosition: a.pos,
      studentRollNo: a.roll,
      studentName: a.name,
      courseCode: a.code,
      courseTitle: a.title,
    })),
  });
  console.log(`✅ Exam Seating Arrangements seeded (Zig-zag Alternate allocation)`);

  // ── 14. Usage Events ──────────────────────────────────────────────────────
  await prisma.usageEvent.createMany({
    data: [
      { organizationId: org.id, type: 'CHAT', tokensInput: 150, tokensOutput: 320, estimatedCost: 0.0008 },
      { organizationId: org.id, type: 'EMBEDDING', embeddingTokens: 512, estimatedCost: 0.00001 },
      { organizationId: org.id, type: 'RETRIEVAL', tokensInput: 80, estimatedCost: 0.0001 },
    ],
    skipDuplicates: true,
  });

  // ── 15. Plan Limits ───────────────────────────────────────────────────────
  await prisma.planLimits.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id, messagesPerMonth: 5000, embeddingQuota: 100000, documentQuota: 200, storageQuotaBytes: 5368709120 },
  });

  console.log('\n🎉 University seed complete!');
  console.log(`   Org ID: ${org.id}`);
  console.log(`   Departments: ${depts.length}, Faculty: ${faculty.length}, Courses: ${courses.length}`);
  console.log(`   Students: ${students.length} (${students.filter(s => s.academicStatus === 'Academic Probation').length} on probation)`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
