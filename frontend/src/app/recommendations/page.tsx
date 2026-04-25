'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageHelp from '@/components/PageHelp';
import { api, ScanItem, ScanResult } from '@/lib/api';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Loader2,
  Star, Eye, XCircle, Zap, BarChart2
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all',          label: 'Todos',               icon: BarChart2 },
  { value: 'stocks',       label: 'Acciones',            icon: TrendingUp },
  { value: 'etfs',         label: 'ETFs',                icon: Star },
  { value: 'crypto',       label: 'Crypto',              icon: Zap },
  { value: 'short-term',   label: 'Estrat. Corto Plazo', icon: Zap },
  { value: 'long-term',    label: 'Estrat. Largo Plazo', icon: TrendingUp },
  { value: 'alternatives', label: 'Estrat. Alternativos',icon: Star },
];

const SCORE_COLOR = (s: number) =>
  s >= 68 ? 'var(--green)' : s >= 52 ? 'var(--yellow)' : 'var(--red)';

function RatingBadge({ rating }: { rating: ScanItem['rating'] }) {
  const cfg = {
    BUY:   { label: '🚀 COMPRAR', cls: 'badge-green' },
    WATCH: { label: '👁️ OBSERVAR', cls: 'badge-yellow' },
    AVOID: { label: '⛔ EVITAR',  cls: 'badge-red' },
  }[rating];
  return <span className={`badge ${cfg.cls}`} style={{ fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg-border)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${score}%`, background: SCORE_COLOR(score), borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: SCORE_COLOR(score), width: 28 }}>{score}</span>
    </div>
  );
}

function AssetCard({ item }: { item: ScanItem }) {
  const isPos = item.change_pct > 0;
  return (
    <Link href={`/asset/${item.ticker}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        cursor: 'pointer', transition: 'all 0.18s',
        borderColor: item.rating === 'BUY' ? 'var(--green-dim)' : item.rating === 'AVOID' ? 'var(--red-dim)' : 'var(--bg-border)',
      }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{item.ticker}</span>
              <span className="badge badge-muted" style={{ fontSize: 9 }}>{item.asset_type.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
          </div>
          <RatingBadge rating={item.rating} />
        </div>

        {/* Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="mono" style={{ fontWeight: 700, fontSize: 15 }}>
            ${(item.price ?? 0) > 100 ? (item.price ?? 0).toFixed(2) : (item.price ?? 0).toFixed(4)}
          </span>
          <span className={`badge ${isPos ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
            {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPos ? '+' : ''}{(item.change_pct ?? 0).toFixed(2)}%
          </span>
        </div>

        {/* Score bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Investment Score</span>
          </div>
          <ScoreBar score={item.score} />
        </div>

        {/* Indicators row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className={`badge ${item.rsi < 30 ? 'badge-green' : item.rsi > 70 ? 'badge-red' : 'badge-muted'}`} style={{ fontSize: 10 }}>
            RSI {item.rsi}
          </span>
          <span className={`badge ${item.macd_bullish ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
            MACD {item.macd_bullish ? '▲' : '▼'}
          </span>
          {item.dominant_sentiment !== 'neutral' && (
            <span className={`badge ${item.dominant_sentiment === 'bullish' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
              {item.dominant_sentiment === 'bullish' ? '🐂' : '🐻'}
            </span>
          )}
        </div>

        {/* Top reasons */}
        {item.top_reasons.length > 0 && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            💡 {item.top_reasons[0]}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function RecommendationsPage() {
  const [category, setCategory] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'BUY' | 'WATCH' | 'AVOID'>('ALL');
  const scan = useCallback(async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const result = await api.scanMarket(category, 40, minScore);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Error al escanear el mercado');
    } finally {
      setLoading(false);
    }
  }, [category, minScore]);

  const filtered = data?.all_results.filter(r =>
    activeFilter === 'ALL' ? true : r.rating === activeFilter
  ) ?? [];

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            Recomendaciones de <span className="gradient-text">Inversión</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 600 }}>
            Escaneo automático del mercado usando análisis técnico y fundamental. Los activos se clasifican
            por Investment Score (0-100) en tres categorías.
          </p>
        </div>

        <PageHelp 
          title="💡 Glosario de Recomendaciones"
          terms={[
            { term: "Investment Score", definition: "Un puntaje de 0 a 100 creado por el modelo. A mayor puntaje (ej. 70+), más señales coinciden en que es buen momento para comprar." },
            { term: "Top Picks", definition: "Los activos con los mejores puntajes actuales. Considerados las mejores oportunidades por nuestro algoritmo combinando técnico y fundamental." }
          ]} 
        />

        {/* Disclaimer */}
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 24,
          background: 'var(--yellow-dim)', border: '1px solid #ffd32a33',
          fontSize: 11, color: 'var(--yellow)', lineHeight: 1.6,
        }}>
          ⚠️ <strong>Aviso:</strong> Estas recomendaciones son generadas automáticamente por modelos de análisis técnico/fundamental
          y son solo para fines <strong>educativos</strong>. No constituyen asesoramiento financiero. Siempre realizá tu propia investigación.
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
          Escáner Automático del Mercado
        </h2>

        {/* Controls */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Categoría</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => setCategory(c.value)} style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    background: category === c.value ? 'var(--accent)' : 'var(--bg-border)',
                    color: category === c.value ? '#000' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Score mínimo: <strong>{minScore}</strong></p>
              <input type="range" min={0} max={70} step={5} value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                style={{ width: 160, accentColor: 'var(--accent)' }} />
            </div>
            <button className="btn btn-primary" onClick={scan} disabled={loading} style={{ marginLeft: 'auto' }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {loading ? 'Escaneando mercado...' : 'Escanear Mercado'}
            </button>
          </div>
          {loading && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              ⏳ Analizando activos en paralelo... Esto puede tomar 15–30 segundos la primera vez.
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: 16, background: 'var(--red-dim)', borderRadius: 8, marginBottom: 20, color: 'var(--red)', fontSize: 13 }}>
            ❌ {error}
          </div>
        )}

        {data && (
          <>
            {/* Summary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: '🚀 COMPRAR', count: data.summary.buys,  color: 'var(--green)', filter: 'BUY' as const },
                { label: '👁️ OBSERVAR', count: data.summary.watch, color: 'var(--yellow)', filter: 'WATCH' as const },
                { label: '⛔ EVITAR',  count: data.summary.avoid, color: 'var(--red)',   filter: 'AVOID' as const },
              ].map(kpi => (
                <button
                  key={kpi.filter}
                  onClick={() => setActiveFilter(activeFilter === kpi.filter ? 'ALL' : kpi.filter)}
                  style={{
                    background: activeFilter === kpi.filter ? `${kpi.color}22` : 'var(--bg-card)',
                    border: `1px solid ${activeFilter === kpi.filter ? kpi.color : 'var(--bg-border)'}`,
                    borderRadius: 10, padding: '16px 12px', cursor: 'pointer', transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                >
                  <p className="mono" style={{ fontSize: 32, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.count}</p>
                  <p style={{ fontSize: 12, color: kpi.color, fontWeight: 700, marginTop: 4 }}>{kpi.label}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {activeFilter === kpi.filter ? 'Clic para ver todos' : 'Clic para filtrar'}
                  </p>
                </button>
              ))}
            </div>

            {/* Top Picks spotlight */}
            {activeFilter === 'ALL' && data.top_picks.length > 0 && (
              <div className="card" style={{ marginBottom: 20, borderColor: 'var(--green-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Star size={16} color="var(--green)" />
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--green)' }}>Top Picks — Mejores oportunidades</span>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>Score ≥ 68</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {data.top_picks.slice(0, 5).map(item => (
                    <Link key={item.ticker} href={`/asset/${item.ticker}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '12px', borderRadius: 8, background: 'var(--bg-surface)',
                        border: '1px solid var(--green-dim)', textAlign: 'center',
                        transition: 'all 0.18s', cursor: 'pointer',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--green-dim)')}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>{item.ticker}</div>
                        <div className="mono" style={{ fontSize: 18, fontWeight: 900, color: SCORE_COLOR(item.score) }}>{item.score}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>{item.score_label}</div>
                        <div className={`badge ${item.change_pct > 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                          {item.change_pct > 0 ? '+' : ''}{(item.change_pct ?? 0).toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Mostrando {filtered.length} activos — escaneados {data.total_scanned}
              </span>
              {activeFilter !== 'ALL' && (
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}
                  onClick={() => setActiveFilter('ALL')}>
                  ✕ Quitar filtro
                </button>
              )}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
              {filtered.map(item => <AssetCard key={item.ticker} item={item} />)}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No hay activos en esta categoría con el score mínimo configurado.
              </div>
            )}
          </>
        )}

        {!data && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <BarChart2 size={48} color="var(--accent)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Escaneá el mercado</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Analizamos hasta 50 activos en paralelo y los clasificamos por Investment Score.
            </p>
            <button className="btn btn-primary" onClick={scan} style={{ fontSize: 14, padding: '10px 24px' }}>
              <RefreshCw size={16} /> Iniciar escaneo
            </button>
          </div>
        )}
      </div>
    </>
  );
}
