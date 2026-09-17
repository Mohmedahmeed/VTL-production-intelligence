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
} from './data';
import type { ChatResultData } from './types';

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

  // Check brand precedence first
  const brand = findBrand(query);

  for (const { intent, words } of KEYWORDS) {
    if (words.some(w => query.includes(w))) {
      const site = findSite(query);
      const stage = findStage(query);
      return { intent, target: brand ?? site ?? stage };
    }
  }

  // Default to dashboard overview for unknown
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

export const agentResponse = (query: string): ChatResultData => {
  const intent = parseIntent(query);
  return generateResponse(intent);
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