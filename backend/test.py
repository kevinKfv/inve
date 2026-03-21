import yfinance as yf
import time

tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META"]
print(f"Testing yf.download on {len(tickers)} tickers...")
t0 = time.time()
try:
    data = yf.download(tickers, period="3mo", interval="1d", progress=False, auto_adjust=True, threads=True)
    print(f"Success! Shape: {data.shape}")
except Exception as e:
    print(f"Error: {e}")
print(f"Time taken: {time.time() - t0:.2f}s")
