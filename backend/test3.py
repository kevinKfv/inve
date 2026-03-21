import yfinance as yf
import time

tickers = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AVGO",
    "JPM", "V", "UNH", "XOM", "LLY", "JNJ", "WMT", "MA", "PG",
    "HD", "ORCL", "BAC", "MRK", "ABBV", "CVX", "KO", "PEP",
    "SPY", "QQQ", "IWM", "VTI", "VOO", "GLD", "TLT", "DIA",
    "XLK", "XLF", "XLE", "XLV", "ARKK", "SOXX",
    "BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD",
]
t1 = time.time()
try:
    ts = yf.Tickers(" ".join(tickers))
    for t in tickers:
        _ = ts.tickers[t].fast_info
    print(f"yf.Tickers fast_info (all) took: {time.time() - t1:.2f}s")
except Exception as e:
    print(f"Error dict: {e}")
