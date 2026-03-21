import yfinance as yf
import time

tickers = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AVGO",
    "JPM", "V", "UNH", "XOM", "LLY", "JNJ", "WMT", "MA", "PG",
    "HD", "ORCL", "BAC", "MRK", "ABBV", "CVX", "KO", "PEP",
    "SPY", "QQQ", "IWM", "VTI", "VOO", "GLD", "TLT", "DIA",
    "XLK", "XLF", "XLE", "XLV", "ARKK", "SOXX",
    "BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD",
    "ADA-USD", "AVAX-USD", "DOT-USD", "MATIC-USD", "LINK-USD",
]
t0 = time.time()
try:
    data = yf.download(tickers, period="3mo", interval="1d", progress=False, auto_adjust=True, threads=True)
    print(f"yf.download took: {time.time() - t0:.2f}s")
except Exception as e:
    print(f"Error dl: {e}")

t1 = time.time()
try:
    ts = yf.Tickers(" ".join(tickers))
    for t in tickers[:5]:
        _ = ts.tickers[t].info
    print(f"yf.Tickers info (first 5) took: {time.time() - t1:.2f}s")
except Exception as e:
    print(f"Error dict: {e}")
