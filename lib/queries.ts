import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Update this path as needed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

type ClientRecord = {
  cr_client_id: string;
  cr_company_name: string;
  ppc_sources: string[];
  lsa_sources: string[];
  seo_sources: string[];
};

type LeadRecord = {
  id: string;
  last_qual_date: string;
  source: string;
  lead_score_max: number | null;
  close_score_max: number | null;
};

export async function getClients(): Promise<ClientRecord[]> {
  const { data, error } = await supabase
    .from('clients_ffs')
    .select('cr_client_id, cr_company_name, ppc_sources, lsa_sources, seo_sources')
    .eq('ads_active', true);

  if (error) {
    console.error('Error fetching clients:', error.message);
    return [];
  }

  return data as ClientRecord[];
}

export async function getLeadsByClient(
  clientId: string,
  startDate: string,
  endDate: string
): Promise<LeadRecord[]> {
  const { data, error } = await supabase
    .from('hmstr_leads')
    .select('id, last_qual_date, source, lead_score_max, close_score_max')
    .eq('client_id', clientId)
    .gte('last_qual_date', startDate)
    .lte('last_qual_date', endDate);

  if (error) {
    console.error(`Error fetching leads for client ${clientId}:`, error.message);
    return [];
  }

  return data as LeadRecord[];
}
