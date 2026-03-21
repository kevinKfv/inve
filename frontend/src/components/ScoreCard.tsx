'use client';
import { useEffect, useState } from 'react';
import type { InvestmentScore } from '@/lib/api';

interface Props { score: InvestmentScore }

export default function ScoreCard({ score }: Props) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = Date.now();
    const duration = 1200;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score.total));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score.total]);

  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (displayed / 100) * circ;

  const colorMap: Record<string, string> = {
    green: '#00c853', teal: '#00d4aa', yellow: '#ffd32a',
    orange: '#ff8c00', red: '#ff3d57',
  };
  const color = colorMap[score.color] ?? '#00d4aa';

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="section-title">Investment Score</div>

      {/* Ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <svg width={136} height={136} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={68} cy={68} r={radius} fill="none" stroke="var(--bg-border)" strokeWidth={10} />
          <circle
            cx={68} cy={68} r={radius} fill="none"
            stroke={color} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="gauge-ring"
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div style={{
          position: 'absolute', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          marginTop: 36,
        }}>
          <span className="mono" style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
            {displayed}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, color, marginBottom: 4 }}>{score.label}</div>

      {/* Component breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {score.components.map((c) => (
          <div key={c.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {c.label}
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 700 }}>
                {c.score.toFixed(0)}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--bg-border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${c.score}%`,
                background: c.score >= 60 ? '#00d4aa' : c.score >= 40 ? '#ffd32a' : '#ff3d57',
                borderRadius: 99,
                transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
        {score.disclaimer}
      </p>
    </div>
  );
}
