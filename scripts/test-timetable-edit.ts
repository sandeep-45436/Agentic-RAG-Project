import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "../src/server/db/prisma";
import { FacultyService } from "../src/server/services/faculty.service";

async function testTimetableEdit() {
  console.log("===============================================================================");
  console.log("🧪 TESTING TIMETABLE EDIT & RENAME FUNCTIONALITY");
  console.log("===============================================================================\n");

  const orgId = "seed-org-001";
  const faculty = await db.faculty.findFirst({ where: { organizationId: orgId } });
  const facultyId = faculty?.id;

  // 1. Create a test slot
  console.log("1. Creating test slot...");
  const slot = await FacultyService.createTimetableEntry({
    organizationId: orgId,
    facultyId,
    courseCode: "TEST-CS101",
    courseTitle: "Initial Computer Science Intro",
    dayOfWeek: "Friday",
    startTime: "04:00 PM",
    endTime: "05:30 PM",
    room: "Virtual Lab 99",
  });
  console.log("   Created slot ID:", slot.id, "| Title:", slot.courseTitle);

  // 2. Rename and edit the slot
  console.log("2. Editing & Renaming slot...");
  const updated = await FacultyService.updateTimetableEntry(slot.id, {
    courseTitle: "Renamed: Advanced Computational Algorithms",
    courseCode: "TEST-CS101-ADV",
    room: "Virtual Lab 99-B",
  });
  console.log("   Updated Title:", updated.courseTitle);
  console.log("   Updated Code:", updated.courseCode);
  console.log("   Updated Room:", updated.room);

  if (updated.courseTitle === "Renamed: Advanced Computational Algorithms" && updated.courseCode === "TEST-CS101-ADV") {
    console.log("\n✅ [PASS] Timetable slot successfully edited and renamed!");
  } else {
    console.error("\n❌ [FAIL] Update did not match expected values.");
    process.exit(1);
  }

  // 3. Clean up
  await FacultyService.deleteTimetableEntry(slot.id);
  console.log("3. Cleaned up test slot.");
  console.log("\n===============================================================================\n");
}

testTimetableEdit()
  .catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
