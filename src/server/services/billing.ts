import { db as prisma } from '../db/prisma';

export const BillingService = {
  /**
   * Initializes or fetches plan limits for an organization.
   */
  async getPlanLimits(organizationId: string) {
    const limits = await prisma.planLimits.findUnique({
      where: { organizationId }
    });

    if (limits) return limits;

    // Auto-create free tier defaults if none exist
    return await prisma.planLimits.create({
      data: {
        organizationId,
        messagesPerMonth: 1000,
        embeddingQuota: 50000,
        documentQuota: 50,
        storageQuotaBytes: 536870912 // 512 MB
      }
    });
  },

  /**
   * Checks if an organization is within its quota limits for a given operation.
   * Can be extended to specifically check for embeddings, messages, or storage.
   */
  async checkQuota(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getPlanLimits(organizationId);

    // In a fully implemented version, we would aggregate the usage for the current month
    // and compare it against the limit. For MVP, we ensure the infrastructure is in place.
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyMessages = await prisma.usageEvent.count({
      where: {
        organizationId,
        type: 'CHAT',
        createdAt: { gte: startOfMonth }
      }
    });

    if (monthlyMessages >= limits.messagesPerMonth) {
      return { allowed: false, reason: 'Monthly message quota exceeded.' };
    }

    return { allowed: true };
  }
};
