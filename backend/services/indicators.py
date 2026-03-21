"""
Technical Indicators Service
Implements RSI, MACD, Bollinger Bands, SMA, EMA, ATR, and support/resistance.
Uses the `ta` library for efficient, vectorized calculations.
All functions accept a pandas DataFrame with OHLCV columns (open, high, low, close, volume).
"""

import pandas as pd
import numpy as np
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import MACD, SMAIndicator, EMAIndicator, ADXIndicator
from ta.volatility import BollingerBands, AverageTrueRange
from ta.volume import OnBalanceVolumeIndicator


# ─────────────────────────────────────────────
# Individual Indicators
# ─────────────────────────────────────────────

def compute_rsi(df: pd.DataFrame, window: int = 14) -> pd.Series:
    """
    Relative Strength Index (RSI).
    - RSI < 30  → Oversold (potential BUY signal)
    - RSI > 70  → Overbought (potential SELL signal)
    - RSI 30-70 → Neutral
    """
    return RSIIndicator(close=df["close"], window=window).rsi()


def compute_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
    """
    Moving Average Convergence Divergence (MACD).
    Returns MACD line, signal line, and histogram.
    - MACD > signal → Bullish momentum
    - MACD < signal → Bearish momentum
    - Histogram crossing zero → momentum shift
    """
    macd_obj = MACD(
        close=df["close"], window_fast=fast, window_slow=slow, window_sign=signal
    )
    return {
        "macd": macd_obj.macd(),
        "signal": macd_obj.macd_signal(),
        "histogram": macd_obj.macd_diff(),
    }


def compute_bollinger(df: pd.DataFrame, window: int = 20, std: float = 2.0) -> dict:
    """
    Bollinger Bands: SMA ± (std_dev * N).
    - Price touches lower band → Oversold
    - Price touches upper band → Overbought
    - Band squeeze → Volatility contraction (breakout incoming)
    - %B = (price - lower) / (upper - lower)  [0..1 range, >1 or <0 = extreme]
    """
    bb = BollingerBands(close=df["close"], window=window, window_dev=std)
    return {
        "upper": bb.bollinger_hband(),
        "middle": bb.bollinger_mavg(),
        "lower": bb.bollinger_lband(),
        "pct_b": bb.bollinger_pband(),       # %B indicator
        "bandwidth": bb.bollinger_wband(),   # Band width (volatility proxy)
    }


def compute_sma(df: pd.DataFrame, windows: list[int] = [20, 50, 200]) -> dict:
    """
    Simple Moving Averages for multiple periods.
    - Price > SMA200 → Long-term uptrend
    - SMA50 > SMA200 → Golden cross (bullish)
    - SMA50 < SMA200 → Death cross (bearish)
    """
    result = {}
    for w in windows:
        if len(df) >= w:
            result[f"sma{w}"] = SMAIndicator(close=df["close"], window=w).sma_indicator()
        else:
            result[f"sma{w}"] = pd.Series([None] * len(df), index=df.index)
    return result


def compute_ema(df: pd.DataFrame, windows: list[int] = [9, 21, 55]) -> dict:
    """
    Exponential Moving Averages — more weight on recent prices.
    Often used for shorter-term trend confirmation.
    """
    result = {}
    for w in windows:
        if len(df) >= w:
            result[f"ema{w}"] = EMAIndicator(close=df["close"], window=w).ema_indicator()
        else:
            result[f"ema{w}"] = pd.Series([None] * len(df), index=df.index)
    return result


def compute_atr(df: pd.DataFrame, window: int = 14) -> pd.Series:
    """
    Average True Range — measures volatility.
    Used for stop-loss placement: SL = price - (ATR * multiplier)
    """
    return AverageTrueRange(
        high=df["high"], low=df["low"], close=df["close"], window=window
    ).average_true_range()


def compute_adx(df: pd.DataFrame, window: int = 14) -> pd.Series:
    """
    Average Directional Index — measures trend strength (not direction).
    ADX < 25 → Weak/no trend
    ADX > 25 → Trending market
    ADX > 50 → Strong trend
    """
    return ADXIndicator(
        high=df["high"], low=df["low"], close=df["close"], window=window
    ).adx()


def compute_obv(df: pd.DataFrame) -> pd.Series:
    """
    On Balance Volume — volume trend confirmator.
    Rising OBV + rising price → confirmed uptrend
    Rising OBV + falling price → potential reversal up
    """
    return OnBalanceVolumeIndicator(
        close=df["close"], volume=df["volume"]
    ).on_balance_volume()


# ─────────────────────────────────────────────
# Support & Resistance Detection
# ─────────────────────────────────────────────

def compute_support_resistance(df: pd.DataFrame, window: int = 20, n_levels: int = 5) -> dict:
    """
    Detect support and resistance levels using local extrema.
    Looks for pivot highs and pivot lows over a rolling window.
    Returns the N most significant levels sorted by recency.
    """
    highs = df["high"].values
    lows = df["low"].values
    prices = df["close"].values
    current_price = prices[-1]

    pivot_highs = []
    pivot_lows = []

    for i in range(window, len(df) - window):
        # Pivot high: candle with highest high in window
        if highs[i] == max(highs[i - window : i + window + 1]):
            pivot_highs.append(round(float(highs[i]), 4))
        # Pivot low: candle with lowest low in window
        if lows[i] == min(lows[i - window : i + window + 1]):
            pivot_lows.append(round(float(lows[i]), 4))

    # Cluster nearby levels (within 0.5% of each other)
    def cluster_levels(levels: list, tolerance: float = 0.005) -> list:
        if not levels:
            return []
        levels = sorted(set(levels))
        clustered = [levels[0]]
        for lvl in levels[1:]:
            if abs(lvl - clustered[-1]) / clustered[-1] > tolerance:
                clustered.append(lvl)
        return clustered

    resistance = [l for l in cluster_levels(pivot_highs) if l > current_price]
    support = [l for l in cluster_levels(pivot_lows) if l < current_price]

    return {
        "resistance": sorted(resistance)[:n_levels],
        "support": sorted(support, reverse=True)[:n_levels],
    }


# ─────────────────────────────────────────────
# Signal Generation
# ─────────────────────────────────────────────

def generate_signals(df: pd.DataFrame) -> dict:
    """
    Combine all indicators and produce human-readable trading signals.
    Returns a dict with signal labels and their triggering conditions.
    """
    rsi = compute_rsi(df)
    macd_data = compute_macd(df)
    bb_data = compute_bollinger(df)
    sma_data = compute_sma(df, [20, 50, 200])
    adx = compute_adx(df)

    # Get latest values (last non-NaN)
    last_rsi = _last_valid(rsi)
    last_macd = _last_valid(macd_data["macd"])
    last_signal = _last_valid(macd_data["signal"])
    last_hist = _last_valid(macd_data["histogram"])
    last_pct_b = _last_valid(bb_data["pct_b"])
    last_bw = _last_valid(bb_data["bandwidth"])
    last_adx = _last_valid(adx)
    last_price = float(df["close"].iloc[-1])
    last_sma50 = _last_valid(sma_data.get("sma50"))
    last_sma200 = _last_valid(sma_data.get("sma200"))

    signals = []

    # ── RSI signals ──────────────────────────
    if last_rsi is not None:
        if last_rsi < 30:
            signals.append({
                "type": "RSI_OVERSOLD",
                "label": "Sobrevendido (RSI)",
                "description": f"RSI en {last_rsi:.1f} — asset potencialmente sobrevendido. Posible rebote.",
                "sentiment": "bullish",
                "strength": "fuerte" if last_rsi < 20 else "moderado",
            })
        elif last_rsi > 70:
            signals.append({
                "type": "RSI_OVERBOUGHT",
                "label": "Sobrecomprado (RSI)",
                "description": f"RSI en {last_rsi:.1f} — asset potencialmente sobrecomprado. Considerar salida.",
                "sentiment": "bearish",
                "strength": "fuerte" if last_rsi > 80 else "moderado",
            })

    # ── MACD signals ─────────────────────────
    if last_hist is not None and last_macd is not None and last_signal is not None:
        if last_macd > last_signal and last_hist > 0:
            signals.append({
                "type": "MACD_BULLISH",
                "label": "MACD Cruce Alcista",
                "description": "MACD por encima de la línea de señal. Momentum positivo.",
                "sentiment": "bullish",
                "strength": "moderado",
            })
        elif last_macd < last_signal and last_hist < 0:
            signals.append({
                "type": "MACD_BEARISH",
                "label": "MACD Cruce Bajista",
                "description": "MACD por debajo de la línea de señal. Momentum negativo.",
                "sentiment": "bearish",
                "strength": "moderado",
            })

    # ── Bollinger Band signals ────────────────
    if last_pct_b is not None:
        if last_pct_b < 0.05:
            signals.append({
                "type": "BB_LOWER_TOUCH",
                "label": "Toca Banda Inferior (BB)",
                "description": "Precio cerca de la banda inferior de Bollinger. Posible rebote.",
                "sentiment": "bullish",
                "strength": "moderado",
            })
        elif last_pct_b > 0.95:
            signals.append({
                "type": "BB_UPPER_TOUCH",
                "label": "Toca Banda Superior (BB)",
                "description": "Precio cerca de la banda superior de Bollinger. Posible corrección.",
                "sentiment": "bearish",
                "strength": "moderado",
            })

    # ── Bollinger Squeeze ────────────────────
    if last_bw is not None:
        avg_bw = bb_data["bandwidth"].rolling(50).mean().iloc[-1]
        if not pd.isna(avg_bw) and last_bw < avg_bw * 0.6:
            signals.append({
                "type": "BB_SQUEEZE",
                "label": "Compresión de Volatilidad (BB Squeeze)",
                "description": "Las Bandas de Bollinger están muy comprimidas. Se aproxima una ruptura (dirección incierta).",
                "sentiment": "neutral",
                "strength": "fuerte",
            })

    # ── Moving Average signals ────────────────
    if last_sma50 and last_sma200:
        if last_sma50 > last_sma200:
            signals.append({
                "type": "GOLDEN_CROSS",
                "label": "Golden Cross (SMA50 > SMA200)",
                "description": "La media de 50 sesiones está por encima de la de 200. Tendencia alcista de largo plazo.",
                "sentiment": "bullish",
                "strength": "fuerte",
            })
        else:
            signals.append({
                "type": "DEATH_CROSS",
                "label": "Death Cross (SMA50 < SMA200)",
                "description": "La media de 50 sesiones está por debajo de la de 200. Tendencia bajista de largo plazo.",
                "sentiment": "bearish",
                "strength": "fuerte",
            })

    # ── ADX trend strength ───────────────────
    if last_adx is not None:
        if last_adx > 25:
            signals.append({
                "type": "STRONG_TREND",
                "label": "Tendencia Fuerte (ADX)",
                "description": f"ADX en {last_adx:.1f} — mercado en tendencia definida.",
                "sentiment": "neutral",
                "strength": "fuerte",
            })

    if not signals:
        signals.append({
            "type": "NEUTRAL",
            "label": "Sin señal clara",
            "description": "Los indicadores no muestran una señal fuerte en este momento.",
            "sentiment": "neutral",
            "strength": "débil",
        })

    return {
        "signals": signals,
        "summary": _build_summary(signals),
        "dominant_sentiment": _dominant_sentiment(signals),
    }


def _last_valid(series) -> float | None:
    """Return the last non-NaN value from a pandas Series."""
    if series is None:
        return None
    valid = series.dropna()
    return float(valid.iloc[-1]) if not valid.empty else None


def _build_summary(signals: list) -> str:
    bullish = sum(1 for s in signals if s["sentiment"] == "bullish")
    bearish = sum(1 for s in signals if s["sentiment"] == "bearish")
    if bullish > bearish:
        return "Tendencia alcista predominante"
    elif bearish > bullish:
        return "Tendencia bajista predominante"
    return "Mercado lateral o sin dirección clara"


def _dominant_sentiment(signals: list) -> str:
    counts = {"bullish": 0, "bearish": 0, "neutral": 0}
    for s in signals:
        counts[s["sentiment"]] += 1
    return max(counts, key=counts.get)


# ─────────────────────────────────────────────
# Full Indicators Snapshot (for API response)
# ─────────────────────────────────────────────

def get_indicators_snapshot(df: pd.DataFrame) -> dict:
    """
    Compute all indicators and return latest values as a dict.
    This is what gets served to the frontend for the indicator panel.
    """
    rsi_series = compute_rsi(df)
    macd_d = compute_macd(df)
    bb_d = compute_bollinger(df)
    sma_d = compute_sma(df, [20, 50, 200])
    ema_d = compute_ema(df, [9, 21])
    atr_s = compute_atr(df)
    adx_s = compute_adx(df)
    obv_s = compute_obv(df)
    sr = compute_support_resistance(df)
    signals = generate_signals(df)

    return {
        "rsi": _last_valid(rsi_series),
        "macd": {
            "macd": _last_valid(macd_d["macd"]),
            "signal": _last_valid(macd_d["signal"]),
            "histogram": _last_valid(macd_d["histogram"]),
        },
        "bollinger": {
            "upper": _last_valid(bb_d["upper"]),
            "middle": _last_valid(bb_d["middle"]),
            "lower": _last_valid(bb_d["lower"]),
            "pct_b": _last_valid(bb_d["pct_b"]),
            "bandwidth": _last_valid(bb_d["bandwidth"]),
        },
        "moving_averages": {
            "sma20": _last_valid(sma_d.get("sma20")),
            "sma50": _last_valid(sma_d.get("sma50")),
            "sma200": _last_valid(sma_d.get("sma200")),
            "ema9": _last_valid(ema_d.get("ema9")),
            "ema21": _last_valid(ema_d.get("ema21")),
        },
        "atr": _last_valid(atr_s),
        "adx": _last_valid(adx_s),
        "obv": _last_valid(obv_s),
        "support_resistance": sr,
        "signals": signals,
    }
