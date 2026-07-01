import { BaseRepository } from "./base.repository";
import { UsageType } from "@prisma/client";

export class UsageRepository extends BaseRepository {
  /**
   * Records a new usage event for billing/audit
   */
  async recordUsage(organizationId: string, type: UsageType, count: number = 1) {
    // Legacy support for count if needed, but primarily inserts events
    return this.db.usageEvent.create({
      data: {
        organizationId,
        type,
      }
    });
  }

  /**
   * Retrieves aggregated usage for a specific type in the current month
   */
  async getMonthlyUsage(organizationId: string, type: UsageType) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.db.usageEvent.count({
      where: {
        organizationId,
        type,
        createdAt: {
          gte: startOfMonth,
        }
      }
    });

    return result || 0;
  }
}
