// This file extends api.ts with scanner types — imported by recommendations page
export interface ScanItem {
  ticker: string;
  name: string;
  asset_type: string;
  sector: string;
  price: number;
  change_pct: number;
  score: number;
  score_label: string;
  rating: 'BUY' | 'WATCH' | 'AVOID';
  rating_color: string;
  rating_emoji: string;
  rsi: number;
  macd_bullish: boolean;
  dominant_sentiment: string;
  top_reasons: string[];
  market_cap?: number;
  pe_ratio?: number;
  volume?: number;
}

export interface ScanResult {
  category: string;
  total_scanned: number;
  total_results: number;
  summary: { buys: number; watch: number; avoid: number };
  top_picks: ScanItem[];
  all_results: ScanItem[];
  disclaimer: string;
}
