import { db } from "@/server/db/prisma";

export class FinancialRepository {
  static async findOutstandingBalances(organizationId: string, limit = 10) {
    return db.financialAccount.findMany({
      where: {
        organizationId,
        balanceOutstanding: { gt: 0 },
        deletedAt: null,
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { code: true } },
          },
        },
      },
      orderBy: { balanceOutstanding: "desc" },
      take: limit,
    });
  }

  static async getFinancialSummary(organizationId: string) {
    const aggregate = await db.financialAccount.aggregate({
      where: { organizationId, deletedAt: null },
      _sum: { totalBilled: true, totalPaid: true, balanceOutstanding: true },
      _count: { id: true },
    });

    return {
      totalAccounts: aggregate._count.id,
      totalBilled: aggregate._sum.totalBilled || 0,
      totalPaid: aggregate._sum.totalPaid || 0,
      totalOutstanding: aggregate._sum.balanceOutstanding || 0,
    };
  }
}
