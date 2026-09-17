export type Stage = {
  id: string;
  name: string;
  key: string;
  icon: string;
  color: string;
};

export type Site = {
  id: string;
  name: string;
  location: string;
  focus: string[];
  employees: number;
  machines: number;
  status: 'optimal' | 'watch' | 'attention';
  utilization: number;
  defectRate: number;
  onSchedule: boolean;
};

export type ProductionOrder = {
  id: string;
  reference: string;
  brand: string;
  client: string;
  product: string;
  quantity: number;
  unit: string;
  siteId: string;
  stage: string;
  progressPct: number;
  dueDate: string;
  startedDate: string;
  status: 'on_track' | 'at_risk' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  defects: number;
  colorways: number;
};

export type DefectRecord = {
  id: string;
  siteId: string;
  stage: string;
  date: string;
  type: string;
  count: number;
  severity: 'minor' | 'major' | 'critical';
};

export type DailyProductionPoint = {
  date: string;
  planned: number;
  actual: number;
};

export type StageVolume = {
  stage: string;
  units: number;
  color: string;
};

export type BrandData = {
  brand: string;
  orders: number;
  units: number;
  onTime: number;
  color: string;
};

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  time: string;
  siteId?: string;
  stage?: string;
  type: 'delay' | 'quality' | 'maintenance' | 'capacity';
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: ChatResultData;
};

export type ChatResultData = {
  type: 'summary' | 'table' | 'alert' | 'alerts' | 'empty';
  summary?: string;
  table?: { headers: string[]; rows: string[][] };
  alerts?: AlertItem[];
};