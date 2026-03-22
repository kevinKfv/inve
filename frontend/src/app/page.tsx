'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LiveValue from '@/components/LiveValue';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, RefreshCw, Search, Plus, X } from 'lucide-react';

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD', 'SOL-USD'];

interface WatchlistItem {
  ticker: string;
  price: number;
  change_pct: number;
}

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [prices, setPrices] = useState<Record<string, { price: number; change_pct: number }>>({});
  const [loading, setLoading] = useState(true);
  const [newTicker, setNewTicker] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboard_watchlist');
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const fetchPrices = useCallback(async () => {
    if (watchlist.length === 0) return;
    try {
      setLoading(true);
      const data = await api.watchlist(watchlist);
      setPrices(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => { 
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Simulate live market fluctuations every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        if (Object.keys(prev).length === 0) return prev;
        const next = { ...prev };
        let changed = false;
        for (const ticker in next) {
          // 40% chance to wiggle a ticker each tick
          if (Math.random() > 0.6) {
            const shiftPct = (Math.random() - 0.5) * 0.02; // -0.01% to +0.01%
            next[ticker] = {
              ...next[ticker],
              price: next[ticker].price * (1 + shiftPct / 100),
              change_pct: next[ticker].change_pct + shiftPct
            };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const addTicker = () => {
    const t = newTicker.trim().toUpperCase();
    if (t && !watchlist.includes(t)) {
      setWatchlist(prev => {
        const next = [...prev, t];
        localStorage.setItem('dashboard_watchlist', JSON.stringify(next));
        return next;
      });
      setNewTicker('');
    }
  };

  const removeTicker = (t: string) => {
    setWatchlist(prev => {
      const next = prev.filter(x => x !== t);
      localStorage.setItem('dashboard_watchlist', JSON.stringify(next));
      return next;
    });
  };

  const gainers = Object.entries(prices).filter(([, v]) => v.change_pct > 0).sort((a, b) => b[1].change_pct - a[1].change_pct).slice(0, 3);
  const losers  = Object.entries(prices).filter(([, v]) => v.change_pct < 0).sort((a, b) => a[1].change_pct - b[1].change_pct).slice(0, 3);

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>
              Market <span className="gradient-text">Dashboard</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              {lastUpdated ? `Actualizado: ${lastUpdated.toLocaleTimeString('es')}` : 'Cargando datos...'}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={fetchPrices} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Top movers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div className="card">
            <div className="section-title" style={{ color: 'var(--green)' }}>🚀 Top Ganadores</div>
            {gainers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cargando...</p>}
            {gainers.map(([t, v]) => (
              <Link key={t} href={`/asset/${t}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', textDecoration:'none', padding:'6px 0', borderBottom:'1px solid var(--bg-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{t}</span>
                <div style={{ textAlign: 'right' }}>
                  <LiveValue className="mono text-green" style={{ fontWeight: 700, fontSize: 13 }} value={v.change_pct ?? 0} format="pct" />
                </div>
              </Link>
            ))}
          </div>
          <div className="card">
            <div className="section-title" style={{ color: 'var(--red)' }}>📉 Top Perdedores</div>
            {losers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cargando...</p>}
            {losers.map(([t, v]) => (
              <Link key={t} href={`/asset/${t}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', textDecoration:'none', padding:'6px 0', borderBottom:'1px solid var(--bg-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{t}</span>
                <LiveValue className="mono text-red" style={{ fontWeight: 700, fontSize: 13 }} value={v.change_pct ?? 0} format="pct" />
              </Link>
            ))}
          </div>
        </div>

        {/* Add ticker */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="input" style={{ maxWidth: 200 }}
            placeholder="Agregar ticker (ej: TSLA)"
            value={newTicker}
            onChange={e => setNewTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && addTicker()}
          />
          <button className="btn btn-primary" onClick={addTicker}>
            <Plus size={14} /> Agregar
          </button>
        </div>

        {/* Watchlist table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)', display:'flex', alignItems:'center', gap: 8 }}>
            <Search size={14} color="var(--text-muted)" />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Watchlist</span>
            <span className="badge badge-accent">{watchlist.length} activos</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th className="mono" style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'right' }}>Cambio 1D</th>
                <th style={{ textAlign: 'right' }}>Análisis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map(ticker => {
                const data = prices[ticker];
                const isPos = data && data.change_pct > 0;
                const isNeg = data && data.change_pct < 0;
                return (
                  <tr key={ticker}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ticker}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {data ? <LiveValue value={data.price ?? 0} format="usd" /> : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {data ? (
                        <span className={`badge ${isPos ? 'badge-green' : isNeg ? 'badge-red' : 'badge-muted'}`}>
                          {isPos ? <TrendingUp size={10} /> : isNeg ? <TrendingDown size={10} /> : null}
                          <LiveValue value={data.change_pct} format="pct" />
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/asset/${ticker}`} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>
                        Analizar →
                      </Link>
                    </td>
                    <td style={{ width: 32 }}>
                      <button onClick={() => removeTicker(ticker)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        padding: 4, borderRadius: 4, display: 'flex',
                      }}>
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 24, padding: '12px 16px', borderRadius: 8,
          background: 'var(--yellow-dim)', border: '1px solid var(--yellow-dim)',
          fontSize: 11, color: 'var(--yellow)', lineHeight: 1.6,
        }}>
          ⚠️ <strong>Aviso Legal:</strong> InvestIQ Pro es una herramienta educativa de análisis técnico y fundamental.
          La información mostrada NO constituye asesoramiento financiero, recomendación de inversión ni predicción del mercado.
          Siempre realicé tu propia investigación y consultá a un asesor financiero certificado antes de invertir.
        </div>
      </div>
    </>
  );
}
