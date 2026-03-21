"""
Portfolio Router
/api/portfolio/optimize     - Markowitz efficient frontier
/api/portfolio/analyze      - Analyze existing portfolio
/api/portfolio/correlation  - Correlation matrix
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.portfolio import efficient_frontier, analyze_portfolio

router = APIRouter()


class OptimizeRequest(BaseModel):
    tickers: list[str]
    period: str = "2y"
    n_portfolios: int = 300


class AnalyzeRequest(BaseModel):
    holdings: dict[str, float]  # {"AAPL": 0.4, "SPY": 0.3, ...}
    period: str = "1y"


@router.post("/optimize")
async def optimize_portfolio(req: OptimizeRequest):
    """
    Compute the efficient frontier using Markowitz MPT.
    Returns max Sharpe portfolio, min volatility portfolio,
    random portfolios for frontier visualization, and correlation matrix.
    """
    if len(req.tickers) < 2:
        raise HTTPException(400, "Se necesitan al menos 2 activos.")
    if len(req.tickers) > 15:
        raise HTTPException(400, "Máximo 15 activos soportados.")

    tickers = [t.upper().strip() for t in req.tickers]

    try:
        return efficient_frontier(tickers, n_portfolios=req.n_portfolios, period=req.period)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Analyze an existing portfolio: Sharpe, Sortino, drawdown, annual return.
    """
    weights_sum = sum(req.holdings.values())
    if abs(weights_sum - 1.0) > 0.05:
        raise HTTPException(400, f"Los pesos deben sumar ~1.0 (actual: {weights_sum:.2f})")

    try:
        return analyze_portfolio(req.holdings, period=req.period)
    except Exception as e:
        raise HTTPException(500, detail=str(e))
