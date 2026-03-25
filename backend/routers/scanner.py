"""
Market Scanner / Recommendations Router
Scans a curated list of assets concurrently and ranks them by Investment Score.
Returns categorized recommendations: BUY / WATCH / AVOID.
Disclaimer: Educational only — not financial advice.
"""

import asyncio
from fastapi import APIRouter, Query
from typing import Optional
import concurrent.futures
from services.market_data import get_ticker_info, preload_scanner_data, get_ohlcv
from services.scoring import compute_investment_score
from services.indicators import get_indicators_snapshot

router = APIRouter(prefix="/api/scanner", tags=["scanner"])

# ── Curated asset universe ──────────────────────────────────────────────────

UNIVERSE = {
    "stocks": [
        "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AVGO",
        "JPM", "V", "UNH", "XOM", "LLY", "JNJ", "WMT", "MA", "PG",
        "HD", "ORCL", "BAC", "MRK", "ABBV", "CVX", "KO", "PEP",
    ],
    "etfs": [
        "SPY", "QQQ", "IWM", "VTI", "VOO", "GLD", "TLT", "DIA",
        "XLK", "XLF", "XLE", "XLV", "ARKK", "SOXX",
    ],
    "crypto": [
        "BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD",
        "ADA-USD", "AVAX-USD", "DOT-USD", "MATIC-USD", "LINK-USD",
    ],
}

ALL_ASSETS = UNIVERSE["stocks"] + UNIVERSE["etfs"] + UNIVERSE["crypto"]


def _scan_single(ticker: str) -> Optional[dict]:
    """Fetch indicators + score for one ticker. Returns None on error."""
    try:
        info = get_ticker_info(ticker)
        price = info.get("price", 0)
        if not price:
            return None

        df = get_ohlcv(ticker, period="3mo")
        ind = get_indicators_snapshot(df)
        score = compute_investment_score(df, info)

        rsi = ind.get("rsi", 50)
        signals = ind.get("signals", {})
        dominant = signals.get("dominant_sentiment", "neutral")
        macd = ind.get("macd", {})
        macd_bull = macd.get("histogram", 0) > 0

        # Build rating
        total = score["total"]
        if total >= 68:
            rating = "BUY"
            rating_color = "green"
            rating_emoji = "🚀"
        elif total >= 52:
            rating = "WATCH"
            rating_color = "yellow"
            rating_emoji = "👁️"
        else:
            rating = "AVOID"
            rating_color = "red"
            rating_emoji = "⛔"

        return {
            "ticker": ticker,
            "name": info.get("name", ticker)[:30],
            "asset_type": info.get("asset_type", "stock"),
            "sector": info.get("sector", ""),
            "price": round(price, 4),
            "change_pct": round(info.get("change_pct", 0), 2),
            "score": total,
            "score_label": score["label"],
            "rating": rating,
            "rating_color": rating_color,
            "rating_emoji": rating_emoji,
            "rsi": round(rsi, 1),
            "macd_bullish": macd_bull,
            "dominant_sentiment": dominant,
            "top_reasons": score.get("components", [{}])[0].get("reasons", [])[:2],
            "market_cap": info.get("market_cap"),
            "pe_ratio": info.get("pe_ratio"),
            "volume": info.get("volume"),
        }
    except Exception:
        return None


@router.get("/scan")
def scan_market(
    category: str = Query("all", description="all | stocks | etfs | crypto"),
    limit: int = Query(30, ge=5, le=50),
    min_score: int = Query(0, ge=0, le=100),
):
    """
    Scan the market universe and return ranked recommendations.
    Uses ThreadPoolExecutor for concurrent fetching.
    """
    # Select universe
    if category == "stocks":
        tickers = UNIVERSE["stocks"]
    elif category == "etfs":
        tickers = UNIVERSE["etfs"]
    elif category == "crypto":
        tickers = UNIVERSE["crypto"]
    else:
        tickers = ALL_ASSETS

    # Pre-cache OHLCV & info in bulk
    preload_scanner_data(tickers, period="3mo")

    # Process concurrently using ThreadPoolExecutor to prevent sequential blocking from cache misses
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(_scan_single, t): t for t in tickers}
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            if res and res["score"] >= min_score:
                results.append(res)

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    results = results[:limit]

    # Categorize
    buys  = [r for r in results if r["rating"] == "BUY"]
    watch = [r for r in results if r["rating"] == "WATCH"]
    avoid = [r for r in results if r["rating"] == "AVOID"]

    return {
        "category": category,
        "total_scanned": len(tickers),
        "total_results": len(results),
        "summary": {
            "buys": len(buys),
            "watch": len(watch),
            "avoid": len(avoid),
        },
        "top_picks": buys[:5],       # Top 5 strongest buys
        "all_results": results,
        "disclaimer": (
            "Esta información es solo para fines educativos. "
            "No constituye asesoramiento financiero ni recomendación de inversión. "
            "Siempre realizá tu propia investigación."
        ),
    }


@router.get("/quick/{ticker}")
def quick_rating(ticker: str):
    """Quick rating for a single ticker."""
    result = _scan_single(ticker.upper())
    if not result:
        return {"error": f"No se pudo obtener datos para {ticker}"}
    return result
