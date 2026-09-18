import { db } from "../src/server/db/prisma";

async function addRemainingTwoFaculty() {
  const math = await db.department.findFirst({ where: { code: "MATH" } });
  const ee = await db.department.findFirst({ where: { code: "EE" } });

  if (math) {
    const mathUser = await db.user.upsert({
      where: { email: "prof.math.01@smartuniversity.edu" },
      update: {},
      create: { email: "prof.math.01@smartuniversity.edu", name: "Dr. Vikram Joshi" },
    });
    await db.faculty.upsert({
      where: { facultyCode: "FAC-MATH-001" },
      update: {},
      create: {
        organizationId: math.organizationId,
        userId: mathUser.id,
        facultyCode: "FAC-MATH-001",
        departmentId: math.id,
        title: "Professor",
        designation: "Professor of Computational Mathematics",
        specialization: "Numerical Analysis & Dynamic Modeling",
        tenureStatus: "Tenured",
        officeRoom: "MATH-Room-201",
      },
    });
  }

  if (ee) {
    const eeUser = await db.user.upsert({
      where: { email: "prof.ee.01@smartuniversity.edu" },
      update: {},
      create: { email: "prof.ee.01@smartuniversity.edu", name: "Dr. Meera Nair" },
    });
    await db.faculty.upsert({
      where: { facultyCode: "FAC-EE-001" },
      update: {},
      create: {
        organizationId: ee.organizationId,
        userId: eeUser.id,
        facultyCode: "FAC-EE-001",
        departmentId: ee.id,
        title: "Professor",
        designation: "Professor of Power & Grid Systems",
        specialization: "Smart Grid Infrastructure",
        tenureStatus: "Tenured",
        officeRoom: "EE-Room-201",
      },
    });
  }

  console.log("Added remaining 2 faculty members.");
}

addRemainingTwoFaculty().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
