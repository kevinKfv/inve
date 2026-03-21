'use client';
import type { Signal } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props { signals: Signal[] }

export default function SignalBadges({ signals }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {signals.map((s, i) => {
        const isBull = s.sentiment === 'bullish';
        const isBear = s.sentiment === 'bearish';
        const color = isBull ? 'var(--green)' : isBear ? 'var(--red)' : 'var(--text-secondary)';
        const bg = isBull ? 'var(--green-dim)' : isBear ? 'var(--red-dim)' : '#1f2d3d';
        const Icon = isBull ? TrendingUp : isBear ? TrendingDown : Minus;

        return (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '10px 12px', borderRadius: 8,
            background: bg, border: `1px solid ${color}22`,
          }}>
            <Icon size={14} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>
                {s.label}
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 500,
                  color: 'var(--text-muted)',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '1px 6px', borderRadius: 99,
                }}>
                  {s.strength}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {s.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
