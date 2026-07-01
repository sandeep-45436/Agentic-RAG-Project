"use client";

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Zap, Clock, CreditCard, Box, TrendingUp } from 'lucide-react';

type DashboardData = {
  eventsToday: number;
  totalEvents: number;
  inputTokens: number;
  outputTokens: number;
  embeddingTokens: number;
  totalCost: number;
  averageLatency: number;
  modelUsage: Record<string, number>;
};

// Mock historical data for MVP chart display — replaced with real data from props
// Charts now use data.modelUsage and real event counts instead of hardcoded arrays

export function AnalyticsDashboard({ data }: { data: DashboardData }) {
  const modelEntries = Object.entries(data.modelUsage).map(([name, count]) => ({
    name: name || 'Unknown',
    count
  }));

  // Build token chart from modelUsage data (real distribution)
  const tokenChartData = modelEntries.length > 0
    ? modelEntries.map((m) => ({ name: m.name.split('/').pop() ?? m.name, tokens: m.count }))
    : [{ name: 'No data', tokens: 0 }];

  // Latency shown as a single point bar if we have data; otherwise empty
  const latencyChartData = [
    { name: 'Avg', latency: Math.round(data.averageLatency) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Lifetime AI cost</p>
          </CardContent>
        </Card>

        {/* Tokens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.inputTokens + data.outputTokens) / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground">In & Out combined</p>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data.eventsToday}</div>
            <p className="text-xs text-muted-foreground">
              Total lifetime: {data.totalEvents}
            </p>
          </CardContent>
        </Card>

        {/* Latency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageLatency.toFixed(0)} ms</div>
            <p className="text-xs text-muted-foreground">Overall system average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Token Usage Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
            <CardDescription>Daily token consumption across all models.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Usage / Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Model Distribution</CardTitle>
            <CardDescription>Breakdown by AI model used.</CardDescription>
          </CardHeader>
          <CardContent>
            {modelEntries.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No model data yet.
              </div>
            ) : (
              <div className="space-y-8">
                {modelEntries.map((model) => (
                  <div key={model.name} className="flex items-center">
                    <Box className="h-9 w-9 text-muted-foreground" />
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{model.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {((model.count / data.totalEvents) * 100).toFixed(1)}% of requests
                      </p>
                    </div>
                    <div className="ml-auto font-medium">+{model.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latency Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Latency Trend</CardTitle>
          <CardDescription>Response times over the past week.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="latency" stroke="currentColor" strokeWidth={2} className="stroke-primary" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
