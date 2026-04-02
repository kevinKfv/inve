"""
Alerts Service
In-memory alert management system.
Stores conditions and evaluates them against latest indicator values.
"""

import uuid
import threading
import requests
import os
from datetime import datetime
from typing import Optional
from services.indicators import compute_rsi, compute_macd, _last_valid

# In-memory store (resets on server restart)
# In production, replace with Redis or a database
_alerts: dict = {}


def create_alert(ticker: str, condition: str, threshold: float,
                 description: str = "", telegram_user: str = "",
                 whatsapp_phone: str = "", whatsapp_apikey: str = "") -> dict:
    """
    Create a new price/indicator alert.
    condition: "rsi_below" | "rsi_above" | "price_below" | "price_above" | "macd_cross_up" | "macd_cross_down"
    """
    alert_id = str(uuid.uuid4())[:8]
    alert = {
        "id": alert_id,
        "ticker": ticker.upper(),
        "condition": condition,
        "threshold": threshold,
        "description": description or _default_description(condition, ticker, threshold),
        "telegram_user": telegram_user,
        "whatsapp_phone": whatsapp_phone,
        "whatsapp_apikey": whatsapp_apikey,
        "created_at": datetime.utcnow().isoformat(),
        "triggered": False,
        "triggered_at": None,
        "active": True,
    }
    _alerts[alert_id] = alert
    return alert


def get_alerts() -> list:
    return list(_alerts.values())


def delete_alert(alert_id: str) -> bool:
    if alert_id in _alerts:
        del _alerts[alert_id]
        return True
    return False


def evaluate_alerts(ticker: str, df, current_price: float) -> list:
    """
    Check all active alerts for the given ticker and mark triggered ones.
    """
    triggered = []
    rsi_val = _last_valid(compute_rsi(df))
    macd_d = compute_macd(df)
    macd_hist = _last_valid(macd_d["histogram"])

    for alert_id, alert in _alerts.items():
        if not alert["active"] or alert["ticker"] != ticker.upper():
            continue

        cond = alert["condition"]
        thr = alert["threshold"]
        fired = False
        triggered_val = None

        if cond == "rsi_below" and rsi_val is not None and rsi_val < thr:
            fired = True
            triggered_val = f"RSI Actual: {rsi_val:.2f}"
        elif cond == "rsi_above" and rsi_val is not None and rsi_val > thr:
            fired = True
            triggered_val = f"RSI Actual: {rsi_val:.2f}"
        elif cond == "price_below" and current_price < thr:
            fired = True
            triggered_val = f"Precio Actual: ${current_price:.2f}"
        elif cond == "price_above" and current_price > thr:
            fired = True
            triggered_val = f"Precio Actual: ${current_price:.2f}"
        elif cond == "macd_cross_up" and macd_hist is not None and macd_hist > 0:
            fired = True
            triggered_val = f"MACD Histograma: {macd_hist:.4f}"
        elif cond == "macd_cross_down" and macd_hist is not None and macd_hist < 0:
            fired = True
            triggered_val = f"MACD Histograma: {macd_hist:.4f}"

        if fired and not alert["triggered"]:
            alert["triggered"] = True
            alert["triggered_at"] = datetime.utcnow().isoformat()
            if triggered_val:
                alert["triggered_value"] = triggered_val
            triggered.append(alert)
            threading.Thread(target=_send_notifications, args=(alert,)).start()

    return triggered


def _default_description(condition: str, ticker: str, threshold: float) -> str:
    descriptions = {
        "rsi_below": f"{ticker} RSI cae por debajo de {threshold}",
        "rsi_above": f"{ticker} RSI sube por encima de {threshold}",
        "price_below": f"{ticker} precio cae por debajo de {threshold}",
        "price_above": f"{ticker} precio sube por encima de {threshold}",
        "macd_cross_up": f"{ticker} MACD cruza al alza",
        "macd_cross_down": f"{ticker} MACD cruza a la baja",
    }
    return descriptions.get(condition, f"Alerta para {ticker}")

def _send_notifications(alert: dict):
    msg = alert.get("description", "Alerta disparada")
    if "triggered_value" in alert:
        msg += f"\n👉 {alert['triggered_value']}"

    if alert.get("telegram_user"):
        chat_id = alert["telegram_user"].replace("@", "").strip()
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if chat_id and bot_token:
            try:
                requests.get(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    params={"chat_id": chat_id, "text": msg},
                    timeout=5
                )
            except Exception:
                pass
    
    if alert.get("whatsapp_phone") and alert.get("whatsapp_apikey"):
        phone = alert["whatsapp_phone"]
        apikey = alert["whatsapp_apikey"]
        try:
            requests.get(
                "https://api.callmebot.com/whatsapp.php",
                params={"phone": phone, "text": msg, "apikey": apikey},
                timeout=5
            )
        except Exception:
            pass
