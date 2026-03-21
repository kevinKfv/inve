"""
Backtesting Engine
Tests trading strategies against historical OHLCV data.
Currently supports:
  1. SMA Crossover (fast/slow MA)
  2. RSI Mean Reversion (buy oversold, sell overbought)

Returns equity curve, trade log, Sharpe, max drawdown, win rate.
"""

import numpy as np
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator


# ─────────────────────────────────────────────
# Strategies
# ─────────────────────────────────────────────

def sma_crossover_strategy(df: pd.DataFrame, fast: int = 20, slow: int = 50) -> pd.Series:
    """
    Simple SMA crossover:
    - BUY when fast SMA crosses above slow SMA
    - SELL when fast SMA crosses below slow SMA
    Returns a Series of positions: 1 (long) or 0 (flat)
    """
    sma_fast = SMAIndicator(close=df["close"], window=fast).sma_indicator()
    sma_slow = SMAIndicator(close=df["close"], window=slow).sma_indicator()

    signal = pd.Series(0, index=df.index)
    signal[sma_fast > sma_slow] = 1

    # Avoid look-ahead bias: shift by 1 (act next candle)
    return signal.shift(1).fillna(0)


def rsi_mean_reversion_strategy(df: pd.DataFrame,
                                 oversold: int = 30, overbought: int = 70) -> pd.Series:
    """
    RSI Mean Reversion:
    - BUY when RSI crosses below `oversold`
    - SELL (exit) when RSI crosses above `overbought`
    Returns a Series of positions: 1 (long) or 0 (flat)
    """
    rsi = RSIIndicator(close=df["close"], window=14).rsi()

    position = pd.Series(0.0, index=df.index)
    in_trade = False

    for i in range(len(rsi)):
        if pd.isna(rsi.iloc[i]):
            continue
        if not in_trade and rsi.iloc[i] < oversold:
            in_trade = True
        elif in_trade and rsi.iloc[i] > overbought:
            in_trade = False
        position.iloc[i] = 1 if in_trade else 0

    return position.shift(1).fillna(0)


# ─────────────────────────────────────────────
# Backtest Runner
# ─────────────────────────────────────────────

def run_backtest(df: pd.DataFrame, strategy: str = "sma_crossover",
                 params: dict = None, initial_capital: float = 10_000) -> dict:
    """
    Run a backtest on the given DataFrame.
    Returns performance metrics and equity curve.

    strategy: "sma_crossover" or "rsi_mean_reversion"
    params: strategy-specific parameters
    """
    if params is None:
        params = {}

    if len(df) < 100:
        raise ValueError("Se necesitan al menos 100 velas para backtest.")

    # Select strategy
    if strategy == "sma_crossover":
        fast = params.get("fast", 20)
        slow = params.get("slow", 50)
        positions = sma_crossover_strategy(df, fast=fast, slow=slow)
        strategy_name = f"SMA Crossover ({fast}/{slow})"
        strategy_description = (
            f"Compra cuando SMA{fast} cruza sobre SMA{slow}. "
            f"Vende cuando SMA{fast} cae bajo SMA{slow}."
        )
    elif strategy == "rsi_mean_reversion":
        oversold = params.get("oversold", 30)
        overbought = params.get("overbought", 70)
        positions = rsi_mean_reversion_strategy(df, oversold=oversold, overbought=overbought)
        strategy_name = f"RSI Mean Reversion ({oversold}/{overbought})"
        strategy_description = (
            f"Compra cuando RSI < {oversold} (sobrevendido). "
            f"Vende cuando RSI > {overbought} (sobrecomprado)."
        )
    else:
        raise ValueError(f"Estrategia desconocida: {strategy}")

    # Calculate returns
    daily_returns = df["close"].pct_change().fillna(0)
    strategy_returns = positions * daily_returns

    # Equity curve
    equity = (1 + strategy_returns).cumprod() * initial_capital
    buy_hold = (1 + daily_returns).cumprod() * initial_capital

    # ── Performance Metrics ──────────────────
    total_return = float((equity.iloc[-1] / initial_capital - 1) * 100)
    bh_return = float((buy_hold.iloc[-1] / initial_capital - 1) * 100)

    trading_days = 252
    annual_return = float(strategy_returns.mean() * trading_days * 100)
    annual_vol = float(strategy_returns.std() * np.sqrt(trading_days) * 100)
    sharpe = round((annual_return / 100 - 0.045) / (annual_vol / 100), 3) if annual_vol > 0 else 0

    # Drawdown
    rolling_max = equity.cummax()
    drawdown = (equity - rolling_max) / rolling_max
    max_dd = float(drawdown.min() * 100)

    # Trade log
    trades = _extract_trades(positions, df["close"], daily_returns)
    win_rate = round(sum(1 for t in trades if t["pnl_pct"] > 0) / len(trades) * 100, 1) if trades else 0

    # Serialize equity curve for chart
    equity_curve = [
        {"time": int(ts.timestamp()), "value": round(float(v), 2)}
        for ts, v in equity.items()
        if not pd.isna(v)
    ]
    drawdown_curve = [
        {"time": int(ts.timestamp()), "value": round(float(v) * 100, 2)}
        for ts, v in drawdown.items()
        if not pd.isna(v)
    ]
    buy_hold_curve = [
        {"time": int(ts.timestamp()), "value": round(float(v), 2)}
        for ts, v in buy_hold.items()
        if not pd.isna(v)
    ]

    return {
        "strategy": strategy_name,
        "description": strategy_description,
        "params": params,
        "initial_capital": initial_capital,
        "metrics": {
            "total_return_pct": round(total_return, 2),
            "buy_hold_return_pct": round(bh_return, 2),
            "annual_return_pct": round(annual_return, 2),
            "annual_volatility_pct": round(annual_vol, 2),
            "sharpe_ratio": sharpe,
            "max_drawdown_pct": round(max_dd, 2),
            "win_rate_pct": win_rate,
            "total_trades": len(trades),
        },
        "equity_curve": equity_curve,
        "drawdown_curve": drawdown_curve,
        "buy_hold_curve": buy_hold_curve,
        "trades": trades[-20:],  # Last 20 trades
    }


# ─────────────────────────────────────────────
# Trade Extraction
# ─────────────────────────────────────────────

def _extract_trades(positions: pd.Series, prices: pd.Series, returns: pd.Series) -> list:
    """Extract individual trades from position series."""
    trades = []
    in_trade = False
    entry_price = 0.0
    entry_date = None

    for i in range(len(positions)):
        pos = positions.iloc[i]
        price = prices.iloc[i]
        date = positions.index[i]

        if pos == 1 and not in_trade:
            in_trade = True
            entry_price = price
            entry_date = date
        elif pos == 0 and in_trade:
            in_trade = False
            exit_price = price
            pnl_pct = round((exit_price - entry_price) / entry_price * 100, 2)
            trades.append({
                "entry_date": str(entry_date.date()),
                "exit_date": str(date.date()),
                "entry_price": round(float(entry_price), 4),
                "exit_price": round(float(exit_price), 4),
                "pnl_pct": pnl_pct,
                "result": "WIN" if pnl_pct > 0 else "LOSS",
            })

    return trades
