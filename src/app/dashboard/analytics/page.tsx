import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AnalyticsService } from '@/server/services/analytics';
import { createClient } from '@/utils/insforge/server';
import { db } from '@/server/db/prisma';
import { redirect } from 'next/navigation';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Usage Analytics | Dashboard',
  description: 'View usage, latency, tokens, and cost metrics for your organization.',
};

export default async function AnalyticsPage() {
  const insforge = await createClient();
  const { data, error } = await insforge.auth.getCurrentUser();

  if (error || !data?.user) redirect('/login');
  const user = data.user;

  const membership = await db.membership.findFirst({ where: { userId: user.id } });
  if (!membership) redirect('/login');

  const metrics = await AnalyticsService.getDashboardMetrics(membership.organizationId);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <AnalyticsDashboard data={metrics} />
    </div>
  );
}
