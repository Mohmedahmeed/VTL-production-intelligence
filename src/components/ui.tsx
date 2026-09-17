import type { ReactNode } from 'react';
import type { Site } from '../types';

export function StatCard({
  label,
  value,
  delta,
  deltaUp,
  icon,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  icon: ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: '#7a8578' }}>{label}</span>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>{value}</div>
      {(delta || hint) && (
        <div style={{ marginTop: 6, fontSize: 11, color: delta ? (deltaUp ? '#16a34a' : '#dc2626') : '#7a8578' }}>
          {delta ? `${deltaUp ? '▲' : '▼'} ${delta}` : hint}
        </div>
      )}
    </div>
  );
}

export function Panel({ title, children, action, style }: { title?: string; children: ReactNode; action?: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          {title && <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: Site['status'] | string }) {
  const colors: Record<string, { bg: string; fg: string; label: string }> = {
    optimal: { bg: '#e6f4ea', fg: '#1a7f37', label: 'Optimal' },
    watch: { bg: '#fef3c7', fg: '#b45309', label: 'À surveiller' },
    attention: { bg: '#fee2e2', fg: '#b91c1c', label: 'Attention' },
    on_track: { bg: '#e6f4ea', fg: '#1a7f37', label: 'En ligne' },
    at_risk: { bg: '#fef3c7', fg: '#b45309', label: 'À risque' },
    delayed: { bg: '#fee2e2', fg: '#b91c1c', label: 'En retard' },
  };
  const c = colors[status] ?? { bg: '#f0f2f0', fg: '#687467', label: status };
  return (
    <span style={{ background: c.bg, color: c.fg, borderRadius: 999, padding: '3px 9px', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const base = color ?? (pct >= 60 ? '#16a34a' : pct >= 35 ? '#d97706' : '#dc2626');
  return (
    <div style={{ width: '100%', height: 6, background: '#e5e8e1', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: base, borderRadius: 999 }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.2 }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#7a8578' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}