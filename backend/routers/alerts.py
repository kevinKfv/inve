"""
Alerts Router
/api/alerts/          - GET all alerts
/api/alerts/create    - POST create alert
/api/alerts/{id}      - DELETE alert
/api/alerts/check/{ticker} - GET check ticker alerts
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.alerts import create_alert, get_alerts, delete_alert, evaluate_alerts
from services.market_data import get_ticker_info, get_ohlcv

router = APIRouter()

VALID_CONDITIONS = [
    "rsi_below", "rsi_above",
    "price_below", "price_above",
    "macd_cross_up", "macd_cross_down",
]


class AlertRequest(BaseModel):
    ticker: str
    condition: str
    threshold: float
    description: str = ""
    telegram_user: str = ""
    whatsapp_phone: str = ""
    whatsapp_apikey: str = ""


@router.get("/")
async def list_alerts():
    return {"alerts": get_alerts()}


@router.post("/create")
async def create(req: AlertRequest):
    if req.condition not in VALID_CONDITIONS:
        raise HTTPException(400, f"Invalid condition. Use: {VALID_CONDITIONS}")
    alert = create_alert(
        ticker=req.ticker,
        condition=req.condition,
        threshold=req.threshold,
        description=req.description,
        telegram_user=req.telegram_user,
        whatsapp_phone=req.whatsapp_phone,
        whatsapp_apikey=req.whatsapp_apikey,
    )
    return alert


@router.delete("/{alert_id}")
async def remove_alert(alert_id: str):
    if not delete_alert(alert_id):
        raise HTTPException(404, "Alert not found.")
    return {"deleted": alert_id}


@router.get("/check/{ticker}")
async def check_alerts(ticker: str):
    """Check if any active alerts for this ticker have been triggered."""
    try:
        info = get_ticker_info(ticker)
        df = get_ohlcv(ticker, period="3mo")
        triggered = evaluate_alerts(ticker, df, current_price=info.get("price", 0))
        return {"ticker": ticker.upper(), "triggered": triggered, "count": len(triggered)}
    except Exception as e:
        raise HTTPException(500, detail=str(e))
