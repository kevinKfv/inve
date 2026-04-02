"""
Assets Router
All endpoints for individual asset analysis.
/api/asset/{ticker}/info          - Metadata + fundamentals
/api/asset/{ticker}/ohlcv         - Candlestick chart data
/api/asset/{ticker}/indicators    - All technical indicators
/api/asset/{ticker}/score         - Investment Score
/api/asset/{ticker}/risk          - Stop-loss / take-profit
/api/asset/{ticker}/regime        - Market regime
/api/asset/{ticker}/ml            - ML BUY/HOLD/SELL signal
/api/asset/watchlist              - Bulk price fetch
"""

from fastapi import APIRouter, HTTPException, Query
from services import market_data, indicators, scoring, risk as risk_svc, regime as regime_svc, ml_model

router = APIRouter()

VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}
VALID_INTERVALS = {"1m", "5m", "15m", "30m", "1h", "1d", "1wk"}


def _get_df_or_error(ticker: str, period: str = "6mo", interval: str = "1d"):
    try:
        return market_data.get_ohlcv(ticker, period=period, interval=interval)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/watchlist")
async def get_watchlist(tickers: str = Query(
    default="AAPL,MSFT,GOOGL,AMZN,SPY,BTC-USD,ETH-USD,QQQ",
    description="Comma-separated ticker list"
)):
    """
    Bulk fetch current prices and daily change for a watchlist.
    """
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if len(ticker_list) > 20:
        raise HTTPException(400, "Maximum 20 tickers per request.")
    return market_data.get_multiple_prices(ticker_list)


@router.get("/{ticker}/info")
async def get_asset_info(ticker: str):
    """
    Fetch asset metadata and fundamentals.
    """
    try:
        return market_data.get_ticker_info(ticker)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))


@router.get("/{ticker}/ohlcv")
async def get_ohlcv(
    ticker: str,
    period: str = Query("6mo", description="Period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
    interval: str = Query("1d", description="Interval: 1d, 1h, 15m, etc."),
):
    """
    Fetch OHLCV candlestick data for charting.
    Returns an array of {time, open, high, low, close, volume}.
    """
    if period not in VALID_PERIODS:
        raise HTTPException(400, f"Invalid period. Use one of: {VALID_PERIODS}")
    df = _get_df_or_error(ticker, period, interval)
    return {
        "ticker": ticker.upper(),
        "period": period,
        "interval": interval,
        "candles": market_data.ohlcv_to_json(df),
        "count": len(df),
    }


@router.get("/{ticker}/indicators")
async def get_indicators(
    ticker: str,
    period: str = Query("1y"),
    interval: str = Query("1d"),
):
    """
    Compute all technical indicators and return latest values + signals.
    """
    df = _get_df_or_error(ticker, period, interval)
    try:
        snapshot = indicators.get_indicators_snapshot(df)
        return {"ticker": ticker.upper(), **snapshot}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{ticker}/score")
async def get_score(ticker: str, period: str = Query("1y")):
    """
    Compute Investment Score (0-100) with component breakdown.
    """
    df = _get_df_or_error(ticker, period)
    try:
        info = market_data.get_ticker_info(ticker)
        score = scoring.compute_investment_score(df, info)
        return {"ticker": ticker.upper(), **score}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{ticker}/risk")
async def get_risk(
    ticker: str,
    period: str = Query("6mo"),
    risk_pct: float = Query(1.0, ge=0.1, le=5.0, description="% of capital to risk per trade"),
):
    """
    Calculate stop-loss, take-profit, and risk/reward levels.
    """
    df = _get_df_or_error(ticker, period)
    try:
        return {"ticker": ticker.upper(), **risk_svc.compute_risk_levels(df, risk_pct=risk_pct)}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{ticker}/regime")
async def get_regime(ticker: str, period: str = Query("1y")):
    """
    Detect market regime: bull / bear / sideways.
    """
    df = _get_df_or_error(ticker, period)
    try:
        return {"ticker": ticker.upper(), **regime_svc.detect_regime(df)}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{ticker}/ml")
async def get_ml_signal(ticker: str, period: str = Query("2y")):
    """
    Run ML classifier and return BUY/HOLD/SELL signal with confidence.
    Training is done on the fly from historical data.
    ⚠️ Educational only — not financial advice.
    """
    df = _get_df_or_error(ticker, period)
    try:
        return {"ticker": ticker.upper(), **ml_model.train_and_predict(df)}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{ticker}/full")
async def get_full_analysis(ticker: str, period: str = Query("1y")):
    """
    Full analysis endpoint: info + indicators + score + risk + regime in one call.
    Use this for the asset detail page to minimize requests.
    """
    df = _get_df_or_error(ticker, period)
    df_6m = _get_df_or_error(ticker, "6mo")

    try:
        info = market_data.get_ticker_info(ticker)
        indic = indicators.get_indicators_snapshot(df)
        score = scoring.compute_investment_score(df, info)
        risk_data = risk_svc.compute_risk_levels(df_6m)
        reg = regime_svc.detect_regime(df)

        # Evaluate pending alerts for this ticker
        from services.alerts import evaluate_alerts
        evaluate_alerts(ticker, df, info.get("price", 0))

        return {
            "ticker": ticker.upper(),
            "info": info,
            "indicators": indic,
            "score": score,
            "risk": risk_data,
            "regime": reg,
            "disclaimer": "Análisis educativo. No constituye asesoramiento financiero.",
        }
    except Exception as e:
        raise HTTPException(500, detail=str(e))
@router.get("/{ticker}/price-on-date")
async def get_price_on_date(ticker: str, date: str = Query(..., description="Date in YYYY-MM-DD format")):
    """
    Fetch the closing price of a ticker on a specific date (or nearest trading day before it).
    Useful for Paper Trading simulator to set historical entry prices.
    """
    try:
        import yfinance as yf
        from datetime import datetime, timedelta
        target = datetime.strptime(date, "%Y-%m-%d")
        # Fetch a window around the target date
        start = (target - timedelta(days=5)).strftime("%Y-%m-%d")
        end = (target + timedelta(days=1)).strftime("%Y-%m-%d")
        df = yf.Ticker(ticker).history(start=start, end=end, auto_adjust=True)
        if df.empty:
            raise HTTPException(404, f"No hay datos de precio para {ticker} cerca de {date}")
        # Get the last available row at or before requested date
        df.index = df.index.tz_localize(None) if df.index.tz else df.index
        df = df[df.index <= target]
        if df.empty:
            raise HTTPException(404, f"No hay datos de precio para {ticker} en o antes de {date}")
        row = df.iloc[-1]
        return {
            "ticker": ticker.upper(),
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "price": round(float(row["Close"]), 4),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
