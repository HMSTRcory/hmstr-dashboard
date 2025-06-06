'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { get_spc_metrics_by_channel, get_spc_cost_by_channel } from '@/lib/queries';
import { format } from 'date-fns';

type Metrics = {
  count: number;
  leadScore: number;
  closeScore: number;
};

type Source = 'all' | 'ppc' | 'lsa' | 'seo';

const sources: Source[] = ['all', 'ppc', 'lsa', 'seo'];

type Props = {
  clientId: string;
  startDate: string;
  endDate: string;
};

export default function TopMetrics({ clientId, startDate, endDate }: Props) {
  const [metrics, setMetrics] = useState<Record<Source, Metrics>>({
    all: { count: 0, leadScore: 0, closeScore: 0 },
    ppc: { count: 0, leadScore: 0, closeScore: 0 },
    lsa: { count: 0, leadScore: 0, closeScore: 0 },
    seo: { count: 0, leadScore: 0, closeScore: 0 },
  });

  const [cost, setCost] = useState<Record<Source, number>>({
    all: 0,
    ppc: 0,
    lsa: 0,
    seo: 0,
  });

  useEffect(() => {
    if (!clientId || !startDate || !endDate) return;

    const fetchData = async () => {
      const [metricData, costData] = await Promise.all([
        get_spc_metrics_by_channel(clientId, startDate, endDate),
        get_spc_cost_by_channel(clientId, startDate, endDate),
      ]);
      setMetrics(metricData);
      setCost(costData);
    };

    fetchData();
  }, [clientId, startDate, endDate]);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const formatScore = (total: number, count: number) =>
    count > 0 ? (total / count).toFixed(1) : '0.0';

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground mb-4">
        Showing data from <strong>{format(new Date(startDate), 'MMM d, yyyy')}</strong> to{' '}
        <strong>{format(new Date(endDate), 'MMM d, yyyy')}</strong>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sources.map((source) => (
          <Card key={`qlead-${source}`}>
            <CardHeader>
              <CardTitle>{source.toUpperCase()} QLeads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics[source].count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sources.map((source) => (
          <Card key={`cost-${source}`}>
            <CardHeader>
              <CardTitle>Total Cost ({source.toUpperCase()})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(cost[source])}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sources.map((source) => (
          <Card key={`cost-per-${source}`}>
            <CardHeader>
              <CardTitle>Cost/QL ({source.toUpperCase()})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metrics[source].count > 0
                  ? formatCurrency(cost[source] / metrics[source].count)
                  : '$0.00'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sources.map((source) => (
          <Card key={`leadscore-${source}`}>
            <CardHeader>
              <CardTitle>Avg Lead Score ({source.toUpperCase()})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatScore(metrics[source].leadScore, metrics[source].count)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sources.map((source) => (
          <Card key={`closescore-${source}`}>
            <CardHeader>
              <CardTitle>Avg Sales Score ({source.toUpperCase()})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatScore(metrics[source].closeScore, metrics[source].count)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
