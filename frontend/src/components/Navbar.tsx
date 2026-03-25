'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, TrendingUp, Briefcase, Bell, Play, ShieldCheck, Star } from 'lucide-react';

const NAV = [
  { href: '/',                icon: BarChart2,   label: 'Dashboard' },
  { href: '/recommendations', icon: Star,        label: 'Recomendaciones' },
  { href: '/portfolio',       icon: Briefcase,   label: 'Portfolio' },
  { href: '/backtesting',     icon: Play,        label: 'Backtest' },
  { href: '/alerts',          icon: Bell,        label: 'Alertas' },
  { href: '/paper-trading',   icon: ShieldCheck, label: 'Paper' },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--bg-border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', minHeight: 56, gap: 8, padding: '8px 16px', flexWrap: 'wrap' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={18} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            Invest<span className="text-accent">IQ</span> Pro
          </span>
        </Link>

        {/* Nav links */}
        <div className="nav-links-container" style={{ display: 'flex', gap: 2 }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6, textDecoration: 'none',
                fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: active ? '1px solid var(--bg-border)' : '1px solid transparent',
              }}>
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Disclaimer badge */}
        <span className="badge badge-yellow nav-disclaimer" style={{ fontSize: 10 }}>
          ⚠ Solo educativo — No es asesoramiento financiero
        </span>
      </div>
    </nav>
  );
}
