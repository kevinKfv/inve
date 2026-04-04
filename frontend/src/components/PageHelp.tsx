import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface Term {
  term: string;
  definition: string;
}

interface PageHelpProps {
  title?: string;
  description?: string;
  terms: Term[];
}

export default function PageHelp({ title = "💡 Academia InvestIQ: Glosario de esta pantalla", description, terms }: PageHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: 24, background: 'var(--bg-card)', border: '1px solid var(--accent-dim)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all 0.3s' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: isOpen ? 'var(--accent-dim)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', transition: 'background 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={16} className="text-accent" />
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>

      {isOpen && (
        <div className="animate-fade-in" style={{ padding: '0 16px 16px 16px', marginTop: 0, paddingTop: 12 }}>
          {description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{description}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {terms.map((t, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--radius)', border: '1px solid var(--bg-border)' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)', marginBottom: 6 }}>{t.term}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
