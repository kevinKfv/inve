# InvestIQ Pro

> **⚠️ Aviso Legal:** Esta plataforma es únicamente para fines **educativos**. No constituye asesoramiento financiero ni recomendación de inversión.

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 + TailwindCSS + lightweight-charts |
| Backend | FastAPI + Python 3.10+ |
| Datos | yfinance (Yahoo Finance, gratuito) |
| ML | scikit-learn RandomForestClassifier |
| Optimización | scipy + numpy (Markowitz MPT) |

## Funcionalidades

- 📊 **Dashboard** — Watchlist con precios en tiempo real, top ganadores/perdedores
- 🔍 **Análisis de activos** — RSI, MACD, Bollinger Bands, SMA/EMA, soporte/resistencia
- 🏆 **Investment Score** — Puntuación 0-100 con breakdown por componentes
- 🛡️ **Gestión de riesgo** — Stop-loss ATR, take-profit, risk/reward ratio
- 🌐 **Detección de régimen** — Bull/Bear/Sideways con nivel de confianza
- 💼 **Portfolio Optimizer** — Frontera eficiente de Markowitz, Sharpe, Sortino
- 📉 **Backtesting** — SMA Crossover y RSI Mean Reversion con curva de capital
- 🤖 **ML Signal** — Clasificador BUY/HOLD/SELL con RandomForest
- 🔔 **Alertas** — RSI, precio, MACD crossover
- 🎮 **Paper Trading** — Simulador de portfolio con dinero virtual

## Inicio Rápido

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API disponible en: http://localhost:8000
- Documentación automática: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App disponible en: http://localhost:3000

### O usar el script de inicio (Windows)

```bash
start.bat
```

## Estructura del proyecto

```
inversiones/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── requirements.txt
│   ├── services/
│   │   ├── market_data.py      # yfinance wrapper + caché
│   │   ├── indicators.py       # RSI, MACD, BB, SMA, EMA, ADX...
│   │   ├── scoring.py          # Investment Score 0-100
│   │   ├── portfolio.py        # Markowitz, Sharpe, Sortino
│   │   ├── risk.py             # Stop-loss, take-profit, R/R
│   │   ├── regime.py           # Bull/Bear detection
│   │   ├── ml_model.py         # RandomForest BUY/HOLD/SELL
│   │   ├── backtesting.py      # Strategy backtester
│   │   └── alerts.py           # Alertas en memoria
│   └── routers/
│       ├── assets.py           # /api/asset/{ticker}/*
│       ├── portfolio.py        # /api/portfolio/*
│       ├── backtesting.py      # /api/backtest/*
│       └── alerts.py           # /api/alerts/*
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx                    # Dashboard
        │   ├── asset/[ticker]/page.tsx     # Análisis de activo
        │   ├── portfolio/page.tsx          # Optimizer
        │   ├── backtesting/page.tsx        # Backtesting
        │   ├── alerts/page.tsx             # Alertas
        │   └── paper-trading/page.tsx      # Paper trading
        ├── components/
        │   ├── Navbar.tsx
        │   ├── CandlestickChart.tsx
        │   ├── RSIGauge.tsx
        │   ├── ScoreCard.tsx
        │   └── SignalBadges.tsx
        └── lib/
            └── api.ts                      # API client tipado
```
