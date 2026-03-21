"""
Risk Management Service
Provides stop-loss, take-profit, and risk/reward calculations.
Based on ATR (Average True Range) — the industry standard for dynamic SL placement.
"""

import numpy as np
import pandas as pd
from services.indicators import compute_atr, compute_support_resistance, _last_valid


def compute_risk_levels(df: pd.DataFrame, risk_pct: float = 1.0) -> dict:
    """
    Calculate stop-loss, take-profit, and risk/reward ratio.

    Two methods:
    1. ATR-based (dynamic): SL = price - 1.5 * ATR
    2. Support/Resistance-based: SL just below nearest support

    risk_pct: percentage of capital to risk (used for position sizing)
    """
    current_price = float(df["close"].iloc[-1])
    atr = _last_valid(compute_atr(df, window=14))
    sr = compute_support_resistance(df)

    result = {"current_price": round(current_price, 4)}

    # ── ATR-based Stop Loss ──────────────────
    if atr:
        atr_sl_1x = round(current_price - 1.0 * atr, 4)   # Conservative
        atr_sl_15x = round(current_price - 1.5 * atr, 4)  # Standard
        atr_sl_2x = round(current_price - 2.0 * atr, 4)   # Aggressive

        atr_tp_2r = round(current_price + 2.0 * (current_price - atr_sl_15x), 4)  # 2R target
        atr_tp_3r = round(current_price + 3.0 * (current_price - atr_sl_15x), 4)  # 3R target

        risk_15x = current_price - atr_sl_15x
        rr_2r = round((atr_tp_2r - current_price) / risk_15x, 2) if risk_15x > 0 else 0
        rr_3r = round((atr_tp_3r - current_price) / risk_15x, 2) if risk_15x > 0 else 0

        result["atr_method"] = {
            "atr_value": round(atr, 4),
            "atr_pct": round(atr / current_price * 100, 2),
            "stop_loss": {
                "conservative_1x": {"price": atr_sl_1x, "pct": round((atr_sl_1x - current_price) / current_price * 100, 2)},
                "standard_1_5x":   {"price": atr_sl_15x, "pct": round((atr_sl_15x - current_price) / current_price * 100, 2)},
                "aggressive_2x":   {"price": atr_sl_2x, "pct": round((atr_sl_2x - current_price) / current_price * 100, 2)},
            },
            "take_profit": {
                "target_2R": {"price": atr_tp_2r, "pct": round((atr_tp_2r - current_price) / current_price * 100, 2), "rr_ratio": rr_2r},
                "target_3R": {"price": atr_tp_3r, "pct": round((atr_tp_3r - current_price) / current_price * 100, 2), "rr_ratio": rr_3r},
            },
            "recommended": {
                "stop_loss": atr_sl_15x,
                "take_profit": atr_tp_2r,
                "rr_ratio": rr_2r,
                "explanation": f"Usando ATR 1.5x como SL ({round((atr_sl_15x/current_price-1)*100,2)}% de riesgo) y target 2R.",
            },
        }

    # ── Support/Resistance-based SL ──────────
    supports = sr.get("support", [])
    resistances = sr.get("resistance", [])

    if supports:
        nearest_support = supports[0]
        sl_sr = round(nearest_support * 0.995, 4)  # Slightly below support
        risk_sr = current_price - sl_sr

        if resistances:
            nearest_resistance = resistances[0]
            reward_sr = nearest_resistance - current_price
            rr_sr = round(reward_sr / risk_sr, 2) if risk_sr > 0 else 0
        else:
            nearest_resistance = round(current_price * 1.10, 4)
            rr_sr = 0

        result["support_resistance_method"] = {
            "nearest_support": nearest_support,
            "nearest_resistance": nearest_resistance,
            "stop_loss": {
                "price": sl_sr,
                "pct": round((sl_sr - current_price) / current_price * 100, 2),
            },
            "take_profit": {
                "price": nearest_resistance,
                "pct": round((nearest_resistance - current_price) / current_price * 100, 2),
                "rr_ratio": rr_sr,
            },
            "explanation": f"SL justo debajo del soporte en {nearest_support}, TP en resistencia {nearest_resistance}.",
        }

    # ── Position Sizing ──────────────────────
    # How many units to buy given a capital amount and risk %
    if atr:
        sl_price = atr_sl_15x  # Use standard ATR SL
        risk_per_unit = current_price - sl_price
        if risk_per_unit > 0:
            # Example: $10,000 portfolio, risk_pct% of capital
            example_capital = 10_000
            max_risk_dollars = example_capital * (risk_pct / 100)
            units = max_risk_dollars / risk_per_unit
            result["position_sizing"] = {
                "example_capital": example_capital,
                "risk_pct": risk_pct,
                "risk_dollars": round(max_risk_dollars, 2),
                "units_to_buy": round(units, 4),
                "position_value": round(units * current_price, 2),
                "explanation": (
                    f"Con $10,000 capital y riesgo del {risk_pct}% = ${max_risk_dollars:.0f} en riesgo. "
                    f"Comprar {units:.4f} unidades @ ${current_price:.4f}."
                ),
            }

    result["levels"] = sr
    return result
