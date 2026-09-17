import {
  AlertTriangle,
  Bot,
  LayoutDashboard,
  Factory,
  ScrollText,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

import AssistantChat from './AssistantChat';

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Vue d’ensemble', icon: <LayoutDashboard size={17} />, end: true },
  { to: '/production', label: 'Production', icon: <Factory size={17} /> },
  { to: '/quality', label: 'Qualité & Défauts', icon: <ShieldCheck size={17} /> },
  { to: '/sites', label: 'Sites & Unités', icon: <ScrollText size={17} /> },
  { to: '/alerts', label: 'Alertes', icon: <AlertTriangle size={17} />, end: true },
];

export default function Layout({
  children,
  assistantOpen,
  onToggleAssistant,
}: {
  children: ReactNode;
  assistantOpen: boolean;
  onToggleAssistant: () => void;
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: 'var(--bg-sidebar)',
          color: '#e7eee2',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 20px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--accent-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            V
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>VTL FabricPulse</div>
            <div style={{ fontSize: 10.5, color: '#8fa08c' }}>Production Intelligence</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' nav-link-active' : '')}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={onToggleAssistant}
          className="assistant-tab"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: assistantOpen ? 'var(--accent-bright)' : 'rgba(255,255,255,0.07)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            padding: '9px 10px',
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          <Bot size={17} />
          Assistant IA
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px', color: '#8fa08c' }}>
          <Settings size={14} />
          <span style={{ fontSize: 11.5 }}>Démo — données simulées</span>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 28, background: 'var(--bg)' }}>
        {children}
      </main>

      {/* Assistant panel */}
      {assistantOpen && (
        <aside
          style={{
            width: 380,
            minWidth: 380,
            background: '#fff',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Assistant Production</span>
            </div>
            <button
              onClick={onToggleAssistant}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer', color: '#7a8578', display: 'flex',
              }}
              aria-label="Fermer l’assistant"
            >
              <X size={17} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, fontSize: 12.5, lineHeight: 1.6 }}>
            <p style={{ margin: 0, color: '#4b5448' }}>
              Posez une question sur la production, la qualité, les commandes ou les sites. L’assistant consulte les
              données de démonstration en temps réel et synthétise la réponse.
            </p>
            <AssistantChat />
          </div>
        </aside>
      )}
    </div>
  );
}