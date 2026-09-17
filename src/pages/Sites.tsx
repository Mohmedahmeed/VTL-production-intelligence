import { PageHeader, ProgressBar, StatusBadge } from '../components/ui';
import { SITES } from '../data';

const focusIcons: Record<string, string> = {
  Tricotage: '🔄',
  Teinture: '🎨',
  Délavage: '💧',
  Sérigraphie: '🖨️',
  Coupe: '✂️',
  Confection: '🪡',
  Finissage: '🏁',
  Filature: '🧵',
};

export default function Sites() {
  return (
    <div>
      <PageHeader
        title="Sites & Unités"
        subtitle="8 unités de production sur 2 périmètres géographiques"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {SITES.map(s => (
          <div key={s.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#7a8578', marginTop: 2 }}>{s.location}</div>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {s.focus.map(f => (
                <span key={f} style={{ background: 'var(--bg)', borderRadius: 999, padding: '3px 9px', fontSize: 10.5, color: '#3f4739' }}>
                  {focusIcons[f] ?? ''} {f}
                </span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10.5, color: '#7a8578', marginBottom: 2 }}>Effectif</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{s.employees.toLocaleString('en-US')}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: '#7a8578', marginBottom: 2 }}>Machines</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{s.machines.toLocaleString('en-US')}</div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#7a8578', marginBottom: 4 }}>
                <span>Utilisation des capacités</span>
                <span>{s.utilization}%</span>
              </div>
              <ProgressBar pct={s.utilization} color={s.utilization >= 85 ? '#16a34a' : s.utilization >= 78 ? '#d97706' : '#dc2626'} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#687467' }}>Taux de défauts : <b style={{ color: s.defectRate > 3 ? '#b91c1c' : s.defectRate > 2 ? '#b45309' : '#1a7f37' }}>{s.defectRate}%</b></span>
              <span style={{ color: s.onSchedule ? '#1a7f37' : '#b91c1c', fontWeight: 600 }}>
                {s.onSchedule ? '✓ Dans les délais' : '✗ En retard'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}