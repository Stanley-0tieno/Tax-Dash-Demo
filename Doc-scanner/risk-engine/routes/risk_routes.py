from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import compute_ratios, generate_risk_flags
from services.model_service import predict_risk

router = APIRouter()


# What the doc-scanner sends to this service
class FinancialData(BaseModel):
    company_name:       Optional[str]   = "Unknown"
    period:             Optional[str]   = "Unknown"
    document_type:      Optional[str]   = "unknown"
    total_assets:       Optional[float] = None
    total_liabilities:  Optional[float] = None
    current_assets:     Optional[float] = None
    current_liabilities: Optional[float] = None
    equity:             Optional[float] = None
    retained_earnings:  Optional[float] = None
    revenue:            Optional[float] = None
    sales:              Optional[float] = None
    net_profit:         Optional[float] = None
    operating_profit:   Optional[float] = None
    ebit:               Optional[float] = None
    gross_profit:       Optional[float] = None
    depreciation:       Optional[float] = None
    operating_cash_flow: Optional[float] = None


@router.post("/analyze-risk")
async def analyze_risk(data: FinancialData):
    """
    Receive financial data from the doc-scanner,
    compute ratios, and return a tax risk assessment.
    """
    try:
        # Step 1 — compute ratios from raw numbers
        ratios = compute_ratios(data.dict())

        # Step 2 — run ML model
        result = predict_risk(ratios)

        # Step 3 — generate human-readable flags
        flags = generate_risk_flags(ratios)

        # Step 4 — recommendation based on risk level
        recommendations = {
            "High":   "Flag for immediate audit review",
            "Medium": "Schedule routine compliance check",
            "Low":    "Low priority — standard monitoring"
        }

        return {
            "company":        data.company_name,
            "period":         data.period,
            "document_type":  data.document_type,
            "risk_level":     result["risk_level"],
            "confidence":     result["confidence"],
            "risk_flags":     flags,
            "ratios":         ratios,
            "recommendation": recommendations.get(result["risk_level"], "Review manually"),
        }

    except Exception as e:
        print(f"Risk analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    return {"service": "Risk Engine", "status": "running"}