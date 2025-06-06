import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function get_spc_metrics_by_channel(
  clientId: string,
  startDate: string,
  endDate: string
) {
  const { data: clientData, error: clientError } = await supabase
    .from('clients_ffs')
    .select('ppc_sources, lsa_sources, seo_sources')
    .eq('cr_client_id', clientId)
    .single();

  if (clientError || !clientData) {
    console.error('Error fetching client sources:', clientError);
    return null;
  }

  const { ppc_sources, lsa_sources, seo_sources } = clientData;

  const { data: leads, error: leadsError } = await supabase
    .from('hmstr_leads')
    .select('source, lead_score_max, close_score_max')
    .eq('cr_client_id', clientId)
    .gte('last_qual_date', startDate)
    .lte('last_qual_date', endDate);

  if (leadsError || !leads) {
    console.error('Error fetching leads:', leadsError);
    return null;
  }

  const buckets: {
    [key in 'ppc' | 'lsa' | 'seo' | 'other']: {
      leads: number;
      totalLeadScore: number;
      totalCloseScore: number;
    };
  } = {
    ppc: { leads: 0, totalLeadScore: 0, totalCloseScore: 0 },
    lsa: { leads: 0, totalLeadScore: 0, totalCloseScore: 0 },
    seo: { leads: 0, totalLeadScore: 0, totalCloseScore: 0 },
    other: { leads: 0, totalLeadScore: 0, totalCloseScore: 0 },
  };

  for (const lead of leads) {
    const { source, lead_score_max, close_score_max } = lead;
    let bucket: keyof typeof buckets = 'other';

    if (ppc_sources.includes(source)) bucket = 'ppc';
    else if (lsa_sources.includes(source)) bucket = 'lsa';
    else if (seo_sources.includes(source)) bucket = 'seo';

    buckets[bucket].leads += 1;
    buckets[bucket].totalLeadScore += lead_score_max ?? 0;
    buckets[bucket].totalCloseScore += close_score_max ?? 0;
  }

  const result = Object.entries(buckets).map(([channel, data]) => ({
    channel,
    leads: data.leads,
    avgLeadScore:
      data.leads > 0 ? parseFloat((data.totalLeadScore / data.leads).toFixed(1)) : 0,
    avgCloseScore:
      data.leads > 0 ? parseFloat((data.totalCloseScore / data.leads).toFixed(1)) : 0,
  }));

  return result;
}
