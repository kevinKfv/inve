'use client';
import { useEffect, useRef } from 'react';

interface Props {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

const COLORS = [
  { min: 0,  max: 20,  color: '#ff3d57' },   // Extremely oversold — red
  { min: 20, max: 30,  color: '#ff8c00' },   // Oversold — orange
  { min: 30, max: 50,  color: '#ffd32a' },   // Weak — yellow
  { min: 50, max: 70,  color: '#00d4aa' },   // Neutral/good — teal
  { min: 70, max: 80,  color: '#ff8c00' },   // Overbought — orange
  { min: 80, max: 100, color: '#ff3d57' },   // Extremely overbought — red
];

function getColor(v: number) {
  return COLORS.find(c => v >= c.min && v < c.max)?.color ?? '#00d4aa';
}

function getLabel(v: number) {
  if (v < 20) return 'Extremo Sobrevendido';
  if (v < 30) return 'Sobrevendido';
  if (v < 50) return 'Débil';
  if (v < 70) return 'Neutral / Fuerte';
  if (v < 80) return 'Sobrecomprado';
  return 'Extremo Sobrecomprado';
}

export default function RSIGauge({ value, size = 120, strokeWidth = 10 }: Props) {
  const color = getColor(value);
  const label = getLabel(value);
  const radius = (size - strokeWidth) / 2;
  const circ = Math.PI * radius; // half-circle circumference
  const offset = circ - (value / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size / 2 + strokeWidth / 2} style={{ overflow: 'visible' }}>
        {/* Background track */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="var(--bg-border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="gauge-ring"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        {/* Value text */}
        <text
          x={size / 2} y={size / 2 - 4}
          textAnchor="middle"
          fill={color}
          fontSize={22}
          fontWeight={700}
          fontFamily="'JetBrains Mono', monospace"
        >
          {value?.toFixed(1) ?? '--'}
        </text>
        <text
          x={size / 2} y={size / 2 + 12}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize={9}
          fontWeight={600}
          letterSpacing={1}
          fontFamily="inherit"
        >
          RSI
        </text>
      </svg>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: size, fontSize: 9, color: 'var(--text-muted)' }}>
        <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
      </div>
    </div>
  );
}
