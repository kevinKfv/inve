"""
InvestIQ Pro - FastAPI Backend
Main application entry point with CORS, routing, and error handling.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from routers import assets, portfolio, backtesting, alerts, scanner

load_dotenv()

# ─────────────────────────────────────────────
# App initialization
# ─────────────────────────────────────────────
app = FastAPI(
    title="InvestIQ Pro API",
    description="Investment analysis platform — NOT financial advice.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────
# CORS — allow the Next.js frontend
# ─────────────────────────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────
app.include_router(assets.router,      prefix="/api/asset",     tags=["Assets"])
app.include_router(portfolio.router,   prefix="/api/portfolio",  tags=["Portfolio"])
app.include_router(backtesting.router, prefix="/api/backtest",   tags=["Backtesting"])
app.include_router(alerts.router,      prefix="/api/alerts",     tags=["Alerts"])
app.include_router(scanner.router,                              tags=["Scanner"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "InvestIQ Pro API",
        "version": "1.0.0",
        "disclaimer": "For educational purposes only. Not financial advice.",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}



