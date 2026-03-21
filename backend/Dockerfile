FROM python:3.11-slim

WORKDIR /app

# Install dependencies required for yfinance and extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose backend port
EXPOSE 8000

# Start server using the dynamic PORT provided by Railway (or 8000 locally)
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
