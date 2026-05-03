import yfinance as yf
from typing import Dict, Any, List
import concurrent.futures

MACRO_TICKERS = {
    "^GSPC": "S&P 500",
    "^NDX": "Nasdaq 100",
    "^TNX": "10-Year Treasury Yield",
    "^VIX": "CBOE Volatility Index",
    "GC=F": "Gold",
    "CL=F": "Crude Oil",
    "EURUSD=X": "EUR/USD"
}

def _fetch_single_macro(ticker: str, name: str) -> Dict[str, Any]:
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="5d")
        if hist.empty or len(hist) < 2:
            return {"ticker": ticker, "name": name, "error": "No data"}
            
        current = float(hist['Close'].iloc[-1])
        previous = float(hist['Close'].iloc[-2])
        change_pct = ((current - previous) / previous) * 100
        
        return {
            "ticker": ticker,
            "name": name,
            "price": round(current, 4),
            "change_pct": round(change_pct, 2),
            "status": "up" if change_pct >= 0 else "down"
        }
    except Exception as e:
        return {"ticker": ticker, "name": name, "error": str(e)}

def get_macro_data() -> List[Dict[str, Any]]:
    """
    Fetch macro indicators in parallel to speed up the response.
    """
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(MACRO_TICKERS)) as executor:
        futures = {
            executor.submit(_fetch_single_macro, ticker, name): ticker 
            for ticker, name in MACRO_TICKERS.items()
        }
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            
    # Sort to maintain consistent order
    ticker_order = list(MACRO_TICKERS.keys())
    results.sort(key=lambda x: ticker_order.index(x["ticker"]))
    
    return results
