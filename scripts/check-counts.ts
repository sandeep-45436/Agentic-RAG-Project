import { db } from "../src/server/db/prisma";

async function main() {
  const depts = await db.department.findMany();
  console.log("Departments found:", depts.length);
  for (const d of depts) {
    const s = await db.student.count({ where: { departmentId: d.id } });
    const f = await db.faculty.count({ where: { departmentId: d.id } });
    console.log(`Dept: ${d.code} (${d.name}) -> ${s} students, ${f} faculty`);
  }
  const totalStudents = await db.student.count();
  const totalFaculty = await db.faculty.count();
  console.log(`TOTAL: ${totalStudents} students, ${totalFaculty} faculty`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
