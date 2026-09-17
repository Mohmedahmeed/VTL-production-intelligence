import { useState } from 'react';
import { PageHeader, Panel, ProgressBar, StatusBadge } from '../components/ui';
import { BRANDS, ORDERS, SITES, getBrandColor } from '../data';

export default function Production() {
  const [filter, setFilter] = useState('all');
  const brands = ['all', ...BRANDS.map(b => b.brand)];

  const filtered = filter === 'all' ? ORDERS : ORDERS.filter(o => o.brand === filter);

  return (
    <div>
      <PageHeader
        title="Suivi de production"
        subtitle="Commandes en cours par site et par étape"
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setFilter(b)}
                style={{
                  border: `1px solid ${filter === b ? 'var(--accent)' : 'var(--border)'}`,
                  background: filter === b ? 'var(--accent)' : '#fff',
                  color: filter === b ? '#fff' : '#3f4739',
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {b}
              </button>
            ))}
          </div>
        }
      />

      <Panel title={`Commandes en cours (${filtered.length})`} style={{ padding: '8px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map(o => {
            const site = SITES.find(s => s.id === o.siteId);
            return (
              <div key={o.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: getBrandColor(o.brand), flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{o.reference}</span>
                  <span style={{ fontSize: 12, color: '#3f4739' }}>{o.product}</span>
                  <span style={{ fontSize: 11.5, color: '#7a8578' }}>
                    {o.quantity.toLocaleString('en-US')} pcs · {o.colorways} coloris
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={o.status} />
                    <span style={{ fontSize: 11, color: '#7a8578' }}>étape : {o.stage}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 110px', gap: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#7a8578', marginBottom: 4 }}>
                      <span>Avancement</span>
                      <span>{o.progressPct}%</span>
                    </div>
                    <ProgressBar pct={o.progressPct} color={o.status === 'at_risk' ? '#d97706' : o.status === 'delayed' ? '#dc2626' : undefined} />
                  </div>
                  <div style={{ fontSize: 11, color: '#687467' }}>
                    <div style={{ fontWeight: 600, color: '#3f4739' }}>{site?.name}</div>
                    <div>{site?.location}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#687467' }}>
                    <div style={{ fontWeight: 600, color: '#3f4739' }}>{o.progressPct >= 50 ? 'En production' : 'Démarrage'}</div>
                    <div>Démarré le {o.startedDate}</div>
                  </div>
                  <div style={{ fontSize: 11, color: o.status === 'at_risk' ? '#b45309' : '#687467' }}>
                    <div style={{ fontWeight: 600, color: '#3f4739' }}>Échéance</div>
                    <div>{o.dueDate}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}