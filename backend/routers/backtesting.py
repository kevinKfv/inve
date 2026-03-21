"""
Backtesting Router
/api/backtest/run   - Run a strategy backtest
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.market_data import get_ohlcv
from services.backtesting import run_backtest

router = APIRouter()


class BacktestRequest(BaseModel):
    ticker: str
    strategy: str = "sma_crossover"   # sma_crossover | rsi_mean_reversion
    params: dict = {}
    period: str = "2y"
    interval: str = "1d"
    initial_capital: float = 10_000


@router.post("/run")
async def run_backtest_endpoint(req: BacktestRequest):
    """
    Run a backtesting simulation on historical data.
    Returns metrics (Sharpe, max drawdown, win rate) and equity curve.
    """
    valid_strategies = ["sma_crossover", "rsi_mean_reversion"]
    if req.strategy not in valid_strategies:
        raise HTTPException(400, f"Invalid strategy. Use: {valid_strategies}")

    try:
        df = get_ohlcv(req.ticker.upper(), period=req.period, interval=req.interval)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))

    try:
        result = run_backtest(
            df,
            strategy=req.strategy,
            params=req.params,
            initial_capital=req.initial_capital,
        )
        return {"ticker": req.ticker.upper(), **result}
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=str(e))
