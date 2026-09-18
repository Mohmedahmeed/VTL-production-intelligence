import { describe, expect, it } from 'vitest';
import { agentResponse, parseOllamaResponse } from './agent';
import { buildAgentContext } from './data';

describe('buildAgentContext', () => {
  it('assembles a French snapshot with production, risks, defects, sites, alerts and brands', () => {
    const ctx = buildAgentContext();
    expect(ctx).toContain('48,300'); // todayProduction
    expect(ctx).toMatch(/commande/i);
    expect(ctx).toMatch(/risque/i);
    expect(ctx).toContain('G-Star RAW');
    expect(ctx).toContain('Sérigraphie');
    expect(ctx).toContain('Menzel');
    expect(ctx).toContain('Coulure teinture'); // top defect
    expect(ctx).toMatch(/%/);
  });
});

describe('parseOllamaResponse', () => {
  it('parses a plain JSON summary reply', () => {
    const r = parseOllamaResponse('{"type":"summary","summary":"Aujourd’hui 48 300 pièces."}');
    expect(r).toEqual({ type: 'summary', summary: 'Aujourd’hui 48 300 pièces.' });
  });

  it('strips markdown code fences', () => {
    const r = parseOllamaResponse('```json\n{"type":"summary","summary":"ok"}\n```');
    expect(r?.summary).toBe('ok');
  });

  it('extracts JSON embedded in surrounding prose', () => {
    const r = parseOllamaResponse(
      'Voici : {"type":"table","summary":"tuto","table":{"headers":["A"],"rows":[["1"]]}} fin'
    );
    expect(r?.type).toBe('table');
    expect(r?.table?.rows).toEqual([['1']]);
  });

  it('returns null for non-JSON reply', () => {
    expect(parseOllamaResponse('Je n’ai pas compris')).toBeNull();
  });

  it('returns null when type or summary are missing or unknown', () => {
    expect(parseOllamaResponse('{"type":"chart","summary":"x"}')).toBeNull();
    expect(parseOllamaResponse('{"summary":"x"}')).toBeNull();
  });

  it('returns null when table rows are malformed', () => {
    expect(
      parseOllamaResponse('{"type":"table","summary":"x","table":{"headers":["A"],"rows":[1]}}')
    ).toBeNull();
  });

  it('validates alert objects', () => {
    const raw =
      '{"type":"alerts","summary":"2 alertes","alerts":[{"id":"a1","title":"Risque","description":"d","severity":"critical","time":"il y a 1 h","type":"delay"}]}';
    const r = parseOllamaResponse(raw);
    expect(r?.alerts?.[0]).toMatchObject({ id: 'a1', severity: 'critical', type: 'delay' });
  });

  it('returns null on invalid alert severity or type', () => {
    const badSeverity =
      '{"type":"alerts","summary":"x","alerts":[{"id":"a1","title":"t","description":"d","severity":"mega","time":"t","type":"delay"}]}';
    const badType =
      '{"type":"alerts","summary":"x","alerts":[{"id":"a1","title":"t","description":"d","severity":"info","time":"t","type":"urgent"}]}';
    expect(parseOllamaResponse(badSeverity)).toBeNull();
    expect(parseOllamaResponse(badType)).toBeNull();
  });
});

describe('agentResponse', () => {
  it('falls back to the rule-based engine when Ollama is unreachable', async () => {
    const failing = async () => {
      throw new Error('down');
    };
    const res = await agentResponse('quelles commandes sont à risque ?', [], failing);
    expect(res.type).toBe('table');
    expect(res.table?.headers).toContain('Réf');
  });

  it('returns the LLM reply when Ollama responds with valid JSON', async () => {
    const content = '{"type":"summary","summary":"Production stable, toutes marques dans les temps."}';
    const ok = async () => new Response(JSON.stringify({ message: { content } }), { status: 200 });
    const res = await agentResponse('résumé de la situation', [], ok);
    expect(res.summary).toContain('Production stable');
  });

  it('falls back when the LLM reply is not valid ChatResultData JSON', async () => {
    const ok = async () => new Response(JSON.stringify({ message: { content: 'bof' } }), { status: 200 });
    const res = await agentResponse('aujourd’hui', [], ok);
    expect(res.type).toBeDefined();
  });
});