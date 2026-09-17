import { Activity, AlertTriangle, Boxes, CheckCircle2 } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Panel, PageHeader, StatCard } from '../components/ui';
import {
  ALERTS,
  DAILY_PRODUCTION,
  ORDERS,
  SITES,
  STAGE_VOLUMES,
  atRiskOrders,
  avgOnTimeRate,
  getBrandColor,
  todayProduction,
  totalOrders,
  totalUnits,
} from '../data';

export default function Dashboard() {
  const onTime = Math.round(avgOnTimeRate);
  const topAlerts = ALERTS.filter(a => a.severity !== 'info').slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Vue d’ensemble"
        subtitle="Réseau de production — Menzel Temime & Menzel Bouzelfa · mise à jour il y a 12 min"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="Production aujourd’hui" value={todayProduction.toLocaleString('en-US')} delta="3.2%" deltaUp icon={<Activity size={16} />} />
        <StatCard label="Commandes actives" value={String(totalOrders)} delta={`${atRiskOrders} à risque`} deltaUp={atRiskOrders === 0} icon={<Boxes size={16} />} />
        <StatCard label="Volume en cours" value={totalUnits.toLocaleString('en-US')} hint="pièces sur l'ensemble des marques" icon={<CheckCircle2 size={16} />} />
        <StatCard label="Taux de conformité" value={`${onTime}%`} delta="2 pts" deltaUp icon={<AlertTriangle size={16} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
        <Panel title="Production planifiée vs réelle — 14 derniers jours">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={DAILY_PRODUCTION} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e8e1" />
              <XAxis dataKey="date" fontSize={10.5} tickLine={false} axisLine={false} />
              <YAxis fontSize={10.5} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <RTooltip />
              <Area type="monotone" dataKey="planned" name="Planifié" stroke="#94a3b8" strokeWidth={2} fill="url(#gradPlanned)" />
              <Area type="monotone" dataKey="actual" name="Réel" stroke="#10b981" strokeWidth={2.5} fill="url(#gradActual)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Volume par étape">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={STAGE_VOLUMES} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e8e1" horizontal={false} />
              <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <YAxis type="category" dataKey="stage" width={86} fontSize={10.5} tickLine={false} axisLine={false} />
              <RTooltip />
              <Bar dataKey="units" name="Unités" radius={[0, 4, 4, 0]} fill="var(--accent-bright)" barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <Panel title="Commandes récentes">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ORDERS.slice(0, 6).map(o => {
              const site = SITES.find(s => s.id === o.siteId);
              return (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: getBrandColor(o.brand), flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{o.reference} — {o.product}</div>
                    <div style={{ fontSize: 11, color: '#7a8578' }}>
                      {o.brand} · {site?.name ?? '-'} · {o.quantity.toLocaleString('en-US')} pcs · échéance {o.dueDate}
                    </div>
                  </div>
                  <div style={{ width: 120 }}>
                    <div style={{ fontSize: 10.5, color: '#7a8578', marginBottom: 3 }}>{o.progressPct}%</div>
                    <div style={{ height: 5, background: '#e5e8e1', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${o.progressPct}%`,
                        background: o.status === 'at_risk' ? '#d97706' : o.status === 'delayed' ? '#dc2626' : '#16a34a',
                        borderRadius: 999,
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Alertes récentes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topAlerts.map(a => (
              <div key={a.id} style={{
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${a.severity === 'critical' ? '#dc2626' : '#d97706'}`,
                borderRadius: 8,
                padding: '10px 12px',
                background: '#fff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{a.title}</div>
                  <span style={{ fontSize: 10, color: '#9aa39b', whiteSpace: 'nowrap' }}>{a.time}</span>
                </div>
                <div style={{ fontSize: 11, color: '#687467', marginTop: 3, lineHeight: 1.4 }}>{a.description}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}