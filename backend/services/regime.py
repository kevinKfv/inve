"""
Market Regime Detection Service
Detects whether the market is in a BULL or BEAR regime using:
1. SMA crossover method (SMA50 vs SMA200)
2. Trend filter with ADX
3. VIX-proxy via rolling volatility
"""

import numpy as np
import pandas as pd
from services.indicators import compute_sma, compute_adx, _last_valid


def detect_regime(df: pd.DataFrame) -> dict:
    """
    Classify current market regime.

    Returns:
      - regime: "bull" | "bear" | "sideways"
      - confidence: 0.0 - 1.0
      - signals: list of contributing factors
    """
    if len(df) < 50:
        return {"regime": "unknown", "confidence": 0, "signals": ["Insufficient data"]}

    price = float(df["close"].iloc[-1])
    sma_data = compute_sma(df, [20, 50, 200])
    adx_val = _last_valid(compute_adx(df))

    sma20 = _last_valid(sma_data.get("sma20"))
    sma50 = _last_valid(sma_data.get("sma50"))
    sma200 = _last_valid(sma_data.get("sma200"))

    bullish_signals = []
    bearish_signals = []

    # Signal 1: Price vs SMA200 (primary regime filter)
    if sma200 and price > sma200:
        bullish_signals.append("Precio > SMA200 (tendencia larga alcista)")
    elif sma200:
        bearish_signals.append("Precio < SMA200 (tendencia larga bajista)")

    # Signal 2: SMA50 vs SMA200 (Golden/Death cross)
    if sma50 and sma200:
        if sma50 > sma200:
            bullish_signals.append("SMA50 > SMA200 (Golden Cross confirmado)")
        else:
            bearish_signals.append("SMA50 < SMA200 (Death Cross confirmado)")

    # Signal 3: Price vs SMA50
    if sma50:
        if price > sma50:
            bullish_signals.append("Precio > SMA50")
        else:
            bearish_signals.append("Precio < SMA50")

    # Signal 4: Rolling volatility as bear proxy
    returns = df["close"].pct_change().dropna()
    rolling_vol = returns.rolling(20).std().iloc[-1] * np.sqrt(252)
    hist_vol = returns.std() * np.sqrt(252)
    if rolling_vol > hist_vol * 1.5:
        bearish_signals.append(f"Volatilidad elevada ({rolling_vol*100:.1f}%  > histórica {hist_vol*100:.1f}%)")
    elif rolling_vol < hist_vol * 0.8:
        bullish_signals.append(f"Volatilidad baja ({rolling_vol*100:.1f}%) — mercado calmo")

    # Signal 5: ADX (trend strength)
    if adx_val and adx_val > 25:
        trend_str = "Tendencia fuerte"
    elif adx_val:
        trend_str = "Tendencia débil o lateral"
    else:
        trend_str = "ADX no disponible"

    # Determine regime
    b_count = len(bullish_signals)
    be_count = len(bearish_signals)
    total = b_count + be_count

    confidence = round(max(b_count, be_count) / total, 2) if total > 0 else 0.5

    if b_count > be_count:
        regime = "bull"
        label = "Mercado Alcista (Bull)"
        color = "#00d4aa"
        emoji = "🟢"
    elif be_count > b_count:
        regime = "bear"
        label = "Mercado Bajista (Bear)"
        color = "#ff4757"
        emoji = "🔴"
    else:
        regime = "sideways"
        label = "Mercado Lateral (Sideways)"
        color = "#ffa502"
        emoji = "🟡"

    return {
        "regime": regime,
        "label": label,
        "color": color,
        "emoji": emoji,
        "confidence": confidence,
        "confidence_pct": round(confidence * 100, 1),
        "bullish_factors": bullish_signals,
        "bearish_factors": bearish_signals,
        "trend_strength": trend_str,
        "volatility": {
            "current": round(float(rolling_vol) * 100, 2),
            "historical": round(float(hist_vol) * 100, 2),
        },
    }
