import {
  ALERTS,
  BRANDS,
  DAILY_PRODUCTION,
  DEFECTS,
  ORDERS,
  SITES,
  STAGE_VOLUMES,
  STAGES,
  totalUnits,
  totalOrders,
  atRiskOrders,
  todayProduction,
  buildAgentContext,
} from './data';
import type { AlertItem, ChatResultData } from './types';

const OLLAMA_URL = '/ollama/api/chat';
const OLLAMA_MODEL = 'llama3.2';
const MAX_HISTORY = 8;
const REQUEST_TIMEOUT = 45000;

export type AgentHistoryMessage = { role: 'user' | 'assistant'; content: string };

const isString = (v: unknown): v is string => typeof v === 'string';

const stringArray = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every(isString) ? (v as string[]) : null;

const stringMatrix = (v: unknown): string[][] | null => {
  if (!Array.isArray(v)) return null;
  const rows: string[][] = [];
  for (const row of v) {
    const cells = stringArray(row);
    if (!cells) return null;
    rows.push(cells);
  }
  return rows;
};

const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;
const ALERT_TYPES = ['delay', 'quality', 'maintenance', 'capacity'] as const;

const SYSTEM_PROMPT = (context: string): string =>
  `Tu es l'assistant production d'un groupe textile exportateur tunisien.
Réponds en français, de façon concise et factuelle.
Tu utilises UNIQUEMENT les données du contexte ci-dessous : n'invente AUCUN chiffre, site, commande ou marque.
Si l'information demandée n'est pas dans le contexte, dis-le clairement dans "summary".
Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, selon le schéma :
{
  "type": "summary" | "table" | "alerts",
  "summary": "texte de synthèse en français (toujours obligatoire)",
  "table": { "headers": ["colonne", "..."], "rows": [["cellule", "...", "..."]] } | null,
  "alerts": [{ "id": "a1", "title": "...", "description": "...", "severity": "info" | "warning" | "critical", "time": "...", "type": "delay" | "quality" | "maintenance" | "capacity" }] | null
}
Règles :
- "summary" est obligatoire dans tous les cas.
- "table" : au maximum 6 lignes, chaque cellule est une chaîne de caractères.
- "alerts" : au maximum 5 alertes, uniquement celles présentes dans le contexte.
- Pour une question simple, "type": "summary" suffit.

CONTEXTE (données du jour) :
${context}`;

const callOllama = async (
  query: string,
  history: AgentHistoryMessage[],
  fetchImpl: typeof fetch,
): Promise<string> => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT(buildAgentContext()) },
    ...history.slice(-MAX_HISTORY).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: query },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetchImpl(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        format: 'json',
        temperature: 0.2,
        options: { num_predict: 800 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Réponse Ollama vide');
    return content;
  } finally {
    clearTimeout(timer);
  }
};

export const parseOllamaResponse = (raw: string): ChatResultData | null => {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    cleaned = '';
  } else {
    cleaned = cleaned.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const o = parsed as Record<string, unknown>;
  const type = o.type;
  if (type !== 'summary' && type !== 'table' && type !== 'alerts') return null;
  if (!isString(o.summary)) return null;

  const result: ChatResultData = { type, summary: o.summary };

  if (type === 'table') {
    const t = o.table as Record<string, unknown> | undefined;
    if (typeof t !== 'object' || t === null) return null;
    const headers = stringArray(t.headers);
    const rows = stringMatrix(t.rows);
    if (!headers || !rows) return null;
    result.table = { headers, rows };
  }

  if (type === 'alerts') {
    if (!Array.isArray(o.alerts)) return null;
    const alerts: AlertItem[] = [];
    for (const a of o.alerts) {
      if (typeof a !== 'object' || a === null) return null;
      const item = a as Record<string, unknown>;
      if (
        !isString(item.id) ||
        !isString(item.title) ||
        !isString(item.description) ||
        !isString(item.time) ||
        !ALERT_SEVERITIES.includes(item.severity as never) ||
        !ALERT_TYPES.includes(item.type as never)
      ) {
        return null;
      }
      alerts.push(item as unknown as AlertItem);
    }
    result.alerts = alerts;
  }

  return result;
};

type ParsedIntent = {
  intent: string;
  target?: string;
  timeFrame?: string;
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();

const KEYWORDS: { intent: string; words: string[] }[] = [
  { intent: 'dashboard_overview', words: ['état', 'etat', 'overview', 'résumé', 'resume', 'contexte', 'vue d', 'haut niveau', 'globale', 'global'] },
  { intent: 'production_today', words: ['production aujourd', 'production du jour', 'aujourd', 'aujourd’hui', "d'aujourd", "du jour", 'today', 'journalier', 'journaliere', 'today production'] },
  { intent: 'defects', words: ['défaut', 'defaut', 'rebut', 'qualité', 'qualite', 'quality', 'scrap', 'erreur'] },
  { intent: 'orders_risk', words: ['retard', 'risque', 'at risk', 'delai', 'dernière limite', 'deadline', 'en danger', 'en retard', 'delay'] },
  { intent: 'orders_list', words: ['commande', 'orders', 'ordre', 'po-', 'bon de commande', 'bo', 'client'] },
  { intent: 'site_status', words: ['site', 'unité', 'unite', 'usine', 'atelier', 'menzel', 'capacity', 'capacité', 'capacite'] },
  { intent: 'brand_performance', words: ['marque', 'clients', 'lacoste', 'adidas', 'g-star', 'g star', 'paul', 'karl', 'brand', 'account'] },
  { intent: 'stage_volume', words: ['étape', 'etape', 'process', 'tricotage', 'teinture', 'délavage', 'delavage', 'sérigraphie', 'serigraphie', 'coupe', 'confection', 'finissage', 'stage'] },
  { intent: 'alerts', words: ['alerte', 'avertissement', 'notification', 'anomalie', 'warning', 'attention'] },
];

const findBrand = (q: string): string | undefined => {
  return BRANDS.find(b => q.includes(b.brand.toLowerCase()))?.brand;
};

const findSite = (q: string): string | undefined => {
  const map: [string, string][] = [
    ['confection', 'Confection'],
    ['tricot', 'Tricotage'],
    ['teinture', 'Teinture'],
    ['finissage', 'Finissage'],
    ['sérigraphie', 'Sérigraphie'],
    ['serigraphie', 'Sérigraphie'],
    ['délavage', 'Délavage'],
    ['delavage', 'Délavage'],
    ['coupe', 'Coupe'],
    ['bouzelfa', 'Menzel Bouzelfa'],
    ['temime', 'Menzel Temime'],
  ];
  for (const [key, label] of map) {
    if (q.includes(key)) {
      return SITES.find(s => s.name.toLowerCase().includes(label.toLowerCase()))?.id;
    }
  }
  return undefined;
};

const findStage = (q: string): string | undefined => {
  const stage = STAGES.find(s => q.includes(s.name.toLowerCase()));
  return stage?.id;
};

const parseIntent = (q: string): ParsedIntent => {
  const query = normalize(q);

  const brand = findBrand(query);

  for (const { intent, words } of KEYWORDS) {
    if (words.some(w => query.includes(w))) {
      const site = findSite(query);
      const stage = findStage(query);
      return { intent, target: brand ?? site ?? stage };
    }
  }

  return { intent: 'dashboard_overview' };
};

const generateResponse = (intent: ParsedIntent): ChatResultData => {
  switch (intent.intent) {
    case 'dashboard_overview':
      return {
        type: 'summary',
        summary:
          `Aujourd’hui, ${todayProduction.toLocaleString('en-US')} pièces produites sur les ${totalUnits.toLocaleString('en-US')} au total en cours. ` +
          `${totalOrders} commandes actives — dont ${atRiskOrders} à risque. Taux de conformité moyen de 88% sur les 5 marques. ` +
          `1 alerte critique (G-Star — Finissage) et 2 avertissements en attente. Le point de vigilance principal est la capacité de la Confection 2 sur le PO Adidas 0887.`,
      };

    case 'production_today':
      return {
        type: 'table',
        summary: `Production du jour vs plan sur les 14 derniers jours. Cumul : ${todayProduction.toLocaleString('en-US')} pièces (${Math.round(todayProduction / 46000 * 100)}% du plan).`,
        table: {
          headers: ['Date', 'Planifié', 'Réel', 'Écart'],
          rows: DAILY_PRODUCTION.filter(d => d.actual > 0).slice(-7).map(d => {
            const variance = Math.round(((d.actual - d.planned) / d.planned) * 100);
            return [d.date, d.planned.toLocaleString('en-US'), d.actual.toLocaleString('en-US'), `${variance >= 0 ? '+' : ''}${variance}%`];
          }),
        },
      };

    case 'defects': {
      const siteLabel = intent.target ? SITES.find(s => s.id === intent.target)?.name : 'tous les sites';
      const rows = DEFECTS.filter(d => (intent.target ? d.siteId === intent.target : true))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map(d => {
          const s = SITES.find(x => x.id === d.siteId);
          return [d.type, s?.name ?? '-', d.date, String(d.count), d.severity.toUpperCase()];
        });
      return {
        type: 'table',
        summary: `Top défauts sur ${siteLabel}. Total : ${rows.reduce((acc, r) => acc + parseInt(r[3]), 0)} pièces concernées sur les 3 derniers jours.`,
        table: { headers: ['Type de défaut', 'Site', 'Date', 'Qté', 'Sévérité'], rows },
      };
    }

    case 'orders_risk':
      return {
        type: 'table',
        summary: `${atRiskOrders} commandes actuellement à risque ou en retard. Les deux G-Star sont les plus exposées — surcharge du Délavage/Finissage de Menzel Bouzelfa.`,
        table: {
          headers: ['Réf', 'Marque', 'Produit', 'Site', 'Progress.', 'Prévu pour'],
          rows: ORDERS.filter(o => o.status !== 'on_track').map(o => {
            const s = SITES.find(x => x.id === o.siteId);
            return [o.reference, o.brand, o.product, s?.name ?? '-', `${o.progressPct}%`, o.dueDate];
          }),
        },
      };

    case 'orders_list': {
      const filtered = intent.target
        ? ORDERS.filter(o => o.brand.toLowerCase() === intent.target?.toLowerCase())
        : ORDERS;
      return {
        type: 'table',
        summary: `${filtered.length} commandes ${intent.target ? `— ${intent.target}` : 'toutes marques confondues'}. Volume total : ${filtered.reduce((a, o) => a + o.quantity, 0).toLocaleString('en-US')} pièces.`,
        table: {
          headers: ['Réf', 'Marque', 'Produit', 'Qté', 'Progress.', 'Statut'],
          rows: filtered.slice(0, 10).map(o => [
            o.reference,
            o.brand,
            o.product,
            o.quantity.toLocaleString('en-US'),
            `${o.progressPct}%`,
            o.status.replace('_', ' ').toUpperCase(),
          ]),
        },
      };
    }

    case 'site_status': {
      const sites = intent.target ? SITES.filter(s => s.id === intent.target) : SITES;
      return {
        type: 'table',
        summary: `Utilisation des sites : le plus chargé est Menzel Bouzelfa — Tricot (91%), le moins Menzel Bouzelfa — Finissage (74%). Le Finissage présente aussi le taux de défauts le plus élevé (4,1%).`,
        table: {
          headers: ['Site', 'Employés', 'Machines', 'Utilisation', 'Défauts %', 'Statut'],
          rows: sites.map(s => [
            s.name,
            s.employees.toLocaleString('en-US'),
            s.machines.toLocaleString('en-US'),
            `${s.utilization}%`,
            `${s.defectRate}%`,
            s.status,
          ]),
        },
      };
    }

    case 'brand_performance':
      return {
        type: 'table',
        summary: `Karl Lagerfeld est la marque la plus fiable (96% à temps), G-Star la plus exposée (72%). Ce dernier concentre ses volumes sur le Délavage/Finissage — le goulot d’étranglement du réseau.`,
        table: {
          headers: ['Marque', 'Commandes', 'Unités', 'À temps %'],
          rows: BRANDS.map(b => [
            b.brand,
            b.orders.toLocaleString('en-US'),
            b.units.toLocaleString('en-US'),
            `${b.onTime}%`,
          ]),
        },
      };

    case 'stage_volume':
      return {
        type: 'table',
        summary: `La Confection est l’étape dominante (${STAGE_VOLUMES.find(v => v.stage === 'Confection')?.units.toLocaleString('en-US')} pièces), suivie du Tricotage. Le Délavage et la Sérigraphie restent les plus contraints en capacité.`,
        table: {
          headers: ['Étape', 'Volume (pièces)', 'Part du total'],
          rows: STAGE_VOLUMES.map(v => [
            v.stage,
            v.units.toLocaleString('en-US'),
            `${Math.round(v.units / STAGE_VOLUMES.reduce((x, y) => x + y.units, 0) * 100)}%`,
          ]),
        },
      };

    case 'alerts':
      return {
        type: 'alerts',
        summary: `${ALERTS.filter(a => a.severity !== 'info').length} alertes actives. La plus urgente concerne le retard G-Star au Finissage.`,
        alerts: ALERTS,
      };

    default:
      return {
        type: 'summary',
        summary:
          `Situation globale stable : ${todayProduction.toLocaleString('en-US')} pièces produites aujourd’hui, ${totalOrders} commandes actives, ` +
          `${atRiskOrders} à risque. Les deux priorités : débloquer la Confection 2 (Adidas 0887) et surveiller le Finissage G-Star.`,
      };
  }
};

export const agentResponse = async (
  query: string,
  history: AgentHistoryMessage[] = [],
  fetchImpl: typeof fetch = fetch,
): Promise<ChatResultData> => {
  try {
    const raw = await callOllama(query, history, fetchImpl);
    const parsed = parseOllamaResponse(raw);
    if (parsed) return parsed;
    throw new Error('Réponse Ollama non exploitable');
  } catch {
    const intent = parseIntent(query);
    return generateResponse(intent);
  }
};

export const SUGGESTED_QUESTIONS: string[] = [
  'Résumé de la situation actuelle',
  'Quelles commandes sont à risque ?',
  'Comment se passe la production aujourd’hui ?',
  'Quels sont les principaux défauts qualité ?',
  'Performance des marques clients',
  'État d’utilisation des sites',
  'Volumes par étape de production',
  'Montrer les alertes actives',
];