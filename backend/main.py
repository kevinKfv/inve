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

from fastapi.responses import JSONResponse
import math

def clean_nans(obj):
    if isinstance(obj, float):
        return None if math.isnan(obj) or math.isinf(obj) else obj
    elif isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nans(i) for i in obj]
    return obj

class SafeJSONResponse(JSONResponse):
    def render(self, content: any) -> bytes:
        return super().render(clean_nans(content))

# ─────────────────────────────────────────────
# App initialization
# ─────────────────────────────────────────────
app = FastAPI(
    title="InvestIQ Pro API",
    description="Investment analysis platform — NOT financial advice.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    default_response_class=SafeJSONResponse,
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



