import { Panel, PageHeader } from '../components/ui';
import { DEFECTS, SITES, todayDefects } from '../data';

const severityStyle: Record<string, { bg: string; fg: string }> = {
  minor: { bg: '#e6f4ea', fg: '#1a7f37' },
  major: { bg: '#fef3c7', fg: '#b45309' },
  critical: { bg: '#fee2e2', fg: '#b91c1c' },
};

export default function Quality() {
  const siteTotals = SITES.map(s => ({
    ...s,
    defects: DEFECTS.filter(d => d.siteId === s.id).reduce((a, d) => a + d.count, 0),
  }));
  const maxDefects = Math.max(...siteTotals.map(s => s.defects), 1);

  return (
    <div>
      <PageHeader
        title="Qualité & Défauts"
        subtitle={`${todayDefects} pièces non conformes signalées aujourd'hui · 14 derniers jours`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 20 }}>
        <Panel title="Défauts par site (14 j)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {siteTotals.sort((a, b) => b.defects - a.defects).map(s => (
              <div key={s.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#3f4739' }}>{s.name}</span>
                  <span style={{ color: '#7a8578' }}>{s.defects} pcs</span>
                </div>
                <div style={{ height: 7, background: '#e5e8e1', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(s.defects / maxDefects) * 100}%`,
                    height: '100%',
                    background: s.defects > maxDefects * 0.65 ? '#dc2626' : s.defects > maxDefects * 0.35 ? '#d97706' : '#16a34a',
                    borderRadius: 999,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Derniers signalements de non-conformité">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#7a8578', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Type de défaut</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Site</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Étape</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Qté</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Sévérité</th>
                </tr>
              </thead>
              <tbody>
                {DEFECTS.map(d => {
                  const site = SITES.find(s => s.id === d.siteId);
                  const sev = severityStyle[d.severity];
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: 'var(--ink)' }}>{d.type}</td>
                      <td style={{ padding: '8px 10px', color: '#687467' }}>{site?.name}</td>
                      <td style={{ padding: '8px 10px', color: '#687467' }}>{d.stage}</td>
                      <td style={{ padding: '8px 10px', color: '#7a8578' }}>{d.date}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--ink)', fontWeight: 600 }}>{d.count}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ background: sev.bg, color: sev.fg, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
                          {d.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Indicateurs qualité du mois" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#7a8578', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Taux de retouche</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>2.3%</div>
            <div style={{ fontSize: 11, color: '#d97706' }}>▲ +0.4 pt vs sept. précédent</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#7a8578', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Rebut définitif</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>0.8%</div>
            <div style={{ fontSize: 11, color: '#16a34a' }}>▼ −0.2 pt</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#7a8578', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Contrôles réalisés</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>94.6%</div>
            <div style={{ fontSize: 11, color: '#7a8578' }}>des pièces AQL vérifiées</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#7a8578', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Score qualité global</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>B+</div>
            <div style={{ fontSize: 11, color: '#d97706' }}>cible A pour fin 2026</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}