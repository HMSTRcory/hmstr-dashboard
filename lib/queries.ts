import supabase from './supabaseClient';

export async function get_spc_metrics_by_channel(clientId: string, startDate: string, endDate: string) {
  const sources = ['ppc', 'lsa', 'seo'];
  const initial = { count: 0, leadScore: 0, closeScore: 0 };

  const metrics: Record<string, { count: number; leadScore: number; closeScore: number }> = {
    all: { ...initial },
    ppc: { ...initial },
    lsa: { ...initial },
    seo: { ...initial },
  };

  const { data } = await supabase
    .from('hmstr_leads')
    .select('lead_score, close_score, source')
    .eq('client_id', clientId)
    .gte('action_date', startDate)
    .lte('action_date', endDate)
    .eq('lead_qualified', true);

  if (data) {
    for (const row of data) {
      const source = sources.includes(row.source) ? row.source : 'all';
      metrics[source].count++;
      metrics[source].leadScore += row.lead_score ?? 0;
      metrics[source].closeScore += row.close_score ?? 0;

      // also include in 'all'
      metrics.all.count++;
      metrics.all.leadScore += row.lead_score ?? 0;
      metrics.all.closeScore += row.close_score ?? 0;
    }
  }

  return metrics;
}

export async function get_spc_cost_by_channel(clientId: string, startDate: string, endDate: string) {
  const cost = {
    ppc: 0,
    lsa: 0,
    seo: 0,
    all: 0,
  };

  const [ppc, lsa, seo] = await Promise.all([
    supabase
      .from('googleads_campain_data')
      .select('cost_micros')
      .eq('google_ads_customer_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('spend_data_lsa')
      .select('spend')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('spend_data_seo')
      .select('spend')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate),
  ]);

  cost.ppc = (ppc.data || []).reduce((sum, row) => sum + row.cost_micros / 1_000_000, 0);
  cost.lsa = (lsa.data || []).reduce((sum, row) => sum + row.spend, 0);
  cost.seo = (seo.data || []).reduce((sum, row) => sum + row.spend, 0);
  cost.all = cost.ppc + cost.lsa + cost.seo;

  return cost;
}
