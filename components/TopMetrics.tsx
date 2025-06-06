'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { spc } from '@/lib/spc'
import { createClient } from '@/lib/supabaseClient'

const COLORS = ['#007bff', '#28a745', '#ffc107', '#6c757d']

export default function TopMetrics({
  clientId,
  startDate,
  endDate,
}: {
  clientId: string
  startDate: string
  endDate: string
}) {
  const supabase = createClient()

  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data: client } = await supabase
        .from('clients_ffs')
        .select('ppc_sources, lsa_sources, seo_sources')
        .eq('cr_client_id', clientId)
        .single()

      const { data: leads } = await supabase
        .from('hmstr_leads')
        .select('*')
        .eq('client_id', clientId)
        .gte('last_qual_date', startDate)
        .lte('last_qual_date', endDate)

      const ppcLeads = spc(leads, client?.ppc_sources || [])
      const lsaLeads = spc(leads, client?.lsa_sources || [])
      const seoLeads = spc(leads, client?.seo_sources || [])
      const allLeads = leads

      const calcAvg = (arr: any[], key: string) =>
        arr.length > 0
          ? arr.reduce((sum, obj) => sum + (obj[key] || 0), 0) / arr.length
          : 0

      const { data: spendLsa } = await supabase
        .from('spend_data_lsa')
        .select('spend')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate)

      const { data: spendSeo } = await supabase
        .from('spend_data_seo')
        .select('spend')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate)

      const { data: spendPpc } = await supabase
        .from('googleads_campain_data')
        .select('cost_micros')
        .eq('google_ads_customer_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate)

      const totalPpc = (spendPpc || []).reduce((sum, s) => sum + s.cost_micros / 1e6, 0)
      const totalLsa = (spendLsa || []).reduce((sum, s) => sum + s.spend, 0)
      const totalSeo = (spendSeo || []).reduce((sum, s) => sum + s.spend, 0)
      const totalAll = totalPpc + totalLsa + totalSeo

      setMetrics({
        count: {
          all: allLeads.length,
          ppc: ppcLeads.length,
          lsa: lsaLeads.length,
          seo: seoLeads.length,
        },
        cost: {
          all: totalAll,
          ppc: totalPpc,
          lsa: totalLsa,
          seo: totalSeo,
        },
        costPer: {
          all: totalAll / (allLeads.length || 1),
          ppc: totalPpc / (ppcLeads.length || 1),
          lsa: totalLsa / (lsaLeads.length || 1),
          seo: totalSeo / (seoLeads.length || 1),
        },
        avgScore: {
          all: {
            lead: calcAvg(allLeads, 'lead_score_max'),
            sales: calcAvg(allLeads, 'close_score_max'),
          },
          ppc: {
            lead: calcAvg(ppcLeads, 'lead_score_max'),
            sales: calcAvg(ppcLeads, 'close_score_max'),
          },
          lsa: {
            lead: calcAvg(lsaLeads, 'lead_score_max'),
            sales: calcAvg(lsaLeads, 'close_score_max'),
          },
          seo: {
            lead: calcAvg(seoLeads, 'lead_score_max'),
            sales: calcAvg(seoLeads, 'close_score_max'),
          },
        },
      })
    }

    fetchMetrics()
  }, [clientId, startDate, endDate])

  if (!metrics) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-semibold">
        Top Metrics
        <span className="block text-sm text-muted-foreground">
          Showing data from {startDate} to {endDate}
        </span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">All QLeads: {metrics.count.all}</CardContent></Card>
        <Card><CardContent className="p-4">PPC QLeads: {metrics.count.ppc}</CardContent></Card>
        <Card><CardContent className="p-4">LSA QLeads: {metrics.count.lsa}</CardContent></Card>
        <Card><CardContent className="p-4">SEO QLeads: {metrics.count.seo}</CardContent></Card>
        <Card><CardContent className="p-4">Total Cost (All): ${metrics.cost.all.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Total Cost (PPC): ${metrics.cost.ppc.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Total Cost (LSA): ${metrics.cost.lsa.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Total Cost (SEO): ${metrics.cost.seo.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Cost/QL (All): ${metrics.costPer.all.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Cost/QL (PPC): ${metrics.costPer.ppc.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Cost/QL (LSA): ${metrics.costPer.lsa.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Cost/QL (SEO): ${metrics.costPer.seo.toFixed(2)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg Lead Score: {metrics.avgScore.all.lead.toFixed(1)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg Sales Score: {metrics.avgScore.all.sales.toFixed(1)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg PPC Lead Score: {metrics.avgScore.ppc.lead.toFixed(1)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg PPC Sales Score: {metrics.avgScore.ppc.sales.toFixed(1)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg LSA Lead Score: {metrics.avgScore.lsa.lead.toFixed(1)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg LSA Sales Score: {metrics.avgScore.lsa.sales.toFixed(1)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg SEO Lead Score: {metrics.avgScore.seo.lead.toFixed(1)}</CardContent></Card>
        <Card><CardContent className="p-4">Avg SEO Sales Score: {metrics.avgScore.seo.sales.toFixed(1)}</CardContent></Card>
      </div>

      <Separator />

      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={[
                { name: 'PPC', value: metrics.count.ppc },
                { name: 'LSA', value: metrics.count.lsa },
                { name: 'SEO', value: metrics.count.seo },
              ]}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {COLORS.map((color, index) => (
                <Cell key={index} fill={color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
