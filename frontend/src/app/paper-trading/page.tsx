'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface Position {
  id: string;
  ticker: string;
  entry_price: number;
  quantity: number;
  entry_date: string;
  current_price?: number;
  pnl?: number;
  pnl_pct?: number;
}

const INITIAL_CAPITAL = 100_000;

export default function PaperTradingPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cash, setCash] = useState(INITIAL_CAPITAL);
  const [portfolioValue, setPortfolioValue] = useState(INITIAL_CAPITAL);
  const [buyingPower, setBuyingPower] = useState(INITIAL_CAPITAL);

  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [error, setError] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const acc = await api.alpacaAccount();
      const pos = await api.alpacaPositions();
      setCash(acc.cash);
      setPortfolioValue(acc.portfolio_value);
      setBuyingPower(acc.buying_power);
      // Maps API response to internal Position interface. 
      // API returns: id, ticker, entry_price, current_price, quantity, pnl, pnl_pct
      const mappedPositions: Position[] = pos.map((p: any) => ({
        id: p.id,
        ticker: p.ticker,
        entry_price: p.entry_price,
        current_price: p.current_price,
        quantity: p.quantity,
        entry_date: new Date().toISOString().split('T')[0], // Approximation Since Alpaca /positions doesn't return date easily
        pnl: p.pnl,
        pnl_pct: p.pnl_pct,
      }));
      setPositions(mappedPositions);
    } catch (e: any) {
      console.error(e);
      // Fallback or handle error quietly. 
      // If the API key is not set, we can show an error on screen.
      setError(e.message || "Error conectando con Alpaca API.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const executeTrade = async () => {
    setError(''); setPriceLoading(true);
    const t = ticker.trim().toUpperCase();
    if (!t) { setError('Ingresá un ticker.'); setPriceLoading(false); return; }
    try {
      await api.alpacaOrder(t, quantity, action);
      setTicker('');
      setTimeout(fetchData, 2000); // Wait for order to fill
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPriceLoading(false);
    }
  };

  const closePos = async (tickerToClose: string) => {
    try {
      await api.alpacaClosePosition(tickerToClose);
      setTimeout(fetchData, 2000);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const totalAccountPnL = portfolioValue - INITIAL_CAPITAL;
  const totalReturn = (totalAccountPnL / INITIAL_CAPITAL) * 100;

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>
            <span className="gradient-text">Paper Trading</span> Alpaca
          </h1>
          <button className="btn btn-ghost" onClick={fetchData} style={{ fontSize: 11 }}>
            🔄 Refrescar
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          Operá en vivo con dinero virtual conectado a tu cuenta de Alpaca Paper Trading.
        </p>

        {/* Portfolio stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Poder de Compra', value: `$${buyingPower.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--accent)' },
            { label: 'Efectivo', value: `$${cash.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--text-primary)' },
            { label: 'Valor Total', value: `$${portfolioValue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--text-primary)' },
            { label: 'P&L Total', value: `${totalAccountPnL >= 0 ? '+' : ''}$${totalAccountPnL.toFixed(2)} (${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%)`, color: totalAccountPnL >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map(kpi => (
            <div key={kpi.label} className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{kpi.label}</p>
              <p className="mono" style={{ fontSize: 16, fontWeight: 800, color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Trade form */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">Nueva Operación (Simulada)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ticker</label>
              <input className="input" style={{ width: 120 }} placeholder="AAPL" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Cantidad</label>
              <input className="input" type="number" style={{ width: 100 }} value={quantity} min={1} onChange={e => setQuantity(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setAction('BUY')} className="btn" style={{ background: action === 'BUY' ? 'var(--green)' : 'var(--bg-border)', color: action === 'BUY' ? '#000' : 'var(--text-secondary)' }}>
                <TrendingUp size={14} /> COMPRAR
              </button>
              <button onClick={() => setAction('SELL')} className="btn" style={{ background: action === 'SELL' ? 'var(--red)' : 'var(--bg-border)', color: action === 'SELL' ? '#fff' : 'var(--text-secondary)' }}>
                <TrendingDown size={14} /> VENDER
              </button>
            </div>
            <button className="btn btn-primary" onClick={executeTrade} disabled={priceLoading}>
              {priceLoading ? '...' : 'Ejecutar'}
            </button>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>

        {/* Positions */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Posiciones Abiertas</span>
          </div>
          {positions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertTriangle size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No tenés posiciones abiertas. Realizá tu primera operación simulada.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Ticker</th><th style={{textAlign:'right'}}>Entrada</th><th style={{textAlign:'right'}}>Actual</th><th style={{textAlign:'right'}}>Cantidad</th><th style={{textAlign:'right'}}>P&L</th><th>Fecha</th><th></th></tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.ticker}</td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12 }}>${p.entry_price.toFixed(4)}</td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12 }}>${(p.current_price ?? p.entry_price).toFixed(4)}</td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12 }}>{p.quantity}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${(p.pnl ?? 0) >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                        {(p.pnl ?? 0) >= 0 ? '+' : ''}${(p.pnl ?? 0).toFixed(2)} ({(p.pnl_pct ?? 0).toFixed(2)}%)
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 10 }}
                        onClick={() => closePos(p.ticker)}>
                        <Trash2 size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
