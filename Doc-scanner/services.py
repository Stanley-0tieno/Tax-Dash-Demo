import json
import re
import os
from io import BytesIO
from google import genai
import fitz  # PyMuPDF

# Optional: For OCR on scanned documents
try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# Initialize Gemini client
client_genai = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY", "AIzaSyDI02MGCVXW3d1iLPwuw_S_2B4BBoTBOow")
)


def extract_text_from_pdf(pdf_bytes: bytes, use_ocr: bool = False) -> str:
    """
    Extract text from PDF using PyMuPDF (replaces LLMWhisperer).
    
    Args:
        pdf_bytes: PDF file as bytes
        use_ocr: If True, use OCR for pages with little/no text (requires pytesseract)
    
    Returns:
        Extracted text as string
        
    Raises:
        RuntimeError: If PDF processing fails
    """
    try:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text()
            
            # Optional OCR fallback for scanned documents
            if use_ocr and OCR_AVAILABLE and len(page_text.strip()) < 50:
                try:
                    # Render page as image with 2x scaling for better OCR
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    page_text = pytesseract.image_to_string(img)
                except Exception as ocr_error:
                    # If OCR fails, use whatever text we got
                    print(f"OCR failed on page {page_num + 1}: {ocr_error}")
            
            text += page_text + "\n"
        
        pdf_document.close()
        
        if not text or len(text.strip()) < 10:
            raise RuntimeError("No text extracted from PDF. PDF might be empty, corrupted, or require OCR.")
        
        return text.strip()
        
    except Exception as e:
        raise RuntimeError(f"PDF text extraction failed: {str(e)}")


def clean_json_response(text: str) -> str:
    """
    Extract JSON from Gemini's response, removing markdown code blocks.
    
    Handles:
    - ```json ... ```
    - ``` ... ```
    - Raw JSON
    """
    # Remove markdown code blocks
    text = re.sub(r'^```json\s*', '', text.strip())
    text = re.sub(r'^```\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text.strip())
    
    return text.strip()


def extract_from_pdf(pdf_bytes: bytes, use_ocr: bool = False) -> dict:
    """
    Extract and structure information from PDF.
    
    Step 1: Extract raw text using PyMuPDF (LOCAL - no API costs!)
    Step 2: Use Gemini to structure it as JSON
    
    Args:
        pdf_bytes: PDF file as bytes
        use_ocr: Enable OCR for scanned documents (requires pytesseract)
    
    Returns:
        Dictionary with extraction results:
        {
            "success": bool,
            "data": dict (if success),
            "error": str (if failed),
            "raw_text_preview": str (first 200 chars)
        }
    """
    try:
        # Extract text locally - NO MORE LLMWHISPERER API COSTS!
        text = extract_text_from_pdf(pdf_bytes, use_ocr=use_ocr)
        
        # Improved prompt for cleaner JSON output
        prompt = f"""Extract information from this document and return ONLY a JSON object (no markdown, no explanation).

Required fields:
- invoice_number: string (or null if not found)
- date: string in format "DD MMM YYYY" (or null)
- vendor: string (or null)
- total_amount: string (or null)
- currency: string (3-letter code like USD, EUR, or null)

Document text:
{text}

Return ONLY the JSON object, nothing else:"""

        # Call Gemini for structured extraction
        response = client_genai.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        
        # Clean and parse response
        cleaned_text = clean_json_response(response.text)
        
        try:
            extracted = json.loads(cleaned_text)
            return {
                "success": True,
                "data": extracted,
                "raw_text_preview": text[:200]  # First 200 chars for reference
            }
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return structured error
            return {
                "success": False,
                "error": "Failed to parse JSON from Gemini",
                "gemini_response": cleaned_text,
                "parse_error": str(e),
                "raw_text_preview": text[:200]
            }
    
    except RuntimeError as e:
        return {
            "success": False,
            "error": "PDF processing failed",
            "details": str(e)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": "Unexpected error",
            "details": str(e),
            "type": type(e).__name__
        }


# Example usage
if __name__ == "__main__":
    # Example: Read and process a PDF file
    try:
        with open("sample_invoice.pdf", "rb") as f:
            pdf_bytes = f.read()
        
        # Process without OCR (faster)
        result = extract_from_pdf(pdf_bytes, use_ocr=False)
        
        # Or process with OCR (for scanned documents)
        # result = extract_from_pdf(pdf_bytes, use_ocr=True)
        
        print(json.dumps(result, indent=2))
        
    except FileNotFoundError:
        print("Error: sample_invoice.pdf not found")
    except Exception as e:
        print(f"Error: {e}")