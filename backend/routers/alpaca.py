import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

try:
    api_key = os.getenv("APCA_API_KEY_ID", "")
    secret_key = os.getenv("APCA_API_SECRET_KEY", "")
    if api_key and secret_key:
        trading_client = TradingClient(api_key, secret_key, paper=True)
    else:
        trading_client = None
except Exception:
    trading_client = None


def get_client():
    if not trading_client:
        raise HTTPException(
            status_code=500,
            detail="Alpaca API keys faltantes. Configura APCA_API_KEY_ID y APCA_API_SECRET_KEY en backend/.env"
        )
    return trading_client


@router.get("/account")
def get_account():
    client = get_client()
    try:
        acct = client.get_account()
        return {
            "cash": float(acct.cash),
            "portfolio_value": float(acct.portfolio_value),
            "buying_power": float(acct.buying_power),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/positions")
def get_positions():
    client = get_client()
    try:
        positions = client.get_all_positions()
        res = []
        for p in positions:
            res.append({
                "id": str(p.asset_id),
                "ticker": p.symbol,
                "entry_price": float(p.avg_entry_price),
                "current_price": float(p.current_price),
                "quantity": float(p.qty),
                "pnl": float(p.unrealized_pl),
                "pnl_pct": float(p.unrealized_plpc) * 100,
            })
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class OrderRequest(BaseModel):
    ticker: str
    quantity: float
    side: str  # "BUY" or "SELL"

@router.post("/orders")
def place_order(order: OrderRequest):
    client = get_client()
    try:
        side_enum = OrderSide.BUY if order.side.upper() == "BUY" else OrderSide.SELL
        req = MarketOrderRequest(
            symbol=order.ticker.upper(),
            qty=order.quantity,
            side=side_enum,
            time_in_force=TimeInForce.GTC
        )
        res = client.submit_order(req)
        return {"status": "success", "order_id": str(res.id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/positions/{ticker}")
def close_position(ticker: str):
    client = get_client()
    try:
        res = client.close_position(ticker.upper())
        return {"status": "success", "closed": ticker}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
