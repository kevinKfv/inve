from fastapi import APIRouter, HTTPException
from services.macro import get_macro_data

router = APIRouter()

@router.get("/")
async def get_macro():
    """
    Fetch major macroeconomic indicators.
    """
    try:
        data = get_macro_data()
        return {"data": data}
    except Exception as e:
        raise HTTPException(500, detail=str(e))
