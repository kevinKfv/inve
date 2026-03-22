"""
Portfolio Optimization Service
Implements Modern Portfolio Theory (Markowitz) with:
  - Efficient frontier calculation
  - Maximum Sharpe Ratio portfolio
  - Minimum Volatility portfolio
  - Correlation matrix
  - Portfolio Sharpe and Sortino Ratios
"""

import numpy as np
import pandas as pd
from services.market_data import get_ohlcv


# ─────────────────────────────────────────────
# Data Preparation
# ─────────────────────────────────────────────

def get_returns(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    """
    Fetch daily closing prices for all tickers and compute log returns.
    Log returns are preferred in MPT for their mathematical properties.
    """
    dfs = {}
    for ticker in tickers:
        try:
            df = get_ohlcv(ticker, period=period, interval="1d")
            # Strip time and timezone for reliable alignment across asset classes
            series = df["close"].copy()
            series.index = pd.to_datetime(series.index).normalize().tz_localize(None)
            series = series[~series.index.duplicated(keep='last')]
            dfs[ticker] = series
        except Exception:
            pass  # Skip unavailable tickers

    if not dfs:
        raise ValueError("No se pudo obtener datos para ningún ticker.")

    # Forward fill to handle missing days (e.g. weekends for stocks when mixed with crypto), then dropna
    prices = pd.DataFrame(dfs)
    prices = prices.ffill().dropna()
    
    returns = np.log(prices / prices.shift(1)).dropna()
    return returns


# ─────────────────────────────────────────────
# Portfolio Statistics
# ─────────────────────────────────────────────

def portfolio_stats(weights: np.ndarray, mean_returns: np.ndarray, cov_matrix: np.ndarray, 
                    trading_days: int = 252) -> tuple:
    """
    Calculate annualized portfolio return, volatility, and Sharpe ratio.
    weights: array of weights summing to 1
    risk_free_rate: approximated at 4.5% (US Treasuries 2024)
    """
    RISK_FREE = 0.045 / trading_days  # Daily risk-free rate

    port_return = np.dot(weights, mean_returns) * trading_days
    port_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix * trading_days, weights)))
    sharpe = (port_return - RISK_FREE * trading_days) / port_volatility if port_volatility > 0 else 0

    return float(port_return), float(port_volatility), float(sharpe)


def sortino_ratio(weights: np.ndarray, returns: pd.DataFrame, trading_days: int = 252) -> float:
    """
    Sortino Ratio: like Sharpe but only penalizes downside volatility.
    Higher Sortino = better risk-adjusted return on the downside.
    """
    RISK_FREE = 0.045
    port_returns = returns.dot(weights) * trading_days
    annual_return = port_returns.mean() * trading_days
    downside = port_returns[port_returns < 0]
    downside_std = downside.std() * np.sqrt(trading_days)
    if downside_std == 0:
        return 0
    return float((annual_return - RISK_FREE) / downside_std)


# ─────────────────────────────────────────────
# Efficient Frontier
# ─────────────────────────────────────────────

def efficient_frontier(tickers: list[str], n_portfolios: int = 300, period: str = "2y") -> dict:
    """
    Compute the efficient frontier using Monte Carlo simulation + optimization.

    Returns:
    - frontier: list of {return, volatility, sharpe, weights} for each portfolio
    - max_sharpe: optimal portfolio for best risk-adjusted return
    - min_vol: optimal portfolio for minimum volatility
    - correlation: correlation matrix between assets
    """
    returns = get_returns(tickers, period)
    available = list(returns.columns)
    n = len(available)

    if n < 2:
        raise ValueError("Se necesitan al menos 2 activos con datos disponibles.")

    mean_returns = returns.mean().values
    cov_matrix = returns.cov().values
    trading_days = 252

    # ── Monte Carlo: random portfolios ──────
    np.random.seed(42)
    frontier = []
    for _ in range(n_portfolios):
        w = np.random.dirichlet(np.ones(n))
        ret, vol, sharpe = portfolio_stats(w, mean_returns, cov_matrix, trading_days)
        frontier.append({
            "return": round(ret * 100, 2),        # As percentage
            "volatility": round(vol * 100, 2),
            "sharpe": round(sharpe, 3),
            "weights": {t: round(float(w[i]), 4) for i, t in enumerate(available)},
        })

    # ── Optimization: Maximum Sharpe (pure numpy) ─
    def _optimize(objective_fn, n_assets: int, n_iter: int = 2000, lr: float = 0.01) -> np.ndarray:
        """
        Projected gradient descent optimizer.
        Minimizes objective_fn(w) subject to w >= 0 and sum(w) == 1.
        No scipy required.
        """
        w = np.ones(n_assets) / n_assets
        best_w = w.copy()
        best_val = objective_fn(w)

        for _ in range(n_iter):
            # Numerical gradient
            grad = np.zeros(n_assets)
            eps = 1e-5
            for j in range(n_assets):
                wf = w.copy(); wf[j] += eps
                wb = w.copy(); wb[j] -= eps
                grad[j] = (objective_fn(wf) - objective_fn(wb)) / (2 * eps)

            w = w - lr * grad
            # Project onto simplex: clip negatives then renormalize
            w = np.clip(w, 0, None)
            w_sum = w.sum()
            if w_sum == 0:
                w = np.ones(n_assets) / n_assets
            else:
                w /= w_sum

            val = objective_fn(w)
            if val < best_val:
                best_val = val
                best_w = w.copy()

        return best_w

    def neg_sharpe(w):
        r, v, s = portfolio_stats(w, mean_returns, cov_matrix, trading_days)
        return -s

    def port_vol_fn(w):
        return portfolio_stats(w, mean_returns, cov_matrix, trading_days)[1]

    init_w = np.ones(n) / n

    ms_weights = _optimize(neg_sharpe, n)
    ms_ret, ms_vol, ms_sharpe = portfolio_stats(ms_weights, mean_returns, cov_matrix, trading_days)

    # ── Optimization: Minimum Volatility ────
    mv_weights = _optimize(port_vol_fn, n)
    mv_ret, mv_vol, mv_sharpe = portfolio_stats(mv_weights, mean_returns, cov_matrix, trading_days)

    # ── Correlation matrix ──────────────────
    corr_matrix = returns.corr()

    return {
        "tickers": available,
        "frontier": frontier,
        "max_sharpe": {
            "label": "Máximo Sharpe Ratio",
            "return": round(ms_ret * 100, 2),
            "volatility": round(ms_vol * 100, 2),
            "sharpe": round(ms_sharpe, 3),
            "weights": {t: round(float(ms_weights[i]), 4) for i, t in enumerate(available)},
        },
        "min_volatility": {
            "label": "Mínima Volatilidad",
            "return": round(mv_ret * 100, 2),
            "volatility": round(mv_vol * 100, 2),
            "sharpe": round(mv_sharpe, 3),
            "weights": {t: round(float(mv_weights[i]), 4) for i, t in enumerate(available)},
        },
        "correlation": {
            "labels": available,
            "matrix": corr_matrix.round(3).values.tolist(),
        },
        "period": period,
    }


# ─────────────────────────────────────────────
# Single Portfolio Analysis
# ─────────────────────────────────────────────

def analyze_portfolio(holdings: dict, period: str = "1y") -> dict:
    """
    Analyze an existing portfolio.
    holdings: { "AAPL": 0.4, "BTC-USD": 0.3, "SPY": 0.3 }
    Returns performance stats and risk metrics.
    """
    tickers = list(holdings.keys())
    weights = np.array([holdings[t] for t in tickers])
    weights = weights / weights.sum()  # Normalize

    returns = get_returns(tickers, period)
    available = [t for t in tickers if t in returns.columns]
    weights_avail = np.array([holdings[t] for t in available])
    weights_avail = weights_avail / weights_avail.sum()

    mean_returns = returns[available].mean().values
    cov_matrix = returns[available].cov().values

    ret, vol, sharpe = portfolio_stats(weights_avail, mean_returns, cov_matrix)
    sort = sortino_ratio(weights_avail, returns[available])

    # Portfolio cumulative return
    port_returns = returns[available].dot(weights_avail)
    cumulative = (1 + port_returns).cumprod()
    max_dd = _max_drawdown(cumulative)

    return {
        "annual_return": round(ret * 100, 2),
        "annual_volatility": round(vol * 100, 2),
        "sharpe_ratio": round(sharpe, 3),
        "sortino_ratio": round(sort, 3),
        "max_drawdown": round(max_dd * 100, 2),
        "weights": {t: round(float(w), 4) for t, w in zip(available, weights_avail)},
    }


def _max_drawdown(cumulative: pd.Series) -> float:
    """Maximum peak-to-trough drawdown."""
    rolling_max = cumulative.cummax()
    drawdown = (cumulative - rolling_max) / rolling_max
    return float(drawdown.min())
