'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { api, BacktestResult } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function BacktestingPage() {
  const [ticker, setTicker] = useState('AAPL');
  const [strategy, setStrategy] = useState('sma_crossover');
  const [fast, setFast] = useState(20);
  const [slow, setSlow] = useState(50);
  const [oversold, setOversold] = useState(30);
  const [overbought, setOverbought] = useState(70);
  const [period, setPeriod] = useState('2y');
  const [capital, setCapital] = useState(10000);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    const params: Record<string, number> = strategy === 'sma_crossover' ? { fast, slow } : { oversold, overbought };
    try {
      const data = await api.runBacktest(ticker, strategy, params, period);
      setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Build chart data combining equity + buy-hold
  const chartData = result ? result.equity_curve.map((p, i) => ({
    time: new Date(p.time * 1000).toLocaleDateString('es', { month: 'short', year: '2-digit' }),
    estrategia: p.value,
    buyHold: result.buy_hold_curve[i]?.value,
  })).filter((_, i) => i % Math.max(1, Math.floor((result?.equity_curve.length ?? 1) / 150)) === 0) : [];

  const m = result?.metrics;

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          <span className="gradient-text">Backtesting</span> de Estrategias
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          Testea estrategias con datos históricos reales. Los resultados pasados no garantizan resultados futuros.
        </p>

        {/* Config */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ticker</label>
              <input className="input" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="AAPL" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Estrategia</label>
              <select className="input" value={strategy} onChange={e => setStrategy(e.target.value)}>
                <option value="sma_crossover">SMA Crossover</option>
                <option value="rsi_mean_reversion">RSI Mean Reversion</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Período</label>
              <select className="input" value={period} onChange={e => setPeriod(e.target.value)}>
                {['1y', '2y', '3y', '5y'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Capital inicial ($)</label>
              <input className="input" type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} />
            </div>
            {strategy === 'sma_crossover' ? (
              <>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SMA Rápida</label>
                  <input className="input" type="number" value={fast} onChange={e => setFast(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SMA Lenta</label>
                  <input className="input" type="number" value={slow} onChange={e => setSlow(Number(e.target.value))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>RSI Sobrevendido</label>
                  <input className="input" type="number" value={oversold} onChange={e => setOversold(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>RSI Sobrecomprado</label>
                  <input className="input" type="number" value={overbought} onChange={e => setOverbought(Number(e.target.value))} />
                </div>
              </>
            )}
          </div>
          <button className="btn btn-primary" onClick={run} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : '▶'}
            {loading ? 'Ejecutando backtest...' : 'Ejecutar Backtest'}
          </button>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>

        {result && (
          <>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Retorno Estrategia', value: `${m!.total_return_pct > 0 ? '+' : ''}${m!.total_return_pct.toFixed(2)}%`, color: m!.total_return_pct > 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'Retorno Buy&Hold', value: `${m!.buy_hold_return_pct > 0 ? '+' : ''}${m!.buy_hold_return_pct.toFixed(2)}%`, color: m!.buy_hold_return_pct > 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'Sharpe Ratio', value: m!.sharpe_ratio.toFixed(3), color: m!.sharpe_ratio > 1 ? 'var(--green)' : m!.sharpe_ratio > 0 ? 'var(--yellow)' : 'var(--red)' },
                { label: 'Max Drawdown', value: `${m!.max_drawdown_pct.toFixed(2)}%`, color: 'var(--red)' },
                { label: 'Win Rate', value: `${m!.win_rate_pct.toFixed(1)}%`, color: m!.win_rate_pct > 50 ? 'var(--green)' : 'var(--red)' },
                { label: 'Total Trades', value: m!.total_trades.toString(), color: 'var(--text-primary)' },
                { label: 'Retorno Anual', value: `${m!.annual_return_pct.toFixed(2)}%`, color: m!.annual_return_pct > 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'Volatilidad Anual', value: `${m!.annual_volatility_pct.toFixed(2)}%`, color: 'var(--yellow)' },
              ].map(kpi => (
                <div key={kpi.label} className="card" style={{ textAlign: 'center', padding: '14px 12px' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{kpi.label}</p>
                  <p className="mono" style={{ fontSize: 18, fontWeight: 800, color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Equity curve */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-title">Curva de Capital — Estrategia vs Buy & Hold</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{result.description}</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d3d" />
                  <XAxis dataKey="time" tick={{ fill: '#8a9bb0', fontSize: 9 }} interval={Math.floor(chartData.length / 8)} />
                  <YAxis tick={{ fill: '#8a9bb0', fontSize: 9 }} tickFormatter={(v: any) => `$${Number(v).toFixed(0)}`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: any, name: any) => [`$${Number(v).toFixed(2)}`, name]} />
                  <ReferenceLine y={capital} stroke="#4a5c6e" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="estrategia" stroke="#00d4aa" strokeWidth={2} dot={false} name="Estrategia" />
                  <Line type="monotone" dataKey="buyHold" stroke="#4e8cff" strokeWidth={1.5} dot={false} name="Buy & Hold" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent trades */}
            {result.trades.length > 0 && (
              <div className="card">
                <div className="section-title">Últimos Trades</div>
                <table className="data-table">
                  <thead>
                    <tr><th>Entrada</th><th>Salida</th><th style={{textAlign:'right'}}>Precio Entrada</th><th style={{textAlign:'right'}}>Precio Salida</th><th style={{textAlign:'right'}}>P&L</th><th>Resultado</th></tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 11 }}>{t.entry_date}</td>
                        <td style={{ fontSize: 11 }}>{t.exit_date}</td>
                        <td className="mono" style={{ textAlign: 'right', fontSize: 11 }}>${t.entry_price.toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: 'right', fontSize: 11 }}>${t.exit_price.toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: 'right', fontSize: 11, color: t.pnl_pct > 0 ? 'var(--green)' : 'var(--red)' }}>
                          {t.pnl_pct > 0 ? '+' : ''}{t.pnl_pct.toFixed(2)}%
                        </td>
                        <td><span className={`badge ${t.result === 'WIN' ? 'badge-green' : 'badge-red'}`}>{t.result}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
