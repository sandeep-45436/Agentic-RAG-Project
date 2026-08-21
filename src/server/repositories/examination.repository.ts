import { db } from "@/server/db/prisma";
import { ExaminationStatus, HallTicketEligibilityStatus } from "@prisma/client";

export interface CreateExaminationInput {
  organizationId: string;
  name: string;
  term: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status?: ExaminationStatus;
}

export class ExaminationRepository {
  public static async createExamination(data: CreateExaminationInput) {
    return await db.examination.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        term: data.term,
        academicYear: data.academicYear,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || "DRAFT",
      },
    });
  }

  public static async findExaminationById(examinationId: string, organizationId: string) {
    return await db.examination.findFirst({
      where: {
        id: examinationId,
        organizationId,
        deletedAt: null,
      },
      include: {
        schedules: {
          include: {
            courseSection: {
              include: { course: true },
            },
            facility: true,
          },
        },
        invigilationAssignments: {
          include: {
            faculty: {
              include: { user: true },
            },
            facility: true,
          },
        },
      },
    });
  }

  public static async listExaminations(organizationId: string, status?: ExaminationStatus) {
    return await db.examination.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(status && { status }),
      },
      orderBy: { startDate: "desc" },
    });
  }

  public static async updateExaminationStatus(
    examinationId: string,
    organizationId: string,
    newStatus: ExaminationStatus
  ) {
    return await db.examination.updateMany({
      where: {
        id: examinationId,
        organizationId,
      },
      data: { status: newStatus },
    });
  }

  public static async saveEligibilityRecord(data: {
    organizationId: string;
    examinationId: string;
    studentId: string;
    status: HallTicketEligibilityStatus;
    attendanceEligible: boolean;
    marksEligible: boolean;
    feeEligible: boolean;
    disciplinaryEligible: boolean;
    finalEligible: boolean;
    requiresApproval: boolean;
    blockingReasons: any;
    recommendations: any;
    policyReferences: any;
  }) {
    return await db.examinationEligibility.upsert({
      where: {
        examinationId_studentId: {
          examinationId: data.examinationId,
          studentId: data.studentId,
        },
      },
      update: {
        status: data.status,
        attendanceEligible: data.attendanceEligible,
        marksEligible: data.marksEligible,
        feeEligible: data.feeEligible,
        disciplinaryEligible: data.disciplinaryEligible,
        finalEligible: data.finalEligible,
        requiresApproval: data.requiresApproval,
        blockingReasons: data.blockingReasons,
        recommendations: data.recommendations,
        policyReferences: data.policyReferences,
        evaluatedAt: new Date(),
      },
      create: {
        organizationId: data.organizationId,
        examinationId: data.examinationId,
        studentId: data.studentId,
        status: data.status,
        attendanceEligible: data.attendanceEligible,
        marksEligible: data.marksEligible,
        feeEligible: data.feeEligible,
        disciplinaryEligible: data.disciplinaryEligible,
        finalEligible: data.finalEligible,
        requiresApproval: data.requiresApproval,
        blockingReasons: data.blockingReasons,
        recommendations: data.recommendations,
        policyReferences: data.policyReferences,
      },
    });
  }

  public static async getEligibilityRoster(examinationId: string, organizationId: string) {
    return await db.examinationEligibility.findMany({
      where: {
        examinationId,
        organizationId,
      },
      include: {
        student: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });
  }
}
