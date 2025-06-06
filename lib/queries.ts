import { supabase } from '@/lib/supabaseClient';

export async function getClientSources(clientId: string) {
  const { data, error } = await supabase
    .from('clients_ffs')
    .select('ppc_sources, lsa_sources, seo_sources')
    .eq('cr_client_id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client sources:', error);
    return {
      ppc: [],
      lsa: [],
      seo: [],
    };
  }

  return {
    ppc: data?.ppc_sources || [],
    lsa: data?.lsa_sources || [],
    seo: data?.seo_sources || [],
  };
}

export async function getLeads(clientId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('hmstr_leads')
    .select('source, lead_score_max, close_score_max')
    .eq('client_id', clientId)
    .gte('last_qual_date', startDate)
    .lte('last_qual_date', endDate);

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }

  return data || [];
}
