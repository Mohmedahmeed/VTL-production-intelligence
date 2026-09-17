import { PageHeader } from '../components/ui';
import { ALERTS } from '../data';

const sevMeta = {
  critical: { bg: '#fee2e2', fg: '#b91c1c', icon: '🔴', label: 'Critique' },
  warning: { bg: '#fef3c7', fg: '#b45309', icon: '🟠', label: 'Avertissement' },
  info: { bg: '#e0edfb', fg: '#1d4ed8', icon: '🔵', label: 'Information' },
};

const typeLabels: Record<string, string> = {
  delay: 'Retard planification',
  quality: 'Non-conformité',
  maintenance: 'Maintenance',
  capacity: 'Capacité',
};

export default function Alerts() {
  return (
    <div>
      <PageHeader
        title="Centre d’alertes"
        subtitle={`${ALERTS.length} notifications — ${ALERTS.filter(a => a.severity === 'critical').length} critiques`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ALERTS.map(a => {
          const meta = sevMeta[a.severity];
          return (
            <div key={a.id} style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${a.severity === 'critical' ? '#dc2626' : a.severity === 'warning' ? '#d97706' : '#3b82f6'}`,
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <div style={{ fontSize: 18 }}>{meta.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{a.title}</span>
                  <span style={{ background: meta.bg, color: meta.fg, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
                    {meta.label}
                  </span>
                  <span style={{ background: 'var(--bg)', borderRadius: 999, padding: '2px 8px', fontSize: 10, color: '#687467' }}>
                    {typeLabels[a.type]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#687467', marginTop: 4, lineHeight: 1.5 }}>{a.description}</div>
                <div style={{ fontSize: 10.5, color: '#9aa39b', marginTop: 6 }}>{a.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}