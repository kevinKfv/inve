import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InvestIQ Pro — Análisis de Inversiones',
  description: 'Plataforma profesional de análisis técnico y fundamental para acciones, ETFs y criptomonedas. Solo para fines educativos.',
  keywords: 'análisis técnico, inversiones, RSI, MACD, portfolio, backtesting',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
