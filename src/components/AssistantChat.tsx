import { Bot, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { agentResponse, SUGGESTED_QUESTIONS } from '../agent';
import type { ChatMessage } from '../types';

const sampleMessages: ChatMessage[] = [
  {
    id: 'm0',
    role: 'assistant',
    content: 'Bonjour ! Je suis votre assistant production. Posez-moi une question sur les commandes, la qualité, les sites ou la production.',
    timestamp: 'now',
  },
];

export default function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: 'maintenant',
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const data = agentResponse(userMsg.content);
      const assistantMsg: ChatMessage = {
        id: `a${Date.now()}`,
        role: 'assistant',
        content: data.summary ?? 'Voici l’analyse demandée.',
        timestamp: 'maintenant',
        data,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 700);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7a8578' }}>
            <Bot size={14} />
            Analyse des données…
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SUGGESTED_QUESTIONS.slice(0, 3).map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                borderRadius: 999,
                padding: '5px 10px',
                fontSize: 11,
                color: '#3f4739',
                cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(input); }}
            placeholder="Ex : quelles commandes sont à risque ?"
            style={{
              flex: 1,
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 12.5,
              outline: 'none',
              background: '#fff',
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            style={{
              border: 'none',
              background: loading ? '#c8d0c5' : 'var(--accent)',
              color: '#fff',
              borderRadius: 8,
              padding: '0 14px',
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '92%',
      }}
    >
      <div
        style={{
          background: isUser ? 'var(--accent)' : '#f2f4ee',
          color: isUser ? '#fff' : '#1d2a1c',
          borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
          padding: '8px 12px',
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
      >
        {message.content}
      </div>
      {message.data?.table && (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
            marginTop: 6,
            fontSize: 11,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', color: '#3f4739' }}>
                {message.data.table.headers.map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, fontSize: 10.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {message.data.table.rows.slice(0, 6).map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '5px 8px', color: '#35402f', whiteSpace: 'nowrap' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {message.data?.alerts && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {message.data.alerts.slice(0, 5).map(a => (
            <div key={a.id} style={{
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${a.severity === 'critical' ? '#dc2626' : a.severity === 'warning' ? '#d97706' : '#3b82f6'}`,
              background: '#fff',
              borderRadius: 6,
              padding: '7px 9px',
              fontSize: 11,
            }}>
              <div style={{ fontWeight: 600, color: '#26301f' }}>{a.title}</div>
              <div style={{ color: '#687467', marginTop: 2 }}>{a.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}