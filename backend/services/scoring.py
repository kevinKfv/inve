"""
Investment Scoring Service
Computes a 0–100 "Investment Score" combining:
  - Trend Score   (30%): position relative to MAs, direction
  - Momentum Score(25%): RSI, MACD momentum
  - Risk Score    (20%): volatility via ATR, BB width (lower vol = higher score)
  - Quality Score (25%): fundamentals (PE, growth, debt) or volume/liquidity for crypto
"""

import numpy as np
import pandas as pd
from services.indicators import (
    compute_rsi, compute_macd, compute_bollinger,
    compute_sma, compute_atr, compute_adx, _last_valid
)


# ─────────────────────────────────────────────
# Score Components
# ─────────────────────────────────────────────

def score_trend(df: pd.DataFrame) -> dict:
    """
    Trend Score (0-100):
    Based on:
    - Price position relative to SMA20, SMA50, SMA200
    - SMA20 vs SMA50 vs SMA200 alignment
    - ADX trend strength
    """
    price = float(df["close"].iloc[-1])
    sma_data = {}
    for w in [20, 50, 200]:
        if len(df) >= w:
            sma_data[w] = float(df["close"].rolling(w).mean().iloc[-1])

    score = 50.0  # Start neutral
    reasons = []

    # Price vs SMAs (+15 each)
    if 20 in sma_data and price > sma_data[20]:
        score += 10
        reasons.append("Precio > SMA20 (+10)")
    elif 20 in sma_data:
        score -= 10
        reasons.append("Precio < SMA20 (-10)")

    if 50 in sma_data and price > sma_data[50]:
        score += 15
        reasons.append("Precio > SMA50 (+15)")
    elif 50 in sma_data:
        score -= 15
        reasons.append("Precio < SMA50 (-15)")

    if 200 in sma_data and price > sma_data[200]:
        score += 20
        reasons.append("Precio > SMA200 (+20) — tendencia larga alcista")
    elif 200 in sma_data:
        score -= 20
        reasons.append("Precio < SMA200 (-20) — tendencia larga bajista")

    # Golden/Death cross
    if 50 in sma_data and 200 in sma_data:
        if sma_data[50] > sma_data[200]:
            score += 10
            reasons.append("Golden Cross SMA50>SMA200 (+10)")
        else:
            score -= 10
            reasons.append("Death Cross SMA50<SMA200 (-10)")

    # ADX
    adx_val = _last_valid(compute_adx(df))
    if adx_val and adx_val > 25:
        score += 5
        reasons.append(f"Tendencia fuerte ADX={adx_val:.1f} (+5)")

    return {
        "score": round(max(0, min(100, score)), 1),
        "weight": 0.30,
        "label": "Trend",
        "reasons": reasons,
    }


def score_momentum(df: pd.DataFrame) -> dict:
    """
    Momentum Score (0-100):
    Based on RSI position and MACD histogram direction.
    Extreme RSI (overbought/oversold) = neutral momentum.
    """
    rsi_val = _last_valid(compute_rsi(df))
    macd_d = compute_macd(df)
    hist = _last_valid(macd_d["histogram"])
    macd_line = _last_valid(macd_d["macd"])
    signal_line = _last_valid(macd_d["signal"])

    score = 50.0
    reasons = []

    # RSI component (sweet spot is 40-65 for bullish)
    if rsi_val is not None:
        if 40 <= rsi_val <= 65:
            score += 20
            reasons.append(f"RSI en zona ideal {rsi_val:.1f} (+20)")
        elif rsi_val < 30:
            score += 10  # Oversold can bounce
            reasons.append(f"RSI sobrevendido {rsi_val:.1f} — potencial rebote (+10)")
        elif rsi_val > 70 and rsi_val < 80:
            score -= 10
            reasons.append(f"RSI sobrecomprado {rsi_val:.1f} (-10)")
        elif rsi_val >= 80:
            score -= 25
            reasons.append(f"RSI muy sobrecomprado {rsi_val:.1f} (-25)")
        elif rsi_val < 40 and rsi_val >= 30:
            score -= 10
            reasons.append(f"RSI débil {rsi_val:.1f} (-10)")

    # MACD histogram momentum
    if hist is not None:
        if hist > 0 and macd_line > signal_line:
            score += 20
            reasons.append("MACD histograma positivo — momentum alcista (+20)")
        elif hist < 0:
            score -= 20
            reasons.append("MACD histograma negativo — momentum bajista (-20)")

    # MACD zero-cross (above zero = bullish bias)
    if macd_line is not None:
        if macd_line > 0:
            score += 10
            reasons.append("MACD sobre cero (+10)")
        else:
            score -= 5
            reasons.append("MACD bajo cero (-5)")

    return {
        "score": round(max(0, min(100, score)), 1),
        "weight": 0.25,
        "label": "Momentum",
        "reasons": reasons,
    }


def score_risk(df: pd.DataFrame) -> dict:
    """
    Risk Score (0-100):
    INVERSE of volatility — lower volatility = higher score.
    Uses ATR as % of price and Bollinger Bandwidth.
    A stable, low-volatility trend scores high.
    """
    price = float(df["close"].iloc[-1])
    atr_val = _last_valid(compute_atr(df))
    bb_d = compute_bollinger(df)
    bw = _last_valid(bb_d["bandwidth"])

    score = 70.0
    reasons = []

    # ATR % — normalize: <1% = low risk, >5% = high risk
    if atr_val and price > 0:
        atr_pct = atr_val / price * 100
        if atr_pct < 1:
            score += 20
            reasons.append(f"Volatilidad muy baja ATR={atr_pct:.2f}% (+20)")
        elif atr_pct < 2:
            score += 10
            reasons.append(f"Volatilidad baja ATR={atr_pct:.2f}% (+10)")
        elif atr_pct < 4:
            score -= 10
            reasons.append(f"Volatilidad moderada ATR={atr_pct:.2f}% (-10)")
        else:
            score -= 25
            reasons.append(f"Alta volatilidad ATR={atr_pct:.2f}% (-25)")

    # Bollinger squeeze means low vol (coming breakout)
    if bw is not None:
        avg_bw = bb_d["bandwidth"].rolling(50).mean().iloc[-1]
        if not pd.isna(avg_bw) and bw < avg_bw * 0.7:
            score += 10
            reasons.append("BB Squeeze — volatilidad comprimida (+10)")

    return {
        "score": round(max(0, min(100, score)), 1),
        "weight": 0.20,
        "label": "Risk",
        "reasons": reasons,
    }


def score_fundamentals(info: dict, asset_type: str) -> dict:
    """
    Fundamental Score (0-100):
    For stocks: PE ratio, earnings growth, debt-to-equity.
    For crypto/ETF: volume trend and market cap as liquidity proxy.
    """
    score = 50.0
    reasons = []

    if asset_type == "stock":
        # P/E ratio: ideal range 10-25 for value stocks
        pe = info.get("pe_ratio")
        if pe is not None and pe > 0:
            if pe < 10:
                score += 5  # Very cheap but may be value trap
                reasons.append(f"P/E muy bajo {pe:.1f} — posible value trap (+5)")
            elif pe <= 25:
                score += 20
                reasons.append(f"P/E razonable {pe:.1f} (+20)")
            elif pe <= 40:
                score -= 5
                reasons.append(f"P/E elevado {pe:.1f} (-5)")
            else:
                score -= 20
                reasons.append(f"P/E muy alto {pe:.1f} — acción cara (-20)")

        # Earnings growth
        eg = info.get("earnings_growth")
        if eg is not None:
            if eg > 0.20:
                score += 20
                reasons.append(f"Crecimiento EPS fuerte {eg*100:.1f}% (+20)")
            elif eg > 0.05:
                score += 10
                reasons.append(f"Crecimiento EPS moderado {eg*100:.1f}% (+10)")
            elif eg < 0:
                score -= 20
                reasons.append(f"Caída de EPS {eg*100:.1f}% (-20)")

        # Debt-to-equity: <1 = healthy, >2 = risky
        de = info.get("debt_to_equity")
        if de is not None and de >= 0:
            if de < 50:  # Yahoo reports as %, effectively 0.5x
                score += 15
                reasons.append(f"Deuda saludable D/E={de:.1f} (+15)")
            elif de < 150:
                score -= 5
                reasons.append(f"Deuda moderada D/E={de:.1f} (-5)")
            else:
                score -= 20
                reasons.append(f"Alta deuda D/E={de:.1f} (-20)")

        # Profit margins
        pm = info.get("profit_margins")
        if pm is not None:
            if pm > 0.20:
                score += 10
                reasons.append(f"Margen neto excelente {pm*100:.1f}% (+10)")
            elif pm > 0.05:
                score += 5
                reasons.append(f"Margen neto positivo {pm*100:.1f}% (+5)")
            elif pm < 0:
                score -= 15
                reasons.append(f"Pérdidas netas {pm*100:.1f}% (-15)")

    elif asset_type in ("crypto", "etf"):
        # Use volume/market cap as liquidity score
        mc = info.get("market_cap", 0)
        if mc and mc > 1e11:
            score += 25
            reasons.append("Market cap > $100B — muy líquido (+25)")
        elif mc and mc > 1e9:
            score += 15
            reasons.append("Market cap > $1B (+15)")
        elif mc and mc < 1e8:
            score -= 20
            reasons.append("Market cap bajo — mayor riesgo de liquidez (-20)")

    if not reasons:
        reasons.append("Sin datos fundamentales disponibles (neutral)")

    return {
        "score": round(max(0, min(100, score)), 1),
        "weight": 0.25,
        "label": "Fundamentals",
        "reasons": reasons,
    }


# ─────────────────────────────────────────────
# Composite Score
# ─────────────────────────────────────────────

def compute_investment_score(df: pd.DataFrame, info: dict) -> dict:
    """
    Main entry point: compute the weighted Investment Score (0–100).

    Weights:
      Trend        30%
      Momentum     25%
      Risk         20%
      Fundamentals 25%

    Returns the total score, component scores, and explanation.
    """
    asset_type = info.get("asset_type", "stock")

    trend = score_trend(df)
    momentum = score_momentum(df)
    risk = score_risk(df)
    fundamentals = score_fundamentals(info, asset_type)

    # Weighted sum
    total = (
        trend["score"] * trend["weight"]
        + momentum["score"] * momentum["weight"]
        + risk["score"] * risk["weight"]
        + fundamentals["score"] * fundamentals["weight"]
    )
    total = round(total, 1)

    # Label
    if total >= 75:
        label = "Muy atractivo"
        color = "green"
    elif total >= 60:
        label = "Atractivo"
        color = "teal"
    elif total >= 45:
        label = "Neutral"
        color = "yellow"
    elif total >= 30:
        label = "Precaución"
        color = "orange"
    else:
        label = "Alto riesgo"
        color = "red"

    return {
        "total": total,
        "label": label,
        "color": color,
        "components": [trend, momentum, risk, fundamentals],
        "disclaimer": "Este score es educativo y no constituye asesoramiento financiero.",
    }
