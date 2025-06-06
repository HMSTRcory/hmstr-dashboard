import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function get_spc_metrics_by_channel(
  clientId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const sources = ['ppc', 'lsa', 'seo'];

  const response = await supabase
    .from('hmstr_leads')
    .select('lead_score_max, close_score_max, source')
    .eq('client_id', clientId)
    .gte('last_qual_date', startDate)
    .lte('last_qual_date', endDate);

  if (response.error) {
    console.error('Error fetching metrics:', response.error);
    return null;
  }

  const rows = response.data ?? [];

  const channelData = {
    ppc: [],
    lsa: [],
    seo: [],
    other: [],
  };

  for (const row of rows) {
    const source: string = row.source;
    const leadScore = row.lead_score_max ?? 0;
    const closeScore = row.close_score_max ?? 0;

    const channel =
      sources.find((src) => source.toLowerCase().includes(src)) ?? 'other';

    channelData[channel].push({ leadScore, closeScore });
  }

  const result: Record<
    string,
    { total: number; avg_lead: number; avg_close: number }
  > = {};

  for (const channel of Object.keys(channelData)) {
    const leads = channelData[channel];
    const total = leads.length;

    const avg_lead =
      total > 0
        ? leads.reduce((sum, r) => sum + r.leadScore, 0) / total
        : 0;
    const avg_close =
      total > 0
        ? leads.reduce((sum, r) => sum + r.closeScore, 0) / total
        : 0;

    result[channel] = {
      total,
      avg_lead: Math.round(avg_lead * 10) / 10,
      avg_close: Math.round(avg_close * 10) / 10,
    };
  }

  return result;
}
