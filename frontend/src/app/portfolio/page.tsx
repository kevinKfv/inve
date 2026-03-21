'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { api, OptimizationResult } from '@/lib/api';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Loader2, Plus, X } from 'lucide-react';

export default function PortfolioPage() {
  const [tickers, setTickers] = useState(['AAPL', 'MSFT', 'SPY', 'BTC-USD']);
  const [newTicker, setNewTicker] = useState('');
  const [period, setPeriod] = useState('2y');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const add = () => {
    const t = newTicker.trim().toUpperCase();
    if (t && !tickers.includes(t)) { setTickers(p => [...p, t]); setNewTicker(''); }
  };

  const run = async () => {
    if (tickers.length < 2) { setError('Necesitás al menos 2 activos.'); return; }
    setLoading(true); setError('');
    try {
      const data = await api.optimizePortfolio(tickers, period);
      setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const corr = result?.correlation;

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Portfolio <span className="gradient-text">Optimizer</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          Optimización de Markowitz — Frontera Eficiente · Máximo Sharpe · Mínima Volatilidad
        </p>

        {/* Controls */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">Activos del Portfolio</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {tickers.map(t => (
              <div key={t} className="badge badge-accent" style={{ fontSize: 12, padding: '4px 10px', gap: 6 }}>
                {t}
                <button onClick={() => setTickers(p => p.filter(x => x !== t))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="input" style={{ maxWidth: 160 }} placeholder="Agregar ticker" value={newTicker}
              onChange={e => setNewTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && add()} />
            <button className="btn btn-ghost" onClick={add}><Plus size={14} /></button>
            <select className="input" style={{ maxWidth: 100 }} value={period} onChange={e => setPeriod(e.target.value)}>
              {['1y', '2y', '3y', '5y'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : '🚀'}
              {loading ? 'Calculando...' : 'Optimizar'}
            </button>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>

        {result && (
          <>
            {/* Efficient frontier scatter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>
              <div className="card">
                <div className="section-title">Frontera Eficiente</div>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <XAxis dataKey="volatility" name="Volatilidad %" unit="%" tick={{ fill: '#8a9bb0', fontSize: 10 }} label={{ value: 'Volatilidad Anual (%)', position: 'bottom', fill: '#4a5c6e', fontSize: 10 }} />
                    <YAxis dataKey="return" name="Retorno %" unit="%" tick={{ fill: '#8a9bb0', fontSize: 10 }} label={{ value: 'Retorno Anual (%)', angle: -90, position: 'left', fill: '#4a5c6e', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`]} />
                    <Scatter data={result.frontier} fill="#00d4aa22" stroke="#00d4aa44" strokeWidth={0.5} />
                    <ReferenceDot x={result.max_sharpe.volatility} y={result.max_sharpe.return} r={8} fill="#ffd32a" stroke="#ffd32a44" />
                    <ReferenceDot x={result.min_volatility.volatility} y={result.min_volatility.return} r={8} fill="#4e8cff" stroke="#4e8cff44" />
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>🟡 Máximo Sharpe</span><span>🔵 Mínima Volatilidad</span><span>🟢 Portafolios aleatorios</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PortfolioCard p={result.max_sharpe} color="#ffd32a" icon="🏆" />
                <PortfolioCard p={result.min_volatility} color="#4e8cff" icon="🛡️" />
              </div>
            </div>

            {/* Correlation matrix */}
            {corr && (
              <div className="card">
                <div className="section-title">Matriz de Correlación</div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Valores cercanos a +1 = alta correlación (se mueven juntos) · Cercanos a -1 = correlación inversa (diversificación real)
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600 }}></th>
                        {corr.labels.map(l => <th key={l} style={{ padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>{l}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {corr.matrix.map((row, i) => (
                        <tr key={i}>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>{corr.labels[i]}</td>
                          {row.map((val, j) => {
                            const abs = Math.abs(val);
                            const bg = val === 1 ? '#1a2333' : val > 0.7 ? `rgba(255,61,87,${abs * 0.5})` : val < -0.3 ? `rgba(0,200,83,${abs * 0.5})` : `rgba(0,212,170,${abs * 0.2})`;
                            return (
                              <td key={j} style={{ padding: '6px 10px', textAlign: 'center', background: bg, borderRadius: 4, fontFamily: 'monospace', fontWeight: 600,
                                color: val === 1 ? 'var(--text-muted)' : abs > 0.7 ? '#fff' : 'var(--text-primary)' }}>
                                {(val ?? 0).toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function PortfolioCard({ p, color, icon }: { p: any; color: string; icon: string }) {
  return (
    <div className="card" style={{ borderColor: color + '44' }}>
      <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 10 }}>{icon} {p.label}</div>
      <StatRow label="Retorno Anual" value={`${(p.return ?? 0).toFixed(2)}%`} color={(p.return ?? 0) > 0 ? 'var(--green)' : 'var(--red)'} />
      <StatRow label="Volatilidad Anual" value={`${(p.volatility ?? 0).toFixed(2)}%`} />
      <StatRow label="Sharpe Ratio" value={(p.sharpe ?? 0).toFixed(3)} color="var(--accent)" />
      <div style={{ marginTop: 10 }}>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pesos</p>
        {Object.entries(p.weights).map(([t, w]: [string, any]) => (
          <div key={t} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t}</span>
              <span className="mono" style={{ color: 'var(--text-primary)' }}>{((w ?? 0) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 3, background: 'var(--bg-border)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${w * 100}%`, background: color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
