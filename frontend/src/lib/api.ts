/**
 * API Client — centralized fetch wrapper for the FastAPI backend.
 * All endpoints return typed responses. Base URL from env var.
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: call the backend directly (port 8000) using CORS, 
    // bypassing the 30-sec Next.js proxy timeout completely.
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  // Server-side: Next.js must call the internal Docker network
  return process.env.BACKEND_URL || 'http://backend:8000';
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface AssetInfo {
  ticker: string; name: string; sector: string; industry: string;
  currency: string; asset_type: 'stock' | 'etf' | 'crypto';
  price: number; previous_close: number; change_pct: number;
  volume: number; market_cap: number;
  pe_ratio?: number; eps?: number;  revenue?: number;
  revenue_growth?: number;
  earnings_growth?: number; debt_to_equity?: number;
  profit_margins?: number; beta?: number;
  '52w_high'?: number; '52w_low'?: number;
  description?: string;
}

export interface Candle {
  time: string; open: number; high: number; low: number;
  close: number; volume: number;
}

export interface Signal {
  type: string; label: string; description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral'; strength: string;
}

export interface Indicators {
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number; pct_b: number; bandwidth: number };
  moving_averages: { sma20: number; sma50: number; sma200: number; ema9: number; ema21: number };
  atr: number; adx: number; obv: number;
  support_resistance: { support: number[]; resistance: number[] };
  signals: { signals: Signal[]; summary: string; dominant_sentiment: string };
}

export interface ScoreComponent {
  score: number; weight: number; label: string; reasons: string[];
}

export interface InvestmentScore {
  total: number; label: string; color: string;
  components: ScoreComponent[];
  disclaimer: string;
}

export interface Regime {
  regime: 'bull' | 'bear' | 'sideways' | 'unknown';
  label: string; color: string; emoji: string;
  confidence: number; confidence_pct: number;
  bullish_factors: string[]; bearish_factors: string[];
}

export interface RiskLevels {
  current_price: number;
  atr_method?: {
    atr_value: number; atr_pct: number;
    recommended: { stop_loss: number; take_profit: number; rr_ratio: number; explanation: string };
  };
  support_resistance_method?: {
    nearest_support: number; nearest_resistance: number;
    stop_loss: { price: number; pct: number };
    take_profit: { price: number; pct: number; rr_ratio: number };
  };
  levels: { support: number[]; resistance: number[] };
}

export interface MLSignal {
  signal: 'BUY' | 'HOLD' | 'SELL';
  signal_label: string; confidence: number;
  probabilities: { BUY: number; HOLD: number; SELL: number };
  cv_accuracy: number;
  feature_importance: Record<string, number>;
  disclaimer: string;
}

export interface FullAnalysis {
  ticker: string; info: AssetInfo; indicators: Indicators;
  score: InvestmentScore; risk: RiskLevels; regime: Regime;
}

export interface FrontierPortfolio {
  return: number; volatility: number; sharpe: number;
  weights: Record<string, number>;
}

export interface OptimizationResult {
  tickers: string[];
  frontier: FrontierPortfolio[];
  max_sharpe: FrontierPortfolio & { label: string };
  min_volatility: FrontierPortfolio & { label: string };
  correlation: { labels: string[]; matrix: number[][] };
}

export interface BacktestResult {
  ticker: string; strategy: string; description: string;
  metrics: {
    total_return_pct: number; buy_hold_return_pct: number;
    annual_return_pct: number; annual_volatility_pct: number;
    sharpe_ratio: number; max_drawdown_pct: number;
    win_rate_pct: number; total_trades: number;
  };
  equity_curve: { time: number; value: number }[];
  drawdown_curve: { time: number; value: number }[];
  buy_hold_curve: { time: number; value: number }[];
  trades: { entry_date: string; exit_date: string; entry_price: number; exit_price: number; pnl_pct: number; result: string }[];
}

export interface ScanItem {
  ticker: string; name: string; asset_type: string; sector: string;
  price: number; change_pct: number; score: number; score_label: string;
  rating: 'BUY' | 'WATCH' | 'AVOID'; rating_color: string; rating_emoji: string;
  rsi: number; macd_bullish: boolean; dominant_sentiment: string;
  top_reasons: string[];
  market_cap?: number; pe_ratio?: number; volume?: number;
}

export interface ScanResult {
  category: string; total_scanned: number; total_results: number;
  summary: { buys: number; watch: number; avoid: number };
  top_picks: ScanItem[];
  all_results: ScanItem[];
  disclaimer: string;
}

export interface Alert {
  id: string; ticker: string; condition: string;
  threshold: number; description: string;
  triggered: boolean; triggered_at?: string; active: boolean;
}

// ── API functions ──────────────────────────────────────────────────────────

export const api = {
  watchlist: (tickers: string[]) =>
    apiFetch<Record<string, { price: number; change_pct: number }>>(
      `/api/asset/watchlist?tickers=${tickers.join(',')}`
    ),

  assetInfo: (ticker: string) =>
    apiFetch<AssetInfo>(`/api/asset/${ticker}/info`),

  priceOnDate: (ticker: string, date: string) =>
    apiFetch<{ ticker: string; date: string; price: number }>(`/api/asset/${ticker}/price-on-date?date=${date}`),

  ohlcv: (ticker: string, period = '6mo', interval = '1d') =>
    apiFetch<{ candles: Candle[] }>(`/api/asset/${ticker}/ohlcv?period=${period}&interval=${interval}`),

  indicators: (ticker: string, period = '1y') =>
    apiFetch<Indicators>(`/api/asset/${ticker}/indicators?period=${period}`),

  score: (ticker: string) =>
    apiFetch<InvestmentScore>(`/api/asset/${ticker}/score`),

  regime: (ticker: string) =>
    apiFetch<Regime>(`/api/asset/${ticker}/regime`),

  risk: (ticker: string, riskPct = 1) =>
    apiFetch<RiskLevels>(`/api/asset/${ticker}/risk?risk_pct=${riskPct}`),

  mlSignal: (ticker: string) =>
    apiFetch<MLSignal>(`/api/asset/${ticker}/ml`),

  fullAnalysis: (ticker: string) =>
    apiFetch<FullAnalysis>(`/api/asset/${ticker}/full`),

  optimizePortfolio: (tickers: string[], period = '2y') =>
    apiFetch<OptimizationResult>('/api/portfolio/optimize', {
      method: 'POST',
      body: JSON.stringify({ tickers, period }),
    }),

  runBacktest: (ticker: string, strategy: string, params: Record<string, number>, period = '2y') =>
    apiFetch<BacktestResult>('/api/backtest/run', {
      method: 'POST',
      body: JSON.stringify({ ticker, strategy, params, period }),
    }),

  getAlerts: () => apiFetch<{ alerts: Alert[] }>('/api/alerts/'),

  createAlert: (data: { ticker: string; condition: string; threshold: number; description?: string; telegram_user?: string; whatsapp_phone?: string; whatsapp_apikey?: string }) =>
    apiFetch<Alert>('/api/alerts/create', { method: 'POST', body: JSON.stringify(data) }),

  deleteAlert: (id: string) =>
    apiFetch<{ deleted: string }>(`/api/alerts/${id}`, { method: 'DELETE' }),

  scanMarket: (category = 'all', limit = 30, minScore = 0) =>
    apiFetch<ScanResult>(`/api/scanner/scan?category=${category}&limit=${limit}&min_score=${minScore}`),

  quickRating: (ticker: string) =>
    apiFetch<ScanItem>(`/api/scanner/quick/${ticker}`),

  alpacaAccount: () =>
    apiFetch<{ cash: number; portfolio_value: number; buying_power: number }>('/api/alpaca/account'),

  alpacaPositions: () =>
    apiFetch<{ id: string; ticker: string; entry_price: number; current_price: number; quantity: number; pnl: number; pnl_pct: number }[]>('/api/alpaca/positions'),

  alpacaOrder: (ticker: string, quantity: number, side: 'BUY' | 'SELL') =>
    apiFetch<{ status: string; order_id: string }>('/api/alpaca/orders', {
      method: 'POST',
      body: JSON.stringify({ ticker, quantity, side }),
    }),

  alpacaClosePosition: (ticker: string) =>
    apiFetch<{ status: string; closed: string }>(`/api/alpaca/positions/${ticker}`, {
      method: 'DELETE',
    }),

  macro: () => apiFetch<any>('/api/macro/'),

  sentiment: (ticker: string) => apiFetch<any>(`/api/asset/${ticker}/sentiment`),

  forecast: (ticker: string, days = 14) => apiFetch<any>(`/api/asset/${ticker}/forecast?days=${days}`),

  optionsDates: (ticker: string) => apiFetch<any>(`/api/asset/${ticker}/options/dates`),

  optionsChain: (ticker: string, date: string) => apiFetch<any>(`/api/asset/${ticker}/options?date=${date}`),
};
