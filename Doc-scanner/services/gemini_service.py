import json
import re
import os
from google import genai

# Don't initialize at import time — initialize when first used
_client = None

def get_client():
    """Get or create Gemini client lazily."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. "
                "Add it to your .env file."
            )
        _client = genai.Client(api_key=api_key)
    return _client


def clean_json_response(text: str) -> str:
    text = re.sub(r'^```json\s*', '', text.strip())
    text = re.sub(r'^```\s*',     '', text.strip())
    text = re.sub(r'\s*```$',     '', text.strip())
    return text.strip()


def extract_financial_data(text: str) -> dict:
    prompt = f"""Extract financial information from this document.
Return ONLY a JSON object — no markdown, no explanation.

Required fields (use null if not found):
- document_type: "balance_sheet" | "income_statement" | "cash_flow" | "unknown"
- company_name: string
- period: string (e.g. "2023" or "Jan-Dec 2023")
- total_assets: number
- total_liabilities: number
- current_assets: number
- current_liabilities: number
- equity: number
- retained_earnings: number
- revenue: number
- net_profit: number
- operating_profit: number
- ebit: number
- gross_profit: number
- tax_paid: number
- depreciation: number
- cash_and_equivalents: number
- operating_cash_flow: number
- sales: number

Document text:
{text}

Return ONLY the JSON object:"""

    try:
        client = get_client()
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        cleaned   = clean_json_response(response.text)
        extracted = json.loads(cleaned)
        return {"success": True, "data": extracted, "raw_text_preview": text[:200]}

    except json.JSONDecodeError as e:
        return {"success": False, "error": "Failed to parse Gemini response", "details": str(e)}
    except Exception as e:
        return {"success": False, "error": "Gemini API call failed", "details": str(e)}