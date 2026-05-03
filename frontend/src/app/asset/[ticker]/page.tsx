'use client';
import { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import CandlestickChart from '@/components/CandlestickChart';
import RSIGauge from '@/components/RSIGauge';
import ScoreCard from '@/components/ScoreCard';
import SignalBadges from '@/components/SignalBadges';
import PageHelp from '@/components/PageHelp';
import SentimentGauge from '@/components/SentimentGauge';
import ForecastChart from '@/components/ForecastChart';
import OptionsTable from '@/components/OptionsTable';
import { api, FullAnalysis, MLSignal, Candle } from '@/lib/api';
import { TrendingUp, TrendingDown, ArrowLeft, Loader2, Brain, Shield } from 'lucide-react';
import Link from 'next/link';

type Params = Promise<{ ticker: string }>;

// Build overlay data from candles + MAs
function buildOverlay(candles: Candle[], window: number) {
  const out: { time: string; value: number }[] = [];
  for (let i = window - 1; i < candles.length; i++) {
    const slice = candles.slice(i - window + 1, i + 1);
    const avg = slice.reduce((s, c) => s + c.close, 0) / window;
    out.push({ time: candles[i].time, value: parseFloat(avg.toFixed(4)) });
  }
  return out;
}

export default function AssetPage({ params }: { params: Params }) {
  const { ticker } = use(params);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [mlSignal, setMlSignal] = useState<MLSignal | null>(null);
  const [period, setPeriod] = useState('1y');
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'technical' | 'fundamental' | 'risk' | 'ml'>('technical');

  useEffect(() => {
    if (!ticker) return;
    const fetchData = async () => {
      setLoading(true); setError('');
      try {
        const [full, ohlcvData] = await Promise.all([
          api.fullAnalysis(ticker),
          api.ohlcv(ticker, period),
        ]);
        setAnalysis(full);
        setCandles(ohlcvData.candles);
      } catch (e: any) {
        setError(e.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker, period]);

  const loadML = async () => {
    setMlLoading(true);
    try {
      const ml = await api.mlSignal(ticker);
      setMlSignal(ml);
      setActiveTab('ml');
    } catch (e) { console.error(e); }
    finally { setMlLoading(false); }
  };

  const info = analysis?.info;
  const ind = analysis?.indicators;

  const sma20 = candles.length > 20 ? buildOverlay(candles, 20) : undefined;
  const sma50 = candles.length > 50 ? buildOverlay(candles, 50) : undefined;

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} color="var(--accent)" className="animate-spin" />
        <p style={{ color: 'var(--text-muted)' }}>Cargando análisis de {ticker.toUpperCase()}...</p>
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, textAlign: 'center' }}>
        <p className="text-red" style={{ fontSize: 16 }}>❌ {error}</p>
        <Link href="/" className="btn btn-ghost" style={{ marginTop: 16 }}>← Volver</Link>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 20, paddingBottom: 40 }}>

        {/* Header */}
        <PageHelp 
          title="💡 Glosario del Análisis"
          terms={[
            { term: "RSI (Relative Strength Index)", definition: "Indicador que mide la velocidad y magnitud de los cambios de precio. >70 indica sobrecompra, <30 sobreventa." },
            { term: "MACD", definition: "Muestra la relación entre dos medias móviles para identificar la dirección y fuerza de la tendencia." },
            { term: "Bollinger Bands", definition: "Bandas de volatilidad que miden si el precio está estadísticamente alto o bajo en relación al promedio." },
            { term: "SMA / EMA", definition: "Medias Móviles Simples y Exponenciales. Suavizan el precio para identificar tendencias de corto y largo plazo." },
            { term: "ADX y ATR", definition: "ADX mide la fuerza de una tendencia. ATR mide la volatilidad histórica en términos monetarios absolutos." },
            { term: "P/E y EPS", definition: "Price/Earnings es la relación precio-ganancia. EPS es la ganancia por acción de la empresa según sus últimos balances." }
          ]} 
        />
        <div className="asset-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Link href="/" style={{ color: 'var(--text-muted)', display:'flex', alignItems:'center' }}><ArrowLeft size={16} /></Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>{ticker.toUpperCase()}</h1>
                <span className={`badge ${info?.asset_type === 'crypto' ? 'badge-blue' : info?.asset_type === 'etf' ? 'badge-accent' : 'badge-muted'}`}>
                  {info?.asset_type?.toUpperCase()}
                </span>
                <span className={`badge ${analysis?.regime.regime === 'bull' ? 'badge-green' : analysis?.regime.regime === 'bear' ? 'badge-red' : 'badge-yellow'}`}>
                  {analysis?.regime.emoji} {analysis?.regime.label}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{info?.name} · {info?.sector}</p>
            </div>
          </div>
          <div style={{ textAlign: 'left', alignSelf: 'stretch' }}>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800 }}>
              ${info?.price?.toFixed(info.price > 100 ? 2 : 4)}
            </div>
            <span className={`badge ${(info?.change_pct ?? 0) >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13 }}>
              {(info?.change_pct ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {(info?.change_pct ?? 0) >= 0 ? '+' : ''}{info?.change_pct?.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Chart + Score */}
        <div className="chart-grid">
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="section-title" style={{ margin: 0 }}>Gráfico de Precio</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['3mo', '6mo', '1y', '2y'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                    background: period === p ? 'var(--accent)' : 'var(--bg-border)',
                    color: period === p ? '#000' : 'var(--text-secondary)',
                    fontWeight: period === p ? 700 : 400,
                  }}>{p}</button>
                ))}
              </div>
            </div>
            {candles.length > 0 && (
              <CandlestickChart candles={candles} sma20={sma20} sma50={sma50} height={360} />
            )}
          </div>

          {analysis?.score && <ScoreCard score={analysis.score} />}
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: 16 }}>
          {(['technical', 'fundamental', 'risk', 'ml', 'options'] as const).map(tab => (
            <button key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'technical' ? '📊 Técnico' : tab === 'fundamental' ? '📋 Fundamental' : tab === 'risk' ? '🛡️ Riesgo' : tab === 'ml' ? '🤖 ML Signal' : '📈 Opciones'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'technical' && ind && (
          <div className="tech-grid">
            {/* RSI Gauge */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="section-title">RSI (14)</div>
              <RSIGauge value={ind.rsi ?? 50} />
            </div>

            {/* Indicators grid */}
            <div className="two-col-grid" style={{ gap: 12 }}>
              {/* MACD */}
              <div className="card">
                <div className="section-title">MACD (12/26/9)</div>
                <StatRow label="MACD" value={ind.macd.macd?.toFixed(4)} />
                <StatRow label="Signal" value={ind.macd.signal?.toFixed(4)} />
                <StatRow label="Histograma" value={ind.macd.histogram?.toFixed(4)}
                  color={ind.macd.histogram > 0 ? 'var(--green)' : 'var(--red)'} />
                <div style={{ marginTop: 8, fontSize: 11, color: ind.macd.histogram > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                  {ind.macd.histogram > 0 ? '▲ Momentum Alcista' : '▼ Momentum Bajista'}
                </div>
              </div>

              {/* Bollinger */}
              <div className="card">
                <div className="section-title">Bollinger Bands (20,2)</div>
                <StatRow label="Superior" value={`$${ind.bollinger.upper?.toFixed(2)}`} />
                <StatRow label="Media" value={`$${ind.bollinger.middle?.toFixed(2)}`} />
                <StatRow label="Inferior" value={`$${ind.bollinger.lower?.toFixed(2)}`} />
                <StatRow label="%B" value={ind.bollinger.pct_b?.toFixed(3)}
                  color={ind.bollinger.pct_b > 0.95 ? 'var(--red)' : ind.bollinger.pct_b < 0.05 ? 'var(--green)' : 'var(--accent)'} />
              </div>

              {/* Moving Averages */}
              <div className="card">
                <div className="section-title">Medias Móviles</div>
                {[['SMA 20', ind.moving_averages.sma20], ['SMA 50', ind.moving_averages.sma50], ['SMA 200', ind.moving_averages.sma200],
                  ['EMA 9', ind.moving_averages.ema9], ['EMA 21', ind.moving_averages.ema21]].map(([l, v]) => (
                  <StatRow key={l as string} label={l as string} value={v ? `$${(v as number).toFixed(2)}` : 'N/A'}
                    color={(v && info?.price && info.price > (v as number)) ? 'var(--green)' : 'var(--red)'} />
                ))}
              </div>

              {/* ADX + ATR */}
              <div className="card">
                <div className="section-title">Volatilidad y Tendencia</div>
                <StatRow label="ADX" value={ind.adx?.toFixed(1)} color={ind.adx > 25 ? 'var(--accent)' : 'var(--text-muted)'} />
                <StatRow label="ATR (14)" value={`$${ind.atr?.toFixed(4)}`} />
                <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {ind.adx > 25 ? `✅ Tendencia fuerte (ADX=${ind.adx?.toFixed(1)})` : `⚠️ Mercado lateral/débil (ADX=${ind.adx?.toFixed(1)})`}
                  </p>
                </div>
                {/* Support/Resistance */}
                {ind.support_resistance.support.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, marginBottom: 3 }}>SOPORTES</p>
                    {ind.support_resistance.support.slice(0, 2).map(s => (
                      <span key={s} className="badge badge-green mono" style={{ marginRight: 4, fontSize: 10 }}>${s}</span>
                    ))}
                    <p style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, margin: '6px 0 3px' }}>RESISTENCIAS</p>
                    {ind.support_resistance.resistance.slice(0, 2).map(r => (
                      <span key={r} className="badge badge-red mono" style={{ marginRight: 4, fontSize: 10 }}>${r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'technical' && ind && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">Señales de Trading</div>
            <SignalBadges signals={ind.signals.signals} />
          </div>
        )}

        {activeTab === 'fundamental' && info && (
          <div className="two-col-grid">
            <div className="card">
              <div className="section-title">Valoración</div>
              <StatRow label="P/E Ratio (Trailing)" value={info.pe_ratio?.toFixed(2) ?? 'N/A'} />
              <StatRow label="EPS (TTM)" value={info.eps ? `$${info.eps.toFixed(2)}` : 'N/A'} />
              <StatRow label="Beta" value={info.beta?.toFixed(2) ?? 'N/A'} />
              <StatRow label="Market Cap" value={info.market_cap ? formatLargeNum(info.market_cap) : 'N/A'} />
              <StatRow label="Máx 52 semanas" value={info['52w_high'] ? `$${info['52w_high'].toFixed(2)}` : 'N/A'} />
              <StatRow label="Mín 52 semanas" value={info['52w_low'] ? `$${info['52w_low'].toFixed(2)}` : 'N/A'} />
            </div>
            <div className="card">
              <div className="section-title">Fundamentales de Negocio</div>
              <StatRow label="Revenue" value={info.revenue ? formatLargeNum(info.revenue) : 'N/A'} />
              <StatRow label="Crecimiento Revenue" value={info.revenue_growth != null ? `${(info.revenue_growth * 100).toFixed(1)}%` : 'N/A'} />
              <StatRow label="Crecimiento EPS" value={info.earnings_growth != null ? `${(info.earnings_growth * 100).toFixed(1)}%` : 'N/A'}
                color={info.earnings_growth && info.earnings_growth > 0 ? 'var(--green)' : 'var(--red)'} />
              <StatRow label="Margen Neto" value={info.profit_margins != null ? `${(info.profit_margins * 100).toFixed(1)}%` : 'N/A'}
                color={info.profit_margins && info.profit_margins > 0.1 ? 'var(--green)' : 'var(--yellow)'} />
              <StatRow label="Deuda/Equity (D/E)" value={info.debt_to_equity?.toFixed(1) ?? 'N/A'} />
            </div>
            {info.description && (
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="section-title">Descripción</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{info.description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'risk' && analysis?.risk && (
          <div className="two-col-grid">
            {analysis.risk.atr_method && (
              <div className="card">
                <div className="section-title">🎯 Método ATR (Recomendado)</div>
                <div className="badge badge-accent" style={{ marginBottom: 12, fontSize: 11 }}>
                  ATR: ${analysis.risk.atr_method.atr_value.toFixed(4)} ({analysis.risk.atr_method.atr_pct.toFixed(2)}%)
                </div>
                <div style={{ background: 'var(--red-dim)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <p style={{ color: 'var(--red)', fontWeight: 700, fontSize: 12 }}>🛑 Stop Loss</p>
                  <p className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--red)' }}>
                    ${analysis.risk.atr_method.recommended.stop_loss.toFixed(4)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>1.5x ATR debajo del precio</p>
                </div>
                <div style={{ background: 'var(--green-dim)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <p style={{ color: 'var(--green)', fontWeight: 700, fontSize: 12 }}>✅ Take Profit</p>
                  <p className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>
                    ${analysis.risk.atr_method.recommended.take_profit.toFixed(4)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target 2R</p>
                </div>
                <div style={{ background: 'var(--accent-dim)', borderRadius: 8, padding: 12 }}>
                  <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>⚖️ Risk/Reward</p>
                  <p className="mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
                    1:{analysis.risk.atr_method.recommended.rr_ratio}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                  {analysis.risk.atr_method.recommended.explanation}
                </p>
              </div>
            )}
            {analysis.risk.support_resistance_method && (
              <div className="card">
                <div className="section-title">📐 Método Soporte/Resistencia</div>
                <StatRow label="Soporte cercano" value={`$${analysis.risk.support_resistance_method.nearest_support}`} color="var(--green)" />
                <StatRow label="Stop Loss" value={`$${analysis.risk.support_resistance_method.stop_loss.price} (${analysis.risk.support_resistance_method.stop_loss.pct}%)`} color="var(--red)" />
                <StatRow label="Resistencia cercana" value={`$${analysis.risk.support_resistance_method.nearest_resistance}`} color="var(--red)" />
                <StatRow label="Take Profit" value={`$${analysis.risk.support_resistance_method.take_profit.price} (${analysis.risk.support_resistance_method.take_profit.pct}%)`} color="var(--green)" />
                <StatRow label="R/R Ratio" value={`1:${analysis.risk.support_resistance_method.take_profit.rr_ratio}`} color="var(--accent)" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'ml' && (
          <div>
            {!mlSignal && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Brain size={40} color="var(--accent)" style={{ marginBottom: 12 }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                  El modelo ML se entrena on-demand con datos históricos del activo.
                  Puede tardar 10–30 segundos.
                </p>
                <button className="btn btn-primary" onClick={loadML} disabled={mlLoading}>
                  {mlLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                  {mlLoading ? 'Entrenando modelo...' : 'Ejecutar análisis ML'}
                </button>
              </div>
            )}
            {mlSignal && (
              <div className="two-col-grid">
                <div className="card" style={{ textAlign: 'center' }}>
                  <div className="section-title">Señal del Modelo</div>
                  <div style={{
                    fontSize: 40, fontWeight: 900, marginBottom: 8,
                    color: mlSignal.signal === 'BUY' ? 'var(--green)' : mlSignal.signal === 'SELL' ? 'var(--red)' : 'var(--yellow)',
                  }}>
                    {mlSignal.signal === 'BUY' ? '▲' : mlSignal.signal === 'SELL' ? '▼' : '◆'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{mlSignal.signal_label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Confianza: <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>{mlSignal.confidence}%</span>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {Object.entries(mlSignal.probabilities).map(([label, prob]) => (
                      <div key={label} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                          <span style={{ color: label === 'BUY' ? 'var(--green)' : label === 'SELL' ? 'var(--red)' : 'var(--yellow)' }}>{label}</span>
                          <span className="mono">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg-border)', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${prob * 100}%`, borderRadius: 99, background: label === 'BUY' ? 'var(--green)' : label === 'SELL' ? 'var(--red)' : 'var(--yellow)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    Precisión validación: <span className="mono text-accent">{(mlSignal.cv_accuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="card">
                  <div className="section-title">Importancia de Features</div>
                  {Object.entries(mlSignal.feature_importance).map(([feat, imp]) => (
                    <div key={feat} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{feat.replace(/_/g, ' ')}</span>
                        <span className="mono">{(imp * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 3, background: 'var(--bg-border)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${imp * 100}%`, background: 'var(--accent)', borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                  <p style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {mlSignal.disclaimer}
                  </p>
                </div>
              </div>
            )}
            
            <div className="two-col-grid" style={{ marginTop: 16 }}>
              <SentimentGauge ticker={ticker} />
              <ForecastChart ticker={ticker} />
            </div>
          </div>
        )}

        {activeTab === 'options' && (
          <div style={{ marginTop: 16 }}>
             <OptionsTable ticker={ticker} />
          </div>
        )}
      </div>
    </>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number | undefined; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value ?? '—'}</span>
    </div>
  );
}

function formatLargeNum(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}
