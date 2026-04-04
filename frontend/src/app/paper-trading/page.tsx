'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PageHelp from '@/components/PageHelp';
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
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('paper_positions');
      const savedCash = localStorage.getItem('paper_cash');
      if (saved) setPositions(JSON.parse(saved));
      if (savedCash) setCash(Number(savedCash));
    } catch {}
  }, []);

  const save = (pos: Position[], c: number) => {
    localStorage.setItem('paper_positions', JSON.stringify(pos));
    localStorage.setItem('paper_cash', String(c));
  };

  const refreshPrices = async () => {
    if (!positions.length) return;
    const tickers = [...new Set(positions.map(p => p.ticker))];
    try {
      const prices = await api.watchlist(tickers);
      setPositions(prev => {
        const updated = prev.map(pos => {
          const cp = prices[pos.ticker]?.price ?? pos.current_price ?? pos.entry_price;
          const pnl = (cp - pos.entry_price) * pos.quantity;
          const pnl_pct = ((cp - pos.entry_price) / pos.entry_price) * 100;
          return { ...pos, current_price: cp, pnl, pnl_pct };
        });
        return updated;
      });
    } catch {}
  };

  useEffect(() => { refreshPrices(); }, [positions.length]);

  const executeTrade = async () => {
    setError(''); setPriceLoading(true);
    const t = ticker.trim().toUpperCase();
    if (!t) { setError('Ingresá un ticker.'); setPriceLoading(false); return; }

    try {
      let price = 0;
      let actualDate = tradeDate;
      const todayStr = new Date().toISOString().split('T')[0];

      if (tradeDate === todayStr) {
        const prices = await api.watchlist([t]);
        price = prices[t]?.price || 0;
      } else {
        const history = await api.priceOnDate(t, tradeDate);
        price = history.price;
        actualDate = history.date;
      }

      if (!price) throw new Error(`No se pudo obtener el precio para la fecha seleccionada.`);

      const cost = price * quantity;

      if (action === 'BUY') {
        if (cost > cash) { setError(`Fondos insuficientes. Necesitás $${cost.toFixed(2)}, tenés $${cash.toFixed(2)}.`); return; }
        const newPos: Position = {
          id: Date.now().toString(), ticker: t, entry_price: price,
          quantity, entry_date: actualDate,
          current_price: price, pnl: 0, pnl_pct: 0,
        };
        const updated = [...positions, newPos];
        const newCash = cash - cost;
        setPositions(updated); setCash(newCash); save(updated, newCash);
      } else {
        const pos = positions.find(p => p.ticker === t);
        if (!pos) { setError(`No tenés posición en ${t}.`); return; }
        const proceeds = price * Math.min(quantity, pos.quantity);
        const updated = positions.filter(p => p.id !== pos.id);
        const newCash = cash + proceeds;
        setPositions(updated); setCash(newCash); save(updated, newCash);
      }
      setTicker('');
    } catch (e: any) { setError(e.message); }
    finally { setPriceLoading(false); }
  };

  const reset = () => {
    setPositions([]); setCash(INITIAL_CAPITAL);
    localStorage.removeItem('paper_positions'); localStorage.removeItem('paper_cash');
  };

  const portfolioValue = positions.reduce((sum, p) => sum + (p.current_price ?? p.entry_price) * p.quantity, 0);
  const totalValue = cash + portfolioValue;
  const totalAccountPnL = totalValue - INITIAL_CAPITAL;
  const totalReturn = (totalAccountPnL / INITIAL_CAPITAL) * 100;

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>
            <span className="gradient-text">Paper Trading</span> Simulator
          </h1>
          <button className="btn btn-ghost" onClick={reset} style={{ fontSize: 11 }}>
            🔄 Reset (${INITIAL_CAPITAL.toLocaleString()})
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          Modo simulación — operá con dinero virtual sin riesgo real.
        </p>

        <PageHelp 
          title="💡 Glosario de Paper Trading"
          terms={[
            { term: "Paper Trading", definition: "Operar en mercados financieros con dinero virtual simulado, para aprender o probar estrategias sin arriesgar capital real." },
            { term: "Efectivo Disponible", definition: "El saldo en tu cuenta virtual listo para ser usado en nuevas operaciones (cash)." },
            { term: "P&L Total (Profit and Loss)", definition: "Ganancia o pérdida total acumulada de toda tu cartera en dólares y porcentaje." },
            { term: "Reset", definition: "Reinicia tu simulador borrando todo historial y volviendo a tu capital inicial." }
          ]} 
        />

        {/* Portfolio stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Efectivo disponible', value: `$${cash.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--accent)' },
            { label: 'Valor Posiciones', value: `$${portfolioValue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--text-primary)' },
            { label: 'Valor Total', value: `$${totalValue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--text-primary)' },
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
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Fecha de compra</label>
              <input className="input" type="date" style={{ width: 150 }} value={tradeDate} max={new Date().toISOString().split('T')[0]} onChange={e => setTradeDate(e.target.value)} />
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
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.entry_date}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 10 }}
                        onClick={() => { const u = positions.filter(x => x.id !== p.id); setPositions(u); save(u, cash); }}>
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
