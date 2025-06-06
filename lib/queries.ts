// queries.ts
import { supabase } from './supabaseClient';

export async function get_spc_metrics_by_channel(clientId: string, startDate: string, endDate: string) {
  const sources = ['ppc', 'lsa', 'seo'];
  const result: Record<string, any> = {};

  for (const source of sources) {
    const { count, error } = await supabase
      .from('hmstr_leads')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('spc', source)
      .gte('last_qual_date', startDate)
      .lte('last_qual_date', endDate);

    if (error) {
      console.error(`Error fetching ${source} leads:`, error);
      result[source] = 0;
    } else {
      result[source] = count ?? 0;
    }
  }

  return result;
}
