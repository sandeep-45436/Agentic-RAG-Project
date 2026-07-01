import { db as prisma } from '../db/prisma';
import { UsageType } from '@prisma/client';

export type TrackUsageInput = {
  organizationId: string;
  userId?: string;
  type: UsageType;
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  embeddingTokens?: number;
  latencyMs?: number;
  metadata?: any;
};

export const AnalyticsService = {
  /**
   * Tracks an individual usage event asynchronously.
   * Calculates a rough estimated cost based on token usage.
   */
  async trackUsageEvent({
    organizationId,
    userId,
    type,
    model,
    tokensInput = 0,
    tokensOutput = 0,
    embeddingTokens = 0,
    latencyMs = 0,
    metadata
  }: TrackUsageInput) {
    let estimatedCost = 0;

    // Approximate cost estimation
    if (type === 'CHAT' || type === 'AGENT_EXECUTION') {
      // e.g., $0.15 / 1M input, $0.60 / 1M output (approximate for lightweight models)
      estimatedCost = (tokensInput * 0.00000015) + (tokensOutput * 0.00000060);
    } else if (type === 'EMBEDDING') {
      // e.g., $0.02 / 1M tokens
      estimatedCost = (embeddingTokens * 0.00000002);
    }

    try {
      // In production, we don't await this if we want it completely fire-and-forget, 
      // or we handle errors gracefully so it doesn't crash the main process.
      await prisma.usageEvent.create({
        data: {
          organizationId,
          userId,
          type,
          model,
          tokensInput,
          tokensOutput,
          embeddingTokens,
          latencyMs,
          estimatedCost,
          metadata: metadata ? (metadata as any) : undefined,
        }
      });
    } catch (error) {
      console.error('Failed to log analytics usage event:', error);
    }
  },

  /**
   * Fetches aggregated metrics for the analytics dashboard, ensuring cross-tenant isolation.
   */
  async getDashboardMetrics(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [eventsToday, totalEvents] = await Promise.all([
      prisma.usageEvent.findMany({
        where: {
          organizationId,
          createdAt: { gte: today }
        }
      }),
      prisma.usageEvent.findMany({
        where: { organizationId }
      })
    ]);

    const inputTokens = totalEvents.reduce((sum: number, e: any) => sum + (e.tokensInput || 0), 0);
    const outputTokens = totalEvents.reduce((sum: number, e: any) => sum + (e.tokensOutput || 0), 0);
    const embeddingTokens = totalEvents.reduce((sum: number, e: any) => sum + (e.embeddingTokens || 0), 0);
    const totalCost = totalEvents.reduce((sum: number, e: any) => sum + (e.estimatedCost || 0), 0);
    
    // Group by model
    const modelUsage: Record<string, number> = {};
    totalEvents.forEach((e: any) => {
      if (e.model) {
        modelUsage[e.model] = (modelUsage[e.model] || 0) + 1;
      }
    });

    const averageLatency = totalEvents.length > 0 
      ? totalEvents.reduce((sum: number, e: any) => sum + (e.latencyMs || 0), 0) / totalEvents.length 
      : 0;

    return {
      eventsToday: eventsToday.length,
      totalEvents: totalEvents.length,
      inputTokens,
      outputTokens,
      embeddingTokens,
      totalCost,
      averageLatency,
      modelUsage
    };
  }
};
