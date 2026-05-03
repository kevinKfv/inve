import yfinance as yf
import pandas as pd
import numpy as np
from scipy.stats import norm
from typing import Dict, Any, List

def calculate_d1(S, K, T, r, sigma):
    """Calculate d1 for Black-Scholes"""
    if T <= 0 or sigma <= 0:
        return 0.0
    return (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))

def calculate_d2(d1, T, sigma):
    """Calculate d2 for Black-Scholes"""
    if T <= 0 or sigma <= 0:
        return 0.0
    return d1 - sigma * np.sqrt(T)

def calculate_greeks(row: pd.Series, S: float, T: float, r: float = 0.05, is_call: bool = True) -> Dict[str, float]:
    """
    Calculate Greeks using Black-Scholes model.
    S = Current Underlying Price
    K = Strike Price
    T = Time to Expiration in Years
    r = Risk-free Interest Rate (assumed 5% here for simplicity, could be dynamic)
    sigma = Implied Volatility
    """
    K = row.get("strike", 0)
    sigma = row.get("impliedVolatility", 0)
    
    if sigma <= 0 or T <= 0 or K <= 0 or S <= 0:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0}

    d1 = calculate_d1(S, K, T, r, sigma)
    d2 = calculate_d2(d1, T, sigma)
    
    # Normal distribution PDFs and CDFs
    N_d1 = norm.cdf(d1)
    N_minus_d1 = norm.cdf(-d1)
    n_d1 = norm.pdf(d1)
    N_d2 = norm.cdf(d2)
    N_minus_d2 = norm.cdf(-d2)

    # Gamma and Vega are the same for Calls and Puts
    gamma = n_d1 / (S * sigma * np.sqrt(T))
    vega = S * n_d1 * np.sqrt(T) / 100  # Usually divided by 100

    if is_call:
        delta = N_d1
        theta = (- (S * sigma * n_d1) / (2 * np.sqrt(T)) - r * K * np.exp(-r * T) * N_d2) / 365
    else:
        delta = N_d1 - 1
        theta = (- (S * sigma * n_d1) / (2 * np.sqrt(T)) + r * K * np.exp(-r * T) * N_minus_d2) / 365

    return {
        "delta": round(float(delta), 4),
        "gamma": round(float(gamma), 4),
        "theta": round(float(theta), 4),
        "vega": round(float(vega), 4)
    }

def get_options_dates(ticker: str) -> List[str]:
    """Fetch available expiration dates for the given ticker."""
    try:
        t = yf.Ticker(ticker)
        return list(t.options)
    except Exception as e:
        print(f"Error fetching option dates for {ticker}: {e}")
        return []

def get_option_chain(ticker: str, date: str) -> Dict[str, Any]:
    """
    Fetch option chain for a specific date and calculate Greeks.
    """
    try:
        t = yf.Ticker(ticker)
        chain = t.option_chain(date)
        
        # Get current price
        current_price = t.info.get("currentPrice") or t.info.get("previousClose") or 0.0
        
        if not current_price:
            # Fallback
            hist = t.history(period="1d")
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
                
        if current_price == 0.0:
            return {"error": "Could not determine current price of underlying asset."}
            
        # Calculate Time to Expiration (T) in years
        # Simplification: Assume expiration is at end of day, calculate days from now
        exp_date = pd.to_datetime(date).tz_localize(None)
        today = pd.Timestamp.now().normalize().tz_localize(None)
        days_to_exp = (exp_date - today).days
        T = days_to_exp / 365.0
        
        # Risk-free rate (approx 5%)
        r = 0.05
        
        # Process Calls
        calls = chain.calls.to_dict("records")
        processed_calls = []
        for call in calls:
            greeks = calculate_greeks(call, current_price, T, r, is_call=True)
            call.update(greeks)
            # Remove complex/unnecessary fields if any
            if "contractSize" in call: del call["contractSize"]
            if "currency" in call: del call["currency"]
            processed_calls.append(call)
            
        # Process Puts
        puts = chain.puts.to_dict("records")
        processed_puts = []
        for put in puts:
            greeks = calculate_greeks(put, current_price, T, r, is_call=False)
            put.update(greeks)
            if "contractSize" in put: del put["contractSize"]
            if "currency" in put: del put["currency"]
            processed_puts.append(put)
            
        return {
            "ticker": ticker.upper(),
            "expiration_date": date,
            "days_to_expiration": days_to_exp,
            "underlying_price": round(current_price, 2),
            "calls": processed_calls,
            "puts": processed_puts
        }
        
    except Exception as e:
        print(f"Error fetching option chain for {ticker} on {date}: {e}")
        return {"error": str(e)}
