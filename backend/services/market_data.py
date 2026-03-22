"""
Market Data Service
Wraps yfinance to fetch OHLCV data, fundamentals, and real-time quotes.
Uses a simple in-memory cache to avoid hammering the API.
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from functools import lru_cache
import time
from typing import Optional
import os

CACHE_TTL = int(os.getenv("CACHE_TTL", "30"))  # seconds

# Simple TTL cache: { key: (timestamp, data) }
_cache: dict = {}


def _get_cached(key: str):
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None


def _set_cache(key: str, data):
    _cache[key] = (time.time(), data)


# ─────────────────────────────────────────────
# Core data fetchers
# ─────────────────────────────────────────────

def get_ticker_info(ticker: str) -> dict:
    """
    Fetch company/asset metadata and fundamentals from Yahoo Finance.
    Returns a flat dict with all available fields.
    """
    cached = _get_cached(f"info:{ticker}")
    if cached:
        return cached

    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        result = {
            # Identity
            "ticker": ticker.upper(),
            "name": info.get("longName") or info.get("shortName", ticker),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange", "N/A"),
            "asset_type": _detect_asset_type(info),

            # Price
            "price": info.get("currentPrice") or info.get("regularMarketPrice", 0),
            "previous_close": info.get("previousClose") or info.get("regularMarketPreviousClose", 0),
            "open": info.get("open") or info.get("regularMarketOpen", 0),
            "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh", 0),
            "day_low": info.get("dayLow") or info.get("regularMarketDayLow", 0),
            "volume": info.get("volume") or info.get("regularMarketVolume", 0),
            "avg_volume": info.get("averageVolume", 0),
            "market_cap": info.get("marketCap", 0),

            # Fundamentals (stocks only)
            "pe_ratio": info.get("trailingPE", None),
            "forward_pe": info.get("forwardPE", None),
            "eps": info.get("trailingEps", None),
            "revenue": info.get("totalRevenue", None),
            "revenue_growth": info.get("revenueGrowth", None),
            "earnings_growth": info.get("earningsGrowth", None),
            "profit_margins": info.get("profitMargins", None),
            "debt_to_equity": info.get("debtToEquity", None),
            "current_ratio": info.get("currentRatio", None),
            "roe": info.get("returnOnEquity", None),
            "roa": info.get("returnOnAssets", None),
            "beta": info.get("beta", None),
            "52w_high": info.get("fiftyTwoWeekHigh", None),
            "52w_low": info.get("fiftyTwoWeekLow", None),
            "dividend_yield": info.get("dividendYield", None),
            "description": info.get("longBusinessSummary", ""),
        }

        # Compute daily change %
        if result["price"] and result["previous_close"] and result["previous_close"] != 0:
            result["change_pct"] = round(
                (result["price"] - result["previous_close"]) / result["previous_close"] * 100, 2
            )
        else:
            result["change_pct"] = 0.0

        _set_cache(f"info:{ticker}", result)
        return result

    except Exception as e:
        raise ValueError(f"Could not fetch data for {ticker}: {e}")


def get_ohlcv(ticker: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """
    Fetch OHLCV candlestick data.
    period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo
    """
    cache_key = f"ohlcv:{ticker}:{period}:{interval}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    last_exception = None
    for attempt in range(3):
        try:
            t = yf.Ticker(ticker)
            df = t.history(period=period, interval=interval, auto_adjust=True)
            if not df.empty:
                df.index = pd.to_datetime(df.index)
                df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
                df.columns = ["open", "high", "low", "close", "volume"]
                df.dropna(inplace=True)
                _set_cache(cache_key, df)
                return df
            break
        except Exception as e:
            last_exception = e
            time.sleep(0.5)
            
    if last_exception:
        raise ValueError(f"Could not fetch OHLCV for {ticker} after retries: {last_exception}")
    raise ValueError(f"No OHLCV data returned for {ticker}")


def get_multiple_prices(tickers: list[str]) -> dict:
    """
    Fetch latest prices for multiple tickers efficiently (bulk download).
    """
    cache_key = f"bulk:{','.join(sorted(tickers))}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    last_exception = None
    for attempt in range(3):
        try:
            data = yf.download(tickers, period="2d", interval="1d", progress=False, auto_adjust=True)
            if not data.empty:
                break
        except Exception as e:
            last_exception = e
            time.sleep(0.5)
            
    try:
        result = {}
        close = data["Close"]
        
        # In newer yfinance versions, even a single ticker might return a DataFrame
        if isinstance(close, pd.Series):
            close = close.to_frame(name=tickers[0])
            
        for ticker in tickers:
            if ticker in close.columns:
                series = close[ticker].dropna()
                latest = float(series.iloc[-1]) if not series.empty else 0
                prev = float(series.iloc[-2]) if len(series) >= 2 else latest
                change = round((latest - prev) / prev * 100, 2) if prev != 0 else 0
                result[ticker] = {"price": round(latest, 4), "change_pct": change}

        _set_cache(cache_key, result)
        return result

    except Exception as e:
        return {t: {"price": 0, "change_pct": 0, "error": str(e)} for t in tickers}


def _detect_asset_type(info: dict) -> str:
    """Heuristic to classify stock / ETF / crypto."""
    qt = info.get("quoteType", "")
    if qt == "CRYPTOCURRENCY":
        return "crypto"
    if qt == "ETF":
        return "etf"
    return "stock"


def preload_scanner_data(tickers: list[str], period: str = "3mo") -> None:
    """
    Bulk downloads OHLCV data and infos for all tickers to warm up the cache.
    Turns 100 sequential requests into ~2 parallel requests.
    """
    # 1. Bulk download OHLCV
    try:
        data = yf.download(tickers, period=period, interval="1d", progress=False, auto_adjust=True, threads=True)
        if hasattr(data.columns, 'levels'):
            # MultiIndex columns: e.g. Close, AAPL
            for t in tickers:
                if t in data["Close"].columns:
                    df = pd.DataFrame({
                        "open": data["Open"].get(t, pd.Series(dtype=float)),
                        "high": data["High"].get(t, pd.Series(dtype=float)),
                        "low": data["Low"].get(t, pd.Series(dtype=float)),
                        "close": data["Close"].get(t, pd.Series(dtype=float)),
                        "volume": data["Volume"].get(t, pd.Series(dtype=float)) if "Volume" in data else 0,
                    }).dropna()
                    if not df.empty:
                        _set_cache(f"ohlcv:{t}:{period}:1d", df)
        else:
            # Single ticker
            if len(tickers) == 1:
                t = tickers[0]
                df = data.reindex(columns=["Open", "High", "Low", "Close", "Volume"]).dropna()
                df.columns = ["open", "high", "low", "close", "volume"]
                _set_cache(f"ohlcv:{t}:{period}:1d", df)
    except Exception as e:
        print(f"Error bulk downloading OHLCV: {e}")

    # 2. Bulk fetch info: Use fast_info to bypass the 35 second HTTP sequential limit of .info
    try:
        ts = yf.Tickers(" ".join(tickers))
        for t in tickers:
            if not _get_cached(f"info:{t}"):
                try:
                    f_info = ts.tickers[t].fast_info
                    # fast_info only provides basic data. Fundamentals will be treated neutrally by scoring.
                    result = {
                        "ticker": t.upper(),
                        "name": t,  # fast_info lacks name
                        "sector": "N/A",
                        "asset_type": "stock", # simplified
                        "price": f_info.get("lastPrice", 0),
                        "previous_close": f_info.get("previousClose", 0),
                        "change_pct": 0,
                        "market_cap": f_info.get("marketCap", 0),
                        "volume": f_info.get("lastVolume", 0),
                        "pe_ratio": None,
                        "earnings_growth": None,
                        "debt_to_equity": None,
                        "profit_margins": None,
                    }
                    if result["price"] and result["previous_close"]:
                        result["change_pct"] = round((result["price"] - result["previous_close"]) / result["previous_close"] * 100, 2)
                    _set_cache(f"info:{t}", result)
                except Exception:
                    pass
    except Exception as e:
        print(f"Error bulk fetching info: {e}")


def ohlcv_to_json(df: pd.DataFrame) -> list[dict]:
    """Convert OHLCV dataframe to JSON-serializable list for frontend charts."""
    records = []
    for ts, row in df.iterrows():
        records.append({
            "time": ts.strftime('%Y-%m-%d'),
            "open": round(float(row["open"]), 4),
            "high": round(float(row["high"]), 4),
            "low": round(float(row["low"]), 4),
            "close": round(float(row["close"]), 4),
            "volume": int(row["volume"]),
        })
    return records
