"""
ML Classification Service
Trains a RandomForest classifier to generate BUY / HOLD / SELL signals
based on technical indicator features.

Approach:
- Features: RSI, MACD histogram, BB %B, SMA ratio, volume z-score, ATR ratio
- Labels: generated from 5-day forward return (buy >2%, sell <-2%, hold otherwise)
- Model: RandomForestClassifier (robust, interpretable)
- Training: on-the-fly from yfinance historical data (no pre-stored model)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator
from ta.volatility import BollingerBands, AverageTrueRange
import warnings
warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────
# Feature Engineering
# ─────────────────────────────────────────────

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create the feature matrix from OHLCV data.
    All features are ratios or bounded indicators to make them
    asset-agnostic (works for stocks, ETFs, and crypto equally).
    """
    feat = pd.DataFrame(index=df.index)
    close = df["close"]
    volume = df["volume"]

    # RSI (bounded 0-100)
    feat["rsi"] = RSIIndicator(close=close, window=14).rsi()

    # MACD histogram (trend of momentum)
    macd_obj = MACD(close=close, window_fast=12, window_slow=26, window_sign=9)
    feat["macd_hist"] = macd_obj.macd_diff()
    feat["macd_signal_cross"] = (macd_obj.macd() - macd_obj.macd_signal())

    # Bollinger %B (0 = lower band, 1 = upper band)
    bb = BollingerBands(close=close, window=20, window_dev=2)
    feat["bb_pct_b"] = bb.bollinger_pband()
    feat["bb_bandwidth"] = bb.bollinger_wband()

    # SMA ratios — price relative to moving averages
    sma20 = SMAIndicator(close=close, window=20).sma_indicator()
    sma50 = SMAIndicator(close=close, window=50).sma_indicator()
    feat["price_sma20_ratio"] = close / sma20 - 1
    feat["price_sma50_ratio"] = close / sma50 - 1
    feat["sma20_sma50_ratio"] = sma20 / sma50 - 1

    # ATR ratio (volatility as % of price)
    atr = AverageTrueRange(high=df["high"], low=df["low"], close=close, window=14).average_true_range()
    feat["atr_ratio"] = atr / close

    # Volume z-score (anomaly detection)
    vol_mean = volume.rolling(20).mean()
    vol_std = volume.rolling(20).std()
    feat["volume_zscore"] = (volume - vol_mean) / (vol_std + 1e-9)

    # Price momentum (5-day return)
    feat["momentum_5d"] = close.pct_change(5)
    feat["momentum_20d"] = close.pct_change(20)

    # Return cleanup
    feat = feat.replace([np.inf, -np.inf], np.nan)
    feat = feat.ffill().dropna()

    return feat


def create_labels(df: pd.DataFrame, forward_days: int = 5,
                  buy_threshold: float = 0.02, sell_threshold: float = -0.02) -> pd.Series:
    """
    Generate training labels from future returns.
    - BUY (2): forward return > +2%
    - SELL (0): forward return < -2%
    - HOLD (1): everything else

    ⚠️ Labels are only for training — they look into the future.
    At inference time, only historical features are used.
    """
    future_return = df["close"].pct_change(forward_days).shift(-forward_days)
    labels = pd.Series(1, index=df.index)  # Default: HOLD
    labels[future_return > buy_threshold] = 2     # BUY
    labels[future_return < sell_threshold] = 0    # SELL
    return labels


# ─────────────────────────────────────────────
# Model Training & Inference
# ─────────────────────────────────────────────

def train_and_predict(df: pd.DataFrame) -> dict:
    """
    Train a RandomForestClassifier on historical data and predict the
    current signal (last row of features).

    Uses TimeSeriesSplit to avoid data leakage during validation.
    Returns: signal, confidence, probability breakdown, feature importance.
    """
    if len(df) < 200:
        return {
            "signal": "HOLD",
            "confidence": 0,
            "probabilities": {"BUY": 0.33, "HOLD": 0.34, "SELL": 0.33},
            "note": "Datos insuficientes para el modelo ML (mínimo 200 velas).",
            "feature_importance": {},
        }

    features = build_features(df)
    labels = create_labels(df).reindex(features.index).dropna()

    # Align features and labels
    common_idx = features.index.intersection(labels.index)
    # Exclude last few rows (no future return available for labeling)
    train_idx = common_idx[:-10]

    X = features.loc[train_idx].values
    y = labels.loc[train_idx].values

    if len(X) < 100:
        return {
            "signal": "HOLD",
            "confidence": 0,
            "probabilities": {"BUY": 0.33, "HOLD": 0.34, "SELL": 0.33},
            "note": "Datos insuficientes después de filtrar.",
            "feature_importance": {},
        }

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_leaf=10,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    model.fit(X_scaled, y)

    # Estimate accuracy via walk-forward validation (time-series aware)
    tscv = TimeSeriesSplit(n_splits=3)
    scores = []
    for train_ix, val_ix in tscv.split(X_scaled):
        model_cv = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42, n_jobs=-1)
        model_cv.fit(X_scaled[train_ix], y[train_ix])
        pred = model_cv.predict(X_scaled[val_ix])
        scores.append(accuracy_score(y[val_ix], pred))
    cv_accuracy = round(float(np.mean(scores)), 3)

    # Predict on latest bar
    X_latest = features.iloc[[-1]].values
    X_latest_scaled = scaler.transform(X_latest)
    proba = model.predict_proba(X_latest_scaled)[0]
    classes = model.classes_

    # Map to label names
    class_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
    proba_dict = {class_map.get(c, str(c)): round(float(p), 3) for c, p in zip(classes, proba)}

    predicted_class = classes[np.argmax(proba)]
    signal = class_map.get(predicted_class, "HOLD")
    confidence = round(float(np.max(proba)) * 100, 1)

    # Feature importance
    importance = {
        name: round(float(imp), 4)
        for name, imp in zip(features.columns, model.feature_importances_)
    }
    importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True)[:6])

    return {
        "signal": signal,
        "signal_label": {"BUY": "Comprar", "HOLD": "Mantener", "SELL": "Vender"}.get(signal, signal),
        "confidence": confidence,
        "probabilities": proba_dict,
        "cv_accuracy": cv_accuracy,
        "feature_importance": importance,
        "disclaimer": "Modelo ML educativo. No usar como señal de trading real.",
    }
